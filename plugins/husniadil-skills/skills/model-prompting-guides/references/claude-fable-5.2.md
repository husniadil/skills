# Claude Fable 5.2 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Fable 5.2
(`claude-fable-5-2`). The same rules apply to Claude Mythos 5.2 (`claude-mythos-5-2`), which
has the same capabilities and is offered only to organizations verified through Anthropic's
verification programs.

Fable 5.2 follows what its prompt and its carried context say more closely than Fable 5.1
does. A line that limits, warns, delegates or sets a style is applied as written, so write
each one with its scope.

What the API does on this model, which decides what a prompt can rely on:

- Adaptive thinking is always on. `thinking: {"type": "disabled"}` and `budget_tokens`
  return a 400. Effort is the only control on thinking depth, and its default is `high`.
- Thinking counts toward `max_tokens`. A prompt line asking the model to think less does
  not stop it from thinking at `medium` and above, so a request sized on such a line can
  end after a thinking block with no text.
- `tool_choice` of `any` or `tool` returns a 400. So do an assistant prefill and the
  sampling parameters (`temperature`, `top_p`, `top_k`).
- The prefix check applies on every account. A request that sends thinking blocks back
  after `system`, `tools` or an earlier message changed returns a 400 with "The block is
  bound to a different conversation".
- Only Fable 5.2 and Mythos 5.2 read Fable 5.2 thinking blocks. A fallback or a switch to
  any other model, Fable 5.1 and Opus 5.5 included, runs without that reasoning.
- The updates the model writes between tool calls come back as progress-update `thinking`
  blocks, which are empty at the default `display: "omitted"`.
- Safety classifiers can decline a request with `stop_reason: "refusal"`.

In Claude Code the task prompt reaches the subagent as its first user message. Text that
Anthropic says to put in a system prompt goes at the top of the task prompt, or in the
agent definition when you control one.

## Always include

- For multistep agentic work at `low` or `medium` effort, the finishing-work block below.
  It separates ordinary obstacles, which the agent diagnoses and works through, from
  deliberate blockers, which it leaves alone and reports. At those levels the model ends
  turns early more often: a list of what remains, an offer to continue, or a stop at a
  timeout. At `high` and above, add it only after you see such stops, since it costs about
  30 percent more output tokens.
- The actions that still need a go-ahead, named exactly. With the finishing-work block the
  model asks less often, so keep your own confirmation step for risky or irreversible
  actions.
- For coding work, who owns the code (see Code ownership). Saying nothing makes the model
  treat the code as someone else's.

```text
# Finishing work
Please avoid stopping while you still owe work the user asked for. Be persistent and do not
stop unless needed.

While status notes are welcome, as is clarifying with the user on open decisions, carry on
with work that does not depend on the user's answer without unnecessary stops.

If you notice yourself inviting the user to redirect you or offering to wait, instead
proceed on the next part of the task. You may meet ordinary obstacles like errors,
timeouts, locked files, empty results or failing tools. Diagnose them first, and when they
are not real blockers, work through them with the access you have (wait and retry, fix the
request, use another tool or source) rather than stopping unnecessarily.

If someone clearly decided something is a hard blocker, such as a file marked not to be
touched, access that was intentionally withheld, or a safety guardrail, leave it alone, say
plainly what you found, and look for another safe way to finish the task. Stopping before
the task is complete is very rarely merited, as in when the task can't move forward without
user input, or where the blocker is deliberate and should not be worked past. This does not
override the need for confirmation on risky or destructive actions.
```

In Anthropic's replay of sessions from an agentic coding product at `medium`, a version of
this text left about half as many sessions with doable work unfinished, at about 30 percent
more output tokens. It removes most endings that ask permission or offer to continue. It
does not remove endings that list what remains and then stop.

## Include when applicable

### Approvals

Name the exact actions an approval rule covers. In Anthropic's testing on simulated tasks
with nobody there to approve, a rule that listed "sending messages to people outside this
conversation" made the model hold back about half of its routine requests to colleagues and
other teams.

