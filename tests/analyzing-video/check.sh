#!/usr/bin/env bash
# The analyzing-video checks: key frames land on every scene change, and the scripts run inside a caller's loop.
# Run it from anywhere with bash tests/analyzing-video/check.sh. It needs ffmpeg with drawtext, ffprobe and python3,
# and builds its own clips in a temporary folder it removes afterwards. A transcriber (Groq or local whisper) is used
# if one is set up, and the audio loop passes without one. Every line ends in ok or FAIL, and the exit code counts FAILs.
set -uo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
S="$HERE/../../plugins/husniadil-skills/skills/analyzing-video/scripts"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
FAILS=0
check() { if [[ "$2" == "$3" ]]; then echo "$1: ok"; else echo "$1: FAIL (got $2, want $3)"; FAILS=$((FAILS + 1)); fi; }

# Four 3.5 s colour blocks, so three cuts at about 3.53, 7.03 and 10.57 s, and a 2 s tone with a picture.
ffmpeg -nostdin -v error -f lavfi -i "color=c=red:s=320x240:d=3.5" -f lavfi -i "color=c=blue:s=320x240:d=3.5" \
    -f lavfi -i "color=c=green:s=320x240:d=3.5" -f lavfi -i "color=c=white:s=320x240:d=3.5" \
    -filter_complex "[0][1][2][3]concat=n=4:v=1:a=0,format=yuv420p" -r 30 "$WORK/cuts.mp4"
ffmpeg -nostdin -v error -f lavfi -i "sine=f=440:d=2" -f lavfi -i "color=c=gray:s=160x120:d=2" -shortest "$WORK/tone.mp4"

# The drawtext check once reported a working ffmpeg as lacking drawtext, so the script stopped before any frame.
bash "$S/extract-frames.sh" "$WORK/cuts.mp4" "$WORK/frames" 1 0 0 4x4 > "$WORK/frames.log" 2>&1
check "extract-frames.sh exit" "$?" "0"

if [[ -f "$WORK/frames/scene_changes.txt" ]]; then
    # One key frame per scene change, named after its time. The key frame loop once got 1 of 3, and 97.7667 as 7.
    SCENES=$(wc -l < "$WORK/frames/scene_changes.txt" | tr -d ' ')
    check "scene changes found" "$SCENES" "3"
    KEYS=$(ls "$WORK/frames/key_frames" 2>/dev/null | wc -l | tr -d ' ')
    check "key frames, one per scene change" "$KEYS" "$SCENES"
    WANT=$(tr '.' '_' < "$WORK/frames/scene_changes.txt" | sed 's/$/s.jpg/' | tr '\n' ' ')
    GOT=$(ls "$WORK/frames/key_frames" 2>/dev/null | sed 's/^scene_[0-9]*_//' | tr '\n' ' ')
    check "key frame names match the scene times" "$GOT" "$WANT"

    # Each key frame shows the block after its cut: blue, green, white.
    COLOURS=""
    for f in "$WORK"/frames/key_frames/*.jpg; do
        [[ -f "$f" ]] || continue
        RGB=$(ffmpeg -nostdin -v error -i "$f" -vf "crop=20:20:150:150,scale=1:1" -f rawvideo -pix_fmt rgb24 - | od -An -tu1 | tr -s ' ')
        COLOURS="$COLOURS$(python3 -c 'import sys; r, g, b = map(int, sys.argv[1:]); print("white" if min(r, g, b) > 200 else max((r, "red"), (g, "green"), (b, "blue"))[1], end=" ")' $RGB)"
    done
    check "key frames show the scene after each cut" "$COLOURS" "blue green white "
else
    echo "key frame checks: FAIL (no scene_changes.txt; the script said: $(tail -n 2 "$WORK/frames.log" | tr '\n' ' '))"
    FAILS=$((FAILS + 1))
fi

# Called from a loop over three videos, each script has to leave the loop's input alone.
RUNS=$(printf 'a\nb\nc\n' | while IFS= read -r tag; do bash "$S/extract-frames.sh" "$WORK/cuts.mp4" "$WORK/loop_$tag" 1 0 0 4x4 >/dev/null 2>&1; echo "$tag"; done | wc -l | tr -d ' ')
check "extract-frames.sh in a caller's loop of 3" "$RUNS" "3"
RUNS=$(printf 'a\nb\nc\n' | while IFS= read -r tag; do bash "$S/extract-audio.sh" "$WORK/tone.mp4" "$WORK/audio_$tag" tiny >/dev/null 2>&1; echo "$tag"; done | wc -l | tr -d ' ')
check "extract-audio.sh in a caller's loop of 3" "$RUNS" "3"

exit "$FAILS"
