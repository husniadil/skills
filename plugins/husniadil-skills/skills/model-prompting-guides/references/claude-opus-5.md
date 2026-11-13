# Claude Opus 5 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Opus 5
(`claude-opus-5`). Claude Opus 5.5 succeeds it, and Anthropic says Opus 5 prompts perform
well there without changes. Use [claude-opus-5.5.md](claude-opus-5.5.md) for
`claude-opus-5-5`. This file stays for agents still running Opus 5.

What the API does on this model, which decides what a prompt can rely on:

- Adaptive thinking is on when `thinking` is omitted. `thinking: {"type": "disabled"}` is
  accepted only at effort `high` or below, and returns a 400 at `xhigh` or `max`.
  `budget_tokens` returns a 400.
- Thinking counts toward `max_tokens`, so a limit sized for a thinking-off route can cut the
  reply off.
- `temperature`, `top_p`, and `top_k` return a 400. So does an assistant prefill.
- Mid-conversation system messages are supported, with no beta header.
- Safety classifiers can decline a request with `stop_reason: "refusal"`. A prompt that asks
  the model to write out its reasoning can be declined as `reasoning_extraction`.

## Always include

- The final outcome and an observable done condition.
- Authority over routine reversible decisions, and a narrow list of reasons to stop.
- An explicit scope boundary for narrow tasks. Opus 5 otherwise adds steps nobody asked for,
  or decides for itself what the task should be.
- A length instruction when the length of the reply matters. Lowering effort reduces
  thinking, and does not reliably shorten what the model writes.

```text
Deliver what was asked, at the scope intended. Make routine judgment calls yourself, and
check in only when different readings of the request would lead to materially different
work. If the request seems mistaken or a better approach exists, say so in a sentence and
continue with the task as asked rather than quietly narrowing, widening, or transforming it.
Finish the whole task, and stop short of actions that are clearly beyond what was asked.
```

```text
Keep responses focused, brief, and concise. Keep disclaimers and caveats short, and spend
most of the response on the main answer. When asked to explain something, give a high-level
summary unless an in-depth explanation is specifically requested.
```

In a long system prompt, repeat the length instruction in one line near the end:

```text
<tone_preference>
Keep outputs reasonably concise.
</tone_preference>
```

## Include when applicable

### Agentic narration

Opus 5 narrates readily during agentic work, announcing what it is about to do, and its
messages in agentic sessions run longer than earlier models'. Describe the cadence you want
instead of banning narration:

```text
Before your first tool call, say in one sentence what you're about to do. While working,
give a brief update only when you find something important or change direction. When you
finish, lead with the outcome: your first sentence should answer "what happened" or "what
did you find," with supporting detail after it for readers who want it.
```

### Written deliverables

Files Opus 5 writes to disk (reports, Markdown documents, summaries) also run long:

```text
Match the length of written documents to what the task needs: cover the substance, but do
not pad with filler sections, redundant summaries, or boilerplate.
```

### Subagent delegation

Opus 5 delegates to subagents more readily than earlier models, which multiplies cost and
time on small tasks. If the subagent can spawn its own, cap it:

```text
Delegate to a subagent only for large tasks that are genuinely independent and
parallelizable, such as a wide multi-file investigation. Do not delegate work you can finish
yourself in a handful of tool calls, and do not use subagents to verify or double-check your
own work. If one subagent can complete the task, use one rather than several, and keep spawn
counts low.
```

In Claude Code and the Agent SDK, the hard caps are the
`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` and `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`
environment variables and the SDK's `max_budget_usd` option.

### Correction narration

Opus 5 narrates corrections to its own earlier statements more than earlier models:

```text
Only correct an earlier statement when the error would change the user's code,
conclusions, or decisions. State corrections plainly and briefly, then continue the task.
For slips that change nothing for the user, make the fix and move on without noting it.
```

### Code review

Opus 5 follows a stated bar literally, so "only report high-severity issues" or "be
conservative" makes it report less. Ask for coverage and filter in a later pass:

```text
Report every issue you find, including ones you are uncertain about or consider
low-severity. Do not filter for importance or confidence at this stage - a separate
verification step will do that. Your goal here is coverage: it is better to surface a
finding that later gets filtered out than to silently drop a real bug. For each finding,
include your confidence level and an estimated severity so a downstream filter can rank
them.
```

Review accuracy holds at lower effort, so a fast pass at review time and a thorough pass
later both work.

### Visual inputs

For charts, documents, diagrams, and UI replication, give the subagent tools to analyze,
crop, and check its own work. On this model tool use is a more cost-effective lever than
more thinking. Re-test vision workarounds written for earlier models before keeping them.

### Stale summaries next to primary sources

When the subagent can see both a summary and the files it summarizes, add this block. In
this skill's probe it stopped Opus 5 from quoting a stale summary for details it had not
opened the primary file for (see Provenance):

```text
Inspect the implementation and its tests for code behavior. Retrieve current sources for
facts that change over time. Use secondary summaries only to locate primary material.
```

### Thinking disabled

Prefer adaptive thinking at `low` effort: on most tasks it beats thinking disabled at a
similar cost. If a route must keep thinking off, two artifacts can appear: a tool call
written as plain text that never runs, and `<thinking>` or other internal tags in the reply.
One instruction covers both:

