---
name: codex-imagegen
description: Generates or edits a raster image (photo, illustration, icon, sprite, mockup, transparent cutout) through the Codex CLI's built-in image tool, on the ChatGPT plan Codex is signed in with, so no OpenAI API key is needed. Use when the user asks to generate, draw, make or edit an image or picture, "bikin gambar", "generate image pakai codex", "edit gambar ini", or when a task needs a bitmap asset made. Not for SVG, diagrams or UI that belong in code, and not inside Codex itself, where the built-in image tool is called directly.
---

# Codex image generation

One script makes one image:

```bash
${CLAUDE_SKILL_DIR}/scripts/generate.sh --out <file.png> [options] "<prompt>"
```

`${CLAUDE_SKILL_DIR}` is this skill's own directory. Claude Code fills it in. In
another agent, use the directory this SKILL.md was loaded from.

It runs `codex exec` with one instruction: call the built-in image tool once,
with the prompt as written. Codex saves the image under
`$CODEX_HOME/generated_images/<thread id>/`. The script copies it to `--out`,
prints that path on stdout, and leaves Codex's copy where it is.

A run took 31 to 53 seconds in 8 of 9 measured runs, and one edit took 133
(2026-10-23). Give the call a 300000 ms timeout, or run it in the background.

## Options

| Option | Meaning |
|---|---|
| `--out <file.png>` | Required. Must end in `.png` and must not exist yet. A new version gets a new name, such as `hero-v2.png`. |
| `--image <file>` | Attach an image, as an edit target or a reference. Repeatable. |
| `--transparent` | Ask the tool for a transparent background. Read "Transparent backgrounds" first. |
| `--model <slug>` | The Codex model that relays the prompt to the tool. Default: Codex's own default. |

A prompt with quotes or several lines goes in on stdin, with `-` in its place:

```bash
cat <<'EOF' | ${CLAUDE_SKILL_DIR}/scripts/generate.sh --out assets/hero.png -
A minimal hero image of a ceramic coffee mug ...
EOF
```

## Writing the prompt

Codex is told to pass the prompt on unchanged, so the prompt is the whole spec.

- Subject, setting, style or medium, framing, lighting and palette, in that order.
- Say what it is for: a landing-page hero, an app icon, a game sprite.
- The tool takes no size, so the shape comes from words. "square" gave
  1254x1254 and "landscape orientation" gave 1536x1024.
- Text that should appear goes in quotes, verbatim, with where it sits. Say
  "No text" when there should be none.
- For an edit, say what changes and list what stays: "Keep the colors, stem,
  leaf, white background and framing unchanged."

## Edits and references

`--image` attaches the file to Codex's prompt, and the prompt gives each one its
role: "Edit the attached image: ..." for an edit target, "Use the attached image
as a style reference for ..." for a reference. With several, refer to them in
order, as "the first attached image".

## Several images

Each run makes one image. For variants or a set of assets, run the script once
per image, in parallel, each with its own `--out`. Every run gets its own Codex
thread, so their files never mix.

## Look before you report

Read every image before calling it done. Check the subject, any text letter by
letter, and for an edit, everything the prompt said to keep. A retry changes
one thing in the prompt and gets a new `--out`.

## Transparent backgrounds

`--transparent` gave a clean cutout of a shaded subject (a photoreal mug), and
punched a hole in a flat-colored one: three flat apple icons out of three came
back with the middle of the apple at alpha 0.04 to 0.73, even with "the apple
body stays fully opaque" in the prompt (measured 2026-10-23). Check every
transparent result over a loud color, which shows a hole a white preview hides:

```bash
magick out.png -background '#FF00FF' -flatten check.png
```

For a flat-colored subject, or when the check shows a hole, leave
`--transparent` off, ask for a flat key color, and take it out locally:

1. End the prompt with: "The background is one flat, uniform pure magenta
   (#FF00FF) with no gradient, shadow, texture or vignette, and no magenta
   anywhere on the subject." Pick a key color the subject does not contain.
2. `magick in.png -fuzz 25% -transparent '#FF00FF' out.png`

On the apple that gave a fully opaque body and no magenta left on its edge. The
alpha is all or nothing, so edges come out hard. That suits a flat icon. Hair,
glass and soft shadows want `--transparent`.

## Models

`--model` picks the model that relays the prompt. The image comes from Codex's
own image tool either way. On 2026-10-23 the default was `gpt-6.1-sol`, and
`gpt-6-luna` made a new image in the same 33 to 34 seconds. `gpt-6.1-luna` is
refused on a ChatGPT plan: "The 'gpt-6.1-luna' model is not supported when using
Codex with a ChatGPT account."

## Requirements

`codex` signed in with a ChatGPT plan (`codex login`), and `jq`. ImageMagick's
`magick` only for the transparency check and the key-out.

The script checks for `codex` and `jq` and exits 1 naming the one that is
missing. A Codex error, such as a refused model, also exits 1 with Codex's
message. When either happens, stop and tell the user what is
missing and the command that fixes it here (`npm install -g @openai/codex`, then
`codex login`. `brew install jq imagemagick` on macOS, `sudo apt-get install jq
imagemagick` on Debian or Ubuntu). Do not install anything yourself, and do not
switch to the OpenAI Images API with an API key.

The script runs Codex in a read-only sandbox from an empty directory, with
`--ignore-user-config` and `--ephemeral`. The first keeps the user's MCP servers,
hooks and instructions file out of a session that makes one tool call, while
`~/.codex/AGENTS.md` and Codex's skills still load. The second keeps the run out
of their Codex session history. The image is saved either way.

## Inside Codex

Codex has the image tool built in. Call it directly. Running this script from
Codex starts a second Codex to do the same thing.
