"""Exercise the real rubric adapter and local job/review/export flow without paid calls."""

# ruff: noqa: E402 -- Test the self-contained local app without an editable install.

import asyncio
import importlib.util
import json
import sys
import time
from pathlib import Path

import httpx
import pytest

APP = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(APP))
from engine import (
    JUDGE_SYSTEM,
    Provider,
    Settings,
    csv_text,
    generation_messages,
    make_criterion,
    plain_text,
    safety_status,
    validate_input,
    word_count_info,
)

spec = importlib.util.spec_from_file_location("arena_server", APP / "server.py")
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


def case(**changes):
    return validate_input(
        dict(
            title="Offline test",
            facts="Young adult with gait imbalance.",
            task="Explain the uncertainty.",
            reference="JUDGE_ONLY_REFERENCE",
            source="HIDDEN_SOURCE_TITLE",
            criteria=["D1", "D5u"],
            answer="Several explanations remain possible; the history is incomplete.",
            **changes,
        )
    )


def wait(app, run_id):
    for _ in range(200):
        if app.active_id is None:
            return app.public_run(run_id)
        time.sleep(0.01)
    pytest.fail("Offline job did not finish")


class FakeProvider:
    def __init__(self):
        self.calls = []
        self.fail = True

    async def generate(self, data, capture):
        self.calls.append("generate")
        capture.update(elapsed_seconds=0.1, response={"usage": {"total_tokens": 12}})
        return "Saved generated answer."

    async def grade(self, data, cid, capture):
        self.calls.append(cid)
        if cid == "D5u" and self.fail:
            raise ValueError("Offline simulated timeout")
        capture.update(elapsed_seconds=0.2, response={"usage": {"total_tokens": 9}})
        return {"status": "scored", "score": 4, "reason": "Offline fixture.", "unanchored": False}


def test_reference_is_not_sent_to_answer_model():
    messages = json.dumps(generation_messages(case()))
    assert "JUDGE_ONLY_REFERENCE" not in messages
    assert "HIDDEN_SOURCE_TITLE" not in messages
    assert "gait imbalance" in messages


def test_word_count_keeps_heading_text_and_hyphenated_words():
    info = word_count_info(
        "## Review\n1. **A** patient-facing explanation.\n- Ask `why`.", "Use 6–6 words."
    )
    assert info["words"] == 6
    assert info["within_range"] and info["extra_tolerance"] == 0


def test_word_count_json_exclusion_requires_explicit_task_instruction():
    answer = 'Two words.\nNUMERIC_SUMMARY: {"value": 1}'
    assert word_count_info(answer, "Use 2–2 words.")["within_range"] is False
    info = word_count_info(answer, "Use 2–2 words. JSON is outside the narrative word limit")
    assert info["words"] == 2 and info["within_range"] and info["json_excluded"]


@pytest.mark.parametrize(
    "prepared",
    json.loads((APP / "case-library.json").read_text(encoding="utf-8"))["cases"],
    ids=lambda row: row["case_id"],
)
def test_prepared_cases_keep_draft_references_out_of_generation(prepared):
    if prepared.get("history_required") and not prepared.get("history"):
        with pytest.raises(ValueError, match="saved initial conversation"):
            validate_input(prepared)
        return
    data = validate_input(prepared)
    assert data["reference_status"] == "draft"
    assert data["reference"] and data["source"] and not data["answer"]
    messages = json.dumps(generation_messages(data), ensure_ascii=False)
    assert data["facts"] in "\n".join(m["content"] for m in generation_messages(data))
    assert data["reference"] not in messages
    assert data["source"] not in messages
    hidden = {
        "N01": "143.9",
        "N02": "hamartoma",
        "N03": "100 mL",
        "N04_INITIAL": "GFAP-IgG",
        "N05": "p.Thr79Lys",
        "N06": "major bleeding adjudication",
    }
    if prepared["case_id"] in hidden:
        assert hidden[prepared["case_id"]].lower() not in messages.lower()


def test_required_branch_history_is_retained_and_not_silently_omitted():
    with pytest.raises(ValueError, match="saved initial conversation"):
        case(history_required=True)
    data = case(
        history_required=True,
        history="User: initial input.\nAssistant: saved answer.",
        case_id="N04_EVIDENCE",
        base_case_id="N04",
        reused_initial_run_id="a" * 32,
    )
    assert data["history_required"] and data["reused_initial_run_id"] == "a" * 32
    assert data["history"] in generation_messages(data)[1]["content"]


