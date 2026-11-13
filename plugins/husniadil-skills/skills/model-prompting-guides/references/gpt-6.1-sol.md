# GPT-6.1 Sol prompting guide

Rules for writing a task prompt for an agent or subagent running GPT-6.1 Sol
(`gpt-6.1-sol`).

The blocks below are OpenAI's GPT-6 family guidance, written from GPT-6 Astra's behavior.
Evaluate them on GPT-6.1 Sol.

What OpenAI says about GPT-6.1 Sol:

- It upgrades GPT-6 Sol and comes close to Astra on complex coding, computer use, and
  professional work, at a lower cost. OpenAI suggests comparing it with Astra on the same
  task to judge the tradeoff.
- It is more transparent about its limitations than GPT-6 Sol, and more reliable at
  respecting user intent and safety constraints, including saying when a search tool is
  broken and keeping to explicit restrictions during agentic tasks.

What the API does on this model, which decides what a prompt can rely on:

- `reasoning.effort` takes `low`, `medium` (default), `high`, `xhigh`, and `max`. `none` and
  `minimal` are not supported. A request moving from either starts at `low`.
- Tool calling needs the Responses API. Chat Completions takes requests without tools.
- `temperature`, `top_p`, and `top_logprobs` are not supported.
- The Responses API's Multi-agent beta is available (see Subagents).
- `reasoning.context: "all_turns"` lets the model reuse compatible reasoning from earlier
  turns.
- Cached input is billed at 5% of the input rate, so a stable prompt prefix saves more
  than on GPT-6 Sol.
- Mid-turn steering over a WebSocket connection and async tool calling are available.

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

Put stable instructions and reference material before the details that change per task,
and keep tool definitions the same across requests, so the prefix is reused from cache.

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

### Subagents

With the Multi-agent beta (`OpenAI-Beta: responses_multi_agent=v1`), the root agent can
spawn subagents for independent work and combine their results. The API injects its own
orchestration instructions into the root agent and every subagent. Your developer message
is added to them, and it is where you say when to spawn:

```text
Do not spawn subagents unless the user explicitly asks for subagents, delegation, or
parallel agent work.
```

```text
Proactive Multi-agent delegation is active. Use subagents when parallel work would
materially improve speed or quality.
```

Use Multi-agent when the work splits into independent, bounded tasks, separate context
improves focus, or parallel exploration saves wall-clock time. Prefer one agent when each
step depends on the last, the task fits one short run, agents would contend over the same
mutable resource, or you need a fixed execution graph. Subagents add tokens.
`max_concurrent_subagents` defaults to 3 across the whole tree.

With Multi-agent on, `/responses/compact`, `reasoning.summary`, and `max_tool_calls` are not
supported, `configuration_update` does not apply, and async tools must not be combined with
parallel tool calls.

In a harness of your own instead, the family blocks are:

```text
If at any point you can parallelize work by delegating tasks to another agent (no matter if
you are the root or subagent), you should do so using collaboration tools if it could save
time or improve quality.
```

```text
Messages that you send to other agents and your final answer may be read by a human, so
ensure they are legible. Always put proper spaces between words and/or numbers.
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

### Async tools

When a tool is marked `async`, tell the model to continue independent work and to wait
before a step that needs the result.

## Avoid

- Blanket "always ask" rules. Replace them with decision boundaries.
- Rigid step-by-step recipes.
- Requiring a stack of documents before every edit. Say when each one is relevant.
- Long or overlapping skill descriptions that make the model load a skill the task does
  not need.
- `none` or `minimal` effort, `temperature`, `top_p`, and `top_logprobs`.

## Effort

Reasoning levels are `low`, `medium` (default), `high`, `xhigh`, `max`. OpenAI's model
selection guide suggests:

- `medium`: complex technical work and coordinated deliverables you expect to revise.
- `xhigh`: polished deliverables, connected visual systems, and decisions built from
  conflicting evidence.

Use `xhigh` only when evals show a clear benefit. `reasoning.mode: "pro"` in the Responses
API gives more model work on difficult tasks at higher latency, independent of effort.

To change effort between responses in a single-agent request, add a `configuration_update`
input item and leave request-level `reasoning.effort` unchanged, so the prompt prefix stays
cached.

## Delegation template

```text
Goal:
[The result wanted, and who it is for.]

Context and constraints:
[What the task needs to know. What must not change.]

Decision boundaries:
[What it can decide and do without asking. What needs approval first.]

Delegation:
[When to spawn subagents, if at all.]

Done when:
[What done includes: the change made, run, its result inspected, failures fixed.]

Return:
[A short handoff: what changed, what was checked, what still needs attention.]
```

## Failure-mode adjustments

- 400 on effort carried over from GPT-6 Sol at `none`, or from an older model at
  `minimal`: start at `low` and compare on representative tasks.
- Function calls through Chat Completions: move the request to the Responses API.
- Asks before starting: add the autonomy block, and name what it may do without asking.
- Stops at a plan or a partial result: add the follow-through block, and spell out what
  done includes.
- A skill or instruction file derails the task: add the precedence block, then the
  name-and-quote block.
- Too many or too few subagents under Multi-agent: say when to spawn them in the developer
  message.
- Test scope balloons on a small change: add the testing block.
- Overformatted output: add the writing-style block.
