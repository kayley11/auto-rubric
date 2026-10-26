"""Check evidence privacy, append-only review and the real interview controller offline."""

# ruff: noqa: E402 -- Standalone local application.

import hashlib
import json
import sys
import threading
import time
from copy import deepcopy
from http.server import ThreadingHTTPServer
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import evidence
import exports
import patient
import scoring
import study
from engine import Settings, judge_query, validate_input
from reviews import Reviews
from server import Application, Handler


def packet():
    return evidence.followup_packet("n04-fresh-arc-lite")


def test_case_files_and_review_text_do_not_depend_on_system_locale(tmp_path, monkeypatch):
    """Reproduce a Windows cp1252 default without changing any archived source bytes."""
    read, write = Path.read_text, Path.write_text

    def locale_read(path, encoding=None, errors=None):
        return read(path, encoding=encoding or "cp1252", errors=errors)

    def locale_write(path, data, encoding=None, errors=None, newline=None):
        return write(path, data, encoding=encoding or "cp1252", errors=errors, newline=newline)

    expected_cases = json.loads((study.STUDY_ROOT / "live-cases.json").read_bytes())
    expected_followup = json.loads((study.STUDY_ROOT / "followup.json").read_bytes())
    patient.library.cache_clear()
    evidence.followup.cache_clear()
    with monkeypatch.context() as patch:
        patch.setattr(Path, "read_text", locale_read)
        patch.setattr(Path, "write_text", locale_write)
        assert patient.library() == expected_cases
        assert evidence.followup() == expected_followup
        store, p = Reviews(tmp_path), packet()
        reviewer = "UI validation (test) · 中文"
        store.save_rating(
            p,
            {
                "reviewer": reviewer,
                "items": {
                    "D3a": {
                        "score": "Indeterminate",
                        "note": "Encoding test only — no clinical rating.",
                    }
                },
            },
        )
        assert store.rating(p)["reviewer"] == reviewer


def test_followup_scores_and_downloads_preserve_actual_repeated_results():
    records = evidence.followup()["records"]
    assert len(records) == 6
    assert sum(len(v) for r in records for v in r["scores"].values()) == 36
    assert [g["label"] for g in packet()["scores"]["D5c"]] == ["2", "2", "5"]
    assert all(g["label"] == "5" for r in records for g in r["scores"]["D3a"])
    assert sum(len(c["scores"]) for c in evidence.followup()["controls"]) == 6
    for name, expected in evidence.followup()["output_hashes"].items():
        assert hashlib.sha256(evidence.output(name)).hexdigest() == expected
    with pytest.raises(FileNotFoundError):
        evidence.output("../../.env")


def test_anonymous_synthesis_packet_excludes_examiner_and_machine_material():
    p = packet()
    p["data"]["reference"] = "HIDDEN_REFERENCE"
    p["data"]["requirements"][0]["requirement"] = "HIDDEN_REQUIREMENT"
    p["data"]["interview"]["turns"][0]["notes"] = "ASSESSMENT_ONLY"
    p["scores"]["D5c"][0]["reason"] = "MACHINE_JUDGEMENT"
    d3a = json.dumps(evidence.blind_packet(p))
    for hidden in (
        "HIDDEN_REFERENCE",
        "HIDDEN_REQUIREMENT",
        "ASSESSMENT_ONLY",
        "MACHINE_JUDGEMENT",
        "arc:lite",
        "arc:apex",
        "inventory",
        '"scores"',
    ):
        assert hidden not in d3a
    d5c = json.dumps(evidence.blind_packet(p, "D5c"))
    assert "HIDDEN_REQUIREMENT" in d5c and "ASSESSMENT_ONLY" in d5c
    assert "MACHINE_JUDGEMENT" not in d5c and "arc:lite" not in d5c


