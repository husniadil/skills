# Sound

The feed plays video muted until someone taps, so the picture has to work in silence first. Add sound when the user wants it, and score it from frame numbers: the model can't hear, so every sound is placed by the frame it belongs to and checked by measuring the decoded file.

## The SOUND line and its contract

```text
SOUND: synthesize everything in code with the Web Audio API, no samples, no downloads. <BPM, and a bed of kick, shaker, pad on chords ... starting on frame F; or no bed, hits alone>. Hits, each one frame after its picture: <frame: sound> ... Expose window.renderAudio(), returning the AudioBuffer of an OfflineAudioContext(2, 48000 * <seconds>, 48000) that renders the whole score; renderAudio({ only: 'hits' }) and renderAudio({ only: 'bed' }) render one part alone. Seed any noise. Set every gain to 0 at time 0 before its envelope.
```

`render.mjs --audio` calls `window.renderAudio()` with no argument, brings the result to the `--lufs` target (default -14) under a -2 dBTP true-peak limiter, prints what the limiter took off the hottest peak (a warning above 3 dB, a failure above 6), muxes it as AAC, and measures the decoded MP4's loudness and true peak. `render.mjs --hits 158,178` measures hit timing and level from the two parts rendered alone, as defined below.

## Timing

- **A hit lands one frame after its picture.** Light reaches us before sound, so a sound that arrives a little late reads as right and one that arrives early reads as wrong. A hit on frame F peaks at `(F + 1) / fps` seconds. F is the first frame on which the change shows, read off the rendered frames: an ease or a clip can keep a change invisible for frames after it starts, and in the fourth end-to-end test a reveal that began on frame 205 first showed on 207, so a sound timed to 205 came a frame early.
- At 48 kHz a frame is 1600 samples at 30 fps and 800 at 60 fps, so a hit on frame F peaks on sample `(F + 1) * 48000 / fps`. Its peak is the first sample that reaches 90% of its largest value in its first 30 ms, or up to the next hit's onset when that comes sooner, so the next hit can't move it. The previous hit's tail still can: if it is still sounding at this onset, it adds to this hit's first samples and moves the 90% sample. In the third end-to-end test, pour ticks 133 ms apart with a 0.18 s decay peaked 2 to 17 ms late until the decay was cut to 0.04 s.
- Put the bed on the same beat grid as the cuts (numbers.md), computed per beat from time.
- End the attack on the frame: start the envelope 0.5 to 1 ms before `(F + 1) / fps`, and start the oscillator so that sample is a crest (a sine reaches its crest a quarter period after it starts). Measured this way, an 880 Hz hit with a 0.75 ms attack peaked 0.04 ms early; the same hit with its attack starting on the frame peaked 0.77 ms late. A hit with several partials needs every partial at a crest on that sample (the source kept "every gloop harmonic in cosine phase"), or the sum peaks later. Sines that start at phase 0 and waveshapers pushed the peaks 2.5 to 11 ms late in the source's measurements.
- Set every gain to 0 at time 0 (`g.gain.setValueAtTime(0, 0)`) before its envelope: a GainNode plays at its default of 1 until its first automation event, so an oscillator started before that event sounds at full level. A partial started on a crest starts a quarter period early, which is before an envelope 0.5 to 1 ms early for every partial under 250 to 500 Hz: in Chromium, a 65 Hz sine reached 0.913 before its envelope began, against the hit's own peak of 0.100, and stayed silent with the gain set to 0 at time 0. The seventh and eighth end-to-end tests both shipped it: pad voices started at 0 s with their envelopes set at their chords' onsets rendered at +30.6 dBTP, and a 65 Hz sub made the limiter take 20.8 dB.
- A low partial gives a broad crest, and then the 90% sample can come before the crest even when the crest is on its sample: a pure sine passes 90% of its crest 0.45 rad early, 0.55 ms at 130 Hz against 0.08 ms at 880 Hz. In the third end-to-end test a 130 Hz hit and a 330 Hz hit with a 165 Hz partial read 0.8 ms early with every crest placed, while a 262 Hz hit read on time. Before moving a low hit that reads up to 1 ms early, find the sample its crest is on.

## Balance

These rules are for hits over a music bed. With a narration the voice is the bed and the hits sit under it: narration.md, Sound under a voice.

