"""Question boundaries, exact evidence, review gates and append-only library use."""

import json
import sys
import threading
import time
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from article_sources import assemble, from_html, sha  # noqa: E402
from engine import Settings, generation_messages  # noqa: E402
from literature_questions import CHECKS, LiteratureQuestions  # noqa: E402
from public_access import COOKIE_NAME, password_hash, sign_session  # noqa: E402
from public_server import HostedServer  # noqa: E402
from test_literature import store_fixture  # noqa: E402


def test_reusing_saved_fulltext_does_not_rewrite_source_or_call_publisher(tmp_path, monkeypatch):
    store, source, _ = store_fixture(tmp_path)
    path = store.path("sources", source["id"])
    source["text"], source["blocks"] = assemble(
        [
            {"tag": "h2", "text": "Case presentation"},
            {"text": "A published clinical fact with sufficient full-text context. " * 40},
        ]
    )
    source["text_sha256"] = sha(source["text"])
    store.write(path, source)
    before = path.read_bytes()

    def unexpected_fetch(*args, **kwargs):
        raise AssertionError("A verified saved source should not be fetched again.")

    monkeypatch.setattr("literature.read_source", unexpected_fetch)
    reused = store.create_source({"kind": "url", "url": source["url"]})
    assert reused["loaded_from_saved_source"] is True
    assert reused["text"] == source["text"]
    assert path.read_bytes() == before
    with pytest.raises(AssertionError, match="fetched again"):
        store.create_source({"kind": "url", "url": source["url"], "use_saved_source": False})


def test_bmj_fulltext_body_is_selected_even_when_an_abstract_appears_first():
    pytest.importorskip("bs4", reason="Install arena/requirements-extraction.txt")
    html = (
        '<div id="content-block"><h2>Abstract</h2><p>ABSTRACT_DIAGNOSIS '
        + "Summary text. " * 150
        + '</p></div><div class="article fulltext-view"><h2>Case presentation</h2>'
        '<p id="p-7">'
        + "Original clinical record. " * 100
        + "</p><h2>Outcome and follow-up</h2><p>Later recovery.</p></div>"
    )
    source = from_html(html.encode())
    assert "Original clinical record." in source["text"]
    assert "ABSTRACT_DIAGNOSIS" not in source["text"]
    assert any(block["id"] == "p-7" for block in source["blocks"])


class QuestionProvider:
    settings = Settings("test-only-placeholder", "https://offline.invalid/v1")

    def __init__(self, facts, *, bad_id=False, truncated=False):
        self.facts = facts
        self.bad_id = bad_id
        self.truncated = truncated

    async def completion(self, payload, capture):
        symptom = next(f for f in self.facts if f["category"] == "symptom")
        outcome = next(f for f in self.facts if f["category"] == "outcome")
        first = {
            "title": "Initial interpretation",
            "question": "What remains uncertain?",
            "decision_point": "Initial assessment before the later outcome.",
            "context": "",
            "task_type": "clinical_interpretation",
            "answer_basis": "synthesis",
            "visible_fact_ids": ["NONEXISTENT" if self.bad_id else symptom["id"]],
            "reference_fact_ids": [symptom["id"], outcome["id"]],
            "reference_answer": "REFERENCE_ONLY. The later record describes day 12 recovery.",
            "visibility_note": "The later result supports the reference and stays hidden.",
            "review": dict.fromkeys(CHECKS, True),  # a model cannot attest to human review
        }
        second = {
            **first,
            "title": "Reported outcome",
            "question": "What outcome was reported?",
            "decision_point": "Retrospective report comprehension.",
            "task_type": "report_comprehension",
            "answer_basis": "reported",
            "visible_fact_ids": [symptom["id"], outcome["id"]],
        }
        raw = {
            "choices": [
                {
                    "message": {"content": json.dumps({"questions": [first, second]})},
                    "finish_reason": "length" if self.truncated else "stop",
                }
            ]
        }
        capture["response"] = raw
        return raw