def test_review_queue_does_not_identify_models_or_scores(tmp_path):
    app = Application(tmp_path, Settings("", "https://offline.invalid/v1"), object())
    queue = evidence.review_catalogue(app)
    assert len(queue) == 27
    raw = json.dumps(queue)
    for hidden in ("arc:", "scores", "reason", "n04-fresh-arc-lite"):
        assert hidden not in raw
    assert all(row["response"].startswith("Answer ") for row in queue)


def test_independent_ratings_preserve_order_exposure_and_each_save(tmp_path):
    store, p = Reviews(tmp_path), packet()
    body = {
        "reviewer": "UI validation (test)",
        "items": {"D5c": {"score": "Indeterminate", "note": "Test only."}},
    }
    with pytest.raises(ValueError, match="Save D3a"):
        store.save_rating(p, body)
    with pytest.raises(ValueError, match="Save independent"):
        store.reveal(p)
    body["items"] = {"D3a": {"score": "Indeterminate", "note": "Test only."}}
    first = store.save_rating(p, body)
    first_bytes = (tmp_path / (first["id"] + ".json")).read_bytes()
    body["items"] = {"D5c": {"score": "Indeterminate", "note": "Test only."}}
    second = store.save_rating(p, body)
    assert second["items"]["D3a"] == first["items"]["D3a"]
    assert first_bytes == (tmp_path / (first["id"] + ".json")).read_bytes()
    assert len(list(tmp_path.glob("*.json"))) == 2
    revealed = store.reveal(p)
    assert revealed["model"] == "arc:lite"
    assert not revealed["rating"]["items"]["D5c"]["machine_scores_seen"]
    body["machine_scores_seen"] = False
    after = store.save_rating(p, body)
    assert after["items"]["D5c"]["machine_scores_seen"]
    body["items"] = {"D3a": {"score": "5", "note": "Cannot overwrite."}}
    with pytest.raises(ValueError, match="preserved"):
        store.save_rating(p, body)


def test_requirement_review_is_separate_from_source_and_shared_across_models(tmp_path):
    store, p = Reviews(tmp_path), packet()
    original = deepcopy(p)
    other = evidence.followup_packet("n04-fresh-arc-chat")
    assert store.profile_key(p) == store.profile_key(other)
    row = p["data"]["requirements"][0]
    body = {
        "reviewer": "UI validation (test)",
        "decisions": {
            row["id"]: {
                "level": "helpful",
                "status": "confirmed",
                "reason": "Form test only.",
                "alternatives": "A general personal-history request.",
                "deadline": "Before final assessment",
            }
        },
    }
    saved = store.save_requirements(p, body)
    assert saved["decisions"][row["id"]]["level"] == "helpful"
    assert p == original
    assert store.requirements(other)["review"]["id"] == saved["id"]
    for invalid in ("", "arc:apex Q3 should count"):
        body["decisions"][row["id"]]["alternatives"] = invalid
        with pytest.raises(ValueError):
            store.save_requirements(p, body)


def test_summary_and_blank_export_preserve_answer_and_all_criteria():
    p = packet()
    raw = exports.summary(p)
    assert p["data"]["answer"] in raw
    assert "2, 2, 5" in raw and p["scores"]["D5c"][0]["reason"] in raw
    blank = exports.summary(p, blind=True)
    assert p["data"]["answer"] in blank
    assert "arc:lite" not in blank and "arc:apex" not in blank
    assert p["scores"]["D5c"][0]["reason"] not in blank
    assert blank.index("### D3a") < blank.index("### D5c")
    assert "limits D5c to 2" in blank
    p["all_rules"] = {**p["rules"], "D1": {"definition": "Facts.", "anchors": {"5": "Accurate."}}}
    p["all_scores"] = {**p["scores"], "D1": [{"score": 4, "reason": "Extra selected item."}]}
    assert "### D1" in exports.summary(p)
    assert "### D1" in exports.summary(p, blind=True)


