// Tests the glyph atlas bake and the GLSL decode exactly as engines.md ships them.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const HERE = path.dirname(new URL(import.meta.url).pathname), OUT = path.join(HERE, 'out', 'glyph');
const ENGINES = path.join(HERE, '..', '..', 'plugins', 'husniadil-skills', 'skills', 'motion-studio', 'references', 'engines.md');
const require = createRequire(path.join(HERE, 'package.json'));
const { chromium } = require('playwright');
fs.mkdirSync(OUT, { recursive: true });

const md = fs.readFileSync(ENGINES, 'utf8');
const section = md.slice(md.indexOf('#### A glyph atlas bake'));
const js = section.match(/```js\n([\s\S]*?)```/)[1];
const glsl = section.match(/```glsl\n([\s\S]*?)```/)[1];

// 1. the distance transform against brute force
const { edt } = new Function(js + '; return { edt };')();
let worst = 0;
for (let trial = 0; trial < 30; trial++) {
  const w = 20 + trial, h = 13 + (trial * 7) % 25, g = new Float64Array(w * h), pts = [];
  for (let i = 0; i < w * h; i++) { const on = Math.random() < 0.03; g[i] = on ? 0 : 1e20; if (on) pts.push([i % w, (i / w) | 0]); }
  if (!pts.length) { g[0] = 0; pts.push([0, 0]); }
  const want = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) want[y * w + x] = Math.min(...pts.map(([px, py]) => (px - x) ** 2 + (py - y) ** 2));
  edt(g, w, h);
  for (let i = 0; i < w * h; i++) worst = Math.max(worst, Math.abs(g[i] - want[i]));
}
console.log(`edt vs brute force, 30 grids: largest error ${worst}`);

// 2. the bake in Chromium with a data-URI font, and 3. the GLSL decode drawn in WebGL2
const font = fs.readFileSync('/System/Library/Fonts/Supplemental/Arial Black.ttf').toString('base64');
const page = `<!doctype html><meta charset="utf-8">
<style>@font-face{font-family:"Embedded";src:url(data:font/ttf;base64,${font}) format("truetype");font-weight:900}html,body{margin:0;background:#000}</style>
<canvas id="c" width="1200" height="300"></canvas>
<script>
${js}
window.run = async () => {
  const word = 'OPUS 5.5', chars = [...new Set(word.replace(/ /g, ''))].join('');
  const a = await bakeGlyphAtlas(chars, '900 160px "Embedded"');
  const fallback = (() => { const g = document.createElement('canvas').getContext('2d'); g.font = '900 160px monospace'; return g.measureText('O').width; })();
  const cellOf = (ch) => chars.indexOf(ch), at = (c, x, y) => a.data[y * a.width + c * a.cell + x];
  // O: the hole at the centre is outside (> 128), the stroke left of it inside (< 128)
  const o = cellOf('O'), row = 192 - 58;
  let ring = 255; for (let x = 60; x < 128; x++) ring = Math.min(ring, at(o, x, row));
  const stats = { chars, fontLoaded: document.fonts.check('900 160px "Embedded"'), advanceO: a.advances.O, fallbackO: fallback, space: a.advances[' '],
    holeO: at(o, 128, row), ringMinO: ring, corner: at(o, 0, 0), width: a.width };
  // draw the word through glyph2d
  const cv = document.getElementById('c'), gl = cv.getContext('webgl2');
  const vs = '#version 300 es\\nin vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  const fs = '#version 300 es\\nprecision highp float;\\n' + ${JSON.stringify(glsl)} + \`
uniform float X[8], I[8]; uniform int N; out vec4 o;
void main(){
  vec2 p = gl_FragCoord.xy / 160.0;   // 1 cell width = 160 px on screen
  float d = 1e9;
  for (int k = 0; k < 8; k++) { if (k >= N) break; d = min(d, glyph2d(p - vec2(X[k], 0.3), I[k])); }
  float band = 0.5 + 0.5 * cos(d * 120.0);
  o = d < 0.0 ? vec4(1.0) : vec4(vec3(0.15 * band * exp(-6.0 * d)), 1.0);
}\`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const l = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, a.width, a.height, 0, gl.RED, gl.UNSIGNED_BYTE, a.data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1f(gl.getUniformLocation(pr, 'CELLS'), chars.length); gl.uniform1f(gl.getUniformLocation(pr, 'CELL'), a.cell); gl.uniform1f(gl.getUniformLocation(pr, 'SPREAD'), a.spread);
  // lay the word out from the advances, the space included: glyph k's cell starts half a cell left of its centre
  const X = [], I = []; let pen = 0.2;
  for (const ch of word) { const adv = a.advances[ch] / a.cell; if (ch !== ' ') { X.push(pen + adv / 2 - 0.5); I.push(cellOf(ch)); } pen += adv; }
  gl.uniform1fv(gl.getUniformLocation(pr, 'X'), X); gl.uniform1fv(gl.getUniformLocation(pr, 'I'), I); gl.uniform1i(gl.getUniformLocation(pr, 'N'), X.length);
  gl.viewport(0, 0, cv.width, cv.height); gl.drawArrays(gl.TRIANGLES, 0, 3);
  return stats;
};
</script>`;
fs.writeFileSync(path.join(OUT, 'page.html'), page);
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1200, height: 300 } });
const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await p.goto('file://' + path.join(OUT, 'page.html'));
const t0 = Date.now();
const stats = await p.evaluate(() => window.run());
console.log(`bake + draw: ${Date.now() - t0} ms`);
console.log(JSON.stringify(stats));
await p.screenshot({ path: path.join(OUT, 'word.png') });
const pass = worst === 0 && stats.fontLoaded && stats.advanceO !== stats.fallbackO && stats.holeO > 128 && stats.ringMinO < 128 && !errors.length;
console.log(errors.length ? 'page errors: ' + errors.join(' | ') : 'no page errors');
console.log(pass ? `glyph test: OK (look at ${path.join(OUT, 'word.png')})` : 'glyph test: FAIL');
await browser.close();
process.exit(pass ? 0 : 1);
