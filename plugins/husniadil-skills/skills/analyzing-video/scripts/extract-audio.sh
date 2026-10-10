#!/usr/bin/env bash
# Audio Extraction and Transcription Script
# Usage: extract-audio.sh <input_video> <output_dir> [whisper_model] [start_time] [end_time]
# Example: extract-audio.sh video.mp4 /tmp/audio medium 0:10 0:30
# With a time range only that stretch is extracted and transcribed, and the
# transcript's and the silence list's timestamps are positions in the whole
# video, the same clock extract-frames.sh burns into the frames.

set -euo pipefail

[[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]] && export PATH="$HOME/bin:$PATH"

INPUT="${1:?Usage: extract-audio.sh <input_video> <output_dir> [whisper_model] [start_time] [end_time]}"
OUTPUT_DIR="${2:?Specify output directory}"
MODEL="${3:-base}"  # tiny|base|small|medium|large
START_TIME="${4:-}"  # e.g., "00:00:10" or "10" (seconds)
END_TIME="${5:-}"    # e.g., "00:00:30" or "30" (seconds)

# Quoted for JSON, so a name with " or \ in it still makes valid metadata.
json_string() {
    python3 -c 'import json, sys; print(json.dumps(sys.argv[1]))' "$1"
}

is_time_value() {
    [[ "$1" =~ ^[0-9]+$ || "$1" =~ ^[0-9]+:[0-5]?[0-9]$ || "$1" =~ ^[0-9]+:[0-5]?[0-9]:[0-5]?[0-9]$ ]]
}

time_to_seconds() {
    local value="$1"
    local first second third
    IFS=: read -r first second third <<< "$value"

    if [[ -z "${second:-}" ]]; then
        echo "$((10#$first))"
    elif [[ -z "${third:-}" ]]; then
        echo "$((10#$first * 60 + 10#$second))"
    else
        echo "$((10#$first * 3600 + 10#$second * 60 + 10#$third))"
    fi
}

# Validate input
if [[ ! -f "$INPUT" ]]; then
    echo "ERROR: File not found: $INPUT" >&2
    exit 1
fi

if [[ -n "$START_TIME" ]] && ! is_time_value "$START_TIME"; then
    echo "ERROR: Invalid start_time format: $START_TIME" >&2
    exit 1
fi

if [[ -n "$END_TIME" ]] && ! is_time_value "$END_TIME"; then
    echo "ERROR: Invalid end_time format: $END_TIME" >&2
    exit 1
fi
START_SECONDS=0
if [[ -n "$START_TIME" ]]; then
    START_SECONDS=$(time_to_seconds "$START_TIME")
fi
END_SECONDS=""
if [[ -n "$END_TIME" ]]; then
    END_SECONDS=$(time_to_seconds "$END_TIME")
fi
if [[ -n "$END_SECONDS" && "$END_SECONDS" -le "$START_SECONDS" ]]; then
    echo "ERROR: end_time must be greater than start_time" >&2
    exit 1
fi

# The seek goes before -i, which is fast and exact for audio, and the length
# after it. Both are expanded as ${X[@]+...}, because macOS's /bin/bash 3.2
# calls an empty array unbound under set -u.
SEEK_ARGS=()
LENGTH_ARGS=()
if [[ "$START_SECONDS" -gt 0 ]]; then
    SEEK_ARGS=("-ss" "$START_SECONDS")
fi
if [[ -n "$END_SECONDS" ]]; then
    LENGTH_ARGS=("-t" "$((END_SECONDS - START_SECONDS))")
fi

mkdir -p "$OUTPUT_DIR"

echo "=== Audio Extraction ==="
echo "Input: $INPUT"
echo "Model: $MODEL"
echo "Range: ${START_SECONDS}s to ${END_SECONDS:-end}"

# Get audio stream info
AUDIO_INFO=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels,bit_rate -of json "$INPUT" 2>/dev/null)
echo "Audio info: $AUDIO_INFO"

# Extract audio as WAV (16kHz mono - optimal for Whisper)
AUDIO_FILE="${OUTPUT_DIR}/audio.wav"
echo ""
echo "Extracting audio to WAV (16kHz mono)..."
ffmpeg ${SEEK_ARGS[@]+"${SEEK_ARGS[@]}"} -i "$INPUT" \
    ${LENGTH_ARGS[@]+"${LENGTH_ARGS[@]}"} \
    -vn \
    -acodec pcm_s16le \
    -ar 16000 \
    -ac 1 \
    "$AUDIO_FILE" \
    -y -loglevel warning 2>&1

echo "Audio extracted: $AUDIO_FILE"

# Detect silence segments
echo ""
echo "=== Silence Detection ==="
SILENCE_FILE="${OUTPUT_DIR}/silence.txt"
ffmpeg -i "$AUDIO_FILE" \
    -af "silencedetect=noise=-30dB:d=0.5" \
    -f null - 2>&1 | grep -E "silence_(start|end)" > "$SILENCE_FILE" || true

# silencedetect counts from the start of the cut, so the range's start is
# added back to read as a position in the video.
if [[ "$START_SECONDS" -gt 0 && -s "$SILENCE_FILE" ]]; then
    python3 - "$SILENCE_FILE" "$START_SECONDS" <<'PY'
import re, sys
path, start = sys.argv[1], float(sys.argv[2])
with open(path) as f:
    lines = f.readlines()
with open(path, "w") as f:
    for line in lines:
        f.write(re.sub(r"(silence_(?:start|end): )(-?[0-9.]+)",
                       lambda m: f"{m.group(1)}{float(m.group(2)) + start:.3f}", line))
PY
fi

