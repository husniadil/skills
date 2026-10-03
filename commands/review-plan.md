---
description: Review a plan file for inconsistencies and gaps, then fix it in place
argument-hint: [path]
---

Plan file: `$ARGUMENTS`. When empty, use the plan this conversation has been working on; if more than one candidate exists, name them and ask which one before reading.

Read the whole plan, then check it against the repository, not just against itself:

- Internal consistency: steps that reference each other agree, dependency order is correct, the same thing is called by one name throughout.
- Grounding: every file, command, test name, config key, or doc section the plan names exists in the repo and is spelled the way the repo spells it. Verify by reading, not by assumption.
- Gaps: done-criteria that cannot be verified by a command or a diff, steps that rest on an assumption nobody has checked, work the plan implies but never states (migrations, docs that must move with code, tests for new behavior).
- Scope drift: steps that go beyond what the plan's own goal asks for.

Fix each problem in place, in the section where it belongs. Do not append a "Review" or "Findings" section at the end; the plan should read as if it had been written correctly the first time. Keep the author's structure and voice.

Report in chat, briefly: what changed and why, as a short list citing the plan section. Separately, list anything that needs the user's decision rather than an edit, with the options and a recommendation. If nothing needed changing, say so and what was checked.
