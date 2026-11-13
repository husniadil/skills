# GPT-6.1 Terra prompting guide

Rules for writing a task prompt for an agent or subagent running GPT-6.1 Terra
(`gpt-6.1-terra`).

The blocks below are OpenAI's GPT-6 family guidance, written from GPT-6 Astra's behavior.
Evaluate them on GPT-6.1 Terra.

OpenAI describes Terra as a fast, efficient model for visual reasoning, precise computer
use, and clear, natural writing. It suggests Terra for concise writing based on supplied
material, computer-use tasks with a defined outcome, and scoped code fixes, given clear
inputs, requirements, and a way to verify the result, such as checking saved records or
running regression tests.

What the API does on this model, which decides what a prompt can rely on:

- `reasoning.effort` takes `none`, `low`, `medium` (default), `high`, `xhigh`, and `max`.
- Tool calling needs the Responses API. Chat Completions takes requests without tools.
- With effort above `none`, `temperature`, `top_p`, and `top_logprobs` are not supported.
- Input is text and images. Audio and video are not supported.
- OpenAI lists the Responses API's Multi-agent beta for GPT-6.1 Sol and the GPT-5.6
  models, not for Terra. Subagents go through your own harness.
- Cached input is billed at 5% of the input rate. 12-hour cache retention is available
  for requests hours apart.
- Mid-turn steering over a WebSocket connection and async tool calling are available.

## Always include

- The inputs to work from, the requirements, and how the result will be verified.
- The outcome and what done includes. For computer use, that the change is saved and
  unrelated data is preserved.
- Decision boundaries: what it can do without asking and what needs approval.
- What a useful response looks like. For a completion report, that it must match what was
  actually saved.

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

### Writing

For writing tasks, state the audience and voice, the facts and qualifications that must
survive, and the length. When the reader needs prose with less formatting:

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

### Testing on small changes

```text
Do not write tests for reversible, low-impact changes that mirror the implementation. If
you do choose to verify your work with tests, make sure that the tests are meaningful and
necessary to verify implementation.

Run tests appropriate to the change and complete required checks. Once those pass, broaden
or repeat testing only when new changes, failures, or unresolved concerns justify it;
otherwise, continue toward completing the task.
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

### Async tools

When a tool is marked `async`, tell the model to continue independent work and to wait
before a step that needs the result.

## Avoid

- Blanket "always ask" rules. Replace them with decision boundaries.
- Rigid step-by-step recipes.
- Requiring a stack of documents before every edit. Say when each one is relevant.
- A task with no way to check the result. Terra works best when the result can be
  verified.
- `minimal` effort, which the GPT-6 family does not list.
- `temperature`, `top_p`, and `top_logprobs` when effort is not `none`.

## Effort

Reasoning levels are `none`, `low`, `medium` (default), `high`, `xhigh`, `max`. A request
moving from `minimal` starts at `low`. Use `xhigh` only when evals show a clear benefit.

To choose between Terra and GPT-6.1 Sol, or between effort levels, compare on the same
inputs at the same effort. For writing, judge audience fit, voice, and useful detail as
well as accuracy and length. For computer use, check the saved result and the accuracy of
the completion report. Moving from GPT-5.6 Terra, compare both models on representative
images and workflows at the same effort.

To change effort between responses, add a `configuration_update` input item and leave
request-level `reasoning.effort` unchanged, so the prompt prefix stays cached.

## Delegation template

```text
Goal:
[The result wanted, and who it is for.]

Inputs and requirements:
[The material to work from. What must be true of the result. What must not change.]

Decision boundaries:
[What it can decide and do without asking. What needs approval first.]

Done when:
[What done includes, and how it is verified: saved records rechecked, tests run.]

Return:
[A short handoff: what changed, what was checked, what still needs attention.]
```

## Failure-mode adjustments

- Function calls through Chat Completions: move the request to the Responses API.
- Quality drops against GPT-5.6 Terra or GPT-6.1 Sol: compare at the same effort on
  representative inputs before raising effort.
- A completion report that does not match the saved result: require the recheck in Done
  when, and ask for the verified state in the report.
- Asks before starting: add the autonomy block, and name what it may do without asking.
- Stops at a plan or a partial result: add the follow-through block, and spell out what
  done includes.
- A skill or instruction file derails the task: add the precedence block, then the
  name-and-quote block.
- Test scope balloons on a small change: add the testing block.
- Overformatted output: add the writing block.
