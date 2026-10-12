# Directed prompt: recorded music, 1877 to 2008

Brief, as the user gave it: a 36-second square post for X and Instagram, 1080x1080, how recorded music was carried, with the year counting up. Six eras, one short line each, a synthesized score with a soft hit per era and one big moment at the end. No voice, no neon, no glitch, no brand names or logos.

## The prompt (sent to the model)

```text
GOAL: A viewer who grew up with recorded music sees each medium give way to the next, and ends on the phone beside the cylinder that started it.

OUTPUT: plain HTML, one self-contained file, no libraries. Canvas 2D draws the objects; DOM text draws the labels. 1080x1080.

TIME: 36 s x 30 fps = 1080 frames (0 to 1079). A one-shot that ends on a held card, not a loop. 90 BPM = 20 frames a beat. Every era arrival lands on a beat: frames 40, 180, 340, 500, 660, 820, and the payoff at 940.

LOOK:
- Paper: flat #efe6d3 background with a fixed grain (seeded, 5% alpha). No gradient, no vignette.
- Ink: #2a2119 for labels (13:1 on the paper). Derived: warm near-black.
- Accent: #9a4420, used only on the year counter, the one thing it marks (5.1:1 on the paper). Derived.
- Materials, flat fills, no gloss: wax cylinder #b07a46 with 14 ribs in #8a5a2f at 35%; LP #2b221c with hairline grooves #4f4137 every 10 px and a label #d7b98a; cassette body #3f2f25, window #c9b48f, reels #2b201a, label band #e7dcc4; CD #cdc6b8, centre hole in paper colour, rings #b7b0a2; portable player body #554b44, screen #d8cfbd; phone body #2a2521, screen #e4dccb, bars #a79d8c.
- Every object casts a flat offset shadow 6 px right and down, #2a2119 at 12%.
- Counter: DOM, left 90 px, top 70 px, width 420 px, 170 px, font Iowan Old Style, Palatino, Georgia, serif; font-variant-numeric: lining-nums tabular-nums; colour accent. Only the year counter is accent.
- Label: DOM, left 90 px, top 856 px, width 900 px, one line, 46 px, same serif, line-height 1.2, colour ink, data-max-lines="1".
- Hero: centre (560, 470) at scale 1, in a full-frame canvas.

MOTION:
- Label enters by a left-to-right clip wipe over 12 frames, ease-out-quint (0.22, 1, 0.36, 1), first visible on its arrival frame. It leaves by a right-to-left wipe over 10 frames, ease-in-cubic (0.32, 0, 0.67, 0). Labels never move while read.
- Morph, 40 frames ending on the next arrival A:
  - A-40 to A-30: camera pushes 1.00 to 1.15, ease-in-out-quart (0.76, 0, 0.24, 1); the old label wipes out.
  - A-30 to A-10: the object morphs. Superellipse exponent, semi-axes and fill interpolate on ease-in-out-cubic (0.65, 0, 0.35, 1). Outgoing features fade out and incoming ones fade in over the same 20 frames. The counter counts from the old year to the new on the same curve.
  - A-10 to A: camera pulls back 1.15 to 1.00 on the same curve.
  - No text from A-30 to A-1.
- Holds: camera pushes 1.00 to 1.03 across the hold, ease-in-out-sine (0.37, 0, 0.63, 1). Nothing else moves.
- Payoff: the cut at 940 is hard, the frame finished on its first frame. The cylinder lands at 1.09 x its rest scale and settles to 1.00 by frame 949 on a spring at damping ratio 0.8, 2 Hz. Opacity never bounces.

SHOTS (frames, end-exclusive):
- 0-40 start: cylinder at rest, counter 1877, no label, bed silent.
- 40-140 era 1877: superellipse a 290, b 125, n 2.6, fill #b07a46, with ribs. Label "Sound, cut into a turning cylinder." wipes in at 40.
- 140-180 morph to 1948.
- 180-300 era 1948: LP, a 300, b 300, n 2. Label "33 1/3 rpm: a whole side at once." wipes in at 180.
- 300-340 morph to 1963.
- 340-460 era 1963: cassette, a 282, b 180, n 7. Label "An album that fits in a pocket." wipes in at 340.
- 460-500 morph to 1982.
- 500-620 era 1982: CD, a 255, b 255, n 2. Label "Read by a laser, not a needle." wipes in at 500.
- 620-660 morph to 1998.
- 660-780 era 1998: portable player, a 170, b 225, n 6. Label "The first portable MP3 player." wipes in at 660.
- 780-820 morph to 2008.
- 820-900 era 2008: phone, a 150, b 300, n 5, centred. Label "Streaming on a phone, in your hand." wipes in at 820 and out over 900-910.
- 900-940 silence on a held picture: phone at rest, no label, no bed.
- 940 hard cut: phone at x 330, scale 0.9. Cylinder (1877 geometry and ribs) at x 770, scale 0.6, landing per MOTION. Counter 2008.
- 960-1079: label "Still the same sound." wipes in at 960. The pair pushes 1.00 to 1.02, ease-in-out-sine.

BANNED: purple or blue gradients; neon; glow, bloom or lens flare; floating particles; glitch, scanlines, chromatic split, VHS noise; a spinning record or turntable; a dark navy backdrop; a centred title on a gradient; scenes switched by opacity (a slide deck); a slow zoom as the only motion; one transition on every cut; a fade-and-slide on every element; a logo, a brand name, an app icon on the phone screen; three levels of text in one shot; a logo fading to black as the ending.

QA: stills at frames 0, 39, 40, 100, 139, 150, 170, 179, 180, 240, 299, 300, 330, 339, 340, 400, 459, 460, 500, 560, 620, 650, 660, 720, 780, 819, 820, 899, 900, 939, 940, 948, 960, 1079, and a contact sheet. Frame 1079 is not frame 0 (not a loop).

SOUND: synthesize everything in code with the Web Audio API, no samples, no downloads. 90 BPM. A soft pad bed: triangle voices through a lowpass at 1100 Hz, at -24 dBFS in total, one chord per era, starting on its arrival frame: D major (D3, A3, F#4) from 40; G major (G3, D4, B3) from 180; B minor (B2, F#3, D4) from 340; E minor (E3, B3, G4) from 500; A major (A2, E3, C#4) from 660; G major (G3, D4, B3) from 820. Each voice fades in over 0.5 s. The bed is silent between 900 and 940. Hits, each one frame after its picture, peak at (F+1)/30 s: 40, 180, 340, 500, 660, 820 are soft hits, a sine at 165 Hz with its partial at 330 Hz at 0.3 level, decay 0.22 s, peak -16 dBFS. 940 is the big moment: a D major stab (D2, D3, A3, F#4) at -6 dBFS, held at full level for 80 ms, decaying over 1.2 s, over a D major pad that runs to 1070 and fades out over 10 frames. Every partial starts a quarter period before its peak, on a crest. Expose window.renderAudio(), returning the AudioBuffer of an OfflineAudioContext(2, 48000 * 36, 48000) that renders the whole score; renderAudio({ only: 'hits' }) and renderAudio({ only: 'bed' }) render one part alone. Set every gain to 0 at time 0 before its envelope.

Render contract:
- One self-contained HTML file. No libraries, no other network requests.
- Fonts: name the system fonts with their fallbacks (Iowan Old Style, Palatino, Georgia, serif). No font file.
- Text that is only texture carries aria-hidden="true". A text box with a line limit carries data-max-lines="N".
- Every frame is a pure function of t in seconds. Expose window.renderAt(t), which draws exactly that frame, DOM text included.
- With ?t= in the URL, start no requestAnimationFrame loop and no timer. Without it, play in real time for preview: one requestAnimationFrame loop calls renderAt with its timestamp, wrapped at 36 s. That loop is the only clock in the file.
- No Date.now, performance.now, setTimeout or setInterval for motion, and no unseeded Math.random: seed every random from a fixed key.
- Size the canvas by window.devicePixelRatio.
```

