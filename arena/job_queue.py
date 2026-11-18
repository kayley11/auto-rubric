"""Durable, bounded background jobs. Records contain references, never credentials.

SQLite leases prevent two workers from claiming the same saved run. A crashed
worker's lease expires; completed item grades are reused by the application.
"""

from __future__ import annotations

import json
import sqlite3

from sqlite_store import connect as connect_store
import threading
import time
import uuid
from pathlib import Path


ACTIVE = {"queued", "running", "retry_wait"}


class RetryJob(Exception):
    """A transient provider failure, already redacted by the application."""


class FailedJob(Exception):
    """A non-retryable operation failure, already redacted."""


class BlockedJob(Exception):
    """A missing connection or permission needs a user decision."""


class JobQueue:
    def __init__(self, path, workers=2, retry_seconds=30, lease_seconds=15):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.workers = max(1, min(int(workers), 4))
        self.retry_seconds = max(0, float(retry_seconds))
        self.lease_seconds = max(2, float(lease_seconds))
        self.handlers = {}
        self.lock = threading.RLock()
        self.wake = threading.Event()
        self.closed = threading.Event()
        self.threads = []
        with self.connect() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.executescript("""
                CREATE TABLE IF NOT EXISTS jobs (
                  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
                  id TEXT UNIQUE NOT NULL, workspace TEXT NOT NULL,
                  run_id TEXT NOT NULL, action TEXT NOT NULL, actor TEXT NOT NULL,
                  metadata TEXT NOT NULL, state TEXT NOT NULL,
                  attempt INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL,
                  ready_at REAL NOT NULL, lease_until REAL, worker TEXT,
                  cancel_requested INTEGER NOT NULL DEFAULT 0,
                  last_error TEXT, created_at REAL NOT NULL, updated_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS actor_turns (
                  workspace TEXT, actor TEXT, last_claim REAL,
                  PRIMARY KEY(workspace,actor)
                );
                CREATE UNIQUE INDEX IF NOT EXISTS one_active_job_per_run
                  ON jobs(workspace, run_id)
                  WHERE state IN ('queued', 'running', 'retry_wait');
            """)

    def connect(self):
        return connect_store(self.path, timeout=10, row_factory=sqlite3.Row)

    def register(self, workspace, handler):
        with self.lock:
            self.handlers[workspace] = handler
        if self.pending(workspace):
            self.start()

    def pending(self, workspace):
        with self.connect() as db:
            return db.execute(
                "SELECT run_id FROM jobs WHERE workspace=? AND state IN "
                "('queued','running','retry_wait') ORDER BY sequence", (workspace,)
            ).fetchall()

    def enqueue(self, workspace, run_id, action, actor, metadata=None, max_attempts=3):
        now = time.time()
        identifier = uuid.uuid4().hex
        try:
            with self.connect() as db:
                db.execute(
                    "INSERT INTO jobs(id,workspace,run_id,action,actor,metadata,state,"
                    "max_attempts,ready_at,created_at,updated_at) VALUES(?,?,?,?,?,?,'queued',?,?,?,?)",
                    (identifier, workspace, run_id, action, actor,
                     json.dumps(metadata or {}), max(1, min(int(max_attempts), 3)), now, now, now),
                )
        except sqlite3.IntegrityError as exc:
            raise ValueError("This saved run already has a queued or running job.") from exc
        self.wake.set()
        self.start()
        return identifier

    def start(self):
        with self.lock:
            self.threads = [t for t in self.threads if t.is_alive()]
            if self.closed.is_set():
                return
            for _ in range(self.workers - len(self.threads)):
                thread = threading.Thread(target=self.work, daemon=True)
                self.threads.append(thread)
                thread.start()

    def latest(self, workspace, run_id):
        with self.connect() as db:
            row = db.execute(
                "SELECT * FROM jobs WHERE workspace=? AND run_id=? ORDER BY sequence DESC LIMIT 1",
                (workspace, run_id),
            ).fetchone()
            if not row:
                return None
            result = dict(row)
            result["metadata"] = json.loads(result["metadata"])
            result["position"] = 0
            if row["state"] in {"queued", "retry_wait"}:
                result["position"] = 1 + db.execute(
                    "SELECT count(*) FROM jobs WHERE state IN ('queued','retry_wait') "
                    "AND (ready_at<? OR (ready_at=? AND sequence<?))",
                    (row["ready_at"], row["ready_at"], row["sequence"]),
                ).fetchone()[0]
            return result

    def states(self, workspace):
        result = {}
        with self.connect() as db:
            for run_id, state in db.execute("SELECT run_id,state FROM jobs WHERE workspace=? ORDER BY sequence DESC",(workspace,)):
                result.setdefault(run_id,state)
        return result

    def cancel(self, workspace, run_id):
        with self.connect() as db:
            db.execute(
                "UPDATE jobs SET cancel_requested=1, state=CASE WHEN state='running' "
                "THEN state ELSE 'cancelled' END, updated_at=? "
                "WHERE workspace=? AND run_id=? AND state IN ('queued','running','retry_wait')",
                (time.time(), workspace, run_id),
            )
        self.wake.set()

    def claim(self, worker):
        now = time.time()
        with self.lock:
            spaces = tuple(self.handlers)
        if not spaces:
            return None
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute(
                "UPDATE jobs SET state=CASE WHEN cancel_requested=1 THEN 'cancelled' "
                "WHEN attempt>=max_attempts THEN 'failed' ELSE 'retry_wait' END, "
                "ready_at=?, worker=NULL, lease_until=NULL, updated_at=?, "
                "last_error='Worker interrupted; saved progress retained.' "
                "WHERE state='running' AND lease_until<?", (now, now, now),
            )
            marks = ",".join("?" for _ in spaces)
            row = db.execute(
                "SELECT jobs.* FROM jobs LEFT JOIN actor_turns turns ON "
                "turns.workspace=jobs.workspace AND turns.actor=jobs.actor "
                "WHERE state IN ('queued','retry_wait') AND ready_at<=? "
                f"AND jobs.workspace IN ({marks}) ORDER BY COALESCE(turns.last_claim,0),ready_at,sequence LIMIT 1", (now, *spaces),
            ).fetchone()
            if not row:
                return None
            db.execute(
                "UPDATE jobs SET state='running',attempt=attempt+1,worker=?,lease_until=?,"
                "updated_at=? WHERE id=?", (worker, now+self.lease_seconds, now, row["id"]),
            )
            db.execute("INSERT INTO actor_turns VALUES(?,?,?) ON CONFLICT(workspace,actor) "
                       "DO UPDATE SET last_claim=excluded.last_claim", (row["workspace"],row["actor"],now))
            result = dict(row)
            result.update(attempt=row["attempt"]+1, worker=worker, state="running")
            result["metadata"] = json.loads(result["metadata"])
            return result

    def heartbeat(self, job, stop):
        while not stop.wait(self.lease_seconds / 3):
            with self.connect() as db:
                db.execute("UPDATE jobs SET lease_until=? WHERE id=? AND worker=? AND state='running'",
                           (time.time()+self.lease_seconds, job["id"], job["worker"]))

    def settle(self, job, state, error=None):
        now = time.time()
        with self.connect() as db:
            current = db.execute("SELECT cancel_requested FROM jobs WHERE id=? AND worker=?",
                                 (job["id"], job["worker"])).fetchone()
            if not current:
                return
            if current[0]:
                state = "cancelled"
            if state == "retry_wait" and job["attempt"] >= job["max_attempts"]:
                state = "failed"
            delay = self.retry_seconds * job["attempt"] if state == "retry_wait" else 0
            db.execute("UPDATE jobs SET state=?,last_error=?,ready_at=?,lease_until=NULL,"
                       "updated_at=? WHERE id=? AND worker=?",
                       (state, error, now+delay, now, job["id"], job["worker"]))
        self.wake.set()

    def work(self):
        worker = uuid.uuid4().hex
        idle = time.monotonic()
        while not self.closed.is_set():
            job = self.claim(worker)
            if not job:
                if time.monotonic()-idle > 3:
                    with self.lock:
                        # Keep retrying jobs alive, including scheduled backoff.
                        if not any(self.pending(space) for space in self.handlers):
                            self.threads.remove(threading.current_thread())
                            return
                self.wake.wait(0.1)
                self.wake.clear()
                continue
            idle = time.monotonic()
            stop = threading.Event()
            lease = threading.Thread(target=self.heartbeat, args=(job, stop), daemon=True)
            lease.start()
            try:
                self.handlers[job["workspace"]](job)
            except RetryJob as exc:
                self.settle(job, "retry_wait", str(exc))
            except BlockedJob as exc:
                self.settle(job, "blocked", str(exc))
            except FailedJob as exc:
                self.settle(job, "failed", str(exc))
            except Exception as exc:
                self.settle(job, "failed", "Background operation failed: " + type(exc).__name__)
            else:
                self.settle(job, "done")
            finally:
                stop.set()
                lease.join(1)

    def close(self):
        self.closed.set()
        self.wake.set()
        for thread in list(self.threads):
            thread.join(2)
