# /// script
# requires-python = ">=3.12"
# dependencies = ["mcp==2.3.0", "pillow==12.3.0"]
# ///
"""codex-imagegen as a stdio MCP server: generate_image and codex_login.

Each image is made by generate.sh beside this file and saved under CODEX_IMAGEGEN_FILES_DIR.
The result carries a JPEG preview and the file's path. claude.ai shows an image in a result
but offers no way to save it, on the web or the phone, so the full file has to reach the
person some other way: CODEX_IMAGEGEN_DOWNLOAD_HINT, when set, is a sentence added to every
result saying how, with {path} replaced by the file's path.

`codex login status` reads auth.json without checking it, and says a login with a dead
refresh token is signed in (measured on Codex 0.162.1). A dead login shows only when a run
fails with a 401 or a refresh error. Either way the server starts `codex login --device-auth`,
which needs no browser on this host, and hands the person its link and code. The login runs
in a process group of its own, so it outlives this process (a host may start one per MCP
session), and it is recorded in a state file, so a later call or another session reports the
same code instead of starting a second login.
"""

import asyncio
import base64
import fcntl
import io
import json
import os
import re
import signal
import subprocess
import time
from datetime import UTC, datetime
from pathlib import Path

from mcp.server import MCPServer
from mcp_types import CallToolResult, ImageContent, TextContent
from PIL import Image

HERE = Path(__file__).resolve().parent
GENERATE = HERE / "generate.sh"
FILES_DIR_ENV = "CODEX_IMAGEGEN_FILES_DIR"
DOWNLOAD_HINT_ENV = "CODEX_IMAGEGEN_DOWNLOAD_HINT"
STATE_DIR = Path(os.environ.get("XDG_STATE_HOME") or Path.home() / ".local/state") / "codex-imagegen-mcp"

# A run took 31 to 53 s in 8 of 9 measured runs, and one edit took 133 (2026-10-23).
GENERATE_TIMEOUT = 280
LOGIN_OUTPUT_WAIT = 20
PREVIEW_EDGE = 768
PREVIEW_QUALITY = 80
KEY_COLOR = (255, 0, 255)
# Codex's transparent output holds a solid subject at alpha 254, not 255: a flat apple
# was 61.8% clear, 36.9% at 250 to 254 and 1.3% between (2026-10-27). Counting 254 as
# partly transparent reported that apple as 38% see-through.
OPAQUE_FROM = 250

ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")
LOGIN_URL = re.compile(r"https://auth\.openai\.com/\S+")
LOGIN_CODE = re.compile(r"\b[A-Z0-9]{4,}-[A-Z0-9]{4,}\b")
LOGIN_MINUTES = re.compile(r"expires in (\d+) minutes")
# What a dead login looked like with an expired access token and a refresh token OpenAI
# refused: the turn failed with "workspace routing discovery unauthorized (401)", and stderr
# repeated "Your access token could not be refreshed. Please log out and sign in again."
AUTH_FAILURE = re.compile(r"unauthorized \(401\)|could not be refreshed|sign(?:ing)? in again|not logged in", re.I)

mcp = MCPServer(
    "codex-imagegen",
    instructions=(
        "generate_image makes or edits one raster image through Codex's built-in image tool. "
        "Its result shows a small preview, and the full-resolution PNG stays on the host "
        "running this server, at the path the result names."
    ),
)


def files_dir() -> Path:
    value = os.environ.get(FILES_DIR_ENV)
    if not value:
        raise RuntimeError(f"{FILES_DIR_ENV} is not set, so this server has nowhere to save images.")
    return Path(value).resolve()


def text_result(text: str, *, error: bool = False) -> CallToolResult:
    return CallToolResult(content=[TextContent(type="text", text=text)], is_error=error)


# ----------------------------------------------------------------------
# Login
# ----------------------------------------------------------------------


