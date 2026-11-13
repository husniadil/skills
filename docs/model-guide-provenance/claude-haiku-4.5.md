# Claude Haiku 4.5 guide: provenance

Where [claude-haiku-4.5.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/claude-haiku-4.5.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-13. Sources:

- Haiku 4.5 prompting page:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-4-5
  Returned 404 on 2026-11-13. No model-specific guidance exists at this URL.
- Context windows:
  https://platform.claude.com/docs/en/build-with-claude/context-windows
  Fetched 2026-11-13. Source of the 200K window, thinking-block stripping, the lack of
  interleaved thinking, and context awareness.
- Migrating to Claude Haiku 5.5 (copy bundled with the claude-api skill, read 2026-11-13):
  source of the 64K maximum output, the `effort` error, the budget minimum and the
  `max_tokens` rule, the sampling-parameter change on API version `2026-10-21`, and the
  prefill and refusal differences from Haiku 5.5.
- Prompting best practices, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  Confirms the analysis-only block (its conservative-action sample), scope, examples (3 to 5,
  in tags), long-context placement and source tags, parallelism, the context-awareness sample
  for Haiku 4.5, the self-check line, and positive format wording. Its "think thoroughly" and
  manual chain-of-thought advice changed two Avoid bullets. The delegation template and the
  vague-trigger bullet are not covered by the page and stay heuristics.
