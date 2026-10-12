# Check-ins

No user is present for this run. Each check-in below is what I would show the user. The brief is taken as the answer, and each default I picked is noted. The questions I would ask are listed after each check-in, not answered by anyone.

## Check-in 1: the story

**One line:** how recorded music was carried, six media, each one turning into the next through its own object, the year counting up, and the piece ends on the phone beside the cylinder that started it.

**Device, in a sentence:** the object changes shape every era (cylinder, disc, cassette, disc, player, phone), and the first cylinder comes back at the end beside the phone.

**Format: chronology** (story.md, Pick the format from the plot, the proven row for chronology). Why: the drive is real time order with a visible counter, the eras are joined by shape morphs, and the clock is music. Chronology was the only format whose trigger is time with a counter. Mission and the fixed-hero journey are for a want or a carried thing, not a sequence of eras.

**Length and clock:** 36 s, 30 fps, 1080 frames. 90 BPM, 20 frames a beat (a default: the brief gave no tempo). Every arrival sits on a beat. Story.md's chronology row says scenes of 1.5 to 4 s. Holds here are 3.33 to 4 s, and the morphs are 40 frames (1.33 s).

**Five things every piece holds** (story.md):
1. Constant: the counter, top left, in the same place for the whole piece, and the paper.
2. One colour means one thing: the terracotta accent is only ever the year.
3. Silence before the payoff: 900 to 940 on a held picture, then the loudest moment.
4. The end is the start, changed: the cylinder returns beside the phone.
5. One device (above), revealed at the end.

**Beat table**

| Beat | Frames | Time (s) | What happens | Link into next | Sound |
|---|---|---|---|---|---|
| Start | 0-40 | 0.00-1.33 | cylinder at rest, counter 1877, no label | none, label arrives on 40 | bed silent |
| Build, 1877 | 40-140 | 1.33-4.67 | label "Sound, cut into a turning cylinder." writes on at 40; camera pushes 1.00 to 1.03 | morph | soft hit on 40 |
| Morph | 140-180 | 4.67-6.00 | camera closes in, label leaves, cylinder becomes an LP disc on a blank sheet, counter 1877 to 1948 | shape morph | none |
| Build, 1948 | 180-300 | 6.00-10.00 | LP, label "33 1/3 rpm: a whole side at once." | morph | soft hit on 180 |
| Morph | 300-340 | 10.00-11.33 | LP becomes a cassette, counter 1948 to 1963 | shape morph | none |
| Build, 1963 | 340-460 | 11.33-15.33 | cassette, label "An album that fits in a pocket." | morph | soft hit on 340 |
| Morph | 460-500 | 15.33-16.67 | cassette becomes a CD, counter to 1982 | shape morph | none |
| Build, 1982 | 500-620 | 16.67-20.67 | CD, label "Read by a laser, not a needle." | morph | soft hit on 500 |
| Morph | 620-660 | 20.67-22.00 | CD becomes a portable player, counter to 1998 | shape morph | none |
| Build, 1998 | 660-780 | 22.00-26.00 | player, label "The first portable MP3 player." | morph | soft hit on 660 |
| Morph | 780-820 | 26.00-27.33 | player becomes a phone, counter to 2008 | shape morph | none |
| Build, 2008 | 820-900 | 27.33-30.00 | phone at centre, label "Streaming on a phone, in your hand."; label leaves 900-910 | hard cut at the payoff | soft hit on 820 |
| Turn, silence | 900-940 | 30.00-31.33 | held picture: phone at rest, no label | drop, then the slam | bed silent from 900; no hit |
| Payoff | 940 | 31.33 | hard cut: phone at left, cylinder at right, the cylinder slams in | the reveal | big moment on 940, peak at 941/30 s |
| Ending | 960-1079 | 32.00-36.00 | label "Still the same sound." writes on at 960; the pair pushes 1.00 to 1.02 | held write-on, the last frame is not frame 0 | pad under the held card, no hits |

**Joins (planned):** five shape morphs, one hard cut (the payoff slam at 940). A piece joined by morphs keeps at most one hard cut (story.md, Cuts and morphs), so this matches. Each morph is 40 frames (1.33 s), and story.md's "shorten each to 0.8 s" applies under 30 s; the piece is 36 s, so the 1.33 s morph stands. That reading is a judgement call, logged in findings.

