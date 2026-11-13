# Claude Sonnet 5.5 guide: provenance

Where [claude-sonnet-5.5.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/claude-sonnet-5.5.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-13. Sources from Anthropic's official documentation:

- Prompting Claude Sonnet 5.5, re-read in full on 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5
  Source of every prompt block and of the effort, JSON, progress-update, mid-turn message,
  verification, tool-call, visual-input and refusal sections.
- Migrating to Claude Sonnet 5.5, re-read on 2026-11-13 (searched for the thinking-block,
  `between_tools` and fallback rules), plus the copy bundled with the claude-api skill, read
  the same day:
  https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide
  The bundled copy is the only source here for the Sonnet 5 workaround bullet, the
  `block_binding` account rule, and the "thinks briefly before almost every reply" effort
  fact. The public page says a prefix-check failure "might or might not" return a 400.
- What's new in Claude Sonnet 5.5 and the model page, last read 2026-10-03:
  https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5
  https://platform.claude.com/docs/en/models/sonnet-5-5/overview
- Prompting Claude Sonnet 5, read only to state which of its rules changed:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5

Prompt blocks are quoted from the Sonnet 5.5 guide, with punctuation adjusted to this
skill's style. The "Delegation template" is this skill's own heuristic.
