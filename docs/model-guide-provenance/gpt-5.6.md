# GPT-5.6 guide: provenance

Where [gpt-5.6.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/gpt-5.6.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-13. Every `text` block was checked by script against the Markdown of the pages below (fetched by appending `.md` to each URL), with curly quotes, dashes and ellipses normalized to ASCII and whitespace collapsed. All blocks match except the delegation template, which is this skill's own heuristic.

Sources, all read on 2026-11-13:

- Prompting guidance for GPT-5.6 Sol (https://developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6),
  which covers the whole family: source of every block except the Codex lines, the 10-15%
  and 41-66% figures, the Avoid list, and the effort guidance.
- Codex CLI default instructions (openai/codex,
  `codex-rs/protocol/src/prompts/base_instructions/default.md`, last changed 2026-06-23):
  source of the coding lines, each checked line by line.
- GPT-5.6 Sol, Terra and Luna model pages (https://developers.openai.com/api/docs/models/gpt-5.6-sol and siblings):
  effort values and the `gpt-5.6` alias.
- Reasoning models (https://developers.openai.com/api/docs/guides/reasoning): `reasoning.context` defaulting to
  all turns on GPT-5.6, and `reasoning.mode`.
- Multi-agent (https://developers.openai.com/api/docs/guides/responses-multi-agent): availability on all GPT-5.6
  models, the developer-message examples, and the limitations.
- Mid-turn steering and Async tool calling: neither lists GPT-5.6.

The 2026-11-13 rewrite replaced paraphrased blocks with OpenAI's exact text and swapped the
paraphrased Codex coding block for the original lines.

The Always include, Avoid and failure-mode lists are this skill's synthesis of these sources, and the delegation template is its own heuristic.
