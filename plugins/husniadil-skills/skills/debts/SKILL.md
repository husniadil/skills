---
name: debts
description: List what this session's work still owes (unfinished, unverified, unshipped, or left stale), each item checked against the current state, then ask which to pay off
argument-hint: "[area, e.g. a feature, a repo, or a path]"
disable-model-invocation: true
---

List the debts this session's work still carries. Scope: `$ARGUMENTS`. Empty means everything the session touched; a feature, repo, or path narrows it to that.

A debt is anything the user would reasonably expect to be done, from their own requests or from the agent's own words, that is not done yet. Check the current state for each kind below. Memory of what was done is not evidence: run the command or read the file.

- Promises: every part of the user's requests in this session, every "I'll ..." or "next ..." the agent said, every open item in the task list, and every item the session took on from a plan or handoff notes and has not finished.
- Repository state, in every repository the session touched: uncommitted or untracked changes from the session, commits not pushed, a branch with no pull request when one was expected.
- Shipping: when the work was meant to reach a running system (a deploy, a restart, a reload, an install, another host), whether that system now runs the latest commit.
- Verification: claims with nothing behind them. A gate that has not run since the last edit, a skipped test, behavior that was read but never exercised, anything that can only be checked live or on a device.
- Ripple: docs, READMEs, comments, tests, config, and version metadata that still describe the state before the session's changes. Grep for the names the session renamed or removed. Code the change left unused.
- Findings: bugs or gaps noticed during the work and not fixed, review findings still open, a mitigation reported as a fix, a `TODO` or `FIXME` the session added.
- Leftovers: scratch files, debug output, temporary branches, worktrees, sessions, processes, or VMs the session started and did not clean up.

Not debts: anything the user deferred or said they would handle themselves, and tech debt that predates the session. Mention these only when they block something or the user asked about them.

Do not pay anything off before the user picks.

Open with the answer: how many debts, or none. Number each debt `U1`, `U2`, ... and group them by who it waits on: the agent (work it can do now, marking any that needs a plan first), the user (a decision, an approval such as a push or a deploy, or a check only they can make), and anyone else. One line per debt saying what is owed, with its evidence: `path:line`, a commit hash, or the command and its output. End with what was checked and found clean, and what was not checked.

Then ask with the AskUserQuestion tool, when it is available and there is something to ask:

- Which debts to pay off now: a multiSelect question over the agent's debts that need no plan, one option per debt, labeled with its code and a few words. The tool takes two to four options per question, so split five debts as three and two, and ask about a lone debt with `Pay it off` and `Leave it`.
- The agent's debts that need a plan first: one question naming them, whose two options both only acknowledge, `Ack` and `Ack, and explain why each needs a plan`. Nothing is done about them in this run.
- One question per decision in the user's group that the agent can carry out once answered, such as a push or a deploy, with the concrete choices as options.

Checks only the user can make stay in the report; they are not questions. When there are more questions than one call takes, ask the rest in another call once the user has answered, and keep going until every question is asked. Drop any question an earlier answer already settled. Without the tool, end with the report and ask the same questions in plain text.

Act on the answers one debt at a time: re-read the cited code or state, make the smallest change that pays it off, verify it with the project's gate or the narrowest check that covers it, and only then move on. Commit, push, or deploy only when an answer said to. Report each picked debt as `done`, with its evidence, `no change needed`, when the re-read shows it was already paid, or `skipped`, with what blocked it.

Pay off the picked debts before carrying out the approved decisions, so a push or a deploy comes last. End by naming anything the run itself left uncommitted or unpushed.
