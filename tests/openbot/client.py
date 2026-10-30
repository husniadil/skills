# /// script
# requires-python = ">=3.12"
# dependencies = ["mcp==2.3.0"]
# ///
"""Drives scripts/mcp-server.py, over stdio and over --http, against a stand-in OpenBot.

The stand-in is an HTTP server here, answering the Local scripts routes the way OpenBot's
docs/automation.md describes them. check.sh's stand-in docker runs the server's curl on this
machine, with the automation files written where the container would keep them.

Every line ends in ok or FAIL, and the exit code counts FAILs.
"""

import asyncio
import json
import os
import socket
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import httpx2
from mcp import Client
from mcp.client.stdio import StdioServerParameters
from mcp.client.streamable_http import streamable_http_client

SERVER = Path(sys.argv[1])
WORK = Path(sys.argv[2])
AUTOMATION = WORK / "docker" / "home" / ".config" / "OpenBot" / "automation"
CALLS = WORK / "docker" / "calls"
TOKEN = "tok-123"
FAILS = 0

AGENTS = [
    {"id": "agent-1", "name": "Ada", "routines": [{"id": "routine-1", "name": "Wake", "active": False}]},
    {"id": "agent-2", "name": "Twin", "routines": []},
    {"id": "agent-3", "name": "twin", "routines": []},
]


def check(name: str, ok: bool, detail: object = "") -> None:
    global FAILS
    if ok:
        print(f"{name}: ok")
    else:
        FAILS += 1
        print(f"{name}: FAIL ({str(detail)[:400]})")


def text(result) -> str:
    return " ".join(c.text for c in result.content if c.type == "text")


class OpenBot:
    """What the stand-in has been asked, and the deliveries it holds."""

    def __init__(self) -> None:
        self.requests: list[dict] = []
        self.deliveries: dict[str, dict] = {}


BOT = OpenBot()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_: object) -> None:
        pass

    def answer(self, status: int, body: object) -> None:
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def handle_any(self, method: str) -> None:
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b""
        BOT.requests.append(
            {
                "method": method,
                "path": self.path,
                "body": json.loads(raw) if raw else None,
                "content_type": self.headers.get("Content-Type"),
            }
        )
        if self.headers.get("Authorization") != f"Bearer {TOKEN}":
            return self.answer(401, {"error": "The token is missing or wrong."})
        parts = self.path.split("/")[1:]
        if self.path == "/v1/agents" and method == "GET":
            return self.answer(200, AGENTS)
        if len(parts) < 4 or parts[:2] != ["v1", "agents"] or parts[2] not in {a["id"] for a in AGENTS}:
            return self.answer(404, {"error": "The agent does not exist."})
        rest = parts[3:]
        body = json.loads(raw) if raw else {}
        if rest == ["messages"] and method == "POST":
            delivery = f"d-{len(BOT.deliveries) + 1}"
            BOT.deliveries[delivery] = {"text": body["text"], "reads": 0}
            return self.answer(
                202,
                {
                    "messageId": f"m-{delivery}",
                    "deliveries": [{"id": delivery, "recipientAgentId": parts[2], "status": "queued", "position": 1}],
                },
            )
        if rest[:1] == ["deliveries"] and method == "GET":
            held = BOT.deliveries.get(rest[1])
            if held is None:
                return self.answer(404, {"error": "Delivery not found."})
            held["reads"] += 1
            state = {"id": rest[1], "status": "running", "turnId": rest[1], "error": None, "answer": None}
            if held["text"] == "fail":
                state.update(status="failed", error="provider down")
            elif held["text"] not in ("slow", "ask") and held["reads"] > 2:
                state.update(status="completed", answer=f"Echo: {held['text']}")
            return self.answer(200, state)
        if rest == ["pending"] and method == "GET":
            asking = any(d["text"] == "ask" for d in BOT.deliveries.values())
            approvals = [{"requestId": "r-1", "kind": "command", "command": "rm -rf build"}] if asking else []
            return self.answer(200, {"prompts": [], "approvals": approvals, "browserTakeovers": []})
        if rest[:1] == ["prompts"] and rest[2:] == ["answer"] and method == "POST":
            if rest[1] == "expired":
                return self.answer(409, {"error": "The request expired."})
            return self.answer(200, {"ok": True})
        if rest[:1] == ["approvals"] and rest[2:] == ["respond"] and method == "POST":
            return self.answer(200, {"ok": True})
        if rest == ["settings"] and method == "POST":
            return self.answer(200, {"id": parts[2], "name": "Ada", **body})
        if rest == ["context", "clear"] and method == "POST":
            return self.answer(200, {"ok": True})
        if rest[:1] == ["routines"] and rest[2:] == ["run"] and method == "POST":
            return self.answer(202, {"runId": "run-1", "deliveryId": None})
        return self.answer(404, {"error": "No such route."})

    def do_GET(self) -> None:
        self.handle_any("GET")

    def do_POST(self) -> None:
        self.handle_any("POST")


