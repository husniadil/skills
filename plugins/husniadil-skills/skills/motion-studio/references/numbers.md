# The numbers

Motion designers talk in curves and frames, so give the model curves and frames. Put these in MOTION, TIME and SHOTS.

## Easing

Values from the easings.net source (`ai/easings.net`, `src/easings.yml`, checked 2026-10-11).

| Name | cubic-bezier | Use it for |
|---|---|---|
| ease-out-expo | 0.16, 1, 0.3, 1 | text and logo reveals |
| ease-out-quint | 0.22, 1, 0.36, 1 | premium entrances |
| ease-in-out-quart | 0.76, 0, 0.24, 1 | moves across the screen, camera pushes |
| ease-in-out-cubic | 0.65, 0, 0.35, 1 | camera orbits, slower moves |
| ease-in-out-sine | 0.37, 0, 0.63, 1 | ambient drift |
| ease-in-expo | 0.7, 0, 0.84, 0 | fast exits |
| ease-in-cubic | 0.32, 0, 0.67, 0 | something falling shut |
| ease-out-back | 0.34, 1.56, 0.64, 1 | a playful pop with overshoot |

- Enter with ease-out, exit with ease-in and make exits 40 to 50% shorter, move across the screen with ease-in-out.
- Linear only for rotation, progress bars and the phase of a loop. Linear easing on a move is the quickest way to make a render look like a render.
- Camera moves get the softest curves (ease-in-out-quart or -cubic); objects get the snappier ones.

## Springs

One number translates between every library's knobs: the damping ratio, `zeta = damping / (2 * sqrt(stiffness * mass))`.

| zeta | Feel | Overshoot |
|---|---|---|
| 1.0 or more | no bounce: text, opacity, UI that must settle | 0 |
| 0.85 | premium, a barely visible settle | 0.6% |
| 0.8 | premium product motion | 1.5% |
| 0.7 | a clear but polite settle | 4.6% |
| 0.5 | playful, characters | 16% |
| 0.43 | a mascot's rebound | 22% |
| 0.3 or less | a cartoon | 37% or more |

- Library defaults: Remotion's `spring()` is mass 1, damping 10, stiffness 100, so zeta 0.50, which bounces. react-spring's is tension 170, friction 26, mass 1, so zeta 0.997, which barely does. To get a ratio in any library: `damping = 2 * zeta * sqrt(stiffness * mass)`.
- Position, scale and rotation may bounce; opacity and colour never do.
- Write springs as a pure function of time, so any frame renders on its own without simulating the frames before it. This one is checked against a numerical solve (error under 3e-6 for zeta 0.3 to 3, overdamped included):

```js
// Progress 0 -> 1 of a spring released at t = 0 (seconds). zeta: damping ratio. f: natural frequency in Hz.
export function spring(t, zeta = 0.8, f = 2) {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * f;
  if (zeta < 1) {
    const wd = w * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + (zeta * w / wd) * Math.sin(wd * t));
  }
  if (zeta === 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const s = Math.sqrt(zeta * zeta - 1), r1 = -w * (zeta - s), r2 = -w * (zeta + s);
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}
```

Hand it to the model with one line: "use only these tokens, no inline numbers", next to the easings above in one `motion.js`.

## Durations and stagger

| What | Duration |
|---|---|
| UI feedback | 100 to 200 ms (100 ms reads as instant) |
| UI moves | 200 to 500 ms |
| Hero reveals | 600 to 900 ms |
| Exits | 40 to 50% shorter than the entrance |
| Letters | 1 frame apart |
| Words | 60 to 120 ms apart |
| List items | 40 to 80 ms apart |

Start the next element when the one before is 30 to 50% done: fully sequential looks robotic, all at once looks cheap. For video, say it in frames: at 24 fps a frame is 41.7 ms, so a 400 ms move is 10 frames; at 30 fps it is 12; at 60 fps, 24.

## The beat grid

Frames per beat = fps x 60 / BPM.

| BPM | 24 fps | 30 fps | 60 fps |
|---|---|---|---|
| 120 | 12 | 15 | 30 |
| 90 | 16 | 20 | 40 |
| 128 | 11.25 | 14.06 | 28.13 |

