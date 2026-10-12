# Lab loop log: Pipit visa ad

Stills and checks use `render.mjs` at 1080x1920, 30 fps. Frame numbers are picture frames (time = F / 30). Each round: notes from looking at the stills, then the fix, then the stills again.

## Round 0: the first build (v0)

Stills: `out/v0-storyboard/stills.png` (11 frames), `out/v0-style/stills.png` (4 frames). `--text` on both.

Render output (storyboard):

```text
text: 11 frames checked, up to 11 text boxes on a frame, 4 issues
warning: text: "Passport photo" reaches 1.0:1 against 90% of the background under it at frames 105-150, under 4.5:1 (numbers.md, Contrast behind text)
warning: text: "Filled-in form" reaches 1.0:1 against 90% of the background under it at frames 105-150, under 4.5:1 (numbers.md, Contrast behind text)
warning: text: "Bank statement" reaches 2.1:1 against 90% of the background under it at frame 150, under 4.5:1 (numbers.md, Contrast behind text)
warning: text: "Expires" sits under the platform's UI at frame 330: keep text out of the top 14%, bottom 35%, left 6% and right 6% (delivery.md, Under the platform's UI)
```

Notes, by frame:
- 105: the checklist is over the phone's bezel in the close shot (the 1.0:1 and 2.1:1 warnings). The search screen is empty on its first frame, and the headline is still fading in.
- 150: the headline is not visible on this frame (its 9-frame fade starts here). The query is typed; the result is not in yet.
- 240: the headline says "cropped" from 210, before the crop happens (240 to 270). Claim runs ahead of the action.
- 330: the checklist covers the phone's top edge. "Expires" (row 4) falls in the bottom 35% band, because the close shot is centred on row 1.
- 630: good. The clock is the hero, the accent 12 tick reads.
- 900: "Submitted." lands on the phone's Submitted card: the phone is still in the wide frame at the cut.
- Whole piece: the wall clock is out of frame in the close shots (105 to 209, 330 to 389), so the time passing is not visible during those vignettes. Not fixed in this round: a clock that stays in frame in those shots would move the phone out of the safe band (see the round 1 fix notes).
- Hand: the sage sleeve and skin pill read as a blob. Not fixed in this round.

