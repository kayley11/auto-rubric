"""Offline multi-member checks. No real provider or clinical rating is produced."""

import asyncio
import hashlib
import json
import sqlite3
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import httpx
import pytest

import evidence
from engine import RUBRIC, Provider, Settings, validate_input
from job_queue import JobQueue, RetryJob
from membership import Membership
from personal_connections import Connections
from public_access import password_hash
from public_server import HostedServer
from scoring import rubric_snapshot


def wait_until(check, timeout=10):
    deadline = time.monotonic()+timeout
    while time.monotonic()<deadline:
        value = check()
        if value:
            return value
        time.sleep(0.02)
    pytest.fail("Offline background work did not settle in time.")


def test_queue_recovers_pending_work_at_a_new_storage_path(tmp_path):
    original = JobQueue(tmp_path / "old/jobs.sqlite3", workers=1)
    original.start = lambda: None
    ids = [original.enqueue("workspace", str(i), "generate", "user"+str(i)) for i in range(10)]
    original.close()
    restored = tmp_path / "restored/jobs.sqlite3"
    restored.parent.mkdir()
    with sqlite3.connect(original.path) as source, sqlite3.connect(restored) as target:
        source.backup(target)
    calls = []
    queue = JobQueue(restored, workers=2)
    try:
        queue.register("workspace", lambda job: calls.append((job["id"], job["actor"])))
        wait_until(lambda: not queue.pending("workspace"))
        assert {c[0] for c in calls} == set(ids)
        assert len(calls) == 10
    finally:
        queue.close()


def test_transient_jobs_move_behind_untouched_jobs_and_retries_are_bounded(tmp_path):
    queue = JobQueue(tmp_path / "jobs.sqlite3", workers=1, retry_seconds=0)
    calls = []
    original_start = queue.start
    queue.start = lambda: None
    queue.register("workspace", lambda job: None)
    for i in range(3):
        queue.enqueue("workspace", str(i), "generate", "owner")

    def process(job):
        calls.append(job["run_id"])
        if job["run_id"] == "0":
            raise RetryJob("Temporary offline fixture failure.")

    queue.handlers["workspace"] = process
    queue.start = original_start
    queue.start()
    try:
        wait_until(lambda: not queue.pending("workspace"))
        assert calls == ["0", "1", "2", "0", "0"]
        assert queue.latest("workspace", "0")["state"] == "failed"
        assert queue.latest("workspace", "0")["attempt"] == 3
    finally:
        queue.close()


def test_duplicate_jobs_and_cross_workspace_cancellation(tmp_path):
    queue = JobQueue(tmp_path / "jobs.sqlite3")
    queue.start = lambda: None
    queue.enqueue("one", "run", "generate", "owner")
    with pytest.raises(ValueError, match="already"):
        queue.enqueue("one", "run", "evaluate", "owner")
    queue.cancel("two", "run")
    assert queue.latest("one", "run")["state"] == "queued"
    queue.cancel("one", "run")
    assert queue.latest("one", "run")["state"] == "cancelled"


def test_invitation_is_single_use_and_cannot_grant_admin_or_replace_an_account(tmp_path):
    encoded = password_hash("offline-only-owner-password")
    users = {"owner":{"id":"owner", "role":"admin", "password_hash":encoded}}
    registry = Membership(tmp_path / "members.sqlite3", users)
    invitation = registry.invite("owner", "reviewer01")
    token = invitation["invite_path"].split("/")[-1]
    member = registry.accept(token, "offline-only-clinician-password")
    assert member["workspace"] == "owner" and member["role"] == "reviewer"
    assert registry.users()["owner"]["password_hash"] == encoded
    with pytest.raises(ValueError):
        registry.accept(token, "another-offline-password")
    with pytest.raises(ValueError):
        registry.invite("owner", "administrator", "admin")
    with pytest.raises(PermissionError):
        registry.invite("reviewer01", "another")
    assert token.encode() not in registry.path.read_bytes()


def test_personal_connections_are_encrypted_owner_bound_expiring_and_removable(tmp_path):
    store = Connections(tmp_path)
    secret = "offline-personal-key-000000000000"
    record = store.add("alice", {"provider":"groq", "label":"Research", "api_key":secret})
    settings = Settings("project", "https://offline.invalid")
    assert store.resolve("alice", record["id"], settings).api_key == secret
    assert secret not in json.dumps(store.list("alice"))
    assert secret.encode() not in store.path.read_bytes()
    assert not store.list("bob")
    with pytest.raises(PermissionError):
        store.resolve("bob", record["id"], settings)
    store.remove("bob", record["id"])
    assert store.resolve("alice", record["id"], settings).api_key == secret
    with store.connect() as db:
        db.execute("UPDATE connections SET expires=? WHERE id=?", (time.time()-1,record["id"]))
    with pytest.raises(PermissionError):
        store.resolve("alice", record["id"], settings)
    store.remove("alice", record["id"])
    assert not store.list("alice")
    with pytest.raises(ValueError):
        store.add("alice", {"provider":"http://127.0.0.1", "label":"Rejected", "api_key":secret})


