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


asyncio.run(main())
sys.exit(FAILS)
