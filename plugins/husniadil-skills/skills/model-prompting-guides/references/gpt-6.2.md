# GPT-6.2 prompting guide

Rules for writing a task prompt for an agent or subagent running GPT-6.2 Astra
(`gpt-6.2-astra`) or GPT-6.2 Sol (`gpt-6.2-sol`). OpenAI publishes one prompting guide
for the GPT-6.2 family, written from behavior it saw on both models, so the rules apply
to both.

What OpenAI says about these models:

- Astra is for the most demanding tasks, and Sol for complex work at lower cost.
- Astra writes more concisely and directly by default than earlier models.
- When the intent is unclear, Astra may propose a next step and wait for confirmation.
  On longer tasks it needs room to make reasonable assumptions and keep working.
- Astra tends to write more efficient, high-quality code than its predecessors, so the
  prompt's job is the project's conventions.
- On longer tasks, the model can carry shorthand from its reasoning or from other agents
  into its final answer.

What the API does on these models, which decides what a prompt can rely on:

- `reasoning.effort` set to `none` is rejected. OpenAI moves `none` and `minimal` to
  `low`, and suggests `medium` for a new integration. Its pages name no default for
  these models.
- Tool calling needs the Responses API. Chat Completions takes requests without tools.
- `temperature`, `top_p`, and `top_logprobs` are not supported. In Chat Completions, omit
  `logprobs` too.
- The Responses API's Multi-agent beta is available on both (see Subagents).
- Async tool calling is available, from GPT-6 Astra on. OpenAI's steering guide lists
  mid-turn steering for the GPT-6 family without naming GPT-6.2.
- The API context window is 1,050,000 tokens, with at most 922,000 input and 128,000
  output. Past 272,000 input tokens, the whole request is billed at a higher rate.
- In Codex, the default context is 272,000 tokens on Astra and 500,000 on Sol.
  `model_context_window` in `config.toml` raises it.
- From GPT-6.2, editing earlier conversation items (a developer message, a tool call),
  some model changes, or a change of end user or organization drops the reasoning
  items. Answers can get worse and the model can spend tokens redoing work.
- From GPT-6.2, top-level `instructions` is appended after `input` and billed at the
  uncached rate. Cached input costs 5% of the input rate.

## Always include

- The outcome and which decisions need the user's input, for work that can proceed
  without supervision.
- What you will look for when you review the work, such as an icon that must read at 24
  pixels.
- The project's conventions and any behavior existing callers rely on.
- Who reads the result, when it goes to someone without the user's context.

```text
Avoid stopping to end the turn while the task is incomplete or if there is an authorized
next step you can take, and instead take the next steps within task scope to progress the
user's request. If your final response before ending the turn is a suggested next step, a
plan, a request to the user for a routine decision, instructions for a task to execute, or
similar handoff to the user, take these steps yourself to make progress towards what the
user asked for. Make sure that you have authorization to do so, and flag any assumptions
or decisions you maketo the user.

Only stop to clarify with the user if there is significant change in task scope, you are
concretely blocked, have a decision that the user needs to resolve, or before irreversible
or destructive actions.
```

"maketo" is OpenAI's typo, kept so the block matches its source.

Put reusable instructions in a `developer` message as the first item in `input`, and
stable reference material before the details that change per task, so the prefix is
reused from cache.

## Include when applicable

### The model stops before the work is complete

On complex or long-running tasks, ask it to check that it has done everything asked.
Higher effort helps it persist through the final checks.

```text
Bias towards action, and persist until you've completed the task the user asked for. Avoid
stopping to end the turn while the task is incomplete or if there is an authorized next
step you can take, and instead take the next steps within task scope to progress the
user's request. Make sure that you have accounted for every part of the user's request,
and persist until you've delivered a result that fully satisfies the user's goal. If a
task requires sustained work, do all the necessary work until the intended outcome is
completely fulfilled.

Progress autonomously towards the user's goal (e.g. creating isolated worktrees /
checkouts if needed, resolving merge conflicts, creating draft PRs etc) unless they are
clearly destructive or irreversible. Before ending a turn or calling your work complete,
check that your work fully satisfies what the user asked for. If any steps remain or any
part of the result still needs verification, follow through on this work before finishing.
```