When a beat isn't a whole number of frames, compute beat n at `n * 60 / BPM` seconds and round each one. Adding a rounded 14 again and again drifts: at 128 BPM and 30 fps, 32 beats later the cuts are 2 frames off the music. Cut on the beat and change the layout on the bar (every 4 beats); changing everything on every beat wears the viewer out.

## Holds

- On-screen text stays at least 0.3 s per word plus 0.5 s: a two-word title needs 1.1 s.
- During a hold, a slow 2% push on the image behind the words keeps the frame alive; the words themselves stay still.
- Push key poses 10 to 30% further than feels right: the feed shrinks everything.

## Text size on a phone

A feed shows a square post about 330 to 390 pt wide on a phone (a screen's width, less any margin: an estimate, not a measurement), so 1 pt is about 3 px of a 1080 frame. Apple's guidelines put the minimum text size on iOS at 11 pt and the default at 17 pt (Human Interface Guidelines, Typography, checked 2026-10-11).

- Text the viewer must read: a CSS font-size of at least 36 px at 1080 wide (11 pt at the narrow end), after any scale transform. `render.mjs --text` checks it. Body-like text reads comfortably from about 56 px (17 pt).
- A product screen shrunk into a card takes its labels below that: in the fourth end-to-end test they were 16 to 24 px. Crop to the part of the screen that matters and scale it up until the labels the viewer must read reach 36 px, or leave them as texture and say the words in a headline.
- Scale for other widths: at 1920 wide, multiply by 1920 / 1080.

## Contrast behind text

The background serves the text. A bright, busy background behind a white title takes the letters' edges away, however good the background looks on its own.

- Keep a pocket under text the viewer must read: under white text the background stays at or below grey 64 of 255 (25%), under near-black text at or above 204 (80%). White on grey 64 is about 10:1 and black on 204 about 13:1, well past the 4.5:1 floor below.
- Over a busy background, put a dark pocket under the text, a radial gradient from 55% black to transparent, and bring it in with the text.
- Inside the pocket, background elements (particles, shapes, lines) take the dark side of the palette at opacity 0.35 or less.
- To test a frame by eye: take the frame where the title is complete and turn it grey. Any part of the background as light as the letters is too busy. With the text hidden, the background should look calm.
- `render.mjs --text` measures it on every frame: it captures the frame again with the glyphs transparent, compares the text's colour (with its opacity) against every background pixel under its lines, and reports text whose ratio is under 4.5:1 for more than 10% of them. The 10% lets a few bright specks pass; a background half as light as the text does not. 4.5:1 is WCAG's ratio for normal text: the frame plays on a phone at about a third of its size, so text that is large in the frame is normal-sized on the screen. A text shadow stays in the capture but covers only part of the line: white text with a triple 6 px black shadow on a light grey panel darkened 43% of the pixels under its line and still read 1.4:1, the same as without it. The fix is the pocket. The check adds about 0.1 s a frame, so how much slower `--text` runs depends on the page: 2.7 times on a light test page (60 frames at 1080x1080 in 11.2 s, against 4.2 s without it), 1.5 times on the seventh end-to-end test's piece (1200 frames at 1920x1080 in 344 s, against 235 s).

The pocket levels, the dark gradient, the 0.35 opacity and the grey test come from bang-motion v1.19.0 by Bang Tutorial (MIT, `references/techniques.md` 1b); the levels are read here as grey values of 255.

## A product action (UI)

A UI shot is an event the viewer can follow: the starting state, the cursor reaching the control, the press, the result, and a hold long enough to read it. Starting values at 30 fps, from a worked launch-clip example (@beamnxw on X, 2026-10-10), to adjust after the first preview:

| Beat | Frames |
|---|---|
| Cursor travels to the control | 30, on ease-in-out-cubic |
| Press | scale 1 to 0.92 over 3 frames, back to 1 over 6 |
| The control responds | on the press frame |
| Cursor leaves for a resting point | starts 9 frames after the press, takes 18 |
| The result appears | its reveal starts 15 frames after the press and runs 24 frames; on an ease-out most of it shows in the first few, so time the reveal sound to the first frame it shows |
| The result holds | 0.3 s per word plus 0.5 s at least, still |

- Record the control's position from the fitted screen and aim the cursor there, not at a guess.
- The cursor's path and resting point stay clear of every label; one that crosses text being read is a defect.
- Sound: the click one frame after the press, the reveal one frame after the result appears (sound.md).
- A layer that enters over readable text (a sheet over a list, a screen over a lock screen, a card over a page) is opaque within two frames: opacity `min(1, 3k)` on its eased progress `k`, while its slide or scale runs the whole reveal. A cross-fade between two screens that both hold text shows both texts at once. In a 4:48 narrated explainer (narration.md), four such fades let the text behind read through for 0.2 to 0.8 s.
- Show the product's real UI: rebuilt simplified from its own components, colours, terms and font, or its real screenshots (engines.md, The user's screenshots and logo). A screen drawn from imagination is never presented as the product. In a rebuild, the titles, buttons and labels the story names stay readable (36 px at 1080 wide, Text size on a phone), and every other small text becomes a rounded grey bar of about its length. One screen, one task: one panel, one action, one result; crop out or blur what the action doesn't use. Panels float without a device frame (a white card, round corners, a wide soft shadow); keep the laptop or phone frame for a statement or the closing beat (bang-motion, `references/opener-konsep.md`, Building UI for animation).
- For a click the story turns on, the camera comes to it (Camera (2D)): it starts 0.3 to 0.5 s before the cursor arrives and zooms to 1.4 to 2.2x over 0.6 to 0.9 s on an ease-in-out, with the control a little above the frame's centre; it holds almost still through the press, then pulls back to wide or pans to the panel that changed over 0.7 to 1 s. One to three clicks per act get this; the others play wide. Never zoom in and out faster than about every 1.5 s.

