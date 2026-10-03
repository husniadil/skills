---
description: Fix the findings from the last review in this conversation, one at a time, each verified before moving on
argument-hint: [F1 F3 ... | all]
---

Scope: `$ARGUMENTS`. Empty or `all` means every finding from the most recent review in this conversation (`/audit`, `/code-review`, or any report that numbered its findings). A list of codes means only those.

Work the findings one at a time, most severe first:

1. Re-read the cited code before touching it. The review is a claim, not a fact; if the code no longer matches the finding, or the finding was wrong, record it as "no change needed" with the reason and move on. Do not force a fix onto a finding that does not hold.
2. Apply the smallest fix that resolves the finding. Leave surrounding code, comments, and types alone; related cleanups go in the report as follow-ups, not in the diff.
3. Verify with the project's own gate: the test or check command named in `CLAUDE.md` or the task runner. Run it and read the output. If the gate is slow, run the narrowest relevant subset per finding and the full gate once at the end.
4. Only then move to the next finding.

Track progress with the task list when there are three or more findings, so a partial run is visible.

Do not commit unless asked. When done, report per finding: `fixed` (with `path:line`), `no change needed` (with reason), or `skipped` (with what blocked it). End with the gate command that was run and whether it passed, quoting the relevant output. If any finding is left unfinished, say so plainly.
