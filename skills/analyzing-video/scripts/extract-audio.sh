#!/usr/bin/env bash
# Audio Extraction and Transcription Script
# Usage: extract-audio.sh <input_video> <output_dir> [whisper_model]
# Example: extract-audio.sh video.mp4 /tmp/audio medium

set -euo pipefail

[[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]] && export PATH="$HOME/bin:$PATH"

INPUT="${1:?Usage: extract-audio.sh <input_video> <output_dir> [whisper_model]}"
OUTPUT_DIR="${2:?Specify output directory}"
MODEL="${3:-base}"  # tiny|base|small|medium|large

# Validate input
if [[ ! -f "$INPUT" ]]; then
    echo "ERROR: File not found: $INPUT" >&2
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "=== Audio Extraction ==="
echo "Input: $INPUT"
echo "Model: $MODEL"

# Get audio stream info
AUDIO_INFO=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels,bit_rate -of json "$INPUT" 2>/dev/null)
echo "Audio info: $AUDIO_INFO"

# Extract audio as WAV (16kHz mono - optimal for Whisper)
AUDIO_FILE="${OUTPUT_DIR}/audio.wav"
echo ""
echo "Extracting audio to WAV (16kHz mono)..."
ffmpeg -i "$INPUT" \
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

if [[ -s "$SILENCE_FILE" ]]; then
    echo "Silence segments detected (see ${SILENCE_FILE}):"
    cat "$SILENCE_FILE"
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

# A GROQ_BASE_URL proxy holds the key at its own edge, so no key is set here.
if [[ ( -n "${GROQ_API_KEY:-}" || -n "${GROQ_BASE_URL:-}" ) && -x "$TRANSCRIBE" ]]; then
    # This script speaks whisper's five model names. Groq has two, so the
    # small ones map to turbo and the big ones to large-v3.
    case "$MODEL" in
        tiny|base|small) HOSTED_MODEL="turbo" ;;
        *) HOSTED_MODEL="large" ;;
    esac

    echo "=== Transcription (Groq, $MODEL -> $HOSTED_MODEL) ==="
    "$TRANSCRIBE" "$AUDIO_FILE" --model "$HOSTED_MODEL" --format all --out "$OUTPUT_DIR"

    echo "Transcription complete. Output files:"
    ls -la "${OUTPUT_DIR}"/audio.{txt,json,srt,vtt} 2>/dev/null || true
elif command -v whisper &>/dev/null; then
    echo "=== Transcription (local Whisper $MODEL) ==="
    whisper "$AUDIO_FILE" \
        --model "$MODEL" \
        --output_dir "$OUTPUT_DIR" \
        --output_format all \
        --verbose False \
        2>&1

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
  "source": "$(basename "$INPUT")",
  "audio_file": "$AUDIO_FILE",
  "whisper_model": "$MODEL",
  "silence_file": "$SILENCE_FILE",
  "volume_file": "$VOLUME_FILE",
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
