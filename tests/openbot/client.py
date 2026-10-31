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
from mcp_types import ElicitRequestParams, ElicitResult

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


APPROVAL = {
    "requestId": "r-1",
    "kind": "command",
    "command": "rm -rf build",
    "cwd": "/data/work",
    "reason": "clean the build",
}
QUESTION = {
    "requestId": "p-1",
    "requiresOpenBot": False,
    "questions": [
        {
            "id": "build",
            "header": "Build",
            "question": "Which build?",
            "options": [{"label": "Debug"}, {"label": "Release"}],
        },
        {
            "id": "targets",
            "header": "Targets",
            "question": "Which targets?",
            "multiSelect": True,
            "options": [{"label": "web"}, {"label": "ios"}],
        },
        {"id": "note", "header": "Note", "question": "Anything else?", "options": []},
    ],
}
SECRET = {"requestId": "p-2", "requiresOpenBot": True, "questions": []}
# An approval of one of OpenBot's own tools, as save_mcp_server asked one on OpenBot 0.54.0.
TOOL_APPROVAL = {
    "requestId": "r-2",
    "kind": "permissions",
    "command": None,
    "cwd": None,
    "reason": "Add the MCP server approval-form-test: https://example.invalid/mcp.",
    "grantRoot": None,
    "permissions": None,
}
# A pick-several question as the Local scripts API handed one over on OpenBot 0.54.0: no
# options, and the choices written into the question on lines of their own.
FLAT_QUESTION = {
    "requestId": "p-3",
    "requiresOpenBot": False,
    "questions": [
        {
            "id": "choice",
            "header": "Which platforms should the test cover?",
            "question": "Which platforms should the test cover?\n\n- Web\n- iOS\n- Android",
            "options": None,
        }
    ],
}
# The same question with a note after a label, and one cut at the question's limit.
FLAT_NOTE = {
    "requestId": "p-4",
    "requiresOpenBot": False,
    "questions": [
        {
            "id": "choice",
            "header": "Which days?",
            "question": "Which days?\n\n- Monday (work)\n- Friday",
            "options": None,
        }
    ],
}
FLAT_CUT = {
    "requestId": "p-5",
    "requiresOpenBot": False,
    "questions": [
        {"id": "choice", "header": "Which days?", "question": "Which days?\n\n- Monday\n- Fri…", "options": None}
    ],
}


class OpenBot:
    """What the stand-in has been asked, the deliveries it holds, and what waits on a person.

    A message "ask" makes the agent wait for an approval, "question" for an answer to
    QUESTION, and "secret" for one only OpenBot can take. An answer clears what it answered.
    """

    def __init__(self) -> None:
        self.requests: list[dict] = []
        self.deliveries: dict[str, dict] = {}
        self.approvals: list[dict] = []
        self.prompts: list[dict] = []


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
            if body["text"] == "ask":
                BOT.approvals = [APPROVAL]
            elif body["text"] == "ask-tool":
                BOT.approvals = [TOOL_APPROVAL]
            elif body["text"] == "flat-question":
                BOT.prompts = [FLAT_QUESTION]
            elif body["text"] == "flat-note":
                BOT.prompts = [FLAT_NOTE]
            elif body["text"] == "flat-cut":
                BOT.prompts = [FLAT_CUT]
            elif body["text"] == "question":
                BOT.prompts = [QUESTION]
            elif body["text"] == "secret":
                BOT.prompts = [SECRET]
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
            # "later" ends after about 6 s of reads, past the 5 s a call has before it is a task.
            elif held["text"] not in ("slow", "ask", "question", "secret") and held["reads"] > (
                6 if held["text"] == "later" else 2
            ):
                state.update(status="completed", answer=f"Echo: {held['text']}")
            return self.answer(200, state)
        if rest == ["pending"] and method == "GET":
            return self.answer(200, {"prompts": BOT.prompts, "approvals": BOT.approvals, "browserTakeovers": []})
        if rest[:1] == ["prompts"] and rest[2:] == ["answer"] and method == "POST":
            if rest[1] == "expired":
                return self.answer(409, {"error": "The request expired."})
            BOT.prompts = [p for p in BOT.prompts if p["requestId"] != rest[1]]
            return self.answer(200, {"ok": True})
        if rest[:1] == ["approvals"] and rest[2:] == ["respond"] and method == "POST":
            BOT.approvals = [a for a in BOT.approvals if a["requestId"] != rest[1]]
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
        shown = {name: set(tools[name].input_schema["properties"]) for name in ("respond_approval", "answer_prompt")}
        check(
            "the form's outcome is no argument a model passes",
            shown
            == {
                "respond_approval": {"agent", "request_id", "decision"},
                "answer_prompt": {"agent", "request_id", "answers"},
            },
            shown,
        )

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
        check(
            "without forms the caller's decision is sent",
            (accepted.structured_content or {}).get("decided_by") == "caller",
            text(accepted),
        )
        odd = await client.call_tool("respond_approval", {"agent": "Ada", "request_id": "r-1", "decision": "maybe"})
        check("respond_approval takes accept or decline only", odd.is_error is True, text(odd))
        bare = await client.call_tool("respond_approval", {"agent": "Ada", "request_id": "r-1"})
        check(
            "without forms a decision is required",
            bare.is_error is True and "Pass the person's decision" in text(bare),
            text(bare),
        )

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

    await with_forms(env)

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


