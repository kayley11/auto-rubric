"""A local-only server: static UI, serial model jobs and JSON files for saved runs."""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import threading
import uuid
from copy import deepcopy
from datetime import UTC, datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from engine import (
    APP_ROOT,
    CRITERIA,
    DEFAULT_TASK,
    PRESETS,
    RUBRIC,
    Provider,
    Settings,
    csv_text,
    plain_text,
    redact,
    run_sync,
    safety_status,
    usage_totals,
    validate_input,
)
from scoring import (
    RESULT_STATUSES,
    VERSIONS,
    fingerprint,
    imported_input,
    rubric_snapshot,
    version_info,
)
from study import ORIGINAL_VERSION
from study import interview as study_interview
from study import output as study_output
from study import summary as study_summary


def now():
    return datetime.now(UTC).isoformat()


class BusyError(ValueError):
    pass


class Application:
    def __init__(self, directory, settings=None, provider=None):
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)
        self.settings = settings or Settings.load()
        self.provider = provider or Provider(self.settings)
        self.lock = threading.RLock()
        self.job_lock = threading.Lock()
        self.stop = threading.Event()
        self.active_id = None
        # A restart must never leave the UI claiming an old request is still running.
        for path in self.directory.glob("*.json"):
            run = json.loads(path.read_text(encoding="utf-8"))
            if run.get("status") in {"generating", "scoring"}:
                run.update(
                    status="interrupted",
                    message="The server restarted. Saved results are retained.",
                )
                self.save(run)

    def path(self, run_id):
        if not re.fullmatch(r"[a-f0-9]{32}", run_id):
            raise ValueError("Invalid run ID.")
        return self.directory / (run_id + ".json")

    def load(self, run_id):
        with self.lock:
            path = self.path(run_id)
            if not path.exists():
                raise FileNotFoundError("Run not found.")
            return json.loads(path.read_text(encoding="utf-8"))

    def save(self, run):
        with self.lock:
            run["updated_at"] = now()
            path = self.path(run["id"])
            temp = path.with_suffix(".tmp")
            temp.write_text(
                json.dumps(redact(run, self.settings.api_key), ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            temp.replace(path)

    def public_run(self, run_id):
        run = self.load(run_id)
        run.setdefault("rubric_version", deepcopy(ORIGINAL_VERSION))
        run["usage"] = usage_totals(run)
        run["safety"] = safety_status(run.get("grades", {}))
        return run

    def list_runs(self):
        with self.lock:
            items = [
                json.loads(p.read_text(encoding="utf-8")) for p in self.directory.glob("*.json")
            ]
        return sorted(
            [
                {k: r.get(k) for k in ("id", "status", "created_at", "updated_at")}
                | {
                    "title": r["input"]["title"],
                    "graded": len(
                        [x for x in r.get("grades", {}).values() if x["status"] in RESULT_STATUSES]
                    ),
                    "total": len(r["input"]["criteria"]),
                    "rubric_version": r.get("rubric_version", ORIGINAL_VERSION),
                }
                for r in items
            ],
            key=lambda x: x["created_at"],
            reverse=True,
        )

    def start(self, action, body, run_id=None):
        if action not in {"generate", "evaluate", "retry"}:
            raise ValueError("Unknown action.")
        if not self.job_lock.acquire(blocking=False):
            raise BusyError("A model job is already running. Let it finish or stop it first.")
        try:
            if action == "retry":
                run = self.load(run_id)
                if not run["input"]["answer"]:
                    action = "generate"
                else:
                    action = "evaluate"
            else:
                data = validate_input(body)
                if action == "evaluate" and not data["answer"]:
                    raise ValueError("Generate or paste an answer before evaluating it.")
                if run_id:
                    run = self.load(run_id)
                    if run.get("grades"):
                        raise ValueError(
                            "This run already has grades. "
                            "Use it as a new case to change its inputs."
                        )
                    # The generated answer can be edited. Its case and task cannot silently change.
                    # New scoring conditions require a separate run, even before any grade.
                    immutable = (
                        "facts",
                        "task",
                        "history",
                        "rules_version",
                        "interview",
                        "requirements",
                        "interview_source",
                    )
                    previous = validate_input(run["input"])
                    if any(data[k] != previous[k] for k in immutable):
                        raise ValueError(
                            "The case, scoring version or interview evidence has changed. "
                            "Start a new run to keep the generation record accurate."
                        )
                    run["input"] = data
                    if run.get("generated_answer") != data["answer"]:
                        run["answer_source"] = "generated_then_edited"
                else:
                    snapshot = rubric_snapshot(RUBRIC, data["rules_version"])
                    settings = self.settings.public()
                    if data["rules_version"] != "original":
                        settings["rubric_sha256"] = fingerprint(snapshot)
                    settings["option_order_by_item"] = {
                        cid: ["1", "2", "3", "4", "5"]
                        + (
                            ["Not applicable", "Indeterminate"]
                            if data["rules_version"] != "original" and cid in {"D3a", "D5c"}
                            else ["Cannot assess"]
                        )
                        for cid in data["criteria"]
                    }
                    run = {
                        "id": uuid.uuid4().hex,
                        "created_at": now(),
                        "input": data,
                        "rubric": snapshot,
                        "rubric_version": version_info(data["rules_version"]),
                        "settings": settings,
                        "answer_source": "generated" if action == "generate" else "pasted",
                        "grades": {},
                        "generation_attempts": [],
                        "review": {"items": {}},
                    }
            run["input_sha256"] = fingerprint(run["input"])
            if not self.settings.api_key:
                raise ValueError(
                    "Add OPENAI_API_KEY to the repository .env file, then restart the app."
                )
            run.update(
                status="generating" if action == "generate" else "scoring",
                error=None,
                message="Generating answer…" if action == "generate" else "Starting item scoring…",
                current_item=None,
            )
            self.stop.clear()
            self.active_id = run["id"]
            self.save(run)
            threading.Thread(target=self.work, args=(run["id"], action), daemon=True).start()
            return self.public_run(run["id"])
        except BaseException:
            self.job_lock.release()
            raise

    def work(self, run_id, action):
        try:
            run = self.load(run_id)
            if action == "generate":
                capture = {"started_at": now()}
                try:
                    answer = run_sync(self.provider.generate(run["input"], capture))
                    run["input"]["answer"] = answer
                    run["generated_answer"] = answer
                    run.update(
                        status="answer_ready", message="Answer ready. Review it, then evaluate."
                    )
                except Exception as exc:
                    capture["error"] = redact(str(exc), self.settings.api_key)
                    run.update(status="error", error=capture["error"], message="Generation failed.")
                run["generation_attempts"].append(capture)
                self.save(run)
                return
            for cid in run["input"]["criteria"]:
                if self.stop.is_set():
                    run.update(status="stopped", message="Stopped. Completed grades are saved.")
                    break
                grade = run["grades"].get(cid, {})
                if grade.get("status") in RESULT_STATUSES:
                    continue
                run.update(current_item=cid, message=f"Scoring {cid} — {CRITERIA[cid]['name']}…")
                self.save(run)
                capture = {"started_at": now()}
                attempts = grade.get("attempts", [])
                try:
                    grading_input = deepcopy(run["input"])
                    grading_input["_rubric_snapshot"] = run["rubric"]
                    grade = run_sync(self.provider.grade(grading_input, cid, capture))
                except Exception as exc:
                    capture["error"] = redact(str(exc), self.settings.api_key)
                    grade = {"status": "error", "score": None, "error": capture["error"]}
                grade["attempts"] = [*attempts, capture]
                run["grades"][cid] = grade
                self.save(run)
                # An outage should not produce a long queue of doomed API requests.
                if grade["status"] == "error":
                    run.update(
                        status="partial", message="An item failed. Retry continues from this item."
                    )
                    break
            else:
                run.update(status="complete", message="All selected items have a result.")
            run["current_item"] = None
            self.save(run)
        except Exception as exc:
            run = self.load(run_id)
            run.update(
                status="error",
                error=redact(str(exc), self.settings.api_key),
                message="The job stopped. Saved results are retained.",
            )
            self.save(run)
        finally:
            self.active_id = None
            self.job_lock.release()

    def stop_job(self, run_id):
        if self.active_id != run_id:
            raise ValueError("This run has no active job.")
        self.stop.set()
        return {"message": "Will stop after the current model request. Completed grades are kept."}

    def save_review(self, run_id, body):
        with self.lock:
            if self.active_id == run_id:
                raise BusyError("Wait until scoring stops before saving the review.")
            run = self.load(run_id)
            reviewer = body.get("reviewer", "")
            if not isinstance(reviewer, str) or len(reviewer) > 150:
                raise ValueError("Reviewer name is too long.")
            items = body.get("items", {})
            if not isinstance(items, dict):
                raise ValueError("Invalid review.")
            clean = {}
            for cid, item in items.items():
                if cid not in run["input"]["criteria"] or not isinstance(item, dict):
                    raise ValueError("Review contains an unselected criterion.")
                score = item.get("score", "")
                if score not in ["", "1", "2", "3", "4", "5", "N/A", "Indeterminate"]:
                    raise ValueError("Human scores must be 1–5, N/A, Indeterminate or blank.")
                note = item.get("note", "")
                if not isinstance(note, str) or len(note) > 10000:
                    raise ValueError("Review comment is too long.")
                previous = run.get("review", {}).get("items", {}).get(cid, {})
                clean[cid] = {
                    "score": score,
                    "note": note,
                    "machine_scores_seen": bool(
                        previous.get("machine_scores_seen") or item.get("machine_scores_seen")
                    ),
                }
            run["review"] = {"reviewer": reviewer.strip(), "items": clean, "saved_at": now()}
            self.save(run)
            return self.public_run(run_id)


class Handler(BaseHTTPRequestHandler):
    server_version = "AutoRubricLocal/1.0"

    @property
    def app(self):
        return self.server.app

    def send(self, status, body, content_type="application/json; charset=utf-8", filename=None):
        if not isinstance(body, bytes):
            body = (
                json.dumps(body, ensure_ascii=False)
                if content_type.startswith("application/json")
                else body
            ).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        if filename:
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.end_headers()
        self.wfile.write(body)

    def guarded(self, mutation=False):
        expected = {f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}"}
        if self.headers.get("Host") not in expected:
            raise PermissionError("Use the local app address.")
        origin = self.headers.get("Origin")
        if mutation and origin and urlparse(origin).netloc not in expected:
            raise PermissionError("Cross-origin requests are not allowed.")

    def body(self):
        size = int(self.headers.get("Content-Length", "0"))
        if size <= 0 or size > 512000:
            raise ValueError("Request is empty or too large.")
        value = json.loads(self.rfile.read(size))
        if not isinstance(value, dict):
            raise ValueError("Expected a JSON object.")
        return value

    def do_GET(self):
        self.dispatch(False)

    def do_POST(self):
        self.dispatch(True)

    def dispatch(self, mutation):
        try:
            self.guarded(mutation)
            path = urlparse(self.path).path
            if path == "/api/config" and not mutation:
                return self.send(
                    200,
                    {
                        "settings": self.app.settings.public(),
                        "rubric": RUBRIC,
                        "rubric_version": ORIGINAL_VERSION,
                        "rule_versions": VERSIONS,
                        "revised_rubric": rubric_snapshot(RUBRIC, VERSIONS[1]["id"]),
                        "saved_interviews": [
                            {
                                "case_id": r["case_id"],
                                "model": r["model"],
                                "model_slug": r["model_slug"],
                                "name": next(
                                    c["name"]
                                    for c in study_summary()["cases"]
                                    if c["id"] == r["case_id"]
                                ),
                            }
                            for r in study_summary()["interviews"]
                        ],
                        "presets": PRESETS,
                        "default_task": DEFAULT_TASK,
                        "cases": json.loads(
                            (APP_ROOT / "case-library.json").read_text(encoding="utf-8")
                        )["cases"],
                        "active_run": self.app.active_id,
                    },
                )
            if path == "/api/study" and not mutation:
                return self.send(200, study_summary())
            match = re.fullmatch(
                r"/api/study/(interviews|source|evaluation-input)/([A-Z0-9_]+)/([a-z-]+)", path
            )
            if match and not mutation:
                action, case, model = match.groups()
                record = study_interview(case, model)
                if action == "evaluation-input":
                    return self.send(200, validate_input(imported_input(case, model)))
                if action == "source":
                    filename = f"source-{case}-{model}.json"
                    return self.send(
                        200, study_output(filename), "application/json; charset=utf-8", filename
                    )
                return self.send(200, record)
            match = re.fullmatch(r"/api/study/files/([A-Za-z0-9_.-]+)", path)
            if match and not mutation:
                filename = match.group(1)
                mime = mimetypes.guess_type(filename)[0] or "text/plain"
                return self.send(200, study_output(filename), mime + "; charset=utf-8", filename)
            if path == "/api/runs":
                if not mutation:
                    return self.send(200, self.app.list_runs())
                body = self.body()
                return self.send(202, self.app.start(body.get("action", "evaluate"), body))
            match = re.fullmatch(r"/api/runs/([a-f0-9]{32})(?:/([a-z]+))?", path)
            if match:
                run_id, action = match.groups()
                if mutation:
                    body = self.body()
                    if action in {"evaluate", "retry"}:
                        return self.send(202, self.app.start(action, body, run_id))
                    if action == "review":
                        return self.send(200, self.app.save_review(run_id, body))
                    if action == "stop":
                        return self.send(200, self.app.stop_job(run_id))
                elif action in {"txt", "csv", "json"}:
                    run = self.app.public_run(run_id)
                    output = {
                        "txt": plain_text,
                        "csv": csv_text,
                        "json": lambda r: json.dumps(r, indent=2, ensure_ascii=False),
                    }[action](run)
                    mime = {"txt": "text/plain", "csv": "text/csv", "json": "application/json"}[
                        action
                    ]
                    return self.send(
                        200,
                        output.encode(),
                        mime + "; charset=utf-8",
                        f"autorubric-{run_id[:8]}.{action}",
                    )
                elif not action:
                    return self.send(200, self.app.public_run(run_id))
                raise FileNotFoundError("Route not found.")
            if path.startswith("/api/") or mutation:
                raise FileNotFoundError("Route not found.")
            root = APP_ROOT / "dist/client"
            file = (root / ("index.html" if path == "/" else path.lstrip("/"))).resolve()
            if root.resolve() not in file.parents:
                raise FileNotFoundError("File not found.")
            if not file.is_file():
                raise FileNotFoundError("UI files not found. Run ./run-ui.sh to build them.")
            return self.send(
                200, file.read_bytes(), mimetypes.guess_type(file)[0] or "application/octet-stream"
            )
        except BusyError as exc:
            self.send(409, {"error": str(exc)})
        except PermissionError as exc:
            self.send(403, {"error": str(exc)})
        except FileNotFoundError as exc:
            self.send(404, {"error": str(exc)})
        except (ValueError, TypeError, KeyError) as exc:
            self.send(400, {"error": redact(str(exc), self.app.settings.api_key)})
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            self.send(500, {"error": "The local server could not complete this request."})

    def log_message(self, fmt, *args):
        # Never log prompts, answers, references or API credentials.
        if args and len(args) > 1 and str(args[1]).startswith(("4", "5")):
            super().log_message(fmt, *args)


def main():
    parser = argparse.ArgumentParser(description="Run the local AutoRubric UI.")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--data-dir", type=Path, default=APP_ROOT / ".data/runs")
    args = parser.parse_args()
    os.umask(0o077)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    server.app = Application(args.data_dir)
    print(f"AutoRubric UI: http://127.0.0.1:{args.port}", flush=True)
    print("Runs are saved locally. Press Ctrl+C to stop the server.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
