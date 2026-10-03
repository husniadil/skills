# GPT-5.6 prompting guide

Rules for writing a task prompt for an agent or subagent running GPT-5.6 Sol
(`gpt-5.6-sol`), GPT-5.6 Terra (`gpt-5.6-terra`), or GPT-5.6 Luna (`gpt-5.6-luna`).

OpenAI publishes one prompting guide for the whole GPT-5.6 family rather than one per
variant, so the rules below apply to all three. Where a rule comes from the Codex agent
prompts rather than that guide, it is marked as a Codex convention.

## Always include

- One concrete deliverable, the success criteria that must be true before answering, and
  the stopping condition.
- Scope: what changes, what stays untouched.
- What each request authorizes: inspect and report, or change and validate.
- Exact tool triggers and which source is authoritative when two disagree.
- The exact return format the caller needs.

```text
Success means: [what must be true]. Resolve the request in the fewest useful tool loops,
but do not let loop minimization outrank correctness, required evidence, calculations, or
required citations. After each result, judge whether the core request can already be
answered with the evidence in hand. Name any fact you could not establish rather than
guessing at it.
```

```text
For answer, explain, and review requests: inspect the materials and report. Do not
implement unless asked. For change, build, and fix requests: make in-scope local changes
and run non-destructive validation without asking first. Require confirmation for
external writes, destructive actions, and scope expansion.
```

```text
Inspect the smallest relevant slice of code before making a claim about current behavior.
Treat the implementation and its tests as authoritative for existing behavior, and the
user's request as authoritative for desired behavior.
```

```text
Parallelize independent reads. Keep dependent edits and follow-up decisions sequential.
```

## Include when applicable

### Progress updates

```text
Before tool calls for a multi-step task, send a one- or two-sentence user-visible update
stating the first step. During the task, update only when a major phase begins or a
finding changes the plan. Do not narrate routine tool calls.
```

### Retrieval budget

```text
Start with one broad search using short, discriminative keywords. Make another retrieval
call only when a required fact, owner, date, ID, or source is missing, when the user asked
for exhaustive coverage or comparison, when a specific artifact must be read, or when an
important claim would otherwise be unsupported. Do not search again only to improve
phrasing or add nonessential detail.
```

### Grounding and citations

```text
Cite only sources you actually retrieved, attach each citation to the claim it supports,
label inference separately from directly supported fact, and state conflicts between
sources. Narrow the answer or report the missing evidence rather than filling the gap.
```

### Coding (Codex convention)

```text
Fix root causes and keep the change focused. Do not refactor unrelated code, rename
things that were not asked about, or add comments that were not requested. Follow the
conventions already in the repository and any applicable AGENTS.md before editing. Do not
commit or create branches unless asked.
```

### Verification

```text
After changes, run the validation that fits: targeted tests for the changed behavior,
type and lint checks, a build check, or a minimal smoke test. If validation cannot run,
say why and describe the next-best check. Do not repair unrelated failures; report them.
```

### Response length

GPT-5.6 is already more concise by default than GPT-5.5, so a broad "be concise" line can
make answers too short. Set the default level of detail with the `text.verbosity`
parameter and keep the prompt for task-specific shape.

```text
Lead with the conclusion. Include supporting evidence, material caveats, and the next
action. Omit secondary detail and repetition.
```

## Avoid

- Repeating rules such as "ask first", "do not mutate", or "wait for approval". Repetition
  produces unnecessary approval requests for safe, expected actions.
- ALWAYS, NEVER, must, and only for anything that is not a true invariant. Reserve them for
  safety rules, required fields, and actions that must never happen.
- Process instructions for behavior the model already performs reliably.
- Prescribing every step. Describe the destination and the constraints instead.
- Vague persona labels such as "friendly" or "empathetic". Name the writing choices.
- Blanket re-verification after a check has already passed.

## Effort

Reasoning levels are `none`, `low`, `medium` (default), `high`, `xhigh`, `max`. Before
raising the level, check whether the prompt is missing a success criterion, a dependency
rule, a tool-routing rule, or a verification loop. Test the current level and one level
lower on real tasks before settling.

## Delegation template

```text
Goal:
[The user-visible outcome.]

Success criteria:
[What must be true before answering.]

Scope:
[In scope. Untouched.]

Authority:
[Which actions are pre-authorized; what needs confirmation.]

Tools:
[Which tools, when, and what not to use. Which source wins on conflict.]

Output:
[Sections, length, format.]

Stop rules:
[When to retry, fall back, ask, or stop.]
```

## Failure-mode adjustments

- Plans but does not execute: state that the request authorizes the change, and define
  done as an artifact.
- Asks for routine confirmation: remove repeated approval language and name the safe local
  actions explicitly.
- Explores too widely: apply the retrieval budget above.
- Verification sprawls: name the checks that matter and the stopping condition.
- Answers too short: remove blanket brevity lines and raise `text.verbosity`.
- Weak reasoning: add the missing success criterion or tool-routing rule before raising the
  reasoning level.

## Provenance

Last cross-checked: 2026-09-12. Sourced from OpenAI's prompting guidance for GPT-5.6
(developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6), which covers the GPT-5.6
family, the Sol, Terra, and Luna model pages, and the Codex agent prompts in
openai/codex. OpenAI does not publish separate prompting guidance for Sol, Terra, and Luna
individually, and the docs describe no prompting-relevant behavioral difference between
them.
