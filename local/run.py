"""Local entry point for the official AutoRubric installation."""

import argparse
import asyncio
import json
import os
import re
import sys
from datetime import UTC, datetime
from importlib.metadata import version
from pathlib import Path
from unittest.mock import AsyncMock, patch

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
LOCAL = ROOT / "local"
load_dotenv(ROOT / ".env", override=False)
os.environ.setdefault("LITELLM_LOCAL_MODEL_COST_MAP", "True")

from autorubric import LLMConfig, Rubric  # noqa: E402
from autorubric.graders import CriterionGrader  # noqa: E402
from autorubric.prompts import (  # noqa: E402
    GRADER_SYSTEM_PROMPT_DEFAULT,
    MULTI_CHOICE_SYSTEM_PROMPT,
)

ENGLISH_OUTPUT_INSTRUCTION = (
    "\nWrite all explanations in English, even when the submission or rubric uses "
    "another language. Preserve the original wording when quoting evidence."
)
ENGLISH_GRADER_PROMPT = GRADER_SYSTEM_PROMPT_DEFAULT + ENGLISH_OUTPUT_INSTRUCTION
ENGLISH_MULTI_CHOICE_PROMPT = MULTI_CHOICE_SYSTEM_PROMPT + ENGLISH_OUTPUT_INSTRUCTION


def settings(*, offline: bool = False) -> LLMConfig:
    if offline:
        return LLMConfig(
            model="openai/gpt-4.1-mini",
            api_key="offline-test-only",
            cache_enabled=False,
            max_retries=1,
            max_parallel_requests=1,
        )
    model = os.getenv("AUTORUBRIC_MODEL", "openai/gpt-4.1-mini").strip()
    if not model.startswith("openai/") or not model.removeprefix("openai/"):
        raise ValueError("Set AUTORUBRIC_MODEL to openai/<model-id>.")
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if api_key.lower() in {"", "your-api-key-here", "replace-me", "your_key_here"}:
        raise ValueError("OPENAI_API_KEY is missing. Edit .env in the project root.")
    max_tokens = int(os.getenv("AUTORUBRIC_MAX_TOKENS", "1024"))
    timeout = float(os.getenv("AUTORUBRIC_TIMEOUT", "60"))
    concurrency = int(os.getenv("AUTORUBRIC_CONCURRENCY", "3"))
    if min(max_tokens, timeout, concurrency) <= 0:
        raise ValueError("max_tokens, timeout, and concurrency must be greater than zero.")
    api_base = (
        (
            os.getenv("OPENAI_BASE_URL")
            or os.getenv("OPENAI_API_BASE")
            or "https://api.openai.com/v1"
        )
        .strip()
        .rstrip("/")
    )
    return LLMConfig(
        model=model,
        api_key=api_key,
        api_base=api_base,
        max_tokens=max_tokens,
        timeout=timeout,
        max_retries=2,
        max_parallel_requests=concurrency,
        cache_enabled=False,
    )


def check() -> int:
    rubric = Rubric.from_file(str(LOCAL / "rubric.yaml"))
    print(f"AutoRubric {version('autorubric')} | Python {sys.version.split()[0]}")
    print(f"Project directory: {ROOT}")
    print(f"Sample rubric: {len(rubric.rubric)} criteria loaded successfully")
    try:
        config = settings()
    except ValueError as exc:
        print(f"Model configuration: incomplete ({exc})")
    else:
        print(f"Model configuration: {config.model} (this check makes no API calls)")
    print("Grading explanations: English")
    print("Offline verification: ./run.sh smoke")
    print("Live evaluation: ./run.sh grade")
    return 0


async def offline_response(**kwargs):
    """Fixed test fixture; it does not evaluate the meaning of a submission."""
    from litellm import ModelResponse

    prompt = kwargs["messages"][-1]["content"]
    match = re.search(r"<criterion_type>\s*(.*?)\s*</criterion_type>", prompt, re.S)
    if match is None:
        raise AssertionError("criterion_type was not found in the AutoRubric grading prompt.")
    verdict = "UNMET" if match.group(1).strip() == "negative" else "MET"
    content = json.dumps(
        {
            "criterion_status": verdict,
            "explanation": (
                "Fixed offline test response for deployment verification; not a model judgment."
            ),
        },
        ensure_ascii=False,
    )
    return ModelResponse(
        model="gpt-4.1-mini",
        choices=[
            {
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": "stop",
            }
        ],
        usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
    )


