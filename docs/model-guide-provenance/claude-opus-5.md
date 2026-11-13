# Claude Opus 5 guide: provenance

Where [claude-opus-5.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/claude-opus-5.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-13. Sources:

- Prompting Claude Opus 5, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5
  Source of the scope, length, `tone_preference`, narration, written-deliverables,
  delegation, correction, and thinking-disabled blocks, the Claude Code subagent caps, the
  verification and re-check rules, the `reasoning_extraction` rule, the vision guidance, the
  effort guidance, and the thinking-disabled facts.
- Prompting Claude Opus 4.8, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8
  Source of the code-review block text. The Opus 5 page states the same rule without a
  snippet.
- Effort, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/effort
  Source of the 64K `max_tokens` starting point at `xhigh` and `max`, and confirms the
  effort guidance.
- Claude Opus 5.5 migration guide, fetched 2026-11-13:
  https://platform.claude.com/docs/en/models/opus-5-5/migration-guide
  Source of the prefill 400 ("Claude Opus 4.6 and later Opus models") and the sampling 400.
- Migrating to Claude Opus 5 (copy bundled with the claude-api skill, read 2026-11-13):
  source of the Avoid item about "delegate more" guidance carried over from Opus 4.8.

The stale-summary block, the reasoning-script Avoid item, and the "Delegation template" are
this skill's own heuristics.

Probe run by this skill on 2026-11-13, Opus 5 at `high` effort, $1.49: 12 small service docs
and a `SUMMARY.md` that was stale on three values, 5 lookup questions, 3 runs per arm, with
and without the stale-summary block and a parallel-work line ("Run independent reads,
searches, and analyses in parallel. Keep dependent decisions and mutations sequential.").
All 30 answers were correct, and every run opened both the summary and the primary files.
Asked for checkout's dependencies, every run without the block also gave their own
dependencies' timeouts from the stale summary (fraud at 2000 ms, against 4000 ms in its own
file), and every run with it opened those files instead. Both arms read files in parallel,
and the parallel-work line made no consistent difference, so it was removed from the guide
and from the template.