Word count of the block above: 1238 in all, of which 867 is the prompt proper, 234 the SOUND line and 137 the render contract (counted with `wc -w` on the fenced block).

## Follow-ups applied after the first build (not in the block above; full notes in log.md)

The block above is the prompt as first sent. These are the numbers the piece changed afterwards, with the frames that asked for each change:
- Hero centre 560,470 to 600,500 for the holds and the morph pivot; payoff phone 330,470 to 330,500, cylinder 770,470 to 770,500, pivot 550,500. Frames 170 to 300 and 820 to 1079: the counter's ink ran into the LP and the phone (`--text` 2.4:1 and 4.5:1).
- CD fill #cdc6b8 to #bcb5a6, outer ring #9c9486, inner ring #d3ccbd. Frame 600: the disc read as a faint shadow.
- Morph camera peak 1.15 to 1.10 (ramp 1.03 + 0.07, pull back 1.10 - 0.10). Frame 170: the LP's edge reached "1948" at 4.5:1.
- The first chord starts on frame 0, not 40, with the same 0.5 s fade-in. Frame 40: the first hit read 23.8 dB over a silent bed.
- Soft hit partials 0.13 and 0.04 to 0.092 and 0.028, about 3 dB lower. Hits read 7.4 to 8.2 dB over the bed; the target is 3 to 6.
- Big moment (940) partials 0.12, 0.14, 0.12, 0.10 to 0.042, 0.049, 0.042, 0.035, about 9 dB lower. The limiter took 11.9 dB at the first full render; now 2.9 dB, under the 3 dB warning line.

## Defaults I picked (not part of the prompt)

- Format: chronology (story.md, Pick the format from the plot). The brief has a real-time counter and eras that each turn into the next, so the morphs carry the piece. No hard cuts except the payoff slam at 940.
- Length 36 s, 30 fps, 1080x1080: from the brief. Not a loop: the piece ends on a held card, so `--loop` is left off.
- Tempo 90 BPM: the brief gave none. 20 frames a beat, so the arrivals sit on whole beats.
- Engine: plain HTML, Canvas 2D for the objects and DOM text for the labels. Not three.js: no 3D was asked for.
- Font: a system serif stack. No font file was embedded.
- Palette: all derived, with the reasons in LOOK. No brand or logo colour was taken.
- Era lines: my wording. The facts are from my own knowledge, not checked against a source, because the brief forbids web search.
- Extra label: "Still the same sound." closes the piece. The brief asked for one line per era, so this one is an addition.
- Callback: the cylinder from the first era returns beside the phone at the end, as story.md's "the end is the start, changed".
- Sound: asked for in the brief, so a SOUND line is included, with a soft bed under the hits. The bed is my addition, and the brief's "synthesized score" implies music.
- No voice, no captions, no narration.
- Not asked, not used: no loop, no variant, no clips, no images, no GIF.
