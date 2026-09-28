"""Portable entry point. Reporting, checks, packaging and replay are offline."""

import argparse
import asyncio
import importlib
import json
import os
import re
import shutil
import socket
import subprocess
import sys
from contextlib import ExitStack
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import patch

from pilot_paths import CODE_ROOT, digest_file, require_files

DEFAULT_RUN = "extension_v2_1_http"
SECRET = re.compile(r"\bsk-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")


def read(path):
    return json.loads(path.read_text())


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def run_path(workspace, name):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", name):
        raise ValueError("Run names must be single directory names using letters, digits, _ . or -")
    return workspace / "runs" / name


def configure(args):
    workspace = args.workspace.expanduser().resolve()
    os.environ["AUTORUBRIC_PILOT_WORKSPACE"] = str(workspace)
    os.environ.pop("AUTORUBRIC_PILOT_RUN_DIR", None)
    os.environ.pop("JOSH_PILOT_ROOT", None)
    if args.env_file:
        path = args.env_file.expanduser().resolve()
        require_files([path], "Explicit credential configuration")
        os.environ["AUTORUBRIC_ENV_FILE"] = str(path)
    return workspace


def require_run(root):
    require_files(
        [
            root / "data" / name
            for name in (
                "cases.json",
                "config.json",
                "reference_notes.json",
                "applicability.json",
                "rubric_source.json",
                "plan.json",
                "frozen_input_hashes.json",
            )
        ],
        "Extension run",
    )
    hashes = read(root / "data/frozen_input_hashes.json")
    changed = [
        name
        for name, expected in hashes.items()
        if not (root / "data" / name).is_file() or digest_file(root / "data" / name) != expected
    ]
    if changed:
        raise ValueError("Frozen inputs changed; create a new condition: " + ", ".join(changed))
    cases = read(root / "data/cases.json")
    if any(case.get("base_answer") for case in cases):
        require_files(
            [
                root / "runtime_inputs" / name
                for name in ("base_conversations.json", "manifest.json")
            ],
            "Retained earlier turns",
        )
    return read(root / "data/config.json")


