# Narration: a piece with a voice

A narrated explainer runs on the voice's clock. Generate the voice before any animation, place every visual beat by the moment a phrase is spoken, cut the captions from the same timings, keep the sounds under the voice, and master the decoded file. Everything here was measured on a 4:48 explainer in Indonesian (Remotion 4.0.534, ElevenLabs `eleven_v4`, 2026-10-11) unless it says otherwise.

## The voice first

- ElevenLabs `POST /v1/text-to-speech/{voice_id}/with-timestamps` returns `audio_base64` and an `alignment` of `characters`, `character_start_times_seconds` and `character_end_times_seconds` (plus a `normalized_alignment`). `eleven_v4`, `eleven_v3` and `eleven_multilingual_v2` all returned it. Check that the characters joined give back the text before using them; the last one ended within 80 ms of the file's end in every scene.
- One request per scene, so a retake costs one scene's characters. Send the scenes either side as `previous_text` and `next_text` so the joins keep their intonation, and a fixed `seed` (best effort, per the docs). `language_code` pins the language; the docs say `eleven_multilingual_v2` ignores it.
- A voice reads an abbreviation the way its training reads it: Chris read "HP" as the English letters. Spell such words the way they are said in the request ("hape"), and map them back for the captions.
- Pace for planning: 132 to 151 words a minute per scene, 142 overall (Indonesian, the premade voice Chris). 637 words made 4:29 of speech; leads, tails and an end card brought the piece to 4:48.
- The free plan: 10,000 credits a month and no commercial licence (the pricing page, 2026-10-11). Over the API it refuses the shared library's voices (HTTP 402, "Free users cannot use library voices via the API") and some voices need a higher tier (HTTP 400, "You need to be on the creator tier or above to use this voice"); premade voices work. The subscription endpoint's counter lagged: it read 0 after two 400-character samples and 3,899 after the 4,081 characters of the narration, so count characters before each call.

## The timeline from the timings

- A scene lasts its lead, its speech and its tail: 0.4 to 1.2 s before the voice, 1.0 to 1.4 s after, and 4.5 s after the last line for the end card. The scenes' frame counts add up to the piece.
- Place a beat with a lookup, `cue(scene, phrase)`: the seconds from the scene's start to the start of that phrase's first letter. A beat on "Merah" lands when the voice says it, and a retake moves every beat with the voice.
- Make the lookup throw when the phrase is not in the narration, so an edit to the script fails the render instead of leaving a beat on the wrong words.
- A beat that shows something lands on the phrase that names it; an action (a cursor travel, a press) ends on it. In the product actions this followed numbers.md, A product action: the result reveals 15 frames after the press.

## Captions

- Cut the narration at every sentence end first. A sentence under 24 characters joins the next when the two fit; anything longer than the limit splits at the comma, then the space, nearest its middle, until each piece fits.
- The limit is two lines: in a 1600 px box at 64 px (Inter 600, about 30 px a character, 53 a line), 80 characters. The piece had 81 captions, the longest 79 characters, the shortest on screen 1.2 s.
- A caption shows from its first letter's start to the next caption's first letter, and the last one until 0.4 s after its last letter. Built that way it starts at most one frame after its word.
- Keep a caption band: at 1920x1080 the text sat from y = 840 over a scrim from y = 740, so nothing readable in a scene went below about 750, or it faded out under a mask by 790. Text the viewer must read behind a caption is a defect.
- An SRT for the platform's own subtitles uses the same pieces, timed to the frames the burned-in captions show on: first frame `ceil(start x fps)`, end `ceil(end x fps)`. A copy without burned-in captions still keeps the empty band, since every layout was built around it.

## Sound under a voice

With narration the voice is the bed, and the UI sounds sit under it, not over (sound.md, Balance, is for a music bed).

- Measure each sound's first 60 ms RMS against the voice's RMS while it speaks (samples above -40 dBFS) in the second around the sound, with the narration laid out on the timeline alone.
- Delivered levels under the voice: a notification 6 to 8 dB, a confirm 9 to 13, pops 7 to 16, taps 9 to 14, whooshes 10 to 14, clicks 12 to 18, keystrokes 19 to 26. The first pass set the levels by guess and had pops up to 0.8 dB over the voice, so measure before the mix.
- A narrated piece of minutes carries many sounds (124 in 4:48, 37 of them pops), so the frequent ones stay quiet.
- Synthesised hits peaked within 0.1 ms of their sample with cosine-phase partials (sound.md, Timing); a noise-based keystroke within 1.2 ms. A whoosh is a swell, so the 90% peak rule does not apply to it.

## Mastering when the engine renders the audio

render.mjs masters an HTML piece's `renderAudio()` itself. Putting a narration into `renderAudio()` as decoded buffers at their offsets should take the same path, but it was not tested with a voice. An engine that mixes its own audio, such as Remotion, renders it with no loudness target or true-peak limit, so master it after:

1. Render the picture muted (`npx remotion render <id> video.mp4 --muted`) and the sound alone (`npx remotion render <id> mix.wav --codec=wav`, PCM 16-bit, 48 kHz stereo).
2. Gain the mix to -14 LUFS, limit at -2 dBTP with 4x oversampling (ffmpeg: `aresample=192000,alimiter=limit=0.79433:attack=5:release=50:level=false:latency=true,aresample=48000`), encode AAC 256k, and mux it onto the muted video with `-c:v copy`.
3. Measure the decoded MP4. While its true peak is over -1 dBTP, lower the limit by the excess plus 0.3 dB and mux again, three passes at most.

A TTS voice is peaky: the mix came out at -20.4 LUFS with a sample peak of -2.8 dBFS, so reaching -14 took 6.4 dB of gain and the limiter up to 5.6 dB off the hottest voice peaks (0.10% of samples, in 5.2% of 10 ms windows), inside render.mjs's warning band. The decoded file read -14.5 LUFS and -1.9 dBTP on the first pass. At -16 LUFS the limiter would take about 3.6 dB. Measure peaks on the stereo samples: ffmpeg's `-ac 1` downmix read them 3 dB high.

## Sources

- ElevenLabs API reference, `text-to-speech/convert-with-timestamps` (request fields `previous_text`, `next_text`, `seed`, `language_code`; the response's alignment), the models page and the pricing page, checked 2026-10-11. The HTTP 402 and 400 refusals, the three models' timestamps and the credit counter were seen on the API that day.
- Remotion 4.0.534: `--muted`, `--codec=wav` and `--props`, run on this piece.
