"""Source review reads exact saved versions without generating or rescoring."""

import hashlib
import json
from types import SimpleNamespace

import pytest
from source_evidence import case_source_evidence


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False))


@pytest.fixture
def sample(tmp_path):
    public = tmp_path / "public"
    root = tmp_path / "workspace"
    app = SimpleNamespace(
        cases=SimpleNamespace(root=root / "_cases"),
        literature=SimpleNamespace(root=root / "_literature"),
    )
    url = "https://casereports.bmj.com/content/19/10/e000001"
    text = "🙂 Patient reports diarrhoea.\n\nA biopsy later confirmed the diagnosis."
    fingerprint = hashlib.sha256(text.encode()).hexdigest()
    source = {
        "id": "1" * 24,
        "text": text,
        "text_sha256": fingerprint,
        "title": "Saved paper",
        "kind": "html",
        "url": url,
        "doi": "10.1136/bcr-2026-000001",
        "private_path": "/private/do-not-export",
        "quality_notes": [],
        "blocks": [
            {
                "id": "p-1",
                "text": text,
                "start": 0,
                "end": len(text),
                "start_utf16": 0,
                "end_utf16": len(text.encode("utf-16-le")) // 2,
                "section": "Case",
                "private_path": "/private/do-not-export",
            }
        ],
    }
    quote = "Patient reports diarrhoea."
    start = text.index(quote)
    item = {
        "id": "F001",
        "text": quote,
        "source_quote": quote,
        "grounding": "exact",
        "visibility": "visible",
        "position": {
            "start": start,
            "end": start + len(quote),
            "start_utf16": len(text[:start].encode("utf-16-le")) // 2,
            "end_utf16": len(text[: start + len(quote)].encode("utf-16-le")) // 2,
        },
    }
    later = {
        "id": "F002",
        "text": "A biopsy later confirmed the diagnosis.",
        "source_quote": "A biopsy later confirmed the diagnosis.",
        "visibility": "hidden",
        "grounding": "unmatched",
        "position": None,
    }
    draft = {
        "id": "2" * 24,
        "source_id": source["id"],
        "source_sha256": fingerprint,
        "status": "ready",
        "revision": 1,
        "created_at": "2026-11-14T00:00:00Z",
        "items": [item, later],
        "decision_point": "Before biopsy",
    }
    write(root / "_literature/sources" / (source["id"] + ".json"), source)
    write(root / "_literature/drafts" / (draft["id"] + ".json"), draft)
    write(
        public / "cases/index.json",
        {
            "cases": [
                {
                    "id": "B03",
                    "source": url,
                    "source_location": "Case presentation",
                    "source_note": "Paraphrased task",
                },
                {"id": "C01", "source": "Book case"},
            ]
        },
    )
    write(
        public / "full-rubric-review/B03.json",
        {"initial_facts": quote, "task": "Assess the supplied information."},
    )
    return app, public, source, draft


def load_sample(sample, case="B03", draft_id=""):
    app, public, _, _ = sample
    return case_source_evidence(app, case, draft_id, public_root=public)


def test_source_links_are_exact_and_do_not_assert_adaptation_confirmation(sample):
    result = load_sample(sample)
    assert result["status"] == "available"
    assert result["binding"] == "same_article_only"
    assert result["link_status"] == "awaiting review"
    assert result["clinical_reference_status"] == "awaiting confirmation"
    assert result["items"][0]["quoted_in_saved_input"]
    assert result["items"][0]["position"]["start_utf16"] == 3
    assert result["items"][1]["visibility"] == "hidden"
    assert not result["items"][1]["quoted_in_saved_input"]
    assert result["items"][1]["position"] is None
    assert "/private/" not in json.dumps(result)


def test_no_mapping_keeps_source_metadata_without_inventing_passages(sample):
    result = load_sample(sample, "C01")
    assert result["status"] == "no_mapping"
    assert result["source"] is None
    assert result["items"] == []
    assert result["case"]["source"] == "Book case"


def test_source_hash_or_saved_interval_mismatch_is_not_silently_repaired(sample):
    app, _, source, draft = sample
    draft["items"][0]["position"]["start_utf16"] = 0
    write(app.literature.root / "drafts" / (draft["id"] + ".json"), draft)
    assert load_sample(sample)["items"][0]["position"] is None
    source["text"] += "Changed text"
    write(app.literature.root / "sources" / (source["id"] + ".json"), source)
    result = load_sample(sample)
    assert result["status"] == "no_mapping"
    assert result["unavailable_source_versions"] == 1


def test_another_cases_draft_and_path_traversal_are_rejected(sample):
    with pytest.raises(FileNotFoundError):
        load_sample(sample, "C01", "2" * 24)
    with pytest.raises(ValueError):
        load_sample(sample, "../../secrets")
    with pytest.raises(ValueError):
        load_sample(sample, "B03", "../secrets")


def test_pdf_is_resolved_through_a_saved_explicit_url_to_doi_link(sample):
    app, _, source, draft = sample
    pdf = {**source, "id": "3" * 24, "kind": "pdf", "url": None}
    pdfdraft = {
        **draft,
        "id": "4" * 24,
        "source_id": pdf["id"],
        "created_at": "2026-11-14T01:00:00Z",
    }
    write(app.literature.root / "sources" / (pdf["id"] + ".json"), pdf)
    write(app.literature.root / "drafts" / (pdfdraft["id"] + ".json"), pdfdraft)
    result = load_sample(sample)
    assert len(result["choices"]) == 2
    assert result["source"]["kind"] == "pdf"
    assert load_sample(sample, draft_id=draft["id"])["source"]["kind"] == "html"


