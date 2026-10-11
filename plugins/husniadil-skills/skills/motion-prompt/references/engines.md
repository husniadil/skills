# Engines

Name the engine in OUTPUT with its version and numbers ("a Remotion composition, 1920x1080, 30 fps, 450 frames"). An engine the prompt leaves out is the model's choice.

| The piece | Engine | Rendered by |
|---|---|---|
| One idea under ~10 s: type, shapes, UI, a logo | plain HTML with CSS, SVG or Canvas 2D | `render.mjs` |
| Anything 3D: a product, a mascot, a title in chrome | three.js in one HTML file | `render.mjs --gpu` |
| A series, a template, data-driven or longer videos | Remotion | `npx remotion render` |
| HTML and GSAP timelines turned into video | HyperFrames | `npx hyperframes render` |
| Motion inside a live product UI, not a video | GSAP or Motion | the browser |

Facts below were checked on 2026-10-11 against each project's repository or docs. Versions move: check the current one when the pin matters.

## Plain HTML (CSS, SVG, Canvas 2D)

- OUTPUT: `one self-contained HTML file, no libraries, 1080x1080`.
- CSS keyframes and Web Animations API animations need no code for the renderer: `render.mjs` pauses every animation the document has and seeks it to `t`. Canvas drawing goes in `window.renderAt(t)`.
- A web font must load before the first frame: load it with `display=block` and let `render.mjs` wait on `document.fonts.ready`, or set `window.__ready`.

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
- Give the model sizes in one unit ("1 unit = 1 cm"), materials as numbers (roughness, metalness, clearcoat), lights as colour, intensity and position, and a field of view.

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

## HyperFrames (HeyGen)

- HTML, CSS and GSAP timelines in, MP4 out, rendered in headless Chrome and encoded with FFmpeg. Apache 2.0. Needs Node 22+ and FFmpeg. First published to npm on 2026-03-23. Latest on 2026-10-11: v0.8.146.
- Start: `npx hyperframes init my-video`, then `npx hyperframes preview` and `npx hyperframes render`. Claude Code plugin: `claude plugin marketplace add heygen-com/hyperframes`, then `claude plugin install hyperframes@hyperframes`, invoked as `/hyperframes:hyperframes`.
- Composition rules to put in the prompt:
  - exactly one `gsap.timeline({ paused: true })` per composition, registered at `window.__timelines["<id>"]` under the root's `data-composition-id`, after the build finishes; never `tl.play()`
  - timing comes from `data-start`, `data-duration` and `data-track-index` on `class="clip"` elements, and the render length from the root's `data-duration`
  - no `Date.now()`, `performance.now()`, unseeded `Math.random()`, network fetches at render time, hover or scroll state, or `repeat: -1` without a finite root duration
  - never tween `display`, `visibility` or `autoAlpha` on a `.clip`

## Sources

- three.js: `mrdoob/three.js` releases and `examples/jsm/geometries/TextGeometry.js` at r160, r162, r163, r172, r173 and r186; the installation page in `manual/`.
- GSAP: `greensock/GSAP` README, the GSAP Standard "no charge" license, npm.
- Remotion: `remotion-dev/remotion` LICENSE.md and docs (getting started, Claude Code, `spring`, `random`, animating properties, CLI render).
- HyperFrames: `heygen-com/hyperframes` README, LICENSE, `skills/hyperframes-core/SKILL.md` and its determinism rules, `packages/core/src/runtime/player.ts`, npm.
