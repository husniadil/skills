# Claude Fable 5.1 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Fable 5.1
(`claude-fable-5-1`). The same rules apply to Claude Mythos 5.1 (`claude-mythos-5-1`), which
is offered only to verified organizations. Claude Fable 5.2 succeeds it: use
[claude-fable-5.2.md](claude-fable-5.2.md) for `claude-fable-5-2`. This file stays for agents
still running Fable 5.1. Anthropic says Fable 5 prompts perform well here without changes;
the blocks below cover where Fable 5.1 behaves differently.

What the API does on this model, which decides what a prompt can rely on:

- Adaptive thinking is always on. `thinking: {"type": "disabled"}` and `budget_tokens`
  return a 400. Effort controls thinking depth, and its default is `high`.
- Thinking counts toward `max_tokens`, which is a hard limit on thinking plus the reply.
- `tool_choice` of `any` or `tool` returns a 400. So do an assistant prefill and the
  sampling parameters (`temperature`, `top_p`, `top_k`).
- A thinking block passes the prefix check only while the system prompt, the tools and
  every earlier message are unchanged. Failing the check might or might not return a 400,
  depending on the account and platform.
- Only Fable 5.1, Mythos 5.1, Fable 5.2 and Mythos 5.2 read Fable 5.1 thinking blocks.
- The updates the model writes between tool calls come back as progress-update `thinking`
  blocks, which are empty at the default `display: "omitted"`.
- Safety classifiers can decline a request with `stop_reason: "refusal"`. A prompt that
  asks the model to write out its reasoning can be declined as `reasoning_extraction`.

Mythos 5.1 differs from Fable 5.1 in two API behaviors. Its safeguards depend on the access
program the organization is approved under. Its prefix check is enforced by default on
accounts of any age on the Claude API, Google Cloud Vertex AI and Microsoft Foundry, and not
by default on Amazon Bedrock.

In Claude Code the task prompt reaches the subagent as its first user message. Text that
Anthropic says to put in a system prompt goes at the top of the task prompt, or in the
agent definition when you control one.

## Always include

- For long or asynchronous agentic work, the autonomy block below. On such work the model
  sometimes describes the next step instead of doing it ("Next, I'll ...") or asks
  permission for a step the request already covered. A short task that a person watches
  can do without it, since a reply of "continue" recovers it there. Its opening sentence carries much of the effect, so keep it as written.
  If the subagent must stop for specific confirmations, list them in a sentence after it.
- The final outcome and an observable done condition.
- What must be inspected or retrieved before a claim, stated as a rule about a class of
  claims.

```text
You are operating autonomously. The user is not watching in real time and cannot answer
questions mid-task, so asking 'Want me to...?' or 'Shall I...?' will block the work. For
reversible actions that follow from the original request, proceed without asking. Stop
only for destructive actions or genuine scope changes the user must decide. Offering
follow-ups after the task is done is fine; asking permission before doing the work is not.

Exception: when the user is describing a problem, asking a question, or thinking out loud
rather than requesting a change, the deliverable is your assessment. Report your findings
and stop. Don't apply a fix until they ask for one.

Before ending your turn, check your last paragraph. If it is a plan, an analysis, a
question, a list of next steps, or a promise about work you have not done ('I'll...', 'let
me know when...'), do that work now with tool calls. That includes retrying after errors
and gathering missing information yourself. Do not stop because the context or session is
long. End your turn only when the task is complete or you are blocked on input only the
user can provide.

Before running a command that changes system state (such as restarts, deletes, or config
edits), check that the evidence actually supports that specific action. A signal that
pattern-matches to a known failure may have a different cause.
```

The block can make the model less likely to ask about an ambiguous request, so state the
reading you want when two readings lead to different work. If the prompt already asks the
model to test or check its work before reporting, keep that line. Anthropic's advice to
delete verification instructions on Opus 5 does not apply here, though that rests on a
small number of reports.

## Include when applicable

### Scope of the deliverable

Pair this with the autonomy block when prompt length allows. The autonomy block alone keeps
most of the effect:

```text
# Delivering work
The user's request - or the plan they approved - sets the scope, and the scope is the
deliverable: don't quietly narrow, widen, or swap it. Read ambiguity the way a careful
colleague would: make routine judgment calls yourself, and check in only when different
readings would lead to materially different work. If you see a real problem with the task
as specified, say so in a sentence or two and keep building under stated assumptions; if
the user hears the concern and reaffirms, that is their decision, so deliver the full
request.

If a question comes up partway, first do everything that doesn't depend on the answer;
then state the assumption you made, or - when going ahead on a wrong guess would be unsafe
or would make the work useless - put the question at the end of a turn that also delivers
that progress. If one part turns out to be blocked, complete every other part in full and
say exactly what you left out and why - the whole task is the deliverable, and scaling it
down is the user's call, not yours. A step you have decided on is something to run, not to
announce: describing the next step and ending the turn leaves it undone until the user
replies.

Keep changes to what the request needs. Something else you notice worth doing - cleanup or
documentation the task didn't call for, a change to a file the task didn't require - is a
suggestion to make at the end, not a change to make; actions clearly beyond what the ask
implies, and risky or destructive ones, still need the user's go-ahead.
```

