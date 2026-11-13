# GPT-5.6 prompting guide

Rules for writing a task prompt for an agent or subagent running GPT-5.6 Sol
(`gpt-5.6-sol`, also reached through the `gpt-5.6` alias), GPT-5.6 Terra (`gpt-5.6-terra`),
or GPT-5.6 Luna (`gpt-5.6-luna`). OpenAI's prompting guidance covers the whole family, so
the rules apply to all three.

GPT-5.6 works best when the prompt states the outcome, the constraints, the evidence
available, and the bar for done, then leaves the path to the model. It follows prompt
contracts closely, so two rules that conflict cause more trouble than a missing detail. In
OpenAI's internal coding-agent evals, leaner system prompts scored roughly 10-15% higher
with 41-66% fewer tokens.

What the API does on these models, which decides what a prompt can rely on:

- `reasoning.effort` takes `none`, `low`, `medium` (default), `high`, `xhigh`, and `max`.
- `text.verbosity` (`low`, `medium`, `high`) sets the default level of detail.
- The Responses API's Multi-agent beta is available on every GPT-5.6 model (see
  Subagents).
- Reasoning from earlier turns is carried into the next sample by default. Set
  `reasoning.context` to `current_turn` when earlier reasoning no longer applies, since
  stale reasoning adds tokens and can anchor the model to an outdated approach.
- Mid-turn steering and async tool calling are not available on GPT-5.6. They start with
  the GPT-6 family.

## Always include

- The outcome, the success criteria that must hold before the answer, and when to stop.
- What the request authorizes: inspect and report, or change and validate.
- The tool routing that depends on context, and which source wins when two disagree.
- The output shape and the validation required.

```text
For requests to answer, explain, review, diagnose, or plan, inspect the
relevant materials and report the result. Do not implement changes unless
the request also asks for them.

For requests to change, build, or fix, make the requested in-scope local
changes and run relevant non-destructive validation without asking first.

Require confirmation for external writes, destructive actions, purchases,
or a material expansion of scope.
```

State each rule once, in one place. Name the safe local actions, such as reading files,
inspecting logs, editing in-scope code, and running tests.

```text
Resolve the request in the fewest useful tool loops, but do not let loop
minimization outrank correctness, required evidence, calculations, or
required citations.

After each result, ask whether the core request can now be answered with
useful evidence. If yes, answer. If required evidence is still missing,
name the missing fact and use the smallest useful fallback.
```

## Include when applicable

### Prerequisite lookups

When correctness depends on retrieval or lookup before acting:

```text
Before taking an action, resolve required discovery, retrieval, and
validation steps. Do not skip a prerequisite because the intended final
state seems obvious.
```

Parallelize independent reads, keep a step sequential when one result decides the next,
and synthesize after parallel retrieval before acting. If a tool returns empty, partial, or
suspiciously narrow results, have it try one or two meaningful fallbacks before concluding
nothing exists.

### Long-running work

Name the current layer of work, such as research, design, implementation, review, or
external coordination, so the model does not move from one to the next on its own. For
progress the user sees:

```text
Before tool calls for a multi-step task, send a one- or two-sentence
user-visible update that states the first step. During the task, update only
when a major phase begins or a finding changes the plan. Each update should
state one concrete outcome and the next step.
```

### Retrieval budget

```text
For ordinary Q&A, start with one broad search using short, discriminative
keywords. If the top results contain enough support for the core request,
answer from those results.

Make another retrieval call only when a required fact, owner, date, ID, or
source is missing; the user asked for exhaustive coverage or comparison; a
specific artifact must be read; or an important claim would otherwise be
unsupported.

Do not search again only to improve phrasing, add examples, or support
nonessential detail.
```

### Research and citations

Ask it to cite only sources it retrieved, attach each citation to the claim it supports,
label inference separately from supported fact, state conflicts between sources, and
narrow the answer or report the missing evidence instead of guessing. Absence of evidence
is not a factual "no". For drafts, it must not invent names, metrics, dates, roadmap
status, customer outcomes, or product capabilities.

### Coding

These lines come from the Codex CLI's default instructions:

```text
- Fix the problem at the root cause rather than applying surface-level patches, when possible.
- Avoid unneeded complexity in your solution.
- Do not attempt to fix unrelated bugs or broken tests. It is not your responsibility to fix them. (You may mention them to the user in your final message though.)
- Keep changes consistent with the style of the existing codebase. Changes should be minimal and focused on the task.
- Do not `git commit` your changes or create new git branches unless explicitly requested.
- Do not add inline comments within code unless explicitly requested.
```

Then state the validation:

```text
After making changes, run the most relevant validation available:
- targeted tests for changed behavior
- type checks or lint checks when applicable
- build checks for affected packages
- a minimal smoke test when full validation is too expensive

If validation cannot be run, explain why and describe the next best check.
```

