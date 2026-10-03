# husniadil

Claude plugins by Husni Adil Makmur, in one marketplace named `husniadil`:

- **husniadil-skills**: skills and workflow commands for Claude Code, Codex, and other
  skill-aware agents. The rest of this page is about it.
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
| `pre-compact` | Saves what compaction would lose and writes a prompt to resume from |
| `ask-user-question` | Asks through the AskUserQuestion tool |

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