### Coding scope and tests

On open-ended features the model sometimes fixes nearby code, extends behavior the task did
not mention, or commits more test files than the change warrants. With this block,
unrequested additions and committed test code dropped substantially with no measurable
change in task success:

```text
If, while working or testing, you find a pre-existing bug, a performance concern, or
behavior the task doesn't mention, don't fix, optimize or extend it in this change unless
the requested behavior cannot work without it; report it as a follow-up in your summary.
Where the task is ambiguous, implement the reading its wording and the surrounding code
most directly support, state that assumption in your summary, and don't build for the
other readings as well. Verify your work however you like; scratch scripts and quick checks
need not be kept. Commit tests only where the task asks for them or this repository
already keeps tests for this kind of change, sized like the neighboring test files -
roughly one focused test per stated behavior - and don't turn scratch checks into
additional permanent test files. This is about extras only: implement every behavior the
task asks for, completely.
```

### Targeted edits

Fable 5.1 rewrites whole files for small changes more often than Fable 5. With this line
(system prompt or first user message, equally effective) it behaved like Fable 5 on small
and medium changes:

```text
The number of tokens used to edit files is best minimized, all else being equal.
Therefore, when it will not affect the end result, try to surgically edit a file rather
than rewrite the entire thing.
```

### Batching in agent loops

When a request names several things to fetch, the model calls them in parallel. In coding
and computer-use loops where the next independent calls are only implied, it can issue one
call per turn. Measure the share of turns with more than one tool call before adding this.
Placement matters more than wording: near the end of the current request the sentence
moves the number far more than the same text in the system prompt or a tool description. A
harness appends it after each
round of tool results as a turn-scoped system message (`clear_at: "next_user_message"`,
beta `mid-conversation-system-clear-at-2026-08-21`), or as a text block after the
`tool_result` blocks, and leaves every earlier copy unchanged. A task prompt can carry it as
its last line, which covers only the first round. Keep the word "privately": without it
the model sometimes answers the sentence instead of the user.

```text
First privately list what you need next; then request every item that doesn't depend on
another's result in this one response.
```

### Progress updates

Fable 5.1 writes fewer user-facing updates during long tool chains than Fable 5, more so at
higher effort. A subagent reports to its parent, so this matters only where a person
watches the subagent work. In order: set `display: "updates"` (beta
`thinking-display-updates-2026-08-18`) or `"summarized"` and render the non-empty thinking
blocks; remove lines such as "hold all findings for the final response"; then, for
human-in-the-loop work, add:

```text
Before you start, say in a line what you're about to do; brief updates while you work help
the user follow along. Close with a short recap that stands on its own - what you found,
what you did, and what's next - so a reader who only sees the last message has the full
picture.
```

If the harness collapses or hides tool output, say so after that output, or the model may
run commands to "show" the user output they never see:

```text
Only you see that command's output - the user's terminal shows at most a few lines of it.
If the user needs to read any of it, put it in your reply.
```

### Current names and search

At `low` effort the model searches less often than Fable 5 and answers from memory more.
Raising effort for those turns is often the simplest fix. Otherwise:

```text
When a query centers on a name you do not confidently recognize, or recognize from a
fast-moving area like AI models and developer tools where the landscape shifts within
months, the name itself is the thing to verify: search before answering, and include the
name as the user wrote it in at least one query alongside any reformulations. This holds
even when you have some background on it - partial background is exactly what makes an
out-of-date answer sound authoritative, so familiarity is not a reason to skip the search.
```

### Writing density

The model's prose can run denser than Fable 5's: longer sentences, fewer paragraph breaks.
Put this in a user message (preferred, so a task prompt works) or the system prompt:

```text
Mannered prose substitutes metaphor and flourish for direct statement. Instead of "a
parameter worth varying," the mannered writer produces "a dial worth turning." Instead of
"this point still matters," they write "this point earns its keep." The phrases exist to
display the writer, not to convey the idea, and readers can tell. That is why mannered
prose irritates: it makes the reader work harder so the writer can perform. It is also
imprecise. Metaphors drag in connotations the writer did not choose and cannot control.
The fix is to say what you mean. When a literal phrase is available, use it.
```