def start_openbot() -> None:
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    AUTOMATION.mkdir(parents=True)
    (AUTOMATION / "url").write_text(f"http://127.0.0.1:{httpd.server_port}")
    (AUTOMATION / "token").write_text(TOKEN)
    (AUTOMATION / "headers").write_text(f"Authorization: Bearer {TOKEN}")


def last(method: str, contains: str) -> dict | None:
    return next((r for r in reversed(BOT.requests) if r["method"] == method and contains in r["path"]), None)


def stdio(env: dict[str, str]) -> StdioServerParameters:
    return StdioServerParameters(command="uv", args=["run", "--quiet", "--script", str(SERVER)], env=env)


async def over_stdio() -> None:
    env = {**os.environ, "OPENBOT_CONTAINER": "openbot-test"}
    async with Client(stdio(env)) as client:
        tools = {t.name: t for t in (await client.list_tools()).tools}
        check(
            "nine tools",
            set(tools)
            == {
                "list_agents",
                "send_message",
                "get_delivery",
                "get_pending",
                "answer_prompt",
                "respond_approval",
                "set_model",
                "new_chat",
                "run_routine",
            },
            sorted(tools),
        )
        check("list_agents is read-only", tools["list_agents"].annotations.read_only_hint is True)
        check("respond_approval is destructive", tools["respond_approval"].annotations.destructive_hint is True)

        listed = await client.call_tool("list_agents", {})
        check(
            "list_agents lists the agents", len((listed.structured_content or {}).get("agents", [])) == 3, text(listed)
        )
        call = CALLS.read_text().splitlines()[-1]
        check(
            "the call goes into the named container",
            call.startswith("openbot-test sh -c ") and call.endswith(" sh GET /v1/agents none"),
            call,
        )

        # A name ignores case, and the turn is followed to its answer.
        sent = await client.call_tool("send_message", {"agent": "ADA", "text": "hello there"})
        got = sent.structured_content or {}
        check("send_message: answer", got.get("finished") is True and got.get("answer") == "Echo: hello there", got)
        posted = last("POST", "/messages")
        key = (posted or {}).get("body", {}).get("clientMessageId", "")
        check("send_message: a new key per message", key.startswith("mcp-"), posted)
        first_delivery = got.get("delivery_id")

        keyed = await client.call_tool("send_message", {"agent": "agent-1", "text": "again", "message_key": "k-1"})
        posted = last("POST", "/messages")
        check("send_message: message_key is the retry key", (posted or {})["body"]["clientMessageId"] == "k-1", posted)
        check("send_message: by id", (keyed.structured_content or {}).get("finished") is True, text(keyed))

        started = time.monotonic()
        slow = await client.call_tool("send_message", {"agent": "Ada", "text": "slow", "wait_seconds": 2})
        took = time.monotonic() - started
        got = slow.structured_content or {}
        check("wait runs out: not finished", got.get("finished") is False and got.get("status") == "running", got)
        check("wait runs out: says get_delivery", "get_delivery" in (got.get("next_step") or ""), got)
        check("wait runs out: returns near the wait", took < 6, f"{took:.1f} s")

        again = await client.call_tool(
            "get_delivery", {"agent": "Ada", "delivery_id": first_delivery, "wait_seconds": 0}
        )
        check(
            "get_delivery: reads an ended delivery",
            (again.structured_content or {}).get("answer") == "Echo: hello there",
            text(again),
        )

        started = time.monotonic()
        asked = await client.call_tool("send_message", {"agent": "Ada", "text": "ask", "wait_seconds": 60})
        took = time.monotonic() - started
        got = asked.structured_content or {}
        approvals = (got.get("waiting_for_person") or {}).get("approvals") or []
        check(
            "a question stops the wait",
            got.get("finished") is False and approvals[:1] and approvals[0]["requestId"] == "r-1",
            got,
        )
        check("a question stops the wait early", took < 15, f"{took:.1f} s")

        failed = await client.call_tool("send_message", {"agent": "Ada", "text": "fail"})
        got = failed.structured_content or {}
        check("a failed turn ends the wait", got.get("status") == "failed" and got.get("error") == "provider down", got)

        accepted = await client.call_tool(
            "respond_approval", {"agent": "Ada", "request_id": "r-1", "decision": "accept"}
        )
        posted = last("POST", "/approvals/")
        check(
            "respond_approval passes the decision",
            accepted.is_error is not True and posted["body"] == {"decision": "accept"},
            posted,
        )
        odd = await client.call_tool("respond_approval", {"agent": "Ada", "request_id": "r-1", "decision": "maybe"})
        check("respond_approval takes accept or decline only", odd.is_error is True, text(odd))

        expired = await client.call_tool(
            "answer_prompt", {"agent": "Ada", "request_id": "expired", "answers": {"build": ["Debug"]}}
        )
        check(
            "OpenBot's refusal is passed on",
            expired.is_error is True and "409" in text(expired) and "The request expired." in text(expired),
            text(expired),
        )
        posted = last("POST", "/prompts/")
        check("answer_prompt passes the answers", posted["body"] == {"answers": {"build": ["Debug"]}}, posted)

        climbed = await client.call_tool("get_delivery", {"agent": "Ada", "delivery_id": "../../x", "wait_seconds": 0})
        asked_for = last("GET", "/deliveries/")
        check(
            "an id stays in its path segment",
            asked_for and asked_for["path"].endswith("/deliveries/..%2F..%2Fx"),
            asked_for,
        )
        check(
            "an unknown delivery is refused",
            climbed.is_error is True and "Delivery not found." in text(climbed),
            text(climbed),
        )

        unknown = await client.call_tool("get_pending", {"agent": "Zed"})
        check(
            "an unknown agent names the agents there are",
            unknown.is_error is True and "Ada (agent-1)" in text(unknown),
            text(unknown),
        )
        twins = await client.call_tool("get_pending", {"agent": "twin"})
        check(
            "a name two agents share is refused",
            twins.is_error is True and "2 agents are called" in text(twins),
            text(twins),
        )

        bare = await client.call_tool("set_model", {"agent": "Ada"})
        check("set_model needs a change", bare.is_error is True, text(bare))
        await client.call_tool("set_model", {"agent": "Ada", "model": "m1", "reasoning_effort": "high"})
        posted = last("POST", "/settings")
        check(
            "set_model sends only what was given", posted["body"] == {"model": "m1", "reasoningEffort": "high"}, posted
        )

        cleared = await client.call_tool("new_chat", {"agent": "Ada"})
        posted = last("POST", "/context/clear")
        check(
            "new_chat posts no body",
            cleared.is_error is not True and posted["body"] is None and posted["content_type"] is None,
            posted,
        )

        await client.call_tool("run_routine", {"agent": "Ada", "routine": "wake", "payload": "build passed"})
        posted = last("POST", "/routines/")
        check(
            "run_routine finds the routine by name",
            posted["path"].endswith("/routines/routine-1/run") and posted["body"] == {"payload": "build passed"},
            posted,
        )
        missing = await client.call_tool("run_routine", {"agent": "Ada", "routine": "nope"})
        check(
            "run_routine names the routines there are",
            missing.is_error is True and "Wake (routine-1)" in text(missing),
            text(missing),
        )

        # OpenBot deletes the files when the last agent turns Local scripts off, or when it quits.
        (AUTOMATION / "url").rename(AUTOMATION / "url.off")
        closed = await client.call_tool("list_agents", {})
        (AUTOMATION / "url.off").rename(AUTOMATION / "url")
        check(
            "no API open says how to turn it on",
            closed.is_error is True and "Local scripts" in text(closed),
            text(closed),
        )

    async with Client(stdio({**os.environ, "OPENBOT_CONTAINER": "openbot-gone"})) as client:
        gone = await client.call_tool("list_agents", {})
        check(
            "a missing container is named",
            gone.is_error is True and "No such container: openbot-gone" in text(gone),
            text(gone),
        )

    unset = {k: v for k, v in os.environ.items() if k != "OPENBOT_CONTAINER"}
    done = subprocess.run(
        ["uv", "run", "--quiet", "--script", str(SERVER)], env=unset, capture_output=True, text=True, timeout=60
    )
    check(
        "no container set: refuses to start", done.returncode != 0 and "OPENBOT_CONTAINER" in done.stderr, done.stderr
    )


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


