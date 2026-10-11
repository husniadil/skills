# Sound

The feed plays video muted until someone taps, so the picture has to work in silence first. Add sound when the user wants it, and score it from frame numbers: the model can't hear, so every sound is placed by the frame it belongs to and checked by measuring the decoded file.

## The SOUND line and its contract

```text
SOUND: synthesize everything in code with the Web Audio API, no samples, no downloads. <BPM>, a bed of <kick, shaker, pad on chords ...> starting on frame <F>. Hits, each one frame after its picture: <frame: sound> ... Expose window.renderAudio(), returning the AudioBuffer of an OfflineAudioContext(2, 48000 * <seconds>, 48000) that renders the whole score. Seed any noise.
```

`render.mjs --audio` calls `window.renderAudio()`, brings the result to -14 LUFS under a -2 dBTP true-peak limiter, muxes it as AAC, and measures the decoded MP4.

## Timing

- **A hit lands one frame after its picture.** Light reaches us before sound, so a sound that arrives a little late reads as right and one that arrives early reads as wrong. The onset of a hit on frame F is at `(F + 1) / fps` seconds.
- At 48 kHz a frame is 1600 samples at 30 fps and 800 at 60 fps, so the onset of a hit on frame F sits on sample `(F + 1) * 48000 / fps`.
- Put the bed on the same beat grid as the cuts (numbers.md), computed per beat from time.
- Start tonal hits in cosine phase with a short attack (0.5 to 1 ms), so the first waveform peak sits on the frame. Sines that start at phase 0 and waveshapers pushed the peaks 2.5 to 11 ms late in the source's measurements.

## Balance

- Every hit, or every pair of hits on one frame, sits 3 to 6 dB over the bed (K-weighted, over its first 60 ms). That was the source's working target, reached in every piece by measurement.
- Keep the energy where phone speakers play: the first mix of the source's product film put 80% of its energy under 60 Hz, and the chrome loop's mix lost 4.5 dB through a 150 Hz high-pass. Move bass and sub up an octave, open filters, and raise the pad instead.
- Balance by removing energy: every boost is partly taken back by the limiter.
- A peaky score (square waves, hard transients, everything cresting on one sample) makes the limiter take a lot, and then the piece ends quieter than -14 LUFS. Tame the hottest hits in the score rather than limiting harder.

## Loudness and the encode

- `render.mjs` aims at -14 LUFS, a common target for web video, and limits the true peak at -2 dBTP with 4x oversampling and the look-ahead delay compensated, so hits keep their place (tested: within 4 samples).
- The AAC encode raises the true peak: by 0.4 dB on a test score here, 0.9 dB in the source, and about 3 dB on a test track with hard full-scale transients. That's why the ceiling is -2 and why `render.mjs` measures the decoded MP4 and fails above -1 dBTP.
- Iterate the mix with `--audio-only`, which reuses the rendered frames.

## Follow-ups that measure

Pick one or two per round:

```text
Decode the MP4's audio and list, for every hit, the frame it belongs to and how many milliseconds after (frame + 1) its first waveform peak lands. Fix any hit off by more than 1 ms.
Measure each hit against the bed, K-weighted over its first 60 ms. Bring every hit to 3 to 6 dB over the bed by trimming, not boosting.
Measure the share of energy under 60 Hz, 60 to 150 Hz and 150 Hz to 6 kHz. If most of it is under 150 Hz, move the bass up an octave and open its filter.
The limiter took more than 3 dB on the hottest hit. Find which partials crest on the same sample and lower or re-phase them.
```

You can't hear the result. Say so when you deliver, and give the user the measured loudness, the true peak and the hit offsets so they know what to listen for.
