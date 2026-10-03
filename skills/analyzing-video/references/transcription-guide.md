# Transcription Guide

Only non-obvious details. Claude knows how to use Whisper.

## Which transcriber runs

`extract-audio.sh` picks this itself. With `GROQ_API_KEY` set it calls the
`transcribe-audio` skill, which decodes on Groq's servers and writes the same
`audio.{txt,srt,vtt,json}` into the output directory. Without the key it falls
back to the local `whisper` CLI. Do not install a local model to make
transcription work. Set the key.

The hosted path has two models. The five Whisper model names below are mapped
onto them: `tiny`, `base` and `small` become `whisper-large-v3-turbo`, and
`medium` and `large` become `whisper-large-v3`.

## Model Selection (local Whisper only)

| Model | Speed | WER | When to Use |
|-------|-------|-----|-------------|
| base | ~7x | ~5.8% | Long/extended videos (speed priority) |
| medium | ~2x | ~3.5% | Short/medium videos (quality priority) |
| large-v3-turbo | ~6x | ~2.9% | Best tradeoff if available (newer whisper versions) |

## Gotchas

- Whisper requires Python 3.10-3.12 (not 3.13+). If the system Python is too new, Whisper may be installed under an older Python (check `which whisper`).
- Audio must be 16kHz mono WAV for best results: `ffmpeg -i input.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 audio.wav`
- `--output_format all` generates txt, json, srt, vtt, tsv simultaneously.
  The hosted path writes the same set without the tsv, which nothing reads.
- JSON output has `segments[].start` and `segments[].end` in seconds (float), not milliseconds.
- `--verbose False` suppresses per-segment stdout output that can be very long.
- If Whisper is not installed, skip transcription and proceed with visual-only analysis.

## Parse Transcription JSON

```bash
# Get segments with timestamps
python3 -c "
import json
d = json.load(open('audio.json'))
for s in d['segments']:
    print(f'[{s[\"start\"]:.1f}s - {s[\"end\"]:.1f}s] {s[\"text\"].strip()}')
"
```

## Troubleshooting

- **Out of memory**: Use `base` model
- **Bad accuracy**: Set `--language` explicitly, or try `medium`/`large`
- **No audio detected**: Check `has_audio` from video-info.sh before running
- **Wrong language**: `--language en` (or appropriate code)
