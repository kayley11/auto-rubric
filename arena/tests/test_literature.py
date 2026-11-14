"""Grounding, visibility and access checks; no clinical grades are assumed."""

import copy
import io
import json
import sys
import threading
import time
from pathlib import Path
from types import SimpleNamespace

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from article_sources import assemble, from_html, from_pdf, public_url, sha, utf16
from engine import Settings, generation_messages
from literature import LiteratureStore, normalise_extractions
from public_access import COOKIE_NAME, password_hash, sign_session
from public_server import HostedServer
from workspace_cases import WorkspaceCases


def source_fixture():
    blocks = [
        {"tag": "h2", "text": "Case presentation"},
        {
            "text": "On day 1 the patient reported breathlessness. Creatinine was 90 µmol/L. "
            "No earlier creatinine measurement was documented. "
            + "Earlier notes were unavailable. "
            * 7
        },
        {"tag": "h2", "text": "Outcome and follow-up"},
        {"text": "Symptoms resolved after treatment on day 12."},
    ]
    text, blocks = assemble(blocks)
    return {
        "id": "a" * 24,
        "text": text,
        "blocks": blocks,
        "text_sha256": sha(text),
        "title": "SOURCE_TITLE_WITH_FINAL_DIAGNOSIS",
        "url": "https://example.org/case",
    }


class ModelFixture:
    settings = Settings("test-only-placeholder", "https://offline.invalid/v1")

    async def completion(self, payload, capture):
        content = json.dumps(
            {
                "extractions": [
                    {
                        "case_fact": "On day 1 the patient reported breathlessness.",
                        "case_fact_attributes": {
                            "category": "symptom",
                            "visibility": "visible",
                            "time_label": "day 1",
                            "patient_group": "Patient 1",
                        },
                    },
                    {
                        "case_fact": "No earlier creatinine measurement was documented.",
                        "case_fact_attributes": {
                            "category": "context",
                            "visibility": "uncertain",
                            "patient_group": "Patient 1",
                        },
                    },
                    {
                        "case_fact": "Symptoms resolved after treatment on day 12.",
                        "case_fact_attributes": {
                            "category": "outcome",
                            "visibility": "visible",
                            "patient_group": "Patient 1",
                        },
                    },
                    {
                        "case_fact": "Invented absent measurement: 123456789.",
                        "case_fact_attributes": {
                            "visibility": "visible",
                            "patient_group": "Patient 1",
                        },
                    },
                ]
            }
        )
        raw = {"choices": [{"message": {"content": content}, "finish_reason": "stop"}]}
        capture["response"] = raw
        return raw


def store_fixture(tmp_path):
    pytest.importorskip("langextract", reason="Install arena/requirements-extraction.txt")
    app = SimpleNamespace(
        directory=tmp_path,
        settings=ModelFixture.settings,
        provider=ModelFixture(),
        job_lock=threading.Lock(),
        cases=WorkspaceCases(tmp_path),
    )
    store = LiteratureStore(app)
    source = source_fixture()
    store.write(store.path("sources", source["id"]), source)
    draft = store.start(
        {
            "source_id": source["id"],
            "decision_point": "Initial assessment before HIDDEN_FINAL_DIAGNOSIS",
            "source_checked": True,
        }
    )
    deadline = time.monotonic() + 10
    while draft["status"] == "extracting" and time.monotonic() < deadline:
        time.sleep(0.03)
        draft = store.load("drafts", draft["id"])
    assert draft["status"] == "ready", draft
    return store, source, draft


def edit_body(draft):
    return {
        "revision": draft["revision"],
        "items": [{k: i[k] for k in ["id", "text", "visibility"]} for i in draft["items"]],
        "task": draft["task"],
        "visible_context": "Initial review of breathlessness.",
        "reference": "JUDGE_ONLY_REFERENCE",
        "facts_task_checked": True,
        "visibility_checked": True,
        "case_submission": {
            "contributor_id": "Test01",
            "batch_id": "test_article_batch",
            "batch_name": "Test article",
        },
    }


