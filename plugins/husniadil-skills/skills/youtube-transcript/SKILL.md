---
name: youtube-transcript
description: Download YouTube video transcript/subtitles using yt-dlp and save as plain text. Use when user shares a YouTube URL and wants transcript, subtitles, or wants to analyze video content.
---

# YouTube Transcript Downloader

Extract transcripts from YouTube videos using `yt-dlp` with Chrome cookies and JS challenge solver.

## Prerequisites

- `yt-dlp` installed (check with `which yt-dlp`), reasonably current. It warns
  when its own build is over 90 days old, and YouTube breaks old builds.
- `deno` installed. Recent yt-dlp reaches for it by itself (`[jsc:deno]`), so
  `--remote-components ejs:github` is no longer needed.
- Cookies are OPTIONAL. See "Cookies" below before reaching for them.

Check with `command -v yt-dlp deno` first. If one is missing, stop and tell
the user which one and the command that installs it here (`brew install yt-dlp
deno` on macOS, `pipx install yt-dlp` and Deno's own installer on Linux). Do
not install it yourself, and do not fall back to scraping the page.

## When to use this, and when to use transcribe-audio

This skill takes the captions YouTube already holds. It is free and instant,
and it returns nothing when a video has none.

`transcribe-audio` runs the audio through hosted Whisper. It costs money and
takes time, and it works on any video, any podcast and any file.

Try this skill first. Fall back to `transcribe-audio` when `--list-subs` shows
no captions, or when the captions are too poor to use.

## Steps

1. **Create output directory** if it doesn't exist:
   ```bash
   mkdir -p ~/transcripts
   ```

2. **Extract video ID** from the URL (the 11-char ID after `v=` or in youtu.be/ URLs).

3. **Download subtitles.** Start with no cookies at all:
   ```bash
   yt-dlp --write-auto-sub \
     --sub-lang "en,id" \
     --sub-format vtt \
     --skip-download \
     -o "$HOME/transcripts/%(title)s [%(id)s]" \
     "VIDEO_URL"
   ```

   Key flags:
   - `--write-auto-sub` — includes auto-generated subtitles
   - `--sub-lang "en,id"` — preferred languages (adjust per user request)
   - `--skip-download` — don't download video, only subtitles

   If that returns HTTP 429 or a bot check, add a cookie source and run it
   again. See "Cookies".

4. **Convert VTT to plain text.** Pass the VTT for the language the user
   wants, `{LANG}` being `en`, `id` and so on:
   ```bash
   python3 - ~/transcripts/*{VIDEO_ID}*.{LANG}.vtt <<'PY'
   import re, sys
   vtt_path = sys.argv[1]
   txt_path = vtt_path.rsplit('.', 2)[0] + '.txt'  # Remove .LANG.vtt, add .txt
   out = []
   for line in open(vtt_path).read().split('\n'):
       s = line.strip()
       if not s or s.startswith(('WEBVTT', 'Kind:', 'Language:')) or '-->' in s or 'align:' in s or 'position:' in s:
           continue
       clean = re.sub(r'<[^>]+>', '', s).strip()
       # Auto-captions repeat each line in the cue after it, so only a line
       # equal to the one before it is dropped. A line said again later stays.
       if clean and (not out or clean != out[-1]):
           out.append(clean)
   with open(txt_path, 'w') as f:
       f.write('\n'.join(out))
   print(txt_path, len(out))
   PY
   ```

5. **Report** the saved file path and line count to the user.

6. **Clean up** the intermediate VTT file. Step 3 names it
   `<title> [<id>].<lang>.vtt`, so the ID sits in the middle:
   ```bash
   rm ~/transcripts/*{VIDEO_ID}*.vtt
   ```

## Cookies

Cookies are only for YouTube rate-limiting you or asking whether you are a
robot. Most videos need none.

On a Mac, `--cookies-from-browser chrome` fails before it reaches YouTube:

```
ERROR: could not find chrome cookies database in ".../Google/Chrome"
```

That is macOS TCC, not a missing Chrome and not a yt-dlp bug. Chrome's and
Safari's data directories are protected, and a shell without Full Disk Access
gets `Operation not permitted` on them (measured 2026-09-20: `ls` on Chrome,
Safari and Brave denied; Chrome Canary, Arc, Chrome for Testing and Documents
fine). Which ones are protected differs per machine, so measure rather than
assume.

Two ways round it, cheapest first:

- **Point at a profile TCC does not protect.** Any Chromium profile works when
  its directory is readable, given as an explicit path. Find one first, since
  which are readable differs per machine:
  ```bash
  for d in "Google/Chrome" "Google/Chrome Canary" "Arc" "BraveSoftware/Brave-Browser"; do
    p="$HOME/Library/Application Support/$d"
    ls "$p" >/dev/null 2>&1 && find "$p" -maxdepth 2 -name Cookies 2>/dev/null
  done
  ```
  On the machine this was written on that found Chrome Canary and nothing
  else, so the examples say Canary. There is nothing special about Canary: it
  was simply the one readable profile that had a cookie database.
  ```bash
  --cookies-from-browser "chrome:$HOME/Library/Application Support/Google/Chrome Canary"
  ```
  This gets you PAST RATE LIMITING, and nothing more. Measured 2026-09-20: 18
  cookies extracted, and the 429 that the bare run hit on a second subtitle
  language was gone, on two videos.

  It does NOT get you a signed-in session unless you are signed in to YouTube
  in that very profile, which for a browser you do not use means you are not.
  Age-restricted, members-only and private content still needs the real
  session, and only the next option reaches it.
- **Grant Full Disk Access** to whatever runs yt-dlp, and plain
  `--cookies-from-browser chrome` starts working. This lets that process read
  every app's data on the machine, so weigh it against the line above.

## Output

- Plain text transcript saved to `~/transcripts/{VIDEO_TITLE} [{VIDEO_ID}].txt`
- Format: one line per caption line, tags stripped, and the repeat of each
  line in the cue after it dropped

## Troubleshooting

- **429 / bot detection**: add a cookie source. See "Cookies".
- **"could not find chrome cookies database"**: macOS TCC. See "Cookies".
- **n challenge failed**: install `deno`. On an older yt-dlp, add
  `--remote-components ejs:github`; a current one does this itself.
- **No subtitles**: the video may have none. Check with `--list-subs`, then use
  `transcribe-audio` instead.
- **"impersonation ... no impersonate target"**: a warning, not an error. The
  download goes through. Install `curl-cffi` to silence it.
- **Different browser**: `--cookies-from-browser` takes `chrome`, `chromium`,
  `brave`, `edge`, `firefox`, `opera`, `safari`, `vivaldi`, `whale`, each
  optionally followed by `:PATH` for a profile of your own.
