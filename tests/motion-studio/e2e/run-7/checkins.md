# Check-ins: what I would show the user

No one is available to answer. Per the brief, each check-in below is written as what would be shown, with the question that would be asked and the default taken from the brief. Check-in 1 is written first. Check-ins 2 and 3 are appended after the stills are rendered.

## Check-in 1: the story

**One-line idea:** The view glides along one long diagram of the phone's steps, from the scene to the gallery, and pulls back at the end to show the whole chain.

**Device:** a moving camera over one fixed diagram. No cuts. The photo changes in place at each station, and the camera's glide is the only change of place.

**Format: Machine** (story.md, Pick the format from the plot).
- Why: the brief names a path worked through station by station, with one travelling view and no cuts. story.md says that path "gets one travelling camera and no cuts", with about 1 s eased pans between stations and a zoom out over the whole layout in the last 4 to 7 s. Those are the brief's three requirements.
- The proven format, Fixed-hero journey, cuts on the beat. The brief rules that out, since it asks for the view to glide.
- Machine is listed as "studied only" in story.md's table, not "proven". This is a limit of the skill, and I note it as a finding.

**Length, clock and sound:** 40 s, 30 fps, 1200 frames. No voice. The brief asks for a synthesized score, so SOUND is on. No BPM grid: the chords change on each station's arrival, and each step's change gets a soft tick.

**Source of each fact on screen** (no web search, per the brief):
| Fact on screen | Source |
|---|---|
| 12 million pixels | the brief |
| Each pixel sees one colour (red, green or blue) | the brief |
| Half of the pixels see green | the brief (a red-green-green-blue filter mosaic: my own knowledge, not checked against a source here) |
| Two missing colours guessed from neighbours | the brief |
| The sensor counts light evenly, eyes do not; a tone curve lifts shadows | the brief |
| 8 by 8 blocks, fine detail dropped | the brief |
| File about a tenth the size | the brief |
| The photo lands in the gallery | the brief |

**Beat table** (seconds, frame = seconds x 30):

| # | Time (frames) | Beat type | What happens | Link into the next beat | Sound's part |
|---|---|---|---|---|---|
| 1 | 0.0-2.0 (0-59) | Start | The scene: a yellow mug on a blue table at medium close-up. Caption: "What your phone does to a photo". | Glide | Pad on F major, quiet |
| 2 | 2.0-3.0 (60-89) | Travel | Glide to station 1 (one-second eased pan) | Arrive | Pad turns to A minor 7 at frame 90 |
| 3 | 3.0-7.0 (90-209) | Change: step 1, the sensor | The mug becomes a red, green and blue mosaic at 3.2 s (frame 96). Caption at 3.4 s. A stacked bar (25/50/25) grows at 5.2 s. | Glide | Soft tick at frame 96 |
| 4 | 7.0-8.0 (210-239) | Travel | Glide to station 2 | Arrive | (pad change at 240) |
| 5 | 8.0-12.0 (240-359) | Change: step 2, filling in | A diagonal sweep at 8.2-9.2 s turns the mosaic into full colour that is still dark. Caption at 8.4 s. | Glide | Soft tick at frame 246 |
| 6 | 12.0-13.0 (360-389) | Travel | Glide to station 3 | Arrive | (pad change at 390) |
| 7 | 13.0-17.0 (390-509) | Change: step 3, brightening | An inset tone curve draws at 13.2-14.2 s while the picture lifts. Caption at 13.4 s. | Glide | Soft tick at frame 396 |
| 8 | 17.0-18.0 (510-539) | Travel | Glide to station 4 | Arrive | (pad change at 540) |
| 9 | 18.0-22.0 (540-659) | Change: step 4, JPEG | The 8 by 8 grid fades in at 18.2 s and detail falls to 22%. Size bars at 20.2-21.7 s: the JPEG bar shrinks to a tenth. | Glide | Soft tick at frame 546 |
| 10 | 22.0-23.0 (660-689) | Travel | Glide to station 5, the gallery | Arrive | |
| 11 | 23.0-24.8 (690-743) | Travel with the photo | The JPEG photo flies from station 4 into the gallery's top-left slot, camera holding on the gallery | Hover | Pad falls silent by 24.4 s |
| 12 | 24.8-26.4 (744-791) | Turn: the silence | The photo hovers above the slot. Nothing moves but the slow push. | Drop | Silence, 25 dB or more below the pad, 1.6 s |
| 13 | 26.4 s (792) | Payoff: the photo lands | The photo drops into the slot. Its yellow outline fades 26.6-27.0 s. Caption at 27.4 s. | Hold | The big moment: a chord stab, sub and bell on frame 792 |
| 14 | 27.4-31.0 (822-929) | Connection / hold | The gallery with its new photo, slow push | Pull back | Flat F major from the payoff |
| 15 | 31.0-37.0 (930-1109) | Pull back | One move over the whole diagram, scale 1.12 to 0.213, geometric | Overview | Pad continues |
| 16 | 37.0-40.0 (1110-1199) | Ending: the whole diagram | Held overview, slow 2% creep. Caption at 37.2 s: "Five steps, from shutter to gallery". | End | Pad fades out 36.5-39.5 s |

