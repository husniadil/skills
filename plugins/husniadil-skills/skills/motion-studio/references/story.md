# Story: from one sentence to a beat table

GOAL says what a piece is for. For a piece over about 20 seconds, or one with a voice, decide next what happens in what order, why each cut happens and where the sound turns, and check that with the user before anything is animated. The rules here come from animate (cth9191, MIT): its author's shot logs of 16 short story-driven animations, and the formats its own pieces were built from. Where a format has carried a finished piece there, the table says so. In this skill, the sixth end-to-end test carried a fixed-hero journey, the seventh a machine, the eighth a mission and the ninth a chronology.

## Five things every piece holds

1. **One constant the eye can hold**: a hero, a stage, a page or an object that stays while everything else changes.
2. **One colour means one thing** for the whole piece (LOOK's accent), never spent on decoration.
3. **Silence before the payoff, the loudest hit on it**: a drop of 15 to 35 dB for 0.5 to 4 s on a held picture, then the single loudest moment on the turn or the reveal (sound.md, The arc). A piece with no turn skips it.
4. **The end is the start, changed**: the opening image again, with what the story did to it.
5. **One device you can say in a sentence** ("the spark gains a ray each era"), usually revealed at 80 to 95% of the length.

## Pick the format from the plot

What makes the next thing happen decides how the piece gets from one thing to the next and what the changes land on. Pick it yourself, since it is grammar, and say why at the story check. When two fit, take the one marked proven.

| Format | What drives it | Stage | Clock | In animate |
|---|---|---|---|---|
| Chronology | real time order, with a visible counter (a year tag) | eras joined by shape morphs and draw-offs, no hard cuts | music or a voice; scenes 1.5 to 4 s | proven: a 60 s history across 15 worlds (13 morphs, one hard cut on the payoff) and a history on one fixed stage |
| Mission | someone wants something and can't; a helper solves it a problem at a time; open on the goal achieved, then rewind | cut on the beat, wide and close in turn, one prop that marks time (a wall clock) | 120 BPM 8ths or 90 BPM 16ths: vignettes of 3 to 4 s, a rush of 4 x 0.5 s, the deadline in silence, the payoff held 2 s | proven: a 32 s story |
| Fixed-hero journey | one carried thing through many places | cut on the beat; in the fastest stretch the hero holds its spot on screen while the world cuts around it | 120 BPM, cuts speeding from the beat to 8ths to 16ths | proven: several short explainers |
| Catalogue | a question answered by a list, gathered into one image at the end | one held card per item | 120 BPM: about 8 cards of 0.5 s, one of 1 s, 4 of 0.25 s, a gather of 2 s | studied only |
| Process loop | the true making steps on one locked framing: the finished thing, back to blank, rebuilt | one framing, one dissolve | fast early steps (about 1.3 s), long near-still holds late; the last frame is frame 0 | studied only |
| Machine | a token through stations, each doing one thing to it | one big drawing, about 1 s eased pans between stations, a zoom out over the whole layout in the last 4 to 7 s | even stations of 7 to 9 s, or 2 to 7 s with a voice | studied only |

- A path where one thing is worked on station by station (the machine) gets one travelling camera and no cuts. A journey through many places (the fixed-hero journey) cuts on the beat, and the hero keeps its spot on screen across the cuts.
- Time passing is joined from inside the scene: a morph or a draw-off.
- Several places or people, or a list, cut on the beat grid (numbers.md, The beat grid).
- A voice takes the clock: the picture changes on sentence ends, and music sits under it (narration.md).

## Every cut has a reason you can say

| Link | The reason | How it's drawn |
|---|---|---|
| Next step | the process goes on | a cut on the grid, the same world or the next |
| Match position | the hero holds its place, the world changes | a cut or a wipe; the hero drawn identically across it |
| Shape morph | this thing becomes that thing | the scene closes in on one object, it turns into its counterpart, the next scene opens out of it |
| Iris | into or out of the hero | a circle on the hero over 2 to 4 frames |
| Scale | inside it, or everything around it | the same subject 5 to 20 times bigger or smaller |
| Point of view | what the hero sees | a cut to its view, at the same moment |
| Cause and effect | this made that happen | a build shot, then the effect on the grid |
| Time cut | later | the light or the sky changes on the same framing |
| Callback | back to an earlier image, changed | an earlier framing reused exactly |

## Pace

Something new every 2 to 4 seconds: a move, a reveal, a cut, a reaction. `render.mjs` warns at 3 s with nothing new, counting the share of the frame that changes and stays changed, so a small reveal counts and a blinking cursor or a slow push does not. A voice can carry a longer hold: the same measure, run on the 4:48 narrated explainer's video (narration.md), found nine stretches of 3.2 to 6.4 s, each one picture held under the voice, the longest a card that stayed 6.4 s while the voice explained it. The whole-frame average animate measures flagged 19 stretches there, up to 14 s, because a label or an arrow appearing barely moves a frame's average.

| Beat | What it does | Pace | Sound | Length |
|---|---|---|---|---|
| Start | the hero at rest | held | quiet | 1 to 1.5 s |
| Build | one framing, detail added | held, or a cut a second | rising | 3 to 6 s |
| Change | the hero's form changes | steps on 8ths | a hit on the change | 2 to 3 s |
| Travel | getting there | one camera move | a building pad or groove | 2 to 4 s |
| Journey | many places | speeding up, 3 to 8 cuts a second | a flat groove, steady within 3 dB | 5 to 9 s |
| Turn | it could go wrong, or everything gathers | builds slowly, then changes in 1 to 3 frames | a drop, then the loudest hit | 1 to 3 s |
| Quiet | alone, still | held | the lowest | 1 to 1.5 s |
| Connection | the hero meets what it was for | held, slow movement | warm, swelling | 3 to 7 s |
| Time passes | later | a flicker | no onsets | about 1 s |
| Ending | back to the start | a held write-on | fading or held | 2 to 4 s |

The order varies from piece to piece; the beat types and their pace recur. Speed mostly comes from the steps of one move, not from new shots.

## Cuts and morphs

- A hard cut lands on a finished frame: what defines the new shot is complete on its first frame, and a write-on starts a few frames before the cut. In a shot under about a second, a caption that writes on never finishes: give it none, or draw it complete.
- What existed before a step is on screen from the step's first frame; only the step's own effects animate in.
- A shape morph: the old scene closes in on one object through a window shaped like it, the object becomes its counterpart on a blank sheet, and the new scene opens out of it. animate's takes 1.2 s, 0.4 s of it blank; under 30 s keep to three morphs or shorten each to 0.8 s. The object is at least 200 px across and in frame at the boundary (pull a push-in back first), and the morph happens on the blank sheet, never through a blend of two backgrounds, which reads as mud.
- A piece joined by morphs keeps at most one hard cut: the slam on the payoff.
- Late shots call back to early framings, changed.

## Check before you build

For a piece over about 20 s, three check-ins with the user, each cheaper than the next:

1. **The story**, in text: the one-line idea and its device, the format and why, the length and the BPM or the voice, and a beat table: the time, what happens, the link into the next beat, and the sound's part (where the silence is, where the loudest hit lands). Every fact on screen is checked against a source and listed with it. Ask: approve, change beats, or another angle.
2. **The look**: two to four of the most different beats drawn full size and rendered as stills (`render.mjs --frames`), each against LOOK and BANNED. Ask per frame.
3. **The storyboard**: one still per beat in the approved look; the user marks each panel up or down by number, and the notes go to those panels.

Then animate. The style frames' code is the piece's code, so nothing is drawn twice. The 4:48 explainer went through style frames and a rough animatic before the final motion.

## Sources

- animate v0.4.1 by cth9191 (MIT): `grammar/STORY.md`, `grammar/FORMATS.md`, `craft.md` and the check-ins in `SKILL.md`, read on 2026-10-11 and never run. Its numbers come from its author's shot logs; the formats marked proven carried pieces there.
- The dead-beat figures and the 4:48 explainer are this skill's own.