async def over_http() -> None:
    token_file = WORK / "mcp-token"
    token = "t" * 40
    token_file.write_text(token + "\n")
    env = {**os.environ, "OPENBOT_CONTAINER": "openbot-test", "OPENBOT_MCP_TOKEN_FILE": str(token_file)}

    short = WORK / "short-token"
    short.write_text("abc")
    done = subprocess.run(
        ["uv", "run", "--quiet", "--script", str(SERVER), "--http"],
        env={**env, "OPENBOT_MCP_TOKEN_FILE": str(short)},
        capture_output=True,
        text=True,
        timeout=60,
    )
    check("--http refuses a short token", done.returncode != 0 and "shorter than 32" in done.stderr, done.stderr)

    port = free_port()
    proc = subprocess.Popen(
        ["uv", "run", "--quiet", "--script", str(SERVER), "--http"],
        env={**env, "OPENBOT_MCP_PORT": str(port)},
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    url = f"http://127.0.0.1:{port}/mcp"
    try:
        async with httpx2.AsyncClient() as http:
            for _ in range(100):
                try:
                    await http.get(f"http://127.0.0.1:{port}/")
                    break
                except httpx2.TransportError:
                    await asyncio.sleep(0.1)
            hello = {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
            plain = await http.post(url, json=hello)
            check("--http: no bearer is refused", plain.status_code == 401, plain.status_code)
            wrong = await http.post(url, json=hello, headers={"Authorization": "Bearer " + "x" * 40})
            check("--http: a wrong bearer is refused", wrong.status_code == 401, wrong.status_code)

        # The proxy in front sends its own name as Host.
        headers = {"Authorization": f"Bearer {token}", "Host": "openbot-test.exe.xyz"}
        async with httpx2.AsyncClient(headers=headers) as http:
            async with Client(streamable_http_client(url, http_client=http)) as client:
                listed = await client.call_tool("list_agents", {})
                check(
                    "--http: the bearer and a proxy's Host get through",
                    len((listed.structured_content or {}).get("agents", [])) == 3,
                    text(listed),
                )
    finally:
        proc.terminate()
        proc.wait(10)


async def main() -> None:
    start_openbot()
    await over_stdio()
    await over_http()


asyncio.run(main())
sys.exit(FAILS)
