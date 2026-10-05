---
name: debts
description: List what this session's work still owes (unfinished, unverified, unshipped, or left stale), each item checked against the current state
argument-hint: [area, e.g. a feature, a repo, or a path]
disable-model-invocation: true
---

List the debts this session's work still carries. Scope: `$ARGUMENTS`. Empty means everything the session touched; a feature, repo, or path narrows it to that.

A debt is anything the user would reasonably expect to be done, from their own requests or from the agent's own words, that is not done yet. Check the current state for each kind below. Memory of what was done is not evidence: run the command or read the file.

- Promises: every part of the user's requests in this session, every "I'll ..." or "next ..." the agent said, every open item in the task list, and every open item in the plan or handoff notes the session worked from.
- Repository state, in every repository the session touched: uncommitted or untracked changes from the session, commits not pushed, a branch with no pull request when one was expected.
- Shipping: when the work was meant to reach a running system (a deploy, a restart, a reload, an install, another host), whether that system now runs the latest commit.
- Verification: claims with nothing behind them. A gate that has not run since the last edit, a skipped test, behavior that was read but never exercised, anything that can only be checked live or on a device.
- Ripple: docs, READMEs, comments, tests, config, and version metadata that still describe the state before the session's changes. Grep for the names the session renamed or removed. Code the change left unused.
- Findings: bugs or gaps noticed during the work and not fixed, review findings still open, a mitigation reported as a fix, a `TODO` or `FIXME` the session added.
- Leftovers: scratch files, debug output, temporary branches, worktrees, sessions, processes, or VMs the session started and did not clean up.

Not debts: anything the user deferred or said they would handle themselves, and tech debt that predates the session. Mention these only when they block something or the user asked about them.

Report only. Do not pay anything off in this turn; the user picks what to fix, often with `/fix-all`.

Open with the answer: how many debts, or none. Number each debt `U1`, `U2`, ... and group them by who it waits on: the agent (work it can do now, marking any that needs a plan first), the user (a decision, an approval such as a push or a deploy, or a check only they can make), and anyone else. One line per debt saying what is owed, with its evidence: `path:line`, a commit hash, or the command and its output. End with what was checked and found clean, and what was not checked.
