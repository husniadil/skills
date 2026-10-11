# Review: render, look, fix

The first render is a draft. The loop that finishes it: render stills, look at them, write notes with frame numbers, fix, re-render only what changed. Two to four rounds is normal; the source's pieces took 4, 10 and 15 creative follow-ups.

## Ways to look

- **Stills at named frames:** `render.mjs --frames 0,24,48,72,96` writes them and a labelled `stills.png`.
- **A contact sheet:** every full render writes `sheet.png`, 12 frames spread over the clip. Read it like a storyboard.
- **One frame a second, for a piece of minutes:** `ffmpeg -i piece.mp4 -vf "fps=1,scale=480:-2,tile=4x4" sheet%02d.png` puts 16 seconds in each image, so 18 images hold a 4:48 piece. Tile n starts at second 16 x (n - 1), read left to right and top to bottom. It finds what stills at chosen frames miss: in a 4:48 narrated explainer, text reading through a layer as it faded in, and a scene that opened on an empty frame for 2 s.
- **A frozen frame in a browser:** open `piece.html?t=2.5`.
- **An onion skin:** frames stacked at low opacity. Even spacing means robotic motion; spacing that tightens near the keys means the easing works.
- **A speed graph:** position per frame as a chart. Straight lines are linear motion; sharp corners are dead starts and stops.

## A reference clip

A clip the user admires holds decisions: what enters first, where the eye lands, how long the result holds, what carries into the next shot. Take those, never its assets or its exact layout.

1. `ffprobe` its size, frame rate and length. Get an overview with the analyzing-video skill at 2 fps, then extract consecutive frames at the source rate around each event (`ffmpeg -ss <s> -t <s> -i ref.mp4 ref/%04d.png`).
2. Write `REFERENCE.md`: each event (entrance, landing, hold, cut) as a source frame number and timestamp; the main object's bounding box at its start and at its landing, in pixels of the source frame; direction, duration, scale and opacity change and any overshoot; the order the product, the headline and the labels appear in; how long the text stays readable.
3. Label every value as measured, estimated from a still, or chosen. Measure positions in the extracted frames: a position read off a still by eye is approximate. For a value still in doubt, name the frames that would settle it.
4. Convert to the piece's rate: piece frame = round(source frame / source fps x piece fps). Keep the source's frame numbers marked with its rate.

The numbers then go into the template like any other: the reference sets MOTION and SHOTS, the user's own product sets LOOK.

## Follow-ups, ready to paste

Each points at frames, not feelings. Pick one or two per round; all of them at once turns a fix into a rewrite.

```text
Render stills at frames 0, 24, 48, 72 and 96. Describe each in one sentence as a viewer would. Does that match the shot list? Fix what does not.
Render each text box's landing frame with --text, once with the copy and once with the longest copy (a variant URL), and fix every line it prints.
Make a contact sheet of every 12th frame. Mark every frame where two things move at once, then fix the hierarchy.
Onion-skin frames 24 to 47 at 25% opacity. Spacing should tighten near the keys. Adjust the easing until it does.
Plot the hero's x position and scale per frame as a PNG chart. Show me where the motion is linear or stops dead, then fix it with the motion tokens.
Review this like a senior motion designer: 10 notes ordered by impact, each with a frame number and the exact code change. Apply the top 5.
It is too busy. Remove 30% of the motion and keep only the moves that guide the eye.
The ending is abrupt. Add a 36-frame hold with a 2% push on the image behind the words, then let it settle on a spring at a damping ratio of 0.8.
List every default this render used that the BANNED line did not name. Add them to BANNED and render again.
```

When a fix doesn't hold, compare the frames around it:

```text
The fix at frame 84 did not hold. Render frames 83 and 85, put them side by side and list every difference you can see. Find the line of code that causes it, fix only that line, then render both frames again.
```

### A correction names four things

Where (the frames), what is wrong there, the one change, and what must stay as it is. The last field keeps a fix from moving something that already works. The form and this example come from a worked launch-clip example (@beamnxw on X, 2026-10-10).

```text
At frames 204 to 210 the cursor crosses the result label.
Change only the cursor's path after the press: leave at 204, rest by 210, at least 24 px clear of the label all the way.
Keep the press at 195, the reveal at 210, the card, the copy and the sound cues as they are.
Render stills at 195, 210, 222 and 240, and check every frame between them for overlap.
```