## Camera (2D)

When a 2D piece feels static although its elements move, change the shot size: the camera comes close to one element, then pulls back. A breath of a few percent of scale is nearly invisible, so it stays a base layer under the shot changes.

| Shot | The element it frames |
|---|---|
| Wide | the whole composition, for many elements or wide text read together |
| Medium close-up | the element and a little context: it fills a third to a half of the frame |
| Close-up | one element or its detail fills most of the frame (bang-motion's example frames a title at 0.6), for emphasis, an action, or small text that must read |

- Aim at the element telling the story now: the text that just appeared, the object arriving, the control being clicked. The camera meets it; it does not chase it.
- Change shot on the beats of the content: close on A, back to wide when the composition needs the whole frame, close on B. Two shots of one size in a row read flat.
- Two tempos: a shot change, short, on ease-in-out-cubic (0.6 to 0.9 s); and while holding, a slow push on ease-in-out-sine. A held ending (a logo, a call to action) gets the slow push too.
- At a cut the camera may already be close, with no move; a scene can open in close-up and pull back.
- Text appears once the camera has arrived, never during the move. Don't swing near and far faster than the viewer can read.
- Scale from the element's size, so the shot fits whatever it frames: `s = max(1, min(W x fill / w, H x fill / h))`. A UI label of 16 px reaches 36 px at `s = 2.25` (Text size on a phone).
- Build the world on one wrapper (`#world`, `transform-origin: 0 0`) moved by `translate(tx, ty) scale(s)`, with `tx = W/2 - fx x s` and `ty = H/2 - fy x s` for a focus point `(fx, fy)` in world pixels. Clamp so the world's edge never shows: for a world reaching `m` pixels past the frame on every side, `tx` in `[W - (W + m) x s, m x s]` and `ty` in `[H - (H + m) x s, m x s]` (checked on 40,000 random shots: the frame stayed covered every time, and every unclamped shot put its focus at the frame's centre).
- Give the world overscan, or the clamp pushes targets near the edge off centre: in a simulation of medium close-ups on targets anywhere in a 1920x1080 composition, the target sat off centre in 53% of shots with no overscan, 24% with 120 px and 6% with 240 px.
- Labels, captions and on-screen UI that must not grow or crop sit on a layer outside the wrapper. One scale system per wrapper: a breath or a push goes into the same camera function, never a second scale on the same element.
- Check a still at the peak of every shot: no text cut by the frame, no world edge showing, and raster assets sharp at that scale (their pixels at least the scale times their size on screen).

The shot sizes, the rig and its clamp, and the camera that follows a click (A product action) come from bang-motion v1.19.0 (`references/techniques.md` 3b and 8); the clamp and overscan figures are this skill's own checks.

## Camera (3D)

