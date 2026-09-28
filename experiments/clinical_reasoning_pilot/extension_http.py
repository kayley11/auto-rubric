"""Isolated v2.1 scoring recovery: same saved answers, direct HTTP, no irrelevant few-shot examples."""

import argparse
import asyncio
import hashlib
import json
import os
from pathlib import Path
from unittest.mock import patch

import httpx
from pilot_paths import run_root

os.environ["AUTORUBRIC_PILOT_RUN_DIR"] = str(run_root("runs/extension_v2_1_http"))
import extension as e

p = e.p
ROOT = run_root("runs/extension_v2_1_http")
e.ROOT = p.ROOT = ROOT
p.DATA = ROOT / "data"
p.OUT = ROOT / "results"
p.CFG = p.read(p.DATA / "config.json")
p.CASES = p.read(p.DATA / "cases.json")
p.REFS = p.read(p.DATA / "reference_notes.json")
p.MATRIX = p.read(p.DATA / "applicability.json")
p.CRITERIA = {c["id"]: c for c in p.read(p.DATA / "rubric_source.json")["criteria"]}
e.UNITS = {u["id"]: u for u in p.CASES}
e.PLAN = p.read(p.DATA / "plan.json")
p.JUDGE_SYSTEM = (
    "Evaluate the supplied submission against the single clinical criterion and its original anchors. "
    "The <options> block lists numbered option POSITIONS followed by exact score LABELS. "
    "Choose a defensible label, then copy its displayed position; they are not interchangeable. "
    "Return a JSON object with selected_option (integer position), selected_label (exact label string), "
    "and explanation (brief clinical justification). Use Cannot assess only when no defensible judgment is possible.\n"
    + "Write the final justification"
    + p.JUDGE_SYSTEM.split("Write the final justification", 1)[1]
)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["check", "run", "report"])
    args = parser.parse_args()
    if args.command == "check":

        async def offline_post(self, url, **kwargs):
            body = kwargs["json"]
            assert (
                "selected_label" in body["response_format"]["json_schema"]["schema"]["properties"]
            )
            assert body["reasoning_effort"] == "low"
            raw = dict(
                id="offline",
                object="chat.completion",
                created=0,
                model="arc:apex",
                choices=[
                    dict(
                        index=0,
                        finish_reason="stop",
                        message=dict(
                            role="assistant",
                            content=json.dumps(
                                dict(
                                    selected_option=1,
                                    selected_label="1",
                                    explanation="Offline HTTP fixture.",
                                )
                            ),
                        ),
                    )
                ],
                usage=dict(prompt_tokens=0, completion_tokens=0, total_tokens=0),
            )
            return httpx.Response(200, json=raw, request=httpx.Request("POST", url))

        with patch("httpx.AsyncClient.post", new=offline_post):
            e.offline_checks()
        return
    if args.command == "report":
        e.render_live()
        return
    for src in [
        Path(__file__),
        Path(e.__file__),
        Path(p.__file__),
        Path(__file__).with_name("pilot_paths.py"),
    ]:
        target = p.OUT / "snapshots" / src.name
        if target.exists() and target.read_bytes() != src.read_bytes():
            raise RuntimeError("Frozen execution source changed: " + src.name)
        target.write_bytes(src.read_bytes())
    p.write(
        p.OUT / "manifest.json",
        dict(
            started=p.now(),
            phase="score",
            config=p.CFG,
            plan=e.PLAN,
            source_hashes={
                x.name: hashlib.sha256(x.read_bytes()).hexdigest()
                for x in (p.OUT / "snapshots").glob("*.py")
            },
            imported_generation_source=p.CFG.get("imported_generation_source"),
            clinical_review="pending",
        ),
    )
    try:
        asyncio.run(e.execute("score"))
    except BaseException as exc:
        p.event("extension_run_stopped", error=p.redact(f"{type(exc).__name__}: {exc}"))
        raise
    finally:
        e.render_live()


if __name__ == "__main__":
    main()
