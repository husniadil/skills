# GPT-6 Sol and Luna prompting guide

Rules for writing a task prompt for an agent or subagent running GPT-6 Sol (`gpt-6-sol`)
or GPT-6 Luna (`gpt-6-luna`). The two share one API surface, so every rule here applies
to both. GPT-6.1 Sol is the newer Sol and has its own guide.

The blocks below are OpenAI's GPT-6 family guidance, written from GPT-6 Astra's behavior.
Evaluate them on Sol or Luna. OpenAI notes that guidance which helps Sol or Luna may
overconstrain Astra, so these two can need more explicit instruction than Astra does.

What OpenAI says about these two models:

- They were trained with methods similar to Astra's.
- They carry Astra's communication style: more clarity, less jargon, fewer odd turns of
  phrase, fewer low-value details, and slightly shorter answers overall.
- Luna is the most cost-efficient GPT-6 model, for focused, high-volume tasks.

What the API does on these models, which decides what a prompt can rely on:

- `reasoning.effort` takes `none`, `low`, `medium` (default), `high`, `xhigh`, and `max`.
- Built-in tools and function calling need the Responses API. Chat Completions supports
  function calling only with `reasoning_effort: "none"`.
- With effort above `none`, `temperature`, `top_p`, and `top_logprobs` are not supported.
- Mid-turn steering over a WebSocket connection and async tool calling are available, as
  on Astra.
- OpenAI lists the Responses API's Multi-agent beta for GPT-6.1 Sol and the GPT-5.6
  models, not for Sol or Luna. Subagents go through your own harness.

## Always include

- The outcome and what done includes, such as getting the change running, inspecting the
  result, and fixing what fails.
- Decision boundaries: what it can do without asking and what needs approval, in place of
  blanket "always ask" rules.
- Permission to act when the request implies it.
- What a useful response looks like, such as a short handoff covering what changed, what
  was checked, and what still needs attention.

```text
You should infer the user's intent and task scope from the instructions and prior
conversation context. Your job is to bias towards action and carry the user's intended
task to completion.

When the user expresses intent to perform new work or fix an existing issue, persist until
the user's intended goal is complete. Progress autonomously towards the user's goal (e.g.
creating isolated worktrees / checkouts if needed, resolving merge conflicts, read-only
actions, creating draft PRs etc.) unless they are clearly destructive or irreversible.
```

## Include when applicable

### The model stops at acknowledging, at a plan, or at a partial result

```text
When the user's prompt indicates a request for action, such as "can you...", "I want
to...", "help me..." and similar expressions, treat these as instructions to do the work
and take action. Do not stop at acknowledging capability (e.g. "Yes..."), proposing a plan,
or offering to continue. Do not settle for a partial or "helpful enough" solution that does
not fully satisfy the user's task to save time, effort or tokens. If a task requires
sustained work, complete all the necessary work until the intended outcome is fulfilled.
```

### Approval only at the end

```text
Before asking the user clarifying questions, you should complete the work that is already
authorized from context and necessary to make the proposed action concrete and reviewable.
The user should be approving a concrete, reviewable result. For example, before deploying a
change, writing to an external application, merging a PR or publishing a site, do all the
required work first so that user approval is the final step. You don't need user permission
for reversible tasks, read-only actions, reviews or fixes, or anything for which
authorization is provided earlier in the session or strongly implied from the task
instruction.

Do not introduce unsolicited warnings, disclaimers, approval flows, or safety/compliance
checklists due to hypothetical risk.
```

### A safe workflow it keeps asking about

```text
The local tests use disposable fixtures and have no production access. Run them, fix
failures caused by the requested change, and rerun affected tests without asking for
approval at each step.
```

### Skills and instruction files

```text
The user's instructions take precedence over guidelines provided in a skill. If explicit
user instructions conflict with a skill's instructions, prioritize the user's instructions.
```

When a skill or instruction file has already derailed a run:

```text
If a skill causes you to ask for permission or confirmation, pause, leave requested work
unfinished, or diverge from the user's intent, name and link to the exact SKILL.md file you
read, quote the relevant instruction, and briefly explain how it applies. Distinguish
explicit skill requirements from your interpretation of guidelines.
```

