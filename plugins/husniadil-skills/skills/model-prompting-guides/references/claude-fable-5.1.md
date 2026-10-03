# Claude Fable 5.1 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Fable 5.1. The
same rules apply to Claude Mythos 5.1.

## Always include

- A completion contract: the task is done when the requested outcome exists, not when a
  plan for it exists.
- An explicit autonomy boundary that names the small set of cases that justify stopping.
- Mandatory retrieval conditions, written as a rule about a class of claims rather than
  "search if needed".
- A batching instruction for independent tool calls in coding and computer-use loops.
- An instruction to ask for progress text during long tool chains. The model's default is
  to go quiet, so a prompt that only suppresses narration makes this worse.

```text
You are operating autonomously. Complete every unblocked part of the task before asking a
question. Stop only for destructive actions or a genuine scope change the user must decide.
Before ending your turn, check the last paragraph: if it is a plan, a question, or a
promise about work you have not done, do that work now instead.
```

```text
First privately list what you need next, then request every independent item in one batch.
Keep only dependent calls sequential.
```

```text
During long tool-calling work, say what you just established and what you are doing next.
Do not narrate routine calls, and do not go silent through a long chain.
```

## Include when applicable

### Research and current facts

```text
When a query centers on a name you do not confidently recognize, or one from a fast-moving
area such as AI models and developer tools, the name itself is what to verify: search
before answering, and include the name as the user wrote it in at least one query.
Familiarity is not a reason to skip the search.
```

### Coding scope

```text
If you find a pre-existing bug, a performance concern, or behavior the task does not
mention, do not fix or extend it in this change unless the requested behavior cannot work
without it. Report it as a follow-up. Commit tests only where the task asks for them or
this repository already keeps tests for this kind of change, sized like neighboring test
files. Implement every behavior the task does ask for, completely.
```

```text
Prefer targeted edits over whole-file rewrites unless the structure of the file makes a
rewrite safer.
```

### Safeguard false positives

A blocked request returns HTTP 200 with `stop_reason: "refusal"`. Three things make that
more likely, and all three show up in delegation prompts:

- Compile-check phrasing. Ask "are there any bugs in this program?" rather than "does this
  program compile without errors?".
- Lesser-known programming languages. Give the model the language's documentation or a
  description of how it works.
- Base64 in tool output. Strip it before it reaches the model's context.

### Quoting retrieved sources

When summarizing documents, Fable 5.1 is more likely than Fable 5 to reproduce source
passages without marking them as quotations. Put one complete example in the system
prompt: the request, a correct response, and a sentence saying why it is correct.

### Formatting in chat

Fable 5.1 formats less than earlier Claude models. Delete inherited anti-formatting blocks
and state when structure is wanted instead.

```text
Use lists and headers when the content is multifaceted enough that they help. In
conversational or emotional exchanges, keep to plain prose.
```

### Writing density

```text
Keep sentences and paragraphs short enough to scan. Avoid mannered prose.
```

### Context compaction

If the conversation will be compacted, tell the model what the summary must keep:
problems and how they were resolved, options raised or set aside, anything decided or
ruled out stated exactly, where things stand, what is still open, and hard-to-reconstruct
specifics such as names, numbers, and exact wording.

### Long deliverables at high effort

```text
Everything in one reply, including reasoning, counts toward a single output limit. Do not
compose the whole deliverable as reasoning and then write it again as the reply. Use the
reasoning space to settle structure and hard decisions, and the output space to write the
output.
```

### Subagents

Let the lead agent keep working while subagents run. Do not write a prompt that makes the
lead stop and wait for each result.

## Avoid

- Instructions that cap or discourage user-facing updates during agentic work.
- "Use tools when helpful" for anything whose correctness depends on retrieval.
- Blanket "test everything" or "expand coverage" wording.
- Reasoning choreography such as "list five hypotheses, then score them" on ordinary
  work. Research agents are the exception: competing hypotheses with tracked confidence
  are recommended for multistep research.

## Effort

Effort levels are `low`, `medium`, `high` (default), `xhigh`, `max`. Thinking is always on.

- `low` calls search and retrieval tools less often. Raise effort for research turns
  rather than adding more prompt text.
- `high` is the safe default for long deliverables. At `xhigh` and `max`, reasoning and
  the reply share one output budget, so long outputs can truncate. Add the single-limit
  note above when that happens.

## Delegation template

```text
Objective:
[One concrete deliverable.]

Scope:
[What changes. What must stay untouched.]

Autonomy:
Make routine reversible decisions yourself. Complete all unblocked work before asking.

Evidence:
[What must be inspected or retrieved before any claim.]

Execution:
Batch independent reads and searches. Keep dependent edits sequential. Report what you
established and what is next as you go.

Done when:
[Observable conditions.]

Return:
[Exact handoff shape the caller needs.]
```

## Failure-mode adjustments

- Silent for minutes: ask for progress text, and check the client renders thinking blocks.
- One tool call per turn: append the batching sentence after each round of tool results.
- Answers from memory: raise effort for those turns, or make the search rule mandatory.
- Stops at a plan: add the last-paragraph check.
- Unrequested fixes or extra test files: add the scope block above.
- Reply truncated on a long deliverable: run at `high`, or add the single-limit note.

## Provenance

Last cross-checked: 2026-09-12. Sourced from the official Claude Fable 5.1 prompting guide
and the cross-model Claude prompting best practices.
