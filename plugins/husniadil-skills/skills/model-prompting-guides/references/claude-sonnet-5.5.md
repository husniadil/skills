# Claude Sonnet 5.5 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Sonnet 5.5
(`claude-sonnet-5-5`).

Anthropic says Sonnet 5 prompts perform well on Sonnet 5.5 without changes, and that the
Sonnet 5 patterns remain a reasonable starting point. This file holds what the Sonnet 5.5
guide adds or changes. For the Sonnet 5 blocks that guide does not revisit (literal scope,
code review recall, design direction), see [claude-sonnet-5.md](claude-sonnet-5.md). What
Anthropic's pages say changed from Sonnet 5, where this file wins over that one:

- Thinking cannot be disabled. `thinking: {"type": "disabled"}` returns a 400 error, and
  `between_tools` is the lowest setting.
- A prompt asking the model to think less does not reliably reduce its thinking, so the
  Sonnet 5 block for steering thinking down is not a lever here. Lower effort instead.
- Effort levels are recalibrated, so a Sonnet 5 setting does not carry over.
- Forced tool use returns a 400 error, so the prompt is the way to get a tool call.
- Notes between tool calls come back as `thinking` blocks rather than `text`.

## Always include

- An explicit `effort` value chosen for the workload. A level does not produce the same
  amount of thinking as the same level on Sonnet 5.
- A completion rule for agentic coding. At `low` and `medium` the model sometimes checks
  in before the work is done.
- A scope rule if only the requested change is wanted. At every effort level the model
  tends to add tests, documentation, and small supporting files that fit the repository.
- When each tool applies, in words. `tool_choice` of type `any` or `tool` is rejected, and
  with `auto` the model can answer without calling the tool.

```text
Keep working until everything the user asked for is done, and only stop to ask when you
can't go on without the user or before a risky step.

When the work the user asked for is done and checked, stop and report. Don't add features,
tests, files, docs or refactors that weren't asked for. If you think one would help,
mention it at the end instead of doing it.
```

With the first paragraph, sessions at `low` and `medium` carry more of the work through, so
they run longer and cost more. It does not replace your own rules about risky or
irreversible actions. To limit only the unrequested additions, use the second paragraph
alone. At `xhigh` and `max` it also makes changes smaller overall.

## Include when applicable

### Thoroughness at `xhigh` and `max`

At these levels the model can start its own rounds of review and verification after the
task, sometimes with subagents, and make related fixes it noticed. To keep that
thoroughness on the task itself:

```text
When the work the user asked for is done and its checks pass, stop and report. Don't start
extra rounds of review or hardening on your own, and don't launch reviewer sub-agents
unless the user asked for a review. If you think a deeper review is worth doing, say so at
the end.
```

In Anthropic's testing at `max` on coding tasks, this stopped reviewer subagents and cut
session cost by about a third with no change in quality. Self-started review rounds become
less frequent but do not disappear.

### Open-ended requests

On a request such as "show me what you can do with this", the model can start building a
presentation, report, or video when only ideas were wanted.

```text
When the user asks for ideas, options or a plan, give them that and stop. Don't start
building or changing anything until they say to go ahead.
```

### Verification on coding tasks

At `low` effort the model sometimes reports a change as done without running a check that
exercises it, for example because the project's dependencies are not installed. If changes
are reported complete without test or build output in the transcript:

```text
When you change code that can be run, built, or type-checked, run a real check that
exercises the change before reporting it done: the project's tests, type-checker, or
build, or the changed command itself. A syntax-only check, or a check command that failed
to start, does not count. If all that is missing is the project's declared dependencies,
install them with its own package manager and lockfile (e.g. npm install, pip install -r
requirements.txt), never via sudo or the system package manager, unless told not to. Only
if no real check can run here, say which one you did not run and why instead of reporting
the change as done.
```

### Current facts in chat and knowledge work

The model sometimes answers from training knowledge when a search would catch details that
have changed. First remove lines that discourage tool use, such as "only use tools when
strictly necessary" or "minimize tool calls". Then, if the model has a search tool:

