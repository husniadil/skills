#!/usr/bin/env python3
"""Check that the calendar plugin and the server it talks to still agree.

The plugin lives in this repository and its MCP server on husniadil.com, so
nothing builds or tests the two together. This holds the three things that
break silently when one side moves:

1. The mod connects to a server its manifest lists: MANIFEST_SERVER in
   hooks/register.tsx against mcpServers in .claude-plugin/plugin.json.
2. That server answers at the manifest's URL and introduces itself by the
   plugin's name.
3. It still offers every tool the mod calls with $.mcp.call.

  python3 scripts/check-calendar-contract.py              # static and live
  python3 scripts/check-calendar-contract.py --offline    # static only

Exits 1 and names each broken point.
"""

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

PLUGIN = Path(__file__).resolve().parent.parent / "plugins" / "indonesian-holiday-calendar"
PROTOCOL = "2025-06-18"


def static_contract(plugin: Path):
    register = (plugin / "hooks" / "register.tsx").read_text()
    manifest = json.loads((plugin / ".claude-plugin" / "plugin.json").read_text())
    failures = []

    match = re.search(r'const MANIFEST_SERVER = "([^"]+)";', register)
    if not match:
        return manifest, None, [], ["register.tsx declares no MANIFEST_SERVER"]
    key = match.group(1)
    server = manifest.get("mcpServers", {}).get(key)
    if server is None:
        failures.append(f"the mod connects to {key!r}, which the manifest's mcpServers does not list")
    elif server.get("type") != "http" or not server.get("url"):
        failures.append(f"the manifest's {key!r} server is not an http server with a url: {server}")

    called = sorted(set(re.findall(r'\$\.mcp\.call\(\s*[\w.]+,\s*"([A-Za-z0-9_]+)"', register)))
    if not called:
        failures.append("found no $.mcp.call in register.tsx, so the tool check would prove nothing")
    return manifest, server, called, failures


def rpc(url, method, params=None, session=None, notify=False):
    body = {"jsonrpc": "2.0", "method": method}
    if params is not None:
        body["params"] = params
    if not notify:
        body["id"] = 1
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "MCP-Protocol-Version": PROTOCOL,
        "User-Agent": "husniadil-skills-contract-check",
    }
    if session:
        headers["Mcp-Session-Id"] = session
    request = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers, method="POST")
    with urllib.request.urlopen(request, timeout=30) as response:
        session = response.headers.get("Mcp-Session-Id") or session
        text = response.read().decode()
        if notify:
            return None, session
        if "text/event-stream" in (response.headers.get("Content-Type") or ""):
            data = [line[5:].strip() for line in text.splitlines() if line.startswith("data:")]
            text = data[-1] if data else ""
    message = json.loads(text)
    if "error" in message:
        raise RuntimeError(f"{method}: {message['error']}")
    return message["result"], session


def live_contract(manifest, server, called):
    url = server["url"]
    failures = []
    info, session = rpc(url, "initialize", {
        "protocolVersion": PROTOCOL,
        "capabilities": {},
        "clientInfo": {"name": "husniadil-skills-contract-check", "version": "1"},
    })
    name = info.get("serverInfo", {}).get("name")
    if name != manifest["name"]:
        failures.append(f"{url} introduces itself as {name!r}, not the plugin's name {manifest['name']!r}")
    rpc(url, "notifications/initialized", session=session, notify=True)
    tools, _ = rpc(url, "tools/list", {}, session=session)
    offered = {tool["name"] for tool in tools.get("tools", [])}
    missing = [tool for tool in called if tool not in offered]
    if missing:
        failures.append(f"{url} no longer offers {missing}, which the mod calls")
    return failures, name, sorted(offered)


def main():
    parser = argparse.ArgumentParser(description="Check the calendar plugin against its server.")
    parser.add_argument("--offline", action="store_true", help="check the plugin's own files only")
    parser.add_argument("--plugin-dir", type=Path, default=PLUGIN, help=argparse.SUPPRESS)
    args = parser.parse_args()

    manifest, server, called, failures = static_contract(args.plugin_dir)
    if not failures:
        print(f"static: the mod's server is in the manifest at {server['url']}, and it calls {called}")
    if not failures and not args.offline:
        try:
            live, name, offered = live_contract(manifest, server, called)
        except (OSError, RuntimeError, ValueError, KeyError) as error:
            live = [f"{server['url']} did not answer as an MCP server: {error}"]
        failures += live
        if not live:
            print(f"live: {server['url']} is {name!r} and offers {len(offered)} tools, every one the mod calls among them")
    for failure in failures:
        print(f"FAIL: {failure}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
