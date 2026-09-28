"""Explicit, relocatable paths shared by execution and offline reporting."""

import hashlib
import json
import os
from pathlib import Path

CODE_ROOT = Path(__file__).resolve().parent


def workspace():
    return Path(os.environ.get("AUTORUBRIC_PILOT_WORKSPACE", CODE_ROOT)).expanduser().resolve()


def run_root(default="."):
    value = (
        os.environ.get("AUTORUBRIC_PILOT_RUN_DIR") or os.environ.get("JOSH_PILOT_ROOT") or default
    )
    path = Path(value).expanduser()
    return (path if path.is_absolute() else workspace() / path).resolve()


def env_file():
    """Never search adjacent deployments or a caller's working directory."""
    value = os.environ.get("AUTORUBRIC_ENV_FILE")
    path = Path(value).expanduser() if value else workspace() / ".env"
    if not path.is_absolute():
        path = workspace() / path
    if value and not path.is_file():
        raise FileNotFoundError("Configured AUTORUBRIC_ENV_FILE does not exist: " + str(path))
    return path


def require_files(paths, purpose):
    missing = [str(path) for path in paths if not path.is_file()]
    if missing:
        raise FileNotFoundError(
            purpose
            + " requires the following inputs:\n  "
            + "\n  ".join(missing)
            + "\nUse a complete bundle from `python portable.py bundle --output DEST`, "
            "or supply the intended workspace explicitly. Copying scripts alone does not supply experimental inputs."
        )


def imported_generation_root(root, config):
    value = config.get("imported_generation_source")
    return (root / value).resolve() if value else root


def generation_attempts_root(root, config):
    """Follow documented imports to the actual one-time generation attempts."""
    seen = set()
    while config.get("imported_generation_source"):
        if root in seen:
            raise ValueError("Cycle in generation provenance")
        seen.add(root)
        root = imported_generation_root(root, config)
        path = root / "data/config.json"
        require_files([path], "Generation-attempt provenance")
        config = json.loads(path.read_text())
    return root / "results/attempts"


def digest_file(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def base_conversation(root, case_id):
    """Load the frozen earlier turn from an explicit run-local input bundle."""
    path = root / "runtime_inputs" / "base_conversations.json"
    manifest = root / "runtime_inputs" / "manifest.json"
    require_files([path, manifest], "The retained prior conversation")
    expected = json.loads(manifest.read_text())["files"][path.name]
    if digest_file(path) != expected:
        raise ValueError("Retained conversation input changed: " + str(path))
    contexts = json.loads(path.read_text())
    if case_id not in contexts:
        raise ValueError("Missing retained conversation for " + case_id)
    return contexts[case_id]["messages"]
