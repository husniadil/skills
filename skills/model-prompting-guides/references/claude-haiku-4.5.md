# Claude Haiku 4.5 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Haiku 4.5.

Anthropic does not publish a model-specific prompting guide for Haiku 4.5. One documented
model-specific behavior is covered here: Haiku 4.5 tracks its remaining context. Everything
else is the cross-model Claude prompting best practices applied to a compact model, and is a
heuristic to validate against your own evals rather than published model-specific behavior.

## Always include

- One concrete outcome, stated with an action verb.
- Explicit mandatory behavior. Advisory wording produces advice.
- Exact tool triggers and what each tool is responsible for.
- An observable done condition.
- A positively stated output format.

```text
You must inspect the source file before making a claim about current behavior.
You must retrieve the current value; do not answer from memory.
Implement the change with the available tools and verify it. Do not stop at a suggestion.
```

```text
Use repository inspection for current implementation behavior. Use external retrieval for
time-sensitive or externally defined facts. Use execution tools when static inspection
cannot establish the behavior.
```

## Include when applicable

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

Haiku 4.5 tracks its remaining context. If the conversation will be compacted or task state
persisted, say so, otherwise the model may start wrapping up early.

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
directly supported.

## Avoid

- "Use tools if helpful", "check things as needed", "consider making the change".
- "Think harder" and repeated self-check instructions. Raise the thinking budget instead.
- Negative formatting instructions. State the wanted shape.
- Requests for hidden chain-of-thought. Ask for conclusions, evidence, and assumptions.

## Effort

Haiku 4.5 has no effort levels. Reasoning depth comes from the extended-thinking budget.
Raise that budget for multistep work rather than adding "think harder" to the prompt.

## Delegation template

```text
Task:
[One concrete outcome.]

Context:
[Only what is needed.]

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

- Stops at a recommendation: replace advisory verbs with action verbs.
- Retrieval skipped: make the tool call mandatory for that class of claim.
- Scope grows: name the affected component and the invariants.
- Output shape drifts: supply a schema plus several aligned examples, and say the format
  applies to every item.
- Wraps up early in a long session: describe the compaction or state mechanism.

## Provenance

Last cross-checked: 2026-09-12. Sourced from the cross-model Claude prompting best
practices and the documented Haiku 4.5 context-awareness behavior. No dedicated Haiku 4.5
prompting page exists.