def test_exact_grounding_and_included_hidden_boundaries(tmp_path):
    store, source, draft = store_fixture(tmp_path)
    assert len(draft["items"]) == 4
    exact = [i for i in draft["items"] if i["grounding"] == "exact"]
    assert len(exact) == 3
    for item in exact:
        p = item["position"]
        assert source["text"][p["start"] : p["end"]] == item["source_quote"]
    outcome = next(i for i in draft["items"] if i["category"] == "outcome")
    assert outcome["visibility"] == "hidden"  # model proposed visible; source/type safeguard wins
    unmatched = next(i for i in draft["items"] if i["grounding"] == "unmatched")
    assert unmatched["visibility"] == "exclude"
    body = edit_body(draft)
    with pytest.raises(ValueError, match="Needs review"):
        store.update(draft["id"], body, confirm=True)
    assert not list(store.app.cases.root.glob("*.json"))
    for item in body["items"]:
        if item["visibility"] == "uncertain":
            item["visibility"] = "visible"
    bad = copy.deepcopy(body)
    next(i for i in bad["items"] if i["id"] == unmatched["id"])["visibility"] = "visible"
    with pytest.raises(ValueError, match="unmatched"):
        store.update(draft["id"], bad, confirm=True)
    saved = store.update(draft["id"], body, confirm=True)
    messages = json.dumps(generation_messages({**saved["case"], "evaluation_mode": "written"}))
    assert "breathlessness" in messages
    for hidden in [
        "day 12",
        "HIDDEN_FINAL_DIAGNOSIS",
        "SOURCE_TITLE_WITH_FINAL_DIAGNOSIS",
        "JUDGE_ONLY_REFERENCE",
        "123456789",
    ]:
        assert hidden not in messages
    assert saved["draft"]["reference_status"] == "awaiting confirmation"
    record = json.loads(next(store.app.cases.root.glob("*.json")).read_text())
    assert record["literature_sources"][0]["source_text_sha256"] == source["text_sha256"]
    assert record["reference_status"] == "awaiting confirmation"
    assert store.update(draft["id"], body, confirm=True)["case"] == saved["case"]
    assert len(list(store.app.cases.root.glob("*.json"))) == 1
    assert store.output(draft["id"])["calls"][0]["response"]["choices"]


def test_revision_saves_do_not_create_cases_or_overwrite_a_concurrent_edit(tmp_path):
    store, _, draft = store_fixture(tmp_path)
    body = edit_body(draft)
    result = store.update(draft["id"], body)
    assert result["draft"]["revision"] == 1
    assert not list(store.app.cases.root.glob("*.json"))
    assert (store.root / "versions" / draft["id"] / "revision_0000.json").exists()
    with pytest.raises(ValueError, match="another view"):
        store.update(draft["id"], body)
    with pytest.raises(ValueError, match="Invalid article"):
        store.load("sources", "../../private")


def test_missing_facts_can_only_be_added_as_locatable_source_quotes(tmp_path):
    store, source, draft = store_fixture(tmp_path)
    body = {**edit_body(draft), "quote": "Creatinine was 90 µmol/L."}
    result = store.add_quote(draft["id"], body)["draft"]
    item = result["items"][-1]
    assert item["origin"] == "reviewer_added_exact_quote"
    assert item["visibility"] == "uncertain"
    assert source["text"][item["position"]["start"] : item["position"]["end"]] == body["quote"]
    assert not list(store.app.cases.root.glob("*.json"))
    with pytest.raises(ValueError, match="not found"):
        store.add_quote(
            draft["id"], {**edit_body(result), "quote": "The result was normal (invented)."}
        )


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/test",
        "http://[::1]/",
        "http://10.0.0.1/",
        "http://169.254.169.254/",
        "https://localhost/a",
        "https://x.local/",
        "file:///etc/passwd",
        "https://user:password@example.org/x",
        "https://example.org:8766/",
    ],
)
def test_only_public_article_urls(url):
    with pytest.raises(ValueError):
        public_url(url, resolve=False)


