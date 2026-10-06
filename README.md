# husniadil

Claude plugins by Husni Adil Makmur, in one marketplace named `husniadil`:

- **husniadil-skills**: skills, workflow commands, and effort-pinned subagents for Claude
  Code, Codex, and other skill-aware agents. The rest of this page is about it.
- **indonesian-holiday-calendar**: Indonesian public holidays and cuti bersama as calendar
  tools, and the next holiday above the prompt in Claude Code. See
  [its README](plugins/indonesian-holiday-calendar/README.md).

## Install

claude.ai or the Claude desktop app: **Customize > Plugins > Add > Add marketplace**,
then `husniadil/skills`, and add the plugins you want. A plugin is saved to your account,
so chat, Cowork and every Claude Code session signed in to the same account get it.

Claude Code plugin marketplace:

```text
/plugin marketplace add husniadil/skills
/plugin install husniadil-skills@husniadil
/plugin install indonesian-holiday-calendar@husniadil
```

In Claude Code a plugin's skills are invoked with the plugin's name in front, such as
`/husniadil-skills:gate`.

pi:

```text
pi install git:github.com/husniadil/skills
```

Manual: copy any folder under `plugins/husniadil-skills/skills/` into your agent's skills
directory (`~/.claude/skills/`, `.claude/skills/`, `.agents/skills/`, or the equivalent).

## Skills

| Skill | What it does | Needs |
|---|---|---|
| `model-prompting-guides` | Per-model prompting rules an agent reads before delegating to a subagent or writing a prompt for a specific model | |
| `goal-prompt` | Writes the condition text for Claude Code's `/goal` | |
| `analyzing-video` | Frames, scene changes and an optional transcript of a video, analysed by parallel subagents | `ffmpeg`, `ffprobe`, `python3`, and `transcribe-audio` for the audio |
| `transcribe-audio` | A file or URL to text, SRT, VTT or JSON through Groq's hosted Whisper, any length | `ffmpeg`, `ffprobe`, `python3`, `curl`, `GROQ_API_KEY` or `GROQ_BASE_URL`, and `yt-dlp` for a URL |
| `youtube-transcript` | The captions YouTube already holds, as plain text | `yt-dlp`, `deno` |

A skill whose tool is missing stops and says which one and how to install it. It does
not install anything itself.

### model-prompting-guides

Each reference in `plugins/husniadil-skills/skills/model-prompting-guides/references/` has the same shape:

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

## Workflow skills

These are skills you run by name. None runs on its own: `disable-model-invocation` holds
them back in Claude Code and pi, and `allow_implicit_invocation: false` in
`agents/openai.yaml` does it in Codex.

| Agent | How to run `gate` |
|---|---|
| Claude Code (plugin) | `/husniadil-skills:gate` |
| pi | `/skill:gate` |
| Codex | `$gate` |

| Skill | What it does |
|---|---|
| `gate` | Finds and runs the project's format, lint, typecheck and tests, and shows the real output |
| `audit` | Reviews the diff, the codebase or its architecture, with every finding verified |
| `fix-all` | Fixes the last review's findings one at a time, each verified |
| `commit-all` | Commits the session's work by path, in coherent units |
| `review-plan` | Checks a plan file against the repository and fixes it in place |
| `debts` | Lists what the session's work still owes, each item checked, and with `fix` asks which to pay off |
| `pre-compact` | Saves what compaction would lose and writes a prompt to resume from |
| `ask-user-question` | Asks through the AskUserQuestion tool |

## Agents

Eight subagents in `plugins/husniadil-skills/agents/`, each pinning one effort level, so a
parent agent can choose the level per task. Claude Code's Agent tool takes a model but no
effort, and these fill that gap. `model-prompting-guides` tells the parent which one to
spawn.

| Agent | What it does |
|---|---|
| `general-low`, `general-medium`, `general-high`, `general-xhigh` | General-purpose work at that effort |
| `explore-low`, `explore-medium`, `explore-high`, `explore-xhigh` | Read-only code search at that effort. In Claude Code it skips CLAUDE.md, like the built-in Explore. |

The color follows the level: low green, medium yellow, high orange, xhigh red. No agent
pins a model, so pass one per call when the default does not fit.

| Harness | How to spawn `general-high` |
|---|---|
| Claude Code (plugin) | Agent tool with `subagent_type: "husniadil-skills:general-high"` |
| pi | `general-high`, through [pi-subagents](https://github.com/nicobailon/pi-subagents) |
| Codex | Not shipped, because a Codex plugin cannot carry agent roles. Call `spawn_agent` with `reasoning_effort` instead. |

pi has no subagents of its own. Install the extension, which finds these agents through
`pi.subagents.agents` in this repository's `package.json`. It needs the current pi,
`@earendil-works/pi-coding-agent`.

```text
pi install npm:pi-subagents
```

One file serves both harnesses. Claude Code reads `effort`, `color`, `disallowedTools` and
`omitClaudeMd`. pi-subagents reads `thinking` and `excludeTools`. Each ignores the keys it
does not know.

How the level behaves in Claude Code:

- `CLAUDE_CODE_EFFORT_LEVEL`, when set, overrides the pinned level.
- A model without `xhigh` runs it at `high`.
- Claude Haiku 4.5 has no effort levels and ignores it.
- Without `model`, the subagent runs on `CLAUDE_CODE_SUBAGENT_MODEL` when that is set, and
  on the parent's model otherwise.

## Updating a guide

For a new model version, add a new reference from the provider's official prompting page
and link it in `SKILL.md`. For an existing one, edit in place and bump the
`Last cross-checked` date in its Provenance section. Keep the 4 metadata files in sync:
`plugins/husniadil-skills/.claude-plugin/plugin.json`, `plugins/husniadil-skills/.codex-plugin/plugin.json`,
`.claude-plugin/marketplace.json`, `package.json`.

## Checking the calendar plugin

The calendar plugin's server runs on husniadil.com, outside this repository, so
nothing here notices when the two drift apart. Run this after changing the plugin
or the site's MCP server:

```text
python3 scripts/check-calendar-contract.py
```

It checks that the mod connects to a server its manifest lists, that the server at
the manifest's URL introduces itself by the plugin's name, and that it still offers
every tool the mod calls. `--offline` runs the first check alone. The mod's own tests
run with `claude plugin test ./plugins/indonesian-holiday-calendar`.

## License

MIT, except `plugins/husniadil-skills/skills/analyzing-video`, which is modified from
[bsisduck/video-analyzer-skill](https://github.com/bsisduck/video-analyzer-skill) and
stays under GPL-3.0 (its own `LICENSE`). The changes: transcription goes through the
`transcribe-audio` skill, and its prerequisites are checked before it runs.
