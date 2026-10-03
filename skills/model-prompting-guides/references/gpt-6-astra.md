# GPT-6 Astra prompting guide

Rules for writing a task prompt for an agent or subagent running GPT-6 Astra.

## Always include

- Permission to act. Astra asks for clarification more readily than earlier models when
  requirements are ambiguous.
- A statement that the user's current task outranks generic skill and instruction-file
  guidance at the same layer.
- A concrete done condition.
- The return format the caller needs.

```text
Infer the user's intent and task scope from the instructions and prior context. Bias
towards action and carry the intended task to completion. Treat requests such as "can
you...", "I want to...", and "help me..." as instructions to do the work. Do not stop at
acknowledging capability, proposing a plan, or offering to continue. Proceed autonomously
unless an action is clearly destructive or irreversible.
```

```text
Complete the work already authorized before asking clarifying questions. When approval is
needed, the user should be approving a concrete, reviewable result. Do not introduce
unsolicited warnings, disclaimers, approval flows, or safety checklists.
```

```text
The user's instructions take precedence over guidance provided in a skill.
```

## Include when applicable

### Debugging an unexpected pause

Astra follows `AGENTS.md`, skills, and other instruction files strongly, so audit the
instruction files and skills the model can reach before blaming the prompt. When one
derails the task:

```text
Name and link the exact SKILL.md or instruction file you read, quote the relevant
instruction, and explain how it applied. Distinguish an explicit requirement from your
interpretation of it.
```

### Non-blocking questions

Astra asks non-blocking questions while it works by default. Tune that to the autonomy the
product wants rather than leaving it at the default.

### Delegation

Astra delegates less often than wanted.

```text
If you can parallelize work by delegating to another agent, do so using the collaboration
tools.
```

### Testing

```text
Do not write tests for reversible, low-impact changes that mirror the implementation. Run
the tests appropriate to the change and complete required checks. Broaden or repeat testing
only when new changes, failures, or unresolved concerns justify it.
```

### Writing style

```text
Use clear, concise paragraphs, each developing one main idea. Use lists only when the
information is genuinely parallel or sequential. Use plain language, concrete examples, and
precise verbs. Prefer active voice. State the main point early.
```

Avoid stock phrases, vague qualifiers, invented labels, and contrastive framing that
introduces an alternative nobody asked about.

## Avoid

- Leaving autonomy implicit. Silence produces approval requests.
- Reasoning choreography and repeated "reflect" or "double-check" directives. Heuristic:
  the Astra page does not say this; the family guidance says to describe the destination
  rather than prescribe steps, and to drop process instructions for behavior the model
  already performs reliably.
- Blanket "add tests" rules on small reversible changes.
- Duplicated rules spread across skills, memory, and system prompt with slightly different
  wording.

## Effort

Reasoning levels are `low`, `medium`, `high`, `xhigh`, `max`. `none` is not supported;
migrating from `none` or `minimal` starts at `low`.

## Delegation template

```text
Objective:
[One concrete deliverable.]

Authority:
This task outranks generic guidance in skills and instruction files. Proceed autonomously
on reversible work; stop only for a destructive or irreversible step.

Scope:
[In scope. Untouched.]

Evidence:
[What must be read or retrieved before any claim.]

Execution:
Persist until the outcome exists. Parallelize independent work; keep dependent steps
sequential.

Done when:
[Observable conditions.]

Return:
[Conclusion, evidence, open uncertainty, recommended next step.]
```

## Failure-mode adjustments

- Asks before starting: add the initiative and follow-through block.
- Stops at a plan: define the done condition as an artifact, not an effort level.
- A skill hijacks the task: state precedence, then ask for the file-and-quote explanation.
- Test scope balloons on a small change: add the testing rule.
- Overformatted output: give the style block.

## Provenance

Last cross-checked: 2026-09-12. Sourced from the official OpenAI model guidance for GPT-6
Astra and the GPT-6 Astra model page. Guidance for other GPT-6 models is not covered here.
