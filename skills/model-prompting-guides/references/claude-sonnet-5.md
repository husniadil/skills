# Claude Sonnet 5 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Sonnet 5.

## Always include

- Explicit scope for every global rule. Sonnet 5 reads instructions literally and does not
  generalize a rule shown on one item to the rest.
- Concrete tool triggers instead of "use tools when helpful".
- Observable acceptance criteria.
- An exact output contract when the result is consumed by another agent or a parser.

```text
Apply this rule to every affected file, section, and item. The example illustrates the
rule; it does not limit its scope.
```

```text
Use web search for current facts, unfamiliar named entities, and claims whose correctness
depends on recent information. Inspect the repository before answering questions about
implementation details that can be verified locally.
```

## Include when applicable

### Autonomy

```text
Make routine reversible decisions yourself. Ask only when missing information materially
changes the result, when the user must choose between meaningfully different outcomes, or
before an irreversible external action that lacks authorization.
```

```text
When the user requests work, perform the work. Do not stop after explaining a plan when the
task can be completed with the available context and tools.
```

### Structured output

```text
Return JSON only, matching this schema. Do not add keys outside it and do not wrap it in
Markdown. The schema applies to every element.
```

### Code review

Sonnet 5 honors a stated severity bar, so a conservative prompt lowers recall even when the
bugs were found.

```text
Report every issue you find, including uncertain and low-severity ones. Do not filter for
importance here; a separate pass will rank them. Include confidence and estimated severity
per finding.
```

If a single pass must self-filter, define the bar concretely: report anything that could
cause incorrect behavior, a test failure, or a misleading result, and omit pure style nits.

### Design and frontend work

Generic aesthetic direction moves the model to a different fixed default. Either specify a
concrete system (palette hex values, type, spacing, radius, motion, layout), or ask for
distinct options first and implement only the chosen one.

### Steering adaptive thinking

Thinking triggers more often under large or complex system prompts. It is promptable in
both directions:

```text
Thinking adds latency and should only be used when it will meaningfully improve answer
quality, typically for problems that require multistep reasoning. When in doubt, respond
directly.
```

### Interactive coding products

Specify the task, intent, and constraints in the first turn. Ambiguous prompts spread over
several user turns reduce token efficiency and sometimes performance, so a fully specified
first turn beats a conversation that fills the gaps later.

### Verification

```text
Run the smallest set of checks that establishes correctness for the changed behavior.
Broaden only when a check fails or the change crosses a boundary.
```

### Low effort

If effort must stay low on a multistep task:

```text
This task involves multistep reasoning. Work through the problem before responding.
```

## Avoid

- Interim-status scaffolding such as "summarize progress after every 3 tool calls". Sonnet 5
  already provides regular updates during long traces.
- Piling on "think harder" or repeated self-check instructions. Raise effort instead.
- Relying on sampling parameters for tone or variety.
- Negative-only style instruction. Positive examples of the wanted voice work better.

## Effort

Effort levels are `low`, `medium`, `high` (default), `xhigh`, `max`. Use `xhigh` for the
hardest coding and agentic work. Adaptive thinking is on by default and can be steered in
the prompt (see "Steering adaptive thinking" above).

- With thinking disabled, the model reaches for tools less readily. Add an explicit tool
  nudge if the workload depends on tool calls.
- If effort must stay low on a multistep task, add the "Low effort" sentence above.

## Delegation template

```text
Objective:
[One concrete deliverable.]

Scope:
[In scope. Out of scope. Which rules are global.]

Tool policy:
[Exact conditions that require each tool.]

Execution:
Complete all unblocked work before asking a question. Apply every stated constraint to
every affected file.

Done when:
[Observable conditions.]

Return:
[Exact format, including schema if machine-read.]
```

## Failure-mode adjustments

- A rule applied only to the first item: mark the rule global in words.
- Inconsistent tool use: replace optional wording with a trigger condition.
- Shallow work on a hard task: raise effort to `high` or `xhigh`.
- Truncated answer: drop effort to `medium` so reasoning leaves room for the reply.
- Over-explaining: give a measurable output contract, such as 3 to 5 bullets of at most two
  sentences each.

## Provenance

Last cross-checked: 2026-09-12. Sourced from the official Claude Sonnet 5 prompting guide
and the cross-model Claude prompting best practices.