def test_confirmed_workspace_provenance_stays_bound_to_its_original_source(sample):
    app, _, source, draft = sample
    record = {
        "id": "workspace-record",
        "input": {
            "case_code": "CASE-ONE",
            "facts": "Saved supplied case",
            "task": "Saved task",
            "source": "Uploaded PDF",
        },
        "literature_sources": [
            {
                "draft_id": draft["id"],
                "source_id": source["id"],
                "source_text_sha256": source["text_sha256"],
            }
        ],
    }
    write(app.cases.root / "one.json", record)
    result = load_sample(sample, "workspace-record")
    assert result["binding"] == "confirmed_case_provenance"
    assert result["case"]["case_id"] == "CASE-ONE"
    assert result["case"]["facts"] == "Saved supplied case"
    assert not result["items"][0]["quoted_in_saved_input"]


def test_reading_evidence_does_not_write_or_change_saved_cases_or_drafts(sample):
    app, public, _, _ = sample

    def hashes():
        return {
            str(p): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in public.parent.rglob("*")
            if p.is_file()
        }

    before = hashes()
    case_source_evidence(app, "B03", public_root=public)
    assert hashes() == before


def test_incomplete_block_metadata_keeps_full_text_without_inventing_page_locations(sample):
    app, _, source, _ = sample
    source["blocks"][0]["text"] = "An incorrect displayed paragraph"
    write(app.literature.root / "sources" / (source["id"] + ".json"), source)
    result = load_sample(sample)
    assert result["source"]["blocks"][0]["text"] == source["text"]
    assert not result["source"]["block_locations_valid"]
    assert "page" not in result["source"]["blocks"][0]
    assert result["items"][0]["position"]


def test_automatic_archive_links_cannot_be_reused_for_another_case(sample):
    app, _, _, draft = sample
    draft.update(origin="archived-passages-v1", case_id="C01")
    write(app.literature.root / "drafts" / (draft["id"] + ".json"), draft)
    assert load_sample(sample)["status"] == "no_mapping"


def test_a_changed_saved_case_invalidates_its_automatic_archive_links(sample):
    app, _, _, draft = sample
    draft.update(origin="archived-passages-v1", case_id="B03", case_facts_sha256="0" * 64)
    write(app.literature.root / "drafts" / (draft["id"] + ".json"), draft)
    result = load_sample(sample)
    assert result["status"] == "no_mapping"
    assert result["unavailable_source_versions"] == 1


def test_missing_source_reason_is_available_without_exposing_private_archive_paths(sample):
    app, _, _, _ = sample
    write(
        app.literature.root / "case_mappings/C01.json",
        {
            "case_id": "C01",
            "status": "missing_full_text",
            "reason": "Full book text is not in the saved archive.",
            "source_archive": "/private/never-export",
        },
    )
    result = load_sample(sample, "C01")
    assert result["mapping_record"]["status"] == "missing_full_text"
    assert "Full book text" in result["mapping_record"]["reason"]
    assert "/private/" not in json.dumps(result)


def test_read_only_case_passages_are_separate_from_model_extraction_drafts(sample):
    app, _, _, draft = sample
    draft.update(origin="archived-passages-v1", case_id="B03")
    write(app.literature.root / "case_passages" / (draft["id"] + ".json"), draft)
    (app.literature.root / "drafts" / (draft["id"] + ".json")).unlink()
    result = load_sample(sample)
    assert result["status"] == "available"
    assert result["draft"]["origin"] == "archived-passages-v1"


def test_source_route_requires_membership_and_preserves_exact_text(tmp_path, monkeypatch):
    import threading

    import httpx
    import source_evidence
    from engine import Settings
    from public_access import COOKIE_NAME, password_hash, sign_session
    from public_server import HostedServer

    password = password_hash("test-only-password")
    accounts = json.dumps(
        [
            {"id": "editor", "role": "admin", "password_hash": password},
            {"id": "reader", "role": "reviewer", "workspace": "editor", "password_hash": password},
        ]
    )
    secret = "test-only-secret-with-more-than-32-characters"
    server = HostedServer(
        ("127.0.0.1", 0),
        tmp_path,
        "http://127.0.0.1:0",
        accounts,
        secret,
        Settings("test-only-placeholder", "https://offline.invalid/v1"),
    )
    server.public_origin = f"http://127.0.0.1:{server.server_port}"
    calls = []
    payload = {"source": {"text": "Josh's exact source wording. 🙂"}}

    def linked_source(app, identifier, draft_id):
        assert app is server.apps["editor"]
        calls.append((identifier, draft_id))
        return payload

    monkeypatch.setattr(source_evidence, "case_source_evidence", linked_source)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    route = "/api/literature/cases/B03/source-evidence?draft_id=" + "2" * 24
    try:
        with httpx.Client(base_url=server.public_origin, trust_env=False) as client:
            assert client.get(route).status_code == 403
            assert not calls
            client.cookies.set(COOKIE_NAME, sign_session(server.users["reader"], secret))
            assert client.get(route).json() == payload
            assert calls == [("B03", "2" * 24)]
            assert client.post(route, json={}).status_code == 403
            assert len(calls) == 1
    finally:
        server.shutdown()
        server.server_close()
        thread.join(2)
