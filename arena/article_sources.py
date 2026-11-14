"""Read article text without mixing it with model-generated case facts."""

from __future__ import annotations

import base64
import hashlib
import io
import ipaddress
import re
import socket
from pathlib import Path
from urllib.parse import urljoin, urlparse

import httpx

MAX_FILE_BYTES = 8 * 1024 * 1024
MAX_TEXT_CHARS = 180000


def sha(data):
    return hashlib.sha256(data if isinstance(data, bytes) else data.encode()).hexdigest()


def utf16(text, index):
    return len(text[:index].encode("utf-16-le")) // 2


def assemble(blocks):
    """Create one immutable canonical text; all intervals address this version."""
    text = ""
    result = []
    section = "Article"
    for n, block in enumerate(blocks):
        value = block.get("text", "").replace("\x00", "").strip()
        if not value:
            continue
        if text:
            text += "\n\n"
        start = len(text)
        text += value
        if block.get("tag", "").lower() in {"h1", "h2", "h3", "h4"}:
            section = value
        result.append(
            {
                "id": str(block.get("id") or f"p-{n + 1}"),
                "text": value,
                "section": block.get("section") or section,
                "page": block.get("page"),
                **({"bbox": block["bbox"]} if block.get("bbox") else {}),
                "start": start,
                "end": len(text),
                "start_utf16": utf16(text, start),
                "end_utf16": utf16(text, len(text)),
            }
        )
    if len(text) < 300:
        raise ValueError("Too little article text was found. Upload a full-text PDF instead.")
    if len(text) > MAX_TEXT_CHARS:
        raise ValueError(
            "This article exceeds the current text limit. Upload the relevant full case report separately; no text was silently truncated."
        )
    return text, result


def from_pdf(raw, filename):
    import pymupdf
    from pypdf import PdfReader

    if len(raw) > MAX_FILE_BYTES or not raw.startswith(b"%PDF-"):
        raise ValueError("Upload a PDF of at most 8 MB.")
    try:
        reader = PdfReader(io.BytesIO(raw), strict=False)
        if reader.is_encrypted and not reader.decrypt(""):
            raise ValueError("This PDF is encrypted. Upload an unlocked copy.")
        if len(reader.pages) > 80:
            raise ValueError("Upload a case-report PDF of at most 80 pages.")
        blocks = []
        empty = []
        headings = {
            "SUMMARY": "Abstract",
            "ABSTRACT": "Abstract",
            "BACKGROUND": "Background",
            "CASE PRESENTATION": "Case presentation",
            "INVESTIGATIONS": "Investigations",
            "DIFFERENTIAL DIAGNOSIS": "Differential diagnosis",
            "TREATMENT": "Treatment",
            "OUTCOME AND FOLLOW-UP": "Outcome and follow-up",
            "DISCUSSION": "Discussion",
            "LEARNING POINTS": "Learning points",
            "REFERENCES": "References",
        }
        # Use PDF text blocks rather than line-by-line spatial layout, which can
        # interleave different columns. Preserve line breaks within each block.
        with pymupdf.open(stream=raw, filetype="pdf") as doc:
            if doc.needs_pass and not doc.authenticate(""):
                raise ValueError("This PDF is encrypted. Upload an unlocked copy.")
            for i, page in enumerate(doc, 1):
                page_chars = 0
                for n, block in enumerate(page.get_text("blocks", flags=pymupdf.TEXTFLAGS_BLOCKS)):
                    if block[6] != 0:
                        continue
                    value = block[4].strip()
                    page_chars += len(value)
                    parts = value.split("\n", 1)
                    heading = headings.get(parts[0].strip().upper())
                    base = {"page": i, "bbox": list(block[:4])}
                    if heading:
                        blocks.append(
                            {
                                **base,
                                "id": f"pdf-{i}-{n}-heading",
                                "tag": "h2",
                                "text": parts[0].strip(),
                            }
                        )
                        value = parts[1].strip() if len(parts) > 1 else ""
                    if value:
                        blocks.append({**base, "id": f"pdf-{i}-{n}", "text": value})
                if page_chars < 30:
                    empty.append(i)
        if empty:
            raise ValueError(
                "Pages "
                + ", ".join(map(str, empty))
                + " contain little readable text. OCR this PDF first; extraction has not skipped those pages."
            )
        text, blocks = assemble(blocks)
        doi_match = re.search(r"\b10\.\d{4,9}/[-._;()/:A-Z0-9]+", text, re.I)
        return {
            "title": str((reader.metadata or {}).get("/Title") or Path(filename).name),
            "doi": doi_match.group(0).rstrip(".,;") if doi_match else "",
            "text": text,
            "blocks": blocks,
            "kind": "pdf",
            "page_count": len(reader.pages),
            "reader": "pymupdf-blocks-v1",
            "reader_version": pymupdf.VersionBind,
            "quality_notes": [
                "Page/paragraph locations refer to extracted PDF text blocks; line breaks are retained. Section labels are recognised from PDF headings. Check table columns, figures and reading order in the original; image interpretation and OCR are not performed."
            ],
        }
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("The PDF could not be read. Upload a text-based, unlocked PDF.") from exc