### Testing on small changes

```text
Do not write tests for reversible, low-impact changes that mirror the implementation. If
you do choose to verify your work with tests, make sure that the tests are meaningful and
necessary to verify implementation.

Run tests appropriate to the change and complete required checks. Once those pass, broaden
or repeat testing only when new changes, failures, or unresolved concerns justify it;
otherwise, continue toward completing the task.
```

### Writing style

When the reader needs prose with less formatting:

```text
Default to using clear, concise paragraphs, each developing one main idea. Use lists only
when the information is genuinely parallel, sequential, or easier to compare, and avoid
nested lists unless the hierarchy cannot be expressed clearly in prose. Use plain, simple
language: familiar words, concrete examples, and precise verbs. Prefer active voice and
direct statements.

Make sure to state the main point clearly and early, then develop it with the explanation
and detail the reader needs. Let each sentence build on what came before. Develop the
points that matter and provide enough support to be useful.
```

### Subagents

If the subagent can spawn its own through your harness:

```text
If at any point you can parallelize work by delegating tasks to another agent (no matter if
you are the root or subagent), you should do so using collaboration tools if it could save
time or improve quality.
```

```text
Messages that you send to other agents and your final answer may be read by a human, so
ensure they are legible. Always put proper spaces between words and/or numbers.
```

### A tool failure that must reach the user

In OpenAI's broken-search evaluation, built to elicit the failure, GPT-6 Luna did not tell
the user its search tool was broken in 28.7% of cases, against 4.9% for GPT-6 Sol. OpenAI
publishes no prompt for this. When a tool failure must be reported, say so in the task and
check the behavior in your own evals.

### Async tools

When a tool is marked `async`, tell the model to continue independent work and to wait
before a step that needs the result.

## Avoid

- Blanket "always ask" rules. Replace them with decision boundaries.
- Rigid step-by-step recipes.
- Requiring a stack of documents before every edit. Say when each one is relevant.
- Long or overlapping skill descriptions that make the model load a skill the task does
  not need.
- `minimal` effort, which these models do not list.
- `temperature`, `top_p`, and `top_logprobs` when effort is not `none`.

## Effort

Reasoning levels are `none`, `low`, `medium` (default), `high`, `xhigh`, `max`. A request
moving from `minimal` starts at `low`. For Luna, OpenAI's model selection guide suggests:

- `low`: fine-grained edits, well-scoped problem-solving, and simple data extraction.
- `xhigh`: finding current context across multiple apps, prioritizing work, and solving
  problems with clear constraints.

Use `xhigh` only when evals show a clear benefit. `reasoning.mode: "pro"` in the Responses
API gives more model work on difficult tasks at higher latency, independent of effort.

To change effort between responses, add a `configuration_update` input item and leave
request-level `reasoning.effort` unchanged, so the prompt prefix stays cached.

## Delegation template

```text
Goal:
[The result wanted, and who it is for.]

Context and constraints:
[What the task needs to know. What must not change.]

Decision boundaries:
[What it can decide and do without asking. What needs approval first.]

Done when:
[What done includes: the change made, run, its result inspected, failures fixed.]

Return:
[A short handoff: what changed, what was checked, what still needs attention. Say if a
tool failed.]
```

## Failure-mode adjustments

- Asks before starting: add the autonomy block, and name what it may do without asking.
- Stops at a plan or a partial result: add the follow-through block, and spell out what
  done includes.
- A skill or instruction file derails the task: add the precedence block, then the
  name-and-quote block.
- Test scope balloons on a small change: add the testing block.
- Delegates less than wanted: add the delegation block.
- Overformatted output: add the writing-style block.
- A tool failure goes unreported, more likely on Luna: require the report in the Return
  section and check it in evals.
- Weak results on image inputs or computer use in evaluations run before 2026-09-25: OpenAI
  fixed an image-encoding bug in Sol and Luna that day and recommends rerunning them.
- Function calls fail through Chat Completions: use the Responses API, or effort `none`.
