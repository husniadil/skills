# Claude Fable 5 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Fable 5
(`claude-fable-5`). The same rules apply to Claude Mythos 5 (`claude-mythos-5`), which is
offered only to verified organizations for defensive cybersecurity work. Claude Fable 5.1
and Claude Fable 5.2 succeed it: use [claude-fable-5.2.md](claude-fable-5.2.md) for
`claude-fable-5-2` and [claude-fable-5.1.md](claude-fable-5.1.md) for `claude-fable-5-1`.
This file stays for agents still running Fable 5.

Fable 5 follows instructions closely enough that one brief instruction steers a behavior
as well as a list of every case.

What the API does on this model, which decides what a prompt can rely on:

- Adaptive thinking is always on. `thinking: {"type": "disabled"}` and `budget_tokens`
  return a 400. Effort controls thinking depth, and its default is `high`.
- An assistant prefill returns a 400, and so do the sampling parameters (`temperature`,
  `top_p`, `top_k`). Forced `tool_choice` (`any` or `tool`) still works on Fable 5, unlike
  Fable 5.1 and 5.2.
- Fable 5 does not run the prefix check on thinking blocks, so a harness that edits
  earlier turns does not fail here. It will on Fable 5.1 and 5.2.
- The updates the model writes between tool calls come back as `thinking` blocks, which
  are empty at the default `display: "omitted"`.
- Safety classifiers target offensive cybersecurity, biology and life sciences, and
  extraction of the model's thinking. A declined request returns
  `stop_reason: "refusal"`.

In Claude Code the task prompt reaches the subagent as its first user message. Text that
Anthropic says to put in a system prompt goes at the top of the task prompt, or in the
agent definition when you control one.

## Always include

- The reason behind the request, not only the request. The model connects the task to
  relevant information instead of guessing the intent.
- A checkpoint rule that names the few cases that justify stopping. One sentence is
  enough.
- The final outcome and an observable done condition.
- For coding work at `high` effort and above, a scope boundary against unrequested
  cleanup, refactoring and abstraction. Higher effort is where the tidying shows up.

```text
I'm working on [the larger task] for [who it's for]. They need [what the output enables].
With that in mind: [request].
```

```text
Pause for the user only when the work genuinely requires them: a destructive or
irreversible action, a real scope change, or input that only they can provide. If you hit
one of these, ask and end the turn, rather than ending on a promise.
```

```text
Don't add features, refactor, or introduce abstractions beyond what the task requires. A
bug fix doesn't need surrounding cleanup and a one-shot operation usually doesn't need a
helper. Don't design for hypothetical future requirements: do the simplest thing that
works well. Avoid premature abstraction and half-finished implementations. Don't add error
handling, fallbacks, or validation for scenarios that cannot happen. Trust internal code
and framework guarantees. Only validate at system boundaries (user input, external APIs).
Don't use feature flags or backwards-compatibility shims when you can just change the
code.
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

Fable 5 can take actions nobody asked for, such as drafting an email or creating a backup
git branch. When the subagent should report rather than change things:

```text
When the user is describing a problem, asking a question, or thinking out loud rather than
requesting a change, the deliverable is your assessment. Report your findings and stop.
Don't apply a fix until they ask for one. Before running a command that changes system
state (restarts, deletes, config edits), check that the evidence actually supports that
specific action. A signal that pattern-matches to a known failure may have a different
cause.
```

### Response length

Un-steered, especially at higher effort, the model surveys options it won't pursue,
explains root causes at length, and writes heavily structured PR descriptions. A short
instruction works as well as naming each pattern:

```text
Lead with the outcome. Your first sentence after finishing should answer "what happened"
or "what did you find": the thing the user would ask for if they said "just give me the
TLDR." Supporting detail and reasoning come after. Being readable and being concise are
different things, and readability matters more.

The way to keep output short is to be selective about what you include (drop details that
don't change what the reader would do next), not to compress the writing into fragments,
abbreviations, arrow chains like A -> B -> fails, or jargon.
```

### Final summary after long agentic work

After many tool calls the model can write dense shorthand, deep implementation detail, and
references to thinking the reader never saw:

```text
Terse shorthand is fine between tool calls. Your final summary is different: it's for a
reader who didn't see any of that.

If you've been working for a while without the user watching (overnight, across many tool
calls, since they last spoke), your final message is their first look at any of it. Write
it as a re-grounding, not a continuation of your working thread: the outcome first, then
the one or two things you need from them, each explained as if new. The vocabulary you
built up while working is yours, not theirs; leave it behind unless you re-introduce it.