class OfflineProvider:
    async def generate(self, data, capture):
        await asyncio.sleep(0.03)
        capture["response"] = {"usage":{"total_tokens":1}}
        return "OFFLINE SOFTWARE TEST: "+data["case_code"]

    async def grade(self, data, cid, capture):
        return {"status":"scored", "score":3, "reason":"Offline software fixture only."}


@pytest.fixture
def team(tmp_path):
    password = "offline-only-member-password"
    encoded = password_hash(password)
    accounts = [{"id":"owner", "role":"admin", "password_hash":encoded}]
    accounts += [{"id":f"clinician{i:02}", "role":"evaluator", "workspace":"owner",
                  "password_hash":encoded} for i in range(10)]
    accounts += [{"id":"review-only", "role":"reviewer", "workspace":"owner", "password_hash":encoded}]
    server = HostedServer(("127.0.0.1",0), tmp_path, "http://127.0.0.1:0", json.dumps(accounts),
                          "offline-session-secret-with-more-than-32-characters",
                          Settings("offline-project-key", "https://offline.invalid/v1"), OfflineProvider())
    server.public_origin = f"http://127.0.0.1:{server.server_port}"
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    clients = []

    def login(identifier):
        client = httpx.Client(base_url=server.public_origin, timeout=20, trust_env=False,
                             headers={"Origin":server.public_origin})
        assert client.post("/api/access/login",json={"id":identifier,"password":password}).status_code == 200
        clients.append(client)
        return client

    try:
        yield server, login
    finally:
        for client in clients:
            client.close()
        server.shutdown()
        server.server_close()
        thread.join(3)


def test_ten_members_log_in_and_generate_without_busy_rejections_or_mixed_answers(team):
    server, login = team

    def submit(i):
        client = login(f"clinician{i:02}")
        response = client.post("/api/runs",json={"action":"generate","case_code":f"QA{i:02}",
            "facts":"Offline software fixture; no clinical findings.","task":"Return the supplied code.",
            "criteria":["D1"],"answer_model":"arc:lite"})
        assert response.status_code == 202, response.text
        return client, response.json()["id"]

    with ThreadPoolExecutor(max_workers=10) as pool:
        runs = list(pool.map(submit, range(10)))
    wait_until(lambda: not server.queue.pending("owner"))
    for i,(client,identifier) in enumerate(runs):
        saved = client.get("/api/runs/"+identifier).json()
        assert saved["status"] == "answer_ready"
        assert saved["input"]["answer"] == f"OFFLINE SOFTWARE TEST: QA{i:02}"
        assert saved["submitted_by"] == f"clinician{i:02}"


def test_ten_independent_reviews_do_not_inherit_other_scores_or_unlock_their_results(team, monkeypatch):
    server, login = team
    data = validate_input({"facts":"Offline synthetic fixture.","task":"Explain supplied facts.",
        "criteria":[row["id"] for row in RUBRIC["criteria"]],"answer":"Offline saved answer."})
    run = {"id":"a"*32,"input":data,"rubric":rubric_snapshot(RUBRIC,"original"),
           "grades":{},"answer_source":"pasted"}
    packet = evidence.run_packet(run)
    monkeypatch.setattr(evidence,"get_packet",lambda *args: packet)
    catalogue = [{"id":packet["id"],"case_id":"QA", "name":"Offline answer", "batch":"Software test",
                  "response":"Answer A","items":list(packet["rules"])}]
    monkeypatch.setattr(evidence,"review_catalogue",lambda app: [dict(r) for r in catalogue])
    clients = [login(f"clinician{i:02}") for i in range(10)]
    path = "/api/review/"+packet["id"]
    order = ["D3a"]+[cid for cid in packet["rules"] if cid != "D3a"]

    def rate(i):
        score = str(i%5+1)
        result = clients[i].post(path+"/rating",json={"reviewer":"spoofed-other-account",
            "items":{cid:{"score":score,"note":f"Offline reviewer {i}"} for cid in order}})
        assert result.status_code == 200, result.text
        return result.json()

    rate(0)
    assert clients[1].post(path+"/reveal",json={}).status_code == 400
    assert clients[1].get(path).json()["review"] is None
    with ThreadPoolExecutor(max_workers=9) as pool:
        list(pool.map(rate,range(1,10)))
    for i,client in enumerate(clients):
        record = client.get(path).json()["review"]
        assert record["account_id"] == f"clinician{i:02}"
        assert len(record["items"]) == len(order) == 22
        assert {r["score"] for r in record["items"].values()} == {str(i%5+1)}
        assert {r["note"] for r in record["items"].values()} == {f"Offline reviewer {i}"}
        assert client.get("/api/review").json()[0]["completed"] is True
    history = server.apps["owner"]._reviews.history("rating",packet["id"])
    assert len(history) == 10 and len({r["account_id"] for r in history}) == 10


