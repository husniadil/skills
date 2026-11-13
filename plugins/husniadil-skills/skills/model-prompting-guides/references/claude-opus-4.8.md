# Claude Opus 4.8 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Opus 4.8
(`claude-opus-4-8`). Claude Opus 5 and Claude Opus 5.5 succeed it. This file stays for agents
still running Opus 4.8.

What the API does on this model, which decides what a prompt can rely on:

- Thinking is off unless the request sets `thinking: {"type": "adaptive"}`. Adaptive is the
  only way to turn it on. `budget_tokens` returns a 400.
- With thinking disabled, the model sometimes writes its reasoning into the visible reply.
- `temperature`, `top_p`, and `top_k` return a 400. So does an assistant prefill.
- Mid-conversation system messages are supported, with no beta header.
- Thinking text is empty by default (`display: "omitted"`). Set `display: "summarized"` to
  read it.

## Always include

- The scope of every global rule, in words. Opus 4.8 reads a prompt literally, most of all at
  lower effort. It does not carry a rule shown on one item to the others, and it does not act
  on a request you did not make.
- When to use each tool, and why. The model favors reasoning over tool calls, so a tool it is
  not told to use gets used less than you want.
- The task, the intent, and the constraints, all in the first turn. Opus 4.8 reasons more
  after each user turn, and details revealed over several turns lower token efficiency and
  sometimes quality.
- An observable done condition and the exact return format.

```text
Apply this formatting to every section, not just the first one.
```

```text
Use [tool] when [condition], because [what it establishes that reasoning alone cannot].
```

## Include when applicable

### Verbosity

Opus 4.8 sizes its reply to how complex it judges the task: short on lookups, much longer on
open-ended analysis. When the parent needs a particular length:

```text
Provide concise, focused responses. Skip non-essential context, and keep examples minimal.
```

For a specific kind of over-explaining, add a line that names it and show one reply at the
right length. Positive examples work better than a list of what to avoid.

### Search and retrieval

Raise effort first. `high` and `xhigh` show much more tool use in agentic search and coding.
If the subagent still answers from memory, say when it must search:

```text
For questions where current information would change the answer (recent events, current
roles or prices, version-specific behavior, or anything the user flags as time-sensitive)
search before answering rather than answering from memory. For open-ended research requests,
begin searching immediately; do not ask a scoping question first unless the request is
genuinely ambiguous about what to research.
```

### Autonomy on small decisions

A subagent cannot ask the user, and Opus 4.8 tends to pause on minor choices. Grant the small
ones and keep the large ones:

```text
For minor choices (naming, formatting, default values, which approach among equivalents),
pick a reasonable option and note it rather than asking. For scope changes or destructive
actions, still ask first.
```

In a delegation, "ask first" means return to the parent with the question.

### Subagent delegation

Opus 4.8 spawns fewer subagents than earlier models. If the subagent can spawn its own, say
when to:

```text
Do not spawn a subagent for work you can complete directly in a single response (e.g.
refactoring a function you can already see).

Spawn multiple subagents in the same turn when fanning out across items or reading multiple
files.
```

### Code review

Opus 4.8 follows a stated severity bar faithfully. It investigates as deeply, finds the bugs,
and leaves out the ones below your bar, so measured recall drops. Ask for coverage and filter
in a later step:

```text
Report every issue you find, including ones you are uncertain about or consider
low-severity. Do not filter for importance or confidence at this stage - a separate
verification step will do that. Your goal here is coverage: it is better to surface a
finding that later gets filtered out than to silently drop a real bug. For each finding,
include your confidence level and an estimated severity so a downstream filter can rank
them.
```

If one pass must filter, make the bar concrete: report any bug that could cause incorrect
behavior, a test failure, or a misleading result, and omit only nits like pure style or
naming.

### Tone

Anthropic's sources disagree on the default voice. One calls it direct and opinionated, the
other warmer and less hedged. If the output voice matters, state it:

```text
Use a warm, collaborative tone. Acknowledge the user's framing before answering.
```

### Design and frontend work

The model has a persistent house style: cream or off-white backgrounds, serif display type,
italic word accents, a terracotta or amber accent. A general instruction such as "not cream"
or "clean and minimal" moves it to another fixed look. Two things work:

- Give a concrete system: palette hex values, typeface, spacing, corner radius, layout, and
  motion.
- Have the model propose options first. A subagent cannot ask the user, so it returns the
  options and the parent picks:

```text
Before building, propose 4 distinct visual directions tailored to this brief (each as: bg
hex / accent hex / typeface, plus a one-line rationale). Return them without building
anything. Implement a direction only when the parent names one.
```

To steer away from the generic look, Anthropic's directive works next to either approach:

```text
<frontend_aesthetics>
NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto,
Arial, system fonts), cliched color schemes (particularly purple gradients on white or dark
backgrounds), predictable layouts and component patterns, and cookie-cutter design that
lacks context-specific character. Use unique fonts, cohesive colors and themes, and
animations for effects and micro-interactions.
</frontend_aesthetics>
```

### Steering adaptive thinking

Applies only with `thinking: {"type": "adaptive"}` set. Large or complex system prompts make
thinking trigger more often. If the subagent thinks more than the task needs, measure first,
then add:

```text
Thinking adds latency and should only be used when it will meaningfully improve answer
quality - typically for problems that require multistep reasoning. When in doubt, respond
directly.
```

### Low effort on a multistep task

If effort has to stay at `low`:

```text
This task involves multistep reasoning. Think carefully through the problem before
responding.
```

### Thinking disabled

If the route runs without thinking and reasoning leaks into the reply:

```text
Respond only with your final answer. Do not include exploratory reasoning, intermediate
drafts, diffs you considered but rejected, or meta-commentary about your process.
```

## Avoid

- Interim-status scaffolding such as "after every 3 tool calls, summarize progress". Opus 4.8
  already gives regular updates. Describe the update you want and show an example instead.
- Prompting around shallow reasoning ("think harder"). Raise effort instead.
- A conservative reporting bar in a review prompt ("only high-severity issues", "be
  conservative", "don't nitpick").
- General design direction ("don't use cream", "make it clean"). It swaps one default for
  another.
- Negative-only style instructions. State the wanted style and show it.
- `temperature`, `top_p`, or `top_k` for tone or design variety. They return a 400. Use the
  options prompt for variety.
- `budget_tokens`, and an assistant prefill. Both return a 400.

## Effort

Effort levels are `low`, `medium`, `high` (default), `xhigh`, `max`. Effort matters more on
Opus 4.8 than on any earlier Opus, and the model respects it strictly at the low end.

- `xhigh` for coding and agentic work. `high` is the minimum for intelligence-sensitive
  tasks.
- `medium` for cost-sensitive work. `low` only for short, scoped, latency-sensitive tasks.
  At `low` and `medium` the model keeps to what was asked, and at `low` it might under-think
  a moderately complex task.
- `max` can help on the hardest tasks, with diminishing returns, and can overthink.
- Higher effort also raises tool use. Use it as the first lever when tools undertrigger.
- At `xhigh` or `max`, set a large `max_tokens`, starting at 64K, so the model has room to
  think and act across tool calls and subagents.
- In interactive coding products, `high` or `xhigh` plus fewer required user turns gives the
  best mix of quality and token use.

## Delegation template

```text
Objective:
[One concrete deliverable.]

Scope:
[In scope. Out of scope. Which rules are global, and the items they cover.]

Tool policy:
[When each tool applies, and why.]

Execution:
Complete all unblocked work before returning a question. Apply every stated constraint to
every affected file. Make minor reversible choices yourself and note them.

Done when:
[Observable conditions.]

Return:
[Exact format, and the level of detail wanted.]
```

## Failure-mode adjustments

- A rule applied only to the first item: name every item it covers, or say "every ... not
  just the first".
- Too few tool calls or shallow research: give the trigger and the reason, raise effort, then
  add the search block.
- Asks about minor choices: add the autonomy block.
- Too few subagents: add the delegation block.
- Shallow work on a hard task: raise effort to `high` or `xhigh`.
- Shallow work at `low` that has to stay at `low`: add the low-effort line.
- Response too long or too short: state the wanted length and show a reply at that length.
- Reasoning in the reply with thinking off: turn adaptive thinking on, or add the final-answer
  line.
- A review finds too little: remove the severity bar and ask for coverage.
- The same design every time: give a concrete system, or have the subagent return options
  first.
- 400 on `temperature`, `top_p`, `top_k`, `budget_tokens`, or a prefill: remove the field.
