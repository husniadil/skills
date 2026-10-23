#!/usr/bin/env python3
"""Check that every skill's description fits in 1024 characters.

claude.ai warns on install about a SKILL.md whose description is longer, and
keeps it cut to 1024 characters. Claude Code reads the whole text, so a long
description only breaks on claude.ai, and `claude plugin validate` passes it.

  python3 scripts/check-skill-descriptions.py                # every skill under plugins/
  python3 scripts/check-skill-descriptions.py <SKILL.md>...  # only these

Exits 1 and names each SKILL.md over the limit or whose description it cannot read.
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIMIT = 1024


def description(path: Path) -> str:
    lines = path.read_text().splitlines()
    if not lines or lines[0] != "---":
        raise ValueError("no front matter")
    for i, line in enumerate(lines[1:], start=1):
        if line == "---":
            break
        if line.startswith("description:"):
            following = lines[i + 1] if i + 1 < len(lines) else ""
            if following[:1] in (" ", "\t"):
                raise ValueError("description continues on the next line; write it on one")
            return scalar(line[len("description:"):].strip())
    raise ValueError("no description in the front matter")


def scalar(value: str) -> str:
    """The value YAML reads from a one-line scalar.

    Only the one-line forms are read. A block scalar would be counted wrong, so
    it fails instead.
    """
    if len(value) >= 2 and value[0] == value[-1] == '"':
        # YAML's double-quoted escapes are JSON's, plus a few that no
        # description here uses. Those fail to parse rather than miscount.
        return json.loads(value)
    if len(value) >= 2 and value[0] == value[-1] == "'":
        return value[1:-1].replace("''", "'")
    if value and value[0] not in "|>\"'":
        return value
    raise ValueError(f"description is not a one-line scalar: {value[:40]!r}")


def shown(path: Path) -> Path:
    try:
        return path.resolve().relative_to(ROOT)
    except ValueError:
        return path


def main():
    parser = argparse.ArgumentParser(description="Check that skill descriptions fit claude.ai's limit.")
    parser.add_argument("files", nargs="*", type=Path, help="SKILL.md files. Default: every skill under plugins/.")
    args = parser.parse_args()

    files = args.files or sorted(ROOT.glob("plugins/*/skills/*/SKILL.md"))
    if not files:
        print("no SKILL.md found under plugins/", file=sys.stderr)
        return 1

    failures = []
    longest = (None, -1)
    for path in files:
        try:
            text = description(path)
        except ValueError as error:
            failures.append(f"{shown(path)}: {error}")
            continue
        if len(text) > LIMIT:
            failures.append(f"{shown(path)}: description is {len(text)} characters, {len(text) - LIMIT} over {LIMIT}")
        if len(text) > longest[1]:
            longest = (path, len(text))

    for failure in failures:
        print(failure, file=sys.stderr)
    if failures:
        return 1
    print(f"Every description fits in {LIMIT} characters, across {len(files)} SKILL.md. Longest: {longest[1]}, {shown(longest[0])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
