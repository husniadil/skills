# Directed prompt: what your phone does to a photo (40 s, 16:9)

Word counts are at the end. The prompt block is the text the building model receives, render contract included.

```text
GOAL: A viewer on YouTube or X learns in 40 seconds what a phone does to a photo between the shutter and the gallery, and feels calm and clear, not sold.

OUTPUT: one self-contained HTML file: plain HTML, a 2D canvas for the diagram, DOM text for the captions, no libraries. 1920x1080, 16:9.

TIME: 40 s x 30 fps = 1200 frames. One shot, no loop: it ends on a held overview. No beat grid; each change lands on its own frame: 3.2 s (frame 96), 8.2 s (frame 246), 13.2 s (frame 396), 18.2 s (frame 546), and the landing at 26.4 s (frame 792).

LOOK: stage cream #F3EDE2 (derived: warm paper, calm). Captions sit on an opaque cream band from y 790 to 1080: a big line in ink #2E2A25 (derived: 13:1 on the cream) and a label in #5B5249 (derived: 6.5:1). Big line 74px on 84px, label 66px on 76px, one line each, left 96, width 1728. Font: "Iowan Old Style", Georgia, "Times New Roman", serif, weight 400, no tracking. One accent, #F0B323, the mug's own yellow, and it marks only the photo: its outline at the landing and its size bar. The scene is a yellow mug (#F0B323, shade #C98A12) on a blue table (#4A7DB1 to #3A6896) under a warm wall (#E9DFCB), with a shadow (#1E3250 at 35%), drawn with canvas primitives (the brief). Sensor filters: red #C4503F, green #5C8F5E, blue #3F6E9E (derived: muted red, green and blue). Gallery panel: #FBF8F2, 960x540, radius 28, shadow rgba(60,45,30,0.14), blur 50.

MOTION: glides between stations use ease-in-out-quart, cubic-bezier(0.76, 0, 0.24, 1), 1.0 s, zero speed at both ends. Holds: a slow push from scale 1.10 to 1.12 on ease-in-out-sine. Captions fade in over 0.4 s on ease-out-expo and fade out over the last 0.3 s; they never move. Mosaic: a diagonal wipe, 0.3 s. Fill-in: a diagonal sweep, 1.0 s, ease-in-out-sine. Tone curve: 1.0 s on ease-in-out-cubic, the exponent going from 1.0 to 1/2.2. JPEG: the block grid fades in over 0.3 s; detail falls to 22% over 0.8 s on ease-out-cubic. Size bars grow over 0.5 s, then the JPEG bar shrinks to 10% over 0.8 s. Photo flight: ease-in-out-cubic over 1.8 s, a 1.6 s hover, then a 6-frame drop on ease-in-quart. No springs; nothing bounces.

SHOTS: one travelling camera, no cuts. Times in seconds.
- 0.0-2.0: the scene at a medium close-up (photo 55% of frame width). Caption fades in 0.3 s: "What your phone does to a photo". Hand-off: glide.
- 2.0-3.0: glide to station 1, the sensor.
- 3.0-7.0: station 1. The mug becomes a mosaic at 3.2. Caption at 3.4. A stacked bar (red 25%, green 50%, blue 25%) grows 5.2-5.8.
- 7.0-8.0: glide to station 2.
- 8.0-12.0: station 2, filling in. A diagonal sweep 8.2-9.2 turns the mosaic into full colour that is still dark. Caption at 8.4.
- 12.0-13.0: glide to station 3.
- 13.0-17.0: station 3, brightening. An inset tone curve draws 13.2-14.2 while the picture lifts. Caption at 13.4.
- 17.0-18.0: glide to station 4.
- 18.0-22.0: station 4, JPEG. The 8 by 8 grid fades in at 18.2 and the detail falls. Size bars 20.2-21.7.
- 22.0-23.0: glide to station 5, the gallery.
- 23.0-24.8: the JPEG photo flies from station 4 into the gallery's top-left slot; the camera holds on the gallery.
- 24.8-26.4: the photo hovers above the slot. Nothing moves but the push.
- 26.4: the photo drops into the slot (frame 792). Its outline fades 26.6-27.0. Caption at 27.4: "The photo lands in your gallery."
- 27.4-31.0: hold with the push.
- 31.0-37.0: pull back over the whole diagram, one move: scale from 1.12 to 0.213 geometric, ease-in-out-quart; the focus moves from the gallery to the middle of the diagram. Captions are gone by 31.3.
- 37.0-40.0: the whole diagram, creeping 2% on ease-in-out-sine. Caption at 37.2: "Five steps, from shutter to gallery".
Framing: station shots keep the photo inside the top 790 px (the focus maps to screen point 960, 395). No world edge shows: the stage is one flat cream, with no frame drawn around the diagram.

BANNED: glow, bloom, neon, lens flares; purple or blue gradients; particles, dust, bokeh; a dark navy space backdrop; a device frame, phone mockup or camera icon; circuit traces, glowing grids, HUD brackets, monospace labels; a spinning mug; a fade-and-slide on any element; everything fading in at once; scenes switched with opacity; a transition on a cut (there are no cuts); text that moves while it is read; a third text level; a centred title on a gradient; a logo fading to black; a slow zoom as the only motion; a dark stage (the raw data at step 2 is dark, the stage stays cream).

QA: stills at frames 30, 96, 102, 135, 246, 276, 396, 426, 546, 600, 690, 792, 830, 900, 1020 and 1199, and a contact sheet. --text on the landing frames 96, 246, 396, 546, 792 and 1020. Not a loop: no --loop.

SOUND: synthesize everything in code with the Web Audio API, no samples, no downloads. No beat grid: a warm pad (a triangle plus a sine 0.35% sharp, low-passed at 1400 Hz) under the picture, its chords changing on each station's arrival: F major (frames 0-89), A minor 7 (90-239), D minor 9 (240-389), B-flat major 7 (390-539), C 6/9 (540-743); then a silence from frame 744 to 789 (a drop of 25 dB or more); then F major from frame 792 to 1095, fading out by frame 1185. Hits, each one frame after its picture: frame 96 (E5), 246 (A5), 396 (C6), 546 (G5). Each is a sine with two partials and a 0.45 s decay, about 20 dB under the pad. Frame 792: the big moment, a stab of F4, A4, C5 and F5 with a sub at 87 Hz and a bell at F6, every partial's crest on the peak sample, 0.45 s decay. Expose window.renderAudio(), returning the AudioBuffer of an OfflineAudioContext(2, 48000 * 40, 48000) that renders the whole score; renderAudio({ only: 'hits' }) and renderAudio({ only: 'bed' }) render one part alone. No noise is used.

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

## Word counts

- Prompt block, render contract included: 1374 words (counted with awk on the fenced block).
- Prompt body alone (GOAL to SOUND): 1022 words. The render contract alone: 352 words (with its heading).
- The skill's worked example is 448 words. This piece is 40 s with six shots and a score, so its prompt is longer.

## Defaults I picked (the brief did not say these)

1. Format: Machine (story.md). Chosen because the brief asks for a glide with no cuts. The proven format (Fixed-hero journey) cuts on the beat.
2. Canvas 1920x1080 (16:9, the brief). 30 fps, which is the skill's default and works for YouTube and X. 40 s, so 1200 frames.
3. One shot, no loop. The piece ends on a held overview, which the skill says is the case for a piece that ends on an end card.
4. No voice. Sound on, because the brief asks for a score.
5. No BPM. The pad's chords change on each station's arrival, and each step's change gets a soft tick at its first changed frame.
6. Opening station: the scene (the mug), added so the piece has a start beat. The brief's four steps are stations 1 to 4, and the gallery is station 5.
7. Sensor resolution: 128 x 72 sites (a stand-in for 12 million, not a count of them). Bayer RGGB layout, which gives half green.
8. Demosaic: each site's missing colours are the average of same-colour neighbours in its 3x3 window.
9. Tone curve: output = input^(1/2.2). The raw data is linear, so it looks dark until it is lifted.
10. JPEG: 8x8 site blocks, each block's mean kept and its detail scaled to 22%. A representation, not a DCT.
11. File size: shown as a bar at a tenth. The brief's "about a tenth" is shown, not measured.
12. Gallery: a 4x2 grid of drawn tiles, with the photo landing in the top-left slot.
13. Captions: one big line and one label per shot, both on an opaque band, which keeps the contrast check measurable.
14. Font: a system serif with fallbacks (the contract allows it), since no font file is shipped.
15. The photo is drawn procedurally, with no assets (the brief).
