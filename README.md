# husniadil-skills

Agent skills for Claude Code, Codex, and other skill-aware agents.

- **model-prompting-guides**: per-model prompting rules an agent reads before delegating
  to a subagent or writing a prompt for a specific model. Covers Claude Fable 5.1, Fable 5,
  Opus 5, Opus 4.8, Sonnet 5, Haiku 4.5, GPT-5.6 (Sol, Terra, Luna), and GPT-6 Astra.

## Install

Claude Code plugin marketplace:

```text
/plugin marketplace add husniadil/skills
/plugin install husniadil-skills@husniadil-skills
```

Manual: copy any folder under `skills/` into your agent's skills directory
(`~/.claude/skills/`, `.claude/skills/`, `.agents/skills/`, or the equivalent).

## Skills

### model-prompting-guides

Each reference in `skills/model-prompting-guides/references/` has the same shape:

1. Always include
2. Include when applicable
3. Avoid
4. Effort levels and what they change
5. Delegation template
6. Failure-mode adjustments
7. Provenance and last cross-check date

The guides say how to prompt a model, not which model to pick. One file per model version,
named in full (`claude-opus-5.md`, `gpt-6-astra.md`). A new version gets a new file, and
older files stay for agents still running that model.

## Updating a guide

For a new model version, add a new reference from the provider's official prompting page
and link it in `SKILL.md`. For an existing one, edit in place and bump the
`Last cross-checked` date in its Provenance section. Keep the 4 metadata files in sync:
`plugin.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`,
`package.json`.

## License

MIT
