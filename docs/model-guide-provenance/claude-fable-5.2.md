# Claude Fable 5.2 guide: provenance

Where [claude-fable-5.2.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/claude-fable-5.2.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-13. Sources:

- Prompting Claude Fable 5.2, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2
  Source of the finishing-work, ownership, progress-update, reminder, one-line-update and
  communicating-clearly blocks, every percentage in the guide, the approval and "never"
  rule guidance, the subagent and carried-caution guidance, the list of instructions to
  review from earlier models, the refusal categories, and the effort guidance.
- What's new in Claude Fable 5.2, fetched 2026-11-13:
  https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2
  Source of the API facts: always-on thinking, the forced `tool_choice` 400, the prefix
  check on every account, which models read its thinking blocks, and the fallback targets.
- Migrating to Claude Fable 5.2 (copy bundled with the claude-api skill, read 2026-11-13):
  source of the prefill and sampling 400s, and of the `max_tokens` stop after a thinking
  block. It differs from the public page in places, and the guide follows the public page.
  The bundled copy gives a different ownership sentence ("This codebase is yours: what it's
  for and how it's built are your call, and you'll keep building on it.") with different
  figures (about half against under a tenth, 1.5 times the output tokens), says a
  cost-first spawn description cut delegation by about a third where the public page says
  roughly halved, and gives retry and approval figures for carried rules that the public
  page does not.

The "user owns this code" line, the note on where system-prompt text goes in a Claude Code
task prompt, the note that progress updates matter only where a person watches the
subagent, and the "Delegation template" are this skill's own heuristics.
