# Next Steps

After each turn in Claude Code, up to three suggested next prompts appear. In the terminal, pick one and it lands in the prompt box as a draft you can edit before you send it. In the desktop app's Code tab, VS Code and the mobile app, picking one sends it. Nothing is sent until you pick.

Written by Thariq Shihipar and published in Anthropic's community marketplace, [anthropics/claude-plugins-community](https://github.com/anthropics/claude-plugins-community/tree/163301d/next-steps). This copy starts from commit `163301d` and adds the desktop, VS Code and mobile support described below.

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

A band above the prompt in the terminal and in the desktop app's Code tab:

```text
next:
  1: run the tests you just wrote
  2: do the same for the settings page
  3: /code-review high
  0: dismiss
```

In the terminal, press `1`, `2` or `3` from an empty prompt box, or click a suggestion, to write that prompt into the box. The top suggestion also shows as the box's dim ghost text, so Tab takes it. `0` dismisses the band. The band shows `next steps…` while the suggestions load, hides while Claude is working, and clears when the next turn starts.

The desktop app draws its own prompt box, which a plugin cannot write into, so a press there sends the prompt as your next message. Claude reads it as sent through `next-steps`.

VS Code and the mobile app have no band above the prompt. There the same buttons appear as a row at the end of the conversation, and a press sends the prompt. The row is placed only while one of those apps is attached to the session, so a terminal alone gets none. The mobile app shows it in a session it reaches through Remote Control.

The Claude desktop and mobile chat outside Claude Code do not run plugin code, so they show nothing.

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
- `ui.render` on `AbovePrompt`: draws the suggestions as buttons in the terminal and the desktop app.
- `$.session.surfaces` and `$.ui.place`: when VS Code or the mobile app is attached, places one row per offer at the end of the transcript, drawn by `ui.render` on `Placed` on those surfaces only.
- A press in the terminal calls `$.prompt.fill`. A press anywhere else calls `$.prompt.submit`. The top suggestion goes to `$.prompt.suggest`.
- `turn.start`: hides the suggestions.

Suggestions are model output, and the model reads untrusted text such as files, tool results and web pages. Before a suggestion is shown, the plugin strips terminal escape sequences and invisible characters, caps a label at 48 characters and a prompt at 600, and refuses any text carrying Unicode tag characters.

## What it sends and stores

Nothing leaves the session except the fork, which is one extra request to the same model the session already uses, and a prompt you pick, which goes to the session like one you typed. The plugin stores nothing on disk and keeps the current suggestions in memory only.

## License

MIT, by Thariq Shihipar.