class ReplayProvider:
    def __init__(self, case_id, malformed_patient=False):
        self.saved = study.interview(case_id, "arc-lite")
        self.calls = []
        self.malformed_patient = malformed_patient
        self.pause_app = None

    async def completion(self, body, capture):
        self.calls.append(deepcopy(body))
        kind, number = capture["kind"], capture["question_number"]
        if kind == "patient_fact_order":
            allowed = json.loads(body["messages"][-1]["content"])["permitted_statements"]
            content = {"utterance_order": [r["id"] for r in allowed]}
            if self.malformed_patient:
                content = {"utterance_order": ["UNKNOWN_FACT"]}
        elif kind == "interview_final_answer":
            content = "Offline final answer. Uncertainty remains."
        elif kind == "clinician_repetition_repair" or number > len(self.saved["turns"]):
            content = {
                "action": "finish",
                "assessment": {"summary": "Uncertainty remains.", "certainty": "uncertain"},
            }
        else:
            content = self.saved["turns"][number - 1]["doctor_output"]
            if self.pause_app:
                self.pause_app.stop.set()
                self.pause_app = None
        response = {
            "choices": [
                {
                    "message": {
                        "content": content if isinstance(content, str) else json.dumps(content)
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {"total_tokens": 10},
        }
        capture.update(response=response, elapsed_seconds=0.01, request=body)
        return response

    async def grade(self, data, cid, capture):
        assert data["interview"]["complete"]
        if cid == "D5c":
            assert "arc:lite" not in judge_query(data, cid)
        capture.update(response={"usage": {"total_tokens": 12}}, elapsed_seconds=0.01)
        return {"status": "scored", "score": 4, "label": "4", "reason": "Offline fixture."}


def finished(app, identifier):
    for _ in range(400):
        if app.active_id is None:
            return app.public_run(identifier)
        time.sleep(0.01)
    pytest.fail("Offline interview did not finish.")


@pytest.mark.parametrize("case_id", [c["id"] for c in patient.catalogue()])
def test_each_prepared_case_runs_with_fixed_facts_and_six_turn_limit(tmp_path, case_id):
    provider = ReplayProvider(case_id)
    app = Application(tmp_path, Settings("offline-secret", "https://offline.invalid/v1"), provider)
    original = (study.STUDY_ROOT / "interviews.json").read_bytes()
    started = app.start("interview", {"case_id": case_id})
    run = finished(app, started["id"])
    assert run["status"] == "answer_ready", run.get("error")
    assert run["input"]["interview"]["complete"]
    assert len(run["input"]["interview"]["turns"]) <= 6
    assert "patient_case_snapshot" not in run
    saved = app.load(run["id"])
    inventory = {f["id"]: f for f in saved["patient_case_snapshot"]["facts"]}
    seen = set(saved["patient_case_snapshot"]["opening_fact_ids"])
    for turn in saved["interview_state"]["turns"]:
        assert not seen.intersection(turn["released_fact_ids"])
        for fact in turn["fixed_records"]:
            assert fact == inventory[fact["id"]]
        reply = " ".join(inventory[fid]["patient_text"] for fid in turn["patient_used_fact_ids"])
        assert turn["patient_reply"] == reply
        seen.update(turn["released_fact_ids"])
    for call in provider.calls:
        visible = json.dumps(call["messages"])
        assert saved["patient_case_snapshot"]["reference"] not in visible
        assert '"opening_fact_ids"' not in visible
        assert '"requirements"' not in visible
    assert run["review_id"] == evidence.run_packet(saved)["id"]
    evaluated = app.start("evaluate", run["input"], run["id"])
    graded = finished(app, evaluated["id"])
    assert graded["status"] == "complete"
    assert set(graded["grades"]) == {"D3a", "D5c"}
    assert (study.STUDY_ROOT / "interviews.json").read_bytes() == original


def test_stop_resume_keeps_completed_prefix_and_captures_patient_fallback(tmp_path):
    provider = ReplayProvider("C02", malformed_patient=True)
    app = Application(tmp_path, Settings("offline-secret", "https://offline.invalid/v1"), provider)
    provider.pause_app = app
    started = app.start("interview", {"case_id": "C02"})
    paused = finished(app, started["id"])
    assert paused["status"] == "stopped"
    first = deepcopy(app.load(started["id"])["interview_state"]["turns"])
    assert len(first) == 1
    retry = app.start("retry", {}, started["id"])
    run = finished(app, retry["id"])
    assert run["status"] == "answer_ready", run.get("error")
    saved = app.load(run["id"])
    assert saved["interview_state"]["turns"][:1] == first
    assert any(
        a.get("validation_error") == "Invalid patient fact order."
        for a in saved["generation_attempts"]
    )
    assert (
        len(
            [
                a
                for a in saved["generation_attempts"]
                if a["kind"] == "clinician_question" and a["question_number"] == 1
            ]
        )
        == 1
    )


def test_prepared_pending_interview_is_not_accepted_as_completed_grading_input():
    data = patient.prepared("C02")
    assert not data["interview"]["complete"]
    with pytest.raises(ValueError):
        validate_input(data)
    assert validate_input(data, planned_interview=True)["evaluation_mode"] == "patient"


def test_original_rubric_can_be_selected_without_replacing_new_proposal():
    old = validate_input(patient.prepared("C02", rules_version="original"), planned_interview=True)
    assert old["rules_version"] == "original"
    assert patient.prepared("C02")["rules_version"] == scoring.REVISED_ID


def test_http_review_gates_decision_copy_and_exports(tmp_path):
    app = Application(tmp_path, Settings("", "https://offline.invalid/v1"), object())
    http = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    http.app = app
    thread = threading.Thread(target=http.serve_forever, daemon=True)
    thread.start()
    p = packet()
    try:
        with httpx.Client(
            base_url=f"http://127.0.0.1:{http.server_port}", trust_env=False
        ) as client:
            base = "/api/review/" + p["id"]
            assert client.get(base + "/D5c").status_code == 400
            unseen = client.get(base).json()
            assert unseen["criterion"] == "D3a" and "scores" not in unseen
            for cid in ("D3a", "D5c"):
                response = client.post(
                    base + "/rating",
                    json={
                        "reviewer": "UI validation (test)",
                        "items": {cid: {"score": "Indeterminate", "note": "Interface check only."}},
                    },
                )
                assert response.status_code == 200, response.text
            assert client.get(base + "/D5c").json()["inventory"]
            summary = client.get(f"/api/evidence/{p['id']}/summary")
            assert "Saved human ratings" in summary.text and "Interface check only." in summary.text
            assert "attachment" in summary.headers["content-disposition"]
            blank = client.get(f"/api/evidence/{p['id']}/blind").text
            assert "Interface check only." not in blank and "arc:lite" not in blank
            assert client.post(base + "/reveal", json={}).json()["model"] == "arc:lite"
            requirement = p["data"]["requirements"][0]
            response = client.post(
                f"/api/requirements/{p['id']}",
                json={
                    "reviewer": "UI validation (test)",
                    "decisions": {
                        requirement["id"]: {
                            "status": "confirmed",
                            "level": "helpful",
                            "reason": "TEST_COMMENT_NOT_FOR_JUDGE",
                            "alternatives": "A personal-history question.",
                            "deadline": "Before final assessment",
                        }
                    },
                },
            )
            assert response.status_code == 200, response.text
            copied = client.get(f"/api/evidence/{p['id']}/reviewed-input").json()
            assert copied["requirements"][0]["level"] == "helpful"
            assert copied["requirements_review"]["reviewer"] == "UI validation (test)"
            assert "TEST_COMMENT_NOT_FOR_JUDGE" not in judge_query(copied, "D5c")
            assert packet()["data"]["requirements"][0]["level"] == "essential"
    finally:
        http.shutdown()
        http.server_close()
        thread.join(timeout=2)