**Pace (story.md, Pace):** something new every 2 to 4 s is the target. The longest holds without a change are beats 11 to 14 (about 3.6 to 4 s) and the final hold. render.mjs will say whether they warn.

**Questions I would ask here:** Approve this beat table, change the beats, or take another angle? Default taken: approve as written.

---

## Check-in 2: the look

Four of the most different beats, full size, from the first build (round 1, `out/r1/stills/`), each read against LOOK and BANNED. Asked per frame; no answer, so the default is noted.

| Frame | Time | Beat | Still | Against LOOK / BANNED | Default taken |
|---|---|---|---|---|---|
| 135 | 4.50 s | Sensor: mosaic | `/private/tmp/claude-501/-Users-husni-github-com-husniadil-skills/38243fd8-cfe2-426f-ac4c-6945ced69b7d/scratchpad/e2e7/out/r1/stills/00135.png` | The red, green and blue dots read as a sensor; the yellow mug is pale and hard to make out (the dots are mixed toward cream). Not banned. | Keep the palette; raise the dot strength so the mug reads. |
| 396 | 13.20 s | Brightening: raw, still dark | `.../out/r1/stills/00396.png` | The raw stage is dark navy and orange, which is the step's point, but the BANNED list names a dark navy backdrop. It is data here, not a backdrop, and the stage stays cream. | Keep the dark data at step 2; say so in the caption. |
| 792 | 26.40 s | The photo lands (hover) | `.../out/r1/stills/00792.png` | Accent used only on the photo; gallery panel and soft shadow as LOOK. No BANNED item. | Keep. |
| 1020 | 34.00 s | Pull back, mid-move | `.../out/r1/stills/01020.png` | The gallery is cut by the frame edge mid-move. That is a moving shot, not text, and the diagram comes in whole by 37 s. | Keep. |

Also read: frame 102 (the wipe, diagonal), 276 (fill-in done), 426 (curve drawn), 600 (blocks), 732 and 744 (flight, hover), 1199 (end). All consistent with LOOK. Sheet: `out/r1b/stills.png`.

Rejected at check-in 2 by my own reading: a dark navy block at step 2 is acceptable only as the raw stage. A fresh default is noted in the round 2 log.

## Check-in 3: the storyboard

One still per beat, round 1 build: `/private/tmp/claude-501/-Users-husni-github-com-husniadil-skills/38243fd8-cfe2-426f-ac4c-6945ced69b7d/scratchpad/e2e7/out/storyboard-r1/stills/` (sheet: `out/storyboard-r1/stills.png`).

| Panel | Beat | Frame | Note I would ask the user to mark |
|---|---|---|---|
| 1 | Start: scene | 30 | up: caption and photo as the brief asks |
| 2 | Travel 1 | 75 | up |
| 3 | Sensor: mosaic | 135 | down until the mug reads (noted: round 2 fix) |
| 4 | Travel 2 | 225 | up: the stacked bar is visible at the foot of the view |
| 5 | Fill-in | 276 | up |
| 6 | Travel 3 | 375 | up |
| 7 | Brightening, inset | 426 | up |
| 8 | Travel 4 | 525 | up |
| 9 | JPEG blocks | 600 | up: the block grid reads; bars come at 20.2 s |
| 10 | Travel 5 | 675 | up: size bars visible at the foot |
| 11 | Flight | 720 | up |
| 12 | Turn: hover, silence | 760 | up: the photo hangs with nothing new on screen for 1.6 s; a push only |
| 13 | Landing | 792 | up |
| 14 | Gallery, caption | 900 | up |
| 15 | Pull back | 1020 | up: the gallery is cut at the right edge mid-move |
| 16 | Ending: overview | 1150 | up: whole diagram, end caption |

Default taken for every panel: up, except panel 3, which I would ask to be redone (dots too faint). Round 2 changes it.