Fixes applied for round 1:
1. The checklist gets its own paper card (#FFFCF6, 28 px corners, 20 px padding), so the ink labels always sit on an opaque ground.
2. The statement close (105 to 209): zoom 1.3 on focus y 930, so the phone's top (y 791) clears the checklist card (bottom 772).
3. The form rush (330 to 389): zoom 1.3, the focus alternates between y 960 and y 1040 on each 0.5 s cut, so every row, row 4 included, stays inside y 1248.
4. The phone slides out of frame from 630 (under the clock close, where it is already off frame), so no phone is on screen at the payoff cut at 900.
5. The photo line becomes "Passport photo." from 210 and "Passport photo, cropped." from 285, when the crop lands.

## Round 1: notes on the fixed build (v1)

Stills: `out/v1-round1/stills.png`. Frames: 105, 150, 240, 330, 345, 375, 390, 630, 900.

Result of round 1 (`out/v1-round1`, `--text` on 13 frames): `text: 13 frames checked, up to 13 text boxes on a frame, no issues`.

Round 1 looks, read from `out/v1-round1/stills.png`:
- Good: the checklist card clears the phone in the statement close, the rush rows all sit in the safe band, the payoff word is alone on paper at 900.
- Still open: the headline is missing for its first frames after each cut (105, 150, 210, 330), because its 9-frame fade starts at zero.
- Still open: in the close shots the wall clock is cropped at the top edge of the frame (105, 150, 330, 345), so its hands show as a sliver.

## Round 2: notes and fix (v2)

Stills: `out/v2-round2/stills.png`, frames 60, 75, 90, 105, 150, 210, 330, 450, 540, 629, 720, 870, 959, `--text`.

Result of the first round 2 render:
```text
text: 13 frames checked, up to 10 text boxes on a frame, 5 issues
warning: text: "Visa form, due 5:00 pm" reaches 3.0:1 against 90% of the background under it at frame 75, under 4.5:1 (numbers.md, Contrast behind text)
warning: text: "1 of 3" reaches 3.0:1 against 90% of the background under it at frames 105-150, under 4.5:1 (numbers.md, Contrast behind text)
warning: text: "2 of 3" reaches 3.0:1 against 90% of the background under it at frame 210, under 4.5:1 (numbers.md, Contrast behind text)
warning: text: "3 of 3" reaches 3.0:1 against 90% of the background under it at frame 330, under 4.5:1 (numbers.md, Contrast behind text)
warning: text: "Upload" reaches 3.0:1 against 90% of the background under it at frame 450, under 4.5:1 (numbers.md, Contrast behind text)
```

Notes, by frame:
- 75 and 90: the line "2:00 pm. Three things missing." is up while the hands are still rewinding (they reach 2:00 at 105). The copy runs ahead of the clock.
- All the label warnings: the sage label on paper is 3.0:1. The labels are the small line above each headline.
- 60 to 105: the rewind itself reads well: the card unwinds, the checklist unticks, the hands run back.
- 540: the upload bar is about 20% at 540, as the numbers say.
- 629: the headline and checklist fade out before the clock close, as planned.
- 720 and 870: the clock close holds; the minute hand is near 12 at 870.
- 959: the ending card reads: "Submitted.", "Pipit", "4:59 pm. One minute to spare."

Fixes applied for round 2:
1. The rewind line becomes the label "At 2:00 pm, three things are missing" and the line "Rewind to 2:00 pm.", shown from 60 while the hands start back, so the copy matches what the clock is doing.
2. Label ink: the small labels and the "Pipit" name use #3F4E3E (was the sage #5E6E5C, 3.0:1), which clears 4.5:1 on paper. The sage stays for the art.
3. Headline entry: opacity fades in over 4 frames starting one frame after the cut, the rise stays at 9 frames (the round 1 fix).

Prompt amendments that go with rounds 1 and 2 (recorded in prompt.md under "Amendments"): the checklist card, the statement close at 1.3x on focus y 930, the rush at 1.3x alternating focus y 960 and 1040, the phone leaving the frame from 630, the photo line split at 285, the 4-frame headline fade, the rewind line, and the label ink.

## Round 3 check and label fixes

- v3 stills (`out/v3-round3/stills.png`, `--text`): no warnings after the label ink change. The first ink change (#3F4E3E) still gave 4.2:1 on the checker, against roughly 7.5:1 by my own WCAG calculation on paper. Not investigated further; the labels are now the piece's ink (#2B2420).
- Look: the top label "At 2:00 pm, three things are missing" ran into the clock rim at 60, 75 and 90. Fix: shorter label "At 2:00 pm: three missing" (out/v6-label/stills.png, `--text`: no issues).

## Audio: the score (after the lab loop)

Audio iterations used `--audio-only` on the rendered frames, plus `--frames 0 --hits ...` for timing and level.

- Final render 1 (`out/final-render.log`): `FAIL`, `audio: the limiter took 20.8 dB off the hottest peak, over 6 dB, which flattens the hit on frame 900`. Cause: the payoff summed four full-amplitude triangle partials with no per-partial gain. Fix: 0.12 per partial.
- The caption "From your bank" read 2.8:1 on the card (`--text`, frames 152 to 209). Fix: the piece's ink.
- Limiter iterations: wood ticks 1.0 to 0.6 (decay 0.06 to 0.15): 11.1 to 9.3 dB. Whoosh 0.5 to 0.05: no change (it was not the peak). Kick 0.8 to 0.5 to 0.35: 10.1 to 6.8 dB. Frame 105 tick to 0.4, frame 210 tick to 0.4, frame 450 tick to 0.4: removed the peak at each.
- Payoff hold 0.12 to 0.08: the loudest 100 ms moved to 12.50 s (frame 375), so the payoff stopped being the loudest moment. Reverted to 0.12.
- A Web Audio pitfall found while measuring: a GainNode's gain is 1 until its first automation event, and `strike()` began its envelope at t - 1 ms. The 65 Hz sub started about 3.8 ms before its crest, so it sounded at full amplitude for about 2.8 ms (the 0.9 peak behind the 20.8 dB result). Fix: `setValueAtTime(0, 0)` at the start of `strike()`.
- Timing: each tone starts a quarter period before its peak. Every hit now peaks within 0.06 ms of (F + 1) / 30 s.
- Balance: every hit within 3.4 to 6.0 dB over the bed (`--hits`). Shaker 0.25 to 0.15. Rush plucks 0.42 to 0.34, the 360 pluck 0.26, the 292 pluck 0.17.
- The payoff's loudest 100 ms starts at 30.10 s (frame 903), three frames after the word appears: the 100 ms windows in render.mjs step by 100 ms from 0 s, so the start snaps to that grid.

## Final render (passed)

Command, run from `e2e8`:
`NODE_PATH=<rtest>/node_modules node <skill>/scripts/render.mjs piece.html --seconds 32 --fps 30 --size 1080x1920 --audio --text --safe 14,35,6,6 --out out/final`

Output (`out/final-render-2.log`, verbatim, `exit=0`):

```text
  96/960 frames
  192/960 frames
  288/960 frames
  384/960 frames
  480/960 frames
  576/960 frames
  672/960 frames
  768/960 frames
  864/960 frames
  960/960 frames
frames: 960 in 256.3s -> .../out/final/frames
text: 960 frames checked, up to 13 text boxes on a frame, no issues
deterministic: frame 480 drawn twice is identical
sheet: .../out/final/sheet.png (frames 0, 80, 160, 240, 320, 400, 480, 560, 640, 720, 800, 880)
audio: rendered -21.2 LUFS, -4.7 dBTP -> -14.1 LUFS, -2.2 dBTP (gain 7.9 dB in the last pass, limiter took 5.4 dB at the hottest peak, 2 passes)
warning: the limiter took 5.4 dB off the hottest peak, which flattens the hit on frame 105 (its peak at 3.533 s): tame it in the score: spread its energy over a longer decay, or lower --lufs for a few hits alone (sound.md, Balance)
payoff: the loudest 100 ms starts at 30.10 s (frame 903), -10.3 dBFS; in the 2 s before it, 1.9 s at -40 dBFS or under, ending at 30.00 s (sound.md, The arc)
mp4: .../out/final/piece.mp4 (High,yuv420p,bt709,bt709,bt709,30/1, 2.28 MB)
decoded MP4 audio: -14.2 LUFS, true peak -2.1 dBTP
OK
```

Sheet read: `out/final/sheet.png`. Opening Submitted at 4:59 (f0), rewind card and checklist unticking (f80), statement with "bank statement" and "March statement / From your bank" (f160), photo cropped with the chip (f320), form filled and "All three done." (f400), upload from 0 to about 20% (f480 and f560), clock close (f640, f720, f800, f880). The payoff (f900 to f959) was checked on the v3 stills (`out/v3-round3/stills.png`, frame 959), not on this sheet.
