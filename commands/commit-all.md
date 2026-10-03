---
description: Commit everything in the working tree that belongs to this session's work, staged by path, in coherent units
---

Commit the work in the tree. Never `git add -A`, `git add .`, or `git commit -a`; stage by explicit path so every file in the commit was looked at.

1. `git status --porcelain` and `git diff` (plus `git diff --cached` if something is already staged). Read every changed and untracked path.
2. Sort the paths into: belongs to this session's work, unrelated, and junk (build output, editor files, scratch). Anything in the second or third group stays out. If it is unclear which group a path is in, ask before staging it; do not guess.
3. If the related changes form more than one coherent unit, make one commit per unit, in dependency order. One unit, one commit.
4. For each commit: `git add <paths>`, then commit with a message that says why the change exists more than what it touches. Short subject line, body only when the why needs it. No co-author trailer. Do not bypass hooks; if a hook fails, stop and report it.
5. If nothing is staged-worthy, say so instead of committing.

Report each commit's hash and subject, and list any path deliberately left out with the reason. Do not push.
