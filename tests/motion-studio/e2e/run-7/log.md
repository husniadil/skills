# Lab log: what your phone does to a photo

Every round: the stills read, the notes with frame numbers, the fix, the next render. Fixes change only what a note names. The prompt in prompt.md stays as written; where a fix goes against a number in the prompt, the log says so.

## Round 1: first build, stills at named frames

Renders:
- `out/r1/` (frames 0, 96, 135, 246, 396, 546, 792, 1020), no --text
- `out/r1t/` (frames 30, 96, 135, 246, 396, 546, 690, 792, 830, 1020, 1199), --text
- `out/r1b/` (frames 102, 276, 426, 600, 732, 744, 900, 1100), no --text
- `out/storyboard-r1/` (16 beats), no --text

Notes, with frames:
1. **Frame 30, 135, 830, 1199 (--text):** "What your phone does to a photo" / "The scene..." and the other caption pairs are reported as overlapping. The rectangles from the browser show the big line's content area at y 819-920 and the label's at y 915-1005: they overlap by 5 px. The glyphs do not touch in the still (checked by eye at full size, frame 135). The fix is to set the label's box 8 px lower (top 922 becomes 930; in the caption band, top 132 becomes 140).
2. **Frame 135 (sensor):** "The mug is pale and hard to read: the yellow sites are mixed toward cream, so the mug is mostly a pink-red blob." The fix is to make the dot's strength follow the square root of the sensor's linear value, so mid values show. This changes only the dot strength, not the mosaic's layout or colours.
3. **Frame 276 and 396 (steps 2 and 3, raw data):** "The raw stage is dark navy and dark orange. That is the point of the step. The BANNED list names a dark navy backdrop, but this is data, not a backdrop, and the stage stays cream." No fix.
4. **Frame 546 (JPEG change at 18.2 s):** "The first visible frame of the change is only the switch from smooth to crisp pixels; the grid fades in over 0.3 s after it." This follows the prompt's MOTION line, so no fix in round 1. It is a candidate for a follow-up if the sheet shows the change too weak.
5. **Frame 1020 (pull back, 34 s):** "The gallery is cut by the right edge mid-move. A moving shot, not text. The whole diagram is in frame by 37 s (frame 1110)." No fix.
6. **Frames 732, 744 (flight and hover):** "The photo hovers above the top edge of the gallery panel, which reads as hovering, not as a mistake." No fix.
7. **Frames 102, 276, 426, 600, 690, 792, 900, 1100, 1150:** the wipe, the fill, the curve and the blocks read; the flight and landing read; the pull back shows the whole chain. No fix.

Fixes applied in round 2: note 1 (label top 140 in the band) and note 2 (dot strength by square root). Notes 3 to 6 are not fixed.

## Round 2: the two round 1 fixes, stills at the same frames

Renders: `out/r2t/` (frames 30, 96, 135, 246, 396, 546, 690, 792, 830, 1020, 1199, --text).

- --text: "no issues" on all 11 frames. The caption boxes no longer overlap as the browser measures them (fix for note 1). Verified by eye in `out/r2t/stills.png`.
- Frame 135: the dots are stronger and the mug is visible inside the mosaic (fix for note 2). It still reads faint next to the wall. Kept, since a raw sensor view is meant to look like that. No further fix.
- Frames 276, 396 (raw stage, dark): unchanged, kept (note 3).
- The sheet `out/r2t/stills.png` reads the same as round 1 apart from the fixes.

Visual rounds: 2 (round 1 and round 2). No visual change after round 2.

## Audio passes (no change to the frames; `--audio-only` on `out/full-r2/`, then the final render)

The first full render with audio (`out/full-r2/`) printed 9.4 LUFS and 30.6 dBTP, with a click at 0.001 s, and every hit 33 to 40 dB over the bed. The cause was in piece.html, not in render.mjs:

