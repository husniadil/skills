# GPT-6 Sol and Luna guide: provenance

Where [gpt-6-sol-luna.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/gpt-6-sol-luna.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-13. Every `text` block was checked by script against the Markdown of the pages below (fetched by appending `.md` to each URL), with curly quotes, dashes and ellipses normalized to ASCII and whitespace collapsed. All blocks match except the delegation template, which is this skill's own heuristic.

OpenAI publishes no prompting guidance written for Sol or Luna. Sources, read on 2026-11-13
unless noted:

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
- GPT-6 Sol and GPT-6 Luna model pages (https://developers.openai.com/api/docs/models/gpt-6-sol,
  https://developers.openai.com/api/docs/models/gpt-6-luna): effort values, the `medium` default, and Chat
  Completions function calling only at `none`.
- API changelog (https://developers.openai.com/api/docs/changelog): the 2026-09-25 image-encoding fix.
- Introducing GPT-6 Sol and Luna (openai.com/index/introducing-gpt-6-sol-and-luna/) and
  Introducing GPT-6.1 Sol (openai.com/index/introducing-gpt-6-1-sol/), read on 2026-10-03:
  the training and communication-style notes and the broken-search figures.
- A model guide for the GPT-6 family (openai.com/index/practical-guide-building-gpt-6/),
  read on 2026-10-03: the "what a useful response looks like" item. Not re-checked on
  2026-11-13 either. openai.com
  returned 403 to scripted fetches on 2026-11-13, so these were not re-checked.

The 2026-11-13 rewrite dropped the note that OpenAI's pages disagreed on Multi-agent for
Sol and Luna. Using GPT-6 no longer lists multi-agent among GPT-6's features, and the
Multi-agent guide lists GPT-6.1 Sol and the GPT-5.6 models only.

The Always include, Avoid and failure-mode lists are this skill's synthesis of these sources, and the delegation template is its own heuristic.
