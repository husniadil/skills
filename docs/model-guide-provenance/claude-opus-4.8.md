# Claude Opus 4.8 guide: provenance

Where [claude-opus-4.8.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/claude-opus-4.8.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-13. Sources:

- Prompting Claude Opus 4.8, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8
  Source of the verbosity, subagent, code-review, warm-tone, `frontend_aesthetics`,
  thinking-steering and low-effort blocks (dashes and punctuation adjusted), the effort
  ladder and the 64K `max_tokens` note, the literal-reading rule and its scope example, the
  tool-use and progress-update guidance, the design guidance, and the interactive-coding
  guidance.
- Effort and the Claude Opus 5.5 migration guide, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/effort
  https://platform.claude.com/docs/en/models/opus-5-5/migration-guide
  Confirm the effort ladder and the 64K note, that thinking is off unless requested, the
  `high` default, and the prefill and sampling 400s.
- Migrating to Opus 4.8 (copy bundled with the claude-api skill, read 2026-11-13): source of
  the search-first, autonomy, and final-answer-only blocks, the reasoning leak with thinking
  disabled, the `display: "omitted"` default, and the line about asking on minor choices.
  None of these is on a public page checked on 2026-11-13. The Opus 4.8 what's-new URL
  returned 404.

The two sources disagree on tone. The public page calls the default voice direct and
opinionated, with little validation. The bundled migration notes call it warmer and less
hedged than Opus 4.7, and say Opus 4.8 narrates more. The Tone block therefore asks for the
voice explicitly instead of naming a default.

The tool-policy line, the options-return variant of the design prompt, the "return to the
parent" reading of "ask first", and the "Delegation template" are this skill's own
heuristics.
