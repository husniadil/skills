---
name: motion-prompt
description: Write a directed prompt for a motion-design piece made in code, such as a product shot, a title or logo loop, a launch reel or an explainer beat, in one HTML file (CSS, Canvas or three.js) or in Remotion or HyperFrames, and render HTML pieces frame-exact to MP4 or GIF with scripts/render.mjs. Use when the user asks for an animation, motion graphics or a motion prompt, asks Claude to animate something, says "bikin animasi" or "bikin prompt animasi", or brings a vague brief ("make it premium", "make it pop") that needs numbers. Turns adjectives into easing curves, springs, frame counts, a shot list, banned defaults and a QA line, and checks renders for determinism, loop seams and loudness.
---

# Motion prompts

A model makes motion by writing a program that draws frames. Every frame is a function of the time `t`; a browser is frozen at each `t` and ffmpeg joins the frames. Two things follow, and this skill is built on both:

- **The look comes from the numbers in the prompt.** An adjective ("premium", "cool", "modern") leaves the decision to the model, and its decisions are its default look: a dark space backdrop, a glowing ring, bloom, particles, a spinning turntable. In the side-by-side test this skill comes from, 27 words of adjectives produced exactly that; 448 words of numbers produced the shot that was asked for, after 15 follow-ups.
- **A frame can be rendered again, looked at and fixed by number.** Follow-ups name frames ("the overshoot at frame 84 peaks late"), never feelings.

## Procedure

1. **Read the request and infer.** Ask only what changes the result, in one AskUserQuestion call with the recommended option first: what the viewer should feel or do, where it goes (the canvas, from [references/delivery.md](references/delivery.md)), how long and whether it loops, and the engine. Unanswered, use 1080x1080, 6 s, a seamless loop, 30 fps, 120 BPM, plain HTML for 2D and three.js for 3D, and no sound, and say which defaults you picked.
2. **Pick the engine** with [references/engines.md](references/engines.md) and put it in OUTPUT with its version and size. An engine the prompt doesn't name is the model's choice.
3. **Fill the template** below with numbers from [references/numbers.md](references/numbers.md). Replace each adjective in the request with what it means: "premium" becomes the materials, a key, fill and rim light, ease-out-quint entrances and springs at a damping ratio of 0.8.
4. **Write BANNED** from the list below, plus what this subject invites (a crypto brief invites neon, a product brief a spinning turntable).
5. **Append the engine's contract:** the render contract below for HTML and three.js, or the Remotion or HyperFrames rules in engines.md.
6. **Add a SOUND line only when the user wants sound,** from [references/sound.md](references/sound.md).
7. **Deliver** as in Output.

## The template

```text
GOAL: what the viewer should feel or do, in one sentence.
OUTPUT: engine and version, W x H (e.g. one self-contained HTML file, three.js 0.186.1 via a jsDelivr importmap, 1080x1080).
TIME: seconds x fps = frames. Loop or not. BPM and frames per beat if anything lands on a beat.
LOOK: palette in hex, one accent and the one thing it marks, typeface + weight + size + tracking.
MOTION: easings as cubic-bezier, springs as damping ratio and frequency, durations in frames, stagger, what never bounces.
SHOTS: frame ranges, one hero move per shot, and how each shot hands off to the next.
BANNED: the defaults you never want to see, by name.
QA: stills at named frames and a contact sheet before the full render; frame N-1 flows into frame 0.
```

For 3D add **MODEL** (sizes in one unit, primitives, bevels, what must keep its proportions) and **CAMERA** (field of view, distance, orbit range, when it pushes and on which curve; it never parks), and put materials and lights in LOOK.

- **GOAL first.** If it can't be said in one sentence, no curve will rescue the piece. Then **TIME**, because every other number hangs on the frame count.
- **SHOTS is where the story is.** Each shot gets a frame range, one hero move, and a handoff: a cut on the beat, a match cut where one shape becomes the next, or a mask wipe. Default to the cut. A transition is a decision.
- **Rank everything else under the hero:** secondary moves travel 50 to 70% of the hero's distance and start 100 to 200 ms after it; ambient motion stays under 5% of the hero's travel, on a slow sine, and never stops.
- **Name what must not change** when there is a character or a logo ("the mascot keeps its 14x10 body, 3x2 arms and 2x3 eyes"). That line keeps it recognizable.

### Banned defaults

Start from these, then extend the list for the subject:

- purple or blue gradients, glow, bloom, lens flares, neon
- floating particles as decoration
- everything fading in at once, or a fade-and-slide-up on every element
- a centered title on a gradient, a centered-everything layout
- a dark navy space backdrop, a spinning turntable for a product
- text that moves while it is being read
- a logo fading to black as the only ending

