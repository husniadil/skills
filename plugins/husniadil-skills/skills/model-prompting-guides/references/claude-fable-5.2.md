# Claude Fable 5.2 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Fable 5.2. The
same rules apply to Claude Mythos 5.2, which has the same capabilities and is offered only
to organizations verified through Anthropic's verification programs.

Fable 5.2 follows what its prompt and its carried context say more closely than Fable 5.1
does. Most of the changes below come from that: a line that limits, warns or delegates is
applied as written, so write each one with its scope.

## Always include

- A completion contract. On long multistep work the model can end a turn with a list of
  what remains, an offer to continue, or a stop at an ordinary obstacle. This happens more
  often at `low` and `medium`.
- The distinction between an ordinary obstacle, which the agent diagnoses and works
  through, and a deliberate blocker, which it leaves alone and reports.
- Your own confirmation step for risky or irreversible actions. With the completion text
  the model asks less often, so the prompt must name what still needs a go-ahead.

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

Anthropic measured about half as many sessions ending with doable work left, at about 30
percent more output tokens. The text removes most endings that ask permission or offer to
continue. It does not remove endings that list what remains and then stop.

## Include when applicable

### Approval rules

Name the exact actions an approval rule covers. The model applies the rule as written: a
rule that listed "sending messages to people outside this conversation" made it hold back
about half of its routine requests to colleagues. When the agent resumes after a pause,
say what it may do ("Yes, run the migration on the staging database"), not a bare
"continue".

When a rule has an exception, write the exception into the rule. Under a "never" rule, a
separate line saying an approved step has its go-ahead barely changed behavior. A rule that
itself said "get a go-ahead first" let the approved step through about nine times in ten.

### Code ownership

What the prompt says about who owns the code changes how the model edits it. With nothing
said, or with the code presented as someone else's, it adds to the existing structure even
when that repeats code, and reports nearby problems instead of fixing them. To have it
improve structure as it goes:

```text
This codebase is yours: what it's for and how it's built are your call, and you'll keep
building on it.
```

With that sentence, repeated code was merged in about half of the tries, against under a
tenth without it. It also raised
output tokens about 1.5 times, added unrequested tests and docs, and changed an existing
feature's behavior in one try in six to ten. A scope rule elsewhere in the prompt does not
cancel it. Leave it out where the user owns the code and wants minimal change, and review
the diff, since the closing summary often omits small changes.

### Progress updates

The model can run long chains of tool calls with little user-facing text, and can make its
first call without saying what it is about to do. Where a person watches the work:

```text
Before you start, say in a line what you're about to do; brief updates while you work help
the user follow along. Close with a short recap that stands on its own (what you found,
what you did, and what's next), so a reader who only sees the last message has the full
picture.
```

This costs about 20 percent more output tokens. Where that is too much, or the harness
cannot inject reminders:

```text
Every few tool calls, give the user a one-line update on where things stand.
```

A harness that can append turn-scoped system messages can count consecutive silent
tool-calling steps and append this after several of them, which roughly halved the longest
silent stretch at no noticeable cost:

```text
The user hasn't heard from you in a while: say in a few words what you're doing, then
continue.
```

Before blaming the model, check the client renders its updates: on Fable 5.2 they arrive as
progress-update thinking blocks, which are empty at the default `thinking.display` of
`"omitted"`.

### Subagents

How much the model delegates depends on the harness. With a plain tool and nothing inviting
delegation it rarely starts one. In a coding harness whose prompts invite it, it delegates
readily, and at `xhigh` and `max` it also starts subagents to review its own work.
Subagents can be a large share of a session's cost. Review standing "delegate" lines in the
prompt, skills and agent files first. Change the spawn tool's description only if it still
over-delegates, and then state the cost first, then when delegation is worth it, then how
to brief a subagent.

### Carried rules, notes and memory

Cautions build up in memory files, notes, instruction files and messages between agents,
and the model follows them closely. It can then ask for approvals it does not need or hold
back routine work, mostly in multi-agent setups. Delete cautions whose reason no longer
holds, rewrite absolute rules with their scope and reason, and name the steps that need no
approval. A line listing retries among those steps raised retries from almost none to about
half, while a general "act more freely" changed nothing. Name retries only for calls that
are safe to repeat, and check what a reviewer agent attaches, since its "stop at the first
error" was enough to stop retries.