- **Gain default (fixed).** A GainNode starts at gain 1, and each chord and tick only received its envelope at its onset. Every chord therefore sounded at full level from 0 s until its own onset. Fix: `setValueAtTime(0, 0)` before any envelope, in `pad()` and `strike()`. The bed then peaks at 0.14 to 0.20 and is silent from 24.8 s to 26.3 s, as intended.
- **Sub click (fixed by the same change).** The 87 Hz sub started about 2.9 ms before its envelope, at unity gain.

Then the balance, each pass with `--audio-only` on the same frames:

| Pass | Change (piece.html) | What render.mjs printed |
|---|---|---|
| bug | the first full render, before the gain fix | 9.4 LUFS, 30.6 dBTP, a click at 0.001 s; hits 33 to 40 dB over the bed |
| b | ticks 0.15, stab 0.035 | limiter 0.5 dB; hits +4.6, +11.2, +5.2, +4.4, +3.4 dB; loudest 100 ms at 3.20 s |
| c | chord attacks 0.8 to 0.3 s, tick decay 0.45 to 0.3 s, stab 0.045 | limiter 1.7 dB; hits -0.7, +4.8, -0.1, -1.1, +5.3 dB; loudest at 3.20 s |
| d | ticks 0.22, landing pad 0.024 to 0.05 | loudest moves to 36.00 s (the landing pad); hits +2.4, +7.9, +3.0, +2.1, -1.1 dB |
| e | ticks 0.2, landing pad 0.03, stab 0.065, sub 0.15 at 87 Hz, -14 LUFS | limiter 3.2 dB (warning); loudest at 3.20 s |
| f | as e, at -16 LUFS | limiter 1.2 dB; hits +1.6, +7.1, +2.2, +1.3, +6.1 dB; loudest at 3.20 s |
| g | chord levels 0.030 to 0.019, 0.024, 0.022 (Am7, Bb, C 6/9), at -16 LUFS | limiter 2.3 dB; hits +3.8, +7.9, +3.4, +3.7, +6.1 dB; loudest at 3.20 s |
| h | sub moved up an octave, to F3 at 0.09 (sound.md, Balance) | limiter 1.4 dB; hits +3.8, +7.9, +3.4, +3.7, +4.3 dB; loudest at 3.20 s |
| i | ticks 0.18, stab 0.078, sub 0.108 | limiter 2.6 dB; hits +3.0, +7.0, +2.6, +2.9, +5.8 dB; loudest still at 3.20 s; reverted |

Hit order in the table: frames 96, 246, 396, 546, 792. Pass b used the gain fix and the earlier probe (`out/dbg/audio.mjs`) to check the bed before rendering.

**Final audio state:** pad chords as in the prompt, ticks at 0.2 with a 0.3 s decay, the landing stab at 0.065 with an F3 sub at 0.09 and a bell at 0.02, the landing pad at 0.03, `--lufs -16`.

**Not met:** the payoff check. The loudest 100 ms is the tick at 3.20 s (frame 96, -13.6 dBFS), not the landing at 26.4 s (frame 792). The stab's peak is limited by 1.4 dB, and that cuts its 100 ms RMS below the tick's, because the tick sits on the chord onset of the bed. Two levers would move it: a larger stab (which raises the limiter's bite, as pass g showed) or quieter ticks (which lose the 3 to 6 dB balance). Neither fits both rules at once, so the gap is reported and not hidden.

**Deviation from the prompt:** the prompt's SOUND line says "about 20 dB under the pad" and "0.45 s decay". Both were my first guesses, written before any measurement. The measured balance rule (sound.md, Balance: 3 to 6 dB over the bed) is what the piece follows. The ticks decay in 0.3 s. The landing sub is at F3 (174.6 Hz), not 87 Hz, following sound.md's advice to move the sub up an octave. The loudness target is -16 LUFS, not -14 (see pass e and f): at -14 the limiter took 3.2 dB off the landing stab.

**Final render:** `out/final/` (audio, hit measurements). Its complete output is in `out/final-render.log`.