A general line like "avoid a generic look" swaps one default for another (this repository's Claude Opus 5.5 guide says the same for frontend work). Name the patterns. After each first render, name what the model used anyway and add it.

### Render contract (HTML, Canvas, three.js)

Paste this under the prompt. Each line closes one way a render goes wrong: a clock makes frame 84 differ on every run, unseeded randomness makes shapes jitter, and rendering frame N of a loop shows frame 0 twice at the seam.

```text
Render contract:
- One self-contained HTML file. Only the libraries named above, pinned to an exact version. No other network requests.
- Every frame is a pure function of t in seconds. Expose window.renderAt(t), which draws exactly that frame (CSS or Web Animations API animations may drive motion instead; they are paused and seeked to t).
- With ?t= in the URL, start no requestAnimationFrame loop and no timer. Without it, play in real time for preview.
- No Date.now, performance.now, setTimeout or setInterval for motion, and no unseeded Math.random: seed every random from a fixed key.
- If anything loads or bakes asynchronously (fonts, textures, a distance-field bake), set window.__ready = false at once and true when it is done.
- Size every canvas by window.devicePixelRatio (three.js: renderer.setPixelRatio(window.devicePixelRatio)), so a supersampled render gets more pixels.
- Loops: frames 0 to N-1 are rendered and frame N equals frame 0, so every periodic motion completes whole cycles in the loop.
```

With sound, add: `Expose window.renderAudio(), returning the AudioBuffer of an OfflineAudioContext(2, 48000 * <seconds>, 48000) that renders the whole score; renderAudio({ only: 'hits' }) and renderAudio({ only: 'bed' }) render one part alone. Seed any noise.`

## Output

1. The prompt in one fenced `text` block, the contract under it.
2. Its word count.
3. Two or three first follow-ups for this piece, from [references/review.md](references/review.md).
4. How to render it: in Claude Code, the `render.mjs` command below with this piece's numbers. In a chat without tools, open the file in Chrome and screen-record it, which can drop frames, so it is fine for a first post and not for a portfolio.

## Rendering in Claude Code

`scripts/render.mjs` renders an HTML piece frame-exact and checks it. `${CLAUDE_SKILL_DIR}` is this skill's directory; in another agent, use the directory this SKILL.md was loaded from.

```bash
node ${CLAUDE_SKILL_DIR}/scripts/render.mjs piece.html --seconds 6 --fps 30 --size 1080x1080 --loop
```

It needs Node 18+, Playwright with Chromium, and ffmpeg. It resolves Playwright from the project, the skill's folder, `NODE_PATH` and the global npm root, and exits 1 naming whatever is missing with its install command. Tell the user that command; don't install anything yourself.

| Option | What it does |
|---|---|
| `--seconds S` | Required. The length; frames = seconds x fps. |
| `--fps 30` | Frame rate, default 30. |
| `--size 1080x1080` | The viewport, default 1080x1080. Width and height must be even. |
| `--frames 0,24,48` | Stills only: those frames and a labelled `stills.png`. The fast loop while building. It takes no `--loop` or `--audio`. |
| `--loop` | Checks that frame N matches frame 0, that no frame is held at the seam, and that the seam is not a jump bigger than every step inside. Full renders only. |
| `--blur 4` | Motion blur: 4 sub-frames over half a frame (a 180-degree shutter), averaged in linear light. For 3D and fast moves. |
| `--ss 2` | Supersampling: renders at twice the pixel density and averages each 2x2 block in linear light, for clean edges on shaders and text. Costs 4x the screenshots, times `--blur`. |
| `--gpu` | WebGL on the real GPU, and prints which renderer ran (a software renderer is correct, only slower). |
| `--audio` | Renders `window.renderAudio()`, brings it to -14 LUFS under a -2 dBTP true-peak limiter, muxes it, and measures the decoded MP4. |
| `--audio-only` | The same audio pass over frames already rendered, to iterate the mix. |
| `--gif`, `--gif-fps 24` | A GIF with one palette, resampled to `--gif-fps` (default 24) and sized within X's limits. |
| `--out dir` | Default `out/<name>/`. |

It writes `frames/`, a 12-frame `sheet.png`, and `<name>.mp4` (H.264 High, yuv420p, tagged BT.709, faststart). It exits 1 on a page error, on a frame that draws differently the second time, on a failed loop check, on decoded audio over -1 dBTP or more than 1 LU from -14 LUFS, and on a GIF over X's frame or size limit. The loop verdicts are heuristics: read the numbers it prints.

**The lab loop.** Render stills at named frames, look at `stills.png` (read the image) before changing code, describe each frame as a viewer would against SHOTS, write notes with frame numbers, fix only what they name, and render the stills again. Two to four rounds is normal. Then the full render with `--loop`, and look at `sheet.png`. Sound comes last, iterated with `--audio-only`. Done means `render.mjs` printed `OK` and you looked at the sheet; report its numbers. You can't hear the score, so say so and give the measured loudness instead.

Remotion and HyperFrames render with their own CLIs (engines.md); this skill writes their prompts and does not run them.

## Where this comes from

The approach and most numbers come from a published lab notebook of three Claude Opus 5.5 pieces, a ray-marched chrome title loop, an A/B product film and a voxel mascot, each printed with its prompt and every follow-up (@flxrnc on X, 2026-09-30). The claims that could go stale were checked against primary sources on 2026-10-11, and each reference file names its sources. `render.mjs` was tested on CSS, Canvas 2D and WebGL on a GPU, on loops that close, close a frame early, overshoot their period and jump at the seam, on sub-frame blur (one white and one black sub-frame average to 188, the linear-light mean), on supersampling (a hard-edged shader gains anti-aliased edges at `--ss 2`), and on a peaky synthesized score (-14.7 LUFS and -1.7 dBTP decoded, hits within 4 samples of their place). An end-to-end run on Claude Haiku 5.5 built a ray-marched chrome title loop from a one-paragraph brief with this skill and passed every check; what it struggled with is folded into these files.
