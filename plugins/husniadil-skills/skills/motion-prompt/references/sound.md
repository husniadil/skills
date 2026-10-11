# Sound

The feed plays video muted until someone taps, so the picture has to work in silence first. Add sound when the user wants it, and score it from frame numbers: the model can't hear, so every sound is placed by the frame it belongs to and checked by measuring the decoded file.

## The SOUND line and its contract

```text
SOUND: synthesize everything in code with the Web Audio API, no samples, no downloads. <BPM, and a bed of kick, shaker, pad on chords ... starting on frame F; or no bed, hits alone>. Hits, each one frame after its picture: <frame: sound> ... Expose window.renderAudio(), returning the AudioBuffer of an OfflineAudioContext(2, 48000 * <seconds>, 48000) that renders the whole score; renderAudio({ only: 'hits' }) and renderAudio({ only: 'bed' }) render one part alone. Seed any noise.
```

`render.mjs --audio` calls `window.renderAudio()` with no argument, brings the result to the `--lufs` target (default -14) under a -2 dBTP true-peak limiter, prints what the limiter took off the hottest peak (a warning above 3 dB, a failure above 6), muxes it as AAC, and measures the decoded MP4's loudness and true peak. `render.mjs --hits 158,178` measures hit timing and level from the two parts rendered alone, as defined below.

## Timing

- **A hit lands one frame after its picture.** Light reaches us before sound, so a sound that arrives a little late reads as right and one that arrives early reads as wrong. A hit on frame F peaks at `(F + 1) / fps` seconds. F is the first frame on which the change shows, read off the rendered frames: an ease or a clip can keep a change invisible for frames after it starts, and in the fourth end-to-end test a reveal that began on frame 205 first showed on 207, so a sound timed to 205 came a frame early.
- At 48 kHz a frame is 1600 samples at 30 fps and 800 at 60 fps, so a hit on frame F peaks on sample `(F + 1) * 48000 / fps`. Its peak is the first sample that reaches 90% of its largest value in its first 30 ms, or up to the next hit's onset when that comes sooner, so the next hit can't move it. The previous hit's tail still can: if it is still sounding at this onset, it adds to this hit's first samples and moves the 90% sample. In the third end-to-end test, pour ticks 133 ms apart with a 0.18 s decay peaked 2 to 17 ms late until the decay was cut to 0.04 s.
- Put the bed on the same beat grid as the cuts (numbers.md), computed per beat from time.
- End the attack on the frame: start the envelope 0.5 to 1 ms before `(F + 1) / fps`, and start the oscillator so that sample is a crest (a sine reaches its crest a quarter period after it starts). Measured this way, an 880 Hz hit with a 0.75 ms attack peaked 0.04 ms early; the same hit with its attack starting on the frame peaked 0.77 ms late. A hit with several partials needs every partial at a crest on that sample (the source kept "every gloop harmonic in cosine phase"), or the sum peaks later. Sines that start at phase 0 and waveshapers pushed the peaks 2.5 to 11 ms late in the source's measurements.
- A low partial gives a broad crest, and then the 90% sample can come before the crest even when the crest is on its sample: a pure sine passes 90% of its crest 0.45 rad early, 0.55 ms at 130 Hz against 0.08 ms at 880 Hz. In the third end-to-end test a 130 Hz hit and a 330 Hz hit with a 165 Hz partial read 0.8 ms early with every crest placed, while a 262 Hz hit read on time. Before moving a low hit that reads up to 1 ms early, find the sample its crest is on.

## Balance

- Every hit, or every pair of hits on one frame, sits 3 to 6 dB over the bed: the RMS of the hit's first 60 ms against the RMS of the bed alone over the same 60 ms. The bed is everything that isn't a hit. That was the source's working target (it K-weighted both), reached in every piece by measurement.
- Keep bed transients out of a hit's 60 ms: drop or move the kick or shaker where a hit plays, as the source did ("offbeat shaker only where no hit plays"). A kick one frame after a hit swells the bed in that window, and in the second end-to-end test it left two hits 10 to 11 dB under the bed at their intended level.
- Keep the energy where phone speakers play: the first mix of the source's product film put 80% of its energy under 60 Hz, and the chrome loop's mix lost 4.5 dB through a 150 Hz high-pass. Move bass and sub up an octave, open filters, and raise the pad instead.
- Balance by removing energy: every boost is partly taken back by the limiter. When a short hit can't get 3 dB over the bed without the limiter catching it, lower the bed instead; the gain stage brings the whole mix back up to -14 LUFS. A timing fix can cause this: shortening a hit's decay takes energy out of its first 60 ms, and in the third end-to-end test pours cut from a 0.18 s to a 0.04 s decay fell to 1.6 to 2.5 dB over the bed. Measure the balance again after every timing fix.
- A peaky score (square waves, hard transients, everything cresting on one sample) makes the limiter take a lot, and then the piece ends quieter than -14 LUFS. Tame the hottest hits in the score rather than limiting harder. Lowering one hit can make the next one the hottest; spreading a hit's energy over a longer decay lowers its peak against its loudness, and in the fourth end-to-end test a reveal's decay going from 0.3 to 0.6 s (with the click also lowered in the same round) took the limiter from about 6 dB on it to none.
- A score of hits alone has no bed to sit over: skip the 3 to 6 dB check, and keep what the limiter takes off the hottest peak, which `render.mjs` prints, under 3 dB. In the fifth end-to-end test, two short hits in 15 s needed 16.6 dB of gain to reach -14 LUFS and the limiter took 11.8 dB; decays lengthened from 0.03 to 0.6 s over two rounds (the click also moved from 1600 to 880 Hz) brought that to 8.0 dB of gain and 0.4 dB taken. When the hits must stay short, render at `--lufs -18` to `-20` instead.

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
render.mjs says the limiter took more than 3 dB off the hottest peak. Find that hit and the partials that crest on the same sample, then lower or re-phase them, or spread the hit over a longer decay.
```

You can't hear the result. Say so when you deliver, and give the user the measured loudness, the true peak and the hit offsets so they know what to listen for.
