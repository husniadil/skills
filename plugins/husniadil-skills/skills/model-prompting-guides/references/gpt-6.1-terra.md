# GPT-6.1 Terra prompting guide

Rules for writing a task prompt for an agent or subagent running GPT-6.1 Terra
(`gpt-6.1-terra`).

OpenAI publishes no prompting guidance written for GPT-6.1 Terra. Its GPT-6 guide gives one
set of prompts "as a starting point across the GPT-6 model family", says they address
behavior observed with GPT-6 Astra, and asks you to evaluate them on the model you run. Its
GPT-6 family model guide adds what an assignment should contain. So the blocks below are
family guidance, not observed GPT-6.1 Terra behavior, and each behavior note names the model
it was observed on. GPT-6.1 Sol, the larger model in the same release line, has
[its own file](gpt-6.1-sol.md). [GPT-6 Astra](gpt-6-astra.md) and
[GPT-5.6 Terra](gpt-5.6.md) have theirs.

What OpenAI says about GPT-6.1 Terra:

- It is "a fast, efficient model for visual reasoning, precise computer use, and clear,
  natural writing."
- It takes text and image input and returns text. Audio and video are not supported.
- Its context window is 1,050,000 tokens, with 128,000 maximum output. A prompt over
  272,000 input tokens is billed at 2x the input and cache rates and 1.5x the output rate
  for the whole request.
- Cached input is billed at 5% of the input rate.
- OpenAI's migration advice is to compare it with GPT-5.6 Terra on representative images
  and workflows at the same reasoning effort.

What differs from GPT-6.1 Sol:

- `none` reasoning effort is supported. GPT-6.1 Sol does not support it.
- The page does not mention the Responses API's Multi-agent beta, which the GPT-6.1 Sol
  page lists. Do not assume it.
- Like GPT-6.1 Sol, Chat Completions takes the request but tool calling needs the
  Responses API.

## Always include

From the GPT-6 family model guide:

- A clear assignment: the result wanted, who it is for, the relevant context and
  constraints, and what counts as done.
- Decision boundaries: which actions can proceed independently and which need approval,
  in place of blanket "always ask" rules.
- What "done" includes, such as implementing the change, running it, inspecting the
  result, and fixing failures, plus any decisions that need review.
- What a useful response looks like, for example plain language, technical detail suited
  to the audience, and a short handoff covering what changed, what was checked, and what
  still needs attention.

Put stable instructions and reference material before the details that change per task,
and keep tool definitions consistent, so the prompt prefix is reused from cache.

## Include when applicable

### The model stops to ask, or stops at a plan

OpenAI observed this on Astra, which asks for clarification where earlier models assumed.
These are its family starting points for more autonomous work.

```text
Infer the user's intent and task scope from the instructions and prior conversation
context. Bias towards action and carry the user's intended task to completion. When the
user asks for new work or a fix, persist until the goal is complete. Progress autonomously
unless an action is clearly destructive or irreversible.
```

```text
When the user's prompt indicates a request for action, such as "can you...", "I want
to...", or "help me...", treat it as an instruction to do the work. Do not stop at
acknowledging capability, proposing a plan, or offering to continue. If a task requires
sustained work, complete all the necessary work until the intended outcome is fulfilled.
```

```text
Before asking the user clarifying questions, complete the work that is already authorized
from context, so the user approves a concrete, reviewable result. You don't need
permission for reversible tasks, read-only actions, reviews or fixes, or anything
authorized earlier in the session or strongly implied by the task. Do not introduce
unsolicited warnings, disclaimers, approval flows, or safety checklists due to
hypothetical risk.
```

### Skills and instruction files

Astra is sensitive to instructions in skills and files such as `AGENTS.md`, and OpenAI
strongly recommends auditing what the model can reach. For the family, it recommends
short skill descriptions that say when each skill runs, supporting detail loaded only when
needed, and guidance in place of rigid recipes. In `AGENTS.md`, say when each document or
test is relevant, and authorize safe routine workflows explicitly.

```text
The user's instructions take precedence over guidelines provided in a skill. If explicit
user instructions conflict with a skill's instructions, prioritize the user's
instructions.
```

```text
If a skill causes you to ask for permission or confirmation, pause, leave requested work
unfinished, or diverge from the user's intent, name and link the exact SKILL.md file you
read, quote the relevant instruction, and briefly explain how it applies. Distinguish
explicit skill requirements from your interpretation of guidelines.
```

