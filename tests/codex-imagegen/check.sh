#!/usr/bin/env bash
# The codex-imagegen MCP server checks: a missing or dead login hands back a device code without making a
# second login, an approved login makes the image under the files dir with a preview, and attachments stay
# inside it. Run it from anywhere with bash tests/codex-imagegen/check.sh. It needs uv, jq and python3, puts
# a stand-in codex on PATH, and works in a temporary folder it removes afterwards. No ChatGPT account is used.
# Every line ends in ok or FAIL, and the exit code counts FAILs.
set -uo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SERVER="$HERE/../../plugins/husniadil-skills/skills/codex-imagegen/scripts/mcp-server.py"
WORK=$(mktemp -d)
mkdir -p "$WORK/bin" "$WORK/fake" "$WORK/files" "$WORK/codex" "$WORK/state"
# The stand-in's device logins outlive the server by design. Each wrote its pid, and only those are ended.
trap 'for p in $(cat "$WORK/fake/logins" 2>/dev/null); do kill "$p" 2>/dev/null; done; rm -rf "$WORK"' EXIT

ln -s "$HERE/fake-codex" "$WORK/bin/codex"
# Two 1536x1024 PNGs: an opaque red one, and a red one with a fully transparent square in its middle,
# the hole --transparent punched in flat icons.
python3 - "$WORK/fake" <<'EOF'
import struct, sys, zlib
w, h = 1536, 1024
def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
def png(path, color_type, rows):
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, color_type, 0, 0, 0))
    data += chunk(b"IDAT", zlib.compress(b"".join(b"\x00" + r for r in rows))) + chunk(b"IEND", b"")
    open(path, "wb").write(data)
png(f"{sys.argv[1]}/fixture.png", 2, [bytes([200, 40, 40]) * w] * h)
solid, holed = bytes([200, 40, 40, 255]) * w, bytes([200, 40, 40, 255]) * 568 + bytes(4 * 400) + bytes([200, 40, 40, 255]) * 568
png(f"{sys.argv[1]}/fixture-alpha.png", 6, [holed if 312 <= y < 712 else solid for y in range(h)])
EOF

PATH="$WORK/bin:$PATH" FAKE_CODEX_DIR="$WORK/fake" CODEX_HOME="$WORK/codex" XDG_STATE_HOME="$WORK/state" \
    uv run --quiet --script "$HERE/client.py" "$SERVER" "$WORK"
