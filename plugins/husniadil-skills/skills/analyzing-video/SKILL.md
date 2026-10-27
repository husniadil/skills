---
name: analyzing-video
description: Analyzes video files by extracting frames, detecting scene changes, and optionally transcribing audio. Produces structured markdown analysis with timeline, visual descriptions, and key moments. Use when the user provides a video file (.mp4, .mov, .avi, .mkv, .webm) or a video URL (YouTube or any site yt-dlp supports) and wants analysis, asks to "analyze a video", "describe this video", "video timeline", "what happens in this video", or mentions video content understanding. Supports custom frame rates ("at 5fps", "1 frame every 3 seconds"), time ranges ("from 0:10 to 0:30", "first 15 seconds"), visual-only mode ("skip audio"), and user-provided transcripts. Also sifts a video down to the frames that differ plus the distinct poses of whatever moves inside each shot, for "unique frames", "deduplicate frames", or how a character talks, walks or gestures.
argument-hint: "[video-path-or-url]"
allowed-tools: Bash, Read, Agent
---

# Video Analyzer

Extracts frames at adaptive rates, creates montage grids, detects scene changes, and dispatches parallel subagents for visual and audio analysis.

## Gotchas

- Social media downloads (Instagram, TikTok) embed a MJPEG thumbnail as video stream 0. The scripts auto-detect the real H.264/H.265 stream and skip `attached_pic` streams.
- macOS `grep` lacks `-P` (Perl regex). All scripts use `sed` and basic `grep` for compatibility.
- FFmpeg treats `.` in output filenames as image sequence patterns. Key frame extraction uses `-update 1` to write single images.
- FFmpeg reads stdin for keyboard commands, so inside a `while read` loop it eats the lines the loop has not read yet. The scripts pass `-nostdin` to every ffmpeg, and running them in a loop over several videos is safe.
- Under `set -o pipefail`, `ffmpeg ... | grep -q` can fail even on a match: grep quits early and ffmpeg dies of SIGPIPE. It is a race, so it can pass one day and fail the next. Read ffmpeg's output into a variable first, then grep the variable.
- Portrait videos (height > width) use 3x5 grid layout instead of 4x4 for better cell visibility.
- Scene detection threshold is `0.3`. For static content (presentations, documents), lower to `0.1`. For fast action (games, sports), raise to `0.4`.
- Always verify extraction produced output before dispatching analysis agents.

## Prerequisites

Requires `ffmpeg` with the `drawtext` filter, `ffprobe` and `python3`. For transcription: the `transcribe-audio` skill beside this one with `GROQ_API_KEY` or `GROQ_BASE_URL` (hosted, preferred), or the local `whisper` CLI as an offline fallback.

Check with `command -v ffmpeg ffprobe python3` and `ffmpeg -hide_banner -filters | grep ' drawtext '` before the first script. Homebrew's plain `ffmpeg` formula is built without freetype and has no `drawtext`, so on macOS the install is `brew install ffmpeg-full`, which is keg-only: `"$(brew --prefix ffmpeg-full)/bin"` has to come ahead of the plain one on PATH. On Debian or Ubuntu it is `sudo apt-get install ffmpeg`. A URL also needs `yt-dlp`, and a YouTube URL `deno` as well (`brew install yt-dlp deno` on macOS, `pipx install yt-dlp` and Deno's own installer on Linux). If something is missing, stop and tell the user which one and that command. Do not install it yourself, and do not do the analysis another way instead.

## Transcription Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **auto** | Default | Transcribe. Hosted with `GROQ_API_KEY`, else local Whisper. |
| **user-provided** | User supplies transcript file/text | Use provided transcript |
| **skip** | "visual only", "skip audio", "no transcription" | No audio processing |

## Customization

Detect these overrides from the user's request:

| Override | User Says | Effect |
|----------|-----------|--------|
| **Custom FPS** | "at 5fps", "3 frames per second", "1 frame every 2 seconds" | Override tier-based fps rate |
| **Time range** | "from 0:10 to 0:30", "first 15 seconds", "last minute" | Analyze only the specified segment |
| **Both** | "analyze 0:10-0:30 at 5fps" | Custom fps on a segment |