def from_html(raw):
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(raw, "html.parser")
    title = soup.find("meta", attrs={"name": "citation_title"})
    title = (
        title.get("content", "")
        if title
        else soup.title.get_text(" ", strip=True)
        if soup.title
        else "Article"
    )
    doi = soup.find("meta", attrs={"name": "citation_doi"})
    doi = doi.get("content", "") if doi else ""
    # A comma-separated CSS query returns document order, not selector priority.
    # BMJ can place an abstract #content-block before a separate full-text body.
    # Prefer a candidate that actually contains clinical full-text headings.
    candidates = []
    for selector in (
        ".article.fulltext-view",
        "article .article",
        "article",
        ".article-text",
        "#content-block",
    ):
        candidates.extend(soup.select(selector))
    root = next(
        (
            node
            for node in candidates
            if len(node.get_text()) >= 1500
            and any(
                re.search(
                    r"case\s+(presentation|description|history|report)|presentation of case|clinical\s+(presentation|summary)|investigations",
                    heading.get_text(" ", strip=True),
                    re.I,
                )
                for heading in node.find_all(["h1", "h2", "h3", "h4"])
            )
        ),
        candidates[0] if candidates else None,
    )
    if not root:
        raise ValueError(
            "A full article body could not be identified. Upload its full-text PDF instead."
        )
    for node in root.select(
        "script, style, nav, form, .references, .ref-list, .contributors, .copyright, .social-links"
    ):
        node.decompose()
    tags = ["h1", "h2", "h3", "h4", "p", "table", "figcaption"]
    blocks = []
    for node in root.find_all(tags):
        if any(parent.name in tags for parent in node.parents if parent is not root):
            continue
        value = node.get_text(" ", strip=True)
        if node.name == "table":
            value = "\n".join(
                "\t".join(cell.get_text(" ", strip=True) for cell in tr.find_all(["th", "td"]))
                for tr in node.find_all("tr")
            )
        blocks.append(
            {"id": node.get("id") or f"article-{len(blocks) + 1}", "tag": node.name, "text": value}
        )
    text, blocks = assemble(blocks)
    headings = "\n".join(b["text"] for b in blocks if b["section"] == b["text"])
    if len(text) < 1500 or not re.search(
        r"case\s+(presentation|description|history|report)|presentation of case|clinical\s+(presentation|summary)|investigations",
        headings,
        re.I,
    ):
        raise ValueError(
            "Only a preview or abstract appears to be available. Upload the full-text PDF; the tool will not build a case from an abstract alone."
        )
    return {
        "title": title[:500],
        "doi": doi[:200],
        "text": text,
        "blocks": blocks,
        "kind": "html",
        "quality_notes": [
            "Locations refer to this saved article text, not PDF pages. Check that the full case and any relevant tables are present."
        ],
    }


def public_url(value, resolve=True):
    if not isinstance(value, str) or len(value) > 2000:
        raise ValueError("Enter an article URL.")
    parsed = urlparse(value)
    if (
        parsed.scheme not in {"https", "http"}
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.port not in {None, 80, 443}
    ):
        raise ValueError("Use a public HTTP or HTTPS article URL without credentials.")
    host = parsed.hostname.lower()
    if host in {"localhost", "metadata.google.internal"} or host.endswith(
        (".localhost", ".local", ".internal")
    ):
        raise ValueError("Private and local network addresses cannot be read.")
    try:
        addresses = [ipaddress.ip_address(host)]
    except ValueError:
        if not resolve:
            return value
        try:
            addresses = [
                ipaddress.ip_address(x[4][0])
                for x in socket.getaddrinfo(
                    host,
                    parsed.port or (443 if parsed.scheme == "https" else 80),
                    type=socket.SOCK_STREAM,
                )
            ]
        except OSError as exc:
            raise ValueError(
                "The article host could not be resolved. Check the link or upload its PDF."
            ) from exc
    if not addresses or any(not a.is_global for a in addresses):
        raise ValueError("Private and local network addresses cannot be read.")
    return value


