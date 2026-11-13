#!/usr/bin/env python3
"""Check that every model prompting guide has the shape the README describes.

Each reference under model-prompting-guides/references/ must have these sections,
in this order, as level-2 headings: Always include, Include when applicable,
Avoid, Effort, Delegation template, Failure-mode adjustments. A heading matches
by prefix, so "Effort: thinking budget instead" counts as Effort. Sections
before "Always include" are allowed (the Haiku guides use one, others open with
unheaded text).

Sources and history stay out of the guides, which agents read, and live in
docs/model-guide-provenance/ under the same file name. Each of those must carry
a "Last cross-checked: YYYY-MM-DD" line, and each must match a guide.

  python3 scripts/check-model-guides.py                # every reference
  python3 scripts/check-model-guides.py <file.md>...   # only these

Exits 1 and names each file that is missing a section, out of order, carries a
Provenance section, or has no dated provenance file.
"""

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REFERENCES = ROOT / "plugins/husniadil-skills/skills/model-prompting-guides/references"
PROVENANCE = ROOT / "docs/model-guide-provenance"
REQUIRED = [
    "Always include",
    "Include when applicable",
    "Avoid",
    "Effort",
    "Delegation template",
    "Failure-mode adjustments",
]
DATED = re.compile(r"Last cross-checked: \d{4}-\d{2}-\d{2}")


def problems(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    headings = re.findall(r"^## (.+)$", text, re.M)
    found = []
    position = 0
    for name in REQUIRED:
        match = next((i for i in range(position, len(headings)) if headings[i].startswith(name)), None)
        if match is None:
            found.append(f"no '## {name}' section, in order after the sections before it")
            break
        position = match + 1
    if any(h.startswith("Provenance") for h in headings):
        found.append("has a '## Provenance' section; move it to " + str(shown(PROVENANCE / path.name)))
    source = PROVENANCE / path.name
    if not source.is_file():
        found.append(f"no provenance file at {shown(source)}")
    elif not DATED.search(source.read_text(encoding="utf-8")):
        found.append(f"no 'Last cross-checked: YYYY-MM-DD' line in {shown(source)}")
    return found


def shown(path: Path) -> Path:
    try:
        return path.resolve().relative_to(ROOT)
    except ValueError:
        return path


def main():
    parser = argparse.ArgumentParser(description="Check that model prompting guides have the README's shape.")
    parser.add_argument("files", nargs="*", type=Path, help="Reference files. Default: every file under references/.")
    args = parser.parse_args()

    files = args.files or sorted(REFERENCES.glob("*.md"))
    if not files:
        print(f"no reference found under {shown(REFERENCES)}", file=sys.stderr)
        return 1

    failures = []
    for path in files:
        for problem in problems(path):
            failures.append(f"{shown(path)}: {problem}")
    if not args.files:
        for orphan in sorted(PROVENANCE.glob("*.md")):
            if not (REFERENCES / orphan.name).is_file():
                failures.append(f"{shown(orphan)}: no guide of that name under {shown(REFERENCES)}")

    for failure in failures:
        print(failure, file=sys.stderr)
    if failures:
        return 1
    print(f"Every model guide has the README's shape, across {len(files)} references.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
