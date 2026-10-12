# Check-ins: Pipit visa ad (32 s, 9:16, 1080x1920)

No one was available to answer. Per the run's instructions, each check-in below is what I would show, the question I would ask, and the default I took. The brief is treated as the approval.

## Check-in 1: the story

**Idea and device.** Rina has until 5:00 pm and three things are missing at 2:00 pm. Pipit fixes them one at a time. The wall clock is the device: it runs back from 4:59 to 2:00, runs forward through the three fixes, slows near 12 under a silent score, and the form goes in at 4:59.

**Format: Mission** (story.md, Pick the format). What drives it: someone wants something and cannot have it yet; a helper solves it one problem at a time; the piece opens on the goal achieved and rewinds. Stage: cut on the beat, wide and close in turn, one prop that marks time (the wall clock). Clock: 120 BPM, 15 frames a beat, 2 s bars, vignettes of 3.5 to 4 s, a rush of four 0.5 s cuts, the deadline in silence for 3 s, the payoff held 2 s. animate lists Mission as proven on a 32 s story. Why this and not a chronology: the piece is about one deadline, not a history of eras. Why not a fixed-hero journey: the hero does not travel between places; the phone and the clock stay put.

**Length, BPM, voice.** 32 s at 30 fps = 960 frames (0 to 959). 120 BPM, beat n at frame 15n. No voice: on-screen lines only.

**The five things every piece holds.**
1. Constant: the wall clock, top right, present in every shot.
2. One colour, one meaning: terracotta accent #C8552B marks the deadline only (the 12 tick and the minute hand). Nothing else takes it.
3. Silence before the payoff: bed stops at frame 810, nothing sounds 810 to 899, the loudest hit lands on 900.
4. The end is the start, changed: frames 0 to 59 open on the submitted phone at 4:59 with a small line; frames 900 to 959 end on "Submitted." big, with the clock still at 4:59.
5. The device sentence above, shown in full from 630 to 899 (66% to 94% of the length), the close on the clock.

### Beat table

| Frames | Time | Beat (story.md) | What happens on screen | Link into next beat | Sound |
|---|---|---|---|---|---|
| 0 to 59 | 0.0 to 2.0 s | Start | Wide. Clock at 4:59. Phone on its Submitted card, checklist all ticked. Line: "Submitted at 4:59 pm." | Rewind starts on the beat, 60 | Pad only, quiet |
| 60 to 104 | 2.0 to 3.5 s | Time passes (rewind) | Clock hands run back from 4:59 to 2:00 pm (ease-in-out-cubic). Upload bar unwinds. Checklist unticks. "2:00 pm. Three things missing." from 75 | Hard cut on the beat, 105 | Reverse whoosh 60 to 104; wood tick on 105 |
| 105 to 209 | 3.5 to 7.0 s | Problem 1: statement | Close on the phone. "bank statement" typed 110 to 138. Result found 150. Row 1 ticks at 165. Line: "Bank statement found in your email." | Hard cut on the beat, 210, to wide | Wood tick 105; pluck on 165 |
| 210 to 329 | 7.0 to 11.0 s | Problem 2: photo | Wide. Camera roll grid. Crop box moves onto the face 240 to 270. "Cropped" chip at 285. Row 2 ticks at 292. Line: "Passport photo, cropped." | Hard cut on the rush, 330 | Wood tick 210; pluck on 292 |
| 330 to 389 | 11.0 to 13.0 s | Problem 3: form, rush | Four 0.5 s cuts (330, 345, 360, 375), each a close on one field filled from the passport scan. Line: "Filling the form." | Hard cut to wide on 390 | Pluck on each of the four cuts |
| 390 to 449 | 13.0 to 15.0 s | Form done | Wide. Line: "All three done." Row 3 ticks at 395 | Hard cut on the upload, 450 | Pluck on 390 |
| 450 to 629 | 15.0 to 21.0 s | Travel (upload) | Wide, 2% push. Upload bar fills steadily from 0 at 450 to 100 at 900. Clock 3:23 to about 4:06. Line: "The clock doesn't wait." | Hard cut to the close on the clock, 630 | Wood tick on 450; bed (kick, shaker, pad) |
| 630 to 809 | 21.0 to 27.0 s | Time passes, close | Close on the clock (1.6x). The hero. Hands run from about 4:06 to 4:50. Bed in full, the densest stretch | Bed stops at 810 | Full bed |
| 810 to 899 | 27.0 to 30.0 s | Quiet | Same close, held. Hands slow from 4:50 to 4:59 (ease-out-quad). Upload bar reaches 100 at 900 | Hard cut on the payoff, 900 | Silence from 810; no tail runs into it |
| 900 to 959 | 30.0 to 32.0 s | Payoff and end | Hard cut to wide. "Submitted." big at the centre. Phone slides out of frame. Clock at 4:59. Label "Pipit". Line: "4:59 pm. One minute to spare." | Holds to the end (no loop) | Loudest hit on 900 (peak at 30.033 s), held 80 ms, decay 0.45 s |

