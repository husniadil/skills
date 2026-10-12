---
name: motion-studio
description: Make a motion-design piece in code, from a brief to a checked MP4 or GIF, such as a product shot, a title or logo loop, a launch clip, an explainer beat or a narrated explainer with captions, in one HTML file (CSS, Canvas or three.js), or a prompt for Remotion or HyperFrames. Writes the directed prompt, then builds, renders and checks HTML pieces frame-exact with scripts/render.mjs. Use when the user asks for an animation, motion graphics or a motion prompt, asks Claude to animate something, says "bikin animasi" or "bikin prompt animasi", or brings a vague brief ("make it premium", "make it pop") that needs numbers. Turns adjectives into easing curves, springs, frame counts, a shot list and banned defaults, and checks renders for determinism, loop seams, text and loudness.
---

# Motion studio

A model makes motion by writing a program that draws frames. Every frame is a function of the time `t`; a browser is frozen at each `t` and ffmpeg joins the frames. Two things follow, and this skill is built on both:

- **The look comes from the numbers in the prompt.** An adjective ("premium", "cool", "modern") leaves the decision to the model, and its decisions are its default look: a dark space backdrop, a glowing ring, bloom, particles, a spinning turntable. In the side-by-side test this skill comes from, 27 words of adjectives produced exactly that; 448 words of numbers produced the shot that was asked for, after 15 follow-ups.
- **A frame can be rendered again, looked at and fixed by number.** Follow-ups name frames ("the overshoot at frame 84 peaks late"), never feelings.

## Procedure

1. **Read the request and infer.** Ask only what changes the result, in one AskUserQuestion call with the recommended option first: what the viewer should feel or do, where it goes (the canvas, from [references/delivery.md](references/delivery.md)), how long and whether it loops, and the engine. Unanswered, use 1080x1080, 6 s, a seamless loop (a one-shot when the piece ends on an end card or a call to action), 30 fps, 120 BPM, plain HTML for 2D and three.js for 3D, and no sound, and say which defaults you picked. When the user brings a reference clip, measure it first ([references/review.md](references/review.md), A reference clip) and write the prompt from what it decides.
2. **Pick the engine** with [references/engines.md](references/engines.md) and put it in OUTPUT with its version and size. An engine the prompt doesn't name is the model's choice.
3. **Fill the template** below with numbers from [references/numbers.md](references/numbers.md). Replace each adjective in the request with what it means: "premium" becomes the materials, a key, fill and rim light, ease-out-quint entrances and springs at a damping ratio of 0.8. For a piece over about 20 s, or one with a voice, pick its format and write its beat table first, then check the story, two to four style frames and the storyboard with the user before animating ([references/story.md](references/story.md)).
4. **Write BANNED** from the list below, plus what this subject invites (a crypto brief invites neon, a product brief a spinning turntable).
5. **Append the engine's contract:** the render contract below for HTML and three.js, or the Remotion or HyperFrames rules in engines.md.
6. **Add a SOUND line only when the user wants sound,** from [references/sound.md](references/sound.md). With a voice-over, generate the voice first and build the timeline, the captions and the mix from its timings, as [references/narration.md](references/narration.md) says; a voice that arrives after the picture is built retimes the picture instead (narration.md, A voice that arrives after the picture).
7. **Deliver** as in Output.

## The template

```text
GOAL: what the viewer should feel or do, in one sentence.
OUTPUT: engine and version, W x H (e.g. one self-contained HTML file, three.js 0.186.1 via a jsDelivr importmap, 1080x1080).
TIME: seconds x fps = frames. Loop or not. BPM and frames per beat if anything lands on a beat.
LOOK: palette in hex, each colour with its source (the brand's logo, site, app or packaging) or "derived: <reason>", one accent and the one thing it marks, typeface + weight + size + tracking.
MOTION: easings as cubic-bezier, springs as damping ratio and frequency, durations in frames, stagger, what never bounces.
SHOTS: frame ranges, one hero move per shot, and how each shot hands off to the next.
BANNED: the defaults you never want to see, by name.
QA: stills at named frames and a contact sheet before the full render; frame N-1 flows into frame 0.
```