Convert user phrasing to script parameters:
- "5fps" / "5 frames per second" → fps_override=`5`
- "1 frame every 3 seconds" → fps_override=`0.333`
- "1 frame every 10 seconds" → fps_override=`0.1`
- "from 0:10 to 0:30" → start_time=`10` end_time=`30`
- "first 15 seconds" → start_time=`0` end_time=`15`
- "last 30 seconds" → calculate: start_time=`duration-30`

`${CLAUDE_SKILL_DIR}` in the commands here is this skill's own directory. Claude Code fills it in. In another agent, use the directory this SKILL.md was loaded from.

Pass overrides to scripts:
```bash
bash ${CLAUDE_SKILL_DIR}/scripts/video-info.sh "<video_path>" [fps_override] [start_time] [end_time]
bash ${CLAUDE_SKILL_DIR}/scripts/extract-frames.sh "<video_path>" "<work_dir>/frames" <fps> <max> <stream> <grid> [start_time] [end_time]
bash ${CLAUDE_SKILL_DIR}/scripts/extract-audio.sh "<video_path>" "<work_dir>/audio" <whisper_model> [start_time] [end_time]
```

A time range goes to the audio too, so only that stretch is transcribed. Its transcript and silence timestamps are positions in the whole video, the same clock the frames have burned in.

When custom fps is set, tier becomes `custom` and the 1000-frame safety cap applies. A rate that would pass 1000 frames is lowered so the 1000 reach the end of the range, and `tier_description` says so. Tell the user the rate that was used.

## Workflow

Copy this checklist and track progress:

```
- [ ] Step 0: Download the video, if the input is a URL
- [ ] Step 1: Get video info (tier, stream, orientation)
- [ ] Step 2: Extract frames + grids + scene key frames
- [ ] Step 3: Verify extraction output (frames exist, grids exist)
- [ ] Step 4: Dispatch parallel analysis agents
- [ ] Step 5: Synthesize results into analysis document
- [ ] Step 6: Clean up temp directory
```

### Step 0: Download a URL

Skip this for a file. For a URL, download the whole video first, then use the path it prints wherever the steps below say `$ARGUMENTS`:

```bash
mkdir -p ~/videos
yt-dlp -f "bv*[height<=720]+ba/b[height<=720]/b" --merge-output-format mp4 \
  -o "$HOME/videos/%(title)s [%(id)s].%(ext)s" \
  --print after_move:filepath "<url>"
```

- 720p is enough, because frames and key frames are scaled to at most 1280 wide.
- Download the whole video even when the user asks for a time range. A clipped download starts its clock at 0, so the times on the frames and the transcript would no longer match the original.
- The analysis is written next to the video, so it lands in `~/videos` too.
- For a YouTube video, the `youtube-transcript` skill beside this one gets YouTube's own captions as a VTT. Passed as the user-provided transcript, it lines up with the frames and needs no Whisper run.
- On HTTP 429 or a bot check, follow the Cookies section of `youtube-transcript`.

### Step 1: Get Video Info

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/video-info.sh "$ARGUMENTS"
```

Returns JSON with: `video_stream_index`, `tier`, `fps_rate`, `max_frames`, `orientation`, `grid_layout`, `has_audio`, `work_dir`, `whisper_model`.

| Tier | Duration | Frame Rate | Whisper Model |
|------|----------|-----------|---------------|
| Short | <1 min | 2/sec | medium |
| Medium | 1-3 min | 1/sec | medium |
| Long | 3-10 min | 1/10sec | base |
| Extended | 10+ min | 1/20sec, max 60 spread over the whole video | base |

### Step 2: Extract Frames (and Audio)

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/extract-frames.sh "$ARGUMENTS" "<work_dir>/frames" <fps_rate> <max_frames> <stream_index> <grid_layout>
```

For transcription (auto mode only):
```bash
bash ${CLAUDE_SKILL_DIR}/scripts/extract-audio.sh "$ARGUMENTS" "<work_dir>/audio" <whisper_model> [start_time] [end_time]
```

Dispatch both in parallel when applicable.

### Step 3: Verify Extraction

Before dispatching agents, verify output:
- Check `<work_dir>/frames/grid_*.jpg` exist (at least 1 grid)
- Check `<work_dir>/frames/metadata.json` for frame count and grid count
- If scene changes detected, check `<work_dir>/frames/key_frames/` has images
- If extraction failed, report error and stop

