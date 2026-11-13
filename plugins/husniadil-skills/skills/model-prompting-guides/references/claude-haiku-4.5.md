# Claude Haiku 4.5 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Haiku 4.5
(`claude-haiku-4-5`).

Anthropic has no published prompting guide for Haiku 4.5. The model-specific prompting URL
returned 404 when checked on 2026-11-13. This file has two parts. "Documented behavior"
states Anthropic's API and context facts for this model. The rest is cross-model Claude
prompting practice, applied to a model with no published guidance. Treat that part as a
heuristic and check it against your own evals.

## Documented behavior

- Context window 200K tokens. Maximum output 64K tokens.
- Thinking is off unless the request enables it: `thinking: {"type": "enabled", "budget_tokens": N}`.
  `budget_tokens` must be at least 1024 and less than `max_tokens`. Claude Code enables it
  for a Haiku 4.5 subagent by default, with a budget of 31,999 tokens (observed on 2.1.322,
  with user settings excluded). `alwaysThinkingEnabled: false` turns it off.
- `effort` is not supported. A request that sends it returns an error. Thinking depth comes
  from the budget.
- Interleaved thinking is not supported. The model does not think between tool calls.
- Previous thinking blocks are stripped from the history when you pass them back. You do not
  need to strip them yourself.
- Context awareness: the API gives the model its token budget in the system prompt, and
  reports usage after each tool call. The model tracks what remains. You never send these
  tags.
- `temperature`, `top_p`, and `top_k` are accepted until API version `2026-10-21`. On that
  version any value returns a 400 on every model. Don't tune sampling.
- A final assistant turn (prefill) is accepted when thinking is off. Later models reject it,
  so don't build on it.
- Haiku 4.5 does not return the safeguard refusals that Haiku 5.5 does.

## Always include

Write each required behavior as a direct imperative. Add the reason when there is one.

- One concrete outcome, stated as an imperative.
- Required behavior, stated as an imperative.
- Exact tool triggers and what each tool is responsible for. Name what must be inspected
  before an edit.
- An observable done condition.
- A positively stated output format.

```text
Inspect the source file before you make a claim about current behavior.
Retrieve the current value from the tool. Don't answer from memory.
Implement the change with the available tools, then verify it. Don't stop at a suggestion.
```

Use "must" only on a line the subagent skips on your evals. Anthropic documents no need for
it across all lines on this model.

## Include when applicable

### Date for search tools

If the subagent has a search tool, give it today's date in `system` or in the search tool's
description, so answers are grounded in current results. Anthropic tested this on Haiku 5.5,
not on Haiku 4.5, so check it on your evals.

```text
The current date is {{current_date}}.
```

### Analysis-only tasks

```text
Analyze the requested change and recommend an implementation. Do not modify anything.
```

Do not mix this with implementation verbs in the same prompt.

### Scope

```text
Change only [component]. Preserve [invariants]. Do not expand scope unless evidence from an
earlier step requires it.
```

### Examples

Use 3 to 5 varied examples for extraction, classification, or schema-shaped output, wrapped
in tags so they are distinguishable from instructions.

```xml
<examples>
  <example>
    <input>Payment was reversed after settlement.</input>
    <output>{"category":"payment_reversal","needs_review":true}</output>
  </example>
</examples>
```

### Long context

Put documents first and the task instruction last. Wrap each document in its own tag with a
source or id. Do not repeat the bulk of the context inside the instruction.

### Parallelism

```text
Run independent searches, reads, and lookups in parallel. Keep operations sequential when
one result determines the next call. When a required parameter is unknown, obtain it from
context or a prior tool result rather than guessing.
```

### Long-running agent work

Haiku 4.5 tracks its remaining context (see Documented behavior). If the conversation will be
compacted or task state persisted, say so, and say where state goes. The model then knows
how to carry work across the boundary.

```text
This environment may compact conversation context and preserve task state across windows.
Keep making incremental progress until the task is complete. Before a context boundary,
record current state, decisions, open items, and next actions in the mechanism provided.
Do not restart completed work after compaction.
```