def test_non_bmp_unicode_positions_and_fulltext_requirement():
    pytest.importorskip("bs4", reason="Install arena/requirements-extraction.txt")
    text, blocks = assemble([{"text": "🧪 Initial finding µmol/L. " + "clinical text " * 25}])
    assert utf16(text, 1) == 2
    assert blocks[0]["end_utf16"] == len(text.encode("utf-16-le")) // 2
    with pytest.raises(ValueError):
        from_html(b"<article><h2>Abstract</h2><p>A short preview.</p></article>")
    with pytest.raises(ValueError):
        from_html(
            (
                "<article><h2>Abstract</h2><p>"
                + "A patient received treatment. " * 100
                + "</p></article>"
            ).encode()
        )


def test_chunk_context_quotes_are_recovered_only_by_unique_literal_matching():
    source = source_fixture()
    quote = "Creatinine was 90 µmol/L."

    def unit(text):
        return SimpleNamespace(
            extraction_class="case_fact",
            extraction_text=text,
            char_interval=None,
            attributes={},
            alignment_status=None,
        )

    result = SimpleNamespace(
        extractions=[unit(quote), unit(quote), unit("Creatinine was 91 µmol/L.")]
    )
    items = normalise_extractions(result, source)
    assert len(items) == 2
    assert items[0]["grounding_method"] == "unique_literal_match"
    assert items[0]["source_quote"] == quote
    assert items[1]["grounding"] == "unmatched"
    source["text"] = source["text"].replace(quote, "Creatinine was\n90 µmol/L.")
    aligned = normalise_extractions(SimpleNamespace(extractions=[unit(quote)]), source)[0]
    assert aligned["grounding_method"] == "unique_whitespace_match"
    assert aligned["source_quote"] == "Creatinine was\n90 µmol/L."


def test_pdf_reader_rejects_image_only_pages():
    pytest.importorskip("pypdf", reason="Install arena/requirements-extraction.txt")
    pytest.importorskip("pymupdf", reason="Install arena/requirements-extraction.txt")
    from pypdf import PdfWriter

    output = io.BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(600, 800)
    writer.write(output)
    with pytest.raises(ValueError, match="OCR"):
        from_pdf(output.getvalue(), "scanned.pdf")


def test_prior_observed_responses_are_not_hidden_just_because_they_are_outcomes():
    quote = "The initial treatment relieved pain before this review."
    text, blocks = assemble(
        [
            {"tag": "h2", "text": "Case presentation"},
            {"text": quote + " Available records only. " * 15},
        ]
    )
    source = {"text": text, "blocks": blocks}
    extraction = SimpleNamespace(
        extraction_class="case_fact",
        extraction_text=quote,
        char_interval=None,
        attributes={"category": "outcome", "visibility": "visible"},
        alignment_status=None,
    )
    assert (
        normalise_extractions(SimpleNamespace(extractions=[extraction]), source)[0]["visibility"]
        == "visible"
    )


def test_protected_sources_are_exact_and_read_only_for_review_accounts(tmp_path):
    encoded = password_hash("test-only-password")
    accounts = json.dumps(
        [
            {"id": "editor", "role": "admin", "password_hash": encoded},
            {"id": "review", "role": "reviewer", "workspace": "editor", "password_hash": encoded},
        ]
    )
    secret = "test-only-secret-with-more-than-32-characters"
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
    source = source_fixture()
    # This string would be rewritten by the general public presentation layer.
    source["text"] += "\nJosh's exact article wording."
    app = server.apps["editor"]
    app.literature.write(app.literature.path("sources", source["id"]), source)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with httpx.Client(
            base_url=server.public_origin, headers={"Origin": server.public_origin}, trust_env=False
        ) as client:
            path = "/api/literature/sources/" + source["id"]
            assert client.get(path).status_code == 403
            client.cookies.set(COOKIE_NAME, sign_session(server.users["review"], secret))
            assert client.get(path).json()["text"] == source["text"]
            assert client.post("/api/literature/drafts", json={}).status_code == 403
    finally:
        server.shutdown()
        server.server_close()
        thread.join(2)
