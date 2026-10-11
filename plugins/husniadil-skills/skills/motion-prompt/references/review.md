# Review: render, look, fix

The first render is a draft. The loop that finishes it: render stills, look at them, write notes with frame numbers, fix, re-render only what changed. Two to four rounds is normal; the source's pieces took 4, 10 and 15 creative follow-ups.

## Ways to look

- **Stills at named frames:** `render.mjs --frames 0,24,48,72,96` writes them and a labelled `stills.png`.
- **A contact sheet:** every full render writes `sheet.png`, 12 frames spread over the clip. Read it like a storyboard.
- **A frozen frame in a browser:** open `piece.html?t=2.5`.
- **An onion skin:** frames stacked at low opacity. Even spacing means robotic motion; spacing that tightens near the keys means the easing works.
- **A speed graph:** position per frame as a chart. Straight lines are linear motion; sharp corners are dead starts and stops.

## Follow-ups, ready to paste

Each points at frames, not feelings. Pick one or two per round; all of them at once turns a fix into a rewrite.

```text
Render stills at frames 0, 24, 48, 72 and 96. Describe each in one sentence as a viewer would. Does that match the shot list? Fix what does not.
Make a contact sheet of every 12th frame. Mark every frame where two things move at once, then fix the hierarchy.
Onion-skin frames 24 to 47 at 25% opacity. Spacing should tighten near the keys. Adjust the easing until it does.
Plot the hero's x position and scale per frame as a PNG chart. Show me where the motion is linear or stops dead, then fix it with the motion tokens.
Review this like a senior motion designer: 10 notes ordered by impact, each with a frame number and the exact code change. Apply the top 5.
It is too busy. Remove 30% of the motion and keep only the moves that guide the eye.
The ending is abrupt. Add a 36-frame hold with a 2% push, then let it settle on a spring at a damping ratio of 0.8.
List every default this render used that the BANNED line did not name. Add them to BANNED and render again.
```

When a fix doesn't hold, compare the frames around it:

```text
The fix at frame 84 did not hold. Render frames 83 and 85, put them side by side and list every difference you can see. Find the line of code that causes it, fix only that line, then render both frames again.
```

## Feelings into numbers

A note that arrives as a feeling gets translated before it goes to the model:

| The note | What to send |
|---|---|
| "Make it pop" | scale 1.0 to 1.08 to 1.0 over 6 frames, peak on the beat |
| "Make it feel premium" | ease-out-quint on entrances, springs at zeta 0.8, no overshoot on text |
| "It drags" | shorten each hold by one beat (15 frames at 120 BPM and 30 fps), so every cut stays on the grid |
| "It feels busy" | one hero move at a time; everything else starts 150 ms later at 60% of its travel |
| "It looks like AI" | list the defaults it used by name, ban each one, render again |

## When it breaks

| Symptom | What `render.mjs` says | Fix to send |
|---|---|---|
| Flicker or jitter | `not deterministic` | Make every value a pure function of t. Replace Math.random with a seeded generator. Remove timers and CSS transitions. |
| Wrong or fallback font | (look at frame 0) | Load the font with display=block and wait for document.fonts.ready before the first frame. |
| A hiccup at the loop seam | `one frame is held at the seam` or `does not match frame 0` | Drive the loop from phase = frame / N with whole cycles. Frame N must equal frame 0, and frame N - 1 must not. |
| A jump at the seam | `the seam jumps` | Make every motion periodic over the loop: sample noise along a circle, end the last move where the first begins. |
| Audio drifts off the beat | (measure the hits) | Compute each beat as n x 60 / BPM and round per beat. Never add a rounded frame count. |
| Jank or dropped frames in a live preview | none: renders are frame-exact | Animate only transform and opacity, never width, height, top or left. |
| Banding in the GIF | (look at the GIF) | Flat colours, or dither the palette. |
| Blurry or shimmering text | (look at a still) | Snap resting text to whole pixels. |
| Text moves before it can be read | (look at the sheet) | Hold every text state 0.3 s per word plus 0.5 s before it moves. |
| Everything moves at once | (look at the sheet) | One hero move at a time; others start 150 ms later at 60% of its travel. |
| Audio too quiet after the limiter | `more than 1 LU from -14` | Tame the hottest hits in the score, then `--audio-only`. |
| Audio peaks over -1 dBTP decoded | `over -1 dBTP` | Lower the hits that crest together, then `--audio-only`. |

When a fix works, add its line to the render contract. The contract is the lab's memory: every line is a failure that won't come back.