The short form, "Please remove all mannered prose.", also tends to work.

### Formatting in chat

Fable 5.1 formats less than earlier models. Delete inherited anti-formatting rules and say
when structure is wanted:

```text
Use lists and bullet points when asked to, or when the content is multifaceted enough that
they help with clarity. If the person explicitly requests minimal formatting, always format
your responses without bullet points, headers, lists, or bold emphasis, as requested. In
conversational, personal, or emotional exchanges, keep to plain prose.
```

### Quoting retrieved sources

When summarizing documents, the model reproduces source passages without marking them as
quotations more often than Fable 5. Put one complete example in the system prompt: the
request, a correct response that rewords the sources and marks the one short phrase it
quotes, and a sentence saying why it is correct. The Prompting Claude Fable 5.1 page has a
worked example. Replace its `[web_search: ...]` lines with your own tool's name.

### Long deliverables at xhigh and max

At `xhigh` and `max` the model may draft a long deliverable in its thinking and then write
it again as the reply. Run such requests at `high` unless a gain at the higher level was
measured. If they must run higher, leave `max_tokens` room for thinking plus the reply, and
append this to the end of the user message with the real value:

```text
Everything produced in one reply, including any reasoning or drafting done before the
reply, counts toward a single limit of about [max_tokens] tokens. If that limit is reached
before the reply is finished, the person receives a cut-off response and has to start
over. Composing an entire output or deliverable in full as reasoning and then again as a
reply would double the length of the turn without improving the result, so don't do that.

Instead, when the person has asked for a long or effort-intensive deliverable such as a
multi-section document, a large table or dataset, or a complete code file, spend extra
effort on understanding the request, checking the inputs the answer depends on, settling
the structure and other difficult decisions, and otherwise using the reasoning space to
reason and the output space to write an output. Usually it is not needed to draft an
output multiple times.
```

### Compaction summaries

If the harness compacts on the client, give the summarizer this instruction. Server-side
compaction already covers the same ground:

```text
Summarize the transcript inside <summary></summary> tags. Include relevant information in
the summary such that this conversation will be continued by a new context window without
needing to redo work or be reprovided with relevant constraints or context. Be sure to
preserve: (1) any difficulties or problems that came up, and how they were handled or
resolved; (2) any possibilities, options, or approaches that were raised, tried, or set
aside, and why; (3) anything that was asked for, decided, agreed, ruled out, or
established as a preference, constraint, or boundary - stated exactly; (4) exactly where
things stand now - what has been covered, settled, or completed so far; (5) anything still
open, unresolved, promised, or expected to happen next; (6) specific details that would be
hard to reconstruct - names, numbers, dates, exact wording, links or references - kept
exactly. Be complete on these even at the cost of length; keep everything else concise.
Weight the two voices differently: keep what the user said, asked for, shared, or
established carefully and close to their own words; your own explanations and reasoning
can be condensed much further, to what they concluded or produced - as long as nothing in
the six items above is dropped.
```

Replace the whole history with that summary plus the new user turn, so no thinking block
carries over to fail the prefix check.

### Changing the prompt mid-conversation

Keep the history append-only. Send per-turn reminders as turn-scoped system messages,
change instructions or tools with a mid-conversation system message instead of rewriting
`system` or `tools`, and let compaction or context editing do the trimming. Injecting and
removing reminders, summarizing older turns in place, and changing the system prompt
mid-session all fail the prefix check and invalidate the prompt cache from that point.

### Subagents

If the subagent you are briefing leads its own subagents, let it keep working while they
run. The spawn tool returns immediately, each result comes back in a later user message,
and a separate tool lets the lead wait. This lowered time to completion at similar quality
and cost. The model still often waits, and the savings come from the runs where it does
not.

### Visual inputs

For dense charts and images, give the subagent a container with the raw images and PIL or
OpenCV, or at least a tool that returns a chosen region cropped and enlarged. At `low` the
model may answer from an overall impression without calling the tool, so check the logs
and raise effort on image turns.

### Safeguard false positives

A blocked request returns HTTP 200 with `stop_reason: "refusal"`. Finding vulnerabilities
in source code is permitted, and false positives are rarer than on Fable 5 at launch. Three
things make them more likely, and all three show up in delegation prompts:

- Compile-check phrasing. Ask "Are there any bugs in this program?" rather than "Does this
  program compile without errors?".
- Lesser-known programming languages. Give the model the language's documentation or a
  description of how it works.
- Base64 in tool output. Remove tools that return it into the model's context.

## Avoid

- Lines that hold back user-facing updates, such as "hold all findings for the final
  response", where a person watches the work.