def wait_ready(questions, identifier):
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        record = questions.load(identifier)
        if record["status"] != "generating":
            return record
        time.sleep(0.02)
    raise AssertionError("Question worker did not finish.")


def question_fixture(tmp_path, **provider_options):
    store, source, draft = store_fixture(tmp_path)
    store.app.provider = QuestionProvider(draft["items"], **provider_options)
    questions = LiteratureQuestions(store)
    created = questions.start(draft["id"], {"revision": draft["revision"], "count": 2})
    return questions, source, draft, wait_ready(questions, created["id"])


def body_for(record, *, checked=False):
    return {
        "revision": record["revision"],
        "questions": [{**q, "review": dict.fromkeys(CHECKS, checked)} for q in record["questions"]],
        "case_submission": {
            "contributor_id": "SourceReview01",
            "batch_id": "questions-test",
            "batch_name": "Article questions",
        },
    }


def test_generation_reuses_exact_evidence_but_never_saves_or_self_confirms(tmp_path):
    questions, source, draft, record = question_fixture(tmp_path)
    assert record["status"] == "ready" and len(record["questions"]) == 2
    assert record["case_code"] == draft["case_code"]
    assert all(not any(q["review"].values()) for q in record["questions"])
    assert not list(questions.app.cases.root.glob("*.json"))
    first, second = record["questions"]
    messages = json.dumps(
        generation_messages({**first["prepared_input"], "evaluation_mode": "written"})
    )
    assert "breathlessness" in messages
    for value in ["day 12", "REFERENCE_ONLY", "SOURCE_TITLE_WITH_FINAL_DIAGNOSIS", source["url"]]:
        assert value not in messages
    assert "day 12" in json.dumps(
        generation_messages({**second["prepared_input"], "evaluation_mode": "written"})
    )
    for question in record["questions"]:
        assert question["reference_status"] == "awaiting confirmation"
        assert set(question["visible_fact_ids"]).isdisjoint(question["hidden_fact_ids"])
    for fact in record["facts"]:
        position = fact["position"]
        assert source["text"][position["start"] : position["end"]] == fact["source_quote"]
    assert questions.output(record["id"])["calls"][0]["response"]["choices"]


def test_each_selected_question_needs_review_and_preserves_one_parent_case(tmp_path):
    questions, _, _, record = question_fixture(tmp_path)
    with pytest.raises(ValueError, match="every selected question"):
        questions.update(record["id"], body_for(record), confirm=True)
    assert not list(questions.app.cases.root.glob("*.json"))
    body = body_for(record, checked=True)
    body["questions"][1]["review"]["source_checked"] = False
    with pytest.raises(ValueError, match="every selected question"):
        questions.update(record["id"], body, confirm=True)
    assert not list(questions.app.cases.root.glob("*.json"))
    body["questions"][1]["include"] = False
    saved = questions.update(record["id"], body, confirm=True)
    assert saved["status"] == "partially_confirmed" and saved["confirmed_count"] == 1
    assert len(list(questions.app.cases.root.glob("*.json"))) == 1
    body = body_for(saved, checked=True)
    body["questions"][1]["include"] = True
    final = questions.update(record["id"], body, confirm=True)
    assert final["status"] == "confirmed" and final["confirmed_count"] == 2
    records = [json.loads(p.read_text()) for p in questions.app.cases.root.glob("*.json")]
    assert len(records) == 2
    assert {r["input"]["case_code"] for r in records} == {record["case_code"]}
    assert {r["input"]["case_number"] for r in records} == {"Q01", "Q02"}
    assert all(r["reference_status"] == "awaiting confirmation" for r in records)
    assert all(r["literature_sources"][0]["question_set_id"] == record["id"] for r in records)
    assert (
        questions.store.root / "question_versions" / record["id"] / "revision_0000.json"
    ).exists()
    repeat = questions.update(record["id"], body_for(final, checked=True), confirm=True)
    assert (
        repeat["confirmed_count"] == 2 and len(list(questions.app.cases.root.glob("*.json"))) == 2
    )


