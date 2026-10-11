# Delivery: canvas, loops and X

## Pick the canvas before the first frame

Changing it later re-directs every shot.

| Shape | Size | Where |
|---|---|---|
| 16:9 | 1920 x 1080 | YouTube, a talk, B-roll |
| 1:1 | 1080 x 1080 | a feed post; the safest in any feed |
| 4:5 | 1080 x 1350 | an Instagram or LinkedIn feed post |
| 9:16 | 1080 x 1920 | Shorts, Reels, TikTok |

Width and height must be even for H.264 in yuv420p.

## Loops

- Render frames 0 to N-1, never N: frame N is frame 0 again, and showing it twice is the hiccup people see at the seam.
- Drive every loop from `phase = frame / N` with whole cycles: a square that turns exactly 90 degrees per loop, a wave that completes exactly 2 cycles. For organic drift, sample noise along a circle so it comes back to where it started.
- Make frame 0 a finished composition. It is on screen while the file loads.
- `render.mjs --loop` checks the seam; read the numbers it prints.

## X

From X's own pages, checked 2026-10-11 (the API's media best practices on docs.x.com, and the Help Center pages on GIFs and videos). The two disagree in places, so this lists both.

| | GIF | Video |
|---|---|---|
| File size | 15 MB from the web, 5 MB from the mobile app | 512 MB, up to 140 s without Premium |
| Dimensions | up to 1280 x 1080 | Help Center (web upload): up to 1920 x 1200 or 1200 x 1900. API: 32 x 32 to 1280 x 1024, 1280 x 720 recommended |
| Frames and rate | up to 350 frames, and width x height x frames under 300 million | Help Center: up to 40 fps. API: 60 fps or less, 30 or 60 recommended |
| Aspect ratio | | Help Center: 1:2.39 to 2.39:1. API: 1:3 to 3:1 |
| Format | one palette, loop forever | H.264 High profile, YUV 4:2:0 only, AAC LC audio, mono or stereo, progressive |

The safe choice for a post: 30 fps, at most 1920 x 1080, 16:9 to 9:16, which `render.mjs` produces with `--fps 30`. At 24 fps the 350-frame cap makes a GIF at most 14.5 s; a 4 to 6 s loop is 96 to 144 frames.

## GIF timing

GIF frame delays are stored in hundredths of a second, so a 24 fps frame (41.7 ms) can't be stored exactly, and rounding every frame to 40 ms runs the loop 4% fast. ffmpeg spreads the error itself: a 6 s, 144-frame loop at 24 fps came out as 120 frames of 40 ms and 24 of 50 ms, exactly 6.000 s (ffmpeg 9.0.2, the `render.mjs --gif` command). Another encoder may round every frame; check its total length.
