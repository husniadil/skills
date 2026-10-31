# /// script
# requires-python = ">=3.12"
# dependencies = ["mcp==2.3.0", "pillow==12.3.0"]
# ///
"""Drives scripts/mcp-server.py over stdio against the stand-in codex check.sh puts on PATH.

Every line ends in ok or FAIL, and the exit code counts FAILs.
"""

import asyncio
import base64
import io
import os
import signal
import sys
import time
from pathlib import Path

from mcp import Client
from mcp.client.stdio import StdioServerParameters
from PIL import Image

SERVER = Path(sys.argv[1])
WORK = Path(sys.argv[2])
FAKE = WORK / "fake"
# Resolved as the server resolves it: macOS's temp dir is under /var, a link to /private/var.
FILES = (WORK / "files").resolve()
FAILS = 0


def check(name: str, ok: bool, detail: str = "") -> None:
    global FAILS
    if ok:
        print(f"{name}: ok")
    else:
        FAILS += 1
        print(f"{name}: FAIL ({detail[:400]})")


def text(result) -> str:
    return " ".join(c.text for c in result.content if c.type == "text")


def server(env: dict[str, str]) -> StdioServerParameters:
    return StdioServerParameters(command="uv", args=["run", "--script", str(SERVER)], env=env)


async def exec_pid() -> int | None:
    """The stand-in codex's pid, once a slow exec has written it, waiting up to 10 s."""
    for _ in range(100):
        if (FAKE / "exec-pid").exists():
            return int((FAKE / "exec-pid").read_text())
        await asyncio.sleep(0.1)
    return None


def work_dir() -> Path | None:
    """The work directory generate.sh made for the last exec: the parent of the folder -C names."""
    args = (FAKE / "exec-args").read_text().split("\n")
    return Path(args[args.index("-C") + 1]).parent if "-C" in args else None


async def gone(pid: int | None) -> bool:
    """Whether the process ends within 5 s. False at once with no pid."""
    if pid is None:
        return False
    for _ in range(50):
        try:
            os.kill(pid, 0)
        except ProcessLookupError:
            return True
        await asyncio.sleep(0.1)
    return False