def command(script, *arguments, run=None, offline=True):
    env = os.environ.copy()
    env.pop("AUTORUBRIC_PILOT_RUN_DIR", None)
    if run:
        env["AUTORUBRIC_PILOT_RUN_DIR"] = str(run)
    env["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"
    # Offline commands need no account or network-enabled URL, including schema fixtures.
    if offline:
        env.pop("AUTORUBRIC_ENV_FILE", None)
        env["OPENAI_API_KEY"] = (
            "offline-placeholder" if arguments and arguments[0] == "check" else ""
        )
        env["OPENAI_BASE_URL"] = "https://offline.invalid/v1"
    subprocess.run([sys.executable, str(CODE_ROOT / script), *arguments], env=env, check=True)


def engine_name(config):
    return "extension_http" if config.get("judge_transport") == "httpx" else "extension"


def replay(workspace, name):
    """Exercise every payload fingerprint while prohibiting new calls and evidence writes."""
    root = run_path(workspace, name)
    config = require_run(root)
    os.environ["AUTORUBRIC_PILOT_RUN_DIR"] = str(root)
    os.environ["OPENAI_API_KEY"] = "offline-placeholder"
    os.environ["OPENAI_BASE_URL"] = "https://offline.invalid/v1"
    os.environ.pop("AUTORUBRIC_ENV_FILE", None)
    visited = []
    network_attempts = []

    def no_network(*args, **kwargs):
        network_attempts.append("blocked")
        raise RuntimeError("Network is disabled during checkpoint replay")

    async def no_preflight():
        return None

    with ExitStack() as stack:
        stack.enter_context(patch.object(socket.socket, "connect", no_network))
        stack.enter_context(patch.object(socket, "create_connection", no_network))
        engine = importlib.import_module(engine_name(config))
        e = engine.e if hasattr(engine, "e") else engine
        p = e.p
        original_operate = p.operate

        async def cached_only(opid, payload, fn):
            old = p.checkpoint(opid)
            if not old or old.get("status") != "success":
                raise ValueError("Replay needs a successful checkpoint: " + opid)
            visited.append(opid)
            return await original_operate(opid, payload, fn)

        stack.enter_context(patch.object(p, "operate", cached_only))
        stack.enter_context(patch.object(p, "preflight", no_preflight))
        stack.enter_context(patch.object(p, "write", lambda *a, **k: None))
        stack.enter_context(patch.object(p, "event", lambda *a, **k: None))
        asyncio.run(e.execute("all"))
        if set(visited) != e.expected_operations() or len(visited) != len(set(visited)):
            raise ValueError("Replay did not visit every planned operation exactly once")
    if network_attempts:
        raise ValueError("An unexpected network operation was attempted")
    result = {
        "status": "passed",
        "run": name,
        "operations_reused": len(visited),
        "api_calls": 0,
        "network_attempts": 0,
        "evidence_writes": 0,
    }
    print(json.dumps(result, indent=2))
    return result


def new_condition(workspace, name, source_name):
    """Copy frozen questions/answers into a distinct, initially unscored condition."""
    source = run_path(workspace, source_name)
    config = require_run(source)
    target = run_path(workspace, name)
    if target.exists():
        raise ValueError("Destination already exists; refusing to replace a condition: " + name)
    units = read(source / "data/cases.json")
    required = [
        source
        / "results"
        / part
        / (u["id"] + ".generate.json" if part == "operations" else u["id"] + ".generation.json")
        for u in units
        for part in ("operations", "inputs")
    ]
    require_files(required, "Importing unchanged target answers")
    # Prevalidate everything before creating the new condition.
    for unit in units:
        if (
            read(source / "results/operations" / (unit["id"] + ".generate.json"))["status"]
            != "success"
        ):
            raise ValueError("Source generation is incomplete: " + unit["id"])
    shutil.copytree(source / "data", target / "data")
    shutil.copytree(source / "runtime_inputs", target / "runtime_inputs")
    config.update(
        protocol_version=name,
        prepared=datetime.now(UTC).isoformat(),
        imported_generation_source=os.path.relpath(source, target),
        portability_condition={
            "source_run": source_name,
            "change": "Portable runtime; answers and scoring parameters retained. No new evaluation yet.",
        },
    )
    write(target / "data/config.json", config)
    write(
        target / "data/frozen_input_hashes.json",
        {
            p.name: digest_file(p)
            for p in sorted((target / "data").glob("*.json"))
            if p.name != "frozen_input_hashes.json"
        },
    )
    for unit in units:
        op_path = source / "results/operations" / (unit["id"] + ".generate.json")
        op = read(op_path)
        op.update(
            imported_from=os.path.relpath(op_path, target),
            imported_checkpoint_sha256=digest_file(op_path),
            no_new_request_for_import=True,
        )
        write(target / "results/operations" / op_path.name, op)
        dest = target / "results/inputs" / (unit["id"] + ".generation.json")
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source / "results/inputs" / dest.name, dest)
    for folder in ("attempts", "checks", "snapshots", "units", "cases"):
        (target / "results" / folder).mkdir(exist_ok=True)
    (target / "PROTOCOL.md").write_text(
        "# Portable scoring condition\n\n"
        f"Source condition: `{source_name}`. The {len(units)} target answers were imported unchanged. "
        "No scoring, audit, repeat or control result has been imported. No model call was made by initialization.\n\n"
        "This is a new execution condition for the portable runtime. Original anchors, selected items, "
        "references, model aliases and sampling settings are retained. Clinical validation remains pending.\n"
    )
    (target / "ANALYSIS.md").write_text(
        "# Findings\n\nThis condition has not been evaluated yet.\n"
    )
    (target / "REVIEW_WORKSHEET.md").write_text(
        "# Independent review\n\nIndependent review remains pending.\n"
    )
    print(
        json.dumps(
            {"created": name, "imported_answers": len(units), "imported_scores": 0, "api_calls": 0},
            indent=2,
        )
    )


