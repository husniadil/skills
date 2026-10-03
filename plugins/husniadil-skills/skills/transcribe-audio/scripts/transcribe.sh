#!/usr/bin/env bash
# Transcribe an audio or video file, or a URL, through Groq's hosted Whisper.
#
# The work happens on Groq's servers. Locally this only decodes the input to
# 16 kHz mono FLAC, which is what the API wants and is small enough that a
# long recording still fits under the upload cap.
#
# OpenAI is the fallback, on the same wire shape, for when Groq rate-limits
# or is down. It is never the first choice: it costs about five times more.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: transcribe.sh <file|url> [options]

Options:
  --format <text|srt|vtt|json|all>  Output shape. Default: text.
                                    all writes <name>.{txt,srt,vtt,json} and
                                    needs --out to be a directory.
  --model <turbo|large>             turbo is whisper-large-v3-turbo (default,
                                    cheapest). large is whisper-large-v3,
                                    slower and better on hard audio.
  --language <code>                 ISO code such as en or id. Default: detect.
  --prompt <text>                   Names, jargon or spelling to bias it.
  --out <path>                      Write here instead of stdout. A directory
                                    when --format is all.
  --keep-work                       Leave the temporary directory in place.

Needs GROQ_API_KEY, ffmpeg, python3, curl. Needs yt-dlp for a URL.
Set OPENAI_API_KEY to enable the fallback.
EOF
}

input=""
format="text"
model="whisper-large-v3-turbo"
language=""
prompt=""
out=""
keep_work=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --format) format="$2"; shift 2 ;;
    --model)
      case "$2" in
        turbo) model="whisper-large-v3-turbo" ;;
        large) model="whisper-large-v3" ;;
        *) model="$2" ;;
      esac
      shift 2 ;;
    --language) language="$2"; shift 2 ;;
    --prompt) prompt="$2"; shift 2 ;;
    --out) out="$2"; shift 2 ;;
    --keep-work) keep_work=1; shift ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
    *)
      if [[ -n "$input" ]]; then echo "more than one input given" >&2; exit 2; fi
      input="$1"; shift ;;
  esac
done

[[ -n "$input" ]] || { usage >&2; exit 2; }

# Where the two providers are reached. A proxy that holds the key at its own
# edge (an exe.dev integration, a gateway of your own) is given here instead,
# and then no key belongs in this environment at all. A key is required only
# for talking to the provider directly.
groq_base="${GROQ_BASE_URL:-https://api.groq.com}"
openai_base="${OPENAI_BASE_URL:-https://api.openai.com}"
if [[ "$groq_base" == "https://api.groq.com" && -z "${GROQ_API_KEY:-}" ]]; then
  echo "GROQ_API_KEY is not set, and GROQ_BASE_URL names no proxy to hold it" >&2
  exit 1
fi

case "$format" in
  text|srt|vtt|json) ;;
  all) [[ -n "$out" ]] || { echo "--format all needs --out <directory>" >&2; exit 2; } ;;
  *) echo "unknown format: $format" >&2; exit 2 ;;
esac

for tool in ffmpeg ffprobe python3 curl; do
  command -v "$tool" >/dev/null || { echo "$tool is not on PATH" >&2; exit 1; }
done

work="$(mktemp -d "${TMPDIR:-/tmp}/transcribe.XXXXXX")"
cleanup() { [[ "$keep_work" -eq 1 ]] || rm -rf "$work"; }
trap cleanup EXIT

