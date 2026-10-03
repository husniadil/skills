---
description: Review the current diff, the whole codebase, or its architecture for bugs and gaps, with every finding adversarially verified
argument-hint: current | codebase | design
---

Audit target: `$ARGUMENTS` (default `current` when empty).

Route by target, then apply the shared rules below.

- `current`: the uncommitted diff, or the branch against its merge-base if the tree is clean. Invoke the `code-review` skill at high effort. Do not hand-roll a reviewer when the skill is available.
- `codebase`: the whole repository. If the `agent-teams:review-sweep` skill is available, invoke it. Otherwise, split the tree by module, look for inconsistencies, gaps, and bugs in each, and verify every candidate before reporting it.
- `design`: architecture only, no line-level bugs. Read `CLAUDE.md`, the layering or architecture docs, and the module boundaries first. Look for places where the code violates a rule the project itself wrote down: a layer reaching across a boundary, hidden global state, a contract documented one way and implemented another, duplicated ownership of one concern. Cite the rule and the violating code together.

Shared rules, whatever the target:

- Read the code before claiming anything. Every finding cites `path:line`.
- Verify each finding adversarially before it goes in the report: try to refute it with the actual code, a test run, or a type check. Drop what does not survive. Plausibility is not evidence.
- Report findings as `F1`, `F2`, ... ordered by severity, each with a one-sentence claim and the concrete failure scenario. Findings only; no praise, no summary of what is fine.
- If a finding has a clean fix of under roughly ten lines, include the fix inline. Larger fixes are listed as follow-ups, not applied.
- Say what was not covered: files skipped, tests not run, areas out of scope.