- Field of view 30 to 50 degrees for a product; narrower (18 to 30) flattens a product or a miniature set into something graphic.
- Frame the hero, not the set: on frame 0 and in every hold the hero spans at least a quarter of the frame width (270 px at 1080). In the end-to-end tests, blobs at about 26% and 30% of the width read well; one at 13% read as a speck above an empty floor.
- The camera never parks: a slow orbit or a creep in every hold.
- Parallax speeds to start from: 1.0 foreground, 0.5 middle, 0.2 background.

## 3D look

Starting values from the source's three pieces. Put them in LOOK, then fix from stills.

| Material | Numbers |
|---|---|
| Polished chrome, ray-marched | F0 0.92, Schlick fresnel, roughness 0.04, 3 reflection bounces (each bounce marches again from the hit point along the reflected ray, one more full march per pixel; one bounce into the studio read as chrome in the second end-to-end test, and more only matter where the subject reflects itself) |
| Chrome, three.js `MeshPhysicalMaterial` | metalness 1, roughness 0.05 |
| Satin ceramic | colour F4F1EC, roughness 0.38, clearcoat 0.35 |
| Toy vinyl | roughness 0.45, clearcoat 0.3 |

- **Chrome is its reflections, so build the room.** In three.js, a PMREM environment generated in code (softbox planes, strips, a dome); in a ray-marched scene, a studio the reflected ray reads by azimuth and elevation. Never a stock HDRI.
- **A studio that made chrome read:** a dark room (0.1 grey); a white cyc behind the subject, 140 degrees wide, from 10 degrees below to 40 above; softboxes overhead (2.4) and upper left (3.0); black flags 75 degrees left and right; black on the camera side, so faces toward the camera read dark and the bright bands show; the accent as a rim strip behind and above (165 degrees, 42 up, 70 x 16 degrees, intensity 1.4); and a thin horizon strip (0.5 degrees wide, inside the camera-side panel) so flat faces have something to reflect. Place it at the elevation those faces reflect, which depends on where the camera sits: -6 degrees in the source, with the camera 6 degrees above the word, and +3 degrees in the second end-to-end test, with the word above the camera. Find it on one still, or from the face normal reflected about the view ray.
- **A glint is a narrow strip in the environment that moves:** 0.6 degrees wide at intensity 3, swept across the subject in 0.8 s. Sweep it across the directions the subject reflects, and no wider: the source calibrated its sweep to azimuth -0.083 to 0.302 so it touched the first letter at 3.3 s and cleared the last at 4.1 s. In the second end-to-end test a sweep of -0.9 to +0.9 crossed a word that reflected only -0.22 to +0.22, so the word lit for a few frames. Calibrate on stills with the strip pinned at a few azimuths. Keep it in the reflections only (a second environment for the specular lookup); a strip that also lights the diffuse becomes a flood light. A base environment that saturates hides it.
- **Lights for a product mesh:** key FFF4E8 at 3.0, upper front left, with soft shadows; fill E8EEF5 at 0.6, low right; rim FFFFFF at 4.0, upper back right; contact shadows at opacity 0.55. Practical lights by temperature: key 3200 K, top 5000 K, rim 7500 K.
- **Post:** neutral tone mapping, or linear to 0.9 then a soft shoulder; vignette 7 to 10%; grain 1.5 to 2% seeded by the frame index (modulo N in a loop). Bloom only when the brief wants it, at threshold 1.0 and strength 0.3 at most.

## Animation principles as numbers

The five that do most of the work in a short loop, from Thomas and Johnston's *The Illusion of Life* (1981), written the way a prompt writes them:

| Principle | Written as |
|---|---|
| Anticipation | an 11-frame crouch to 1.2 x 0.75 before the hop |
| Squash and stretch | stretch 0.85 x 1.28 at takeoff, squash 1.25 x 0.7 on landing |
| Overlapping action | arms lag 4 frames, legs 6 |
| Follow-through | arms settle at 2.2 Hz, zeta 0.22 |
| Arcs | the flip follows a dotted arc 3.5 units high |
| Slow in and out | spring back at zeta 0.55 |
| Timing | 25 frames of air per hop, 18 frames of crouch before the flip |

## Accessibility

- Text keeps 4.5:1 contrast on every frame, including over moving backgrounds (WCAG 1.4.3, Contrast behind text).
- Nothing flashes more than 3 times a second (WCAG 2.3.1).
