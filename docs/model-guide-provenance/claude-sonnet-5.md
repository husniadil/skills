# Claude Sonnet 5 guide: provenance

Where [claude-sonnet-5.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/claude-sonnet-5.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-13. Sources:

- Prompting Claude Sonnet 5, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5
  Source of the verbosity, low-effort, thinking-steering, code-review and
  `frontend_aesthetics` blocks (punctuation adjusted), the strict-effort and `max_tokens`
  facts, the tool-use and progress-update guidance, the literal-reading rule and its scope
  example, the design guidance, the first-turn guidance, and the 400s on sampling
  parameters and `budget_tokens`.
- Migrating to Claude Sonnet 5.5 (copy bundled with the claude-api skill, read 2026-11-13):
  source of the prefill 400, the Sonnet 5.5 additions that do not apply here, and the
  tokenizer figure.
- Prompting best practices, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  Did not contain the scope, autonomy and structured-output snippets that an earlier version
  of the guide attributed to it.

The scope-pattern wording, the tool-policy line, the delegation-prompt note, the autonomy
and structured-output snippets, the options-return variant of the design prompt, and the
"Delegation template" are this skill's own heuristics. An earlier version also carried a
verification snippet and a "perform the work" snippet. Both were removed, because the Sonnet
5 page says the model already runs self-verification loops and acts agentically by default.
