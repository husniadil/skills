# Directed prompt: Pigeon, one message

```text
GOAL: In 30 seconds a viewer sees one message in a made-up messenger, Pigeon, go from a sender to a friend: typed, locked end to end, held by the server while the friend's phone is off, arrived when the phone turns on, and read. The viewer understands the whole path in silence and feels calm, not techy.

OUTPUT: one self-contained HTML file, piece.html: plain HTML, CSS and JavaScript, no libraries, no network requests. 1080x1920 (9:16) by default; ?format=1:1 renders 1080x1080 from the same file, read once at load. Font: system "Avenir Next" weight 500, fallbacks "Helvetica Neue", Arial, sans-serif.

TIME: 30 s x 30 fps = 900 frames (0 to 899). One shot: it ends on an end card, no loop. 120 BPM: a beat is 15 frames, a bar 60. Hits land on beat 8 (frame 120) and beat 44 (frame 660).

LOOK:
- Stage paper #F3EFE8 (derived: a warm off-white; Pigeon has no brand).
- Ink #1E2430 for the big line, the bubble text, the padlock and the send button (derived).
- Label #4A5160 (derived; 7:1 on the paper).
- Card #FFFFFF, 2 px edge #E4DED3, radius 56 px, shadow 0 30 60 rgba(30,36,48,0.08) (derived).
- Sand bubble #E8E1D4, tick grey #9AA3AE, phone off #2B2E35 (all derived).
- One accent, blue #2F6FDB, marks one thing only: the ticks once read (derived).
- Big line: 84 px, line-height 1.08, box left 96 px, top 280 px, width 840 px, max 2 lines (data-max-lines="2"). Label: 42 px, weight 400, 24 px below the big line, max 2 lines. 1:1: big 72 px at left 72, top 80, width 936; label 40 px.
- Hero (the message): 124 px tall. A composer 800 px wide (white card, 2 px edge), morphing to a sand bubble 520 px wide at frames 119 to 131. Bubble text 56 px, left 40 px. 1:1: composer 440 px, bubble 400 px, text 48 px.
- Stations on a path: the sender card (860x720), the server card 800 px below it, the friend's phone card 800 px further. 1:1: the same three cards in a row, 580 px apart, each 500x640.
- The hero stays at the anchor, (540, 900) on 9:16 and (540, 640) on 1:1, for the whole piece. The world moves under it; the hero never moves on screen.

MOTION (cubic-bezier; durations in frames at 30 fps):
- Text enters on cubic-bezier(0.16, 1, 0.3, 1) over 10 frames and exits on cubic-bezier(0.32, 0, 0.67, 0) over 8 frames. Text never moves.
- Camera legs on cubic-bezier(0.76, 0, 0.24, 1), 60 frames each: frames 240 to 299 (sender to server) and 480 to 539 (server to friend).
- Composer to bubble on cubic-bezier(0.16, 1, 0.3, 1), 12 frames from frame 119.
- Send press: the send button scales 1 to 0.92 over frames 114 to 116 on cubic-bezier(0.22, 1, 0.36, 1), then back to 1 over 117 to 122 on cubic-bezier(0.16, 1, 0.3, 1).
- Typing: "See you at 7?" one character every 4 frames from frame 60 (13 characters, the last at 108). No easing.
- Padlock: the text dissolves to nine ink dots over frames 130 to 141 on cubic-bezier(0.22, 1, 0.36, 1). The shackle rises 14 px and settles over frames 136 to 149 on the same curve. No overshoot.
- Ticks: grey fades in over frames 125 to 130. They turn #2F6FDB over frames 659 to 671 on cubic-bezier(0.16, 1, 0.3, 1); the first visible change is frame 660.
- Friend's power symbol fades in over frames 366 to 377 and out over 450 to 455.
- Friend's screen lights from #2B2E35 to #FFFFFF over frames 450 to 465 on cubic-bezier(0.22, 1, 0.36, 1); its chat bars fade in over 456 to 471.
- Tap ring on the bubble: radius 18 to 64 px and opacity 0.6 to 0 over frames 642 to 658 on cubic-bezier(0.16, 1, 0.3, 1).
- End push: the world scales 1 to 1.02 about the hero over frames 780 to 899 on cubic-bezier(0.37, 0, 0.63, 1). Text does not scale.
- Springs: none. Nothing bounces.

SHOTS (frames; one hero move per shot; the handoff):
1. Start, 0 to 59: empty composer on the sender's card, big line "Send a message." visible at frame 0. Hands off to typing at frame 60.
2. Build, 60 to 119: "See you at 7?" types; the send press runs 114 to 122. Hands off to send at frame 120 (beat 8).
3. Change, 119 to 131: the composer becomes a sand bubble; the ticks appear at 125. At 126 the big line becomes "Locked on your phone." Hands off to the lock.
4. Lock, 130 to 239: the text becomes nine dots, the padlock closes, and the label "End-to-end encrypted." appears at 150. Held to 239.
5. Travel 1, 240 to 299: one camera leg. The hero stays at the anchor; the sender card drops away and the server card rises. Lines fade out 232 to 239. No cut.
6. Wait, 300 to 449: the server card holds the bubble on its shelf. Big "Their phone is off." at 306; label "The server holds it." at 330; the power symbol on the dark friend's phone at 366, which sits 800 px below the server and shows at the bottom edge. Hands off at 450.
7. Phone on, 450 to 479: the friend's screen lights 450 to 465. Lines fade out 446 to 453. The hero is still.
8. Travel 2, 480 to 539: one camera leg. The server card drops away and the friend's card rises; the hero stays at the anchor.
9. Arrival, 540 to 623: big "It arrives when the phone turns on." at 546; label "Grey ticks: not read yet." at 570. Ticks grey.
10. Silence, 624 to 659: the bed drops 35 dB over 624 to 637 and stays down. The picture holds, with the tap ring at 642 on the bubble.
11. Read, 660 to 671: hit at 660. Ticks turn blue. At 668 the big line becomes "Read." and the label "The ticks turn blue."
12. Hold, 672 to 779: the bed returns over 672 to 705. At 720 the label becomes "Sent, locked, waited, read."
13. End, 780 to 899: at 780 the big line becomes "See you at 7."; the world pushes 2% around the hero. One shot, no loop.

BANNED: purple or blue gradients; glow, bloom, lens flare, neon; floating particles or confetti; a spinning loader, hourglass or progress bar for the wait; a glowing or shielded padlock or keyhole; a cloud, a server rack with blinking lights, or lightning for the server; a signal or wifi icon; a phone device frame with a glow; a sine-wave equaliser; a blinking cursor (the caret is static); everything fading in at once; a fade-and-slide-up on each element; a centred title on a gradient; a centred layout (the big line sits left); text that moves while it is read; a logo fading to black as the only ending; scenes switched on and off by opacity (the world moves, the scenes do not fade); a slow zoom as the only motion; a transition on every cut (the piece has no cut except the hero's morph); three levels of text in one shot (the big line and label are the two; the bubble's message is content).

QA: stills at frames 0, 60, 120, 126, 150, 240, 300, 330, 366, 450, 480, 546, 570, 630, 660, 668, 720, 780 and 899, for both shapes; a contact sheet of 12 frames. The hero's screen position is the same on frames 240 and 300. Ticks are grey on frame 659 and blue on 660. Frame 899 differs from frame 0 (no loop). No text in the top 12.5% or bottom 22% of the 9:16 frame, and none within 96 px of the left edge.

SOUND: synthesize everything in code with the Web Audio API, no samples, no downloads. 120 BPM bed: sine pad on chords that change every bar (Fmaj7, Em7, Dm7, Cmaj7; 2 s each, from frame 0), each note fading in over 0.35 s and out 0.3 s past its bar; no drums; the bed drops 35 dB over frames 624 to 637 and returns over 672 to 705. Hits, each on the frame it belongs to: frame 120, a click at 2000 Hz with a 25 ms decay; frame 660, a chord stab C5, E5, G5, B5 with a C2 sub, 0.5 s decay, every partial at a crest on its sample. Expose window.renderAudio(), returning the AudioBuffer of an OfflineAudioContext(2, 48000 * 30, 48000) that renders the whole score; renderAudio({ only: 'hits' }) and renderAudio({ only: 'bed' }) render one part alone. Seed any noise.

Render contract:
- One self-contained HTML file. Only the libraries named above, pinned to an exact version. No other network requests.
- Fonts: embed the font file in @font-face as a base64 data URI, subset to the glyphs the piece uses, or name a system font with its fallbacks, which renders differently on a machine without it.
- A variant of the copy (another language, a longer name) is chosen by a URL parameter such as ?lang=id, read once at load.
- Text that is only texture, not meant to be read, carries aria-hidden="true". A text box with a line limit carries data-max-lines="N".
- Every frame is a pure function of t in seconds. Expose window.renderAt(t), which draws exactly that frame (CSS or Web Animations API animations may drive motion instead; they are paused and seeked to t).
- With ?t= in the URL, start no requestAnimationFrame loop and no timer. Without it, play in real time for preview: one requestAnimationFrame loop calls renderAt with its timestamp, in seconds since the first frame, wrapped at the length of the piece. That loop is the only clock in the file.
- No Date.now, performance.now, setTimeout or setInterval for motion, and no unseeded Math.random: seed every random from a fixed key.
- If anything loads or bakes asynchronously (fonts, textures, a distance-field bake, video clips, images), set window.__ready = false at once and true when it is done.
- Video clips and images (the user's screenshots, a logo) are files beside the page, the one exception to a single file. A clip is muted, with no autoplay and no loop, and shows through a canvas: renderAt seeks it to its source time, draws that frame and returns a Promise that resolves once it is drawn (engines.md, Video clips locked to t). An image is decoded before the first frame (engines.md, The user's screenshots and logo).
- Size every canvas by window.devicePixelRatio (three.js: renderer.setPixelRatio(window.devicePixelRatio)), so a supersampled render gets more pixels.
- Loops: frames 0 to N-1 are rendered and frame N equals frame 0, so every periodic motion completes whole cycles in the loop.
- Expose window.renderAudio(), returning the AudioBuffer of an OfflineAudioContext(2, 48000 * <seconds>, 48000) that renders the whole score; renderAudio({ only: 'hits' }) and renderAudio({ only: 'bed' }) render one part alone. Seed any noise.
```

