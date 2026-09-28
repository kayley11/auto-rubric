"""Offline checks using authored software fixtures, not clinical study materials."""

import asyncio
import importlib
import json
import os
import re
import socket
import sys
from collections import Counter
from pathlib import Path

import httpx
import pytest

MODULE = Path(__file__).resolve().parents[1]


@pytest.fixture
def engine(tmp_path, monkeypatch):
    # A deliberately simple record and rubric, written only for software tests.
    # These are not the study's cases, rubric anchors or clinical reference answers.
    data = tmp_path / "data"
    data.mkdir()
    case = {"id": "SAMPLE", "facts": "The recorded value is 12.", "task": "Repeat the value."}
    config = {
        "judge_model": "fixture",
        "judge_temperature": 0.7,
        "judge_top_p": 0.8,
        "judge_max_tokens": 512,
        "judge_reasoning_effort": "low",
        "request_timeout_seconds": 1,
        "native_alias_mode": True,
        "verify_option_label": True,
        "judge_transport": "httpx",
    }
    inputs = {
        "cases": [case],
        "config": config,
        "reference_notes": {"SAMPLE": {"expected": "12"}},
        "applicability": {},
        "plan": {},
        "rubric_source": {
            "criteria": [
                {
                    "id": "D1",
                    "name": "Faithfulness to the supplied record (test fixture)",
                    "anchors": {
                        "1": "Changes the value.",
                        "3": "Omits the value.",
                        "5": "Keeps the value.",
                    },
                    "missing_anchors": ["2", "4"],
                }
            ],
        },
    }
    for name, value in inputs.items():
        (data / f"{name}.json").write_text(json.dumps(value), encoding="utf-8")
    monkeypatch.syspath_prepend(str(MODULE))
    for key in list(os.environ):
        if key.startswith(("OPENAI_", "AUTORUBRIC_", "JOSH_")):
            monkeypatch.delenv(key)
    monkeypatch.setenv("AUTORUBRIC_PILOT_WORKSPACE", str(tmp_path))
    monkeypatch.setenv("AUTORUBRIC_PILOT_RUN_DIR", str(tmp_path))
    monkeypatch.setenv("OPENAI_API_KEY", "offline-placeholder")
    monkeypatch.setenv("OPENAI_BASE_URL", "https://offline.invalid/v1")
    monkeypatch.setenv("LITELLM_LOCAL_MODEL_COST_MAP", "True")

    original_connect = socket.socket.connect

    def no_external_network(connection, address):
        # Windows asyncio uses a loopback TCP socketpair to wake its event loop.
        if connection.family in (socket.AF_INET, socket.AF_INET6) and address[0] in (
            "127.0.0.1",
            "::1",
        ):
            return original_connect(connection, address)
        raise AssertionError("Public fixture tests must not connect to a provider")

    monkeypatch.setattr(socket.socket, "connect", no_external_network)
    names = ("pilot_paths", "pilot", "extension", "extension_http")
    for name in names:
        monkeypatch.delitem(sys.modules, name, raising=False)
    try:
        yield importlib.import_module("extension_http")
    finally:
        for name in names:
            sys.modules.pop(name, None)


