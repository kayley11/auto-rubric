"""Exercise the public export used by anonymous and offline review browsing."""

# ruff: noqa: E402 -- Standalone application modules.

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from hosting.prepare_site import prepare


def test_every_exported_review_opens_without_exposing_examiner_or_machine_data(tmp_path):
    manifest = tmp_path / ".openai/hosting.json"
    manifest.parent.mkdir()
    manifest.write_text(json.dumps({"project_id": "test-only-site"}), encoding="utf-8")
    prepare(tmp_path)
    public = tmp_path / "public/_public"
    routes = json.loads((public / "manifest.json").read_text(encoding="utf-8"))

    def body(route):
        return json.loads((public / routes[route]["file"]).read_text(encoding="utf-8"))

    catalogue = body("/api/review")
    assert catalogue
    for row in catalogue:
        route = f"/api/review/{row['id']}"
        packet = body(route)
        first_item = packet["available_items"][0]
        assert packet == body(route + "/" + first_item)
        assert packet["criterion"] == first_item
        assert packet["answer"]
        assert packet["rule"]["name"]
        assert packet["review"] is None
        assert route + "/D5c" not in routes
        assert not {
            "scores",
            "grades",
            "model",
            "model_identity",
            "requirements",
            "inventory",
            "availability",
            "closing_notes",
        }.intersection(packet)
        if first_item == "D3a":
            assert "reference" not in packet
            assert all("notes" not in turn for turn in packet["turns"])

    assert body("/api/runs") == []
    config = body("/api/config")
    assert not config["access"]["authenticated"]
    assert not config["access"]["online"]
    assert not config["settings"]["configured"]
