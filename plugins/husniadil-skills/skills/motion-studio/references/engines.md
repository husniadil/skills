# Engines

Name the engine in OUTPUT with its version and numbers ("a Remotion composition, 1920x1080, 30 fps, 450 frames"). An engine the prompt leaves out is the model's choice.

| The piece | Engine | Rendered by |
|---|---|---|
| A piece under ~30 s, one idea per shot: type, shapes, UI, a logo, a product demo (a 20 s, 600-frame UI film rendered in 43 s in the fourth end-to-end test) | plain HTML with CSS, SVG or Canvas 2D | `render.mjs` |
| Anything 3D: a product, a mascot, a title in chrome, including a ray-marched distance field in a full-screen shader | three.js in one HTML file | `render.mjs --gpu` |
| A series, a template, data-driven or longer videos | Remotion | `npx remotion render` |
| HTML and GSAP timelines turned into video | HyperFrames | `npx hyperframes render` |
| Motion inside a live product UI, not a video | GSAP or Motion | the browser |

Facts below were checked on 2026-10-11 against each project's repository or docs. Versions move: check the current one when the pin matters.

## Plain HTML (CSS, SVG, Canvas 2D)

- OUTPUT: `one self-contained HTML file, no libraries, 1080x1080`.
- CSS keyframes and Web Animations API animations need no code for the renderer: `render.mjs` pauses every animation the document has and seeks it to `t`. Canvas drawing goes in `window.renderAt(t)`.
- A font ships inside the file, as a base64 data URI in `@font-face` subset to the glyphs the piece uses, since the contract allows no other network requests. A system font needs nothing, but renders differently on a machine without it. Either way it must be ready before the first frame: `render.mjs` waits on `document.fonts.ready`, which covers CSS text; Canvas text needs `await document.fonts.load('900 200px "Name"')` before the first `fillText`, behind `window.__ready`.
- Put each element's state before its entrance in the CSS (`opacity: 0`), not only in the code that animates it. A renderAt that touches an element only once its move starts leaves the CSS state on screen until then, and the element flashes before its entrance.
- A number that changes every frame (a counter, a price, a timer) takes `font-variant-numeric: tabular-nums` and a `min-width`: proportional digits change its width as they count, and the line around it shifts.
- Directional motion blur on one element: an SVG `feGaussianBlur` with a separate deviation per axis, `stdDeviation="40 3"` for a horizontal move, applied with `filter: url(#id)` while the element moves and removed when it stops. Widen the filter region to `x="-70%" y="-70%" width="240%" height="240%"`: with the default region (10% each side) a 200 px box blurred at 40 px ended in a hard edge at 79 of 255 grey, and the widened one faded to 5. `render.mjs --blur` blurs the whole frame instead.

### Video clips locked to t