For 3D add **MODEL** (sizes in one unit, primitives, bevels, what must keep its proportions) and **CAMERA** (field of view, distance, orbit range, when it pushes and on which curve; it never parks), and put materials and lights in LOOK.

- **GOAL first.** If it can't be said in one sentence, no curve will rescue the piece. Then **TIME**, because every other number hangs on the frame count.
- **SHOTS is where the story is.** Each shot gets a frame range, one hero move, and a handoff: a cut on the beat, a match cut where one shape becomes the next, or a mask wipe. Default to the cut. A transition is a decision.
- **Rank everything else under the hero:** secondary moves travel 50 to 70% of the hero's distance and start 100 to 200 ms after it; ambient motion stays under 5% of the hero's travel, on a slow sine, and never stops. It moves the image or the background, never words being read, so a hold that is only text drifts its background or stays still.
- **Name what must not change** when there is a character or a logo ("the mascot keeps its 14x10 body, 3x2 arms and 2x3 eyes"). That line keeps it recognizable.
- **Size text for its longest copy.** Give LOOK each text box's position, width, line limit and size (text the viewer must read is at least 36 px at 1080 wide, numbers.md, Text size on a phone), and render the landing frame with the longest copy the piece will carry (a longer product name, a translation). Past the limit, shorten the copy, widen the box or give the line its own shot, before any motion work.

### Banned defaults

Start from these, then extend the list for the subject:

- purple or blue gradients, glow, bloom, lens flares, neon
- floating particles as decoration
- everything fading in at once, or a fade-and-slide-up on every element
- a centered title on a gradient, a centered-everything layout
- a dark navy space backdrop, a spinning turntable for a product
- text that moves while it is being read
- a logo fading to black as the only ending
- scenes built as sections switched on and off with opacity: that is a slide deck. A scene changes because the world or the camera moves
- three levels of text in one shot (a kicker, a title and a body): two at most, one big line and one label
- a slow zoom on a still image (Ken Burns) as the only motion
- one transition on every cut