```text
Use the search tool to check specifics that may have changed since your training, such as
what is allowed, required or charged, even when you feel confident. For researched work
such as a report or a comparison, gather current sources rather than writing from your
training knowledge.
```

### Reasoning tasks with JSON output

On a task that needs a few steps of working out (totaling figures, applying a rule,
ranking items), the model often answers without thinking first, most at `low` and
`medium`. Use structured outputs where they are available, keep adaptive thinking on, and
end the system prompt with:

```text
Think the problem through before you answer.
```

At `high` this brings accuracy close to `xhigh` for a modest token increase. At `low` and
`medium` it raises accuracy, though not to the `high` level, and costs more tokens. `xhigh`
alone gives the highest accuracy. The line has no effect under `between_tools`, where a
request without tools gets no thinking before the answer.

Treat any response with `stop_reason: "max_tokens"` as failed, even if its text holds valid
JSON, and retry. Without structured outputs, the model often works the problem out in the
text and writes the JSON at the end. Parse the last JSON value in the `text` blocks rather
than everything from the first `{` to the last `}`, check it has the expected fields, and
retry once if it does not.

### Progress updates in a watched run

Notes longer than a sentence or two between tool calls come back as progress-update
`thinking` blocks, which are empty at the default `display`. A client that renders only
`text` looks silent. Set `display: "updates"` (beta) to get them, or run with
`between_tools`, where they come back with their summary text.

Remove older instructions such as "hold all findings for the final response". For updates
at set points, say so in the system prompt, for example a line on what the model is about
to do before its first tool call and a short recap at the end. The model follows
instructions like this.

If turns still go quiet, a harness can count consecutive tool-calling steps with no text
or update and, after about five, append a turn-scoped system message (beta) after the
latest tool results:

```text
The user hasn't heard from you in a while. Say in a few words what you're doing, then
continue.
```

Stop after the second or third reminder. Leave each one in `messages` on later requests, so
the prompt cache and preserved thinking stay intact. For exact text the user must see
mid-turn, such as a code snippet or a question, give the model a simple tool for sending
the user a message, say to use it only for such content, and declare it in the first
request of the session.

### Mid-turn user messages

The model resists prompt injection through tool results, and can mistake a genuine user
message for one when it arrives right after a tool result.

- Never put user text inside a `tool_result` block.
- Deliver mid-turn input as a text block in the user message that carries the
  `tool_result` blocks, after the last one.
- Keep harness notices in a separate mid-conversation system message after the user's
  words, never in the same block.
- In interactive sessions where users can type mid-turn, do not add a token or budget
  countdown after tool results.

### Running without up-front thinking

Send `thinking: {"type": "between_tools"}`, at `high` effort or below. At `xhigh` or `max`
it returns a 400 error, and with it effort cannot change mid-conversation. Remove any
instruction that tells the model not to think, because it makes internal XML tags in the
visible output more likely. Pass the progress-update `thinking` blocks back unchanged. For
reasoning tasks without tools, use adaptive thinking instead.

### Changing instructions mid-run

Sonnet 5.5 thinking blocks are tied to the conversation. Replaying one after an edit to
`system`, `tools`, or an earlier message can return a 400 error. Keep the history
append-only and change instructions or tools with mid-conversation system messages rather
than edits.

### Tool calls with a slightly wrong name

The model occasionally calls a tool by a name that differs only in letter case, or passes a
known parameter under a slightly different name. Have the harness accept the call when the
match is unambiguous, or return a `tool_result` with `is_error: true` that states the exact
expected name. The model usually corrects the call on its next turn.

### Dense charts and technical drawings

Give the model a way to crop, zoom, or run code on the image. On charts this helps at every
effort level and beats raising effort: with tools at `high` the model read charts more
accurately than without them at `max`. On technical drawings the tools help only from
`high` up.

### Safeguard refusals

A decline returns `stop_reason: "refusal"`, with `stop_details.category` naming `cyber`,
`bio`, `frontier_llm`, `reasoning_extraction`, or `general_harms`. Benign work can trigger
`general_harms`. Remove instructions asking the model to include its reasoning in the
response, which invite `reasoning_extraction`, and read summarized thinking
(`display: "summarized"`) instead. A short explanation of the answer or a summary of the
actions taken is still fine to ask for.

