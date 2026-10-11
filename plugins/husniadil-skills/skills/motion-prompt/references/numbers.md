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
- During a hold, a slow 2% push keeps the frame alive while the words stay put.
- Push key poses 10 to 30% further than feels right: the feed shrinks everything.

## Camera (3D)

- Field of view 30 to 50 degrees for a product; narrower (18 to 30) flattens a product or a miniature set into something graphic.
- The camera never parks: a slow orbit or a creep in every hold.
- Parallax speeds to start from: 1.0 foreground, 0.5 middle, 0.2 background.

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

- Text keeps 4.5:1 contrast on every frame, including over moving backgrounds (WCAG 1.4.3).
- Nothing flashes more than 3 times a second (WCAG 2.3.1).