A clip is a layer like any other, and the frame it shows comes from `t`, never from its own clock. Use one where real motion is the proof (a screen recording, the product in someone's hands) for a 3 to 8 s beat, with at most two or three on screen at once, since every visible clip is decoded on every frame. A still image is lighter when it says the same.

- Cut each clip to the part used, without sound (the score or the voice is its own track): `ffmpeg -ss 2 -t 6 -i source.mov -vf "scale=1920:-2" -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart -an clips/demo.mp4`. VP9 in WebM works too: Playwright 1.63's Chromium (153) decoded both.
- The file sits beside the page (`clips/demo.mp4`), which `render.mjs` opens from disk; deliver the folder with the page.
- `<video muted playsinline preload="auto">` with `display: none`, no `autoplay` and no `loop`, and a `<canvas>` where the clip shows. `render.mjs` warns when a video plays on its own clock.
- Move, scale, mask and grade the canvas or a wrapper around it; only `syncClip` sets the video's time.

```js
const RENDER = new URLSearchParams(location.search).has('t');

// A clip on the timeline, drawn into a canvas: source time = from + (t - at) * rate. Hidden before `at`; past `to` (or the
// file's end) it holds its last frame when `hold` is set, and hides otherwise.
const clips = [];
function clip(el, canvas, { at = 0, from = 0, to = Infinity, rate = 1, hold = false } = {}) {
  canvas.width = canvas.clientWidth * devicePixelRatio; canvas.height = canvas.clientHeight * devicePixelRatio;   // sharp under --ss
  clips.push({ el, canvas, ctx: canvas.getContext('2d'), at, from, to, rate, hold });
}
function sourceTime(c, t) {
  if (t < c.at) return null;
  // 1 ms into the frame: a seek to the exact start of a source frame can land a hair before it and show the one before
  const end = Math.min(c.to, c.el.duration), s = c.from + (t - c.at) * c.rate + 0.001;
  return s < end ? s : c.hold ? end - 0.001 : null;
}
// The canvas shows the video's frame once the seek is done: drawn into the page, it is on the next screenshot.
// Preview: let the video play and draw its current frame; seek only when it drifts more than 0.2 s from the timeline.
function syncClip(c, t) {
  const s = sourceTime(c, t), v = c.el, draw = () => c.ctx.drawImage(v, 0, 0, c.canvas.width, c.canvas.height);
  c.canvas.style.visibility = s === null ? 'hidden' : 'visible';
  if (!RENDER) {
    if (s === null || (c.hold && s >= Math.min(c.to, v.duration) - 0.002)) v.pause();
    else { v.playbackRate = c.rate; if (v.paused) v.play(); }
    if (s !== null && Math.abs(v.currentTime - s) > 0.2) v.currentTime = s;
    if (s !== null) draw();
    return;
  }
  if (s === null) return;
  if (Math.abs(v.currentTime - s) < 1e-6 && !v.seeking) { draw(); return; }
  return new Promise((res) => { v.addEventListener('seeked', () => { draw(); res(); }, { once: true }); v.currentTime = s; });
}

clip(document.getElementById('demo'), document.getElementById('demo-canvas'), { at: 4, from: 1.5, to: 6, hold: true });

// render.mjs waits until every clip has its first frame decoded
window.__ready = false;
Promise.all(clips.map((c) => c.el.readyState >= 2 || new Promise((res) => c.el.addEventListener('loadeddata', res, { once: true }))))
  .then(() => { window.__ready = true; });

window.renderAt = (t) => {
  // ...set everything else from t...
  return Promise.all(clips.map((c) => syncClip(c, t)));
};
```

`render.mjs` awaits the Promise that `renderAt` returns. Tested on a page with two clips whose frames carry their own index as a bar code (H.264 at 24 fps from 1 s with a hold, VP9 at 25 fps at half speed): in 16 renders of 120 frames, 12 of them three at a time and `--ss 2` and `--gpu` among the rest, every frame showed the source frame its time maps to. Without the 1 ms, every fifth frame of the 24 fps clip showed the frame before. The `<video>` element shown on screen itself needed two animation frames after `seeked`, and even so its first frame on screen showed a stale frame once in 29 renders; drawn into a canvas, the frame is part of the page's own paint and needs no wait. 120 frames at 640x360 took 13 s that way (18.6 s with the video element and its wait), and 42 s with `--gpu`, where the video element took 18.5 s. In the preview the clips stayed within 0.15 s of the timeline. Under `--blur` a frame averages the source frames its sub-frames fall on, which is the clip's own motion blur.

### The user's screenshots and logo

A product piece can show the product itself. Only the user's own product, or one they may show: ask before capturing anything else.

- `scripts/capture.mjs` screenshots a page, one element of it or the logo, at twice the pixel density so a crop scaled up stays sharp: `node ${CLAUDE_SKILL_DIR}/scripts/capture.mjs https://example.com assets/home.png --selector header --hide '[role="dialog"]'`. `--full` takes the whole scrolling page and `--dark` the dark scheme. Tested on the user's own site: the page, its header, and the page again with its cookie dialog hidden.
- The images sit beside the page (`assets/home.png`), like video clips, or go in as data URIs. Decode each before the first frame: `window.__ready = false; img.decode().then(() => { window.__ready = true; });`.
- Crop by moving the image inside a card with `overflow: hidden`, and scale it until the labels the viewer must read reach 36 px at 1080 wide: their height in the screenshot's pixels, times the scale, divided by the capture's density of 2.
- Text inside an image is pixels: `--text` doesn't read it. DOM text over the image is measured against it for contrast: white text laid over the screenshot of a white page read 1.0:1.
- Sample the brand's colours from the screenshots, and name them as the source in LOOK.
- Show real screens, or rebuild them from the product's own components (numbers.md, A product action). A screen drawn from imagination is never presented as the product.

## three.js

- OUTPUT: `one self-contained HTML file, three.js 0.186.1 via a jsDelivr importmap, 1080x1080`. Latest on 2026-10-11: r186, npm `0.186.1`.

```html
<script type="importmap">{"imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"
}}</script>
```

- `window.renderAt(t)` sets every position, rotation, uniform and camera value from `t`, then calls `renderer.render(scene, camera)`. Start `renderer.setAnimationLoop` only when the URL has no `?t=`.
- Render with `--gpu`, and with `--blur 4` to `--blur 8` for motion blur. Shaders, bloom passes and grain take `t` or the frame index as input, never a clock.
- **`TextGeometry` changed its extrusion parameter.** r160 to r162 read `height` and ignore `depth`, so `depth` alone extrudes at the default 50. r163 renamed it to `depth` and kept `height` as a deprecated alias. r173 removed the alias: from then on, `height` is ignored without a warning and the text extrudes at 50. Name the parameter that matches the pinned version (checked in the r160, r162, r163, r172, r173 and r186 sources).
- Give the model sizes in one unit ("1 unit = 1 cm"), materials as numbers (roughness, metalness, clearcoat), lights as colour, intensity and position, and a field of view. Starting values are in numbers.md, 3D look.

### Liquid that becomes a shape (ray-marched)

How the source's chrome title loop did it, after ten follow-ups:

- One signed-distance field for everything that should merge (blob, droplets, letters), joined with a smooth minimum: k 0.35 while the blob is whole, falling to 0.1 as the droplets part.
- Letters as distance fields, extruded as a rounded box, so a letter can merge with a droplet. The source baked the word into one 2048 x 512 signed-distance texture, then gave each glyph its own distance so the letters could form one at a time. An RGBA texture holds four glyphs, so a longer word needs an atlas with one cell per glyph (the second end-to-end test used 1792 x 256, seven 256 px cells) or a second texture. The bake below draws each glyph with Canvas 2D `fillText`, runs an exact Euclidean distance transform on the inside and the outside, stores outside minus inside, and is uploaded once before `window.__ready`.
- A droplet becomes its letter by revealing the letter inside a sphere that grows from the droplet (smooth maximum, k 0.05, ease-out, 0.4 s) while the droplet shrinks into it. Mixing the two distances (`mix(sphere, letter)`) passes through flat coins.
- New droplets grow from a negative radius (-0.4), so their pull on the blob fades in. A droplet that appears at full size pops a bump onto the blob.
- Squash and stretch the whole field about the point where it touches the floor. Scaling the sphere centres lifts everything off the floor.
- Melt in the reverse order of the pour: regrow the droplets, retract the letters into them, then grow the blob. A melt built from offset unions erases the letter halfway.
- A surface ripple of 0.008 at frequency 3.2 keeps a liquid from reading as crumpled foil.
- A ray-marched surface has no anti-aliasing of its own: size the canvas by devicePixelRatio and render with `--gpu --ss 2 --blur 4`.

#### A glyph atlas bake

One cell per glyph, the space left out: its width comes from `advances[' ']`. Keep `spread` pixels of margin around each glyph so linear filtering never reads the next cell. Upload `data` in three.js as `new THREE.DataTexture(data, width, height, THREE.RedFormat)` with linear filtering and `needsUpdate = true`.

```js
const INF = 1e20;
// Felzenszwalb and Huttenlocher: exact squared distance along one line, f is 0 on the feature and INF elsewhere
function edt1d(f, n, d, v, z) {
  let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s;
    while ((s = (f[q] + q * q - f[v[k]] - v[k] * v[k]) / (2 * q - 2 * v[k])) <= z[k]) k--;
    v[++k] = q; z[k] = s; z[k + 1] = INF;
  }
  for (let q = 0, j = 0; q < n; q++) { while (z[j + 1] < q) j++; d[q] = (q - v[j]) ** 2 + f[v[j]]; }
}
function edt(g, w, h) {   // in place: g becomes the squared distance to the nearest 0
  const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = g[y * w + x]; edt1d(f, h, d, v, z); for (let y = 0; y < h; y++) g[y * w + x] = d[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = g[y * w + x]; edt1d(f, w, d, v, z); for (let x = 0; x < w; x++) g[y * w + x] = d[x]; }
}
// R8 atlas, row 0 at the top: value 0.5 + d / (2 * spread), d in pixels, negative inside the glyph
async function bakeGlyphAtlas(chars, font, cell = 256, spread = 24) {
  await document.fonts.load(font);   // an @font-face font is not loaded until something asks for it
  const cv = document.createElement('canvas'); cv.width = cv.height = cell;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.font = font; g.textAlign = 'center'; g.fillStyle = '#fff';
  const n = chars.length, data = new Uint8Array(n * cell * cell), toIn = new Float64Array(cell * cell), toOut = new Float64Array(cell * cell);
  const advances = { ' ': g.measureText(' ').width };
  for (let c = 0; c < n; c++) {
    g.clearRect(0, 0, cell, cell); g.fillText(chars[c], cell / 2, cell * 0.75);
    advances[chars[c]] = g.measureText(chars[c]).width;
    const a = g.getImageData(0, 0, cell, cell).data;
    for (let i = 0; i < cell * cell; i++) { const inside = a[i * 4 + 3] > 127; toIn[i] = inside ? 0 : INF; toOut[i] = inside ? INF : 0; }
    edt(toIn, cell, cell); edt(toOut, cell, cell);
    for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) {
      const i = y * cell + x, d = Math.sqrt(toIn[i]) - Math.sqrt(toOut[i]);
      data[y * n * cell + c * cell + x] = Math.max(0, Math.min(255, Math.round(255 * (0.5 + d / (2 * spread)))));
    }
  }
  return { data, width: n * cell, height: cell, cell, spread, advances };
}
```

In the shader, a glyph's cell spans 0 to 1 with y up. Lay the word out from the advances in cell widths, the space included: with `pen` at the glyph's left edge, its cell starts at `pen + advance / 2 - 0.5`, since `fillText` centred it, and `pen` moves on by `advance`.

```glsl
uniform sampler2D atlas;   // the R8 texture above
uniform float CELLS, CELL, SPREAD;   // glyph count, cell and spread in pixels
float glyph2d(vec2 p, float i) {   // in cell widths, negative inside
  vec2 q = clamp(p, 0.0, 1.0);
  float d = (texture(atlas, vec2((i + q.x) / CELLS, 1.0 - q.y)).r - 0.5) * 2.0 * SPREAD / CELL;
  return d + length(p - q);   // outside the cell, add the distance to it
}
float glyph3d(vec3 p, float i, float depth, float r) {   // extruded, edges rounded by r
  vec2 w = vec2(glyph2d(p.xy, i) + r, abs(p.z) - 0.5 * depth + r);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - r;
}
```

Past `spread` pixels the stored distance stops growing, so far from a glyph it reads short: a ray march stays safe and takes more steps there.

## GSAP in a plain HTML piece

- 3.15.0 on 2026-10-11, pinned at `https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js`.
- License: free for commercial use, including every bonus plugin (SplitText, MorphSVG and the rest). The one prohibited use is building a no-code visual animation tool that competes with Webflow's.
- For `render.mjs`: put every tween in one `gsap.timeline({ paused: true })` and expose `window.renderAt = (t) => tl.totalTime(t, true)`. This is how HyperFrames seeks GSAP per frame; a tween outside the paused timeline plays on its own clock.

## Remotion

- Video as React components, rendered frame-exact by its own CLI. Latest on 2026-10-11: v4.0.534.
- License: free for individuals, for-profit organisations of up to 3 employees, non-profits, and evaluation without commercial use. Every other organisation needs a Company License. The license file announces a change in Remotion 5.0.
- Start: `npx create-video@latest`, then `npx remotion skills add` in the project to install its Agent Skills, then `npm run dev` for Remotion Studio. Render: `npx remotion render <entry-point> <composition-id> <output>`.
- OUTPUT: `a Remotion composition, 1920x1080, 30 fps, 450 frames`.
- Rules to put in the prompt: animate everything from `useCurrentFrame()` with `interpolate()` and `spring()`; CSS transitions and CSS or Tailwind animations do not render correctly; use `random(seed)` from `remotion`, never `Math.random()`. `spring()` defaults to zeta 0.5, so give it `config: { damping, stiffness, mass }` from numbers.md when the move must not bounce.
- Inside a `<Sequence from={120}>`, `useCurrentFrame()` is shifted by `from`: local frame 30 is global frame 150. Write every frame number in the brief as global and say so, so a note about frame 150 means one frame.
- Review renders: `npx remotion still <entry-point> <composition-id> out/f60.png --frame=60` for one frame, and `npx remotion render <entry-point> <composition-id> out/cut.mp4 --frames=90-149` for the frames around a cut (an inclusive range, Remotion 4.0.502 and later).
- Audio: its render mixes the sound as it is, with no loudness target or true-peak limit. Render the picture with `--muted` and the sound with `--codec=wav`, then master the two together (narration.md, Mastering when the engine renders the audio).

## HyperFrames (HeyGen)

- HTML, CSS and GSAP timelines in, MP4 out, rendered in headless Chrome and encoded with FFmpeg. Apache 2.0. Needs Node 22+ and FFmpeg. First published to npm on 2026-03-23. Latest on 2026-10-11: v0.8.146.
- Start: `npx hyperframes init my-video`, then `npx hyperframes preview` and `npx hyperframes render`. Claude Code plugin: `claude plugin marketplace add heygen-com/hyperframes`, then `claude plugin install hyperframes@hyperframes`, invoked as `/hyperframes:hyperframes`.
- Composition rules to put in the prompt:
  - exactly one `gsap.timeline({ paused: true })` per composition, registered at `window.__timelines["<id>"]` under the root's `data-composition-id`, after the build finishes; never `tl.play()`
  - timing comes from `data-start`, `data-duration` and `data-track-index` on `class="clip"` elements, and the render length from the root's `data-duration`
  - no `Date.now()`, `performance.now()`, unseeded `Math.random()`, network fetches at render time, hover or scroll state, or `repeat: -1` without a finite root duration
  - never tween `display`, `visibility` or `autoAlpha` on a `.clip`

## Sources

- Plain HTML: the initial state in the CSS, tabular numbers, the directional blur and its filter region, and video clips seeked from the timeline come from bang-motion v1.19.0 by Bang Tutorial (MIT, `references/techniques.md` sections 2, 9b and 10, `assets/starter-opener.html`). The clip code here is this skill's own, and the numbers are from this skill's tests. Capturing the user's own site and showing only real screens come from animate v0.4.1 by cth9191 (MIT, `SKILL.md`, Assets, and `tools/capture.mjs`, read and not run); `capture.mjs` here is this skill's own.
- three.js: `mrdoob/three.js` releases and `examples/jsm/geometries/TextGeometry.js` at r160, r162, r163, r172, r173 and r186; the installation page in `manual/`.
- GSAP: `greensock/GSAP` README, the GSAP Standard "no charge" license, npm.
- Remotion: `remotion-dev/remotion` LICENSE.md and docs (getting started, Claude Code, `spring`, `random`, animating properties, CLI render).
- HyperFrames: `heygen-com/hyperframes` README, LICENSE, `skills/hyperframes-core/SKILL.md` and its determinism rules, `packages/core/src/runtime/player.ts`, npm.