The model treats a rule that contains "never" as absolute. When you want it to keep
responsibility for an action, write the exception into the rule: "ask for approval before
deleting files", not "never delete files". When a subagent resumes after a pause, say what
it may do ("Yes, run the migration on the staging database"), not a bare "continue".

### Code ownership

With nothing said about ownership, or with the code presented as someone else's, the model
adds to the existing structure even when that duplicates code. To have it improve the
structure as it works:

```text
You are the owner and long-term maintainer of this codebase, and its design is up to you.
```

In Anthropic's testing on small coding tasks, duplicated code was consolidated in about 75
percent of runs with the sentence, against under 10 percent without it. Output tokens rose
by about 70 to 80 percent, the model made changes nobody asked for (many of them tests and
documentation), and in some runs it changed how an existing feature behaves. A scope rule
does not cancel the sentence: with "No drive-by refactors, renames or cleanups" earlier in
the same prompt, it still consolidated in more than half of runs.

Leave the sentence out where the user owns the code and wants it changed as little as
possible, and say so instead:

```text
The user owns this code. Change only what the task needs, and report other problems as
follow-ups.
```

Review the diff as well as the subagent's summary. Its closing summary often leaves out
small changes.

### Progress updates

The model can run long chains of tool calls with little user-facing text, and can make its
first call without saying what it is about to do. A subagent reports to its parent, so this
matters only where a person watches the subagent work. Check the client first: the updates
arrive as progress-update thinking blocks, so set `display: "updates"` (beta
`thinking-display-updates-2026-08-18`) or `"summarized"` and render the non-empty blocks.
Then, where a person is in the loop:

```text
Before you start, say in a line what you're about to do; brief updates while you work help
the user follow along. Close with a short recap that stands on its own (what you found,
what you did, and what's next), so a reader who only sees the last message has the full
picture.
```

This raised output tokens per task by about 20 percent. A harness that can append
turn-scoped system messages (`clear_at: "next_user_message"`, beta
`mid-conversation-system-clear-at-2026-08-21`) can count consecutive tool-calling steps with
nothing for the user to read and append this after several of them. It roughly halved the
longest silent stretch with no noticeable rise in tokens or time:

```text
The user hasn't heard from you in a while: say in a few words what you're doing, then
continue.
```

Leave every earlier copy of that reminder in place, since removing one is a history edit.
Where neither option fits, this sentence cut most long silent stretches on workflow
automation tasks:

```text
Every few tool calls, give the user a one-line update on where things stand.
```

Expect runs of several tool calls between updates even with all of these. The model suits
long asynchronous work where nobody needs frequent updates.

### Subagents

How much the model delegates depends on the harness. With a minimal subagent tool and
nothing inviting delegation it rarely starts one. In a coding harness whose prompts invite
it, it delegates readily, and at `xhigh` and `max` it also starts subagents to review its own
work. Subagents can be a large share of a session's cost, so check which model they run on
by default.

If the subagent you are briefing can spawn its own, first review standing "delegate" lines
in its prompt, skills and agent files. Change the spawn tool's description only if it still
starts more subagents than the task needs: state what a subagent adds to the session's
cost, when delegation is worth it and when it isn't, and how to brief one. At `high`, a
longer description focused on cost roughly halved the number of subagents against a shorter
one. Say more about cost if it still delegates too much, less if it delegates too little.

### Carried rules, notes and memory

Cautions build up in memory files, notes, instruction files and messages between agents,
and the model follows them closely. It can then ask for approvals it does not need or hold
routine work, mostly where several agents work together. Before handing a subagent carried
context:

- Remove notes whose reason no longer holds, such as an old "never retry".
- List the routine steps it may take without approval. "Act more freely" is too vague to
  change anything. Name retries only for calls that are safe to repeat.
- Remove or narrow stopping conditions you do not need, including the ones a reviewer agent
  attaches. A "stop and review at the first error" can block autonomous work.
- Rewrite absolute rules with their scope and reason.

If a system is already stuck, restart it with its memory and notes trimmed.

### Final reports and handoffs