### Final reports and handoffs

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

Remove hard style limits before adding this. The model follows style rules closely, so a
rule such as "one instruction per sentence, in 20 words or fewer" makes its prose choppy.

### Safeguard refusals

A declined request returns `stop_reason: "refusal"` with `stop_details.category`: `cyber`,
`bio`, `frontier_llm`, `reasoning_extraction` or `general_harms`. Never ask the model to
write its reasoning into the reply: that is the `reasoning_extraction` category. Read the
thinking blocks with `display: "summarized"` instead.

### Changing the prompt mid-conversation

The API's prefix check applies on every account: a request that sends thinking blocks back
after `system`, `tools` or an earlier message changed returns a 400. Put a new instruction
in the newest turn, or in an appended system message where the platform has them, and make
system-prompt changes in new conversations only.

## Avoid

- Lines asking for less thinking, such as "answer directly without deliberating". They do
  not stop thinking at `medium` and above. Lower the effort for those turns instead.
- Opus 5.5's "treat that answer as done" lines for chat follow-ups. They cut thinking but
  made the model far less likely to point out mistakes in its earlier answers.
- A token budget written into the prompt. Removing a large one lowered cost at the same
  quality at `high` and `xhigh`.
- Standing instructions to delegate that the task does not need.
- Absolute "never" rules without scope or reason, in the prompt or in carried notes.
- Hard sentence-length or style limits.
- Instructions to put reasoning in the response.
- A bare "continue" or "go" as an approval.

## Effort

Effort levels are `low`, `medium`, `high` (default), `xhigh`, `max`. Thinking is always on
and cannot be disabled. Rerun an effort sweep rather than carrying over a level tuned on
Fable 5.1 or Opus 5.5, since the thinking behind each level differs between models.

- `low`: quick back-and-forth, well-specified tasks, high-volume work such as fast
  subagents. Scores sat close to Fable 5.1's at higher levels.
- `medium`: interactive coding, chat, everyday knowledge work.
- `high`: hard coding, research, agentic work, long unattended runs. Most of the gain is
  already here, and the step from `medium` raised most evals at a noticeable cost in time.
- `xhigh`: the hardest long-running coding and agentic work, where a gain was measured.
  Slightly higher scores for many more tokens.
- `max`: measuring the ceiling, or open-ended problems such as mathematics where time and
  tokens do not matter.

At `low` and `medium` the model stops early more often, so add the completion contract.
At `high` and above it thinks before almost every reply, even a greeting. Effort barely
changes reply length, so set length and tone in the prompt.

## Delegation template

```text
Objective:
[One concrete deliverable.]

Ownership:
[Either "This codebase is yours: ..." or "The user owns this code. Change only what the
task needs and report other problems as follow-ups."]

Scope:
[What changes. What must stay untouched.]

Autonomy:
Complete all unblocked work before asking. Diagnose ordinary obstacles (errors, timeouts,
empty results, failing tools) and work through them. Leave deliberate blockers alone and
report them. These steps need no approval: [list, including retries of safe calls].
These need a go-ahead first: [exact actions].

Evidence:
[What must be inspected or retrieved before any claim.]

Updates:
Every few tool calls, give a one-line update on where things stand.

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
- Asks for approvals it does not need, or will not retry: trim carried notes, scope the
  "never" rules, name the steps that need no approval, check reviewer attachments.
- Adds beside existing code instead of merging it, or reports a nearby bug without fixing
  it: add the ownership sentence, if the code is the agent's to restructure.
- Silent through long tool chains: check the client renders progress-update thinking
  blocks, then add the update text or the harness reminder.
- Starts more subagents than the task needs: remove standing delegation lines, then put
  cost first in the spawn tool's description.
- Choppy prose: remove hard style limits.
- `refusal` with `reasoning_extraction`: remove any instruction to write reasoning into
  the reply.
- 400 after a prompt change on a resumed conversation: the prefix check. Start a new
  conversation, or put the change in the newest turn.

## Provenance

Last cross-checked: 2026-11-10. Sourced from Anthropic's "Prompting Claude Fable 5.2" and
"What's new in Claude Fable 5.2" pages on platform.claude.com. The percentages are
Anthropic's own measurements as those pages report them.