When you write the summary at the end, drop the working shorthand. Write complete
sentences. Spell out terms. Don't use arrow chains, hyphen-stacked compounds, or labels you
made up earlier. When you mention files, commits, flags, or other identifiers, give each
one its own plain-language clause. Open with the outcome: one sentence on what happened or
what you found. Then the supporting detail. If you have to choose between short and clear,
choose clear.
```

### Progress claims on long runs

In Anthropic's testing this nearly eliminated fabricated status reports, even on tasks
designed to elicit them:

```text
Before reporting progress, audit each claim against a tool result from this session. Only
report work you can point to evidence for; if something is not yet verified, say so
explicitly. Report outcomes faithfully: if tests fail, say so with the output; if a step
was skipped, say that; when something is done and verified, state it plainly without
hedging.
```

### Autonomous pipelines

Deep into a long session the model can end a turn on a statement of intent ("I'll now run
X") without the tool call, or ask permission it does not need. Pair the checkpoint rule
with this reminder:

```text
You are operating autonomously. The user is not watching in real time and cannot answer
questions mid-task, so asking "Want me to...?" or "Shall I...?" will block the work. For
reversible actions that follow from the original request, proceed without asking. Offering
follow-ups after the task is done is fine; asking permission after already discussing with
the user before doing the work is not. Before ending your turn, check your last paragraph.
If it is a plan, an analysis, a question, a list of next steps, or a promise about work you
have not done ("I'll...", "let me know when..."), do that work now with tool calls. End
your turn only when the task is complete or you are blocked on input only the user can
provide.
```

### Long sessions

If the model sees a remaining-context count, it may suggest a new session, offer to hand
off, or trim its own work. Hide the count where possible. If it must be shown:

```text
You have ample context remaining. Do not stop, summarize, or suggest a new session on
account of context limits. Continue the work.
```

### Subagents

If the subagent you are briefing can spawn its own: Fable 5 dispatches and sustains
parallel subagents readily. Say when delegation fits, and prefer long-lived subagents that
report asynchronously over blocking on each one. They keep their context, save cache reads,
and avoid waiting on the slowest one.

```text
Delegate independent subtasks to subagents and keep working while they run. Intervene if a
subagent goes off track or is missing relevant context.
```

For long builds, fresh-context verifier subagents outperform self-critique:

```text
Establish a method for checking your own work at an interval of [X] as you build. Run this
every [X interval], verifying your work with subagents against the specification.
```

### Memory across runs

Fable 5 improves when it can record lessons and reread them. A Markdown file is enough:

```text
Store one lesson per file with a one-line summary at the top. Record corrections and
confirmed approaches alike, including why they mattered. Don't save what the repo or chat
history already records; update an existing note rather than creating a duplicate; delete
notes that turn out to be wrong.
```

### Verbatim messages mid-task

For a long asynchronous agent that must show the user something exactly as written before
it finishes, define a `send_to_user` tool whose input your UI renders, and return a short
acknowledgement as its result. Without an instruction the model rarely calls it:

```text
Between tool calls, when you have content the user must read verbatim (a partial
deliverable, a direct answer to their question), call the send_to_user tool with that
content. Use send_to_user only for user-facing content, not for narration or reasoning.
```

### Safeguard refusals

Benign security and life-sciences work can trigger a refusal. Do not ask the model to echo,
transcribe or explain its internal reasoning as response text, which can trigger the
`reasoning_extraction` refusal. `fallbacks: "default"` does not retry that category. For
other categories, configure server-side or client-side fallback to Opus 4.8.

## Avoid

- Lists that name every behavior to steer. One brief instruction works as well.
- Prescriptive step-by-step skills and prompts written for earlier models. They can degrade
  output. Remove older instructions where default behavior is better.
- "Show your thinking" or "reflect on your reasoning" in the response. Read the `thinking`
  blocks with `display: "summarized"` instead.
- A remaining-token countdown shown to the model.
- Making the orchestrator block on each subagent before continuing.
- `thinking` set to `disabled` or with `budget_tokens`, an assistant prefill, and sampling
  parameters. Each returns a 400.

## Effort

Effort levels are `low`, `medium`, `high` (default), `xhigh`, `max`.

- `high` for most tasks, `xhigh` for the most capability-sensitive work, `medium` or `low`
  for routine work. Lower levels still perform well and often beat `xhigh` on earlier
  models.
- Higher effort gathers more context and deliberates longer on routine work, and is where
  unrequested tidying shows up. If a task completes but takes longer than it should, lower
  effort or add the scope block.
- Higher effort also gives the most thorough verification and the most rigorous output.
- Individual turns at higher effort can run many minutes on hard tasks, and autonomous runs
  for hours. Size client timeouts and streaming for that.
- Per-message effort is not available on Fable 5. A request that sends it returns a 400.

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

Done when:
[Observable conditions.]

Return:
Outcome first, in complete sentences, then supporting detail and open items. Report only
work you can point to a tool result for.
```

## Failure-mode adjustments

- Ends on "I'll now run X" without running it: add the autonomous-pipeline reminder.
- Asks permission it does not need: add the checkpoint sentence.
- Unrequested refactoring or abstractions: add the scope block, or lower effort.
- Unrequested actions on a question or bug report: add the assessment-only block.
- Fabricated or optimistic status: add the progress-claims block.
- Suggests a new session or hands off early: hide the context count, or add the
  reassurance.
- Dense, hard-to-read final message: add the final-summary block.
- Long replies: add the response-length block.
- Overplans an ambiguous task: add the "when you have enough information to act" block.
- `refusal` with `reasoning_extraction`: remove reasoning-echo instructions. Route other
  categories to a fallback.
- 400 on `thinking`, a prefill or a sampling parameter: remove the field.
