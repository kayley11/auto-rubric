"""Copy the UI and public-only study responses into the separate Sites checkout."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
import tempfile
import threading
from pathlib import Path

import httpx

ARENA = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ARENA))

import evidence  # noqa: E402
import study  # noqa: E402
from engine import Settings  # noqa: E402
from public_access import password_hash  # noqa: E402
from public_server import HostedServer  # noqa: E402


def prepare(destination):
    destination = Path(destination).resolve()
    manifest = destination / ".openai/hosting.json"
    if not json.loads(manifest.read_text()).get("project_id"):
        raise ValueError("Register and open the selected Site first.")
    for name in ("src", "scripts"):
        shutil.copytree(ARENA / name, destination / name, dirs_exist_ok=True)
    for name in ("index.html", "package.json", "package-lock.json", "vite.config.mjs"):
        shutil.copy2(ARENA / name, destination / name)
    package_file = destination / "package.json"
    package = json.loads(package_file.read_text())
    package["scripts"]["test:sites"] = "node --test tests/hosting-worker.test.mjs"
    package_file.write_text(json.dumps(package, indent=2) + "\n")
    tests = destination / "tests"
    tests.mkdir(exist_ok=True)
    test_source = (ARENA / "tests/hosting-worker.test.mjs").read_text()
    (tests / "hosting-worker.test.mjs").write_text(
        test_source.replace("../hosting/worker.js", "../worker/index.js")
    )
    worker = destination / "worker"
    worker.mkdir(exist_ok=True)
    shutil.copy2(ARENA / "hosting/worker.js", worker / "index.js")
    (destination / ".gitignore").write_text("node_modules/\ndist/\n.env*\n.DS_Store\n")

    with tempfile.TemporaryDirectory() as directory:
        users = json.dumps(
            [
                {
                    "id": "R01",
                    "role": "admin",
                    "password_hash": password_hash("snapshot-only-not-a-real-member-password"),
                }
            ]
        )
        server = HostedServer(
            ("127.0.0.1", 0),
            directory,
            "http://127.0.0.1:0",
            users,
            "snapshot-only-not-a-deployment-session-secret",
            Settings("", "https://offline.invalid/v1"),
            object(),
        )
        server.public_origin = f"http://127.0.0.1:{server.server_port}"
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        public = destination / "public/_public"
        public.mkdir(parents=True, exist_ok=True)
        # Remove only the last generated public snapshot, never research or private records.
        for file in public.glob("*.body"):
            file.unlink()
        routes = {"/api/config", "/api/runs", "/api/study", "/api/followup", "/api/review"}
        for row in study.dataset()["interviews"]:
            suffix = f"/{row['case_id']}/{row['model_slug']}"
            for action in ("interviews", "source", "evaluation-input"):
                routes.add("/api/study/" + action + suffix)
        for filename in study.dataset()["output_hashes"] | evidence.followup()["output_hashes"]:
            routes.add("/api/study/files/" + filename)
        for packet in evidence.packets(server.public_app):
            identifier = packet["id"]
            for prefix, suffix in (
                ("evidence", ""),
                ("evidence", "/summary"),
                ("evidence", "/blind"),
                ("requirements", ""),
                ("review", "/D3a"),
            ):
                routes.add(f"/api/{prefix}/{identifier}{suffix}")
        output = {}
        try:
            with httpx.Client(base_url=server.public_origin, timeout=20) as client:
                for route in sorted(routes):
                    response = client.get(route)
                    if response.status_code != 200:
                        raise ValueError(f"Snapshot failed: {route}: {response.status_code}")
                    body = response.content
                    if route == "/api/config":
                        config = response.json()
                        config["settings"]["configured"] = False
                        config["access"]["online"] = False
                        body = json.dumps(config, ensure_ascii=False).encode()
                    name = hashlib.sha256(route.encode()).hexdigest()[:24] + ".body"
                    (public / name).write_bytes(body)
                    output[route] = {
                        "file": name,
                        "content_type": response.headers["Content-Type"],
                        "disposition": response.headers.get("Content-Disposition"),
                    }
        finally:
            server.shutdown()
            server.server_close()
            thread.join(2)
        (public / "manifest.json").write_text(json.dumps(output, indent=2) + "\n")
    print(
        f"Prepared UI and {len(output)} public study routes; no private runs or credentials copied."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("destination", type=Path)
    prepare(parser.parse_args().destination)