### Verification

```text
Verify with the smallest set of checks that directly establish the acceptance criteria. If
a check fails, investigate before finalizing.
```

For extraction: compare every returned field against the source and drop anything not
directly supported. Anthropic reported that Haiku 5.5 skipped checks at `low` and `medium`
effort, so check for the same here.

## Avoid

- Vague triggers: "Use tools if helpful", "check things as needed", "consider making the
  change".
- "Think harder" in place of a thinking budget. Prose like "think thoroughly" can help, but
  the budget is the lever, kept within `max_tokens`. Repeated self-check instructions: one
  line naming the criteria is enough.
- Negative formatting instructions. State the wanted shape.
- Asking for the reasoning as output. Ask for conclusions, evidence, and assumptions. With
  thinking off, asking the model to think the problem through before it answers, and to put
  the answer in tags, is the documented fallback.
- `effort` in the request, and `temperature`, `top_p`, or `top_k` used to tune output.
- A thinking budget below 1024, or one at or above `max_tokens`.
- Budget countdowns or token-budget tags written into the prompt. The API injects its own.

## Effort: thinking budget instead

Haiku 4.5 has no effort levels. Depth comes from the extended-thinking budget. Raise the
budget for multistep work rather than adding "think harder" to the prompt, and keep
`max_tokens` above the budget with room for the reply.

A harness that pins an effort level for a subagent must not send `effort` to Haiku 4.5, or
the request fails. Claude Code drops the field for this model, per this repository's
README. On any other harness, confirm it drops the field before you rely on a pinned-level
agent for this model.

## Delegation template (heuristic)

```text
Task:
[One concrete outcome.]

Context:
The current date is [date]. [Only what is needed.]

Constraints:
[Scope and invariants.]

Tools:
[Exact triggers, and what must be inspected before editing.]

Execution:
Run independent reads in parallel. Keep dependent edits sequential. Make routine reversible
choices yourself.

Done when:
[Observable conditions.]

Return:
[Exact format or schema.]
```

## Failure-mode adjustments

- Stops at a recommendation: write the required behavior as an imperative.
- Retrieval skipped: make the tool call mandatory for that class of claim.
- Scope grows: name the affected component and the invariants.
- Output shape drifts: supply a schema plus several aligned examples, and say the format
  applies to every item.
- Wraps up early in a long session: say whether the environment compacts context or
  persists state, and where state goes. Test before adding more.
- Reports a change done without a check: add the verification block.
- Expects reasoning between tool calls: Haiku 4.5 does not support interleaved thinking.
  Split the step, or let the next turn carry the reasoning.
- 400 on `effort`: remove the field. Haiku 4.5 does not take it.
- 400 on sampling parameters: remove them.

## Provenance

Last cross-checked: 2026-11-13. Sources:

- Haiku 4.5 prompting page:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-4-5
  Returned 404 on 2026-11-13. No model-specific guidance exists at this URL.
- Context windows:
  https://platform.claude.com/docs/en/build-with-claude/context-windows
  Fetched 2026-11-13. Source of the 200K window, thinking-block stripping, the lack of
  interleaved thinking, and context awareness.
- Migrating to Claude Haiku 5.5 (copy bundled with the claude-api skill, read 2026-11-13):
  source of the 64K maximum output, the `effort` error, the budget minimum and the
  `max_tokens` rule, the sampling-parameter change on API version `2026-10-21`, and the
  prefill and refusal differences from Haiku 5.5.
- Prompting best practices, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  Confirms the analysis-only block (its conservative-action sample), scope, examples (3 to 5,
  in tags), long-context placement and source tags, parallelism, the context-awareness sample
  for Haiku 4.5, the self-check line, and positive format wording. Its "think thoroughly" and
  manual chain-of-thought advice changed two Avoid bullets. The delegation template and the
  vague-trigger bullet are not covered by the page and stay heuristics.