### Frontend and visual work

Give product context, and say to keep the existing design tokens, components, and
patterns, add no features or decoration that were not asked for, and keep responsive
behavior and expected states.

```text
Render the artifact before finalizing. Inspect layout, clipping, spacing,
missing content, and visual consistency. Revise until the rendered output
matches the requirements.
```

### Editing and rewriting

```text
Preserve the requested artifact, length, structure, genre, and factual claims
first. Improve clarity, flow, and correctness without adding new claims,
sections, or a more promotional tone unless requested.
```

### Response length

GPT-5.6 is more concise by default than GPT-5.5, so a broad "be concise" line can make
answers too short. Set the default with `text.verbosity` and use the prompt for what must
survive:

```text
Lead with the conclusion. Include the evidence needed to support it, any material
caveat, and the next action. Omit secondary detail and repetition.

Keep all required facts, decisions, caveats, and next steps. Trim introductions,
repetition, generic reassurance, and optional background first.
```

### Subagents

With the Multi-agent beta (`OpenAI-Beta: responses_multi_agent=v1`), the root agent can
spawn subagents for independent work. The API injects its own orchestration instructions.
Your developer message is added to them and says when to spawn:

```text
Do not spawn subagents unless the user explicitly asks for subagents, delegation, or
parallel agent work.
```

```text
Proactive Multi-agent delegation is active. Use subagents when parallel work would
materially improve speed or quality.
```

Use it when the work splits into independent, bounded tasks. Prefer one agent when each
step depends on the last, the task fits one short run, or agents would contend over the
same mutable resource. With Multi-agent on, `/responses/compact`, `reasoning.summary`, and
`max_tool_calls` are not supported.

### Programmatic Tool Calling

Use it only for a bounded stage where code reduces many tool results to a small structured
result, and say exactly which stage:

```text
Use Programmatic Tool Calling only for the bounded record-reduction stage.
Call only the documented read-only tools. Filter and deduplicate the
intermediate results, then emit exactly the required compact schema with
evidence fields. Retry transient failures at most twice. Use direct tool
calls for approval, semantic judgment, citations, and final validation.
```

## Avoid

- Repeating "ask first", "do not mutate", or "wait for approval". Repetition causes
  approval requests for safe, expected actions.
- ALWAYS, NEVER, must, and only for anything that is not a true invariant. For judgment
  calls, give a decision rule.
- Process instructions for behavior the model already performs reliably, and examples
  that do not change behavior.
- Prescribing every step. Describe the destination and the constraints.
- Labels such as "friendly" or "empathetic". Name the writing choices.
- Universal defaults, keyword maps, and broad shortcuts in place of decision criteria.
- Tools and tool descriptions the task does not need.
- Generic lines such as "use Programmatic Tool Calling efficiently".

## Effort

Reasoning levels are `none`, `low`, `medium` (default), `high`, `xhigh`, `max`.

- `low` for latency-sensitive work when it keeps quality.
- `medium` as the balanced starting point.
- `high` or `xhigh` only when evals show a meaningful gain.
- `max` for the hardest quality-first work, not as a default.

Before raising effort, check whether the prompt is missing a success criterion, a
dependency rule, a tool-routing rule, or a verification loop. When moving a prompt from
GPT-5.5 or GPT-5.4, keep its effort as the baseline and test that level and one lower.
`reasoning.mode: "pro"` in the Responses API gives more model work on difficult tasks at
higher latency, independent of effort.

## Delegation template

```text
Goal:
[The user-visible outcome.]

Success criteria:
[What must be true before the final answer.]

Constraints:
[Scope, evidence, and side-effect limits. What it may do without asking; what needs
confirmation.]

Tools:
[Which tools to use, when, and what not to use. Which source wins on conflict.]

Output:
[Sections, length, format.]

Stop rules:
[When to retry, fall back, abstain, ask, or stop.]
```

## Failure-mode adjustments

- Plans but does not execute: state that the request authorizes the change, using the
  authorization block.
- Asks for routine confirmation: remove repeated approval language and name the safe local
  actions.
- Skips a lookup and acts on an assumption: add the prerequisite block.
- Explores too widely: add the retrieval budget.
- Concludes nothing exists after one empty result: ask for one or two fallbacks first.
- Drifts from research into implementation: name the current layer of work.
- Verification sprawls: name the checks that matter and the stopping condition.
- Answers too short: remove blanket brevity lines and raise `text.verbosity`.
- Weak reasoning: add the missing success criterion or tool-routing rule before raising
  effort.
- Anchors on an outdated approach in a long conversation: set `reasoning.context` to
  `current_turn`.