async def main() -> None:
    env = {
        **os.environ,
        "CODEX_IMAGEGEN_FILES_DIR": str(FILES),
        "CODEX_IMAGEGEN_DOWNLOAD_HINT": 'Call fetch_it with path "{path}".',
    }
    async with Client(server(env)) as client:
        # Not signed in: two calls at once both answer with the link and the code, and start one
        # login between them. A blocking lock once left the second call holding up the first.
        started = time.monotonic()
        try:
            first, parallel = await asyncio.wait_for(
                asyncio.gather(
                    client.call_tool("generate_image", {"prompt": "a red square"}),
                    client.call_tool("generate_image", {"prompt": "a blue square"}),
                ),
                30,
            )
        except TimeoutError:
            check("not signed in: two calls at once answer", False, "no answer within 30 s")
            return
        took = time.monotonic() - started
        check("not signed in: error result", first.is_error is True, text(first))
        check("not signed in: link", "https://auth.openai.com/codex/device" in text(first), text(first))
        check("not signed in: code", "ABCD-12345" in text(first), text(first))
        check("not signed in: the call beside it has the code", "ABCD-12345" in text(parallel), text(parallel))
        check("not signed in: answers within 15 s", took < 15, f"{took:.1f} s")

        # A second call, and codex_login, report the same login instead of starting another.
        second = await client.call_tool("generate_image", {"prompt": "a red square"})
        login = await client.call_tool("codex_login", {})
        check("pending login reused by generate_image", "ABCD-12345" in text(second), text(second))
        check("pending login reused by codex_login", "ABCD-12345" in text(login), text(login))
        logins = (FAKE / "logins").read_text().split()
        check("one device login started", len(logins) == 1, str(logins))

        # The person approves: the login ends and the next call makes the image.
        (FAKE / "approve").touch()
        for _ in range(50):
            if (FAKE / "signed-in").exists():
                break
            await asyncio.sleep(0.1)
        made = await client.call_tool("generate_image", {"prompt": "A plain red square, no text"})
        body = text(made)
        check("signed in: success result", made.is_error is not True, body)
        saved = Path(body.split("Saved ", 1)[1].split(" (", 1)[0]) if "Saved " in body else None
        check(
            "signed in: PNG saved under the files dir",
            bool(saved and saved.is_file() and saved.is_relative_to(FILES)),
            body,
        )
        check("signed in: download hint with the path", f'Call fetch_it with path "{saved}".' in body, body)
        check("signed in: prompt passed unchanged", "A plain red square, no text" in (FAKE / "exec-prompt").read_text())
        check("opaque image: no transparency note", "transparent" not in body, body)
        images = [c for c in made.content if c.type == "image"]
        if images:
            preview = Image.open(io.BytesIO(base64.b64decode(images[0].data)))
            check(
                "preview is a JPEG",
                images[0].mime_type == "image/jpeg" and preview.format == "JPEG",
                images[0].mime_type,
            )
            check("preview long edge is 768", max(preview.size) == 768, str(preview.size))
        else:
            check("preview present", False, body)

        # A hole in the subject shows over magenta, and the text says how much is transparent.
        (FAKE / "alpha").touch()
        holed = await client.call_tool("generate_image", {"prompt": "A flat red icon", "transparent": True})
        (FAKE / "alpha").unlink()
        body = text(holed)
        check("transparent image: note gives the share", "10.2% of its pixels are fully transparent" in body, body)
        check("transparent image: alpha 254 is not counted as partly", "and 0.0% partly" in body, body)
        check("transparent image: note names magenta", "magenta inside the subject is a hole" in body, body)
        images = [c for c in holed.content if c.type == "image"]
        if images:
            r, g, b = Image.open(io.BytesIO(base64.b64decode(images[0].data))).convert("RGB").getpixel((384, 256))
            check("transparent image: hole drawn magenta", r > 200 and g < 60 and b > 200, str((r, g, b)))
        else:
            check("transparent image: preview present", False, body)

        # Attachments: only a file under the files dir is passed on.
        outside = await client.call_tool("generate_image", {"prompt": "edit", "images": ["../fake/fixture.png"]})
        check(
            "attachment outside the files dir refused",
            outside.is_error is True and "Not a file under" in text(outside),
            text(outside),
        )
        if saved:
            edit = await client.call_tool(
                "generate_image", {"prompt": "Edit the attached image", "images": [str(saved)]}
            )
            args = (FAKE / "exec-args").read_text().split("\n")
            check("attachment passed to codex", edit.is_error is not True and str(saved) in args, text(edit))
            check("same size as the attachment: no size note", "first attached image is" not in text(edit), text(edit))

        # An edit Codex returns at another size says so, naming the attachment's size.
        upload = FILES / "uploads" / "a" / "small.png"
        upload.parent.mkdir(parents=True)
        Image.new("RGB", (64, 48), "red").save(upload)
        resized = await client.call_tool(
            "generate_image", {"prompt": "Edit the attached image", "images": [str(upload)]}
        )
        check(
            "other size than the attachment: size note",
            "The first attached image is 64x48" in text(resized) and "1536x1024 PNG" in text(resized),
            text(resized),
        )

        # A call the client cancels ends Codex, and generate.sh removes its work directory.
        (FAKE / "slow").touch()
        call = asyncio.create_task(client.call_tool("generate_image", {"prompt": "a slow red square"}))
        pid = await exec_pid()
        check("cancelled call: codex started", pid is not None)
        work = work_dir()
        call.cancel()
        try:
            await call
        except asyncio.CancelledError:
            pass
        (FAKE / "slow").unlink()
        check("cancelled call: codex stopped within 5 s", await gone(pid), f"pid {pid}")
        check("cancelled call: work directory removed", work is not None and not work.exists(), str(work))
        after = await client.call_tool("generate_image", {"prompt": "A plain red square, no text"})
        check("cancelled call: the next call still works", after.is_error is not True, text(after))

        # A dead login: codex says signed in, the run fails with a 401, and a new login starts.
        (FAKE / "dead-token").touch()
        dead = await client.call_tool("generate_image", {"prompt": "a red square"})
        check("dead login: error result", dead.is_error is True, text(dead))
        check("dead login: says expired", "has expired" in text(dead), text(dead))
        check("dead login: hands a code", "ABCD-12345" in text(dead), text(dead))
        logins = (FAKE / "logins").read_text().split()
        check("dead login: a second device login started", len(logins) == 2, str(logins))

    # A server with no files directory says so.
    bare = {k: v for k, v in env.items() if k != "CODEX_IMAGEGEN_FILES_DIR"}
    async with Client(server(bare)) as client:
        result = await client.call_tool("generate_image", {"prompt": "a red square"})
        check("no files dir: error names the variable", "CODEX_IMAGEGEN_FILES_DIR" in text(result), text(result))

    # A run past its timeout ends Codex, and generate.sh removes its work directory. The login the
    # dead token started is ended first, since a call waits on a login in flight.
    for login_pid in (FAKE / "logins").read_text().split():
        try:
            os.kill(int(login_pid), signal.SIGTERM)
        except ProcessLookupError:
            pass
    (FAKE / "dead-token").unlink(missing_ok=True)
    (FAKE / "exec-pid").unlink(missing_ok=True)
    (FAKE / "slow").touch()
    async with Client(server({**env, "CODEX_IMAGEGEN_TIMEOUT": "2"})) as client:
        late = await client.call_tool("generate_image", {"prompt": "a slow blue square"})
    (FAKE / "slow").unlink()
    check("timed-out call: says it was stopped", "ran past 2 s and was stopped" in text(late), text(late))
    pid = await exec_pid()
    work = work_dir()
    check("timed-out call: codex stopped", await gone(pid), f"pid {pid}")
    check("timed-out call: work directory removed", work is not None and not work.exists(), str(work))

    # A call cancelled as the client leaves ends even a Codex that ignores SIGTERM. The SIGKILL
    # that follows the grace once lived only on the event loop, so it went with the server.
    (FAKE / "exec-pid").unlink(missing_ok=True)
    (FAKE / "slow").touch()
    (FAKE / "stubborn").touch()
    async with Client(server(env)) as client:
        call = asyncio.create_task(client.call_tool("generate_image", {"prompt": "a slow green square"}))
        pid = await exec_pid()
        work = work_dir()
        call.cancel()
        try:
            await call
        except asyncio.CancelledError:
            pass
    (FAKE / "slow").unlink()
    (FAKE / "stubborn").unlink()
    check("client gone: codex stopped", await gone(pid), f"pid {pid}")
    check("client gone: work directory removed", work is not None and not work.exists(), str(work))


asyncio.run(main())
sys.exit(FAILS)
