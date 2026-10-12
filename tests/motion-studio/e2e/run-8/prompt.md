# Directed prompt: Pipit visa ad

Word count is for the fenced block below (prompt and render contract together), counted with `wc -w` on the block. The count is in the section under it.

```text
GOAL: A Reels viewer watches a helper app fix three missing papers before a 5:00 pm deadline, feels the relief of "Submitted" at 4:59, and remembers the app's name, Pipit.

OUTPUT: one self-contained HTML file, piece.html: plain HTML, CSS and DOM text, one 2D canvas for the wall clock, Web Audio for the score. No libraries. 1080x1920 (9:16).

TIME: 32 s x 30 fps = 960 frames (0 to 959). 120 BPM: a beat is 15 frames, a bar is 60. Every cut lands on a multiple of 15. Not a loop: frame 959 is a held card.

LOOK:
- Paper #F3EBDD for the wall (derived: warm stationery; the brief asks for warm). Ink #2B2420 for text, the phone bezel and the hour hand (derived). Phone screen #FFFCF6. Cards #EFE6D6. Rina's forearm and hand #5E6E5C sleeve, #D9A27C skin (derived).
- One accent, #C8552B, marks the deadline and nothing else: the 12 tick and the minute hand of the wall clock.
- Wall clock: centre (790, 200), radius 150, face #FFFCF6, rim 14 px ink, 12 ticks in ink, hour and minute hands. Canvas drawn.
- Phone: 500 x 1060 at (290, 800), bezel 18 px ink, corner radius 64; screen corner radius 46. Its work area is y 920 to 1240 only, so every phone label sits in the platform-safe band.
- Headline: Iowan Old Style, weight 500, 84 px, line height 1.05, ink, left aligned, box x 90 to 620 (width 530), top 300, max 3 lines. Label above it: Avenir Next, weight 600, 40 px, #5E6E5C. Each text box has data-max-lines.
- Payoff word "Submitted.": Iowan Old Style 500, 180 px, ink, centred on x 540, top 880, one line.
- Ending label "Pipit": Avenir Next 600, 44 px, centred, top 1080. Line "4:59 pm. One minute to spare.": Avenir Next 500, 48 px, centred, top 1160.
- Checklist (3 rows, Avenir Next 600, 40 px, box x 90 to 990, top 560, row height 60): "Bank statement", "Passport photo", "Filled-in form". Checkbox 36 px circle, 3 px ink ring; a tick fills it solid ink.
- Phone labels: Avenir Next 600, 36 px minimum, ink on #FFFCF6.
- Longest copy the piece carries: "Bank statement found in your email." (35 characters, 2 lines at 84 px in the 530 px box). Render the landing frame at 105 to 209 with it.
- Lines on screen, each one headline: "Submitted at 4:59 pm." (0 to 59), "2:00 pm. Three things missing." (75 to 104), "Bank statement found in your email." (150 to 209), "Passport photo, cropped." (210 to 329), "Filling the form." (330 to 389), "All three done." (390 to 449), "The clock doesn't wait." (450 to 629), "Submitted." (900 to 959), with the label and line above.
- Rina: only her sage forearm and hand, entering from the bottom left and holding the phone's left edge, below y 1250 (art only, no text).
- No sparkles, no stars, no robots, no icons of machines or AI, no confetti.

MOTION:
- Text: opacity 0 to 1 and 12 px rise on ease-out-quint (0.22, 1, 0.36, 1) over 9 frames on entry; exit on ease-in-expo over 5 frames. Opacity never bounces; nothing moves while it is being read.
- Wall clock hands. Minutes after noon: frames 0 to 59 hold at 299 (4:59). Frames 60 to 105 run back to 120 (2:00) on ease-in-out-cubic (0.65, 0, 0.35, 1). Frames 105 to 810 advance linearly, 170 minutes over 705 frames (0.241 minutes a frame). Frames 810 to 900 run from 290 to 299 on ease-out-quad (0.5, 1, 0.89, 1), starting at the montage speed. Frames 900 to 959 hold at 299. Minute hand = minutes x 6 degrees, hour hand = minutes / 60 x 30 degrees.
- Checkboxes: a tick fills in 6 frames on ease-out-quint, no bounce. Unticking at the rewind takes 15 frames.
- Typing "bank statement": one character every 2 frames from 110, complete at 138.
- Crop: the full camera-roll tile shrinks to a 4 x 5 face box over frames 240 to 270 on ease-in-out-cubic; the face sits in the box at its centre.
- Rush: each form field types its value at one character a frame, starting at the cut (330, 345, 360, 375).
- Upload bar: width = (frame - 450) / 450, linear, 0 at 450, 100 percent at 900. It unwinds from 70 percent to 0 over 60 to 105 on ease-in-out-cubic.
- Camera: every shot change is a hard cut on the beat (frames 105, 210, 330, 390, 450, 630, 900). No transitions. Each held shot pushes 2% on ease-in-out-sine over its length. The close on the clock (630 to 899) pushes from 1.6x to 1.75x, centred on the clock's centre.
- Rewind, the one exception: the phone's Submitted card unwinds to the form over 60 to 105 on ease-in-out-cubic, with the clock.
- Phone exit at 900: the phone slides 600 px down on ease-in-cubic over 9 frames, then is out of frame.
- Nothing bounces. Position and scale may ease; opacity and colour never bounce.

SHOTS:
- 0 to 59, wide, held, 2% push. Phone on Submitted, checklist ticked, clock 4:59, line "Submitted at 4:59 pm."
- 60 to 104, wide, the clock and upload bar unwind, the checklist unticks, the line changes to "2:00 pm. Three things missing." at 75.
- 105 to 209, close on the phone's work area (1.5x, centred at (540, 1040)). Typing, the result card, row 1 ticks at 165.
- 210 to 329, wide. Camera-roll grid, the crop box to the face at 240 to 270, the "Cropped" chip at 285, row 2 ticks at 292.
- 330 to 389, four 0.5 s cuts (330, 345, 360, 375), each a close on one form field (1.6x), alternating between the field pairs top and bottom. The rush.
- 390 to 449, wide. "All three done.", row 3 ticks at 395.
- 450 to 629, wide, upload bar climbing, clock 3:23 to about 4:06, "The clock doesn't wait."
- 630 to 899, close on the clock (1.6x to 1.75x), the hero. Hands 4:06 to 4:50 over 630 to 809, then the quiet: the bed is silent from 810, hands ease to 4:59 by 900.
- 900 to 959, wide. The phone slides out. "Submitted." big at the centre, label "Pipit", "4:59 pm. One minute to spare."

BANNED:
- Purple or blue gradients, glow, bloom, lens flares, neon, a dark navy backdrop, a gradient anywhere.
- Floating particles, sparkles, stars, confetti, glints, a shimmering check mark.
- Robots, AI icons, circuit lines, a spinning turntable for the clock.
- Text that moves while it is read (a line changes only by a hard cut or a fade-in, then holds still).
- Everything fading in at once; a fade-and-slide-up on every element.
- A centred title on a gradient; a centred-everything layout (the headline is left aligned; only the payoff word is centred).
- Phone screens as sections switched on with opacity. Screens change on the hard cut, with the camera.
- Three levels of text in one shot: at most a label and one headline.
- A slow zoom on a still as the only motion; a transition on every cut.
- A fade to black as the ending.

QA: stills at 0, 60, 105, 210, 330, 390, 450, 630, 810, 900 and a contact sheet. The piece ends on a held card: no loop check.

SOUND: synthesize everything in code with the Web Audio API, no samples, no downloads. 120 BPM bed: a kick on every beat from frame 105 to 809 (beat n at n x 0.5 s), a shaker on every eighth from 105 to 809 (every 0.25 s), and a pad on Cmaj7, Am7, Fmaj7, G, one chord per 60 frames from frame 0, fading out over frames 780 to 809 so nothing sounds from 810. Hits, each one frame after its picture: 60 (reverse whoosh: noise swept from 4 kHz down to 300 Hz over 60 to 104, peak on 105), 105 (wood tick), 165 (pluck E5), 210 (wood tick), 292 (pluck G5), 330, 345, 360, 375 (plucks C5, D5, E5, G5), 390 (pluck C6), 450 (wood tick), 900 (payoff: a C major chord C4, E4, G4, C5 with a C2 sub, held at full level for 80 ms, then decaying over 0.45 s; the loudest moment). Silence from 810 to 899 with no tail running into it. Expose window.renderAudio(), returning the AudioBuffer of an OfflineAudioContext(2, 48000 * 32, 48000) that renders the whole score; renderAudio({ only: 'hits' }) and renderAudio({ only: 'bed' }) render one part alone. Seed any noise.

Render contract:
- One self-contained HTML file. Only the libraries named above, pinned to an exact version. No other network requests.
- Fonts: Iowan Old Style and Avenir Next are named system fonts with the fallbacks Georgia and system-ui. Wait for document.fonts.ready before the first frame.
- Text that is only texture, not meant to be read, carries aria-hidden="true". A text box with a line limit carries data-max-lines="N".
- Every frame is a pure function of t in seconds. Expose window.renderAt(t), which draws exactly that frame (CSS or Web Animations API animations may drive motion instead; they are paused and seeked to t).
- With ?t= in the URL, start no requestAnimationFrame loop and no timer. Without it, play in real time for preview: one requestAnimationFrame loop calls renderAt with its timestamp, in seconds since the first frame, wrapped at the length of the piece. That loop is the only clock in the file.
- No Date.now, performance.now, setTimeout or setInterval for motion, and no unseeded Math.random: seed every random from a fixed key.
- Size every canvas by window.devicePixelRatio.
```