@pytest.mark.parametrize("label", ["4", "Cannot assess", "mismatch"])
def test_actual_grader_preserves_labels_abstentions_and_mismatch_guard(engine, monkeypatch, label):
    async def response(self, url, **kwargs):
        prompt = kwargs["json"]["messages"][-1]["content"]
        options = re.search(r"<options>\s*(.*?)\s*</options>", prompt, re.S).group(1)
        positions = {
            match[2]: int(match[1]) for match in re.finditer(r"^(\d+)\. (.+)$", options, re.M)
        }
        selected = "4" if label == "mismatch" else label
        assert positions["4"] != 4, "Fixture must exercise shuffled position versus score label"
        payload = {
            "id": "offline-fixture",
            "object": "chat.completion",
            "created": 0,
            "model": "fixture",
            "choices": [
                {
                    "index": 0,
                    "finish_reason": "stop",
                    "message": {
                        "role": "assistant",
                        "content": json.dumps(
                            {
                                "selected_option": positions[selected],
                                "selected_label": "1" if label == "mismatch" else label,
                                "explanation": "Authored software test response.",
                            }
                        ),
                    },
                }
            ],
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        }
        return httpx.Response(200, json=payload, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx.AsyncClient, "post", response)
    p = engine.p
    operation = p.grade(p.CASES[0], "The value is 12.", "D1", {"raw_responses": []}, seed=20260927)
    if label == "mismatch":
        with pytest.raises(ValueError, match="label/position mismatch"):
            asyncio.run(operation)
    else:
        result = asyncio.run(operation)
        assert result["label_position_consistency"] == "passed"
        if label == "Cannot assess":
            assert result["status"] == "judge_abstain"
            assert result["raw_score"] is None
        else:
            assert result["raw_score"] == 4
            assert result["partial_anchors"] and result["unanchored_score"]


def test_cached_answer_is_reused_and_changed_input_is_rejected(engine):
    p = engine.p
    payload = {"question": "Repeat 12."}
    saved = {"status": "success", "input_hash": p.digest(payload), "output": {"answer": "12"}}
    p.write(p.OUT / "operations/SAMPLE.generate.json", saved)

    async def unexpected_request(capture):
        raise AssertionError("A saved operation must not make another request")

    assert asyncio.run(p.operate("SAMPLE.generate", payload, unexpected_request)) == saved
    with pytest.raises(ValueError, match="input changed"):
        asyncio.run(p.operate("SAMPLE.generate", {"question": "Repeat 13."}, unexpected_request))
    assert not list((p.OUT / "attempts").iterdir())


def test_numeric_audit_rejects_a_future_observation(engine):
    expected = {"cutoff": "2020-01-01T10:00:00", "trend_observation_ids": ["A"], "value": 12}
    unit = {"numeric_expected": expected, "excluded_observation_ids": ["B"]}
    audit = engine.e.numeric_audit
    assert audit(unit, "NUMERIC_SUMMARY: " + json.dumps(expected))["status"] == "passed"
    future = {**expected, "trend_observation_ids": ["A", "B"]}
    result = audit(unit, "NUMERIC_SUMMARY: " + json.dumps(future))
    assert result["status"] == "failed"
    assert not result["checks"]["no_unavailable_observation_ids"]


def test_offline_guard_allows_event_loop_wakeup_but_blocks_provider_connections(
    engine, monkeypatch
):
    # Exercise the TCP socketpair used on Windows, even when running on Unix.
    monkeypatch.setattr(socket, "socketpair", socket._fallback_socketpair)

    async def local_work():
        return "ready"

    with asyncio.Runner() as runner:
        assert runner.run(local_work()) == "ready"

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as connection:
        with pytest.raises(AssertionError, match="must not connect to a provider"):
            connection.connect(("192.0.2.1", 443))


def test_public_scores_and_accounting_reconcile():
    scores = json.loads((MODULE / "results/score_table.json").read_text())
    summary = json.loads((MODULE / "results/extension_summary.json").read_text())
    assert len(scores) == summary["numeric_baseline"] == 93
    assert len({(r["unit"], r["criterion"]) for r in scores}) == 93
    assert len({r["unit"] for r in scores}) == 16
    assert len({r["parent"] for r in scores}) == 7
    fields = {
        "unit",
        "parent",
        "criterion",
        "condition",
        "status",
        "raw_score",
        "partial_anchors",
        "unanchored_score",
        "label_position_consistency",
    }
    assert all(set(row) == fields and row["condition"] == "baseline" for row in scores)
    assert Counter(str(r["raw_score"]) for r in scores) == summary["score_distribution"]
    total = summary["total"]
    assert total["prompt_tokens"] + total["completion_tokens"] == total["total_tokens"]
    assert sum(p["total_tokens"] for p in summary["by_phase"].values()) == total["total_tokens"]
    assert total["unknown_usage"] == 6
