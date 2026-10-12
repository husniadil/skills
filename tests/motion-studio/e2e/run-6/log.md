# Lab log: Pigeon, one message

Renders are stills unless stated. Each round: notes with frame numbers, the fix, the render that followed. Stills from `render.mjs --frames ... --text`; the text check runs on each still.

## Round 0: first build (piece.html, build v0)

Stills at 0, 60, 120, 126, 150, 240, 300, 330, 366, 450, 480, 546, 570, 630, 660, 668, 720, 780, 899 (portrait), and 0, 300, 660 at full size for the style frames. `--text` on all: "no issues". Sheet: `out/beats-v1/stills.png`.

Notes from the sheet, frame by frame:
- f660 (read): the ticks turn blue but are 36 px wide on a 1080 frame, so the one accent barely shows. The payoff is weak.
- f660: the label still says "Grey ticks: not read yet." on the frame the ticks turn blue. The label changes at 668.
- f570, f630, f720: a leaving card's bottom edge runs under the big line or label.
- f668: "Read." arrives 8 frames after the read at 660.

Fix (build v1): ticks 36 px to 58 px wide; the grey label cue ends at 652 and "The ticks turn blue." starts at 660; big "Read." starts at 660, and "It arrives..." fades out 652 to 660; the HUD gets a paper pocket (36 px radius, 40 px side padding, 24 px top and bottom), so it covers leaving card edges behind the text.

## Round 1: portrait stills after the fix (build v1)

Stills: 0, 60, 120, 126, 150, 240, 300, 330, 366, 450, 480, 546, 570, 630, 652, 660, 668, 720, 780, 899, plus the square set. Text check: no issues, both shapes. Sheets: `out/r1/stills.png`, `out/r1-square/stills.png`.

Read:
- f660 and f668: the ticks are blue and readable at sheet size; the label and big line change on the read frame.
- f652: the tap ring shows on the bubble.
- f570 to f720: the paper pocket keeps card edges out from behind the text. It leaves a flat paper band across the top of a white card in the frames where a card is leaving (f120, f330, f480, f570). Read as a caption band: acceptable, not pretty. Logged, not changed.

Note on the square shape (f120, f126): "See you at 7?" runs into the ticks at the bubble's right edge, because the 48 px text is too wide for the 400 px bubble.

Fix (build v2): square hero text 44 px, square bubble 420 px.

## Round 2: square, after the fix (build v2)

Stills 0, 120, 126, 150, 300, 450, 546, 660, 720 at 1:1, `--text`: no issues. Sheet: `out/r2-square/stills.png`. The bubble text at 120 and 126 clears the ticks, and the friend's dark phone shows its power symbol at the right edge at 450. The square verify passes. Stopped the stills loop here: two fix rounds plus one verify.

## Audio rounds (build v2, `--audio` and `--audio-only`, frames unchanged)

Audio pass 1 (full render, `out/final-9x16.log`): FAIL. The bed rendered at -48.3 LUFS, so the limiter had to lift it 35.4 dB, and it flattened the hits. `--hits` showed the click at frame 120 at +33.4 dB over the bed and the stab at frame 660 at +66.5 dB. The loudest 100 ms sat at 16.50 s (frame 495). Cause: my hit amplitudes (click 0.5, stab 0.5) were about 40 dB too hot for the pad. Fix: click 0.018, stab partials scaled down.

Audio pass 2 (`--audio-only`, `out/audio-r4.log`): loudness passes, the click is at +4.6 dB, the read is at +31.9 dB over the bed. The payoff now lands on frame 660, but the limiter took 3.8 dB. Fix: stab partials doubled (+6 dB) so the read is the loudest 100 ms.

Audio pass 3 (`out/audio-r5.log`): the payoff is on frame 660. Quiet before it: 0.1 s at -40 dBFS or under (too short for sound.md's arc). Fix: the bed drops 35 dB instead of 20 dB over frames 624 to 637 (sound.md's range is 15 to 35 dB), the stab decay goes from 0.4 to 0.5 s, and the sub goes from 0.0094 to 0.0075 to pull the limiter down.

Audio pass 4 (`out/audio-r5.log`): OK. 0.8 s at -40 dBFS or under in the 2 s before the payoff. Limiter 3.0 dB. Decoded MP4 at -14.0 LUFS, -2.2 dBTP. Hits: frame 120 +0.00 ms, frame 660 -0.02 ms.

**Spec change made in this round:** prompt.md said "the bed drops 20 dB". It now says 35 dB, and the stab's decay is 0.5 s (was 0.4 s). checkins.md's silence row still says 20 dB; it was approved before this round, so it is kept as the record.

**Finding carried into the report:** `--hits` measures each hit against the bed in the same 60 ms. During the drop that bed is 35 dB down, so the read stab reads +46.3 dB and the balance rule (3 to 6 dB over the bed) cannot apply to a payoff that follows silence. The balance rule and the arc rule are in tension for this case; I followed the arc rule.

## Final checks (final build)

- Full renders with `--audio --hits 120,660`: portrait OK (out/final-9x16-v2.log), square OK (out/final-1x1-v2.log).
- `--text` on the 20 landing frames, both shapes: no issues (default bands on 9:16; none on 1:1).
- Reels ad bands (`--safe 14,35,6,6`) on the same 9:16 frames: six warnings. "Send a message." (f0 to f120), "Locked on your phone." (f150), "Their phone is off." (f330 to f450), "It arrives when the phone turns on." (f570 to f652), "Read." (f668 to f720), "See you at 7." (f899): their top line sits a few pixels inside the top 14% band. Not changed: the brief is an organic explainer, and the rounds are used up. The fix is to move the big line's top from 280 px to about 300 px.
- The first full portrait render (out/final-9x16.log) failed on audio (limiter 35.4 dB); the fix is in the audio passes above.