def test_reviewer_cannot_invite_change_rules_or_run_models_and_cannot_read_another_key(team):
    _, login = team
    owner, reviewer = login("owner"), login("review-only")
    response = owner.post("/api/connections",json={"provider":"groq", "label":"Private",
        "api_key":"offline-private-owner-key-00000000"})
    identifier = response.json()["id"]
    assert reviewer.get("/api/connections").json()["connections"] == []
    assert reviewer.post(f"/api/connections/{identifier}/test",json={}).status_code == 403
    assert reviewer.get("/api/members").status_code == 403
    assert reviewer.post("/api/members/invitations",json={"member_id":"extra"}).status_code == 403
    assert reviewer.post("/api/rubrics/manage",json={}).status_code == 403
    assert reviewer.post("/api/runs",json={"action":"generate"}).status_code == 403
    assert reviewer.post("/api/batches",json={"jobs":[]}).status_code == 403


def test_twenty_case_batch_finishes_after_the_submitting_browser_disconnects(team):
    server, login = team
    client = login("clinician00")
    jobs = [{"key":f"cell-{i}","row_id":f"row-{i}","model":"arc:lite","input":{
        "case_code":f"BATCH_QA_{i}","case_number":str(i),"facts":"Offline software fixture.",
        "task":"Summarise the supplied facts.","criteria":["D1","D2b"],
        "answer_model":"arc:lite","judge_model":"arc:apex","comparison_id":"fixture-batch"}}
        for i in range(20)]
    body = {"jobs":jobs,"request_id":"1"*32}
    response = client.post("/api/batches",json=body)
    assert response.status_code == 202, response.text
    identifier = response.json()["id"]
    client.close()
    wait_until(lambda: not server.apps["owner"].batches.read(identifier)["active"])
    reopened = login("clinician00")
    result = reopened.get(f"/api/batches/{identifier}?include_inputs=1").json()
    assert len(result["tasks"]) == len(result["cells"]) == 20
    assert {c["status"] for c in result["cells"]} == {"complete"}
    assert all(len(c["run"]["grades"]) == 2 for c in result["cells"])
    run_ids = {c["run_id"] for c in result["cells"]}
    duplicate = reopened.post("/api/batches",json=body)
    assert duplicate.json()["id"] == identifier
    assert {c["run_id"] for c in duplicate.json()["cells"]} == run_ids
    for cell in result["cells"]:
        saved = server.apps["owner"].load(cell["run_id"])
        assert len(saved["generation_attempts"]) == 1
        assert saved["input"]["answer"].endswith(saved["input"]["case_code"])


