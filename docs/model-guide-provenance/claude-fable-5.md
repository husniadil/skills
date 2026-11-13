# Claude Fable 5 guide: provenance

Where [claude-fable-5.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/claude-fable-5.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-13. Sources:

- Prompting Claude Fable 5, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5
  Source of every block in the guide (arrows and ellipses written in ASCII), the
  classifier areas, the fallback to Opus 4.8, the `reasoning_extraction` note, the effort
  guidance, the longer-turn note, and the subagent, memory and send-to-user guidance.
- Claude Fable 5 overview, fetched 2026-11-13:
  https://platform.claude.com/docs/en/models/fable-5/overview
  Confirms always-on adaptive thinking, the `high` default, and that Fable 5.2 succeeds it.
- What's new in Claude Fable 5.2, fetched 2026-11-13:
  https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2
  Source of the forced `tool_choice` fact: moving from Fable 5, only the forced tool use
  rule is a breaking change.
- Migrating to Claude Fable 5.1 from Claude Fable 5 and Migrating to Claude Fable 5.2
  (copy bundled with the claude-api skill, read 2026-11-13): source of the prefill and
  sampling 400s, the missing prefix check, the progress updates in `thinking` blocks, and
  the per-message effort 400.

The note on where system-prompt text goes in a Claude Code task prompt, the
done-condition item, and the "Delegation template" are this skill's own heuristics.
