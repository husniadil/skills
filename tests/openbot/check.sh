#!/usr/bin/env bash
# The openbot MCP server checks: agents found by id or name, a message followed to its answer, a
# wait that runs out or stops at a question, answers and settings passed on, ids kept inside their
# path segment, the errors a missing API or container gives, and --http behind its bearer. Run it
# from anywhere with bash tests/openbot/check.sh. It needs uv, curl and python3, puts a stand-in
# docker on PATH that runs the server's curl here against a stand-in OpenBot, and works in a
# temporary folder it removes afterwards. Every line ends in ok or FAIL, and the exit code counts FAILs.
set -uo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SERVER="$HERE/../../plugins/husniadil-skills/skills/openbot/scripts/mcp-server.py"
WORK=$(mktemp -d)
mkdir -p "$WORK/bin" "$WORK/docker/home"
trap 'rm -rf "$WORK"' EXIT

ln -s "$HERE/fake-docker" "$WORK/bin/docker"

PATH="$WORK/bin:$PATH" FAKE_DOCKER_DIR="$WORK/docker" FAKE_DOCKER_CONTAINER=openbot-test \
    uv run --quiet --script "$HERE/client.py" "$SERVER" "$WORK"
