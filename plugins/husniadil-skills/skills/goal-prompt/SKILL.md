---
name: goal-prompt
description: Write the condition text for Claude Code's /goal command. Use when the user asks for a goal prompt, a /goal condition, "bikin prompt buat /goal", "tulis goal-nya", or wants to turn a task, plan, spec, or issue into something /goal can drive to completion unattended. Produces one paste-ready condition under 4,000 characters, plus the recommended launch command.
---

# Writing a /goal condition

`/goal <condition>` sets a session-scoped completion condition. After every turn a small fast model (Haiku by default, or whatever `ANTHROPIC_DEFAULT_HAIKU_MODEL` points at) reads the condition and the conversation so far and returns one of three verdicts: not yet met, met, or impossible. "Not yet met" starts another turn, with the evaluator's reason handed to Claude as guidance. "Met" or "impossible" clears the goal. The condition text doubles as the first prompt of the run, so it is both the directive and the finish line.

Everything that makes a condition work follows from three facts about the evaluator:

1. It only sees the transcript. It runs no commands and reads no files. A condition is satisfiable only if Claude's own output can demonstrate it.
2. It is a small model judging a long conversation. Vague conditions produce vague verdicts, early "met" on plausible-looking output, or a loop that never ends.
3. It is fresh every turn and has no memory outside the transcript. Constraints that are not written in the condition do not exist for it.

## Procedure

1. **Ground the work before writing.** Read the task, plan, spec, or issue the user points at. If the condition will name files, commands, test names, doc sections, or config keys, check they exist and are spelled the way the repo spells them. A condition that names `just check` when the repo has `make verify` drives the run into a wall on turn one.
2. **Find the one measurable end state.** A test command exiting 0, a build that compiles, a file count, an empty queue, a diff against a spec. If the user's request has several, pick the one that implies the rest, or list them all under a single "done when".
3. **Decide the proof.** For each end-state item, state the exact command or artifact whose output must appear in the conversation. "Tests pass" becomes "`just check` has been run and its passing output is shown in this conversation."
4. **Write the constraints that matter.** What must not change, what must move together (code and docs in one commit), what must be test-first, what to do when a measured fact turns out wrong. Leave out generic advice; it burns characters and the evaluator cannot judge it.
5. **Add a stop clause.** Always. `or stop after N turns and report what is left`. Claude reports progress against it each turn; without it a stuck run burns tokens until someone notices.
6. **Count characters.** Hard cap 4,000. Aim under 3,500 so a small model is not judging against a wall of text. Trim preamble before trimming proof.
7. **Deliver.** Print the condition in a single fenced block with no leading `/goal`, so it can be pasted after the command. Below it, give the launch line and the two flags that matter (see Output).

## Shape of a good condition

The shape that held up over 40-turn runs:

```
<One line: imperative statement of the work, naming the governing docs.>

<Context the run needs and must not re-derive: measured facts, decisions already made,
 numbers, file paths. Mark which ones go into which doc if docs must move.>

Build:
1. <Deliverable, concrete enough that a test can be named for it.>
2. ...

<Cross-cutting constraints: test-first, docs move in the same commit as the code that
 proves them, what to do if a fact above is disproved, naming rules, what not to touch.>

Done when <proof 1 is shown in this conversation>, <proof 2>, ..., and the work is
committed in small reviewable increments. Or stop after <N> turns and report what is left.
```

Every sentence in the "Done when" line must be something the evaluator can check by reading the transcript. Good: "its passing output is shown in this conversation", "each item has a named test that fails without its code", "the doc changes are listed by file and section", "`git status` is clean". Bad: "the code is clean", "the feature works", "the user is satisfied".

## What to cut

- Background on why the work matters. Keep the short reason attached to a constraint when the constraint would be misapplied without it.
- Instructions the repo's CLAUDE.md already carries. Name the file instead ("following CLAUDE.md").
- Generic process advice ("think carefully", "be thorough").
- Anything the evaluator cannot verify from the transcript.
- Multiple goals. One goal per session; if the work splits, write the first condition and note what the second one will be.

## Pitfalls to design around

