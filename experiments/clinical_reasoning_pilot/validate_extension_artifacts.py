"""Offline delivery checks over actual records and Markdown; never makes model requests."""

import hashlib
import json
import os
import re
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import unquote

from dotenv import dotenv_values
from pilot_paths import env_file, workspace

BASE = workspace()
OLD = BASE / "runs/extension_v2"
NEW = BASE / "runs/extension_v2_1_http"
checks = []


def read(path):
    return json.loads(path.read_text())


def check(name, passed, details=None):
    checks.append(dict(check=name, passed=bool(passed), details=details))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


for root in [OLD, NEW]:
    failures = []
    for f in root.rglob("*.json"):
        try:
            read(f)
        except (ValueError, UnicodeError):
            failures.append(str(f.relative_to(BASE)))
    check(root.name + " JSON parses", not failures, failures)
    hashes = read(root / "data/frozen_input_hashes.json")
    check(
        root.name + " frozen data integrity",
        all(sha(root / "data" / f) == digest for f, digest in hashes.items()),
    )
    hashes = read(root / "results/manifest.json")["source_hashes"]
    check(
        root.name + " executed source integrity",
        all(sha(root / "results/snapshots" / f) == digest for f, digest in hashes.items()),
    )
    independent = read(root / "results/checks/independent_report_validation.json")
    check(
        root.name + " independent verdict/source/numeric checks", independent["status"] == "passed"
    )

units = read(NEW / "data/cases.json")
check(
    "16 units from seven parent clusters",
    len(units) == 16 and len({u["parent_id"] for u in units}) == 7,
)
counts = Counter()
for u in units:
    uid = u["id"]
    a = read(OLD / "results/operations" / f"{uid}.generate.json")
    b = read(NEW / "results/operations" / f"{uid}.generate.json")
    raw = read(
        OLD / "results/attempts" / f"{uid}.generate.attempt{a['successful_attempt']:02d}.json"
    )["raw_responses"][-1]["choices"][0]["message"]["content"]
    check(uid + " raw answer unchanged", raw == a["output"]["answer"] == b["output"]["answer"])
    # imported_from is retained historical metadata, not a machine-local lookup path.
    check(
        uid + " imported original checkpoint provenance",
        Path(b["imported_from"]).name == f"{uid}.generate.json"
        and b["imported_checkpoint_sha256"]
        == sha(OLD / "results/operations" / f"{uid}.generate.json"),
    )
    n = len(a["output"]["answer"].split("NUMERIC_SUMMARY:", 1)[0].split())
    check(
        uid + " narrative length within requested interval",
        u["word_range"][0] <= n <= u["word_range"][1],
        n,
    )
    if u.get("numeric_expected"):
        counts["numeric_pass"] += a["output"]["numeric_audit"]["status"] == "passed"
    for cid in u["criteria"]:
        p = NEW / "results/operations" / f"{uid}.baseline.{cid}.json"
        if p.exists():
            op = read(p)
            out = op.get("output", {})
            if out.get("status") == "scored":
                counts["numeric_baseline"] += 1
            if op.get("status") == "error":
                counts["baseline_error"] += 1
check("four deterministic numeric summaries passed", counts["numeric_pass"] == 4)

for prefix in ["E01", "E02", "P01", "P02"]:
    suffixes = ["EVIDENCE", "NEUTRAL"] if prefix.startswith("E") else ["PUSHBACK", "NEUTRAL"]
    payloads = [
        read(NEW / "results/inputs" / f"{prefix}_{s}.generation.json")["payload"]["messages"]
        for s in suffixes
    ]
    check(prefix + " identical actual shared prefix", payloads[0][:-1] == payloads[1][:-1])
    if prefix.startswith("E"):
        initial = read(NEW / "results/operations" / f"{prefix}_INITIAL.generate.json")["output"][
            "answer"
        ]
        check(
            prefix + " branches use saved initial answer",
            all(p[-2]["role"] == "assistant" and p[-2]["content"] == initial for p in payloads),
        )

summary = read(BASE / "extension_summary.json")
check(
    "consolidated baseline count matches independent count",
    summary["numeric_baseline"] == counts["numeric_baseline"],
)
check(
    "generation counted only once",
    summary["by_phase"]["Original answer generation"]["attempts"] == 16
    and not list((NEW / "results/attempts").glob("*.generate.*")),
)
check(
    "input and output token reconciliation",
    summary["total"]["prompt_tokens"] + summary["total"]["completion_tokens"]
    == summary["total"]["total_tokens"],
)
check(
    "no repeated returned response ID across completion records",
    summary["total"]["unique_response_ids"] == summary["total"]["recorded_responses"],
)

# Files created specifically for this extension; Markdown links to pending operations are not inserted.
mdfiles = [*OLD.rglob("*.md"), *NEW.rglob("*.md"), BASE / "EXTENSION_RESULTS.md"]
broken = []
for path in mdfiles:
    for match in re.finditer(r"\[[^\]\n]*\]\(([^)]+)\)", path.read_text()):
        target = match.group(1).strip().strip("<>")
        if target.startswith(("http://", "https://", "mailto:", "#")):
            continue
        target = unquote(target.split("#")[0])
        if not target:
            continue
        resolved = Path(target) if target.startswith("/") else path.parent / target
        if not resolved.exists():
            broken.append(dict(file=str(path.relative_to(BASE)), target=target))
check("all extension Markdown local links resolve", not broken, broken)

# Exact runtime key never leaves this process. No credential or credential hash is written to the report.
key = os.environ.get("OPENAI_API_KEY") or dotenv_values(env_file()).get("OPENAI_API_KEY", "")
leaks = []
if key:
    for root in [OLD, NEW]:
        for path in root.rglob("*"):
            if path.is_file() and path.suffix in [".json", ".jsonl", ".md", ".py"]:
                text = path.read_text()
                if key in text:
                    leaks.append(str(path.relative_to(BASE)))
    for path in [BASE / "EXTENSION_RESULTS.md", BASE / "extension_summary.json"]:
        if key in path.read_text():
            leaks.append(str(path.relative_to(BASE)))
check(
    "configured credential excluded from extension artifacts",
    not leaks,
    leaks
    if key
    else "No runtime credential configured; exact-key comparison unavailable. Portable bundle uses a separate secret-pattern scan.",
)

worksheet = (NEW / "REVIEW_WORKSHEET.md").read_text()
check(
    "independent worksheet includes all 16 unchanged targets",
    all(
        read(NEW / "results/operations" / f"{u['id']}.generate.json")["output"]["answer"]
        in worksheet
        for u in units
    ),
)
check(
    "worksheet has no machine-grade table or supplied clinical score",
    "| Machine score |" not in worksheet and "default:" not in worksheet,
)

result = dict(
    checked_at=datetime.now(UTC).isoformat(),
    status="passed" if all(c["passed"] for c in checks) else "failed",
    api_calls=0,
    checks=checks,
    technical_operations_complete=summary["technical_operations_complete"],
    clinical_expert_review="not performed",
    visual_rendering="Markdown source/content/link checks only; no rendered-layout claim",
)
out = NEW / "results/checks/delivery.json"
out.write_text(json.dumps(result, indent=2) + "\n")
print(
    json.dumps(
        dict(
            status=result["status"],
            checks=len(checks),
            failures=[c for c in checks if not c["passed"]],
            numeric_baseline=counts["numeric_baseline"],
        ),
        indent=2,
    )
)
if result["status"] != "passed":
    raise SystemExit(1)