### Facts on screen and their sources

| On screen | Source |
|---|---|
| Visa form due 5:00 pm | Brief: "submit her visa application by 5:00 pm today" |
| Submitted at 4:59 pm | Brief: "The upload finishes at 4:59" |
| 2:00 pm. Three things missing. | Brief: "at 2:00 pm she's missing three things" |
| Bank statement, found in your email | Brief: "Pipit finds the statement in her email" |
| Passport photo, cropped from your camera roll | Brief: "crops a passport photo from her camera roll" |
| Filled from your passport scan | Brief: "fills the form from her passport scan" |
| One minute to spare | Arithmetic: 4:59 pm to the 5:00 pm deadline |
| Pipit, Rina | Brief: made-up names |

### What I would ask

"Approve, change beats, or another angle?" Default taken: approve. Defaults I picked on top of the brief: Mission format; 120 BPM; the clock as the device; the accent reserved for the deadline; the phone kept in the safe band for text (14 / 35 / 6 / 6 Reels bands, see prompt.md).

## Check-in 2: the look (style frames)

Four full-size stills from the first build (v0), each against LOOK and BANNED, rendered with `render.mjs --frames 105,240,630,900 --text --out out/v0-style`. Sheet: `/private/tmp/claude-501/-Users-husni-github-com-husniadil-skills/38243fd8-cfe2-426f-ac4c-6945ced69b7d/scratchpad/e2e8/out/v0-style/stills.png`. Frames: `.../out/v0-style/stills/00105.png`, `00240.png`, `00630.png`, `00900.png`.

- **105, close on the phone (statement).** Down. The checklist sits over the phone's bezel, so the ink labels read at 1.0:1 against the bezel. The search screen is empty on its first frame (typing starts at 110), and the headline is still fading in. Fix: back the checklist with its own paper card, and keep the phone's top clear of it in the close shot.
- **240, wide (photo).** Up. The crop box is moving onto the face, the headline and checklist are clear of the phone, and the warm palette holds. Note: the headline says "cropped" from 210, before the crop happens at 240 to 270. Kept for now; logged in the lab loop.
- **630, close on the clock.** Up. The clock is the hero, the accent 12 tick reads, the minute hand is past 4. Nothing else is on screen, which is the quiet the score needs.
- **900, the payoff.** Down. "Submitted." lands over the phone's Submitted card, so the word and the card fight for the same space. Fix: the phone leaves the frame before the cut.
- BANNED check: no gradient, glow, sparkle, robot or particle appears in any of the four. The hand (sage sleeve, skin fingers) reads as a crude blob and is noted for a later pass.

## Check-in 3: the storyboard

One still per beat row of the story table, from the same v0 build: `render.mjs --frames 0,60,105,150,210,330,390,450,630,810,900 --text --out out/v0-storyboard`. Sheet: `.../out/v0-storyboard/stills.png`. Frames: `.../out/v0-storyboard/stills/00000.png` and the other frame numbers, five digits.

Marks, by panel number (the user's mark would be up or down):
- 0 (opening, Submitted at 4:59): up.
- 60 (rewind starts, the card unwinds): up.
- 105 (statement opens): down, same notes as 105 above.
- 150 (typed query, result not yet in): up for the query; the headline is still fading in (its fade starts at 150, so the frame has no line on it).
- 210 (photo, wide): up.
- 330 (form rush, first cut): down. The checklist covers the phone's top edge, and row 4 "Expires" falls in the bottom 35% band (`--text`: "sits under the platform's UI at frame 330").
- 390 (form done): up.
- 450 (upload begins): up.
- 630 (clock close): up.
- 810 (quiet, hands near 4:50): up.
- 900 (payoff): down, same notes as 900 above.

Notes go to the lab loop, log.md, round 1.