- Anti-formatting rules written for models that over-formatted.
- "Use tools when helpful" for anything whose correctness depends on retrieval.
- Blanket "test everything" or "expand coverage" wording.
- Reasoning choreography such as "list five hypotheses, then score them" on ordinary work.
  Multistep research is the exception: Anthropic's best practices recommend competing
  hypotheses with tracked confidence there.
- Asking the model to write out its thinking or reasoning. It can be declined as
  `reasoning_extraction`. Ask for a short explanation or a summary of the actions taken.
- Deleting or rewording a reminder already sent. It is a history edit.
- `thinking` set to `disabled` or with `budget_tokens`, forced `tool_choice`, an assistant
  prefill, and sampling parameters. Each returns a 400.

## Effort

Effort levels are `low`, `medium`, `high` (default), `xhigh`, `max`. Start at `high` and rerun
the sweep even if one was run on Fable 5: level names do not mean the same amount of
thinking across models.

- The gains over Fable 5 show at every level and are largest at the higher ones. At
  `medium`, results roughly match Fable 5 at lower cost, so step down where quality holds.
- At `low`, Fable 5.1 is often competitive with Opus and Sonnet models on cost per task
  while scoring higher. Compare it before choosing a smaller model at higher effort.
- `low` calls search and retrieval tools less often. Raise effort for research turns.
- At `high` and above, set a large `max_tokens`. At `xhigh` and `max`, long deliverables can
  be drafted twice (see above).

## Delegation template

```text
Objective:
[One concrete deliverable.]

Scope:
[What changes. What must stay untouched. Pre-existing problems are reported as
follow-ups, not fixed.]

Autonomy:
You are operating autonomously. The user is not watching in real time and cannot answer
questions mid-task. Proceed on reversible actions that follow from the request. Stop only
for destructive actions or genuine scope changes: [list any specific confirmations].

Evidence:
[What must be inspected or retrieved before any claim.]

Done when:
[Observable conditions.]

Return:
[Exact handoff shape the caller needs.]

[For coding or computer-use loops, as the last line:]
First privately list what you need next; then request every item that doesn't depend on
another's result in this one response.
```

## Failure-mode adjustments

- Ends on "Next, I'll ..." or asks permission for requested work: add the autonomy block,
  then the delivering-work block.
- Quiet for minutes: request `display: "updates"`, remove update suppressors, then add the
  progress line where a person watches.
- One tool call per turn in a coding or computer-use loop: append the batching sentence
  after each round of tool results.
- Answers from memory: raise effort for those turns, or add the name-verification block.
- Unrequested fixes or extra test files: add the coding-scope block.
- Whole files rewritten for small changes: add the targeted-edit line.
- Dense prose: add the mannered-prose definition to a user message.
- Too little structure in chat: remove anti-formatting rules and add the formatting rule.
- Unmarked quotations in summaries: add one complete correct example.
- Long wait or truncation on a long deliverable: run at `high`, or add the single-limit
  note with the real `max_tokens`.
- `refusal` on benign coding work: change compile-check phrasing, add language docs, or
  remove base64 tool output. With `reasoning_extraction`: remove instructions to show
  reasoning.
- 400 "bound to a different conversation": the harness edited history. Make it
  append-only.
- 400 on `thinking`, `tool_choice`, a prefill or a sampling parameter: remove the field.

## Provenance

Last cross-checked: 2026-11-13. Sources:

- Prompting Claude Fable 5.1, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1
  Source of every block in this file (dashes adjusted to hyphens), the effort guidance,
  the batching placement rule, the progress-update order, the append-only rules, the
  compaction instruction, the subagent setup, the vision guidance, the safeguard triggers
  and the `reasoning_extraction` note. The page's "might or might not" wording is the
  source of the prefix-check bullet.
- Claude Fable 5.1 overview, fetched 2026-11-13:
  https://platform.claude.com/docs/en/models/fable-5-1/overview
  Confirms always-on adaptive thinking, the `high` default, and that Fable 5.2 succeeds it.
- Prompting best practices, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
  Source of the competing-hypotheses exception for research.
- Migrating to Claude Fable 5.1 and Migrating to Claude Fable 5.1 from Claude Fable 5
  (copy bundled with the claude-api skill, read 2026-11-13): source of the 400s on
  disabled thinking, `budget_tokens`, forced `tool_choice`, prefill and sampling, the
  `max_tokens` limit on thinking plus reply, which models read its thinking blocks, the
  measure-first and "privately" notes on batching, the low-effort vision note, the advice
  to keep verification lines, and the two Mythos 5.1 differences.

The note on where system-prompt text goes in a Claude Code task prompt, the note that
progress updates matter only where a person watches the subagent, the class-of-claims
retrieval rule, and the "Delegation template" are this skill's own heuristics.
