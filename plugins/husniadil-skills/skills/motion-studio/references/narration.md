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
- A new scene starts 0.2 to 0.4 s after the sentence before it ends, so the line lands before the picture moves on (animate's measure of narrated pieces; its pieces start each beat 0.3 s after a sentence). Keep a sentence to 3.5 words a second or fewer.

## Before the voice exists

When the voice will come later, time the picture to a scratch read of the script, and never ship it.

- macOS reads a scene to a file: `say -v Damayanti -r 200 -o s1.aiff -f s1.txt` (Damayanti is its Indonesian voice; `say -v '?'` lists them). `-r` is not the pace in words a minute: at `-r 142`, the 4:48 explainer's real pace, three of its scenes came out 18 to 35% longer than the real takes, and at `-r 200` they came within -4% to +9% of them (12.5 to 39 s). Set it from one scene before reading the rest.
- A scratch read has no timings. Placing a phrase by its letters (letter k of n starts at k / n of the scene's speech) missed the real word starts in the explainer's nine scenes by 0.32 s at the median and up to 1.5 s, since pauses at commas and full stops are not spread evenly: good for a rough cut, not for beats on words.
- When the real voice arrives, retime to it (A voice that arrives after the picture). Its own timings come from the voice service (ElevenLabs' alignment, above), or, for a recording, from the transcribe-audio skill in this repository, whose JSON gives each segment, about a phrase or a sentence long, its start: cue on those, then check the beats on stills.

## A voice that arrives after the picture

When the picture is built first, silent, and the voice comes later (a person's read, a client's file), retime the picture to the voice and keep the scenes as they are.

1. Ask for one file, one paragraph per scene, with a clear breath between paragraphs. One file keeps one clock; a file per scene needs a sync point each.
2. Find the loudest 10 ms: `ffmpeg -i vo.wav -af astats=length=0.01:measure_overall=RMS_peak:measure_perchannel=none -f null -` prints `RMS peak dB`.
3. List the pauses: `ffmpeg -i vo.wav -af silencedetect=noise=<RMS peak - 30>dB:d=0.45 -f null -` prints every pause of 0.45 s or more with its `silence_end` and `silence_duration`.
4. For N scenes, the N - 1 longest pauses are the joins, and each one's `silence_end` is where the next scene's speech starts. Compare the shortest join with the longest pause left; when the two come close, place the joins from the script instead.
5. Retime piecewise linear. `OLD` holds the picture's scene starts and its end; `NEW` holds each scene's speech start less the lead the scene had before its voice (The timeline from the timings), 0 for the first, and the voice's length plus the tail for the end.

```js
const T = (t) => { let k = 0; while (k < OLD.length - 2 && t >= OLD[k + 1]) k++; return NEW[k] + (t - OLD[k]) * (NEW[k + 1] - NEW[k]) / (OLD[k + 1] - OLD[k]); };
```

Write every beat's start as `T(old start)` and keep its duration: a 0.6 s entrance stays 0.6 s, and only where it starts moves. A move that must end on a boundary, such as a transition into the next scene, is placed back from the new boundary (`T(cut) - 0.9`), so it still ends there.

Tested on this piece's narration made into one file, its nine scenes joined with 0.8 s of silence (274.6 s, the RMS peak at -12.7 dB). silencedetect at -42.7 dB found the eight joins as its eight longest pauses, 0.81 to 1.38 s, against 0.68 s for the longest pause inside a scene. Reading 10 ms RMS windows instead of samples, the method bang-motion's tool uses, measured the joins longer (1.02 to 1.52 s) and found every scene's speech start but the first to the 10 ms (the first counts from 0, since its 0.06 s lead is too short to be a pause); thresholds from -25 to -40 dB moved the starts by 10 ms at most. The two methods put each scene's start within 11 ms of each other. A fixed paragraph gap of 0.8 s, the tool's default, caught the shortest join by 0.013 s with silencedetect, which is why the count of scenes picks the joins here.

## Staging an explainer

- Each phrase of the voice adds one element and the earlier ones stay, so a scene ends on 3 to 5 elements (5 at most) that explain together: the subject, the proof (a document, a screen, a clipping), the scale (a number, or one image repeated into a grid), a label or a date. One image and one sentence per scene is a slideshow, however the camera moves.
- Everything the voice names appears in its scene: the company, the person, the place, the product, the 17 factories. List them from the script before building. A real person's face is never generated.
- No three scenes in a row from one viewpoint: give each fact its own instrument (a map, a gauge, a profile, a close detail).
- An object the scene holds on stays alive: it sways 22 to 28 px over 1.3 to 1.8 s on ease-in-out-sine, turns 1.5 degrees either way, and grows from 1 to 1.06 across the scene, each object on its own phase. A sway of 10 px over 2 s reads as still. This is the held object's own motion, so SKILL.md's ambient limit (under 5% of the hero's travel) is not its measure; the words being read stay still either way.

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
- Put the payoff hit in a pause, before the line that names it: under speech the voice masks it, and in animate's mix, which ducks the score while the voice speaks, it went down with the score. Judge the arc (sound.md, The arc) on the score without the voice, which is louder than any hit.
- Music under a voice: in the narrated pieces animate studied it sat at -20 to -25 dB, and its notes don't say against what. Start the music about 20 dB under the voice and measure it the way the sounds above are measured. The 4:48 explainer had no music.
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
- animate v0.4.1 by cth9191 (MIT): the scene change after a sentence, the payoff in a pause, music under a voice and the scratch voice (`SKILL.md`, Voice-over, `craft.md` and `grammar/FORMATS.md`). Read, not run; the `say` and letter-timing figures are this skill's own.
- bang-motion v1.19.0 by Bang Tutorial (MIT): the pause detector and the retime to a later voice (`scripts/vo-pauses.html`, `references/explainer.md`), one element per phrase, every named entity on screen and the sway (`references/explainer.md`), and the change of viewpoint (`SKILL.md`). Read, not run; the measurements here are this skill's own, with ffmpeg 9.0.2.