async def with_forms(env: dict[str, str]) -> None:
    """A client that shows forms: the person is asked, and what they chose is what is sent."""
    asked: list[ElicitRequestParams] = []
    reply: list[ElicitResult] = []

    async def person(_: object, params: ElicitRequestParams) -> ElicitResult:
        asked.append(params)
        return reply.pop(0)

    def posts(contains: str) -> int:
        return sum(1 for r in BOT.requests if r["method"] == "POST" and contains in r["path"])

    async with Client(stdio(env), elicitation_callback=person) as client:
        await client.call_tool("send_message", {"agent": "Ada", "text": "ask", "wait_seconds": 0})
        reply.append(ElicitResult(action="accept", content={}))
        accepted = await client.call_tool(
            "respond_approval", {"agent": "Ada", "request_id": "r-1", "decision": "decline"}
        )
        posted = last("POST", "/approvals/")
        check(
            "forms: the person's accept is sent, whatever the model passed",
            posted["body"] == {"decision": "accept"}
            and (accepted.structured_content or {}).get("decided_by") == "person",
            [posted, text(accepted)],
        )
        message = asked[-1].message if asked else ""
        check(
            "forms: the form names the command, where and why",
            "`rm -rf build`" in message and "/data/work" in message and "clean the build" in message,
            message,
        )

        await client.call_tool("send_message", {"agent": "Ada", "text": "ask", "wait_seconds": 0})
        reply.append(ElicitResult(action="decline"))
        await client.call_tool("respond_approval", {"agent": "Ada", "request_id": "r-1"})
        check("forms: the person's decline is sent", last("POST", "/approvals/")["body"] == {"decision": "decline"})

        await client.call_tool("send_message", {"agent": "Ada", "text": "ask", "wait_seconds": 0})
        before = posts("/approvals/")
        reply.append(ElicitResult(action="cancel"))
        closed = await client.call_tool("respond_approval", {"agent": "Ada", "request_id": "r-1"})
        check(
            "forms: a closed form sends nothing and says the approval waits",
            posts("/approvals/") == before and (closed.structured_content or {}).get("sent") is False,
            text(closed),
        )
        BOT.approvals = []

        gone = await client.call_tool("respond_approval", {"agent": "Ada", "request_id": "r-9"})
        check(
            "forms: an approval that does not wait is refused",
            gone.is_error is True and "has no approval r-9 waiting" in text(gone),
            text(gone),
        )

        await client.call_tool("send_message", {"agent": "Ada", "text": "ask-tool", "wait_seconds": 0})
        reply.append(ElicitResult(action="decline"))
        await client.call_tool("respond_approval", {"agent": "Ada", "request_id": "r-2"})
        message = asked[-1].message if asked else ""
        check(
            "forms: an approval with no command leads with its reason",
            message == "Allow Ada: Add the MCP server approval-form-test: https://example.invalid/mcp.",
            message,
        )

        await client.call_tool("send_message", {"agent": "Ada", "text": "question", "wait_seconds": 0})
        reply.append(
            ElicitResult(action="accept", content={"build": "Release", "targets": ["web", "ios"], "note": "ship it"})
        )
        answered = await client.call_tool("answer_prompt", {"agent": "Ada", "request_id": "p-1"})
        posted = last("POST", "/prompts/")
        check(
            "forms: the person's answers are sent as lists",
            posted["body"] == {"answers": {"build": ["Release"], "targets": ["web", "ios"], "note": ["ship it"]}}
            and (answered.structured_content or {}).get("answered_by") == "person",
            [posted, text(answered)],
        )
        fields = asked[-1].requested_schema.get("properties", {}) if asked else {}
        check(
            "forms: a choice, a multiple choice and a text field",
            fields.get("build", {}).get("enum") == ["Debug", "Release"]
            and fields.get("targets", {}).get("type") == "array"
            and fields.get("targets", {}).get("items", {}).get("enum") == ["web", "ios"]
            and fields.get("note", {}).get("type") == "string",
            fields,
        )

        check(
            "forms: several questions are counted in the message, each in its own field",
            asked[-1].message == "Ada asks 3 questions."
            and fields.get("build", {}).get("description") == "Which build?",
            [asked[-1].message if asked else "", fields],
        )

        await client.call_tool("send_message", {"agent": "Ada", "text": "flat-question", "wait_seconds": 0})
        reply.append(ElicitResult(action="accept", content={"choice": ["Web", "iOS"]}))
        await client.call_tool("answer_prompt", {"agent": "Ada", "request_id": "p-3"})
        message = asked[-1].message if asked else ""
        field = asked[-1].requested_schema.get("properties", {}).get("choice", {}) if asked else {}
        check(
            "forms: a choice sent as text is a field to pick several from, and the message names only its title",
            message == "Ada asks: Which platforms should the test cover?"
            and "description" not in field
            and field.get("type") == "array"
            and field.get("items", {}).get("enum") == ["Web", "iOS", "Android"],
            [message, field],
        )
        check(
            "forms: each pick is one value of answers.choice",
            last("POST", "/prompts/")["body"] == {"answers": {"choice": ["Web", "iOS"]}},
            last("POST", "/prompts/"),
        )

        await client.call_tool("send_message", {"agent": "Ada", "text": "flat-note", "wait_seconds": 0})
        reply.append(ElicitResult(action="accept", content={"choice": ["Monday", "Friday"]}))
        await client.call_tool("answer_prompt", {"agent": "Ada", "request_id": "p-4"})
        field = asked[-1].requested_schema.get("properties", {}).get("choice", {}) if asked else {}
        check(
            "forms: the note after a label is not part of the label",
            field.get("items", {}).get("enum") == ["Monday", "Friday"]
            and last("POST", "/prompts/")["body"] == {"answers": {"choice": ["Monday", "Friday"]}},
            [field, last("POST", "/prompts/")],
        )

        await client.call_tool("send_message", {"agent": "Ada", "text": "flat-cut", "wait_seconds": 0})
        reply.append(ElicitResult(action="accept", content={"choice": "Monday"}))
        await client.call_tool("answer_prompt", {"agent": "Ada", "request_id": "p-5"})
        field = asked[-1].requested_schema.get("properties", {}).get("choice", {}) if asked else {}
        check(
            "forms: a question cut at its limit stays a text field, and a typed answer is sent as it was typed",
            field.get("type") == "string" and last("POST", "/prompts/")["body"] == {"answers": {"choice": ["Monday"]}},
            [field, last("POST", "/prompts/")],
        )

        await client.call_tool("send_message", {"agent": "Ada", "text": "secret", "wait_seconds": 0})
        secret = await client.call_tool("answer_prompt", {"agent": "Ada", "request_id": "p-2"})
        check(
            "forms: a secret question is left to OpenBot",
            secret.is_error is True and "answered in OpenBot itself" in text(secret),
            text(secret),
        )
        BOT.prompts = []


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


