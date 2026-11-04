"""Public comparison data must preserve saved grades without leaking API records."""

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import comparison


@pytest.fixture(autouse=True)
def isolated_additional_source(tmp_path, monkeypatch):
    monkeypatch.setattr(comparison, "QWEN_SOURCE", tmp_path / "no-additional-source.json")


@pytest.fixture
def study_source(tmp_path):
    public = comparison.SNAPSHOTS
    records = [
        json.loads(p.read_text(encoding="utf-8"))
        for p in sorted(public.glob("*.json"))
        if p.stem != "index" and not p.stem.startswith(("B", "J", "SR"))
    ]
    assert len(records) == 33
    cases = [
        {
            **c,
            "criteria": [item["id"] for item in c["criteria"]],
            "source": c["source_url"],
            "requirements": c["requirements"],
        }
        for c in records
    ]
    protocol = {
        "id": "test-study",
        "answer_models": [
            {"id": m["id"], "model": m["model_id"], "service": m["service"]}
            for m in records[0]["models"]
            if m["id"] != "qwen38-groq"
        ],
        "judge_model": "arc:apex",
        "rules": "test snapshot",
        "max_questions": 6,
        "planned_final_answers": 165,
        "planned_item_ratings": 1005,
    }
    criteria = {c["id"]: c for r in records for c in r["criteria"]}
    for name, value in {
        "cases.json": cases,
        "protocol.json": protocol,
        "rubric_snapshot.json": {"version": "test-v1", "criteria": list(criteria.values())},
        "COLLECTION_EVENTS.json": [
            {
                "phase": "generation",
                "case": "C01",
                "model": "gemma4-free",
                "status": "deferred",
                "reason": "private provider error",
            }
        ],
        "answers/kcl-lite/C01.json": {
            "status": "complete",
            "final_answer": "Original answer.",
            "turns": [],
        },
        "grades/kcl-lite/C01.D3a.json": {
            "status": "complete",
            "result": {"label": "4", "score": 4, "reason": "Original explanation."},
            "attempts": [
                {"headers": {"Authorization": "Bearer test-secret"}, "user_id": "private-account"}
            ],
        },
    }.items():
        path = tmp_path / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value))
    return tmp_path


def test_scores_are_exact_and_pending_is_not_zero(study_source):
    data = comparison.build_case(study_source, "C01")
    assert len(data["models"]) == 5
    lite = data["models"][0]
    score = next(s for s in lite["scores"] if s["item"] == "D3a")
    assert score == {
        "item": "D3a",
        "status": "complete",
        "label": "4",
        "score": 4,
        "reason": "Original explanation.",
    }
    assert lite["answer"] == "Original answer."
    assert data["models"][3]["answer_status"] == "rate_limited"
    assert data["models"][4]["answer_status"] == "queued"
    assert all(s["score"] is None for s in data["models"][4]["scores"])
    text = json.dumps(data)
    for private in ("test-secret", "private-account", "Authorization", "private provider error"):
        assert private not in text
    assert data["clinical_status"] == data["requirements_status"] == "awaiting confirmation"


def test_snapshots_are_portable_and_live_source_updates(study_source, tmp_path, monkeypatch):
    destination = tmp_path / "portable"
    index = comparison.export(study_source, destination)
    assert len(index["cases"]) == 33
    assert index["answers_complete"] == 1
    assert index["ratings_complete"] == 1
    monkeypatch.setattr(comparison, "SNAPSHOTS", destination)
    monkeypatch.setattr(comparison, "SOURCE", tmp_path / "missing-pointer.json")
    monkeypatch.setattr(comparison, "BMJ_SOURCE", tmp_path / "missing-bmj-pointer.json")
    monkeypatch.setattr(comparison, "SUPPLIED_SOURCE", tmp_path / "missing-supplied-pointer.json")
    monkeypatch.setattr(comparison, "SERIES_SOURCE", tmp_path / "missing-series-pointer.json")
    assert comparison.dataset("C01")["source"] == "snapshot"
    pointer = tmp_path / "pointer.json"
    pointer.write_text(json.dumps({"run_dir": str(study_source)}))
    monkeypatch.setattr(comparison, "SOURCE", pointer)
    path = study_source / "grades/kcl-lite/C01.D3a.json"
    path.write_text(
        json.dumps(
            {
                "status": "complete",
                "result": {"label": "2", "score": 2, "reason": "New saved grade."},
            }
        )
    )
    live = comparison.dataset("C01")
    assert live["source"] == "live"
    assert next(s for s in live["models"][0]["scores"] if s["item"] == "D3a")["label"] == "2"
    assert comparison.dataset()["ratings_complete"] == 1
    with pytest.raises(ValueError):
        comparison.dataset("../../private")


