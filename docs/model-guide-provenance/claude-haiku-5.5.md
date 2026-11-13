# Claude Haiku 5.5 guide: provenance

Where [claude-haiku-5.5.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/claude-haiku-5.5.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-13. Sources, all read on 2026-11-13:

- Prompting Claude Haiku 5.5:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5
  Source of the effort guidance, the snippets, and the measured results quoted in the guide. The
  snippets are quoted with punctuation adjusted.
- Context windows:
  https://platform.claude.com/docs/en/build-with-claude/context-windows
  Source of the 1M context, the long-prompt rate, and the retention of previous thinking blocks.
- Migrating to Claude Haiku 5.5:
  https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide
  The copy bundled with the claude-api skill. Source of the 400 errors, the sampling rules,
  the refusal categories, the account and model binding of thinking blocks, and the
  mid-conversation system message rules.
- Probes, run 2026-11-13 on one account. Wording: the "must" and imperative registers, 10
  samples each, both 10 of 10 (a ceiling, so no difference shown). Date: the newest-turn rule
  and the changed-`system` rule, 10 samples each with thinking blocks in history, and 10 each
  without. The thinking-history result is the one the date section relies on. The scripts stay
  in the session scratchpad, not in the repository.
