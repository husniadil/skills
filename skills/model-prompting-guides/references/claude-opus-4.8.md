# Claude Opus 4.8 prompting guide

Rules for writing a task prompt for an agent or subagent running Claude Opus 4.8.

## Always include

- Explicit scope for every global rule. Opus 4.8 reads instructions literally, especially
  at lower effort, and does not generalize a rule shown on one item to the rest.
- Concrete tool triggers with the reason each tool exists. The model favors reasoning over
  tool calls, so "use tools when helpful" undertriggers.
- A verbosity instruction if response length matters. The model sizes its answer to how
  complex it judges the task, so length varies widely without one.
- An observable done condition and the exact return format.

```text
Apply this rule to every affected file, section, and item. The example illustrates the
rule; it does not limit its scope.
```

```text
Provide concise, focused responses. Skip non-essential context, and keep examples minimal.
```

## Include when applicable

### Tool use

```text
Use [tool] when [condition], because [what it establishes that reasoning alone cannot].
Inspect the repository before answering questions about implementation details that can
be verified locally.
```

If tool use is still too low, raise effort to `high` or `xhigh` before adding more prompt
text; those levels call tools substantially more in search and coding.

### Subagent delegation

Opus 4.8 spawns fewer subagents by default. Say when delegation is wanted:

```text
Do not spawn a subagent for work you can complete directly in a single response.
Spawn multiple subagents in the same turn when fanning out across items or reading
multiple files.
```

### Code review

Opus 4.8 honors a stated severity bar faithfully. A conservative prompt lowers reported
findings even though the bugs were found.

```text
Report every issue you find, including ones you are uncertain about or consider
low-severity. Do not filter for importance or confidence at this stage; a separate
verification step will do that. For each finding, include your confidence level and an
estimated severity so a downstream filter can rank them.
```

If a single pass must self-filter, define the bar concretely: report anything that could
cause incorrect behavior, a test failure, or a misleading result, and omit pure style nits.

### Tone

The default voice is direct and opinionated, with little validation and sparse emoji. If
a warmer voice is wanted, state it positively:

```text
Use a warm, collaborative tone. Acknowledge the user's framing before answering.
```

### Design and frontend work

The model has a persistent house style: cream backgrounds, serif display type, terracotta
accents. Generic direction such as "not cream" or "clean and minimal" moves it to another
fixed default. Either specify a concrete system (palette hex values, type, spacing, radius,
motion, layout), or ask for options first:

```text
Before building, propose 4 distinct visual directions tailored to this brief, each as
background hex, accent hex, typeface, and a one-line rationale. Ask the user to pick one,
then implement only that direction.
```

### Interactive coding products

Opus 4.8 reasons more after each user turn, so a fully specified first turn beats a
conversation that fills gaps later. Put task, intent, and constraints in the first message.

### Steering adaptive thinking

Thinking is off unless enabled. When enabled, it triggers more under large system prompts
and can be steered:

```text
Thinking adds latency and should only be used when it will meaningfully improve answer
quality, typically for problems that require multistep reasoning. When in doubt, respond
directly.
```

### Low effort on a multistep task

```text
This task involves multistep reasoning. Think carefully through the problem before
responding.
```

## Avoid

- Interim-status scaffolding such as "summarize progress after every 3 tool calls". Opus
  4.8 already gives regular updates; describe the shape you want with an example instead.
- Negative-only style instruction. Positive examples of the wanted voice work better.
- Relying on sampling parameters for variety in design work. Use the options prompt.
- Prompting around shallow reasoning at low effort. Raise effort instead.

## Effort

Effort levels are `low`, `medium`, `high`, `xhigh`, `max`. Effort matters more on Opus
4.8 than on any earlier Opus, and the model respects it strictly at the low end.

- `xhigh` for coding and agentic work. `high` is the minimum for intelligence-sensitive
  tasks.
- `medium` for cost-sensitive work. `low` only for short, scoped, latency-sensitive tasks.
  At `low` and `medium` the model scopes itself to exactly what was asked.
- `max` can help on the hardest tasks but shows diminishing returns and can overthink.
- Higher effort also raises tool usage. Use it as the first lever for undertriggering.

## Delegation template

```text
Objective:
[One concrete deliverable.]

Scope:
[In scope. Out of scope. Which rules apply to every item.]

Tool policy:
[Exact conditions that require each tool, and why.]

Delegation:
[When to fan out to subagents, if at all.]

Execution:
Complete all unblocked work before asking a question. Apply every stated constraint to
every affected file.

Done when:
[Observable conditions.]

Return:
[Exact format, and the level of detail wanted.]
```

## Failure-mode adjustments

- A rule applied only to the first item: mark the rule global in words.
- Too few tool calls: give the trigger and reason, then raise effort.
- Too few subagents: add the delegation block.
- Shallow work on a hard task: raise effort to `high` or `xhigh`.
- Response too long or too short: state the wanted length with a positive example.
- Low review recall: remove the severity filter from the finding stage.
- Same design every time: specify the system or ask for options first.

## Provenance

Last cross-checked: 2026-09-12. Sourced from the official Claude Opus 4.8 prompting guide
(platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8)
and the cross-model Claude prompting best practices.
