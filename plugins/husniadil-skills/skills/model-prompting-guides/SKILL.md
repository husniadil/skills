---
name: model-prompting-guides
description: Model-specific prompting rules for Claude Fable 5.1, Claude Fable 5, Claude Opus 5.5, Claude Opus 5, Claude Opus 4.8, Claude Sonnet 5.5, Claude Sonnet 5, Claude Haiku 4.5, GPT-5.6 (Sol, Terra, Luna), GPT-6 Astra, GPT-6 Sol, GPT-6 Luna, and GPT-6.1 Sol. Use before delegating to an agent or subagent that runs one of these models, and when writing or debugging a prompt, system prompt, tool policy, autonomy rule, or output contract for one of them.
---

# Model prompting guides

The model is already chosen. Load only the reference for the model that will execute the
prompt, then write the prompt with it. Each reference is self-contained: what to always
include, what to include conditionally, what to leave out, the effort levels and what they
change, a delegation template, and the fix for each known failure mode.

- Claude Fable 5.1: [references/claude-fable-5.1.md](references/claude-fable-5.1.md)
- Claude Fable 5: [references/claude-fable-5.md](references/claude-fable-5.md)
- Claude Opus 5.5: [references/claude-opus-5.5.md](references/claude-opus-5.5.md)
- Claude Opus 5: [references/claude-opus-5.md](references/claude-opus-5.md)
- Claude Opus 4.8: [references/claude-opus-4.8.md](references/claude-opus-4.8.md)
- Claude Sonnet 5.5: [references/claude-sonnet-5.5.md](references/claude-sonnet-5.5.md)
- Claude Sonnet 5: [references/claude-sonnet-5.md](references/claude-sonnet-5.md)
- Claude Haiku 4.5: [references/claude-haiku-4.5.md](references/claude-haiku-4.5.md)
- GPT-5.6 Sol, Terra, Luna: [references/gpt-5.6.md](references/gpt-5.6.md)
- GPT-6 Astra: [references/gpt-6-astra.md](references/gpt-6-astra.md)
- GPT-6 Sol, Luna: [references/gpt-6-sol-luna.md](references/gpt-6-sol-luna.md)
- GPT-6.1 Sol: [references/gpt-6.1-sol.md](references/gpt-6.1-sol.md)

Mythos 5.1 uses the Fable 5.1 reference and Mythos 5 uses the Fable 5 reference. OpenAI
publishes no guidance of their own for GPT-6 Sol, Luna, and GPT-6.1 Sol, so their references
carry its GPT-6 family guidance, written from Astra, and say so where it applies. Start
from the delegation template, keep only the conditional blocks the task needs, and check
the failure-mode list when a first attempt misbehaves. One file per model version: a new
version gets a new file, and older files stay for agents still running that model.
