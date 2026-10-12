# Lab log

Rounds are numbered as the review loop counts them: round 0 is the first stills of the first build. Every fix names the frames it came from. Stills are in `out/<round>-stills/`.

## Round 0: first build, stills and text checks

Stills: `out/r0-stills/stills.png`, 19 frames, `--text`. Output: `frames: 19`, `text: 19 frames checked, up to 2 text boxes on a frame, 2 issues`, two contrast warnings, `deterministic: frame 0 drawn twice is identical`, `OK`.

Notes, frame by frame:
- f170 to f300: the counter "1948" sits on the LP's top-left edge. `--text` reads it at 2.4:1 against the background under it.
- f820 to f1079: the counter "2008" runs into the phone's top edge. At f820 to f1079 `--text` reads it at 4.5:1 or less, and at f940 to f1079 the payoff phone's top sits under the counter.
- f600: the CD, #cdc6b8 on the paper, reads as a faint grey shadow. Its outer ring is too light to show the edge.
- f40 to f139: the label wipes on and holds still. Nothing else to change.
- f150 to f179: the morph works. The label has left, the cylinder becomes the LP on the blank sheet, and the counter counts.

Fix for round 1 (only what the notes name):
- Hero centre 560,470 to 600,500 for the holds and the morph pivot, so the counter's ink clears the LP and the phone.
- Payoff phone to 330,500, cylinder to 770,500, camera pivot to 550,500.
- CD fill #cdc6b8 to #bcb5a6, outer ring #b7b0a2 to #9c9486, inner ring #e9e4da to #d3ccbd.

## Round 1: the layout fixes

Stills: `out/r1-stills/stills.png`, 22 frames, `--text`. Output: `text: 22 frames checked, up to 2 text boxes on a frame, 1 issue`, one warning: `"1948" reaches 4.5:1 against 90% of the background under it at frame 170`. `OK`.

Notes:
- f820, f899, f939 and f940 to f1079: the counter clears the phone at the new centre and no longer warns. The CD reads at f500 and f600.
- f170: the morph's peak zoom of 1.15 pushes the LP's top-left edge into "1948" again. The warning is at 4.5:1, a single frame at the morph's peak.

Fix for round 2:
- Morph camera peak 1.15 to 1.10: ramp `1.03 + 0.07`, hold 1.10, pull back `1.10 - 0.10`.

## Round 2: the morph's peak zoom

Stills: `out/r2-stills/stills.png`, frames 139, 145, 150, 155, 160, 165, 170, 175, 179, 180, `--text`. Output: `text: 10 frames checked, up to 2 text boxes on a frame, no issues`. `OK`.

Notes:
- f145 to f155: the label leaves and the cylinder starts to change. The counter reads 1877, 1881 at f155 as it starts to count.
- f160: the mid-morph body reads as a mixed shape, with the LP's label on a brown body. The mix is inside one object, on the blank sheet, which the skill allows. The counter reads 1913 at f160 and 1944 at f165.
- f170 to f180: the counter clears the LP at the reduced zoom. No warning.

No further visual fix: the morph reads, the holds read, the text is clear.

## Audio round A: the hit balance

Probe: `out/audio-probe/` (before the balance fix), then `out/audio-probe2/` (after).
- Before: every hit peaked at -0.06 ms of its frame, which is inside the 1 ms bound. The levels read 7.3 to 8.2 dB over the bed, above the 3 to 6 dB target. Frame 40 read 23.8 dB, because the first chord did not start until frame 40, so the bed in its first 60 ms was silent.

Fix:
- The first chord starts on frame 0 instead of 40, so the bed is full when the first hit lands.
- Soft hit partials 0.13 and 0.04 to 0.092 and 0.028: a 3 dB trim of the hit, not a boost of the bed.

After: frame 40 2.8 dB, 180 4.9 dB, 340 4.6 dB, 500 5.4 dB, 660 4.5 dB, 820 5.3 dB. Peaks still at -0.06 ms. Frame 40 sits 0.2 dB under the floor; I did not fix it further.
- Frame 940 reads 34.8 dB over the bed, as expected for a stab after silence. sound.md says to judge it against the bed before the drop, and the full render's payoff line is the check for that.

## Full render, first pass: FAIL on the limiter

Command: `NODE_PATH=<rtest>/node_modules node ../e2e9-skill/scripts/render.mjs piece.html --seconds 36 --fp 30 --size 1080x1080 --audio --hits 40,180,340,500,660,820,940 --text --out out/final`, with `out/final/render.log`. Frames: 1080 in 372.2 s.

Output: `text: 1080 frames checked, up to 2 text boxes on a frame, no issues`, `deterministic: frame 540 drawn twice is identical`, a dead-beat warning for frames 519 to 615, and the audio failed. The mix rendered at -29.3 LUFS, so the makeup gain was 16.0 dB and the big stab on frame 940 went 11.9 dB into the limiter: `audio: the limiter took 11.9 dB off the hottest peak, over 6 dB, which flattens the hit on frame 940 (its peak at 31.367 s)`. Exit 1.

## Audio round B: the big moment

Fix:
- The big stab's four partials 0.12, 0.14, 0.12 and 0.10 to 0.042, 0.049, 0.042 and 0.035, about 9 dB lower, so the peak sits at about -15 dBFS before the gain. The 80 ms hold and the 1.2 s decay stay as they were.

Pass: `out/final/render-audio-only.log`, run with `--audio-only`, since the frames did not change. Output: `audio: rendered -30.1 LUFS, -15.4 dBTP -> -14.0 LUFS, -2.2 dBTP (gain 16.1 dB in the last pass, limiter took 2.9 dB at the hottest peak, 1 pass)`, the payoff line at frame 942 (the hit on frame 940), the hits within 0.06 ms, the decoded MP4 at -14.1 LUFS and -2.1 dBTP, and `OK`. The limiter took 2.9 dB, under the 3 dB warning line.

## Final state

- Final MP4: `out/final/piece.mp4` (H.264 High, yuv420p, tagged bt709, 30/1, 1080x1080, AAC 48 kHz stereo, 36.000 s, 5.32 MB).
- Final sheet: `out/final/sheet.png`, read in full. Every beat reads: cylinder, LP, cassette, CD, player, phone, then the phone and cylinder side by side at 990.
- Open, not fixed: frame 810 (morph 780 to 820, pull-back at a zoom of about 1.10). The "2008" counter touches the top-left corner of the zooming phone, a few pixels at about frames 800 to 815. `--text` did not flag it. Only the corner overlaps, so the 10th-percentile contrast check passes.
- Open, not fixed: the dead-beat warning for frames 519 to 615 (3.2 s). The CD hold has only a push and no new move, and the warning is advisory.
