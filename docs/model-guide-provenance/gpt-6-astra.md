# GPT-6 Astra guide: provenance

Where [gpt-6-astra.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/gpt-6-astra.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-13. Every `text` block was checked by script against the Markdown of the pages below (fetched by appending `.md` to each URL), with curly quotes, dashes and ellipses normalized to ASCII and whitespace collapsed. All blocks match except the delegation template, which is this skill's own heuristic.

Sources, all read on 2026-11-13:

- Using GPT-6 (https://developers.openai.com/api/docs/guides/latest-model): source of every family block
  (initiative and follow-through, instruction following, writing style, subagent delegation,
  testing), the reasoning-effort, tool-calling and sampling-parameter rules, and the
  `configuration_update` advice. It says its prompts address behavior observed with GPT-6
  Astra and should be evaluated on the chosen model.
- Rethinking skills and prompts for GPT-6 Astra
  (https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra): source of the local-tests
  block, the completion and decision-boundary advice, the note that Astra tests on its own,
  the documents-before-every-edit Avoid item, and the skill-description advice.
- Reasoning models (https://developers.openai.com/api/docs/guides/reasoning): effort support and defaults, the
  effort table behind "use `xhigh` only when evals show a clear benefit", `reasoning.mode`,
  `reasoning.context`, and `configuration_update` in standard, single-agent mode.
- Model selection (https://developers.openai.com/api/docs/guides/model-selection): the per-model effort suggestions.
- Mid-turn steering (https://developers.openai.com/api/docs/guides/steering) and Async tool calling
  (https://developers.openai.com/api/docs/guides/async-tool-calling): availability (GPT-6 family; GPT-6 Astra and
  later) and the instruction to continue independent work and wait before a dependent step.
- Multi-agent (https://developers.openai.com/api/docs/guides/responses-multi-agent): the model list (GPT-6.1 Sol and
  all GPT-5.6 models).
- GPT-6 Astra model page (https://developers.openai.com/api/docs/models/gpt-6-astra): effort values.

The 2026-11-13 rewrite replaced paraphrased blocks with OpenAI's exact text and added the
Astra blog's completion, decision-boundary and testing advice. The page gives no default
effort for Astra, so the guide names none.

The Always include, Avoid and failure-mode lists are this skill's synthesis of these sources, and the delegation template is its own heuristic.
