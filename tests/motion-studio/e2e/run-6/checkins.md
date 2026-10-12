# Check-ins

Nobody is there to answer, so each check-in is written as it would be shown, the question is noted, and the default is taken from the brief. Defaults are listed in prompt.md.

## Check-in 1: the story

**Idea in one line:** one message, one bubble, leaves a sender's phone, waits on a server while the friend's phone is off, arrives when it turns on, and its two grey ticks turn blue when it is read.

**Device:** the bubble is the one constant (the hero). It stays at the same spot on screen for the whole piece while the cards it passes through move around it.

**Format: fixed-hero journey.** The brief is one carried thing through several places. Two formats fit that in story.md: fixed-hero journey (proven: several short explainers) and machine (studied only). The rule says to take the proven one when two fit, so it is fixed-hero journey. Its legs follow story.md's path rule, one travelling camera and no cut, because the places sit on a path. Hits and text changes land on the 120 BPM grid.

**Length and clock:** 30 s, 30 fps, 900 frames, one shot, no loop (it ends on an end card). 120 BPM: a beat is 15 frames, a bar is 60.

**Canvas:** 1080x1920 (9:16) for Reels and TikTok, and 1080x1080 (1:1) for X, both from one file (delivery.md, One piece in several shapes).

**Sound:** a synthesized score, because the brief asks for one: a pad bed, a click on send, one big moment on read, and a 1.1 s silence before the read.

**Beat table**

| Frames | Time | Beat | What the viewer sees | Link to next beat | Sound |
|---|---|---|---|---|---|
| 0-59 | 0.0-2.0 s | Start | Empty composer on the sender's card; big line "Send a message." | typing starts on bar 2 | pad fades in |
| 60-119 | 2.0-4.0 s | Build | "See you at 7?" types, one character every 4 frames; send press at 114 | send on beat 8 | pad |
| 120 | 4.0 s (beat 8) | Change: send | composer becomes a sand bubble (frames 119-131); ticks appear at 125 | same frame, lock | HIT 1: click, peak at frame 121 (4.033 s) |
| 126-161 | 4.2-5.4 s | Change: lock | big "Locked on your phone."; text dissolves to nine dots; padlock closes; label "End-to-end encrypted." at 150 | hold | pad |
| 162-239 | 5.4-8.0 s | Hold | locked bubble and its label | leg 1 starts on bar 5 | pad |
| 240-299 | 8.0-10.0 s | Travel 1 | one camera leg: the bubble stays at the anchor, the sender card drops away, the server card rises; lines fade out 232-239 | no cut | pad |
| 300-449 | 10.0-15.0 s | Wait | server holds the bubble; big "Their phone is off." at 306; label "The server holds it." at 330; power symbol on the dark friend phone at 366 | phone lights on beat 30 | pad (quiet) |
| 450-479 | 15.0-16.0 s | Phone on | friend's screen lights 450-465; old lines fade out 446-453 | leg 2 on bar 9 | pad |
| 480-539 | 16.0-18.0 s | Travel 2 | one camera leg: server card drops away, friend card rises; hero still at the anchor | no cut | pad |
| 540-623 | 18.0-20.8 s | Arrival | big "It arrives when the phone turns on." at 546; label "Grey ticks: not read yet." at 570; ticks grey | silence | pad |
| 624-659 | 20.8-22.0 s | Silence | bed drops 20 dB over 624-637 and stays down; picture holds; tap ring at 642 | read on beat 44 | DROP, 1.1 s |
| 660-671 | 22.0-22.4 s | Payoff: read | ticks turn blue (first change at 660); big "Read." and label "The ticks turn blue." at 668 | hold | HIT 2: chord stab, peak at frame 661 (22.033 s) |
| 672-779 | 22.4-26.0 s | Hold | label "Sent, locked, waited, read." at 720 | end card on bar 13 | bed returns over 672-705 |
| 780-899 | 26.0-30.0 s | End | big "See you at 7." at 780; world pushes 2% around the hero | one shot ends | pad fades out |

**Facts on screen, and their source.** The brief is the only source; Pigeon is made up and has no assets or brand.
- "See you at 7?" is the typed text (brief).
- "Locked on your phone." and "End-to-end encrypted." (brief: it locks, end-to-end encrypted).
- "Their phone is off." and "The server holds it." (brief: waits there while your friend's phone is off).
- "It arrives when the phone turns on." (brief).
- "Grey ticks: not read yet." and "The ticks turn blue." (brief: two grey ticks turn blue when it's read).
- Click on send and one big moment on read (brief: the score).
- Colours are derived, not sourced (prompt.md, LOOK).

**Question I would ask:** approve these beats, change beats, or another angle?
**Default taken:** the beats above as written, since the brief is the answer.

## Check-in 2: the look (style frames, build v1)

Rendered from `piece.html` (build v1) at full size with `render.mjs --frames 0,300,660 --text`. Each is checked against LOOK and BANNED. Sheet: `out/style-v1/stills.png`.

| Frame | Still | Against LOOK and BANNED |
|---|---|---|
| 0 (start) | `out/style-v1/stills/00000.png` | Paper, ink, one static caret, no glow, no gradient. Fine. Note: the white cards with grey bars read as a generic app layout; accepted for calm. |
| 300 (wait) | `out/style-v1/stills/00300.png` | Sand bubble with dots and padlock: fine. The dark phone at the bottom is a large #2B2E35 slab that is the heaviest mass in the frame. Not a backdrop (BANNED does not apply) but it pulls the eye down. Kept for v1; reviewed in round 1. |
| 660 (read) | `out/style-v1/stills/00660.png` | Fails the payoff. The ticks turn blue but are 36 px wide on a 1080 frame, so the one accent barely shows. The label still reads "Grey ticks: not read yet." on this frame, which contradicts the ticks. A leaving card's bottom edge runs under "It arrives when the phone turns on." Notes go to round 1. |

**Question I would ask per frame:** approve frames 0 and 300; change frame 660 (ticks too small, label one frame late, card edge under text)?
**Default taken:** frames 0 and 300 approved as they are; frame 660 changed in round 1 (see log.md).

## Check-in 3: the storyboard (build v1)

One still per beat, 19 frames from the same build, with `--text`. Sheet: `out/beats-v1/stills.png`; stills in `out/beats-v1/stills/`.

Panels: 0, 60, 120, 126, 150, 240, 300, 330, 366, 450, 480, 546, 570, 630, 660, 668, 720, 780, 899.

Panel notes, by number, as the user would mark them:
- 570, 630, 720: a leaving card's bottom edge runs under the big or label text. Down.
- 660: ticks too small; label still "Grey ticks: not read yet." on the read frame. Down.
- 668: "Read." appears one frame after the read; the label should change on the read frame too. Down.
- 366 and 450: the power symbol and dark phone read clearly at the bottom edge. Up.
- Panels 0, 60, 120, 126, 150, 240, 300, 330, 480, 546, 780, 899: as the brief describes; up.

**Question I would ask:** approve these panels, mark the down ones with notes?
**Default taken:** the down panels get the notes above and are fixed in round 1; the rest stand.