TASKS = "io.modelcontextprotocol/tasks"
RPC_IDS = iter(range(100, 10_000))


async def rpc(
    http: httpx2.AsyncClient,
    url: str,
    method: str,
    params: dict,
    *,
    name: str | None = None,
    tasks: bool = True,
    forms: bool = False,
) -> dict:
    """One 2026-07-28 request, as the SDK's client sends it, from a client that takes tasks or
    shows forms or neither."""
    headers = {
        "Accept": "application/json, text/event-stream",
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2026-07-28",
        "Mcp-Method": method,
    }
    if name:
        headers["Mcp-Name"] = name
    meta = {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientInfo": {"name": "check", "version": "1"},
        "io.modelcontextprotocol/clientCapabilities": {
            **({"extensions": {TASKS: {}}} if tasks else {}),
            **({"elicitation": {"form": {}}} if forms else {}),
        },
    }
    body = {"jsonrpc": "2.0", "id": next(RPC_IDS), "method": method, "params": {**params, "_meta": meta}}
    answer = await http.post(url, json=body, headers=headers, timeout=60)
    lines = [line[6:] for line in answer.text.splitlines() if line.startswith("data: ")]
    messages = [json.loads(line) for line in lines] if lines else [json.loads(answer.text)]
    return next(m for m in messages if m.get("id") == body["id"])