## Defaults I picked (no one was there to answer)

- Format: Mission (story.md). Length 32 s (from the brief), 30 fps (procedure default), 120 BPM (procedure default), 9:16 at 1080x1920 (the brief), Reels ad, so `--safe 14,35,6,6` (delivery.md, Under the platform's UI).
- Not a loop: it ends on a held card (procedure default for a piece that ends on a card).
- Engine: plain HTML, DOM text and one 2D canvas for the clock (numbers.md and engines.md, plain HTML). No three.js: the brief asks for nothing 3D.
- Sound: on, because the brief asks for a synthesized score. No voice, per the brief. Score in Web Audio, no samples.
- Typefaces: Iowan Old Style (headline, payoff) and Avenir Next (labels), both macOS system fonts, named with fallbacks (the render contract allows a system font). They render differently on a machine without them.
- Colour: paper, ink, sage, and one accent (#C8552B), all derived (the brief has no brand palette). The accent marks the deadline only.
- Rina and Pipit have no assets (brief): Rina is a forearm and hand; Pipit is a wordmark. No real person, bank or company is named or drawn.
- Text sizes: every line the viewer must read is 36 px or more at 1080 wide. Headline 84 px, payoff 180 px.
- Camera: hard cuts on the beat; the only transition is the rewind of the phone card, which the brief asks for.

## Word count

Counted with `wc -w` on the fenced block: see the value written below by the run.

## Amendments made in the lab loop (the piece follows these, not the block above where they differ)

- Checklist: "Bank statement", "Passport photo", "Filled-in form" sit on an opaque card (#FFFCF6, 28 px corners, 900 px wide, top 552), so the ink labels never sit on the phone's bezel.
- Statement close (105 to 209): zoom 1.3 on focus y 930 (was 1.5 on y 1040), so the phone's top clears the checklist card.
- Form rush (330 to 389): zoom 1.3, focus alternating y 960 and y 1040 on each 0.5 s cut, so every form row, "Expires" included, stays inside the safe band (y under 1248).
- Phone exit: the phone and the hand leave the frame from 630 (30-frame slide, under the clock close where they are already off frame), so no phone is on screen at the payoff cut at 900. Was: a 9-frame slide at 900.
- Photo line: "Passport photo." from 210, "Passport photo, cropped." from 285 (when the crop lands).
- Headline entry: opacity in 4 frames from one frame after the cut; the rise is still 9 frames. Was: a 9-frame fade from zero, which left the first frames of each cut without a line.
- Rewind line: label "At 2:00 pm: three missing", line "Rewind to 2:00 pm.", shown from 60 while the hands start back. Was: "2:00 pm. Three things missing." from 75, which ran ahead of the clock.
- Label ink: the small labels and the "Pipit" name are the piece's ink #2B2420. Was: the sage #5E6E5C (3.0:1 on paper). #3F4E3E gave 4.2:1 on the checker, so it was not used.
- Score: every tone starts a quarter period before its peak, so its crest lands on the peak sample (was 1.5 to 1.8 ms early). Hit levels set so each hit measures 3.9 to 4.8 dB over the bed (was -1.7 to +9.4 dB): wood ticks 1.0, plucks 0.5, the 292 pluck 0.2, the 360 pluck 0.42.
- Score, after the audio pass (the piece follows these): kick peak 0.35 (was 0.8), shaker 0.15 (was 0.25), wood ticks 0.5 and 0.4 at 105, 210 and 450 (was 1.0), plucks 0.42 with 0.34 for 330 to 390, 0.26 at 360 and 0.17 at 292, whoosh 0.05 (was 0.5), payoff body 0.5 held 120 ms with 0.2 sub (was 0.9 with an 80 ms hold, and four partials at full amplitude, which summed to the 20.8 dB limiter hit). Each tone starts a quarter period before its peak. Every envelope starts from 0 at time 0.
- The label in front of each headline and the "From your bank" caption use the piece's ink #2B2420 (the sage stays for the art only).
