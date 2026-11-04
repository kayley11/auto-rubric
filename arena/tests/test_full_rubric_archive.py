"""The full research output must survive a fresh checkout byte for byte."""

import json
import subprocess
import sys
from pathlib import Path


def test_frozen_research_archive_verifies_without_private_paths_or_api_calls():
    script = Path(__file__).resolve().parents[1] / "scripts/verify-full-rubric-archive.py"
    result = subprocess.run(
        [sys.executable, str(script)], capture_output=True, text=True, check=True
    )
    report = json.loads(result.stdout)
    assert report["archive_files_verified"] == 1692
    assert report["item_rows"] == 10296 and report["model_calls"] == 0