- Every hit, or every pair of hits on one frame, sits 3 to 6 dB over the bed: the RMS of the hit's first 60 ms against the RMS of the bed alone over the same 60 ms. The bed is everything that isn't a hit. That was the source's working target (it K-weighted both), reached in every piece by measurement.
- Keep bed transients out of a hit's 60 ms: drop or move the kick or shaker where a hit plays, as the source did ("offbeat shaker only where no hit plays"). A kick one frame after a hit swells the bed in that window, and in the second end-to-end test it left two hits 10 to 11 dB under the bed at their intended level.
- Keep the energy where phone speakers play: the first mix of the source's product film put 80% of its energy under 60 Hz, and the chrome loop's mix lost 4.5 dB through a 150 Hz high-pass. Move bass and sub up an octave, open filters, and raise the pad instead.
- Balance by removing energy: every boost is partly taken back by the limiter. When a short hit can't get 3 dB over the bed without the limiter catching it, lower the bed instead; the gain stage brings the whole mix back up to -14 LUFS. A timing fix can cause this: shortening a hit's decay takes energy out of its first 60 ms, and in the third end-to-end test pours cut from a 0.18 s to a 0.04 s decay fell to 1.6 to 2.5 dB over the bed. Measure the balance again after every timing fix.
- A peaky score (square waves, hard transients, everything cresting on one sample) makes the limiter take a lot, and then the piece ends quieter than -14 LUFS. Tame the hottest hits in the score rather than limiting harder. Lowering one hit can make the next one the hottest; spreading a hit's energy over a longer decay lowers its peak against its loudness, and in the fourth end-to-end test a reveal's decay going from 0.3 to 0.6 s (with the click also lowered in the same round) took the limiter from about 6 dB on it to none.
- A score of hits alone has no bed to sit over: skip the 3 to 6 dB check, and keep what the limiter takes off the hottest peak, which `render.mjs` prints, under 3 dB. In the fifth end-to-end test, two short hits in 15 s needed 16.6 dB of gain to reach -14 LUFS and the limiter took 11.8 dB; decays lengthened from 0.03 to 0.6 s over two rounds (the click also moved from 1600 to 880 Hz) brought that to 8.0 dB of gain and 0.4 dB taken. When the hits must stay short, render at `--lufs -18` to `-20` instead.

## The arc

A piece with a turn (story.md) has one moment the sound is built around: silence before the payoff, the loudest hit on it.

- Drop 15 to 35 dB for 0.5 to 4 s while the picture holds, then the single loudest hit on the turn or the reveal. `render.mjs --audio` prints where the loudest 100 ms of the mix starts, its frame, and how long it was quiet (-40 dBFS or under) in the 2 s before. On a test score with a pad, silence from 1.4 s and a hit on frame 60, it printed 2.00 s, frame 60, and 0.6 s of quiet. Its windows sit on a 0.1 s grid, so the frame it names can come up to 3 frames after the hit that makes it, later for a held hit: in the eighth end-to-end test, a stab on frame 900 held 120 ms read as frame 903. With `--hits` it names that hit, or says the loudest 100 ms is on none of them. With a voice, judge this on the score alone: a voice is louder than any hit. The quiet is measured on the mastered mix, where the bed sits near -14 LUFS: in the sixth end-to-end test a drop of 20 dB left 0.1 s under -40 dBFS, and a drop of 35 dB, with every tail ending first, left 0.8 s.
- The payoff after a silence is not held to Balance's 3 to 6 dB: `--hits` measures it against the silence, so it reads tens of dB over a bed that isn't playing (+46 dB in that test). Judge it against the bed before the drop, and let it be the loudest moment, which the payoff line shows.
- When the payoff line names another moment, give the payoff hit a body: hold it at full level for about 80 ms before it decays, so its loudest 100 ms carries more energy under the same peak. A decay written as an exponential ramp to 0.0001 falls fast: a stab at 0.065 ramped down over 0.45 s loses 12.5 dB in its first 100 ms. In the seventh end-to-end test, an 80 ms hold raised the payoff's loudest 100 ms by 2.8 dB at the same peak (120 ms gave the same), kept its timing within 0.04 ms, and moved the payoff line from a tick at 3.2 s onto it at -16 LUFS, with the limiter taking 1.3 dB. Quieting the rest, which helps a hit over its bed (Balance), works against this: the loudness pass lifts the whole mix back, and the limiter takes the difference off the payoff. Cutting the chord after the payoff by 6 dB raised what the limiter took from 1.4 to 3.2 dB, all of it at the payoff's peak, and the tick stayed louder even with the hold. At -14 LUFS the held stab tied the chord held after it (-12.3 against -12.2 dBFS), so that piece needs -16.
- The busiest moment is not the loudest: the densest stretch comes just before the silence, and the turn gets the loudest hit.
- The score grows with the story: thin early, fullest at the peak.
- A payoff that lands: a short chord stab (about 0.4 s) and a sub on the hit, then a flat chord, with nothing busy over it. A held chord or a busy section otherwise outscores the hit.
- A silence needs a hard stop: every event and every tail ends before it, a faint room tone at most.
- A sustained pad sets how loud a section reads, not the plucks over it: cut the pad to quiet a section.

