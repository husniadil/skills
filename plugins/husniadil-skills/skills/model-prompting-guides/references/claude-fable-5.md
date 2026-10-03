# Claude Fable 5 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Fable 5. The same
rules apply to Claude Mythos 5.

## Always include

- A completion contract: the task is done when the requested outcome exists, not when a
  plan for it exists.
- A checkpoint rule that names the small set of cases that justify stopping. One sentence
  is enough; the model does not need every case enumerated.
- A scope boundary against unrequested cleanup, refactoring, and abstraction. This matters
  most at higher effort.
- A progress-grounding rule for long runs, so status reports point at tool results.
- The reason behind the request, not only the request.

```text
Pause for the user only when the work genuinely requires them: a destructive or
irreversible action, a real scope change, or input that only they can provide. If you hit
one of these, ask and end the turn, rather than ending on a promise.
```

```text
Don't add features, refactor, or introduce abstractions beyond what the task requires. A
bug fix doesn't need surrounding cleanup and a one-shot operation usually doesn't need a
helper. Don't design for hypothetical future requirements: do the simplest thing that
works well. Don't add error handling, fallbacks, or validation for scenarios that cannot
happen. Only validate at system boundaries. Don't use feature flags or
backwards-compatibility shims when you can just change the code.
```

```text
Before reporting progress, audit each claim against a tool result from this session. Only
report work you can point to evidence for; if something is not yet verified, say so
explicitly. Report outcomes faithfully: if tests fail, say so with the output; if a step
was skipped, say that; when something is done and verified, state it plainly without
hedging.
```

```text
I'm working on [the larger task] for [who it's for]. They need [what the output enables].
With that in mind: [request].
```

## Include when applicable

### Overplanning on ambiguous tasks

```text
When you have enough information to act, act. Do not re-derive facts already established
in the conversation, re-litigate a decision the user has already made, or narrate options
you will not pursue in user-facing messages. If you are weighing a choice, give a
recommendation, not an exhaustive survey. This does not apply to thinking blocks.
```

### Assessment-only requests

```text
When the user is describing a problem, asking a question, or thinking out loud rather
than requesting a change, the deliverable is your assessment. Report your findings and
stop. Don't apply a fix until they ask for one. Before running a command that changes
system state, check that the evidence actually supports that specific action. A signal
that pattern-matches to a known failure may have a different cause.
```

### Response length

A short brevity instruction works as well as listing each verbose pattern by name.

```text
Lead with the outcome. Your first sentence after finishing should answer "what happened"
or "what did you find". Supporting detail and reasoning come after. Keep output short by
being selective about what you include, not by compressing the writing into fragments,
abbreviations, arrow chains, or jargon.
```

### Final summary after long agentic work

```text
Terse shorthand is fine between tool calls. Your final summary is different: it is for a
reader who did not see any of that. Write it as a re-grounding, not a continuation of
your working thread: the outcome first, then the one or two things you need from them.
Drop the working shorthand. Write complete sentences. Spell out terms. Don't use arrow
chains, hyphen-stacked compounds, or labels you made up earlier. When you mention files,
commits, flags, or other identifiers, give each one its own plain-language clause.
```

### Autonomous pipelines

Deep into a long session the model can end a turn with a statement of intent without
issuing the tool call, or ask permission it does not need. Add this as a system reminder:

```text
You are operating autonomously. The user is not watching in real time and cannot answer
questions mid-task, so asking "Want me to…?" or "Shall I…?" will block the work. For
reversible actions that follow from the original request, proceed without asking. Before
ending your turn, check your last paragraph. If it is a plan, an analysis, a question, a
list of next steps, or a promise about work you have not done, do that work now with tool
calls. End your turn only when the task is complete or you are blocked on input only the
user can provide.
```

### Long sessions

If the model can see a remaining-context count, it may suggest a new session or trim its
own work. Avoid surfacing the count. If it must be shown:

```text
You have ample context remaining. Do not stop, summarize, or suggest a new session on
account of context limits. Continue the work.
```

### Subagents

Fable 5 dispatches parallel subagents readily and sustains them well. Say when delegation
is appropriate, and prefer long-lived subagents that keep context across subtasks.

```text
Delegate independent subtasks to subagents and keep working while they run. Intervene if
a subagent goes off track or is missing relevant context.
```

For long builds, fresh-context verifier subagents outperform self-critique:

```text
Establish a method for checking your own work at an interval of [X] as you build. Run it
every [X], verifying your work with subagents against the specification.
```

### Memory across runs

Fable 5 improves when it can record and reread lessons. A Markdown directory is enough.

```text
Store one lesson per file with a one-line summary at the top. Record corrections and
confirmed approaches alike, including why they mattered. Don't save what the repo or chat
history already records; update an existing note rather than creating a duplicate; delete
notes that turn out to be wrong.
```

### Verbatim messages mid-task

If the agent has a send-to-user tool, it rarely calls it without an instruction:

```text
Between tool calls, when you have content the user must read verbatim (a partial
deliverable, a direct answer to their question), call the send_to_user tool with that
content. Use it only for user-facing content, not for narration or reasoning.
```

### Safeguard false positives

Fable 5 runs classifiers for offensive cybersecurity, biology and life sciences, and
extraction of its own reasoning. Benign work in those areas can trigger a refusal. Do not
ask the model to echo, transcribe, or explain its internal reasoning as response text;
that alone can trigger the reasoning-extraction refusal.

## Avoid

- Enumerating every behavior to steer. One brief instruction works; long lists do not add
  to it.
- Prescriptive step-by-step skills written for earlier models. They degrade output. Remove
  older instructions when default behavior is already better.
- "Show your thinking" or "reflect on your reasoning" instructions.
- Showing a remaining-token countdown to the model.
- Making the orchestrator block on each subagent before continuing.

## Effort

Effort levels are `low`, `medium`, `high` (default), `xhigh`, `max`. Thinking is always on.

- `high` for most tasks. `xhigh` for the most capability-sensitive work. `medium` or
  `low` for routine work; they still perform well on Fable 5.
- Higher effort gathers more context and deliberates longer on routine work, and is where
  unrequested tidying shows up. Lower effort if a task completes but takes longer than it
  should, or add the scope block above.
- Individual turns at higher effort can run many minutes on hard tasks.

## Delegation template

```text
Objective:
[One concrete deliverable, and why it is needed.]

Scope:
[What changes. What must stay untouched. No cleanup or refactoring beyond the task.]

Autonomy:
Proceed on reversible work. Pause only for a destructive or irreversible action, a real
scope change, or input only the user can provide.

Evidence:
[What must be inspected or retrieved before any claim.]

Execution:
Delegate independent subtasks and keep working while they run. Audit progress claims
against tool results before reporting them.

Done when:
[Observable conditions.]

Return:
Outcome first, in complete sentences, then supporting detail and open items.
```

## Failure-mode adjustments

- Ends on "I'll now run X" without running it: add the autonomous-pipeline reminder.
- Asks permission it does not need: add the checkpoint sentence.
- Unrequested refactoring or abstractions: add the scope block, or lower effort.
- Fabricated or optimistic status: add the progress-grounding block.
- Suggests a new session or hands off early: hide the context count, or add the reassurance.
- Dense, hard-to-read final message: add the final-summary block.
- Overplans an ambiguous task: add the "when you have enough information to act" block.
- Refusal on benign work: remove reasoning-echo instructions; route the rest to fallback.

## Provenance

Last cross-checked: 2026-09-12. Sourced from the official Claude Fable 5 prompting guide
(platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5)
and the cross-model Claude prompting best practices.