def bundle(workspace, destination):
    destination = destination.expanduser().resolve()
    if destination.exists() or destination == workspace or workspace in destination.parents:
        raise ValueError("Choose a new bundle destination outside the source workspace")
    for name in ("extension_v2", DEFAULT_RUN):
        require_run(run_path(workspace, name))
    dependencies = workspace / "dependency_manifest.json"
    require_files([dependencies], "Complete reproduction dependency manifest")
    for name, expected in read(dependencies)["files"].items():
        member = Path(name)
        if member.is_absolute() or ".." in member.parts:
            raise ValueError("Invalid dependency manifest member")
        path = workspace / member
        if not path.is_file() or path.is_symlink() or digest_file(path) != expected:
            raise ValueError("Missing or changed historical dependency: " + name)
    required = [workspace / "runs/apex_v1_5/data/config.json", workspace / "data/cases.json"]
    require_files(required, "The historical comparison and preparation inputs")
    files = []
    # Explicit roots only: never export .env files, installed packages, caches or unrelated directories.
    for path in sorted(workspace.iterdir()):
        if path.is_file() and (
            path.suffix in (".py", ".md", ".json")
            or path.name
            in (
                "requirements.txt",
                "requirements.in",
                "constraints-original.txt",
                ".env.example",
                ".gitignore",
            )
        ):
            files.append(path)
        elif path.is_dir() and path.name in (
            "data",
            "results",
            "runs",
            "review",
            "snapshots",
            "tests",
        ):
            files.extend(
                p
                for p in sorted(path.rglob("*"))
                if p.is_file()
                and p.suffix in (".json", ".jsonl", ".md", ".py")
                and "__pycache__" not in p.parts
                and not p.name.startswith(".env")
            )
    if not any(p.name == "portable.py" for p in files):
        raise ValueError("Bundle source must contain the portable runtime code")
    for path in files:
        if path.is_symlink():
            raise ValueError("Bundle does not follow symlinks: " + str(path.relative_to(workspace)))
        if SECRET.search(path.read_text()):
            raise ValueError(
                "Possible credential/private key in " + str(path.relative_to(workspace))
            )
    manifest = {
        "format": 1,
        "created": datetime.now(UTC).isoformat(),
        "scope": "Local reproduction bundle; includes original research materials, not a reviewed public release.",
        "files": {str(p.relative_to(workspace)): digest_file(p) for p in files},
    }
    destination.mkdir(parents=True)
    for path in files:
        target = destination / path.relative_to(workspace)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
    write(destination / "BUNDLE_MANIFEST.json", manifest)
    print(json.dumps({"bundle": str(destination), "files": len(files), "api_calls": 0}, indent=2))


def verify_bundle(workspace):
    path = workspace / "BUNDLE_MANIFEST.json"
    require_files([path], "Bundle verification")
    manifest = read(path)
    bad = []
    for name, expected in manifest["files"].items():
        member = Path(name)
        if member.is_absolute() or ".." in member.parts:
            raise ValueError("Invalid bundle manifest member")
        path = workspace / member
        if not path.is_file() or path.is_symlink() or digest_file(path) != expected:
            bad.append(name)
    if bad:
        raise ValueError("Missing or modified bundle files:\n  " + "\n  ".join(bad))
    print(
        json.dumps({"status": "passed", "files": len(manifest["files"]), "api_calls": 0}, indent=2)
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--workspace",
        type=Path,
        default=CODE_ROOT,
        help="Data workspace; defaults to this script's directory, independent of cwd",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        help="Explicit credential file; otherwise workspace/.env or environment",
    )
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("check", "replay", "report"):
        p = sub.add_parser(name)
        p.add_argument("--run", default=DEFAULT_RUN)
        if name == "report":
            p.add_argument(
                "--all",
                action="store_true",
                help="Rebuild both historical extension reports and consolidation",
            )
    p = sub.add_parser("run", help="Live scoring; requires explicit run selection and credentials")
    p.add_argument("--run", required=True)
    p = sub.add_parser("new-condition", help="Prepare a new unscored condition; offline")
    p.add_argument("--name", required=True)
    p.add_argument("--source", default=DEFAULT_RUN)
    p = sub.add_parser(
        "bundle", help="Export code, data and historical dependencies to a new local directory"
    )
    p.add_argument("--output", type=Path, required=True)
    sub.add_parser("verify-bundle")
    sub.add_parser("validate")
    args = parser.parse_args()
    workspace = configure(args)
    if args.command == "bundle":
        bundle(workspace, args.output)
    elif args.command == "verify-bundle":
        verify_bundle(workspace)
    elif args.command == "new-condition":
        new_condition(workspace, args.name, args.source)
    elif args.command == "replay":
        replay(workspace, args.run)
    elif args.command == "validate":
        command("validate_extension_artifacts.py")
    elif args.command == "report":
        names = ["extension_v2", DEFAULT_RUN] if args.all else [args.run]
        for name in names:
            root = run_path(workspace, name)
            require_run(root)
            command("extension_report.py", "--run-dir", name)
        if args.all:
            command("extension_consolidate.py")
    else:
        root = run_path(workspace, args.run)
        config = require_run(root)
        command(
            engine_name(config) + ".py", args.command, run=root, offline=args.command == "check"
        )


if __name__ == "__main__":
    try:
        main()
    except (ValueError, FileNotFoundError, subprocess.CalledProcessError) as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(2)