**Word count:** the fenced block above, counted with `wc -w` (the block text only, the contract included): see the value recorded below.

**Defaults I picked (no one was there to answer):**
1. Two canvases from one file: 9:16 1080x1920 by default, 1:1 1080x1080 with `?format=1:1`. The brief asks for both; X's safe post is 30 fps at 1080 px or less (delivery.md, X).
2. 30 s, 30 fps, 900 frames, one shot, no loop: the brief says 30 s and the piece ends on an end card (SKILL.md step 1).
3. 120 BPM for the beat grid and the two hits (SKILL.md default is 120 BPM).
4. Engine: plain HTML, CSS and JavaScript, no libraries, rendered by render.mjs (engines.md).
5. Font: the system font "Avenir Next" with fallbacks, not an embedded subset (contract allows either).
6. Colours: all derived. The brief names no brand, and Pigeon has no assets (story.md, the check-in).
7. Text safety: the organic 9:16 bands, render.mjs default 12.5/22/0/13, because the brief says explainer and post, not Reels ad. A Reels ad band (14/35/6/6) is run once as a second check on stills.
8. Sound: on, because the brief asks for a score, with loudness at render.mjs's default -14 LUFS.
9. Morph only, no hard cut, so story.md's "keeps at most one hard cut" is trivially met.
10. The hero bubble (the message) is treated as content, not a third text level (story.md, banned list). Its text sits at 56 px, so it is still measured.
11. The send hit is frame 120 and the read hit is frame 660; both are on beats (numbers.md, The beat grid).
12. The wait runs 10 to 15 s (frames 300 to 449), a power symbol at 366 keeps the frame changing inside the 3 s rule (story.md, Pace).

**First follow-ups (review.md, ready to paste), chosen before the first render:**
- Render stills at frames 0, 24, 48, 72 and 96. Describe each in one sentence as a viewer would. Does that match the shot list? Fix what does not.
- Render each text box's landing frame with --text, once with the copy and once with the longest copy (for example the 1:1 variant), and fix every line it prints.
- Mark every frame where two things move at once, then fix the hierarchy.

**How to render (SKILL.md, Rendering in Claude Code):**

```bash
node <skill>/scripts/render.mjs 'piece.html?format=9:16' --seconds 30 --fps 30 --size 1080x1920 --audio --hits 120,660
node <skill>/scripts/render.mjs 'piece.html?format=1:1' --seconds 30 --fps 30 --size 1080x1080 --audio --hits 120,660
```