## Avoid

- Asking the model to think less. It does not reliably reduce thinking. Lower effort.
- Instructions not to think when running with `between_tools`.
- Asking for the model's reasoning in the response text.
- "Only use tools when strictly necessary", "minimize tool calls", and similar lines.
- "Hold all findings for the final response."
- User text inside a `tool_result` block, and a countdown after every tool result in
  interactive sessions.
- The Sonnet 5 effort setting, carried over without a fresh sweep.

## Effort

Effort levels are `low`, `medium`, `high` (default), `xhigh`, `max`. They are recalibrated
from Sonnet 5, so run a fresh sweep on your own evals.

- Start at `high` unless the workload is agentic or latency-sensitive.
- Agentic coding and multistep tool use: start at `medium` for well-specified tasks and
  move to `high` for harder or longer ones.
- Chat and other latency-sensitive work: start at `medium` or `low`. From `medium` up the
  model thinks briefly before almost every reply, even a greeting. At `low` it skips
  thinking on most simple requests.
- At `low` thinking stays short and a change can go unverified. At `low` and `medium`, on
  long agentic tasks, the model is more likely to stop and check in.
- Reserve `xhigh` and `max` for work with a measured quality gain. Thinking and replies get
  much longer there, and `between_tools` is not accepted.
- Size `max_tokens` for thinking plus the reply. Thinking counts toward it even when it is
  not returned. For agentic coding, set 128,000 and stream.
- Changing top-level effort between requests invalidates the prompt cache. Use
  per-message effort (beta) to vary one turn. It needs adaptive thinking.

## Delegation template

```text
Objective:
[One concrete deliverable.]

Scope:
[What changes. What must stay untouched.]

Tool policy:
[When each tool applies. Forced tool choice is not available.]

Execution:
Keep working until everything asked for is done, and only stop to ask when you can't go
on without the user or before a risky step.

Verification:
[The real check that exercises the change: tests, type-checker, build, or the command.]

Done when:
[Observable conditions.] When the work is done and checked, stop and report. Mention
extra features, tests, docs or refactors at the end instead of doing them.

Return:
[Exact format, including schema if machine-read.]
```

## Failure-mode adjustments

- Checks in before a coding task is done: raise effort first, then add the completion
  paragraph.
- Adds tests, docs, or files nobody asked for: add the "When the work the user asked for is
  done" paragraph.
- Extra review rounds or reviewer subagents at `xhigh` or `max`: add the thoroughness
  block, or run routine work at `high`.
- Starts building when only ideas were wanted: add the open-ended block.
- Reports a change done without a test or build run: add the verification paragraph.
- Answers from training knowledge: remove tool-discouraging lines, then add the search
  block.
- Wrong or unparseable JSON on a worked task: add the think-first line or use `xhigh`,
  parse the last JSON value, and treat `max_tokens` stops as failed.
- Client silent during long turns: set `display: "updates"` or use `between_tools`, then
  add the harness reminder.
- Ignores or questions a mid-task user message: move the user's text out of `tool_result`,
  put harness notices in their own system message, and drop countdowns.
- Wrong letter case or parameter name in a tool call: make the harness tolerant.
- Misses detail in dense charts or drawings: add crop, zoom, or code tools.
- `stop_reason: "refusal"` with `reasoning_extraction`: remove instructions to show
  reasoning in the response.
- Reply cut off: raise `max_tokens` to leave room for thinking.
- 400 error after editing earlier history: keep the conversation append-only and use
  mid-conversation system messages.

## Provenance

Last cross-checked: 2026-10-03. Sourced from Anthropic's official documentation, all read on
2026-10-03:

- Prompting Claude Sonnet 5.5:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5
- What's new in Claude Sonnet 5.5:
  https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5
- Migrating to Claude Sonnet 5.5:
  https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide
- Claude Sonnet 5.5 model page:
  https://platform.claude.com/docs/en/models/sonnet-5-5/overview
- Prompting Claude Sonnet 5, read only to state which of its rules changed:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5

Prompt blocks are quoted from the Sonnet 5.5 guide, with punctuation adjusted to this
skill's style.