def fetch_article(url):
    current = public_url(url)
    with httpx.Client(timeout=10, follow_redirects=False, trust_env=False) as client:
        for _ in range(5):
            public_url(current)
            with client.stream(
                "GET",
                current,
                headers={
                    "User-Agent": "AutoRubric-ArticleReader/1.0",
                    "Accept": "text/html,application/pdf",
                },
            ) as response:
                if response.status_code in {301, 302, 303, 307, 308}:
                    current = urljoin(current, response.headers.get("location", ""))
                    continue
                if response.status_code != 200:
                    raise ValueError(
                        f"The publisher returned HTTP {response.status_code}. Institutional browser sessions are not copied to the server. Upload the full-text PDF instead."
                    )
                raw = bytearray()
                for part in response.iter_bytes():
                    raw.extend(part)
                    if len(raw) > MAX_FILE_BYTES:
                        raise ValueError("The article download exceeds 8 MB.")
                return bytes(raw), current
    raise ValueError("The article redirected too many times. Upload its PDF instead.")


def archived_article(url, pilot_root):
    """Reuse only the project's already saved, explicit full-text reads."""
    import json

    parsed = urlparse(url)
    if parsed.hostname != "casereports.bmj.com":
        return None
    aid = re.search(r"/(e\d+)(?:\.full)?(?:\.pdf)?/?$", parsed.path)
    if not aid:
        return None
    aid = aid.group(1)
    paths = [
        pilot_root / "source_search_20261111_bmj/records/FULLTEXT_READS.json",
        pilot_root / f"source_search_20261111_bmj_evening/records/{aid}.json",
        pilot_root / f"source_search_20261112_bmj/records/{aid}.json",
    ]
    for path in paths:
        if not path.exists():
            continue
        data = json.loads(path.read_text())
        rows = data.get("records", [data])
        for row in rows:
            if aid not in urlparse(row.get("url", "")).path or not row.get("blocks"):
                continue
            # A full saved body must include case material and follow-up/clinical sections.
            blocks = [{**b, "tag": b.get("tag", "p")} for b in row["blocks"]]
            text, blocks = assemble(blocks)
            if len(text) < 1800 or not re.search(
                r"case presentation|investigations|case report", text, re.I
            ):
                continue
            return {
                "title": row.get("title", row.get("page_title", "BMJ case report")),
                "doi": row.get("doi", ""),
                "text": text,
                "blocks": blocks,
                "kind": "archived_html",
                "url": row["url"],
                "archive_record_sha256": sha(path.read_bytes()),
                "retrieval_method": "saved_full_text",
                "quality_notes": [
                    "Reused the project's saved full-text read (November 2026), not a fresh publisher request. Locations refer to this immutable saved text."
                ],
            }
    return None


def read_source(body, pilot_root):
    raw = None
    kind = body.get("kind")
    if kind == "pdf":
        filename = Path(str(body.get("filename", "article.pdf"))).name[:200]
        try:
            raw = base64.b64decode(body.get("content_base64", ""), validate=True)
        except Exception as exc:
            raise ValueError("The PDF upload was not valid. Select the PDF again.") from exc
        doc = from_pdf(raw, filename)
        doc.update(filename=filename, retrieval_method="uploaded_pdf", original_sha256=sha(raw))
    elif kind == "url":
        url = public_url(body.get("url", ""), resolve=False)
        doc = archived_article(url, pilot_root) if body.get("use_saved_source", True) else None
        if doc is None:
            try:
                raw, final = fetch_article(url)
            except httpx.HTTPError as exc:
                raise ValueError(
                    "The publisher could not be reached in time. Upload its full-text PDF instead."
                ) from exc
            if raw.startswith(b"%PDF-"):
                doc = from_pdf(raw, "article.pdf")
                doc["filename"] = "article.pdf"
            else:
                doc = from_html(raw)
            doc.update(
                retrieval_method="publisher_download", original_sha256=sha(raw), resolved_url=final
            )
        doc["url"] = url
    else:
        raise ValueError("Upload a PDF or enter an article URL.")
    doc["text_sha256"] = sha(doc["text"])
    doc["id"] = sha(doc["text"] + "\n" + doc.get("url", "") + "\n" + doc.get("filename", ""))[:24]
    return doc, raw