def test_anchors_and_safety_remain_distinct():
    assert "No original descriptor" not in make_criterion("D3a").requirement
    assert "No original descriptor" in make_criterion("D4a").requirement
    assert "When THIS criterion" in JUDGE_SYSTEM
    assert safety_status({"D6a": {"score": 1}}) == "Safety Fail flagged"
    assert safety_status({"D6b": {"status": "error", "score": None}}) == "Safety not fully assessed"
    assert safety_status({"D6a": {"score": 4}, "D6b": {"score": 5}}) == "No Safety Fail triggered"


def test_real_autorubric_adapter_and_label_check(monkeypatch):
    settings = Settings("offline-secret", "https://offline.invalid/v1")
    provider = Provider(settings)
    reply = {
        "selected_option": 4,
        "selected_label": "4",
        "explanation": "Accurate given the supplied facts.",
    }

    async def mock_post(self, url, **kwargs):
        body = kwargs["json"]
        assert body["model"] == "arc:apex"
        assert "JUDGE_ONLY_REFERENCE" in json.dumps(body)
        assert "selected_label" in json.dumps(body["response_format"])
        return httpx.Response(
            200,
            request=httpx.Request("POST", url),
            json={
                "id": "fixture",
                "object": "chat.completion",
                "created": 0,
                "model": "arc:apex",
                "choices": [
                    {
                        "index": 0,
                        "finish_reason": "stop",
                        "message": {
                            "role": "assistant",
                            "content": json.dumps(reply),
                        },
                    }
                ],
                "usage": {"prompt_tokens": 8, "completion_tokens": 5, "total_tokens": 13},
            },
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)
    capture = {}
    result = asyncio.run(provider.grade(case(), "D1", capture))
    assert result["score"] == 4
    assert capture["autorubric_report"]["report"]
    assert "offline-secret" not in json.dumps(capture)
    reply["selected_label"] = "5"
    with pytest.raises(ValueError, match="does not match"):
        asyncio.run(provider.grade(case(), "D1", {}))


def test_resume_keeps_completed_grades_review_and_exports(tmp_path):
    fake = FakeProvider()
    app = server.Application(tmp_path, Settings("offline", "https://offline.invalid/v1"), fake)
    run = app.start("evaluate", case())
    run = wait(app, run["id"])
    assert run["status"] == "partial"
    assert run["grades"]["D1"]["score"] == 4
    fake.fail = False
    app.start("retry", {}, run["id"])
    run = wait(app, run["id"])
    assert run["status"] == "complete"
    assert fake.calls == ["D1", "D5u", "D5u"]
    assert len(run["grades"]["D5u"]["attempts"]) == 2
    run = app.save_review(
        run["id"],
        {
            "reviewer": "Test reviewer",
            "items": {
                "D1": {"score": "3", "note": "Review fixture.", "machine_scores_seen": True},
            },
        },
    )
    assert run["grades"]["D1"]["score"] == 4
    assert run["review"]["items"]["D1"]["score"] == "3"
    assert "Human rating: 3" in plain_text(run)
    assert "Review fixture." in csv_text(run)
    assert run["usage"]["total_tokens"] == 18
    assert (
        server.Application(tmp_path, app.settings, fake).load(run["id"])["review"] == run["review"]
    )


def test_generation_retained_and_scored_input_is_immutable(tmp_path):
    fake = FakeProvider()
    app = server.Application(tmp_path, Settings("offline", "https://offline.invalid/v1"), fake)
    run = app.start("generate", case())
    run = wait(app, run["id"])
    assert run["generated_answer"] == "Saved generated answer."
    data = dict(run["input"], answer="Edited saved answer.")
    fake.fail = False
    app.start("evaluate", data, run["id"])
    run = wait(app, run["id"])
    assert run["answer_source"] == "generated_then_edited"
    assert run["generated_answer"] == "Saved generated answer."
    with pytest.raises(ValueError, match="already has grades"):
        app.start("evaluate", data, run["id"])


def test_invalid_input_and_review_are_rejected(tmp_path):
    with pytest.raises(ValueError):
        validate_input({"facts": "", "task": "x"})
    with pytest.raises(ValueError):
        validate_input({"facts": "x", "task": "x", "criteria": ["NOT_A_CRITERION"]})
    with pytest.raises(ValueError):
        validate_input(
            {"facts": "x", "task": "x", "criteria": ["D1"], "judge_model": "http://bad host"}
        )