def test_revisions_and_confirmed_questions_cannot_be_silently_rewritten(tmp_path):
    questions, _, _, record = question_fixture(tmp_path)
    old = body_for(record)
    saved = questions.update(record["id"], old)
    with pytest.raises(ValueError, match="another view"):
        questions.update(record["id"], old)
    confirmed = questions.update(record["id"], body_for(saved, checked=True), confirm=True)
    changed = body_for(confirmed, checked=True)
    changed["questions"][0]["reference_answer"] = "A different clinical judgement."
    with pytest.raises(ValueError, match="immutable"):
        questions.update(record["id"], changed)


@pytest.mark.parametrize(
    "field,value",
    [("visible_fact_ids", ["MADE_UP"]), ("reference_fact_ids", []), ("review", "not-an-object")],
)
def test_invalid_evidence_or_review_fields_never_enter_library(tmp_path, field, value):
    questions, _, _, record = question_fixture(tmp_path)
    body = body_for(record, checked=True)
    body["questions"][0][field] = value
    with pytest.raises(ValueError):
        questions.update(record["id"], body, confirm=True)
    assert not list(questions.app.cases.root.glob("*.json"))


@pytest.mark.parametrize("provider_options", [{"bad_id": True}, {"truncated": True}])
def test_invalid_or_truncated_generation_retains_failures_without_partial_cases(
    tmp_path, provider_options
):
    questions, _, _, record = question_fixture(tmp_path, **provider_options)
    assert record["status"] == "error" and not record["questions"]
    assert len(questions.output(record["id"])["calls"]) == 2
    assert not list(questions.app.cases.root.glob("*.json"))


def test_question_routes_require_workspace_access_and_evaluation_permission(tmp_path):
    from test_literature import ModelFixture

    accounts = json.dumps(
        [
            {"id": "editor", "role": "admin", "password_hash": password_hash("test-only-password")},
            {
                "id": "reviewer",
                "role": "reviewer",
                "workspace": "editor",
                "password_hash": password_hash("test-only-password"),
            },
        ]
    )
    secret = "test-only-session-secret-longer-than-32-characters"
    server = HostedServer(
        ("127.0.0.1", 0),
        tmp_path,
        "http://127.0.0.1:0",
        accounts,
        secret,
        ModelFixture.settings,
        ModelFixture(),
    )
    server.public_origin = f"http://127.0.0.1:{server.server_port}"
    store, source, draft = store_fixture(tmp_path / "fixture")
    app = server.apps["editor"]
    app.literature.write(app.literature.path("sources", source["id"]), source)
    app.literature.write(app.literature.path("drafts", draft["id"]), draft)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with httpx.Client(
            base_url=server.public_origin, headers={"Origin": server.public_origin}, trust_env=False
        ) as client:
            path = f"/api/literature/drafts/{draft['id']}/questions"
            assert client.get(path).status_code == 403
            client.cookies.set(COOKIE_NAME, sign_session(server.users["reviewer"], secret))
            assert client.get(path).json()["sets"] == []
            assert client.post(path, json={}).status_code == 403
            client.cookies.set(COOKIE_NAME, sign_session(server.users["editor"], secret))
            app.provider = QuestionProvider(draft["items"])
            response = client.post(path, json={"revision": draft["revision"], "count": 2})
            assert response.status_code == 202
            record = wait_ready(app.literature_questions, response.json()["id"])
            assert client.get(f"/api/literature/questions/{record['id']}/output").status_code == 200
            body = body_for(record, checked=True)
            body["case_submission"]["account_id"] = "spoofed-account"
            response = client.post(f"/api/literature/questions/{record['id']}/confirm", json=body)
            assert response.status_code == 200
            saved = next(app.cases.root.glob("*.json"))
            assert json.loads(saved.read_text())["submissions"][0]["account_id"] == "editor"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(2)
