# GPT-6 Astra prompting guide

Rules for writing a task prompt for an agent or subagent running GPT-6 Astra
(`gpt-6-astra`).

Astra follows instructions closely, including those in skills and in files such as
`AGENTS.md`. It asks for clarification more readily than earlier models, and it can stop
at a first implementation and come back for review while work remains. Most of what a
prompt needs to add is permission to keep going and a clear picture of done.

What the API does on this model, which decides what a prompt can rely on:

- `reasoning.effort` takes `low`, `medium`, `high`, `xhigh`, and `max`. `none` returns a
  400.
- Tool calling needs the Responses API. Chat Completions takes requests without tools.
- `temperature`, `top_p`, and `top_logprobs` are not supported.
- Mid-turn steering, over a WebSocket connection to the Responses API, lets a correction
  reach the model while it works. It does not cancel tools already started or undo
  earlier actions.
- Async tool calling (`async: true` on a function or custom tool) lets the model keep
  working while your application runs a slow tool.
- OpenAI lists the Responses API's Multi-agent beta for GPT-6.1 Sol and the GPT-5.6 models,
  not for Astra. Subagents go through your own harness.

## Always include

- The outcome and what done includes. If done means getting the implementation running,
  inspecting the result, and fixing what fails, say so. A requirement to stop for review
  after a first implementation pulls Astra toward stopping early.
- Decision boundaries: what it can do without asking and what needs approval. Strong
  "ask first" language written for earlier models makes Astra stop where you would want
  it to continue.
- Permission to act when the request implies it.
- The return format the caller needs.

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

When the task ends in a step that needs approval, such as a deploy, a merge, or a write to
an external system:

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

Astra also asks non-blocking questions while it works. Tune these blocks to the autonomy
the task allows.

### A safe workflow it keeps asking about

Grant the specific workflow, such as a local test suite:

```text
The local tests use disposable fixtures and have no production access. Run them, fix
failures caused by the requested change, and rerun affected tests without asking for
approval at each step.
```

### Skills and instruction files

When the subagent loads skills or `AGENTS.md`, unclear or conflicting guidance there can
make it pause early. State the precedence:

```text
The user's instructions take precedence over guidelines provided in a skill. If explicit
user instructions conflict with a skill's instructions, prioritize the user's instructions.
```

When a skill or instruction file has already derailed a run, ask it to name the cause:

```text
If a skill causes you to ask for permission or confirmation, pause, leave requested work
unfinished, or diverge from the user's intent, name and link to the exact SKILL.md file you
read, quote the relevant instruction, and briefly explain how it applies. Distinguish
explicit skill requirements from your interpretation of guidelines.
```

### Testing on small changes

Astra tests thoroughly on its own, so a "run the tests" instruction written for an older
model adds testing it does not need. For small changes:

```text
Do not write tests for reversible, low-impact changes that mirror the implementation. If
you do choose to verify your work with tests, make sure that the tests are meaningful and
necessary to verify implementation.

Run tests appropriate to the change and complete required checks. Once those pass, broaden
or repeat testing only when new changes, failures, or unresolved concerns justify it;
otherwise, continue toward completing the task.
```

### Writing style

Astra tends to lists, tables, and Markdown, and can repeat phrases across sessions. When
the reader needs prose:

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

For a technical reader:

```text
Use plain language over jargon, and reference technical details only to the degree that it
helps illustrate an idea or your work to the user. Communicate complex concepts in a clear
and cohesive manner, and calibrate your writing to the level of background knowledge
assumed from the user's prompt and context.
```

### Subagents

If the subagent can spawn its own through your harness, Astra may delegate less often than
the workflow wants:

```text
If at any point you can parallelize work by delegating tasks to another agent (no matter if
you are the root or subagent), you should do so using collaboration tools if it could save
time or improve quality.
```

Messages between agents can have grammar or spacing errors:

```text
Messages that you send to other agents and your final answer may be read by a human, so
ensure they are legible. Always put proper spaces between words and/or numbers.
```

### Async tools

When a tool is marked `async`, tell the model to continue independent work and to wait
before a step that needs the result.

## Avoid

- Leaving autonomy implicit. Silence produces approval requests.
- Strong "ask first" or "stop for review" language carried over from earlier models, unless
  that stop is a decision you need.
- Instructions to run tests or check work written for earlier models. Astra does both on
  its own.
- Requiring a stack of documents before every edit. Say when each one is relevant.
- Long or overlapping skill descriptions that make the model load a skill the task does
  not need.
- Rigid step-by-step recipes. Overly specific guidance can hinder results on Astra.
- `none` effort, `temperature`, `top_p`, and `top_logprobs`.

## Effort

Reasoning levels are `low`, `medium`, `high`, `xhigh`, `max`. A request moving from `none`
or `minimal` starts at `low`. OpenAI's model selection guide suggests:

- `low`: concise writing and content adaptation that preserve facts and nuance.
- `medium`: ambitious projects that need broad context, reliable interactions, and
  complete results.
- `xhigh`: demanding analysis and complex deliverables with exacting requirements.

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
[What done includes: the change made, run, its result inspected, failures fixed. Any
decision that needs review.]

Return:
[A short handoff: what changed, what was checked, what still needs attention.]
```

## Failure-mode adjustments

- Asks before starting: add the autonomy block, and name what it may do without asking.
- Stops at a plan, a capability statement, or a first implementation: add the
  follow-through block, and spell out what done includes.
- Asks about a safe routine workflow: grant that workflow explicitly.
- A skill or instruction file derails the task: add the precedence block, then the
  name-and-quote block.
- Test scope balloons on a small change: remove inherited test instructions, then add the
  testing block.
- Overformatted output: add the writing-style block.
- Delegates less than wanted: add the delegation block.
- 400 on effort: `none` is not supported. Use `low`.