### Step 4: Parallel Subagent Analysis

Dispatch in parallel:

- **Grid agents** (1 per 2-3 grids): Read montage grid images, describe visual content per time range
- **Key frame agent** (if scene changes detected): Read high-res `key_frames/` images for detailed scene-change analysis. There are at most 20, spread over the range, so with more scene changes than that `scene_changes.txt` lists moments that have no key frame.
- **Audio agent** (skip if mode is `skip`): Read transcription and audio metadata

### Step 5: Synthesize and Output

Merge all agent results into `<video_name>_analysis.md` next to the source video:

```markdown
# Video Analysis: [filename]

## Overview
| Property | Value |
|----------|-------|
| Duration | HH:MM:SS |
| Resolution | WxH |
| Orientation | portrait/landscape |
| Analysis Tier | short/medium/long/extended |
| Frames Analyzed | N |
| Scene Changes | N |
| Transcription | auto/user-provided/skipped |

## Executive Summary
[2-3 paragraph summary]

## Timeline
| Time | Visual | Audio/Speech |
|------|--------|-------------|
| 00:00 | [description] | [what is said/heard] |

## Detailed Scene Analysis
### Scene 1: [Title] (00:00 - 00:15)
**Visual**: [description]
**Audio**: [what is heard]
**Context**: [significance]

## Conclusions
[Overall analysis]
```

### Step 6: Cleanup

```bash
rm -rf "<work_dir>"
```

## Frame sifting

For "only the frames that change", deduplicated frames, or how a character talks, walks or gestures, run `scripts/framesift.py` instead of the fixed-rate extraction. It needs `uv`, which brings numpy and Pillow from the script's own metadata.

```bash
uv run ${CLAUDE_SKILL_DIR}/scripts/framesift.py "<video_path>" "<out_dir>" [--vtt captions.vtt] [--unique 20] [--start S --end E]
```

It decodes at 12 fps and makes two passes over a 32x18 grid of blocks:

- The holistic pass keeps a frame when at least `--unique` percent (default 20) of block averages differ from the last kept frame. A shot where only a mouth moves stays one frame, and cuts, zooms and pans add frames. Block averages ignore small camera drift. A transition is kept once it settles, never on a frame that is near black or still fading.
- The detail pass groups the blocks that keep moving inside each holistic span into up to three clusters, such as a mouth, a walking figure or a hand. Each cluster's crop is compared with every pose kept so far, so a lip flap cycling A-B-A-B keeps A and B, and `sequence` records which pose shows when.

`<out_dir>` gets `holistic/` frames at 1280x720, `holistic_sheet_NN.jpg` contact sheets, pose crops in `detail/hNNNN/` with one `detail/hNNNN_sheet.jpg` per span, and `index.json` with each time, trigger (`cut` or `change`), cluster box (analysis pixels, times `box_scale` for the saved frames) and pose sequence. With `--vtt`, a YouTube auto-caption VTT from `youtube-transcript`, each span gets `speech_pct` from the per-word times. Whole cues would read as 100%, because rolling captions stay up between lines.

Tune with `--unique` (higher keeps fewer frames), `--variant` (percent of a cluster's moving area that must differ for a new pose, default 10) and `--max-variants` (default 12). Clusters are found by motion alone, so which one is a mouth and which a walk is read from the sheets.

## Scripts

| Script | Purpose | Args |
|--------|---------|------|
| `scripts/video-info.sh` | Metadata, stream detection, tier | `<video_path>` |
| `scripts/extract-frames.sh` | Frames, grids, scene detection, key frames | `<video_path> <out_dir> <fps> [max] [stream] [grid]` |
| `scripts/extract-audio.sh` | Audio, silence detection, transcription | `<video_path> <out_dir> [model] [start] [end]` |
| `scripts/framesift.py` | Frames that differ, plus the poses of what moves in each shot (run with `uv run`) | `<video_path> <out_dir> [--vtt] [--unique] [--start] [--end]` |

## References

- [references/ffmpeg-commands.md](references/ffmpeg-commands.md) — FFmpeg gotchas and non-obvious commands
- [references/transcription-guide.md](references/transcription-guide.md) — Whisper model selection and troubleshooting
- [references/analysis-strategies.md](references/analysis-strategies.md) — Subagent dispatch patterns and output template