```text
The local tests use disposable fixtures and have no production access. Run them, fix
failures caused by the requested change, and rerun affected tests without asking for
approval at each step.
```

### Subagent delegation

OpenAI's GPT-6.1 Terra page does not list the Multi-agent beta, so write delegation into
your own harness. The family block for Astra, which may delegate less than wanted, is:

```text
If at any point you can parallelize work by delegating tasks to another agent, whether you
are the root or a subagent, do so using collaboration tools if it could save time or
improve quality.
```

```text
Messages that you send to other agents and your final answer may be read by a human, so
ensure they are legible. Always put proper spaces between words and numbers.
```

To keep it from delegating, say so in the developer message:

```text
Do not spawn subagents unless the user explicitly asks for subagents, delegation, or
parallel agent work.
```

### Writing style

Astra tends to lists, tables, and Markdown. If the application needs prose with less
formatting:

```text
Default to clear, concise paragraphs, each developing one main idea. Use lists only when
the information is genuinely parallel, sequential, or easier to compare, and avoid nested
lists. Use plain, simple language: familiar words, concrete examples, and precise verbs.
Prefer active voice and direct statements. State the main point clearly and early.
```

### Testing

Astra tends to test thoroughly before calling a coding task complete, which on a small
change can mean broader tests than it needs.

```text
Do not write tests for reversible, low-impact changes that mirror the implementation. Run
tests appropriate to the change and complete required checks. Once those pass, broaden or
repeat testing only when new changes, failures, or unresolved concerns justify it.
```

## Avoid

- Blanket "always ask" rules. Replace them with clear decision boundaries.
- Overly specific recipes. OpenAI's family guide says models now handle nuance and
  ambiguity well enough that overly specific guidance can hinder results.
- Long or overlapping skill descriptions that push the model to load a skill the task
  does not need.
- Telling the model to read a stack of documents before every edit. Say when each one is
  relevant instead.
- `minimal` effort, which the GPT-6 family does not list.

## Effort

GPT-6.1 Terra supports `none`, `low`, `medium` (default), `high`, `xhigh`, and `max`.
OpenAI says to start with `medium` and raise it only if the quality gain is worth the added
time and tokens.

The family model guide maps levels to work:

- `low`: routine tasks, such as extracting facts or making small edits.
- `medium`: work requiring judgment, such as planning a feature or comparing options.
- `high`: difficult debugging, deeper analysis, or careful review.
- `xhigh` and `max`: test when `high` falls short, and keep only if the gain justifies the
  time and cost.

Tool calling needs the Responses API. Chat Completions takes requests without tools.

## Delegation template

```text
Goal:
[The result wanted, and who it is for.]

Context and constraints:
[What the task needs to know. What must not change.]

Decision boundaries:
[What can be decided and done without asking. What needs approval first.]

Delegation:
[When to spawn subagents, if at all.]

Done when:
[What done includes: the change made, run, its result inspected, failures fixed.]

Return:
[A short handoff: what changed, what was checked, what still needs attention.]
```

## Failure-mode adjustments

- Function calls through Chat Completions: move the request to the Responses API.
- Quality drops against GPT-5.6 Terra: compare both at the same effort on representative
  images and workflows before raising effort.
- Asks before starting, or stops at a plan: add the autonomy blocks above, and define done
  as a finished result.
- A skill or instruction file derails the task: add the precedence block, then the
  name-and-quote block.
- Too many or too few subagents: say when to spawn them in the developer message.
- Test scope balloons on a small change: add the testing block.
- Overformatted output: add the writing-style block.

## Provenance

Last cross-checked: 2026-10-27. OpenAI publishes no prompting guidance specific to GPT-6.1
Terra. The prompt blocks come from OpenAI's GPT-6 family guidance, which it wrote from
behavior observed with GPT-6 Astra and offers as a starting point for the whole family.
Blocks are condensed from the official prompts. Sources, all read on 2026-10-27:

- Using GPT-6, its GPT-6.1 Terra section, prompting best practices and migration
  quickstart: https://developers.openai.com/api/docs/guides/latest-model
- GPT-6.1 Terra model page: https://developers.openai.com/api/docs/models/gpt-6.1-terra
- A model guide for the GPT-6 family (2026-10-02):
  https://openai.com/index/practical-guide-building-gpt-6/
- Rethinking skills and prompts for GPT-6 Astra, for the local-tests example:
  https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra
