# Claude Sonnet 5 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Sonnet 5
(`claude-sonnet-5`). Claude Sonnet 5.5 succeeds it, and Anthropic says Sonnet 5 prompts
perform well there without changes. Use [claude-sonnet-5.5.md](claude-sonnet-5.5.md) for
`claude-sonnet-5-5`. This file stays for agents still running Sonnet 5.

What the API does on this model, which decides what a prompt can rely on:

- Adaptive thinking is on when `thinking` is omitted. `thinking: {"type": "disabled"}` is
  accepted. `budget_tokens` returns a 400.
- `temperature`, `top_p`, and `top_k` at a non-default value return a 400. On API version
  `2026-10-21` any value does.
- An assistant prefill returns a 400.
- Mid-conversation system messages and the thinking-block conversation binding arrive with
  Sonnet 5.5. Neither applies here.
- The tokenizer produces about 30% more tokens for the same text than Sonnet 4.6 did.

## Always include

- The scope of every global rule, in words. Sonnet 5 reads a prompt literally, especially at
  lower effort. It does not carry a rule shown on one item to the others, and it does not
  act on a request you did not make.
- When and how each tool applies, and why. Without that, the model uses a tool less often
  than you want.
- Observable acceptance criteria.
- An exact output contract when another agent or a parser reads the result. The literal
  reading helps here, because the model keeps to the schema you give it.

```text
Apply this formatting to every section, not just the first one.
```

```text
Use [tool] when [condition], because [reason]. Do not answer [class of claim] from memory.
```

## Include when applicable

### Delegation prompt as the first turn

A subagent usually gets one turn. Put the task, the intent, and the constraints in it.
Anthropic reports that requirements revealed over several turns lower token efficiency and
sometimes performance. Keep the details a reader would otherwise have to ask for.

### Verbosity

Sonnet 5 sizes its reply to the task: shorter on lookups, longer on open-ended analysis.
When the parent needs a particular length:

```text
Provide concise, focused responses. Skip non-essential context, and keep examples minimal.
```

For a specific kind of over-explaining, add a line that names it and show one reply at the
right length. Positive examples work better than a list of what to avoid.

### Autonomy

A subagent cannot ask the user. Say what it decides and what it returns to the parent.

```text
Make routine reversible decisions yourself. Return to the parent only when missing
information changes the result or before an irreversible external action.
```

### Structured output

```text
Return JSON only, matching this schema. Do not add keys outside it and do not wrap it in
Markdown. The schema applies to every element.
```

### Code review

A stated severity bar lowers recall. Sonnet 5 investigates as deeply, finds the bugs, and
leaves out the ones below your bar. Ask for coverage and filter in a later step:

```text
Report every issue you find, including ones you are uncertain about or consider
low-severity. Do not filter for importance or confidence at this stage. A separate
verification step will do that. Your goal here is coverage: it is better to surface a
finding that later gets filtered out than to silently drop a real bug. For each finding,
include your confidence level and an estimated severity so a downstream filter can rank
them.
```

The text works without a second step, though a separate filter often helps. If one pass
must filter, make the bar concrete: report any bug that could cause incorrect behavior, a
test failure, or a misleading result, and omit only nits like pure style or naming.

### Design and frontend work

The model settles on one default look for open briefs. A general instruction such as "make
it clean and minimal" moves it to a different fixed look. Two things work:

- Give a concrete system: palette hex values, typeface, spacing, corner radius, layout, and
  motion.
- Have the model propose options first. In a delegation the subagent cannot ask the user,
  so it returns the options and the parent picks:

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

Large or complex system prompts make thinking trigger more often. If the subagent thinks
more than the task needs, measure first, then add:

```text
Thinking adds latency and should only be used when it will meaningfully improve answer
quality, typically for problems that require multistep reasoning. When in doubt, respond
directly.
```

### Low effort on a multistep task

If effort has to stay at `low`:

```text
This task involves multistep reasoning. Think carefully through the problem before
responding.
```

## Avoid

- Interim-status scaffolding such as "summarize progress after every 3 tool calls". Sonnet 5
  already updates the user during long runs. Describe the update you want instead, and show
  an example.
- Prompting around shallow reasoning ("think harder"). Raise effort instead.
- A conservative reporting bar in a review prompt ("only high-severity issues", "don't
  nitpick").
- General design direction ("make it clean", "don't use that color"). It swaps one default
  for another.
- Negative-only style instructions. State the wanted style and show it.
- `temperature`, `top_p`, or `top_k` for tone or variety. They return a 400. Steer with the
  prompt.
- `budget_tokens`, and an assistant prefill. Both return a 400.
- A tool-use rule that depends on the model reaching for tools unprompted while thinking is
  off.

## Effort

Effort levels are `low`, `medium`, `high` (default), `xhigh`, `max`. Use `xhigh` for the
hardest coding and agentic work.

- Sonnet 5 respects effort strictly, most at the low end. At `low` and `medium` it keeps to
  what was asked. That saves latency and cost, and on a moderately complex task at `low` it
  might under-think. Raise effort to `high` or `xhigh` before adding prose.
- Tool use rises with effort. `high` and `xhigh` show much more tool use in agentic search
  and coding. With thinking disabled the model reaches for tools less, so add an explicit
  nudge there.
- Leave `max_tokens` headroom at `high`, `xhigh`, and `max`, up to the 128K cap. Thinking
  counts toward it. A response that is nearly all thinking followed by a truncated answer
  with `stop_reason: "max_tokens"` means the limit is too low. Raise it or drop to `medium`.
  A limit sized for Sonnet 4.6 might truncate here because of the tokenizer.
- Requests without a `thinking` field run adaptive thinking. Where a route ran thinking-off
  on Sonnet 4.6, try adaptive at `low` effort before disabling it.

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
every affected file. Make routine reversible decisions yourself.

Done when:
[Observable conditions.]

Return:
[Exact format, including schema if machine-read.]
```

## Failure-mode adjustments

- A rule applied only to the first item: name every item it covers, or say "every ... not
  just the first".
- Inconsistent tool use: give the condition, the reason, and raise effort. With thinking off,
  add a nudge.
- Shallow work on a hard task: raise effort to `high` or `xhigh`.
- Shallow work at `low` that has to stay at `low`: add the low-effort line.
- Truncated answer: raise `max_tokens`, or drop effort to `medium`.
- Over-explaining: add the verbosity line, then show a reply at the right length.
- A review finds too little: remove the severity bar and ask for coverage.
- The same palette on every design: give a concrete system, or have the subagent return
  options first.
- More thinking than the task needs: lower effort, or add the thinking-steering line and
  measure it.
- 400 on `temperature`, `top_p`, `top_k`, `budget_tokens`, or a prefill: remove the field.