def test_series_cohort_has_its_own_source_and_keeps_five_model_statuses(
    study_source, tmp_path, monkeypatch
):
    cases = json.loads((study_source / "cases.json").read_text(encoding="utf-8"))[:1]
    cases[0].update(id="SR01", task_type="Clinical assessment")
    (study_source / "cases.json").write_text(json.dumps(cases))
    protocol = json.loads((study_source / "protocol.json").read_text(encoding="utf-8"))
    protocol.update(
        id="series-test",
        planned_final_answers=5,
        planned_item_ratings=5 * len(cases[0]["criteria"]),
    )
    (study_source / "protocol.json").write_text(json.dumps(protocol))
    for folder, old, new in [
        ("answers/kcl-lite", "C01.json", "SR01.json"),
        ("grades/kcl-lite", "C01.D3a.json", "SR01.D3a.json"),
    ]:
        (study_source / folder / old).rename(study_source / folder / new)
    (study_source / "COLLECTION_EVENTS.json").write_text(
        json.dumps(
            [{"phase": "generation", "case": "SR01", "model": "gemma4-free", "status": "deferred"}]
        )
    )
    destination = tmp_path / "series-snapshots"
    monkeypatch.setattr(comparison, "SERIES_SOURCE", tmp_path / "series-pointer.json")
    monkeypatch.setattr(comparison, "SOURCE", tmp_path / "missing-original.json")
    monkeypatch.setattr(comparison, "BMJ_SOURCE", tmp_path / "missing-bmj.json")
    monkeypatch.setattr(comparison, "SUPPLIED_SOURCE", tmp_path / "missing-supplied.json")
    comparison.export(study_source, destination, register=True)
    monkeypatch.setattr(comparison, "SNAPSHOTS", destination)
    data = comparison.dataset("SR01")
    assert data["study_id"] == "series-test"
    assert data["task_type"] == "Clinical assessment"
    assert len(data["models"]) == 5
    assert data["models"][0]["answer"] == "Original answer."
    assert data["models"][3]["answer_status"] == "rate_limited"
    assert all(s["score"] is None for s in data["models"][3]["scores"])
    assert data["clinical_status"] == data["requirements_status"] == "awaiting confirmation"
    assert comparison.dataset()["case_count"] == 1
    with pytest.raises(ValueError):
        comparison.dataset("SR11")


def test_additional_qwen_preserves_originals_and_excludes_private_envelopes(
    study_source, tmp_path, monkeypatch
):
    import shutil

    original = comparison.build_case(study_source, "C01")
    root = tmp_path / "qwen"
    target = root / "cohorts/earlier33"
    shutil.copytree(study_source, target)
    protocol = comparison.read(target / "protocol.json")
    protocol.update(
        id="qwen-test",
        answer_models=[{"id": "qwen38-groq", "model": "qwen/qwen3.8-27b", "service": "groq"}],
        planned_final_answers=33,
        planned_item_ratings=201,
    )
    (target / "protocol.json").write_text(json.dumps(protocol))
    (target / "GRADE_SELECTION.json").write_text(
        json.dumps({"relative_directory": "clean_scoring/grades", "condition": "retained"})
    )
    (target / "answers/qwen38-groq").mkdir(parents=True)
    (target / "grades/qwen38-groq").mkdir(parents=True)
    (target / "answers/qwen38-groq/C01.json").write_text(
        json.dumps(
            {
                "status": "complete",
                "final_answer": "Saved Qwen answer.",
                "turns": [],
                "headers": {"Authorization": "Bearer private-key"},
            }
        )
    )
    (target / "grades/qwen38-groq/C01.D3a.json").write_text(
        json.dumps(
            {
                "status": "complete",
                "result": {"label": "3", "score": 3, "reason": "Saved Qwen reason."},
                "attempts": [{"token": "private-key"}],
            }
        )
    )
    comparison.QWEN_SOURCE.write_text(json.dumps({"run_dir": str(root)}))
    result = comparison.with_qwen(original)
    assert result["models"][:5] == original["models"]
    assert len(result["models"]) == 6
    qwen = result["models"][-1]
    assert qwen["answer"] == "Saved Qwen answer."
    assert next(s for s in qwen["scores"] if s["item"] == "D3a")["score"] == 3
    assert qwen["supplemental"] and qwen["study_id"] == "qwen-test"
    assert "private-key" not in json.dumps(result)
    mismatch = comparison.with_qwen({**original, "task": "A different task"})
    assert len(mismatch["models"]) == 5
    assert "different saved setup" in mismatch["additional_model_notice"]