async def signed_in() -> bool:
    try:
        proc = await asyncio.create_subprocess_exec(
            "codex", "login", "status", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
    except FileNotFoundError:
        raise RuntimeError("codex is not on this server's PATH.") from None
    return await proc.wait() == 0


def pending_login() -> dict | None:
    """The device login still waiting for the person, or None once it ended or expired."""
    state_file = STATE_DIR / "login.json"
    try:
        state = json.loads(state_file.read_text())
    except FileNotFoundError:
        return None
    ended = Path(state["exit_file"]).exists()
    try:
        os.kill(state["pid"], 0)
        alive = True
    except ProcessLookupError:
        alive = False
    if not ended and alive and time.time() < state["expires_at"]:
        return state
    # Never signalled here: past its expiry the pid may be another process's. Codex ends the
    # login itself once the code expires.
    state_file.unlink(missing_ok=True)
    return None


async def start_login() -> dict:
    STATE_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    log_file = STATE_DIR / "login.log"
    exit_file = STATE_DIR / "login.exit"
    exit_file.unlink(missing_ok=True)
    with log_file.open("w") as log:
        proc = subprocess.Popen(
            ["sh", "-c", 'codex login --device-auth; echo $? > "$1"', "sh", str(exit_file)],
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
    deadline = time.monotonic() + LOGIN_OUTPUT_WAIT
    output = ""
    while time.monotonic() < deadline:
        output = ANSI.sub("", log_file.read_text())
        url, code = LOGIN_URL.search(output), LOGIN_CODE.search(output)
        if url and code:
            minutes = LOGIN_MINUTES.search(output)
            state = {
                "pid": proc.pid,
                "url": url.group(0),
                "code": code.group(0),
                "expires_at": time.time() + 60 * int(minutes.group(1) if minutes else 15),
                "exit_file": str(exit_file),
            }
            (STATE_DIR / "login.json").write_text(json.dumps(state))
            return state
        if proc.poll() is not None:
            break
        await asyncio.sleep(0.5)
    if proc.poll() is None:
        os.killpg(proc.pid, signal.SIGTERM)
    raise RuntimeError(f"codex login --device-auth gave no link and code. It printed: {output.strip()[-600:]}")


async def login_needed(reason: str) -> CallToolResult:
    """Start a device login, or reuse the one in flight, and say what the person does."""
    STATE_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    with (STATE_DIR / "login.lock").open("w") as lock:
        # Waited for without blocking: a blocking flock would stop the event loop, and with it
        # a call in this process that holds the lock and is waiting for codex's output.
        while True:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except BlockingIOError:
                await asyncio.sleep(0.2)
        try:
            state = pending_login() or await start_login()
        except RuntimeError as e:
            return text_result(f"{reason} No image was made, and a new login could not start: {e}", error=True)
    expires = datetime.fromtimestamp(state["expires_at"], UTC).strftime("%H:%M UTC")
    return text_result(
        f"{reason} No image was made. Ask the person to open {state['url']} and enter the code "
        f"{state['code']} before {expires}, signed in to the ChatGPT account whose plan should pay "
        "for the images. Once they have, call the tool again.",
        error=True,
    )


@mcp.tool()
async def codex_login() -> CallToolResult:
    """Check Codex's ChatGPT login on this server, and start one if it has none.

    generate_image starts a login by itself when it finds none or finds the login dead, so call
    this only to sign in ahead of time or to see the code of a login in flight.
    """
    try:
        signed = pending_login() is None and await signed_in()
    except RuntimeError as e:
        return text_result(str(e), error=True)
    if not signed:
        return await login_needed("Codex on this server is not signed in to ChatGPT.")
    return text_result(
        "Codex reports a ChatGPT login. Its status does not test the token, so a dead login shows "
        "only when generate_image fails, which then starts a new login itself."
    )


# ----------------------------------------------------------------------
# Generating
# ----------------------------------------------------------------------


def attachment(path: str, root: Path) -> Path:
    resolved = (root / path).resolve()
    if not resolved.is_relative_to(root) or not resolved.is_file():
        raise ValueError(f"Not a file under {root}: {path}")
    return resolved


def output_path(root: Path, prompt: str) -> Path:
    words = re.findall(r"[a-z0-9]+", prompt.lower())[:6]
    slug = "-".join(words)[:48].strip("-") or "image"
    stamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    return root / "images" / f"{stamp}-{slug}-{os.urandom(2).hex()}.png"


def preview(path: Path) -> tuple[str, str]:
    """A JPEG of the image at most PREVIEW_EDGE on its long side, as base64, and what it shows.

    Transparency goes over magenta. --transparent has punched holes in flat-colored subjects,
    and a hole over white looks like the subject's own white, so the model judging the preview
    would miss it.
    """
    with Image.open(path) as image:
        rgba = image.convert("RGBA")
    width, height = rgba.size
    alpha = rgba.getchannel("A")
    counts = alpha.histogram()
    flat = Image.new("RGB", rgba.size, KEY_COLOR)
    flat.paste(rgba, mask=alpha)
    flat.thumbnail((PREVIEW_EDGE, PREVIEW_EDGE))
    buffer = io.BytesIO()
    flat.save(buffer, "JPEG", quality=PREVIEW_QUALITY)
    note = f"The image below is a {flat.width}x{flat.height} JPEG preview of the {width}x{height} PNG."
    clear, partial = counts[0], sum(counts[1:OPAQUE_FROM])
    if clear or partial:
        note += (
            f" {100 * clear / (width * height):.1f}% of its pixels are fully transparent and "
            f"{100 * partial / (width * height):.1f}% partly, and the preview shows them over magenta "
            "(#FF00FF), so magenta inside the subject is a hole in it."
        )
    return base64.b64encode(buffer.getvalue()).decode(), note


async def run_generate(args: list[str], prompt: str) -> tuple[int, str]:
    proc = await asyncio.create_subprocess_exec(
        "bash",
        str(GENERATE),
        *args,
        "-",
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        start_new_session=True,
    )
    try:
        _, stderr = await asyncio.wait_for(proc.communicate(prompt.encode()), GENERATE_TIMEOUT)
    except TimeoutError:
        os.killpg(proc.pid, signal.SIGKILL)
        await proc.wait()
        return -1, f"generate.sh ran past {GENERATE_TIMEOUT} s and was stopped."
    return proc.returncode or 0, stderr.decode(errors="replace")


@mcp.tool()
async def generate_image(
    prompt: str,
    images: list[str] | None = None,
    transparent: bool = False,
    model: str | None = None,
) -> CallToolResult:
    """Generate or edit one raster image through Codex's built-in image tool. It takes 30 to 130 s.

    The prompt is the whole spec, passed to the tool unchanged: subject, setting, style or medium,
    framing, lighting and palette, and what the image is for. The tool takes no size, so say
    "square" or "landscape orientation". Text that should appear goes in quotes with where it
    sits, or say "No text". For an edit, say what changes and list what stays.

    images: paths of files on this server's host to attach, as edit targets or references,
    which the prompt names in order ("the first attached image"). Only a file under the
    server's files directory is taken, such as an earlier result's path.
    transparent: ask for a transparent background. It can punch holes in a flat-colored subject,
    so for a flat icon ask for a flat magenta background instead and key it out where
    ImageMagick runs. The preview shows any transparency over magenta.
    model: the Codex model that relays the prompt. Leave it out for Codex's default.

    The result shows a JPEG preview at most 768 px on its long side. The full-resolution PNG
    stays on the host at the path the result names. Look at the preview before reporting, and
    make a retry a new call with one change.
    """
    if not prompt.strip():
        return text_result("The prompt is empty.", error=True)
    try:
        root = files_dir()
        attached = [attachment(p, root) for p in images or []]
        signed = pending_login() is None and await signed_in()
    except (RuntimeError, ValueError) as e:
        return text_result(str(e), error=True)
    if not signed:
        return await login_needed("Codex on this server is not signed in to ChatGPT.")

    out = output_path(root, prompt)
    args = ["--out", str(out)]
    for path in attached:
        args += ["--image", str(path)]
    if transparent:
        args.append("--transparent")
    if model:
        args += ["--model", model]

    code, stderr = await run_generate(args, prompt)
    if code != 0:
        if AUTH_FAILURE.search(stderr):
            return await login_needed("Codex's ChatGPT login on this server has expired.")
        return text_result(f"generate.sh failed (exit {code}):\n{stderr.strip()[-1500:]}", error=True)

    data, note = preview(out)
    if attached:
        # Codex picks the size itself: an edit of a 1024x1024 image came back 1254x1254.
        with Image.open(attached[0]) as source, Image.open(out) as made:
            if source.size != made.size:
                note += (
                    f" The first attached image is {source.width}x{source.height}, so resize this one "
                    "after downloading it if the original size matters."
                )
    size_kb = round(out.stat().st_size / 1024)
    hint = os.environ.get(DOWNLOAD_HINT_ENV, "").replace("{path}", str(out))
    return CallToolResult(
        content=[
            TextContent(
                type="text",
                text=(
                    f"Saved {out} ({size_kb} KB). {note} The full resolution is only in that file. "
                    f"{hint + ' ' if hint else ''}To edit this image, pass the same path in images."
                ),
            ),
            ImageContent(type="image", data=data, mime_type="image/jpeg"),
        ]
    )


if __name__ == "__main__":
    mcp.run()
