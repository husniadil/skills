# Claude Opus 5.5 guide: provenance

Where [claude-opus-5.5.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/claude-opus-5.5.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-13. Sources:

- Prompting Claude Opus 5.5, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5
  Source of the continuation, turn-ending, harness-reminder, exploration, time-signal,
  pasted-content, settled-answers, and frontend blocks, the "Answer directly without
  deliberating." line, the effort guidance and the 128,000 `max_tokens` figure, the
  progress-update levers, the visual-input guidance, the "think carefully" finding, the
  `reasoning_extraction` and thinking-disabled guidance, and the safeguard facts.
- Prompting Claude Opus 5 and Prompting Claude Opus 4.8, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8
  Source of the length block, the narration-cadence wording, the verification Avoid item,
  and the code-review coverage block, and of the scope and delegation blocks now kept only
  in the Opus 5 guide.
- What's new in Claude Opus 5.5 and the Claude Opus 5.5 migration guide, fetched 2026-11-13:
  https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5
  https://platform.claude.com/docs/en/models/opus-5-5/migration-guide
  Source of the API facts in the intro (thinking, forced `tool_choice`, sampling, prefill,
  the prefix check and its "might or might not" 400) and the 64K starting `max_tokens` at
  `xhigh` and `max`.
- Migrating to Claude Opus 5.5 (copy bundled with the claude-api skill, read 2026-11-13):
  source of the advice to re-test the Opus 5 verbosity, verification, and scope
  instructions. It also says accounts created on or after 2026-08-31 get a 400 by default
  on a failed prefix check. The public pages do not say that, so the guide leaves it out.

Probes run by this skill on 2026-11-13, Opus 5.5 at `medium` effort, $6.73 in total. A
block stayed only if it moved its measure in the same direction in at least 2 of 3 runs:

- Scope, narrow: 3 bug fixes in a small Python repo that also held two tempting unrelated
  bugs, a TODO, and two other failing tests. Each prompt named the function and the test. 3
  runs per task with the Opus 5 scope block and 3 without, 18 in all. No run in either arm
  edited anything outside the target function.
- Scope, loose: one bug report ("checkout totals are wrong when they use a percentage
  discount code like SAVE10. Look into it and fix it.") with no function or test named, in
  a five-module repo that also held an unrelated failing test, a TODO for an advertised
  feature, a debug `print`, duplicated loops, and a legacy function. 5 runs per arm. Every
  run in both arms fixed only the discount function, added one regression test, and named
  the other problems without touching them.
- The scope block made no difference in either test and was removed from the guide.
- Code review, first file: 52 lines, 8 planted bugs, 5 serious and 3 low-severity, 3 runs
  per arm. Plain request: 8 of 8 in every run. Coverage block: 8 of 8 in every run, with 16
  to 22 findings against 12 to 14. Severity bar: 3 or 4 of the 5 serious bugs and none of
  the low ones, missing the pagination and divide-by-zero bugs in 2 of 3 runs.
- Code review, second file: 113 lines of billing code with 12 subtler bugs (a cache keyed
  on the wrong field, a mutable default, card numbers in logs, a retry loop that never
  re-raises, a hardcoded 30-day month, date strings sorted as text, an off-by-one grace
  period, `is` on strings, float equality on money, naive and aware datetimes, a broad
  `except`, an unused variable), 5 runs per arm. Plain request and coverage block both
  found all 12 in every run. The coverage block returned 24 to 35 findings against 17 to 26.
  A 13th planted "bug", a discount applied after tax, turned out not to change the total.
  Two plain-request runs said so and left it out. Across both files the coverage block cost
  1.2 to 1.7 times as much as the plain request.
- Length: 10 explain-this questions, 3 runs per arm. The length block cut total reply length
  from about 7,200 words to 2,400 in every run and on every question.
- Double-check: the three narrow fixes and the loose bug report, with "Double-check your
  work and re-verify it before you finish." added, 3 runs each, against the no-block scope
  runs. Every task cost more (45% to 150%), from re-reads and an extra test run, and the
  edits came out the same.
- Delegation: Claude Code 2.1.322 (`claude -p`, user settings excluded, Read, Glob, Grep and
  Agent allowed), 3 small lookups and 2 wide tasks over 12 and 15 files, 3 runs each. With
  no delegation block, Opus 5.5 spawned no subagent in any of the 15 runs, so the block had
  nothing to reduce and the arm with it was not run past the first pair. The block was
  removed from the guide.

The probes are small: one-bug tasks in repos of a few files, single-file reviews, and fan-out
over at most 15 files. Anthropic reported scope expansion and heavy delegation on Opus 5 for
larger work, such as multi-file features, which these tests do not cover.

The "Delegation template" is this skill's own heuristic.
