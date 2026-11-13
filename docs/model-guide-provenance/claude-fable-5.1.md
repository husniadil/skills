# Claude Fable 5.1 guide: provenance

Where [claude-fable-5.1.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/claude-fable-5.1.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-13. Sources:

- Prompting Claude Fable 5.1, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1
  Source of every block in the guide (dashes adjusted to hyphens), the effort guidance,
  the batching placement rule, the progress-update order, the append-only rules, the
  compaction instruction, the subagent setup, the vision guidance, the safeguard triggers
  and the `reasoning_extraction` note. The page's "might or might not" wording is the
  source of the prefix-check bullet.
- Claude Fable 5.1 overview, fetched 2026-11-13:
  https://platform.claude.com/docs/en/models/fable-5-1/overview
  Confirms always-on adaptive thinking, the `high` default, and that Fable 5.2 succeeds it.
- Prompting best practices, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  Source of the competing-hypotheses exception for research.
- Migrating to Claude Fable 5.1 and Migrating to Claude Fable 5.1 from Claude Fable 5
  (copy bundled with the claude-api skill, read 2026-11-13): source of the 400s on
  disabled thinking, `budget_tokens`, forced `tool_choice`, prefill and sampling, the
  `max_tokens` limit on thinking plus reply, which models read its thinking blocks, the
  measure-first and "privately" notes on batching, the low-effort vision note, the advice
  to keep verification lines, and the two Mythos 5.1 differences.

The note on where system-prompt text goes in a Claude Code task prompt, the note that
progress updates matter only where a person watches the subagent, the class-of-claims
retrieval rule, and the "Delegation template" are this skill's own heuristics.