async def as_forms(http: httpx2.AsyncClient, url: str) -> None:
    """A form over stateless HTTP: the call answers input_required, and the client makes it
    again with the person's answer and the state it was handed."""
    await rpc(
        http,
        url,
        "tools/call",
        {"name": "send_message", "arguments": {"agent": "Ada", "text": "ask", "wait_seconds": 0}},
        name="send_message",
    )
    arguments = {"agent": "Ada", "request_id": "r-1"}
    first = await rpc(
        http,
        url,
        "tools/call",
        {"name": "respond_approval", "arguments": arguments},
        name="respond_approval",
        forms=True,
    )
    got = first.get("result", {})
    requests = got.get("inputRequests") or {}
    check(
        "forms over HTTP: the first round asks",
        got.get("resultType") == "input_required" and len(requests) == 1 and bool(got.get("requestState")),
        first,
    )
    second = await rpc(
        http,
        url,
        "tools/call",
        {
            "name": "respond_approval",
            "arguments": arguments,
            "inputResponses": {key: {"action": "accept", "content": {}} for key in requests},
            "requestState": got.get("requestState"),
        },
        name="respond_approval",
        forms=True,
    )
    done = second.get("result", {})
    check(
        "forms over HTTP: the second round sends the person's answer",
        (done.get("structuredContent") or {}).get("decided_by") == "person"
        and last("POST", "/approvals/")["body"] == {"decision": "accept"},
        second,
    )


async def as_tasks(http: httpx2.AsyncClient, url: str) -> None:
    found = await rpc(http, url, "server/discover", {})
    extensions = found.get("result", {}).get("capabilities", {}).get("extensions") or {}
    check("tasks: server/discover advertises the extension", TASKS in extensions, found)

    quick = await rpc(http, url, "tools/call", {"name": "list_agents", "arguments": {}}, name="list_agents")
    got = quick.get("result", {})
    check("tasks: a quick call is answered as itself", got.get("resultType") == "complete", quick)

    started = time.monotonic()
    later = await rpc(
        http,
        url,
        "tools/call",
        {"name": "send_message", "arguments": {"agent": "Ada", "text": "later"}},
        name="send_message",
    )
    took = time.monotonic() - started
    task = later.get("result", {})
    check(
        "tasks: a call still running after 5 s is a task",
        task.get("resultType") == "task" and task.get("status") == "working" and task.get("pollIntervalMs") == 2000,
        later,
    )
    check("tasks: the task comes at about 5 s", 4.5 < took < 8, f"{took:.1f} s")
    working = await rpc(http, url, "tasks/get", {"taskId": task.get("taskId", "")})
    note = working.get("result", {}).get("statusMessage", "")
    check("tasks: a working task names its delivery", "Delivery d-" in note and "is running" in note, working)
    for _ in range(40):
        ended = await rpc(http, url, "tasks/get", {"taskId": task.get("taskId", "")})
        if ended.get("result", {}).get("status") != "working":
            break
        await asyncio.sleep(0.5)
    result = ended.get("result", {})
    answer = ((result.get("result") or {}).get("structuredContent") or {}).get("answer")
    check(
        "tasks: tasks/get hands back the call's result",
        result.get("status") == "completed" and answer == "Echo: later",
        ended,
    )

    slow = await rpc(
        http,
        url,
        "tools/call",
        {"name": "send_message", "arguments": {"agent": "Ada", "text": "slow"}},
        name="send_message",
    )
    slow_id = slow.get("result", {}).get("taskId", "")
    stopped = await rpc(http, url, "tasks/cancel", {"taskId": slow_id})
    await asyncio.sleep(0.5)
    after = await rpc(http, url, "tasks/get", {"taskId": slow_id})
    check(
        "tasks: tasks/cancel ends the task",
        "error" not in stopped and after.get("result", {}).get("status") == "cancelled",
        [stopped, after],
    )
    unknown = await rpc(http, url, "tasks/get", {"taskId": "openbot-nope"})
    check("tasks: an unknown task is refused", unknown.get("error", {}).get("code") == -32602, unknown)

    plain = await rpc(
        http,
        url,
        "tools/call",
        {"name": "send_message", "arguments": {"agent": "Ada", "text": "later"}},
        name="send_message",
        tasks=False,
    )
    got = plain.get("result", {})
    check(
        "tasks: a client without the extension waits for the answer",
        got.get("resultType") == "complete" and (got.get("structuredContent") or {}).get("answer") == "Echo: later",
        plain,
    )


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
            await as_tasks(http, url)
            await as_forms(http, url)
    finally:
        proc.terminate()
        proc.wait(10)


async def main() -> None:
    start_openbot()
    await over_stdio()
    await over_http()


asyncio.run(main())
sys.exit(FAILS)
