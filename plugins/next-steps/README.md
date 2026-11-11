# Next Steps

After each turn in Claude Code, up to three suggested next prompts appear above the input. Pick one and it lands in the prompt box as a draft you can edit before you send it. The plugin never submits a prompt on its own.

Written by Thariq Shihipar and published in Anthropic's community marketplace, [anthropics/claude-plugins-community](https://github.com/anthropics/claude-plugins-community/tree/163301d/next-steps). This copy is taken from commit `163301d`, with the code unchanged and this README rewritten.

## Install

Claude Code 2.1.275 or later, in one step:

```text
/plugin install next-steps --marketplace husniadil/skills
```

An older Claude Code adds the marketplace first:

```text
/plugin marketplace add husniadil/skills
/plugin install next-steps@husniadil
```

If `next-steps@claude-community` is installed too, uninstall one of them. Both would draw their own suggestions.

## What it adds

A band above the prompt, in the terminal only. Other surfaces show nothing.

```text
next:
  1: run the tests you just wrote
  2: do the same for the settings page
  3: /code-review high
  0: dismiss
```

From an empty prompt box, press `1`, `2` or `3`, or click a suggestion, to write that prompt into the box. `0` dismisses the band. The top suggestion also shows as the box's dim ghost text, so Tab takes it. The band shows `next steps…` while the suggestions load, hides while Claude is working, and clears when the next turn starts.

A suggestion can be a skill or slash command with its arguments, such as `/code-review high`. A suggestion naming a command the session does not have is dropped.

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `minAnswerChars` | `80` | Skip suggestions after answers shorter than this many characters. |
| `suggestSkills` | `true` | Tell the suggester which skills and slash commands the session has. |

## How it works

It is a Claude Code mod. `hooks/register.tsx` registers these hooks:

- `turn.complete`: when a turn ends with an answer, forks the session with `$.model.fork` and asks for up to three likely next prompts as JSON. The fork shares the session's prompt cache, so it costs about one short reply. It runs detached, so the turn never waits for it.
- `$.command.list`: with `suggestSkills` on, the session's plugin, user and MCP commands go into the fork's question, with descriptions up to a size budget and by name after that. Built-in commands such as `/clear` are left out.
- `ui.render` on `AbovePrompt`: draws the suggestions as buttons.
- A press calls `$.prompt.fill`. The top suggestion goes to `$.prompt.suggest`.
- `turn.start`: hides the suggestions.

Suggestions are model output, and the model reads untrusted text such as files, tool results and web pages. Before a suggestion is shown, the plugin strips terminal escape sequences and invisible characters, caps a label at 48 characters and a prompt at 600, and refuses any text carrying Unicode tag characters.

## What it sends and stores

Nothing leaves the session except the fork, which is one extra request to the same model the session already uses. The plugin stores nothing on disk and keeps the current suggestions in memory only.

## License

MIT, by Thariq Shihipar.