A general line like "avoid a generic look" swaps one default for another (this repository's Claude Opus 5.5 guide says the same for frontend work). Name the patterns. After each first render, name what the model used anyway and add it.

### Render contract (HTML, Canvas, three.js)

Paste this under the prompt, leaving out the lines for what the piece doesn't have (a variant, clips or images, a loop): pasted whole, it was 352 of the seventh end-to-end run's 1374 words. Each line closes one way a render goes wrong: a clock makes frame 84 differ on every run, unseeded randomness makes shapes jitter, and rendering frame N of a loop shows frame 0 twice at the seam.

```text
Render contract:
- One self-contained HTML file. Only the libraries named above, pinned to an exact version. No other network requests.
- Fonts: embed the font file in @font-face as a base64 data URI, subset to the glyphs the piece uses, or name a system font with its fallbacks, which renders differently on a machine without it.
- A variant of the copy (another language, a longer name) is chosen by a URL parameter such as ?lang=id, read once at load.
- Text that is only texture, not meant to be read, carries aria-hidden="true". A text box with a line limit carries data-max-lines="N".
- Every frame is a pure function of t in seconds. Expose window.renderAt(t), which draws exactly that frame (CSS or Web Animations API animations may drive motion instead; they are paused and seeked to t).
- With ?t= in the URL, start no requestAnimationFrame loop and no timer. Without it, play in real time for preview: one requestAnimationFrame loop calls renderAt with its timestamp, in seconds since the first frame, wrapped at the length of the piece. That loop is the only clock in the file.
- No Date.now, performance.now, setTimeout or setInterval for motion, and no unseeded Math.random: seed every random from a fixed key.
- If anything loads or bakes asynchronously (fonts, textures, a distance-field bake, video clips, images), set window.__ready = false at once and true when it is done.
- Video clips and images (the user's screenshots, a logo) are files beside the page, the one exception to a single file. A clip is muted, with no autoplay and no loop, and shows through a canvas: renderAt seeks it to its source time, draws that frame and returns a Promise that resolves once it is drawn (engines.md, Video clips locked to t). An image is decoded before the first frame (engines.md, The user's screenshots and logo).
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
| `'piece.html?lang=id'` | A variant: the query reaches the page and the output goes to `out/piece-lang-id/`. Quote it, since the shell reads `?` as a wildcard. |
| `--seconds S` | Required. The length; frames = seconds x fps. |
| `--fps 30` | Frame rate, default 30. |
| `--size 1080x1080` | The viewport, default 1080x1080. Width and height must be even. |
| `--frames 0,24,48` | Stills only: those frames (a range too: `157-159`) and a labelled `stills.png`. Each run replaces the stills already in its folder: pass `--out` per round to keep one to compare. The fast loop while building. It takes no `--loop` or `--audio`. |
| `--text` | Measures the DOM text on every rendered frame: font size under 36 px at 1080 wide, text in the 5% edge margin, text past the side of its box, two text boxes whose glyphs overlap, text under 4.5:1 contrast against the background under it (captured again with the glyphs hidden, which adds about 0.1 s a frame: 2.7 times slower on a light test page, 1.5 times on a 1920x1080 piece), text cut by the frame's edge, on a 9:16 frame text under the platform's UI (delivery.md, Under the platform's UI), and lines past a `data-max-lines`. Margins, bands, the frame's edge and overlaps are measured on the glyphs' ink (from `measureText`), since a font's line box reaches past them: in the sixth end-to-end run all six warnings under the Reels ad bands came from that box, 16 px above the glyphs. Only what lasts half a second counts in a full render, so text moving through a margin is fine. Text on a canvas or in WebGL is not measured. |
| `--safe 14,35,6,6` | The platform UI bands `--text` checks, top, bottom, left and right in percent of the frame. Default: 12.5,22,0,13 on a 9:16 frame, none on other shapes; a Reels ad wants 14,35,6,6. |
| `--loop` | Checks that frame N matches frame 0, that no frame is held at the seam, and that the seam is not a jump bigger than every step inside. Full renders of a loop only: leave it off a piece that ends on a card. |
| `--blur 4` | Motion blur: 4 sub-frames over half a frame (a 180-degree shutter), averaged in linear light. For 3D and fast moves. |
| `--ss 2` | Supersampling: renders at twice the pixel density and averages each 2x2 block in linear light, for clean edges on shaders and text. Costs 4x the screenshots, times `--blur`. |
| `--gpu` | WebGL on the real GPU, and prints which renderer ran (a software renderer is correct, only slower). |
| `--audio` | Renders `window.renderAudio()`, brings it to the `--lufs` target under a -2 dBTP true-peak limiter in up to three passes, prints what the limiter took off the hottest peak (a warning above 3 dB, a failure above 6), muxes it, and measures the decoded MP4. |
| `--lufs -14` | The loudness target, default -14. A few hits with no bed may need -18 to -20, so the limiter doesn't flatten them (sound.md, Balance). |
| `--hits 158,178` | Renders `renderAudio({ only: 'hits' })` and `({ only: 'bed' })` and prints, for each hit frame, where its peak sits against `(F + 1) / fps` and how far it sits over the bed, as sound.md defines both. |
| `--audio-only` | The same audio pass over frames already rendered, to iterate the mix. |
| `--track song.mp3`, `--track-start 12` | Mixes the user's song, from that second in, under `renderAudio()` (then only sound effects) before the loudness pass; `--hits` then measures each hit over the song (sound.md, A track of your own). |
| `--gif`, `--gif-fps 24` | A GIF with one palette, resampled to `--gif-fps` (default 24) and sized within X's limits. |
| `--out dir` | Default `out/<name>/`. |

It writes `frames/`, a 12-frame `sheet.png`, and `<name>.mp4` (H.264 High, yuv420p, tagged BT.709, faststart). A full render warns at every 3 s or more with nothing new on screen (story.md, Pace), and `--audio` prints where the loudest 100 ms lands and how quiet the 2 s before it are (sound.md, The arc). It exits 1 on a page error, on frames that are all one flat colour (nothing drew), on a frame that draws differently the second time, on a failed loop check, on text past its `data-max-lines`, on a limiter that took more than 6 dB off the hottest peak, on decoded audio over -1 dBTP or more than 1 LU from the `--lufs` target, and on a GIF over X's frame or size limit. The loop verdicts are heuristics: read the numbers it prints.

**The lab loop.** Render stills at named frames (with `--text` once the piece has text), look at `stills.png` (read the image) before changing code, describe each frame as a viewer would against SHOTS, including anything that hides the hero or the text, write notes with frame numbers, fix only what they name, and render the stills again. Two to four rounds is normal. Then the full render with `--loop`, and look at `sheet.png`. Sound comes last, iterated with `--audio-only`. Done means `render.mjs` printed `OK`, you read every warning it printed (text, contrast, dead beats and the limiter warn without failing, so `OK` alone doesn't mean they passed), and you looked at the sheet; report its numbers. You can't hear the score, so say so and give the measured loudness instead.

Two more scripts sit beside it: `scripts/beats.mjs` maps a song's tempo, beats and loudest hits (sound.md, A track of your own), and `scripts/capture.mjs` screenshots the user's own site (engines.md, The user's screenshots and logo).

Remotion and HyperFrames render with their own CLIs (engines.md); this skill writes their prompts and does not run them.

## Where this comes from

The approach and most numbers come from a published lab notebook of three Claude Opus 5.5 pieces, a ray-marched chrome title loop, an A/B product film and a voxel mascot, each printed with its prompt and every follow-up (@flxrnc on X, 2026-09-30). The claims that could go stale were checked against primary sources on 2026-10-11, and each reference file names its sources. `render.mjs` was tested on CSS, Canvas 2D and WebGL on a GPU, on loops that close, close a frame early, overshoot their period and jump at the seam, on sub-frame blur (one white and one black sub-frame average to 188, the linear-light mean), on supersampling (a hard-edged shader gains anti-aliased edges at `--ss 2`), on a peaky synthesized score (hits stayed within 4 samples of their place through the limiter, which took 11.8 dB at -14 LUFS, now a failure, and 1.4 dB at `--lufs -20`), on a page with every kind of text fault for `--text` and on lines whose font boxes reach past their glyphs (the ink it measures matched the rendered pixels within 1 px), and on a hit placed 5 ms late for `--hits` (read as +4.96 ms). Three end-to-end runs on Claude Haiku 5.5 built a ray-marched chrome title loop from the same one-paragraph brief with this skill, a fourth a 20-second UI launch clip with sound and an Indonesian headline, a fifth a 15-second clip in two languages paced from a reference video, a sixth a 30-second story piece in 9:16 and 1:1 built through story.md's check-ins, and a seventh a 40-second explainer in its machine format; all passed every check, and what they struggled with is folded into these files. A 4:48 narrated explainer in Indonesian, built in Remotion with these numbers and an ElevenLabs voice, gave narration.md and the rule that a layer entering over text turns opaque within two frames. bang-motion v1.19.0 by Bang Tutorial (MIT), a skill for opener and explainer videos in HTML, was read for ideas and never run: video clips locked to the timeline, retiming to a voice that arrives later, 2D shot sizes, contrast behind text, the anti-slide entries in BANNED, the palette's sources, explainer staging and a simplified UI come from it. The clip code, the contrast check, the pause detection and the camera's clamp were written and tested here; the craft rules are its, credited where they appear. animate v0.4.1 by cth9191 (MIT), a skill for story-driven canvas animation, was read the same way: story.md's formats and pace, the check-ins before animating, the payoff in the sound, the dead-beat, cut-text and platform UI checks, a scratch voice, one piece in several shapes, the user's own song and screenshots come from it. `beats.mjs`, `capture.mjs` and the checks in `render.mjs` are this skill's own code, tested on synthetic tracks, 276 drum loops, the user's own site and the 4:48 explainer.