These come from animate v0.4.1 by cth9191 (MIT, `craft.md`, Sound, and `grammar/FORMATS.md`), read and not run; the payoff print is this skill's.

## A track of your own

When the user brings a song, the song is the clock and the arc: cut on its beats, put the turn on a drop and the payoff on its loudest hit. Use only a song the user owns or licensed, and never fetch music from a site the user didn't point to.

1. Map it: `node ${CLAUDE_SKILL_DIR}/scripts/beats.mjs song.mp3 --start 12 --seconds 30 --out beats.json` prints the tempo, the first beat, the 8 loudest hits with the beat each sits on, the loudest 100 ms and the quiet drops, all in seconds from `--start`. Pass `--bpm 128` when the user knows the tempo; it is then only refined.
2. Read its "other tempos" line before trusting the grid. A tempo twice or half the real one still puts every cut on a beat; a tempo at 4/3 of it does not.
3. Count bars yourself: `beats.mjs` doesn't find where a bar starts. Listen for the downbeat, or ask, and count 4 beats a bar from it.
4. Put the beats in TIME: beat n at `firstBeat + n x beat` seconds, each rounded to a frame on its own (The beat grid in numbers.md).
5. The score is sound effects only. `render.mjs --audio --track song.mp3 --track-start 12` mixes the song from that second under them, fades its last half second, and runs the loudness pass on the sum; `--hits` then measures each hit over the song.

How far to trust it, from this skill's tests:

- Synthetic tracks at 128, 90, 174 and 120 BPM: the tempo within 0.01 BPM and the first beat within 1 ms, and a drop of 4 s found. Single noise, kick and tone onsets: placed within 2 ms.
- 276 Apple Loops drum loops on this Mac (GarageBand's content, each repeated to 32 s; the tempo from each loop's own metadata, and beat one at its start): the tempo right on 203 (74%), twice or half on 38 (14%), and wrong on 35 (13%), 22 of those at 4/3 of a slow hip hop beat. Of the 203, the grid sat on the beats in 159, a median 2 ms and at most 11 ms off for 9 in 10, and on the half beat in 29. Electro house, dubstep, chillwave, disco and breaks did best; hip hop worst (50 of 95 right, 31 more at twice or half).
- Mixed under one hit with `--track` from 1 s in, a 128 BPM track's map of the finished mix put its first beat at 0.31 s, where it belongs (0.3075).
- An earlier version that guessed the bar's start was right on 38 to 45% of these loops, against 25% by chance, so it was taken out.

The approach (a beat map injected into the piece, the song deciding the arc, the score kept to effects, the user's own track only) comes from animate v0.4.1 by cth9191 (MIT, `SKILL.md`, Music, and `tools/beats.mjs`, read and not run). `beats.mjs` here is this skill's own code.

## Loudness and the encode

- `render.mjs` aims at -14 LUFS, a common target for web video, and limits the true peak at -2 dBTP with 4x oversampling and the look-ahead delay compensated, so hits keep their place (tested: within 4 samples).
- The AAC encode raises the true peak: by 0.4 dB on a test score here, 0.9 dB in the source, and about 3 dB on a test track with hard full-scale transients. That's why the ceiling is -2 and why `render.mjs` measures the decoded MP4 and fails above -1 dBTP.
- Iterate the mix with `--audio-only`, which reuses the rendered frames.

## Follow-ups that measure

Pick one or two per round:

```text
Run render.mjs with --hits and every hit's frame. It prints how many milliseconds each peak (the first sample at 90% of its largest value in its first 30 ms, or up to the next hit's onset) sits from (frame + 1) / fps, and how far the hit sits over the bed. Fix any hit more than 1 ms off: if the hit before it is still sounding at its onset, shorten that hit's decay; otherwise end its attack on that sample.
Render the bed alone with renderAudio({ only: 'bed' }). For every hit, compare the RMS of its first 60 ms with the bed's RMS over the same 60 ms. Bring every hit to 3 to 6 dB over the bed by trimming the bed or the hit, not by boosting.
Measure the share of energy under 60 Hz, 60 to 150 Hz and 150 Hz to 6 kHz. If most of it is under 150 Hz, move the bass up an octave and open its filter.
render.mjs's payoff line names a moment other than the turn. Hold the payoff hit at full level for about 80 ms before its decay and render again with --audio-only. Leave the rest of the mix as it is: the loudness pass lifts it back, and the limiter takes the difference off the payoff.
render.mjs says the limiter took more than 3 dB off the hottest peak. Find that hit and the partials that crest on the same sample, then lower or re-phase them, or spread the hit over a longer decay.
```

You can't hear the result. Say so when you deliver, and give the user the measured loudness, the true peak and the hit offsets so they know what to listen for.