def redact(text: str) -> str:
    key = os.getenv("OPENAI_API_KEY", "").strip()
    return text.replace(key, "[REDACTED]") if key else text


async def grade(args: argparse.Namespace) -> int:
    offline = args.command == "smoke"
    config = settings(offline=offline)
    rubric_path = LOCAL / "rubric.yaml" if offline else args.rubric
    input_path = LOCAL / "answer.txt" if offline else args.input
    query_path = LOCAL / "query.txt" if offline else args.query_file
    if not offline and query_path is None and input_path == LOCAL / "answer.txt":
        query_path = LOCAL / "query.txt"
    rubric = Rubric.from_file(str(rubric_path))
    text = input_path.read_text(encoding="utf-8").strip()
    if not text:
        raise ValueError("The submission must not be empty.")
    query = query_path.read_text(encoding="utf-8").strip() if query_path else None
    grader = CriterionGrader(
        llm_config=config,
        system_prompt=ENGLISH_GRADER_PROMPT,
        multi_choice_system_prompt=ENGLISH_MULTI_CHOICE_PROMPT,
    )
    if offline:
        print("Offline verification: using fixed mock responses; no model API calls.")
        mock = AsyncMock(side_effect=offline_response)
        with patch("autorubric.llm.litellm.acompletion", new=mock):
            result = await rubric.grade(text, grader=grader, query=query)
        if mock.await_count != 3 or result.score != 1.0:
            raise RuntimeError(
                "Offline verification failed: expected 3 mock calls and a score of 1.0."
            )
    else:
        print(f"Evaluating {len(rubric.rubric)} criteria with {config.model}...")
        result = await rubric.grade(text, grader=grader, query=query)
    failed = bool(result.error or result.score is None or not result.report)
    failed = failed or any(item.is_error for item in (result.report or []))
    now = datetime.now(UTC)
    mode = "offline_smoke" if offline else "live"
    output = args.output or (LOCAL / "results" / f"{mode}-{now.strftime('%Y%m%dT%H%M%S%fZ')}.json")
    payload = {
        "mode": mode,
        "successful": not failed,
        "created_at": now.isoformat(),
        "autorubric_version": version("autorubric"),
        "model": config.model,
        "explanation_language": "en",
        "rubric_file": str(rubric_path.resolve()),
        "input_file": str(input_path.resolve()),
        "result": result.model_dump(mode="json"),
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        redact(json.dumps(payload, ensure_ascii=False, indent=2)) + "\n", encoding="utf-8"
    )
    if failed:
        print(
            "Evaluation incomplete. Check the report's error fields before using the score.",
            file=sys.stderr,
        )
    else:
        prefix = "Offline test score" if offline else "Score"
        print(f"{prefix}: {result.score:.4f}")
    for item in result.report or []:
        print(redact(f"  [{item.final_verdict.value}] {item.criterion.requirement}"))
        print(redact(f"    {item.final_reason}"))
    print(f"JSON report: {output.resolve()}")
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Local AutoRubric evaluation runner")
    commands = parser.add_subparsers(dest="command")
    commands.add_parser("check", help="Check installation and configuration without API calls")
    smoke = commands.add_parser("smoke", help="Verify deployment offline with fixed mock responses")
    smoke.add_argument("--output", type=Path, help="Path for the JSON report")
    live = commands.add_parser("grade", help="Evaluate a submission using the configured model")
    live.add_argument("--rubric", type=Path, default=LOCAL / "rubric.yaml")
    live.add_argument("--input", type=Path, default=LOCAL / "answer.txt")
    live.add_argument(
        "--query-file", type=Path, help="UTF-8 text file containing the original question"
    )
    live.add_argument("--output", type=Path, help="Path for the JSON report")
    args = parser.parse_args()
    try:
        return check() if args.command in (None, "check") else asyncio.run(grade(args))
    except (ValueError, OSError, RuntimeError) as exc:
        print(redact(f"Error: {exc}"), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
