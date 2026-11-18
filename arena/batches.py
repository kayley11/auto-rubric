"""Saved batch manifests; enqueue every cell independently of a browser session."""

from __future__ import annotations

import json
import re

from sqlite_store import connect as connect_store
import threading
import time

from engine import validate_input
from scoring import fingerprint
from workspace_cases import submission_details


class Batches:
    def __init__(self, app):
        self.app = app
        self.path = app.directory / "_batches.sqlite3"
        self.lock = threading.RLock()
        self.closed = threading.Event()
        self.threads = []
        with self.connect() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.execute("CREATE TABLE IF NOT EXISTS batches (id TEXT PRIMARY KEY,owner TEXT,"
                       "manifest TEXT NOT NULL,created REAL NOT NULL)")
            if "cancelled" not in {r[1] for r in db.execute("PRAGMA table_info(batches)")}:
                db.execute("ALTER TABLE batches ADD COLUMN cancelled INTEGER NOT NULL DEFAULT 0")
            db.execute("CREATE TABLE IF NOT EXISTS cells (batch_id TEXT,cell TEXT,run_id TEXT,"
                       "error TEXT,PRIMARY KEY(batch_id,cell))")
            ids = [r[0] for r in db.execute("SELECT DISTINCT batch_id FROM cells WHERE run_id IS NULL AND error IS NULL")]
        for identifier in ids:
            self.launch(identifier)

    def connect(self):
        return connect_store(self.path, timeout=10)

    def create(self, body, actor):
        jobs = body.get("jobs")
        if not isinstance(jobs, list) or not 1<=len(jobs)<=1000:
            raise ValueError("Submit between 1 and 1,000 case–model tasks.")
        prepared, keys = [], set()
        for job in jobs:
            if not isinstance(job, dict) or not isinstance(job.get("input"), dict):
                raise ValueError("Each batch task needs an input object.")
            key = job.get("key")
            if not isinstance(key, str) or not 1<=len(key)<=180 or key in keys:
                raise ValueError("Batch cell IDs must be unique and at most 180 characters.")
            keys.add(key)
            data = validate_input(job["input"])
            for role in ("answer", "judge"):
                data[role+"_connection_id"] = job["input"].get(role+"_connection_id", "")
            submission = submission_details(job["input"].get("case_submission"))
            if submission:
                data["case_submission"] = {**submission, "account_id":actor,
                    **({"contributor_id":actor} if actor != "workspace" else {})}
            run_id = job.get("run_id", "")
            if run_id and (not isinstance(run_id, str) or not re.fullmatch(r"[a-f0-9]{32}",run_id)):
                raise ValueError("Invalid saved run ID in the batch.")
            self.app.connection_bindings(data, {}, actor, "evaluate")
            if not data["answer"]:
                self.app.connection_bindings(data, {}, actor, "generate")
            row_id, model = job.get("row_id", key), job.get("model", data["answer_model"])
            if not isinstance(row_id, str) or len(row_id)>100 or not isinstance(model, str) or len(model)>120:
                raise ValueError("Invalid batch row or model label.")
            prepared.append({"key":key,"input":data,"run_id":run_id,"row_id":row_id,"model":model})
        # Reject accidental credential inclusion rather than altering the case text.
        raw = json.dumps(prepared)
        secrets = [self.app.settings.api_key]
        if self.app.connections:
            secrets += self.app.connections.secrets()
        if any(key and len(key)>=12 and key in raw for key in secrets):
            raise ValueError("A configured credential appears in the batch text. Remove it before importing.")
        attempt = body.get("request_id", "")
        if not isinstance(attempt, str) or (attempt and not re.fullmatch(r"[a-f0-9]{32}", attempt)):
            raise ValueError("Invalid batch request ID.")
        identifier = fingerprint({"owner":actor,"jobs":prepared,"request_id":attempt})[:32]
        with self.connect() as db:
            db.execute("INSERT OR IGNORE INTO batches(id,owner,manifest,created) VALUES(?,?,?,?)",
                       (identifier,actor,json.dumps(prepared),time.time()))
            for job in prepared:
                db.execute("INSERT OR IGNORE INTO cells VALUES(?,?,NULL,NULL)", (identifier,job["key"]))
        self.launch(identifier)
        return self.read(identifier)

    def launch(self, identifier):
        thread = threading.Thread(target=self.submit, args=(identifier,), daemon=True)
        self.threads.append(thread)
        thread.start()

    def submit(self, identifier):
        with self.lock:
            with self.connect() as db:
                owner, encoded = db.execute("SELECT owner,manifest FROM batches WHERE id=?", (identifier,)).fetchone()
                rows = {r[0]:r[1:] for r in db.execute("SELECT cell,run_id,error FROM cells WHERE batch_id=?", (identifier,))}
            for job in json.loads(encoded):
                if self.closed.is_set():
                    return
                with self.connect() as db:
                    cancelled = db.execute("SELECT cancelled FROM batches WHERE id=?", (identifier,)).fetchone()[0]
                if cancelled:
                    return
                if any(rows[job["key"]]):
                    continue
                try:
                    if self.app.member_resolver:
                        member = self.app.member_resolver(owner)
                        if not member or member["role"] not in {"admin","evaluator"}:
                            raise PermissionError("This account no longer has evaluation access.")
                    # Reconcile a crash after saving/enqueueing a run but before
                    # saving the manifest link. Never create a second answer.
                    recovered = None
                    for path in self.app.directory.glob("*.json"):
                        record = json.loads(path.read_text(encoding="utf-8"))
                        link = {"id":identifier,"cell":job["key"]}
                        if record.get("batch") == link or link in record.get("batch_links", []):
                            recovered = record["id"]
                            break
                    if recovered:
                        run_id = recovered
                    else:
                        run_id = job["run_id"]
                        body = {**job["input"], "auto_evaluate":True}
                        if run_id:
                            run = self.app.public_run(run_id)
                            if run["status"] == "complete" or run.get("queue",{}).get("state") in {"queued","running","retry_wait"}:
                                pass
                            else:
                                self.app.start("evaluate" if run["status"]=="answer_ready" else "retry", body, run_id,
                                               actor=owner,batch={"id":identifier,"cell":job["key"]})
                        else:
                            run_id = self.app.start("evaluate" if body["answer"] else "generate", body,
                                actor=owner,batch={"id":identifier,"cell":job["key"]})["id"]
                    with self.connect() as db:
                        db.execute("UPDATE cells SET run_id=? WHERE batch_id=? AND cell=?", (run_id,identifier,job["key"]))
                        cancelled = db.execute("SELECT cancelled FROM batches WHERE id=?", (identifier,)).fetchone()[0]
                    if cancelled:
                        try:
                            self.app.stop_job(run_id, actor=owner)
                        except ValueError:
                            pass
                except (ValueError, PermissionError, FileNotFoundError) as exc:
                    with self.connect() as db:
                        db.execute("UPDATE cells SET error=? WHERE batch_id=? AND cell=?", (str(exc),identifier,job["key"]))
                except Exception as exc:
                    # A corrupt record or unexpected preparation error must not
                    # leave this cell at Preparing forever or block later cells.
                    with self.connect() as db:
                        db.execute("UPDATE cells SET error=? WHERE batch_id=? AND cell=?",
                                   ("Batch preparation failed: "+type(exc).__name__+". Saved output is retained.",identifier,job["key"]))

    def catalogue(self):
        with self.connect() as db:
            return [{"id":r[0],"owner":r[1],"created_at":r[2],"tasks":len(json.loads(r[3])),"cancelled":bool(r[4])}
                    for r in db.execute("SELECT id,owner,created,manifest,cancelled FROM batches ORDER BY created DESC")]

    def cancel(self, identifier, actor, administrator=False):
        with self.connect() as db:
            row = db.execute("SELECT owner FROM batches WHERE id=?", (identifier,)).fetchone()
            if not row:
                raise FileNotFoundError("Saved batch not found.")
            if actor != row[0] and not administrator:
                raise PermissionError("Only the submitting member or an administrator can cancel a batch.")
            db.execute("UPDATE batches SET cancelled=1 WHERE id=?", (identifier,))
            db.execute("UPDATE cells SET error='Cancelled before submission.' WHERE batch_id=? AND run_id IS NULL", (identifier,))
            runs = [r[0] for r in db.execute("SELECT run_id FROM cells WHERE batch_id=? AND run_id IS NOT NULL", (identifier,))]
        for run_id in runs:
            try:
                self.app.stop_job(run_id, actor=actor, administrator=administrator)
            except ValueError:
                pass
        return self.read(identifier)

    def close(self):
        self.closed.set()
        for thread in self.threads:
            thread.join(2)

    def read(self, identifier, include_inputs=False):
        if not re.fullmatch(r"[a-f0-9]{32}", identifier):
            raise ValueError("Invalid saved batch ID.")
        with self.connect() as db:
            batch = db.execute("SELECT owner,created,manifest,cancelled FROM batches WHERE id=?", (identifier,)).fetchone()
            if not batch:
                raise FileNotFoundError("Saved batch not found.")
            rows = db.execute("SELECT cell,run_id,error FROM cells WHERE batch_id=? ORDER BY rowid", (identifier,)).fetchall()
        manifest = json.loads(batch[2])
        by_key = {job["key"]:job for job in manifest}
        cells, active = [], False
        for key, run_id, error in rows:
            run = None
            if run_id:
                saved = self.app.public_run(run_id)
                run = {k:saved.get(k) for k in ("id","status","message","error","input","rubric_version","answer_source","queue","review_id","current_item","safety")}
                run["grades"] = {cid:{k:g[k] for k in ("score","status","reason","explanation","error") if k in g}
                                 for cid,g in saved.get("grades",{}).items()}
                run["rubric"] = {"criteria":[{k:c[k] for k in ("id","name") if k in c} for c in saved["rubric"]["criteria"]]}
                # Batch tables need identities and scores, not another copy of
                # every answer, reference, transport response or hidden source.
                run["input"] = {k:run["input"].get(k) for k in ("answer_model","judge_model","criteria","case_code","case_number","comparison_id","title")}
            state = run["status"] if run else "error" if error else "preparing"
            active |= state in {"preparing","queued","retry_wait","generating","scoring","interviewing"}
            cells.append({"key":key,"row_id":by_key[key]["row_id"],"model":by_key[key]["model"],
                          "run_id":run_id,"status":state,"error":error,"run":run})
        result = {"id":identifier,"owner":batch[0],"created_at":batch[1],"active":active,"cells":cells,
                  "reference_status":"awaiting confirmation", "cancelled":bool(batch[3])}
        if include_inputs:
            result["tasks"] = manifest
        return result