- **Early "met".** If the end state is something Claude could assert without proof, the evaluator may believe it. Tie every end state to output that has to appear: command output, a file listing, a diff.
- **Background work defers evaluation.** Subagents or background shells still running at turn end skip that turn's evaluation. Claude Code sends its own check-ins while background work keeps a goal waiting, so the condition only needs to say which background jobs are expected and what their finished output must show.
- **No-progress cutoff.** Several turns with no tool use stops the loop and hands control back. Conditions that invite discussion instead of action trigger this; keep the directive imperative.
- **Auth, credit, context overflow, or an unavailable model clears the goal.** The user has to fix the cause and run `/goal` again. Nothing in the condition can prevent this; just do not make it worse with work that overflows context by design.
- **Permission mode is unchanged by `/goal`.** For an unattended run the user needs auto mode, or the commands the condition names must already be allowed. Say which in the launch note.
- **Resume resets the counters.** A goal restored via `--resume` keeps the condition but resets turn count and timer. A turn-based stop clause restarts from zero on resume.

## Output

Deliver three things, in this order:

1. The condition, in one fenced `text` block, ready to paste after `/goal `. No `/goal` prefix inside the block.
2. The character count.
3. A launch note, two to four lines: the interactive form (`/goal <paste>`), the headless form if it fits (`claude -p "/goal ..." --output-format stream-json --verbose`), and whether auto mode or a permission allow is needed for the commands the condition names.

If anything in the condition was assumed rather than checked against the repo (a command name, a doc section, a test filter), say so in one line so the user can fix it before launching.

## Worked examples

Illustrative, not templates: the sections a condition needs follow from the task, and a small fix needs far less than a feature.

Request: "bikin goal buat beresin client-policy delivery, test-first, docs ikut gerak".

After reading the repo's CLAUDE.md, justfile, and the relevant docs, the condition that shipped:

```text
Implement client-policy delivery, test-first, following CLAUDE.md and docs/proxy-behavior.md.

Measured in this repo against a local capture stub (no network, no quota). Record these in the spec:
- The client's bundled `claude-api` skill injects 92,601 bytes (~23k tokens) into the conversation on one invocation.
- `permissions.deny: ["Skill(claude-api)"]` does NOT remove the skill from the listing; it blocks the load. A blocked call costs one 43-byte is_error tool_result.
- Two `--settings` on one argv: the LAST wins, the first is dropped silently, exit 0, empty stderr.

Build:
1. A `[client]` config section: `deny_skills` (default ["claude-api"]) and `disable_connectors` (default true), written into the generated config template with comments carrying the measurement and the off switch.
2. The `env` control method gains a policy half alongside `variables`. Additive: a caller reading only `variables` is unaffected.
3. The launcher verb from docs/roadmap.md v0.3.0. It passes ONLY the policy half via `--settings`, forwards everything after the command name opaquely and in order, and refuses before exec when the forwarded argv already carries `--settings`, naming the collision.

Docs move in the same commit as the code that proves them: docs/proxy-behavior.md gains the client-policy rules and the findings above; docs/api.md gains what each rendering can and cannot carry.

If a probe or a test disproves any statement above, change the statement in the same commit as the code that proved it, and say what moved.

Done when `just check` has been run and its passing output is shown in this conversation, each of items 1-3 has a named test that fails without its code, the doc changes are listed by file and section, and the work is committed in small reviewable increments. Or stop after 40 turns and report what is left.
```

Why it works: the first line is the directive, the measured facts stop the run from re-deriving them, each Build item is concrete enough to name a test for, the docs rule is a constraint the evaluator can check ("listed by file and section"), and the Done line is four transcript-visible proofs plus a turn cap.

A contrasting request: "fix the flaky retry test in the payments client". No docs move and nothing was measured up front, so the condition is three short paragraphs:

```text
Fix the flaky `test_retry_backoff` in tests/payments/test_client.py, following CLAUDE.md. The flake is timing-dependent: the test sleeps on the real clock.

Replace real sleeps in the retry path with an injected clock. Retry counts, delays, and the public client API stay unchanged.

Done when the test has been run 50 times in a row (`uv run pytest tests/payments/test_client.py::test_retry_backoff --count=50`, pytest-repeat) and the output showing 50 passed is in this conversation, `git diff --stat` shows no files outside src/payments and tests/payments, and the fix is committed. Or stop after 15 turns and report what is left.
```