def test_concurrent_real_rubric_adapters_do_not_mix_personal_provider_credentials(monkeypatch):
    keys = {"offline-personal-A-00000000":"fixture/model-a", "offline-personal-B-00000000":"fixture/model-b"}
    observed = []

    async def post(self, url, **kwargs):
        key = kwargs["headers"]["Authorization"].removeprefix("Bearer ")
        model = kwargs["json"]["model"]
        assert keys[key] == model
        await asyncio.sleep(0.03)
        observed.append((key,model))
        return httpx.Response(200,request=httpx.Request("POST",url),json={
            "id":"fixture","object":"chat.completion","created":0,"model":model,
            "choices":[{"index":0,"finish_reason":"stop","message":{"role":"assistant",
                "content":json.dumps({"selected_option":4,"selected_label":"4","explanation":"Offline transport isolation fixture."})}}],
            "usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}})

    monkeypatch.setattr(httpx.AsyncClient,"post",post)

    def grade(pair):
        key,model = pair
        provider = Provider(Settings(key,"https://offline.invalid/v1"))
        data = validate_input({"facts":"Offline fixture.","task":"Assess supplied facts.",
            "answer":"The available evidence remains incomplete.","criteria":["D1"],"judge_model":model})
        return asyncio.run(provider.grade(data,"D1",{}))

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(grade,keys.items()))
    assert [r["score"] for r in results] == [4,4]
    assert set(observed) == set(keys.items())


def test_members_can_be_disabled_reenabled_and_reset_without_losing_their_workspace(team):
    server, login = team
    owner, clinician = login("owner"), login("clinician00")
    assert owner.post("/api/members/clinician00/update",json={"active":False}).status_code == 200
    assert clinician.get("/api/config").json()["access"]["authenticated"] is False
    assert owner.post("/api/members/owner/update",json={"active":False}).status_code == 403
    assert owner.post("/api/members/clinician00/update",json={"active":True,"role":"reviewer"}).status_code == 200
    assert clinician.post("/api/runs",json={"action":"generate"}).status_code == 403
    invitation = owner.post("/api/members/clinician00/reset-invite",json={}).json()
    new_password = "offline-new-personal-password"
    accepted = owner.post("/api/access/accept-invite",json={
        "token":invitation["invite_path"].split("/")[-1],"password":new_password})
    assert accepted.status_code == 201
    assert clinician.get("/api/config").json()["access"]["authenticated"] is False
    member = server.membership.users()["clinician00"]
    assert member["role"] == "reviewer" and member["workspace"] == "owner"
    assert owner.post("/api/access/login",json={"id":"clinician00","password":new_password}).status_code == 200


def test_one_users_large_batch_does_not_monopolise_the_ready_queue(tmp_path):
    queue = JobQueue(tmp_path/"jobs.sqlite3", workers=1)
    queue.start = lambda: None
    queue.register("shared",lambda job: None)
    for i in range(12):
        queue.enqueue("shared",f"batch-{i}","generate","batch-owner")
    queue.enqueue("shared","other-users-case","generate","other-user")
    first = queue.claim("worker")
    queue.settle(first,"done")
    second = queue.claim("worker")
    assert first["actor"] == "batch-owner"
    assert second["actor"] == "other-user"


def test_expired_connections_do_not_block_new_connections(tmp_path):
    store = Connections(tmp_path)
    for i in range(20):
        saved = store.add("member",{"provider":"groq","label":f"Expired {i}","api_key":"offline-expired-key-000000"})
        with store.connect() as db:
            db.execute("UPDATE connections SET expires=0 WHERE id=?",(saved["id"],))
    current = store.add("member",{"provider":"groq","label":"Current","api_key":"offline-current-key-000000"})
    assert [c["id"] for c in store.list("member")] == [current["id"]]


def test_batch_cancel_is_scoped_and_keeps_completed_output(team):
    server,login = team
    app = server.apps["owner"]
    app.queue.start = lambda: None
    client = login("clinician00")
    job = {"key":"one","input":{"facts":"Offline fixture.","task":"Summarise.","criteria":["D1"]}}
    response = client.post("/api/batches",json={"jobs":[job],"request_id":"9"*32})
    identifier = response.json()["id"]
    wait_until(lambda: app.batches.read(identifier)["cells"][0]["run_id"])
    other = login("clinician01")
    assert other.post(f"/api/batches/{identifier}/cancel",json={}).status_code == 403
    cancelled = client.post(f"/api/batches/{identifier}/cancel",json={})
    assert cancelled.status_code == 200
    saved = app.batches.read(identifier)
    run_id = saved["cells"][0]["run_id"]
    assert app.queue.latest(app.queue_space,run_id)["state"] == "cancelled"
    assert app.load(run_id)["input"]["facts"] == "Offline fixture."


def test_retry_reuses_saved_generation_and_completed_items(team):
    server,login = team
    calls = []
    class TemporaryFailure(OfflineProvider):
        async def grade(self,data,cid,capture):
            calls.append(cid)
            if cid == "D2b" and calls.count(cid)==1:
                capture["retryable"] = True
                raise TimeoutError("Offline temporary timeout.")
            return await super().grade(data,cid,capture)
    app=server.apps["owner"]
    app._provider=TemporaryFailure()
    server.queue.retry_seconds=0
    client=login("clinician00")
    result=client.post("/api/batches",json={"jobs":[{"key":"retry","input":{
        "facts":"Offline fixture.","task":"Summarise.","case_code":"QA_RETRY","criteria":["D1","D2b"]}}]}).json()
    wait_until(lambda: not app.batches.read(result["id"])["active"])
    cell=app.batches.read(result["id"])["cells"][0]
    assert cell["status"] == "complete"
    run=app.load(cell["run_id"])
    assert len(run["generation_attempts"]) == 1
    assert calls == ["D1","D2b","D2b"]
    assert len(run["grades"]["D2b"]["attempts"]) == 2