Say what counts as finished and where it should be exhaustive.

### An unclear detail

```text
Make reasonable, reversible assumptions to carry work forward and state them if it
progresses the task within scope. Do not second guess yourself, stop after describing what
you could do, offer to do the work, or provide a partial answer unless there is no way you
can proceed.
```

With an async question tool of your own, such as `request_user_input_async`, the model
can ask the user and continue the work that does not depend on the answer.

### Writing style

As a collaborator for day-to-day work:

```text
Write using terminology the user and sources use. Keep technical details and use
domain-specific language when they make the explanation more precise. Use the active voice
and keep closely related details together. Cover the key points up front, and avoid
references that the reader can only make sense of later in the response. Give the user
enough context to follow your reasoning.
```

When it drafts for an external audience:

```text
When drafting a message or any other material on behalf of the user to be sent to an
external audience, consider who will read it and tailor the content to that intended
audience. The intended audience likely does not have the same context as the user, so
ensure that you provide the background information or reasoning required for the audience
to understand the content. When reviewing or editing existing content, preserve the
author's content and wording, and follow the user's instruction carefully for what edits
they want.
```

On longer tasks, so the final answer stands on its own:

```text
Treat your final answer as the user's first look at your work, and not as a continuation
of intermediate commentary. The final answer must always be fully self-contained: users
should never need to read earlier commentary updates for context, since they are collapsed
when the final answer is shown to the user.

Write the final answer and all other human-facing material anew for the intended reader.
Do not copy or closely paraphrase your reasoning or adopt its writing style. Do not carry
over working shorthand, jargon, or abbreviations from your reasoning, tool calls, or
instructions to subagents and automations.
```

### Code changes

Name when to reuse existing logic, how narrowly to scope a change, and when to add a test
the existing suite does not cover.

```text
Above all, be thorough in producing high-quality, correct code that completely fulfills
the user's task. Keep the code easy to read and verify that the user-requested outcome
works as they intend. Follow these instructions when coding:

(a) Reuse existing logic in the user's repo when you can. You should reuse existing
classes, methods, representations, and APIs in the codebase as long as they preserve
correctness. Before consolidating or removing code, preserve the behavior its callers rely
on unless the task requires changing it.
(b) Skip new tests unless requested, required by the repo, or needed to catch a specific
regression existing tests would miss.
(c) Make sure that code is human readable. Do not use fewer lines, shorter variable names,
minified formatting, or dense one-liners as substitutes for simplicity. Ensure that
comments and variable names are readable and understandable to a human. Code-golfed
expressions count as overly complex when they encode many branches, conditions, or hidden
assumptions.
(d) Avoid unnecessary indirection and abstraction. Helper functions, utility functions,
and class abstractions can add cognitive complexity even when they do not add branches.
```

### Frontend and visual work

Name the imagery and the typography, including a typeface when it matters.

```text
When generating webpages or apps with a frontend user interface, follow these
instructions:

- When choosing visuals, generally prefer realistic images from ImageGen or image search
that suit the project's style and purpose. Use SVGs when the user specifically asks for
them.
- Include a text element only when it provides information the user needs, helps them
navigate or act, or fulfills an explicit content request. Remove decorative numbering,
filler badges, redundant headings, and explanatory copy that merely restates what the
surrounding interface already makes clear, while preserving necessary labels,
instructions, and status feedback.
```

Give it a reference image, from design software or made with the image generation tool,
then ask it to build the asset, render it, and refine it against the reference. Ask it to
review the result at the size people will see it, and to try the actions an interactive
result is meant to support.

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
supported, and async tools must not be combined with parallel tool calls.

In Codex, "use subagents as needed" lets it decide when parallel work helps and how to
divide the task. For work that recurs, put that line in the relevant skill or `AGENTS.md`
and say when it applies.

### Several agents on one machine