**Facts on screen, each with its source.** The brief forbids web search, so no source could be checked. Each fact is from my own knowledge, not checked:
- 1877, phonograph and cylinder: Edison's phonograph, 1877 (own knowledge, not checked).
- 1948, long-playing record at 33 1/3 rpm: Columbia, 1948 (own knowledge, not checked).
- 1963, compact cassette: Philips, 1963 (own knowledge, not checked).
- 1982, compact disc read by laser: 1982 (own knowledge, not checked).
- 1998, first portable MP3 player: the brief's own claim, repeated, not checked.
- 2008, streaming on a phone: the brief's claim, repeated, not checked.

**Questions I would ask the user:**
1. Approve the beats, or change them?
2. Is 90 BPM right, or does the user have a tempo in mind?
3. Is "The first portable MP3 player." the line they want for 1998, or a line that says the year's point?
4. Is the closing line "Still the same sound." wanted? The brief asked for one line per era and did not mention an ending line.

**Defaults I picked without asking:** the 90 BPM tempo; the closing label; the soft bed under the hits (the brief asked for a score, which a bed makes); the silence at 900 to 940.

## Check-in 2: the look (style frames)

Four of the most different beats at full size, rendered with `render.mjs --frames 100,400,600,1000 --out out/style`, read against LOOK and BANNED:
- Sheet: `e2e9/out/style/stills.png`. Full size: `e2e9/out/style/stills/00100.png`, `00400.png`, `00600.png`, `01000.png`.
- f100, 1877 cylinder: paper, ribs and the highlight read as wax. Label on the table line, 46 px. Nothing banned in it.
- f400, 1963 cassette: the window, reels and label band read. The cassette is the strongest object in the set.
- f600, 1982 CD: the disc is #cdc6b8 on paper #efe6d3, a low contrast. It reads faint, almost a grey shadow. Fix in round 1.
- f1000, the payoff: the phone and cylinder side by side, the label "Still the same sound." Overlap: the phone's top edge runs into the counter "2008". Fix in round 1.

What I would ask per frame:
1. f100: is the wax cylinder's colour right for the warm, tactile brief? Assumed yes.
2. f400: is the cassette too heavy for the 1963 beat? Assumed no.
3. f600: approve a darker CD, or a different silver? Assumed a darker one (round 1).
4. f1000: is the counter's overlap with the phone acceptable? Assumed no (round 1).

Look-check verdict (default, no user): the palette, the materials and the type pass, with the CD and the counter-overlap fixes queued.

## Check-in 3: the storyboard

One still per beat, from the first full set of stills (19 frames, in the approved look for each beat). Sheet: `e2e9/out/r0-stills/stills.png`; the same frames at full size in `e2e9/out/r0-stills/stills/`.

| Beat | Still (frame) | Panel note I would ask the user to mark up or down |
|---|---|---|
| Start, 1877 at rest | f0 | up: the cylinder at rest, no label |
| Build, 1877 label wiping on | f40 | up: the label wipes in on its arrival frame, as planned |
| Build, 1877 full label | f100 | up |
| Hold, 1877 push | f139 | up |
| Morph start, cylinder zoomed in | f150 | up: the camera closes in as planned |
| Morph, LP forms | f170 | down: the counter "1948" is over the LP's top-left edge (see the contrast warning) |
| LP arrives | f179 | up |
| Build, 1948 label wiping on | f180 | up |
| Build, 1948 full label | f300 | down: counter over the LP's edge again |
| Morph, LP to cassette | f340 | up |
| Build, 1963 cassette | f400 (style frame) | up |
| Build, 1982 CD | f500 | down: the CD reads faint |
| Build, 1998 player | f660 | up |
| Build, 2008 phone | f820 | down: counter over the phone's top |
| Silence, 2008 held | f900 | up |
| Payoff, phone and cylinder side by side | f940 | down: counter over the phone's top edge |
| Ending, label writes on | f960 | down: the counter collides with the phone's top edge at x 380 to 430 |
| End card | f1079 | up |

The storyboard's verdict, without a user: the sequence reads, and the downs are the two overlaps and the CD. The round-1 fixes name these frames.
