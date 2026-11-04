"""Workspace JSON must round-trip even with the Windows CP1252 default."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from workspace_cases import WorkspaceCases
from workspace_rules import WorkspaceRules


def test_workspace_stores_keep_unicode_with_a_non_utf8_default(tmp_path, monkeypatch):
    original_write = Path.write_text

    def windows_default(path, data, encoding=None, **kwargs):
        return original_write(path, data, encoding=encoding or "cp1252", **kwargs)

    monkeypatch.setattr(Path, "write_text", windows_default)
    label = "Clinician’s review — β"
    rules = WorkspaceRules(tmp_path / "rules")
    record = rules.save(
        {
            "base_version": "original",
            "label": label,
            "reason": "Preserve the supplied wording.",
            "changes": {"D3a": {"definition": "The patient’s problem — provisional."}},
            "make_default": True,
        },
        {},
        "reviewer-1",
        load_snapshot=lambda _: {"criteria": [{"id": "D3a", "definition": "Old", "anchors": {}}]},
    )
    assert rules.active() == record["id"]
    assert rules.record(record["id"])["label"] == label
    cases = WorkspaceCases(tmp_path / "cases")
    saved = cases.save(
        [
            {
                "case_code": "CASE-UTF8",
                "facts": "The patient’s β result is unknown.",
                "task": "Explain.",
            }
        ]
    )
    assert saved[0]["input"]["facts"] == "The patient’s β result is unknown."
    for path in tmp_path.rglob("*.json"):
        path.read_bytes().decode("utf-8")