Fix in this order: missing or unreadable information, then timing, then visual detail.

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
| A blank render | `every frame is one flat colour` | Attach the canvas to the page (`document.body.append(canvas)`) and draw on that canvas in renderAt. |
| Flicker or jitter | `not deterministic` | Make every value a pure function of t. Replace Math.random with a seeded generator. Remove timers and CSS transitions. |
| Wrong or fallback font | (look at frame 0) | Embed the font as a base64 data URI in @font-face and wait for it before the first frame: document.fonts.ready for CSS text, document.fonts.load for Canvas text. |
| A hiccup at the loop seam | `one frame is held at the seam` or `does not match frame 0` | Drive the loop from phase = frame / N with whole cycles. Frame N must equal frame 0, and frame N - 1 must not. |
| A jump at the seam | `the seam jumps` | Make every motion periodic over the loop: sample noise along a circle, end the last move where the first begins. |
| Audio drifts off the beat | (measure the hits) | Compute each beat as n x 60 / BPM and round per beat. Never add a rounded frame count. |
| Jank or dropped frames in a live preview | none: renders are frame-exact | Animate only transform and opacity, never width, height, top or left. |
| Banding in the GIF | (look at the GIF) | Flat colours, or dither the palette. |
| Blurry or shimmering text | (look at a still) | Snap resting text to whole pixels, and render with `--ss 2`. |
| Jagged edges on shapes or shader text | (look at a still at full size) | Size the canvas by devicePixelRatio and render with `--ss 2`. A ray-marched shape has no anti-aliasing of its own. |
| Text wraps to an extra line, or a longer name breaks the layout | `takes N lines, over its data-max-lines` (with `--text`) | Render the landing frame with the longest copy, then shorten it, widen the box or give the line its own shot. |
| Text moves before it can be read | (look at the sheet) | Hold every text state 0.3 s per word plus 0.5 s before it moves. |
| Nothing new happens for seconds | `nothing new on screen for N s` | Add a move, a reveal or a cut every 2 to 4 s; a hold the voice or the music carries can stay (story.md, Pace). |
| Text is cut by the edge of the frame | `is cut by the edge of the frame` (with `--text`) | Bring it inside the 5% margin or shorten it, and check every shape the piece renders in (delivery.md, One piece in several shapes). |
| Text sits under the platform's buttons or caption on a vertical post | `sits under the platform's UI` (with `--text`) | Move it out of the bands; for a Reels ad render with `--safe 14,35,6,6` (delivery.md, Under the platform's UI). |
| The payoff doesn't land | `payoff: the loudest 100 ms starts at` another frame, or little quiet before it | Make the payoff the loudest hit and clear the 0.5 to 4 s before it (sound.md, The arc). |
| Cuts drift off the user's song | (cut frames against `beats.mjs`) | Cut on the first beat plus n beats, each rounded to a frame on its own (sound.md, A track of your own). |
| Text is hard to read over a bright or busy background | `reaches N:1 against 90% of the background under it` (with `--text`) | Put a pocket under it: a dark radial gradient from 55% black, background elements at opacity 0.35 or less inside it (numbers.md, Contrast behind text). |
| The piece feels static although everything moves | (look at the sheet: every frame at one shot size) | Change the shot size on the content's beats: close on the element telling the story, back to wide when the composition needs the whole frame (numbers.md, Camera (2D)). |
| A video clip shows the wrong frame, or nothing on its first frame | `video plays on its own clock`, or (look at the stills) | Seek it from t and draw it into a canvas once `seeked` fires, 1 ms into the source frame, as engines.md, Video clips locked to t, does. |
| Half the frame stays empty after something leaves it (the headline exits and the card keeps its place below) | (look at the sheet) | Move what remains to the optical centre as the other leaves, or bring the next element into the space. |
| Everything moves at once | (look at the sheet) | One hero move at a time; others start 150 ms later at 60% of its travel. |
| Text behind an entering sheet or screen reads through it while it fades in | (look at one frame a second, or at the frames of the reveal) | Make the entering layer opaque within two frames and keep its slide or scale (numbers.md, A product action). Never cross-fade two screens that both hold text. |
| Audio too quiet after the limiter | `more than 1 LU from -14` | Tame the hottest hits in the score, then `--audio-only`. |
| Audio peaks over -1 dBTP decoded | `over -1 dBTP` | Lower the hits that crest together, then `--audio-only`. |

### 3D

From the source's follow-ups and this skill's end-to-end tests. engines.md, Liquid that becomes a shape, has the technique behind each fix.

| Symptom | Fix to send |
|---|---|
| Chrome reads as white or grey plastic | Darken the studio to 0.1 grey with a white cyc behind the subject, black on the camera side, so the chrome shows dark and bright bands. |
| Flat faces read as flat charcoal | Add a thin horizon strip inside the camera-side panel, at the elevation those faces reflect, for them to reflect. |
| The glint is a flood light, or invisible | Keep the strip in the reflections only, narrow it (0.6 degrees), keep the base environment from saturating, and sweep only the directions the subject reflects. |
| Bevels fuse neighbouring letters | Space the glyphs by their measured outlines, not by advance widths alone. |
| A letter or the word space is missing | Lay the letters out from the font's advance widths, the space included, and check the word on one still. |
| A shape morph passes through a flat coin | Reveal the target inside a growing sphere and shrink the source into it. |
| A bump pops onto a blob | Grow the new part from a negative radius. |
| Squash lifts things off the floor | Scale the whole field about the floor contact point. |
| A melt erases the letter halfway | Regrow the droplets first, then retract the letters into them. |
| Parts leave the frame at the widest moment | Render a still at that frame, then pull the camera back or shorten the arc. |
| One object hides another (the blob covers letters of the word) | Render stills on every frame where both are on screen, then separate them in depth or height, or move one beat so they don't share the screen. |
| The hero reads as a speck, or the floor fills half the frame | Push the camera in or scale the hero until it spans a quarter of the frame width on frame 0, and lower the horizon line. |

When a fix works, add its line to the render contract. The contract is the lab's memory: every line is a failure that won't come back.