Ask each agent to consider how many builds or tests it runs at once and to leave CPU and
memory for other work, unless the job needs the full machine. When wrapping up, have each
stop the background jobs it started and remove the temporary files it created.

### Instructions that change between turns

Append a new `developer` message at the end instead of editing the first one. Use
top-level `instructions` only for guidance that applies to the current request, such as
asking for a summary on the final turn.

### Async tools

When a tool is marked `async`, tell the model to continue independent work and to wait
before a step that needs the result.

## Avoid

- "Be concise" instructions carried over from earlier models. Astra is already concise
  and direct.
- Editing earlier developer messages or tool calls mid-conversation. The reasoning items
  are dropped and the cached prefix is lost.
- Reusable instructions in top-level `instructions`, which is appended after `input` and
  billed at the uncached rate even on a cache hit.
- Asking for new tests on every change. OpenAI's coding block adds them only when
  requested, required by the repo, or needed to catch a regression.
- Routine decisions about how to do the work in `AGENTS.md`. Keep it to the requirements
  and conventions the model cannot infer from the code, tests, or docs.
- `none` or `minimal` effort, `temperature`, `top_p`, and `top_logprobs`.

## Effort

`none` is rejected. Start a new integration at `medium`, and move `none` or `minimal` to
`low`. In Codex, start with the effort the client selects. OpenAI's model selection guide
suggests:

- Sol at `medium`: fixing bugs and adding features in an existing codebase, or drafting
  documents for review.
- Sol at `xhigh`: multistep tasks that need testing and revision along the way.
- Astra at `low`: turning a clear brief into polished work that is ready to use.
- Astra at `medium`: planning and carrying out complex projects, adjusting the approach as
  new information comes in.
- Astra at `xhigh`: open-ended problems that require weighing trade-offs and testing
  assumptions.

For an investigation, OpenAI's Codex guide scales effort with depth: Medium for a quick
survey, High for tracing one suspected cause across several systems, Extra High when
several causes may interact. Use `xhigh` only when evals show a clear benefit.

`reasoning.mode: "pro"` in the Responses API gives more model work on difficult tasks at
higher latency, independent of effort. OpenAI's example runs it on `gpt-6.2-sol`.

To change effort between responses in a single-agent request, add a `configuration_update`
input item before the next user message and leave request-level `reasoning.effort`
unchanged, so the prompt prefix stays cached.

## Delegation template

```text
Goal:
[The result wanted, and who it is for.]

Context and conventions:
[What the task needs to know. The project's conventions and the behavior callers rely
on. What must not change.]

Decision boundaries:
[What it can decide and do without asking. Which decisions need the user first.]

Delegation:
[When to spawn subagents, if at all.]

Done when:
[What done includes: the change made, run, its result inspected, failures fixed. What
the reviewer will look for.]

Return:
[A self-contained handoff: what changed, what was checked, what still needs attention,
and any assumption it made.]
```

## Failure-mode adjustments

- 400 on effort carried over at `none`, or a request still at `minimal`: start at `low`
  and compare on representative tasks.
- Function calls through Chat Completions: move the request to the Responses API.
- Proposes a next step, or asks for a routine decision, and waits: add the task
  completion block, and name the decisions that do need the user.
- Leaves part of the request undone or unchecked: add the persistence block, say what
  done includes, and raise effort.
- Stops on an unclear detail: add the assumptions block, or give it an async question
  tool.
- Final answer reads like working notes or leans on earlier updates: add the
  self-contained final answer block.
- Too terse for its reader after migrating: remove inherited "be concise" lines, then add
  the writing or external-audience block.
- Code too dense, over-abstracted, or off the project's conventions: add the coding block
  and name the conventions.
- Generic visuals or filler interface copy: add the frontend block and a reference image.
- Quality drops or tokens rise mid-conversation: look for edits to earlier items, a model
  downgrade, or a changed end user, and append instead of editing.
- Cache misses on reusable instructions: move them from `instructions` into the first
  `developer` message.
- Too many or too few subagents under Multi-agent: say when to spawn them in the developer
  message.