# A URL is fetched audio-only, so a long video never downloads its video track.
if [[ "$input" == http://* || "$input" == https://* ]]; then
  command -v yt-dlp >/dev/null || { echo "yt-dlp is not on PATH, needed for a URL" >&2; exit 1; }
  echo "Fetching audio…" >&2
  # Downloaded under the title, so the name comes back from the file that
  # landed rather than from a second call that could answer differently or
  # fail on its own.
  mkdir -p "$work/media"
  yt-dlp -q --no-warnings -f bestaudio -x --audio-format flac \
    --restrict-filenames -o "$work/media/%(title)s.%(ext)s" "$input"
  source_file="$(find "$work/media" -name '*.flac' -maxdepth 1 | head -1)"
  [[ -n "$source_file" ]] || { echo "yt-dlp produced no audio" >&2; exit 1; }
  stem="$(basename "$source_file")"; stem="${stem%.*}"
else
  [[ -f "$input" ]] || { echo "no such file: $input" >&2; exit 1; }
  source_file="$input"
  stem="$(basename "$input")"; stem="${stem%.*}"
fi

if [[ -z "$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$source_file")" ]]; then
  echo "$source_file has no audio track" >&2
  exit 1
fi

echo "Decoding to 16 kHz mono…" >&2
audio="$work/audio.flac"
ffmpeg -v error -i "$source_file" -vn -ac 1 -ar 16000 -c:a flac "$audio"

duration="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$audio")"

# Both providers cap an upload at 25 MB, so the chunk length is derived from
# how well THIS recording compressed rather than assumed. Measured at 16 kHz
# mono: continuous speech is about 17 KB/s, and pink noise, which FLAC cannot
# compress at all, is 42 KB/s. A fixed 20 minutes would put the second one at
# 50 MB, well past the cap, so the length is cut to fit a 20 MB budget.
#
# The cuts are made one at a time with an explicit -ss and -t rather than
# with ffmpeg's segment muxer. The muxer breaks on a frame boundary near the
# asked-for time, and a FLAC segment carries no duration of its own to
# measure the real cut by: every piece but the last reports N/A, and the last
# reports the whole file. Cutting by hand makes each chunk's offset exactly
# its index times the length, with nothing to measure and nothing to drift.
audio_bytes="$(wc -c < "$audio" | tr -d ' ')"
chunk_seconds="$(python3 -c "
budget = 20 * 1024 * 1024
per_second = $audio_bytes / max($duration, 1)
print(max(60, min(1200, int(budget / max(per_second, 1)))))
")"

mkdir -p "$work/chunks"

# A remainder shorter than a second is folded into the chunk before it rather
# than sent on its own. Whisper answers a fragment of near-silence with a
# hallucinated line, and a 0.02s tail put a stray "Thank you." on the end of
# a transcript (measured). The last chunk therefore runs to the end of the
# file instead of being capped.
chunk_count="$(python3 -c "
import math
n = max(1, math.ceil($duration / $chunk_seconds))
if n > 1 and $duration - (n - 1) * $chunk_seconds < 1:
    n -= 1
print(n)
")"

# Each chunk reaches past its own length into the next one. A cut that lands
# mid-word gives the model half a word on both sides of the seam, and what it
# cannot read it drops silently: at a 7s cut this recording lost "ten,
# eleven", at 8s it lost "fourteen, fifteen" (measured). Reading on means the
# chunk before the seam always holds the straddling word whole, and the
# renderer drops whatever the next chunk repeats.
overlap="$(python3 -c "print(max(1, min(10, $chunk_seconds // 4)))")"

if [[ "$chunk_count" -gt 1 ]]; then
  echo "Splitting ${duration%.*}s into $chunk_count chunks of ${chunk_seconds}s, ${overlap}s overlap…" >&2
  for ((i = 0; i < chunk_count; i++)); do
    target="$(printf '%s/chunks/part-%04d.flac' "$work" "$i")"
    if [[ "$i" -eq $((chunk_count - 1)) ]]; then
      ffmpeg -v error -ss "$((i * chunk_seconds))" -i "$audio" -c:a flac "$target"
    else
      ffmpeg -v error -ss "$((i * chunk_seconds))" -t "$((chunk_seconds + overlap))" \
        -i "$audio" -c:a flac "$target"
    fi
  done
else
  cp "$audio" "$work/chunks/part-0000.flac"
fi

# One chunk to one provider. Prints the HTTP status so the caller decides
# whether the failure is worth falling back over.
post() {
  local endpoint="$1" key="$2" post_model="$3" chunk="$4" target="$5"
  local args=(-s -w '%{http_code}' -X POST "$endpoint"
              -F "file=@$chunk"
              -F "model=$post_model"
              -F "response_format=verbose_json"
              -F "timestamp_granularities[]=segment")
  # No key when a proxy puts one in on the way out. Sending an empty bearer
  # instead would be refused by a proxy that checks what it is given.
  [[ -n "$key" ]] && args+=(-H "Authorization: Bearer $key")
  [[ -n "$language" ]] && args+=(-F "language=$language")
  [[ -n "$prompt" ]] && args+=(-F "prompt=$prompt")
  curl "${args[@]}" -o "$target"
}

index=0
for chunk in "$work"/chunks/part-*.flac; do
  offset=$((index * chunk_seconds))
  index=$((index + 1))
  echo "Transcribing chunk ${index} of ${chunk_count}…" >&2

  response="$work/response-$index.json"
  status="$(post "$groq_base/openai/v1/audio/transcriptions" \
                 "${GROQ_API_KEY:-}" "$model" "$chunk" "$response")"

  # 429 is the quota, 5xx is their side. Either is worth the costlier
  # provider. A 4xx that is not 429 is our own request, and retrying it
  # somewhere else would just fail again.
  if [[ "$status" == "429" || "$status" =~ ^5 ]] \
     && [[ -n "${OPENAI_API_KEY:-}" || "$openai_base" != "https://api.openai.com" ]]; then
    echo "Groq answered $status, falling back to OpenAI…" >&2
    status="$(post "$openai_base/v1/audio/transcriptions" \
                   "${OPENAI_API_KEY:-}" "whisper-1" "$chunk" "$response")"
  fi

  if [[ "$status" != "200" ]]; then
    echo "Chunk $index failed with HTTP $status:" >&2
    head -c 2000 "$response" >&2; echo >&2
    exit 1
  fi

  echo "$offset" > "$work/offset-$index.txt"
done

echo "$chunk_seconds" > "$work/step.txt"
echo "$chunk_count" > "$work/count.txt"

render() {
  python3 - "$work" "$1" <<'PY'
import glob, json, os, sys

work, fmt = sys.argv[1], sys.argv[2]

with open(os.path.join(work, "step.txt")) as f:
    step = float(f.read().strip())
with open(os.path.join(work, "count.txt")) as f:
    count = int(f.read().strip())

# Every chunk reads `overlap` seconds past its own length, so each second of
# audio is transcribed twice at a seam. A chunk owns the segments that BEGIN
# inside its own length, and its reach past that exists only so the segment
# straddling the seam is read with the whole word in hand.
#
# Ownership goes by where a segment begins rather than by dropping whatever
# the next chunk repeats. Whisper sometimes returns one coarse segment for a
# whole chunk, and dropping those by overlap threw away entire chunks of
# speech (measured).
segments = []
for response in sorted(glob.glob(os.path.join(work, "response-*.json"))):
    index = response.rsplit("-", 1)[1].removesuffix(".json")
    with open(os.path.join(work, f"offset-{index}.txt")) as f:
        offset = float(f.read().strip())
    last_chunk = int(index) == count
    with open(response) as f:
        payload = json.load(f)
    for segment in payload.get("segments", []):
        start = segment["start"] + offset
        if not last_chunk and start >= offset + step:
            continue
        # A segment the previous chunk already covered to its end carries
        # nothing new, so the seam does not read twice. One that reaches past
        # what is kept does carry something, and is kept even though its first
        # words repeat: a duplicated phrase is a smaller harm than a lost one.
        if segments and segment["end"] + offset <= segments[-1]["end"]:
            continue
        segments.append({
            "start": start,
            "end": segment["end"] + offset,
            "text": segment["text"].strip(),
        })

text = " ".join(s["text"] for s in segments if s["text"])

if fmt == "text":
    print(text)
    raise SystemExit

# Whisper's own shape, so anything that already reads a Whisper transcript
# reads this one too.
if fmt == "json":
    print(json.dumps({"text": text, "segments": segments}, ensure_ascii=False, indent=2))
    raise SystemExit

def stamp(seconds, sep):
    hours, rest = divmod(seconds, 3600)
    minutes, secs = divmod(rest, 60)
    return f"{int(hours):02d}:{int(minutes):02d}:{int(secs):02d}{sep}{int(round((secs % 1) * 1000)):03d}"

if fmt == "vtt":
    print("WEBVTT\n")
    for s in segments:
        print(f"{stamp(s['start'], '.')} --> {stamp(s['end'], '.')}")
        print(f"{s['text']}\n")
    raise SystemExit

for n, s in enumerate(segments, 1):
    print(n)
    print(f"{stamp(s['start'], ',')} --> {stamp(s['end'], ',')}")
    print(f"{s['text']}\n")
PY
}

if [[ "$format" == "all" ]]; then
  mkdir -p "$out"
  render text > "$out/$stem.txt"
  render srt  > "$out/$stem.srt"
  render vtt  > "$out/$stem.vtt"
  render json > "$out/$stem.json"
  echo "Wrote $out/$stem.{txt,srt,vtt,json}" >&2
elif [[ -n "$out" ]]; then
  render "$format" > "$out"
  echo "Wrote $out" >&2
else
  render "$format"
fi
