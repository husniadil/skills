# GPT-6.2 guide: provenance

Where [gpt-6.2.md](../../plugins/husniadil-skills/skills/model-prompting-guides/references/gpt-6.2.md) comes from and how it was checked. Agents that read the guide do not load this file.

Last cross-checked: 2026-11-21. Every `text` block was checked by script against the Markdown of the pages below (fetched by appending `.md` to each URL), with curly quotes, dashes and ellipses normalized to ASCII and whitespace collapsed. All blocks match except the delegation template, which is this skill's own heuristic.

OpenAI released GPT-6.2 Astra and GPT-6.2 Sol on 2026-11-17 and publishes one prompting guide for both, so one guide covers the two. Sources, all read on 2026-11-20:

- Using GPT-6.2 (https://developers.openai.com/api/docs/guides/latest-model/gpt-6.2-astra,
  which `guides/latest-model` also served on 2026-11-20 and will stop serving once a newer
  model replaces it): source of every block except the two
  Multi-agent developer messages (writing style, external audience, self-contained final
  answer, task completion, persistence, assumptions, coding style, frontend design), the
  Astra behavior notes, the async question tool, the reference-image advice, prefix edits,
  `instructions` appended after `input`, and the migration rules: `none` rejected, `medium`
  for a new integration, `none` and `minimal` moved to `low`, tool calling only through
  Responses, and the unsupported parameters. The task-completion block carries OpenAI's
  typo "maketo", kept so the block matches. This URL served the GPT-6 family guidance the
  older GPT guides quote until GPT-6.2 replaced it.
- GPT-6.2 Astra and GPT-6.2 Sol model pages
  (https://developers.openai.com/api/docs/models/gpt-6.2-astra and
  https://developers.openai.com/api/docs/models/gpt-6.2-sol): `none` rejected, Multi-agent,
  the 1,050,000-token window, 922,000 input and 128,000 output, the cached-input rate (5% of
  input on both), and the higher rate past 272K input tokens.
- Reasoning models (https://developers.openai.com/api/docs/guides/reasoning): `none` rejected
  on both, the effort table behind "use `xhigh` only when evals show a clear benefit",
  `reasoning.mode` with its `gpt-6.2-sol` example, `configuration_update` in standard,
  single-agent mode on GPT-6 and later, and reasoning items dropped after prefix edits from
  6.2.
- Model selection (https://developers.openai.com/api/docs/guides/model-selection): the
  per-model effort suggestions, and Sol at `medium` as the start for most API workflows.
- Multi-agent (https://developers.openai.com/api/docs/guides/responses-multi-agent): the model
  list (GPT-6.2 Astra, GPT-6.2 Sol, GPT-6.1 Sol and all GPT-5.6 models), the
  developer-message examples, when to prefer one agent, `max_concurrent_subagents`, and the
  limitations.
- Async tool calling (https://developers.openai.com/api/docs/guides/async-tool-calling,
  re-read on 2026-11-21): "supported by GPT-6 Astra and later models", no async tools with
  parallel tool calls under Multi-agent, and the Async tools section: results returned on
  the original `call_id`, a `task_handle` with a wait tool of your own, results before the
  wait's status, and the instruction to continue independent work and wait before a step
  that requires a user's answer.
- Mid-turn steering (https://developers.openai.com/api/docs/guides/steering): available with
  "the GPT-6 model family", GPT-5.6 and earlier excluded. Its examples use `gpt-6-astra` and
  it does not name GPT-6.2, so the guide says so rather than claiming support.
- Keep the prefix unchanged (https://developers.openai.com/api/docs/guides/keep-prefix-unchanged)
  and Prompt caching (https://developers.openai.com/api/docs/guides/prompt-caching): appending
  a new developer message instead of editing the first, top-level `instructions` for
  turn-scoped guidance billed at the uncached rate, and the 0.05x cache-read rate on both.
- Models in Codex (https://learn.chatgpt.com/docs/models, reached from
  https://developers.openai.com/codex/models.md): the default context in Codex (272,000 tokens
  on Astra, 500,000 on Sol), `model_context_window`, and "start with the effort your client
  selects".
- Prompting GPT-6.2 in Codex (https://learn.chatgpt.com/guides/prompting-gpt-6-2-astra), which
  says it applies to Astra and Sol: what you will look for in review, effort scaled to the
  depth of an investigation, "use subagents as needed", review at the size people see it,
  a lean `AGENTS.md`, and the advice for several agents on one machine.
- GPT-6.2 in What's new (https://learn.chatgpt.com/docs/whats-new/gpt-62-astra-sol): the
  2026-11-17 release in ChatGPT Work, Codex and the API, and `configuration_update` named for
  these models.
- Introducing GPT-6.2 Astra and Sol (openai.com/index/introducing-gpt-6-2-astra-sol/):
  returned 403 to a scripted fetch on 2026-11-20, so nothing in the guide comes from it.

Measured: on 2026-11-20 a proxenos daemon on a ChatGPT Business account listed
`gpt-6.2-astra` at 272000 tokens and `gpt-6.2-sol` at 500000, matching the Codex defaults.

Not confirmed, so left out of the guide: the full set of effort values and the default
effort for either model (the reasoning guide names defaults only for GPT-5.6, GPT-6.1 Sol,
GPT-6 Sol and GPT-6 Luna, and the model pages list no values), whether `max` is accepted,
and `reasoning.context: "all_turns"` (the reasoning guide lists only GPT-5.6 and GPT-6.1
Sol, although the prompt caching guide's examples send it with `gpt-6.2-sol`). Mid-turn
steering is stated as the steering guide words it.

The Always include, Avoid and failure-mode lists are this skill's synthesis of these sources, and the delegation template is its own heuristic.