The parent, or the person behind it, has not seen the subagent's tool calls or files. For
a final report or handoff:

```text
# Communicating clearly
Write for an intelligent but low-context reader. The person reading has not seen your tool
calls, your reasoning or the files you opened, and may be switching in from other work.
Messages should generally be self-contained: the reader should understand what you mean
without having to dig for other context. Put the key points in the first few sentences.
Practice progressive disclosure in your sentence order, and do not use undefined references
and ideas in line 1 that won't make sense until the reader reaches line 12.

Use plain words, and write in clear, understandable full sentences. Do not use a term or
abbreviation that you made up during the work. Say what the thing is in a way any reader
would understand. Write mostly in the style of ASD-STE100 Simplified Technical English:
short sentences, one idea per sentence, active voice, and consistently using the same word
for the same thing. Use a paragraph of flowing prose where ideas connect, and keep bullets
for lists of separate items. Leave out unnecessary details unless the reader asks and
practice concision, but do ensure that your messages have the key context. Aim to make your
user-facing text as human-readable and clear as possible.
```

In Anthropic's testing it made final reports less dense and reduced semicolons. Remove hard
style rules before adding it, and add any length or required-detail instructions the reader
needs.

### Safeguard refusals

A declined request returns `stop_reason: "refusal"` with `stop_details.category`: `cyber`,
`bio`, `frontier_llm`, `reasoning_extraction`, `general_harms`, or `null`. Never ask the
model to write its reasoning into the reply, which is the `reasoning_extraction` category.
Read thinking blocks with `display: "summarized"` instead. `fallbacks: "default"` retries a
declined request on the model Anthropic recommends for its category (Opus 4.8 or Opus 5).
A category with no recommended fallback, such as `reasoning_extraction`, stays refused.

### Changing the prompt mid-conversation

Make prompt and tool-description changes in new conversations. To change instructions
inside a conversation, put them in the newest turn, or append a system message where the
platform has mid-conversation system messages. Shorten history with context editing or with
compaction that keeps no earlier turns after the summary.
`thinking.block_binding.prefix_mismatch_behavior: "drop_block"` (beta
`thinking-binding-controls-2026-08-01`) drops the invalid blocks instead of failing, but the
model then thinks again and spends more output tokens. Use it only while fixing the edit.

## Avoid

- Lines asking for less thinking, such as "answer directly without deliberating". They do
  not stop thinking at `medium` and above. Lower the effort for those turns instead.
- The "treat that answer as done" sentences from Prompting Claude Opus 5.5. At `high` they
  cut thinking on follow-ups, but the model became far less likely to point out mistakes in
  its earlier answers.
- A token budget written into the prompt. At `high` and `xhigh`, removing a large one
  lowered cost at the same performance. This is about prompt text, not the API's task
  budgets.
- Standing instructions to delegate that the task does not need.
- Absolute "never" rules without scope or reason, in the prompt or in carried notes.
- Hard sentence-length or style limits such as "one instruction per sentence, in 20 words
  or fewer". They make the prose choppy.
- Instructions to write reasoning into the response.
- A bare "continue" or "go" as an approval.
- `thinking` set to `disabled` or with `budget_tokens`, forced `tool_choice`, an assistant
  prefill, and sampling parameters. Each returns a 400.

## Effort

Effort levels are `low`, `medium`, `high` (default), `xhigh`, `max`. Effort sets how much the
model thinks, how many tool calls it makes, how long a turn takes and how many tokens it
uses. Rerun the effort sweep rather than carrying over a level tuned on Fable 5.1 or Opus
5.5, since the thinking behind each level differs between models.

- `low`: quick back-and-forth, well-specified tasks, high-volume work such as fast
  subagents. On coding evaluations it scored close to Fable 5.1 at higher levels.
- `medium`: interactive coding, chat, everyday knowledge work.
- `high`: hard coding, research, agentic work, long unattended runs. Most of the gain is
  already here. The step from `medium` raised most coding and knowledge-work evals, at a
  noticeable cost in time and tokens, so move down wherever quality holds.