# Only a count and the first few are printed. A long video has thousands of
# lines here, and all of them landed in the context of the agent running this.
SILENCE_COUNT=$(grep -c "silence_start" "$SILENCE_FILE" || true)
if [[ -s "$SILENCE_FILE" ]]; then
    echo "Silence segments detected: $SILENCE_COUNT, all in ${SILENCE_FILE}. The first ones:"
    head -n 10 "$SILENCE_FILE"
else
    echo "No significant silence detected"
fi

# Audio volume analysis
echo ""
echo "=== Volume Analysis ==="
VOLUME_FILE="${OUTPUT_DIR}/volume.txt"
ffmpeg -i "$AUDIO_FILE" \
    -af "volumedetect" \
    -f null - 2>&1 | grep -E "(mean_volume|max_volume|histogram)" > "$VOLUME_FILE" || true

if [[ -s "$VOLUME_FILE" ]]; then
    cat "$VOLUME_FILE"
fi

# Transcription
echo ""

# Preferred path: Groq's hosted Whisper, through the transcribe-audio skill.
# The decoding runs on Groq's servers, so a long video costs this machine
# nothing but the resample. It writes the same audio.{txt,srt,vtt,json} into
# OUTPUT_DIR that the whisper CLI used to, and its JSON carries whisper's own
# {text, segments} shape, so the audio agent reads it unchanged.
# The skill beside this one, wherever the two are installed.
TRANSCRIBE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/transcribe-audio/scripts/transcribe.sh"

# What actually transcribed, for audio_metadata.json. The model asked for is
# a local whisper name, and the hosted path runs a different one.
TRANSCRIBER="none"
TRANSCRIPTION_MODEL=""
OPENAI_FALLBACK_CHUNKS=0

# A GROQ_BASE_URL proxy holds the key at its own edge, so no key is set here.
if [[ ( -n "${GROQ_API_KEY:-}" || -n "${GROQ_BASE_URL:-}" ) && -x "$TRANSCRIBE" ]]; then
    # This script speaks whisper's five model names. Groq has two, so the
    # small ones map to turbo and the big ones to large-v3.
    case "$MODEL" in
        tiny|base|small) HOSTED_MODEL="turbo"; TRANSCRIPTION_MODEL="whisper-large-v3-turbo" ;;
        *) HOSTED_MODEL="large"; TRANSCRIPTION_MODEL="whisper-large-v3" ;;
    esac
    TRANSCRIBER="groq"

    echo "=== Transcription (Groq, $MODEL -> $HOSTED_MODEL) ==="
    # Its progress is kept in transcribe.log as well, to count the chunks
    # that Groq refused and OpenAI's whisper-1 transcribed instead.
    "$TRANSCRIBE" "$AUDIO_FILE" --model "$HOSTED_MODEL" --format all --out "$OUTPUT_DIR" \
        --offset "$START_SECONDS" 2>&1 | tee "${OUTPUT_DIR}/transcribe.log"
    OPENAI_FALLBACK_CHUNKS=$(grep -c "falling back to OpenAI" "${OUTPUT_DIR}/transcribe.log" || true)

    echo "Transcription complete. Output files:"
    ls -la "${OUTPUT_DIR}"/audio.{txt,json,srt,vtt} 2>/dev/null || true
elif command -v whisper &>/dev/null; then
    TRANSCRIBER="local-whisper"
    TRANSCRIPTION_MODEL="$MODEL"
    echo "=== Transcription (local Whisper $MODEL) ==="
    whisper "$AUDIO_FILE" \
        --model "$MODEL" \
        --output_dir "$OUTPUT_DIR" \
        --output_format all \
        --verbose False \
        2>&1

    # The CLI has no offset of its own, so the range's start is added to
    # audio.json, the file the audio agent reads. Its srt, vtt and tsv keep
    # counting from the start of the cut.
    if [[ "$START_SECONDS" -gt 0 ]]; then
        python3 - "${OUTPUT_DIR}/audio.json" "$START_SECONDS" <<'PY'
import json, sys
path, start = sys.argv[1], float(sys.argv[2])
with open(path) as f:
    data = json.load(f)
for segment in data.get("segments", []):
    segment["start"] += start
    segment["end"] += start
    for word in segment.get("words", []):
        word["start"] += start
        word["end"] += start
with open(path, "w") as f:
    json.dump(data, f, ensure_ascii=False)
PY
    fi

    echo "Transcription complete. Output files:"
    ls -la "${OUTPUT_DIR}"/audio.{txt,json,srt,vtt,tsv} 2>/dev/null || true
else
    echo "WARNING: no transcriber available."
    echo "Set GROQ_API_KEY or GROQ_BASE_URL for hosted transcription, or install a local one"
    echo "with: pip install openai-whisper"
    echo "Skipping transcription."
fi

# Write audio metadata
cat > "${OUTPUT_DIR}/audio_metadata.json" <<EOF
{
  "source": $(json_string "$(basename "$INPUT")"),
  "audio_file": $(json_string "$AUDIO_FILE"),
  "transcriber": "$TRANSCRIBER",
  "whisper_model": $([[ -n "$TRANSCRIPTION_MODEL" ]] && json_string "$TRANSCRIPTION_MODEL" || echo null),
  "openai_fallback_chunks": $OPENAI_FALLBACK_CHUNKS,
  "silence_file": $(json_string "$SILENCE_FILE"),
  "silence_segments": $SILENCE_COUNT,
  "volume_file": $(json_string "$VOLUME_FILE"),
  "start_seconds": $START_SECONDS,
  "end_seconds": ${END_SECONDS:-null},
  "sample_rate": 16000,
  "channels": 1
}
EOF

echo ""
echo "=== Done ==="
echo "Audio:         $AUDIO_FILE"
echo "Transcription: ${OUTPUT_DIR}/audio.json"
echo "Silence:       $SILENCE_FILE"
echo "Volume:        $VOLUME_FILE"