```text
When you use a tool, you may say a brief sentence first. If no tool can express what the
user asked for, say so instead of guessing. Do not include internal or system XML tags in
your response.
```

Do not name thinking tags in the prompt. The general wording works better.

## Avoid

- Verification instructions such as "include a final verification step" or "use a subagent
  to verify". Opus 5 verifies its own work, and these cause over-verification. Removing them
  costs no quality. Name a concrete acceptance check when one is required.
- Re-check phrasing such as "double-check your answer" or "re-verify before responding". It
  stacks on the model's own self-correction and adds cost without improving results.
- Step-by-step reasoning scripts such as "generate five hypotheses, then score them" on
  ordinary work. Opus 5 plans without them.
- Asking the model to write out its thinking or reasoning, verbatim or in a fixed format. It
  can be declined as `reasoning_extraction`. Ask for a short explanation of the answer, or
  read `display: "summarized"` thinking.
- Rules telling the model not to think or not to reason. With thinking disabled they increase
  tag leakage.
- "Delegate more" guidance carried over from Opus 4.8.
- `temperature`, `top_p`, `top_k`, `budget_tokens`, and an assistant prefill. Each returns a
  400.

## Effort

Effort levels are `low`, `medium`, `high` (default), `xhigh`, `max`.

- Start at `high`, then sweep down. `low` and `medium` give strong quality at a fraction of
  the tokens and latency, so use them as the main control for cost and response time
  wherever quality holds.
- Step up to `xhigh` for demanding coding and agentic work. Keep `max` for measured wins: it
  can show diminishing returns and overthink simpler tasks.
- Effort changes how much the model thinks. It does not reliably change reply length, so
  prompt for concision separately.
- At `xhigh` or `max`, set `max_tokens` to at least 64K.
- Thinking can be disabled only at `high` or below. Prefer thinking on at `low` over
  thinking off at a similar cost.
- Effort values carried over from an earlier model rarely fit. Re-run the sweep.

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
Keep dependent steps sequential.

Done when:
[Observable conditions.]

Return:
[Result first, then the decisions, the checks that were run, and open risks.]
```

## Failure-mode adjustments

- Scope creep: add the scope block.
- Over-verification or repeated re-checking: delete the verification and re-check
  instructions rather than adding a stopping rule on top of them.
- Too many subagents: add the delegation block, or set a hard cap in the harness.
- Long replies: add the length block, plus the one-line reminder near the end of a long
  system prompt.
- Too much narration during agentic work: add the narration block instead of a ban.
- Long documents on disk: add the written-deliverables block.
- Correction thrash: add the correction block.
- Low review recall: remove the severity bar and ask for coverage.
- `stop_reason: "refusal"` with `reasoning_extraction`: remove instructions to show
  reasoning in the reply.
- A tool call as plain text, or internal tags in the reply: turn thinking on and lower
  effort, or add the thinking-disabled instruction.
- Truncated reply: raise `max_tokens`, since thinking counts toward it.
- 400 on `thinking: {"type": "disabled"}`: lower effort to `high` or below, or turn thinking
  on.

## Provenance

Last cross-checked: 2026-11-13. Sources:

- Prompting Claude Opus 5, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5
  Source of the scope, length, `tone_preference`, narration, written-deliverables,
  delegation, correction, and thinking-disabled blocks, the Claude Code subagent caps, the
  verification and re-check rules, the `reasoning_extraction` rule, the vision guidance, the
  effort guidance, and the thinking-disabled facts.
- Prompting Claude Opus 4.8, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8
  Source of the code-review block text. The Opus 5 page states the same rule without a
  snippet.
- Effort, fetched 2026-11-13:
  https://platform.claude.com/docs/en/build-with-claude/effort
  Source of the 64K `max_tokens` starting point at `xhigh` and `max`, and confirms the
  effort guidance.
- Claude Opus 5.5 migration guide, fetched 2026-11-13:
  https://platform.claude.com/docs/en/models/opus-5-5/migration-guide
  Source of the prefill 400 ("Claude Opus 4.6 and later Opus models") and the sampling 400.
- Migrating to Claude Opus 5 (copy bundled with the claude-api skill, read 2026-11-13):
  source of the Avoid item about "delegate more" guidance carried over from Opus 4.8.

The stale-summary block, the reasoning-script Avoid item, and the "Delegation template" are
this skill's own heuristics.

Probe run by this skill on 2026-11-13, Opus 5 at `high` effort, $1.49: 12 small service docs
and a `SUMMARY.md` that was stale on three values, 5 lookup questions, 3 runs per arm, with
and without the stale-summary block and a parallel-work line ("Run independent reads,
searches, and analyses in parallel. Keep dependent decisions and mutations sequential.").
All 30 answers were correct, and every run opened both the summary and the primary files.
Asked for checkout's dependencies, every run without the block also gave their own
dependencies' timeouts from the stale summary (fraud at 2000 ms, against 4000 ms in its own
file), and every run with it opened those files instead. Both arms read files in parallel,
and the parallel-work line made no consistent difference, so it was removed from this guide
and from the template.
