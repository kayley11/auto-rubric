"""Check the authored record references and actual AutoRubric response mapping offline."""

import asyncio
import importlib.util
import json
import re
from collections import Counter
from pathlib import Path

import httpx
import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "judge_checks/run.py"
spec = importlib.util.spec_from_file_location("judge_checks", SCRIPT)
checks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checks)


def test_references_switch_when_task_or_evidence_changes():
    cases = {c["id"]: c for c in checks.fixtures()}
    # Independently calculated expected answers, not another call to the oracle.
    expected = {
        "T01.A": {"value": 120, "evidence": ["E2"]},
        "T01.B": {"value": 90, "evidence": ["E1"]},
        "T02.A": {"value": 5, "evidence": ["E1"]},
        "T02.B": {"unsupported": True},
        "T03.A": {"value": 11, "evidence": ["E2"]},
        "T03.B": {"unsupported": True},
        "T04.A": {"value": 100, "evidence": ["E1"]},
        "T04.B": {"value": 100, "evidence": ["E2"]},
        "T05.A": {"value": 60, "evidence": ["E1", "E2"]},
        "T05.B": {"value": -30, "evidence": ["E2", "E3"]},
        "T06.A": {"unsupported": True},
        "T06.B": {"value": 100, "evidence": ["E1", "E2"], "estimated": True},
    }
    assert len(cases) == 24
    assert Counter(c["expected_label"] for c in cases.values()) == {
        "Meets": 12,
        "Does not meet": 12,
    }
    for prefix, answer in expected.items():
        cells = [cases[f"{prefix}.a{i}"] for i in (1, 2)]
        assert all(c["expected"] == answer for c in cells)
        assert {c["expected_label"] for c in cells} == {"Meets", "Does not meet"}
    for family in (f"T{i:02}" for i in range(1, 7)):
        for i in (1, 2):
            assert cases[f"{family}.A.a{i}"]["answer"] == cases[f"{family}.B.a{i}"]["answer"]
            assert (
                cases[f"{family}.A.a{i}"]["expected_label"]
                != cases[f"{family}.B.a{i}"]["expected_label"]
            )


def test_prompt_comparison_does_not_supply_expected_answers():
    operations = checks.objective_operations(checks.fixtures())
    assert len(operations) == 48
    for first, second in zip(operations[::2], operations[1::2], strict=True):
        assert first["answer"] == second["answer"]
        assert first["query"] == second["query"]
        assert first["criterion"] == second["criterion"]
        assert first["system"] != second["system"]
        assert "expected_label" not in first["query"]
        assert "task_spec" not in first["query"]


@pytest.mark.parametrize("label", ["Meets", "Does not meet", "Cannot assess", "mismatch"])
def test_actual_grader_mapping_and_guard(monkeypatch, label):
    seen = []

    async def fake_post(self, url, **kwargs):
        seen.append(kwargs["json"])
        prompt = kwargs["json"]["messages"][-1]["content"]
        options = re.search(r"<options>\s*(.*?)\s*</options>", prompt, re.S).group(1)
        positions = {m[2]: int(m[1]) for m in re.finditer(r"^(\d+)\. (.+)$", options, re.M)}
        selected = "Meets" if label == "mismatch" else label
        raw = {
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
                                "selected_label": "Does not meet" if label == "mismatch" else label,
                                "explanation": "Offline fixture.",
                            }
                        ),
                        "reasoning_content": "Must not be saved.",
                    },
                }
            ],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15},
        }
        return httpx.Response(200, json=raw, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    op = checks.objective_operations(checks.fixtures())[0]
    capture = {}
    config = {
        "model": "fixture",
        "temperature": 0.7,
        "top_p": 0.8,
        "max_tokens": 512,
        "timeout": 1,
        "reasoning_effort": "low",
    }
    operation = checks.judge(
        op, config, "https://offline.invalid/v1", "offline-placeholder", capture
    )
    if label == "mismatch":
        with pytest.raises(ValueError, match="displayed position disagree"):
            asyncio.run(operation)
    else:
        result = asyncio.run(operation)
        assert result["label"] == label
        assert result["reason"].removeprefix("default: ") == "Offline fixture."
    assert len(seen) == 1
    assert "reasoning_content" not in json.dumps(capture)
    assert "expected_label" not in json.dumps(seen)


def test_published_judgments_reconcile_with_inputs_and_summary():
    directory = SCRIPT.parent
    results = checks.read(directory / "objective_results.json")
    summary = checks.read(directory / "summary.json")
    operations = {o["id"]: o for o in checks.objective_operations(checks.fixtures())}
    assert len(results) == len(operations) == 48
    assert {r["id"] for r in results} == set(operations)
    for row in results:
        assert row["expected"] == operations[row["id"]]["expected_label"]
        assert row["correct"] == (row["expected"] == row["selected"])
    for arm in ["baseline", "evidence_check"]:
        subset = [r for r in results if r["prompt"] == arm]
        assert sum(r["correct"] for r in subset) == summary["objective"][arm]["correct"]
    assert summary["completed"] == summary["planned"] == 96
    assert summary["resources"]["attempts"] == 96 + summary["resources"]["failed_attempts"]
    assert summary["resources"]["known_tokens"] == (
        summary["resources"]["prompt_tokens"] + summary["resources"]["completion_tokens"]
    )
