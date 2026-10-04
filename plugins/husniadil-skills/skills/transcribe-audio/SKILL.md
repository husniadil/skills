---
name: transcribe-audio
description: Transcribes an audio or video file, or a YouTube/media URL, into text, SRT, VTT or timestamped JSON. The transcription runs on Groq's hosted Whisper, so nothing heavy runs on this machine. Use when the user gives an audio file (.mp3, .m4a, .wav, .aiff, .flac, .ogg, .opus), a video they only want the words from, or a URL, and asks to "transcribe", "get the transcript", "subtitle this", "what is said in this", "bikin transkrip", or "tulis ulang audio ini". Supports a language hint, a vocabulary prompt for names and jargon, and files of any length through automatic chunking.
---

# Transcribe audio

One script does the whole job:

```bash
${CLAUDE_SKILL_DIR}/scripts/transcribe.sh <file|url> [options]
```

`${CLAUDE_SKILL_DIR}` is this skill's own directory. Claude Code fills it in. In
another agent, use the directory this SKILL.md was loaded from.

## Options

| Option | Meaning |
|---|---|
| `--format text\|srt\|vtt\|json\|all` | Output shape. `text` is one paragraph, `json` is Whisper's own `{text, segments}`. `all` writes `<name>.{txt,srt,vtt,json}` and needs `--out` to be a directory. Default `text`. |
| `--model turbo\|large` | `turbo` is `whisper-large-v3-turbo`, the default and the cheapest. `large` is `whisper-large-v3`, slower and better on noisy or accented audio. |
| `--language <code>` | ISO code such as `en` or `id`. Left off, the model detects it. |
| `--prompt <text>` | Names, product words or spellings to bias the decoder. |
| `--out <path>` | Write there instead of stdout. A directory when `--format` is `all`. |
| `--keep-work` | Leave the temporary directory for inspection. |

Progress goes to stderr, the transcript to stdout, so a redirect captures only
the transcript.

## What it does

1. A URL is fetched audio-only with `yt-dlp`, so a long video never downloads
   its video track.
2. `ffmpeg` decodes the input to 16 kHz mono FLAC, which is what the API
   wants and is the smallest the audio gets without losing anything.
3. The chunk length is derived from how well that FLAC compressed, so each
   chunk stays under 20 MB against a 25 MB cap. It is 20 minutes for clean
   speech and shorter for noisy audio, never under a minute.
4. Each chunk is cut with an explicit `-ss` and `-t`, so its offset is exactly
   its index times the chunk length. Nothing is measured and nothing drifts.
   A last piece shorter than a second is folded into the chunk before it,
   because Whisper answers a fragment of near-silence with an invented line.
5. Every chunk reads ten seconds past its own length. A cut landing mid-word
   gives the model half a word on each side of the seam, and it drops what it
   cannot read without saying so. Reading on means the chunk before the seam
   holds that word whole.
6. A chunk owns the segments that BEGIN inside its own length, and a segment
   the previous chunk already covered to its end is dropped. What survives at
   a seam is a phrase read twice, which is the deliberate trade: a repeated
   phrase is a smaller harm than a lost one.
7. The chunks' segments are merged and rendered into the asked-for format.

## Requirements

`GROQ_API_KEY` in the environment, plus `ffmpeg`, `ffprobe`, `python3` and
`curl`. A URL also needs `yt-dlp`.

The script checks the tools and the key itself and exits 1 naming what is
missing. When it does, stop and tell the user what is missing and the command
that installs it here (`brew install ffmpeg yt-dlp` on macOS, `sudo apt-get
install ffmpeg` and `pipx install yt-dlp` on Debian or Ubuntu). Do not install
it yourself, and do not switch to a local Whisper.

Set `GROQ_BASE_URL` instead where a proxy holds the key at its own edge, and
then no key belongs in the environment. That includes the provider's own host:
in a Claude Code cloud session whose environment holds the key as an API
credential for `api.groq.com`, set `GROQ_BASE_URL=https://api.groq.com`.
`OPENAI_BASE_URL` does the same for the fallback. Either falls back to the
provider's own host when unset.

`OPENAI_API_KEY` or `OPENAI_BASE_URL` enables the fallback. A chunk that Groq answers with 429 or
a 5xx is retried against OpenAI's `whisper-1`, which speaks the same wire
shape. A 4xx that is not 429 is our own request, so it fails rather than
spending money to fail again elsewhere.

## Choosing this over a local model

The point of this skill is that the decoding happens on Groq's servers. This
machine only resamples the audio. Do not suggest installing `whisper` or
`whisper.cpp` locally unless the user asks for an offline path.