- `xhigh`: the hardest long-running coding and agentic work, where a gain was measured.
  Slightly higher scores for many more tokens.
- `max`: measuring the ceiling, or open-ended problems such as mathematics where time and
  tokens do not matter.

At `low` and `medium` the model stops early more often, so add the finishing-work block for
agentic work there. At
`high` and above it thinks before almost every reply, even a greeting, so set a large
`max_tokens` and use a lower level for easy turns. Effort barely changes reply length, so
set length and tone in the prompt.

## Delegation template

```text
Objective:
[One concrete deliverable.]

Ownership:
[Either "You are the owner and long-term maintainer of this codebase, and its design is up
to you." or "The user owns this code. Change only what the task needs, and report other
problems as follow-ups."]

Scope:
[What changes. What must stay untouched.]

Autonomy:
Complete all unblocked work before asking. Diagnose ordinary obstacles (errors, timeouts,
empty results, failing tools) and work through them. Leave deliberate blockers alone and
report them. These steps need no approval: [list, including retries of safe calls].
Ask for approval before: [exact actions].

Evidence:
[What must be inspected or retrieved before any claim.]

Done when:
[Observable conditions.]

Return:
[Exact handoff shape.] Write it for a reader who has not seen your tool calls: key points
first, plain words, no terms you made up during the work.
```

## Failure-mode adjustments

- Ends with a list of what remains, or an offer to continue: add the finishing-work block,
  or raise effort from `low` or `medium`.
- Easy turns too slow or costly: lower effort for those turns. A "think less" line will not
  work.
- `stop_reason: "max_tokens"` after a thinking block with no text: raise `max_tokens` or
  lower effort.
- Asks for approvals it does not need, or will not retry: trim carried notes, scope the
  "never" rules, name the steps that need no approval, and check reviewer conditions.
- Adds beside existing code instead of consolidating it, or reports a nearby bug without
  fixing it: add the ownership sentence, if the code is the agent's to restructure.
- Changes nobody asked for after the ownership sentence: remove it and use the user-owns
  line.
- Silent through long tool chains: check the client renders progress-update thinking
  blocks, then add the update text or the harness reminder.
- Starts more subagents than the task needs: remove standing delegation lines, then put
  cost first in the spawn tool's description.
- Choppy prose: remove hard style limits.
- `refusal` with `reasoning_extraction`: remove any instruction to write reasoning into
  the reply.
- 400 "bound to a different conversation": the prefix check. Start a new conversation, put
  the change in the newest turn, or use `"drop_block"` while fixing the edit.
- 400 on `thinking`, `tool_choice`, a prefill or a sampling parameter: remove the field.

## Provenance

Last cross-checked: 2026-11-13. Sources:

- Prompting Claude Fable 5.2, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2
  Source of the finishing-work, ownership, progress-update, reminder, one-line-update and
  communicating-clearly blocks, every percentage in this file, the approval and "never"
  rule guidance, the subagent and carried-caution guidance, the list of instructions to
  review from earlier models, the refusal categories, and the effort guidance.
- What's new in Claude Fable 5.2, fetched 2026-11-13:
  https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2
  Source of the API facts: always-on thinking, the forced `tool_choice` 400, the prefix
  check on every account, which models read its thinking blocks, and the fallback targets.
- Migrating to Claude Fable 5.2 (copy bundled with the claude-api skill, read 2026-11-13):
  source of the prefill and sampling 400s, and of the `max_tokens` stop after a thinking
  block. It differs from the public page in places, and this file follows the public page.
  The bundled copy gives a different ownership sentence ("This codebase is yours: what it's
  for and how it's built are your call, and you'll keep building on it.") with different
  figures (about half against under a tenth, 1.5 times the output tokens), says a
  cost-first spawn description cut delegation by about a third where the public page says
  roughly halved, and gives retry and approval figures for carried rules that the public
  page does not.

The "user owns this code" line, the note on where system-prompt text goes in a Claude Code
task prompt, the note that progress updates matter only where a person watches the
subagent, and the "Delegation template" are this skill's own heuristics.
