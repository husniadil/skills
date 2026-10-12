# The motion-studio gate: the render suite, the beat-map checks, plugin validation, frontmatter and text checks.
# Run it from anywhere with zsh tests/motion-studio/gate.zsh after npm install here (Playwright 1.63 and its Chromium), or
# with NODE_PATH set to another install. It needs ffmpeg, ruby and the claude CLI on PATH, and the network for the GSAP
# pages' pinned CDN script. Lines ending in FAIL are expected on the pages built to fail: canvas-off, canvas-held,
# canvas-jump, canvas-clock, blank, blank-stills, text-faults, clip-autoplay and audio-peaky-fails.
HERE=${0:A:h}; cd $HERE
REPO=${HERE:h:h}
export NODE_PATH=${NODE_PATH:-$HERE/node_modules}
S=$REPO/plugins/husniadil-skills/skills/motion-studio
R=$S/scripts/render.mjs
mkdir -p out
# the test song, rebuilt each run (byte for byte the same): 128 BPM, first beat at 0.370 s, 30 s
node synth.mjs out/song128.wav 128 0.370 30
# the landscape for text over a picture: macOS's Sonoma wallpaper, converted here and never committed
[[ -f pages/assets/sonoma.png ]] || sips -s format png -Z 2160 '/System/Library/Desktop Pictures/Sonoma.heic' --out pages/assets/sonoma.png >/dev/null 2>&1
node --check $R && echo "node --check: ok"
run() { local name=$1; shift; echo "== $name: $(timeout 300 node $R "$@" 2>&1 | grep -E '^(audio|payoff|text|hits|  frame|loop|  loop|gif|warning|decoded|  decoded|  not|  every|deterministic|OK|FAIL)'  | tr '\n' ' ')"; }
run css pages/css.html --seconds 2 --size 640x360 --loop --gif
run canvas pages/canvas.html --seconds 2 --size 640x360 --loop
run canvas-off pages/canvas-off.html --seconds 2 --size 640x360 --loop
run canvas-held pages/canvas-held.html --seconds 2 --size 640x360 --loop
run canvas-jump pages/canvas-jump.html --seconds 2 --size 640x360 --loop
run canvas-clock pages/canvas-clock.html --seconds 2 --size 640x360
run webgl pages/webgl.html --seconds 2 --size 640x360 --gpu --blur 2 --loop
run aa-ss2 pages/aa.html --seconds 2 --size 640x360 --gpu --ss 2 --loop
run gsap pages/gsap-smooth.html --seconds 2 --size 640x360 --loop
run gsap-fast-start pages/gsap.html --seconds 2 --size 640x360 --loop
run blank pages/blank.html --seconds 2 --size 640x360 --loop
run blank-stills pages/blank.html --seconds 2 --size 640x360 --frames 0,30 --out out/blank-stills
run static pages/static.html --seconds 2 --size 640x360 --loop
run fade pages/fade.html --seconds 2 --size 640x360 --loop
run text-faults pages/text.html --seconds 2 --size 1080x1080 --text
run text-close pages/text-close.html --seconds 1 --size 1080x1080 --frames 0 --text
run text-ink pages/text-ink.html --seconds 1 --size 1080x1080 --frames 0 --text
run text-ink-ui pages/text-ink-ui.html --seconds 1 --size 1080x1920 --frames 0 --text
run text-ink-contrast pages/text-ink-contrast.html --seconds 1 --size 1080x1080 --frames 0 --text
run text-fade pages/text-fade.html --seconds 1 --size 1080x1080 --frames 0 --text
run text-bound pages/text-bound.html --seconds 1 --size 1080x1080 --frames 0 --text
run text-shape pages/text-shape.html --seconds 2 --size 1080x1080 --text
run text-photo-site 'pages/text-photo.html?img=site&scrim=0.65' --seconds 2 --size 1080x1080 --frames 0-59 --text --out out/text-photo-site
[[ -f pages/assets/sonoma.png ]] && run text-photo-landscape 'pages/text-photo.html?img=sonoma&scrim=0.65' --seconds 2 --size 1080x1080 --frames 0-59 --text --out out/text-photo-sonoma || echo '== text-photo-landscape: skipped, no Sonoma.heic on this machine'
run clip pages/clip.html --seconds 4 --size 640x360
echo "== clip-frames: $(node check-clip.mjs out/clip/frames)"
run clip-autoplay pages/clip-autoplay.html --seconds 2 --size 640x360
run dead pages/dead.html --seconds 12 --size 640x360
run text-vertical pages/text-vertical.html --seconds 1 --size 1080x1920 --frames 0 --text
run text-vertical-ads pages/text-vertical.html --seconds 1 --size 1080x1920 --frames 0 --text --safe 14,35,6,6 --out out/text-vertical-ads
run formats-9-16 'pages/formats.html?format=9:16' --seconds 2 --size 1080x1920 --frames 45 --text
run formats-1-1 'pages/formats.html?format=1:1' --seconds 2 --size 1080x1080 --frames 45 --text
run formats-16-9 'pages/formats.html?format=16:9' --seconds 2 --size 1920x1080 --frames 45 --text
run formats-row-on-9-16 'pages/formats.html?format=9:16&layout=row' --seconds 2 --size 1080x1920 --frames 45 --text
run asset pages/asset.html --seconds 2 --size 1080x1080 --frames 0,59 --text
run hits-late pages/hits.html --seconds 2 --size 640x360 --frames 0 --hits 10,30
run range pages/canvas.html --seconds 2 --size 640x360 --frames 0-3
run lang-variant 'pages/lang.html?lang=id' --seconds 2 --size 640x360 --frames 0,30
run audio-peaky-fails pages/audio.html --seconds 4 --size 640x360 --audio --loop --gif
run audio pages/audio.html --seconds 4 --size 640x360 --audio --loop --gif --lufs -20
run audio-only pages/audio.html --seconds 4 --size 640x360 --audio-only --lufs -20
run payoff pages/payoff.html --seconds 4 --size 640x360 --audio --lufs -22
run payoff-hits pages/payoff.html --seconds 4 --size 640x360 --audio --lufs -22 --hits 60 --out out/payoff-hits
run track pages/track.html --seconds 8 --size 640x360 --audio --track out/song128.wav --track-start 1 --hits 120
B=$S/scripts/beats.mjs
node --check $B && node --check $S/scripts/capture.mjs && echo "node --check beats.mjs, capture.mjs: ok"
echo "== beats-on-track (want 128 BPM, first beat 0.3075 s): $(node $B out/track/audio.wav | head -1)"
for spec in "128 0.370 30" "90 0.123 30" "174 0.050 30"; do node synth.mjs out/synth.wav ${=spec}; echo "== beats-synth (want ${spec% *}): $(node $B out/synth.wav | head -1)"; done
for k in noise kick tone; do node clicks.mjs out/clicks.wav $k; echo "== beats-attack-$k (want about 0 ms each): $(node $B out/clicks.wav --bpm 72 | grep '^hits' | grep -oE '[0-9.]+ s' | head -6 | awk '{ t=$1; k=int((t-0.5)/0.8137+0.5); printf "%+.0f ", (t-(0.5+0.8137*k))*1000 }')ms"; done
cd $REPO && claude plugin validate plugins/husniadil-skills 2>&1 | tail -1; claude plugin validate . 2>&1 | tail -1
ruby -ryaml -e 'h = YAML.safe_load(File.read(ARGV[0])[/\A---\n(.*?)\n---/m, 1]); puts "frontmatter ok, desc #{h["description"].length} chars"' $S/SKILL.md
grep -rn '—\|–\|[“”‘’]' $S && echo "found bad chars" || echo "no em/en dashes or curly quotes"
node $HERE/glyph-test.mjs
