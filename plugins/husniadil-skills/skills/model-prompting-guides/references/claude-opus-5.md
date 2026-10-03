# Claude Opus 5 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Opus 5.

## Always include

- The final outcome and an observable done condition.
- Authority over routine reversible decisions, with a narrow list of stop conditions.
- An explicit scope boundary for narrow tasks. Opus 5 otherwise adds steps that were not
  requested.
- A conciseness instruction if visible response length matters. Lowering effort reduces
  thinking, not the length of what the model says.

```text
Deliver what was asked, at the scope intended. Make routine judgment calls yourself, and
check in only when different readings of the request would lead to materially different
work. If the request seems mistaken, say so in a sentence and continue with the task as
asked rather than quietly narrowing, widening, or transforming it. Finish the whole task,
and stop short of actions clearly beyond it.
```

```text
Keep responses focused and brief. Keep caveats short and spend most of the response on the
main answer.
```

## Include when applicable

### Agentic narration

Opus 5 narrates readily during agentic work, announcing what it is about to do, and its
per-message output in agentic sessions is often longer than prior models'. Describe the cadence
you want rather than banning narration:

```text
Before your first tool call, say in one sentence what you're about to do. While working,
give a brief update only when you find something important or change direction. When you
finish, lead with the outcome: your first sentence should answer what happened or what you
found, with supporting detail after it.
```

### Written deliverables

```text
Match the length of written documents to what the task needs. Do not pad with filler
sections, redundant summaries, or boilerplate.
```

### Subagent delegation

```text
Delegate only for large tasks that are genuinely independent and parallelizable, such as a
wide multi-file investigation. Do not delegate work you can finish in a handful of tool
calls, and do not use subagents to verify your own work. If one subagent is enough, use
one.
```

### Correction narration

```text
Only correct an earlier statement when the error would change the user's code,
conclusions, or decisions. State corrections plainly and briefly, then continue. For slips
that change nothing, fix and move on.
```

### Code review

Opus 5 follows a stated bar literally. If a review prompt says "only high severity" or "be
conservative", it reports less.

```text
Report every issue you find, including low-severity and uncertain ones. Do not filter for
importance at this stage. Include a confidence level and estimated severity so a
downstream pass can rank them.
```

### Evidence hierarchy

```text
Inspect the implementation and its tests for code behavior. Retrieve current sources for
facts that change over time. Use secondary summaries only to locate primary material.
```

### Parallel work

```text
Run independent reads, searches, and analyses in parallel. Keep dependent decisions and
mutations sequential.
```

## Avoid

- Verification scaffolding. Opus 5 already verifies and self-corrects. "Include a final
  verification step", "double-check your answer", and "use a subagent to verify" cost
  tokens without improving results. Name a concrete acceptance check instead when one is
  genuinely required.
- Reasoning choreography such as "generate five hypotheses, then score them" on ordinary
  work. Research agents are the exception: competing hypotheses with tracked confidence
  are recommended for multistep research.
- Duplicated rules restated in slightly different wording across prompt sections.
- Instructions telling the model not to think or not to reason. They increase leakage of
  internal tags.

## Effort

Effort levels are `low`, `medium`, `high` (default), `xhigh`, `max`. Lowering effort
reduces thinking, not the length of what the model says; prompt for concision separately.

- `low` and `medium` are the primary cost control wherever quality holds. Prefer thinking
  on at `low` over thinking off at similar cost.
- Thinking can be disabled only at `high` or below. If it must stay disabled, add the
  tool-call sentence below, because the model can occasionally write a tool call as visible
  text or emit internal XML tags.

```text
When you use a tool, you may say a brief sentence first. If no tool can express what the
user asked for, say so instead of guessing. Do not include internal or system XML tags in
your response.
```

## Delegation template

```text
Objective:
[One concrete deliverable.]

Scope:
[Exactly what is in scope. What must remain untouched.]

Autonomy:
Resolve routine reversible choices yourself. Stop only for an irreversible action that
lacks authorization or a fork that changes the user-visible result.

Evidence:
[Primary sources that must be inspected before any claim.]

Execution:
Run independent work in parallel. Keep dependent steps sequential.

Done when:
[Observable conditions.]

Return:
[Result first, then the decisions, the checks that were run, and open risks.]
```

## Failure-mode adjustments

- Scope creep: add the scope block above.
- Over-verification or repeated re-checking: delete the verification instructions in the
  prompt rather than adding a stopping rule on top of them.
- Too many subagents: add the delegation rule above.
- Long visible responses: prompt for concision directly, and repeat one short reminder near
  the end of a long system prompt.
- Too much narration during agentic work: give the cadence block above rather than a ban.
- Low review recall: remove the severity filter from the finding stage.

## Provenance

Last cross-checked: 2026-09-12. Sourced from the official Claude Opus 5 prompting guide and
the cross-model Claude prompting best practices.
