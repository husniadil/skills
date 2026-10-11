#!/usr/bin/env node
// Deterministic renderer for a code-drawn animation in one HTML file (DOM/CSS, SVG, Canvas 2D or WebGL).
// The page is opened with ?t=0 and frozen at t = i / fps for every frame: window.renderAt(t) is called when the page
// defines it, and every CSS / Web Animations API animation is paused and seeked to t. Each frame is a screenshot.
//
// usage: node render.mjs <page.html[?query] | url> --seconds S [--fps 30] [--size 1080x1080] [--out dir]
//          [--frames 0,24,48]   stills only: those frames (or a range, 157-159) and a labelled sheet, no video
//          [--blur N]           N sub-frames per frame over half a frame (a 180-degree shutter), averaged in linear light
//          [--ss N]             supersampling: render at N times the device pixel ratio and average each N x N block in
//                               linear light (the page sizes its canvas by window.devicePixelRatio)
//          [--gpu]              render WebGL on the real GPU and say which renderer ran
//          [--audio]            render the page's window.renderAudio() (an OfflineAudioContext's AudioBuffer), bring it to
//                               -14 LUFS (--lufs) under a -2 dBTP true-peak limiter, mux it, and measure the decoded MP4
//          [--audio-only]       the same audio pass over frames already rendered: iterate the mix without re-rendering
//          [--loop]             check that the motion closes: frame N matches frame 0 and the seam N-1 -> 0 is a normal step
//          [--gif] [--gif-fps 24]
//          [--text]             measure the DOM text on every frame: size, edge margin, overflow, line limits, overlaps,
//                               contrast against the background under it, and on a 9:16 frame the platform's UI bands
//          [--safe 12.5,22,0,13] the platform UI bands for --text, top, bottom, left and right in % of the frame
//          [--hits 158,178]     render the score's hits and bed alone and report each hit's offset and level
//          [--track song.mp3 --track-start 12]  mix the user's song, from 12 s in, under renderAudio() (the sound
//                               effects) before the loudness pass; --hits then measures each hit over the song
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';

const CEILING_DBTP = -2, MAX_DECODED_DBTP = -1;   // AAC adds 0.4 to 3 dB of true peak: limit at -2, then check the decoded MP4 against -1
const X_GIF = { bytes: 15e6, mobileBytes: 5e6, frames: 350, width: 1280, height: 1080 };   // docs.x.com media best practices, help.x.com
const USAGE = 'usage: node render.mjs <page.html[?query] | url> --seconds S [--fps 30] [--size 1080x1080] [--out dir] [--frames 0,24,48] [--blur N] [--ss N] [--gpu] [--audio | --audio-only] [--lufs -14] [--loop] [--gif] [--gif-fps 24] [--text] [--safe 12.5,22,0,13] [--hits 158,178] [--track song.mp3 --track-start 0]';

const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : dflt; };
const flag = (name) => argv.includes('--' + name);
const die = (msg, code = 1) => { console.error(msg); process.exit(code); };

const target = argv[0];
if (!target || target.startsWith('--')) die(USAGE, 2);
const seconds = Number(opt('seconds'));
const fps = Number(opt('fps', '30'));
const [W, H] = opt('size', '1080x1080').split('x').map(Number);
const blur = Math.max(1, parseInt(opt('blur', '1'), 10));
const SS = Math.max(1, parseInt(opt('ss', '1'), 10));
const gifFps = Number(opt('gif-fps', '24'));
// a frame list: 0,24,48 or a range 157-159, or both
const frameList = (s) => s.split(',').flatMap((p) => { const [a, b] = p.split('-').map((v) => parseInt(v, 10)); return b >= a ? Array.from({ length: b - a + 1 }, (_, k) => a + k) : [a]; });
const stills = opt('frames') ? frameList(opt('frames')) : null;
const hits = opt('hits') ? frameList(opt('hits')) : null;
const audioOnly = flag('audio-only'), withAudio = audioOnly || flag('audio');
const LUFS = Number(opt('lufs', '-14'));   // -14 suits a score with a bed; a few hits alone may want less (sound.md)
const TRACK = opt('track'), trackStart = Number(opt('track-start', '0'));
if (!(seconds > 0) || !(fps > 0) || !(W > 0) || !(H > 0)) die(USAGE, 2);
if (!(LUFS >= -30 && LUFS <= -9)) die('--lufs takes a target between -30 and -9', 2);
if (stills && withAudio) die('--frames renders stills only: drop --audio', 2);
if (TRACK && !withAudio && !hits) die('--track mixes a song under renderAudio(): use it with --audio, --audio-only or --hits', 2);
if (TRACK && !fs.existsSync(TRACK)) die(`not found: ${TRACK}`);
if (!(trackStart >= 0)) die('--track-start takes the seconds into the song where the piece begins', 2);
if (stills && flag('loop')) die('--frames renders stills only: --loop needs the full render', 2);
if (W % 2 || H % 2) die(`--size ${W}x${H}: H.264 in yuv420p needs an even width and height`, 2);
const N = Math.round(seconds * fps);
if (Math.abs(N - seconds * fps) > 1e-6) console.warn(`warning: ${seconds}s x ${fps}fps is not a whole number of frames; rendering ${N}`);
if (stills && stills.some((f) => !(f >= 0 && f <= N))) die(`--frames must be between 0 and ${N}`, 2);
if (hits && hits.some((f) => !(f >= 0 && f < N))) die(`--hits must be frames between 0 and ${N - 1}`, 2);

// --- requirements: say what is missing and how to install it, never install it
function loadPlaywright() {
  const tries = [path.join(process.cwd(), 'noop.js'), import.meta.url];
  const npmRoot = spawnSync('npm', ['root', '-g'], { encoding: 'utf8', shell: process.platform === 'win32' });
  if (npmRoot.status === 0) tries.push(path.join(npmRoot.stdout.trim(), 'noop.js'));
  for (const from of tries) { try { return createRequire(from)('playwright'); } catch {} }
  return null;
}
const pw = loadPlaywright();
const missing = [];
if (!pw) missing.push('Playwright: npm i -D playwright && npx playwright install chromium');
for (const tool of ['ffmpeg', 'ffprobe']) {
  if (spawnSync(tool, ['-version'], { stdio: 'ignore' }).status !== 0) {
    missing.push(`${tool}: brew install ffmpeg (macOS), sudo apt-get install ffmpeg (Debian/Ubuntu), winget install Gyan.FFmpeg (Windows)`);
  }
}
if (missing.length) die('missing:\n  ' + [...new Set(missing)].join('\n  '));

// --- PNG in and out, so sub-frames can be averaged and frames compared without another dependency
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (buf) => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function decodePNG(buf) {
  let pos = 8, w, h, depth, type, interlace; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), name = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (name === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; type = data[9]; interlace = data[12]; }
    else if (name === 'IDAT') idat.push(data);
    else if (name === 'IEND') break;
    pos += 12 + len;
  }
  if (depth !== 8 || (type !== 2 && type !== 6) || interlace) throw new Error(`unsupported PNG: depth ${depth}, colour type ${type}, interlace ${interlace}`);
  const ch = type === 6 ? 4 : 3, stride = w * ch, raw = zlib.inflateSync(Buffer.concat(idat)), out = new Uint8Array(w * h * 4);
  let prev = new Uint8Array(stride), cur = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const base = y * (stride + 1), f = raw[base];
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0, b = prev[i], c = i >= ch ? prev[i - ch] : 0;
      let v = raw[base + 1 + i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[i] = v & 255;
    }
    for (let x = 0; x < w; x++) { const o = (y * w + x) * 4, s = x * ch; out[o] = cur[s]; out[o + 1] = cur[s + 1]; out[o + 2] = cur[s + 2]; out[o + 3] = ch === 4 ? cur[s + 3] : 255; }
    [prev, cur] = [cur, prev];
  }
  return out;
}
function encodePNG(rgba, w, h) {
  const stride = w * 4, raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    const o = y * (stride + 1), s = y * stride;
    raw[o] = 1;   // the Sub filter: cheap, and far smaller than no filter on smooth images
    for (let i = 0; i < stride; i++) raw[o + 1 + i] = (rgba[s + i] - (i >= 4 ? rgba[s + i - 4] : 0)) & 255;
  }
  const chunk = (name, data) => {
    const body = Buffer.concat([Buffer.from(name, 'ascii'), data]), len = Buffer.alloc(4), crc = Buffer.alloc(4);
    len.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 3 })), chunk('IEND', Buffer.alloc(0))]);
}
// mean absolute difference over R, G and B, in 0-255 sRGB steps
function meanDiff(a, b) { let s = 0; for (let i = 0; i < a.length; i += 4) s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); return s / (a.length / 4 * 3); }
// every pixel within 2 steps of the first one: a frame that shows only the page background
function isFlat(a) { for (let i = 4; i < a.length; i += 4) if (Math.abs(a[i] - a[0]) > 2 || Math.abs(a[i + 1] - a[1]) > 2 || Math.abs(a[i + 2] - a[2]) > 2) return false; return true; }
const S2L = new Float32Array(256).map((_, i) => { const c = i / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
const L2S = (l) => { const c = l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055; return Math.max(0, Math.min(255, Math.round(c * 255))); };

// --- the page
const isUrl = /^https?:\/\//.test(target);
// a file may carry a query for a variant of the piece (piece.html?lang=id), passed on to the page
const [pageFile, query = ''] = isUrl ? [target] : target.split(/\?(.*)/s);
if (!isUrl && !fs.existsSync(pageFile)) die(`not found: ${pageFile}`);
const pageUrl = new URL(isUrl ? target : pathToFileURL(path.resolve(pageFile)).href + (query ? '?' + query : ''));
pageUrl.searchParams.set('t', '0');   // the contract: with ?t= the page starts no requestAnimationFrame loop of its own
const variant = query.replace(/(^|&)t=[^&]*/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
const name = isUrl ? 'render' : path.basename(pageFile, path.extname(pageFile)) + (variant ? '-' + variant : '');
const OUT = path.resolve(opt('out', path.join('out', name)));
const FRAMES = path.join(OUT, stills ? 'stills' : 'frames');
fs.mkdirSync(FRAMES, { recursive: true });
if (audioOnly) { const have = fs.readdirSync(FRAMES).filter((f) => /^\d{5}\.png$/.test(f)).length; if (have !== N) die(`--audio-only: ${FRAMES} holds ${have} frames, not ${N}: render the frames first`); }
else for (const f of fs.readdirSync(FRAMES)) if (/^\d{5}\.png$/.test(f)) fs.unlinkSync(path.join(FRAMES, f));   // no stale tail frames

const GPU_ARGS = process.platform === 'win32' ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
  : process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']
  : ['--use-angle=vulkan', '--enable-features=Vulkan', '--enable-gpu', '--ignore-gpu-blocklist'];
const browser = await pw.chromium.launch(flag('gpu') ? { channel: 'chromium', args: GPU_ARGS } : {});
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SS });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(pageUrl.href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// a page that loads or bakes anything asynchronously sets window.__ready = false at once and true when it is done
await page.waitForFunction(() => !('__ready' in window) || window.__ready === true, null, { timeout: 60000 });
const has = await page.evaluate(() => ({ renderAt: typeof window.renderAt === 'function', animations: document.getAnimations().length, audio: typeof window.renderAudio === 'function' }));
if (!has.renderAt && !has.animations) console.warn('warning: the page has no window.renderAt and no CSS or Web Animations API animation: nothing will move');
if (withAudio && !has.audio) die('--audio: the page defines no window.renderAudio()');
if (flag('gpu')) {
  const renderer = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    if (!gl) return 'no WebGL';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  });
  if (/swiftshader|llvmpipe|software|basic render|no webgl/i.test(renderer)) console.warn(`warning: WebGL is on a software renderer (${renderer}): frames are correct, only slower`);
  else console.log(`gpu: ${renderer}`);
}

const seek = (t) => page.evaluate(async (tt) => {
  // await only a real Promise: a GSAP timeline is a thenable that settles when it completes, which a paused one never does
  if (typeof window.renderAt === 'function') { const r = window.renderAt(tt); if (r instanceof Promise) await r; }
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = tt * 1000; }
}, t);
const shot = async (t) => { await seek(t); return page.screenshot({ type: 'png' }); };
// one output frame: a single screenshot, or `blur` sub-frames spread over the open half of the frame and SS x SS screenshot
// pixels per output pixel, all averaged in linear light
async function frame(i) {
  if (blur === 1 && SS === 1) { const png = await shot(i / fps); return { png, rgba: decodePNG(png) }; }
  const acc = new Float32Array(W * H * 4), sw = W * SS, n = blur * SS * SS;
  for (let j = 0; j < blur; j++) {
    const d = decodePNG(await shot(blur === 1 ? i / fps : (i + ((j + 0.5) / blur) * 0.5) / fps));
    for (let k = 0; k < d.length; k += 4) {
      const p = k >> 2, o = (((p / sw) | 0) / SS | 0) * W * 4 + ((p % sw) / SS | 0) * 4;
      acc[o] += S2L[d[k]]; acc[o + 1] += S2L[d[k + 1]]; acc[o + 2] += S2L[d[k + 2]]; acc[o + 3] += d[k + 3];
    }
  }
  const rgba = new Uint8Array(acc.length);
  for (let k = 0; k < acc.length; k += 4) { rgba[k] = L2S(acc[k] / n); rgba[k + 1] = L2S(acc[k + 1] / n); rgba[k + 2] = L2S(acc[k + 2] / n); rgba[k + 3] = Math.round(acc[k + 3] / n); }
  return { png: encodePNG(rgba, W, H), rgba };
}
const file = (i) => path.join(FRAMES, `${String(i).padStart(5, '0')}.png`);
const failures = [];

// --- text (--text): DOM text measured on every rendered frame; text drawn on a canvas or in WebGL is not seen here
const textCheck = flag('text');
// the bands a platform's UI covers (top, bottom, left, right, % of the frame): by default on a vertical 9:16 frame only,
// animate's numbers for an organic post; a Reels ad wants Meta's 14,35,6,6 (delivery.md, Under the platform's UI)
const UI = opt('safe') ? opt('safe').split(',').map(Number) : H / W > 1.7 ? [12.5, 22, 0, 13] : null;
if (UI && (UI.length !== 4 || UI.some((v) => !(v >= 0 && v < 50)))) die('--safe takes four percentages under 50: top,bottom,left,right', 2);
// one entry per visible text node: its rendered font size, its line boxes, and the block box it sits in. A line counts
// when at least 3 of 5 points along it show the text: not clipped, not off the page, not under an opaque element.
const measureText = () => {
  // hit-testing skips pointer-events: none, which changes nothing on screen: let it see every element
  if (!document.getElementById('render-mjs-hits')) { const st = document.createElement('style'); st.id = 'render-mjs-hits'; st.textContent = '*{pointer-events:auto!important}'; document.head.append(st); }
  const opaque = (e) => { const s = getComputedStyle(e), m = s.backgroundColor.match(/[\d.]+/g), a = m ? (m.length > 3 ? Number(m[3]) : 1) : 0; return a > 0.5 || s.backgroundImage !== 'none' || /^(img|canvas|svg|video)$/i.test(e.tagName); };
  const shows = (el, x, y) => { for (const e of document.elementsFromPoint(x, y)) { if (e === el || el.contains(e)) return true; if (opaque(e)) return false; } return false; };
  const out = [], walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const text = n.textContent.replace(/\s+/g, ' ').trim(), el = n.parentElement;
    if (!text || !el || el.closest('[aria-hidden="true"], script, style')) continue;
    let o = 1;
    for (let e = el; e && o >= 0.5; e = e.parentElement) { const s = getComputedStyle(e); o = s.display === 'none' || s.visibility === 'hidden' ? 0 : o * Number(s.opacity); }
    if (o < 0.5) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const raw = [...r.getClientRects()].filter((q) => q.width > 0.5 && q.height > 0.5);
    const seen = raw.map((q) => [0.1, 0.3, 0.5, 0.7, 0.9].filter((f) => shows(el, q.left + f * q.width, (q.top + q.bottom) / 2)).length);
    if (!seen.some((k) => k > 0)) continue;
    const lines = raw.filter((q, k) => seen[k] >= 3).map((q) => [q.left, q.top, q.right, q.bottom]);
    let box = el; while (box.parentElement && getComputedStyle(box).display === 'inline') box = box.parentElement;
    const b = box.getBoundingClientRect(), scale = el.offsetHeight ? el.getBoundingClientRect().height / el.offsetHeight : 1;
    // the text's colour as sRGB with its alpha times the opacity above it; a colour that is not rgb() is not measured
    const cs = getComputedStyle(el), c = (el instanceof SVGElement ? cs.fill : cs.color).match(/^rgba?\(([^)]+)\)$/)?.[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    out.push({ key: text.slice(0, 48), px: parseFloat(cs.fontSize) * scale, lines, raw: raw.map((q) => [q.left, q.top, q.right, q.bottom]), box: [b.left, b.top, b.right, b.bottom].map(Math.round), max: Number(box.closest('[data-max-lines]')?.dataset.maxLines) || 0, fg: c ? [c[0], c[1], c[2], (c[3] ?? 1) * o] : null });
  }
  return out;
};
// the background alone: the same frame with every glyph's fill transparent (a text shadow stays, as part of the background)
const hideText = (on) => {
  let st = document.getElementById('render-mjs-hide');
  if (on && !st) { st = document.createElement('style'); st.id = 'render-mjs-hide'; st.textContent = '*{color:transparent!important;-webkit-text-fill-color:transparent!important}svg text,svg tspan{fill:transparent!important}'; document.head.append(st); }
  else if (!on && st) st.remove();
};
async function backgroundShot() {
  await page.evaluate(hideText, true);
  const png = await page.screenshot({ type: 'png' });
  await page.evaluate(hideText, false);
  return decodePNG(png);
}
// WCAG contrast of the text's colour against each background pixel under its lines (sampled every 2 px), and the ratio
// that 90% of those pixels reach: a few bright specks pass, a background half as light as the text does not
const MIN_CONTRAST = 4.5;
const luminance = (r, g, b) => 0.2126 * S2L[r] + 0.7152 * S2L[g] + 0.0722 * S2L[b];
function contrastUnder(it, bg) {
  const [r, g, b, a] = it.fg, bw = W * SS, ratios = [];
  for (const [l, t, rt, bt] of it.lines) {
    for (let y = Math.max(0, Math.floor(t * SS)); y < Math.min(H * SS, Math.ceil(bt * SS)); y += 2 * SS) {
      for (let x = Math.max(0, Math.floor(l * SS)); x < Math.min(bw, Math.ceil(rt * SS)); x += 2 * SS) {
        const o = (y * bw + x) * 4, br = bg[o], bgr = bg[o + 1], bb = bg[o + 2];
        const L1 = luminance(Math.round(a * r + (1 - a) * br), Math.round(a * g + (1 - a) * bgr), Math.round(a * b + (1 - a) * bb)), L2 = luminance(br, bgr, bb);
        ratios.push((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05));
      }
    }
  }
  return ratios.length ? Float32Array.from(ratios).sort()[Math.floor(ratios.length * 0.1)] : null;
}
const textHits = new Map();   // "kind|what" -> [{ n: position in the frame list, i: frame, d: detail }]
let textFrames = 0, textMost = 0;
function checkText(n, i, items, bg) {
  textFrames++; textMost = Math.max(textMost, items.length);
  const add = (kind, what, d = '') => { const k = kind + '|' + what; if (!textHits.has(k)) textHits.set(k, []); textHits.get(k).push({ n, i, d }); };
  const minPx = 36 * W / 1080, mx = 0.05 * W, my = 0.05 * H;
  for (const it of items) {
    if (it.px < minPx - 0.5) add('small', it.key, `${Math.round(it.px)} px`);
    const ratio = bg && it.fg ? contrastUnder(it, bg) : null;
    if (ratio !== null && ratio < MIN_CONTRAST) add('contrast', it.key, `${ratio.toFixed(1)}:1`);
    const inView = it.lines.every(([l, t, r, b]) => l >= 0 && t >= 0 && r <= W && b <= H);
    if (inView && it.lines.some(([l, t, r, b]) => l < mx || t < my || r > W - mx || b > H - my)) add('safe', it.key);
    if (UI && it.lines.some(([l, t, r, b]) => t < UI[0] * H / 100 || b > H - UI[1] * H / 100 || l < UI[2] * W / 100 || r > W - UI[3] * W / 100)) add('ui', it.key);
    // overflow from every line box: text past its box is not hit-tested there, so the visible lines would miss it
    if (it.raw.some(([l, , r]) => l < it.box[0] - 2 || r > it.box[2] + 2)) add('overflow', it.key);
    // a line the frame's edge cuts through: partly in the frame and partly out
    if (it.raw.some(([l, t, r, b]) => r > 0 && l < W && b > 0 && t < H && (l < -1 || t < -1 || r > W + 1 || b > H + 1))) add('cut', it.key);
  }
  // lines per box with a declared limit: tops more than half a line apart start a new line
  const boxes = new Map();
  for (const it of items.filter((x) => x.max)) { const k = it.box.join(','); if (!boxes.has(k)) boxes.set(k, { max: it.max, key: it.key, lines: [] }); boxes.get(k).lines.push(...it.lines); }
  for (const { max, key, lines } of boxes.values()) {
    const ls = [...lines].sort((a, b) => a[1] - b[1]); let count = 0, last = -Infinity;
    for (const [, t, , b] of ls) if (t - last > (b - t) / 2) { count++; last = t; }
    if (count > max) add('lines', key, `${count} lines, over its data-max-lines of ${max}`);
  }
  // two text boxes from different blocks drawn over each other
  for (let a = 0; a < items.length; a++) for (let b = a + 1; b < items.length; b++) {
    if (items[a].box.join() === items[b].box.join()) continue;
    const hit = items[a].lines.some(([l1, t1, r1, b1]) => items[b].lines.some(([l2, t2, r2, b2]) => Math.min(r1, r2) - Math.max(l1, l2) > 2 && Math.min(b1, b2) - Math.max(t1, t2) > 2));
    if (hit) add('collide', `"${items[a].key}" and "${items[b].key}"`);
  }
}

// --- frames
const list = audioOnly ? [] : stills || Array.from({ length: N }, (_, i) => i);
const diffs = []; let first = null, prev = null, flat = list.length > 0 ? [] : null;
// each frame as a grid of block means (48 across), for the dead-beat scan: small enough to keep every frame's
const GX = 48, GY = Math.max(1, Math.round(GX * H / W)), grids = [];
function blocksOf(rgba) {
  const sum = new Float32Array(GX * GY), count = new Uint32Array(GX * GY);
  for (let y = 0; y < H; y++) {
    const row = Math.floor(y * GY / H) * GX;
    for (let x = 0; x < W; x++) { const o = (y * W + x) * 4, k = row + Math.floor(x * GX / W); sum[k] += 0.2126 * rgba[o] + 0.7152 * rgba[o + 1] + 0.0722 * rgba[o + 2]; count[k]++; }
  }
  for (let k = 0; k < sum.length; k++) sum[k] /= count[k];
  return sum;
}
const t0 = Date.now();
for (const [n, i] of list.entries()) {
  const { png, rgba } = await frame(i);
  fs.writeFileSync(file(i), png);
  if (!stills) { if (prev) diffs.push(meanDiff(prev, rgba)); else first = rgba; prev = rgba; grids.push(blocksOf(rgba)); }
  // the first frame's one colour on every frame (a full-frame colour fade moves, so it is not flat)
  if (flat && (!isFlat(rgba) || (flat.length && !flat.every((c, j) => Math.abs(c - rgba[j]) <= 2)))) flat = null;
  else if (flat && !flat.length) flat = [rgba[0], rgba[1], rgba[2]];
  if (textCheck) {
    await seek(i / fps);
    const items = await page.evaluate(measureText);
    checkText(n, i, items, items.some((it) => it.fg) ? await backgroundShot() : null);
  }
  if ((n + 1) % Math.max(1, Math.round(list.length / 10)) === 0) console.error(`  ${n + 1}/${list.length} frames`);
}
if (!audioOnly) console.log(`frames: ${list.length} in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${FRAMES}`);
// a <video> left playing runs on its own clock, so the frame it shows depends on when the screenshot was taken
// --- dead beats: something new every few seconds. Every quarter second, the blocks that differ by more than 8 levels
// between half a second before and half a second after: a change that stays (a blink comes back, so it does not count).
// Under 0.2% of the frame for 3 s or more is a stretch with nothing new on screen.
if (!stills && !audioOnly) {
  const lag = Math.round(fps / 2), step = Math.max(1, Math.round(fps / 4)), runs = []; let from = null;
  for (let f = lag; f <= N - lag; f += step) {
    const a = f + lag < N ? grids[f - lag] : null, b = a && grids[f + lag];
    let changed = 0; if (a) for (let k = 0; k < a.length; k++) if (Math.abs(a[k] - b[k]) > 8) changed++;
    const still = a !== null && changed < 0.002 * a.length;
    if (still && from === null) from = f; else if (!still && from !== null) { if ((f - from) / fps >= 3) runs.push([from, f]); from = null; }
  }
  for (const [a, b] of runs) console.warn(`warning: nothing new on screen for ${((b - a) / fps).toFixed(1)} s, frames ${a}-${b} (${(a / fps).toFixed(2)}-${(b / fps).toFixed(2)} s): add a move, a reveal or a cut, or keep it as a hold the voice or the music carries (story.md, Pace)`);
}
const playing = audioOnly ? 0 : await page.evaluate(() => [...document.querySelectorAll('video')].filter((v) => !v.paused).length);
if (playing) console.warn(`warning: ${playing} video${playing > 1 ? 's play' : ' plays'} on its own clock: pause it and seek it to its source time in renderAt (engines.md, Video clips locked to t)`);
if (textCheck && !audioOnly) {
  // report what lasts: half a second in a full render (text moving through a margin is fine), any still
  const minRun = stills ? 1 : Math.max(1, Math.round(fps / 2)), found = [];
  for (const [k, seen] of textHits) {
    let best = [], run = [];
    for (const h of seen) { run = run.length && h.n === run[run.length - 1].n + 1 ? [...run, h] : [h]; if (run.length > best.length) best = run; }
    const kind = k.slice(0, k.indexOf('|')), what = k.slice(k.indexOf('|') + 1);
    if (best.length >= (kind === 'lines' ? 1 : minRun)) found.push({ kind, what, at: best[0].i === best[best.length - 1].i ? `frame ${best[0].i}` : `frames ${best[0].i}-${best[best.length - 1].i}`, d: best[0].d });
  }
  const say = {
    small: (f) => `"${f.what}" is ${f.d} at ${f.at}, under 36 px at 1080 wide (numbers.md, Text size on a phone); mark text that is only texture aria-hidden="true"`,
    safe: (f) => `"${f.what}" sits inside the 5% edge margin at ${f.at}`,
    cut: (f) => `"${f.what}" is cut by the edge of the frame at ${f.at}`,
    ui: (f) => `"${f.what}" sits under the platform's UI at ${f.at}: keep text out of the top ${UI[0]}%, bottom ${UI[1]}%, left ${UI[2]}% and right ${UI[3]}% (delivery.md, Under the platform's UI)`,
    overflow: (f) => `"${f.what}" runs past the side of its box at ${f.at}`,
    lines: (f) => `"${f.what}" takes ${f.d}, at ${f.at}`,
    collide: (f) => `${f.what} overlap at ${f.at}`,
    contrast: (f) => `"${f.what}" reaches ${f.d} against 90% of the background under it at ${f.at}, under ${MIN_CONTRAST}:1 (numbers.md, Contrast behind text)`,
  };
  if (!textFrames || !textMost) console.log('text: no DOM text on any checked frame (text drawn on a canvas or in WebGL is not measured)');
  else console.log(`text: ${textFrames} frames checked, up to ${textMost} text boxes on a frame, ${found.length ? found.length + ' issue' + (found.length > 1 ? 's' : '') : 'no issues'}`);
  for (const f of found) (f.kind === 'lines' ? (m) => failures.push(m) : (m) => console.warn('warning: ' + m))(`text: ${say[f.kind](f)}`);
}
if (flat) failures.push(`every frame is one flat colour (rgb ${flat.join(', ')}): nothing drew. Check that the canvas is in the page and that renderAt draws on it`);
else if (diffs.length && diffs.every((d) => d === 0)) console.warn('warning: every frame is the same: nothing moves');

// --- determinism: the same t, captured again after another frame, must draw the same pixels
if (!audioOnly) {
  const k = stills ? stills[0] : Math.floor(N / 2), other = k === 0 ? Math.min(1, N - 1) : 0;
  const a = decodePNG(await shot(k / fps)); await shot(other / fps); const b = decodePNG(await shot(k / fps));
  const d = meanDiff(a, b);
  if (d > 0.05) failures.push(`not deterministic: frame ${k} drawn twice differs by ${d.toFixed(3)} per channel (a clock, a timer, unseeded randomness, or state carried from frame to frame)`);
  else console.log(`deterministic: frame ${k} drawn twice is ${d === 0 ? 'identical' : `within ${d.toFixed(3)}`}`);
}

// --- loop: frame N must be frame 0 again, and the seam N-1 -> 0 must look like the steps beside it
// (beside it, because an ease-in-out slows to almost nothing at the seam on purpose). A held frame is a seam much smaller
// than the steps on both sides: one slow side is a move easing into the seam, or out of it. A big seam is a jump only
// when it is bigger than every step inside the clip: a cut or a beat onset that lands on frame 0 is as big as the others.
if (flag('loop') && !stills && !audioOnly) {
  const sorted = [...diffs].sort((x, y) => x - y), median = sorted[Math.floor(sorted.length / 2)] ?? 0, maxStep = sorted[sorted.length - 1] ?? 0;
  const period = meanDiff((await frame(N)).rgba, first), seam = meanDiff(prev, first);
  const before = diffs[diffs.length - 1] ?? 0, after = diffs[0] ?? 0;
  const local = (before + after) / 2, near = Math.min(before, after), scale = Math.max(local, 0.25 * median);
  if (median < 0.05) console.log(`loop: too little motion to judge (median step ${median.toFixed(3)})`);
  else {
    const line = `steps beside the seam ${before.toFixed(2)} and ${after.toFixed(2)}, seam ${seam.toFixed(2)}, frame N vs 0 ${period.toFixed(2)}, median step ${median.toFixed(2)}, largest step ${maxStep.toFixed(2)}`;
    if (near >= 0.25 * median && seam < 0.3 * near) failures.push(`loop: frame ${N - 1} is almost frame 0 (${line}): one frame is held at the seam, so the motion closes a frame early`);
    else if (period > 0.5 * scale) failures.push(`loop: frame ${N} does not match frame 0 (${line}): the motion does not close in ${seconds}s`);
    else if (seam > 2.5 * scale && seam > 1.25 * maxStep) failures.push(`loop: the seam jumps (${line})`);
    else console.log(`loop: closes (${line})`);
  }
}

// --- a labelled sheet: stills, or 12 frames spread over the clip
if (!audioOnly) {
  const picks = stills || [...new Set(Array.from({ length: Math.min(12, N) }, (_, k) => Math.round((k * N) / Math.min(12, N))))];
  const cols = Math.min(4, picks.length), tileW = 400, tileH = Math.round((tileW * H) / W);
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${tileW}px);gap:4px;padding:4px;font:600 15px/1 ui-monospace,Menlo,Consolas,monospace;color:#eee}
figure{margin:0}img{display:block;width:${tileW}px;height:${tileH}px}figcaption{padding:6px 2px}</style>` +
    picks.map((i) => `<figure><img src="${pathToFileURL(file(i)).href}"><figcaption>f${i} &middot; ${(i / fps).toFixed(2)}s</figcaption></figure>`).join('');
  const sheetHtml = path.join(OUT, '.sheet.html'); fs.writeFileSync(sheetHtml, html);
  const sp = await browser.newPage({ viewport: { width: cols * (tileW + 4) + 4, height: 200 } });
  await sp.goto(pathToFileURL(sheetHtml).href, { waitUntil: 'load' });
  const sheet = path.join(OUT, stills ? 'stills.png' : 'sheet.png');
  await sp.screenshot({ path: sheet, fullPage: true }); await sp.close(); fs.unlinkSync(sheetHtml);
  console.log(`sheet: ${sheet} (frames ${picks.join(', ')})`);
}

// --- audio from the page, brought to the target loudness under a true-peak limiter before the mux
// integrated loudness and true peak of a file, from ffmpeg's EBU R128 scanner
function loudness(f) {
  const e = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const s = e.slice(e.lastIndexOf('Summary:')), num = (re) => { const v = re.exec(s)?.[1]; return v === '-inf' ? -Infinity : Number(v); };
  return { I: num(/I:\s+(\S+) LUFS/), TP: num(/True peak:\s+Peak:\s+(\S+) dBFS/) };
}
// the user's song (--track) for the piece's length from --track-start, at 48 kHz stereo, faded out over its last half second
function trackPcm(asWav) {
  const af = `aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=${seconds},afade=t=out:st=${Math.max(0, seconds - 0.5)}:d=0.5`;
  const r = spawnSync('ffmpeg', ['-v', 'error', '-ss', String(trackStart), '-t', String(seconds), '-i', TRACK, '-af', af, ...(asWav ? ['-c:a', 'pcm_f32le', '-f', 'wav'] : ['-f', 'f32le']), '-'], { maxBuffer: 2 ** 31 });
  if (r.status !== 0 || !r.stdout.length) die(`ffmpeg could not decode ${TRACK}`);
  return r.stdout;
}
let wav = null;
if (withAudio) {
  const b64 = await page.evaluate(async () => {
    const buf = await window.renderAudio(), ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
    const data = new DataView(new ArrayBuffer(44 + len * ch * 4)), str = (o, s) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
    str(0, 'RIFF'); data.setUint32(4, 36 + len * ch * 4, true); str(8, 'WAVEfmt '); data.setUint32(16, 16, true); data.setUint16(20, 3, true);
    data.setUint16(22, ch, true); data.setUint32(24, sr, true); data.setUint32(28, sr * ch * 4, true); data.setUint16(32, ch * 4, true); data.setUint16(34, 32, true);
    str(36, 'data'); data.setUint32(40, len * ch * 4, true);
    const chans = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
    for (let i = 0, o = 44; i < len; i++) for (let c = 0; c < ch; c++, o += 4) data.setFloat32(o, chans[c][i], true);
    const bytes = new Uint8Array(data.buffer); let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  });
  const raw = path.join(OUT, 'audio-raw.wav'); fs.writeFileSync(raw, Buffer.from(b64, 'base64'));
  if (TRACK) {
    // the song under the sound effects, summed as they are: balance them in the score, then the loudness pass sets the level
    const song = path.join(OUT, 'track.wav'), mixed = path.join(OUT, 'audio-mixed.wav');
    fs.writeFileSync(song, trackPcm(true));
    const m = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', raw, '-i', song, '-filter_complex', '[0:a][1:a]amix=inputs=2:normalize=0:duration=first', '-c:a', 'pcm_f32le', mixed], { stdio: 'inherit' });
    if (m.status !== 0) die('ffmpeg: mixing --track failed');
    fs.renameSync(mixed, raw); fs.unlinkSync(song);
    console.log(`audio: ${path.basename(TRACK)} from ${trackStart} s mixed under renderAudio()`);
  }
  const before = loudness(raw);
  if (!Number.isFinite(before.I)) failures.push('audio: renderAudio() returned silence');
  else {
    // gain to the target, then a look-ahead limiter at 4x the rate so it catches peaks between samples (true peak);
    // latency=true removes the look-ahead delay, so every hit stays on its frame. The limiter costs loudness on a peaky
    // score, so measure and make it up, at most three passes.
    wav = path.join(OUT, 'audio.wav');
    const limit = 10 ** ((CEILING_DBTP - 0.2) / 20);
    let gain = LUFS - before.I, applied = gain, after = null, pass = 0;
    for (; pass < 3; pass++) {
      applied = gain;
      const af = `volume=${gain.toFixed(2)}dB,aresample=192000,alimiter=limit=${limit.toFixed(4)}:attack=1:release=60:level=false:latency=true,aresample=48000`;
      const p = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', raw, '-af', af, '-c:a', 'pcm_s24le', '-t', String(seconds), wav], { stdio: 'inherit' });
      if (p.status !== 0) die('ffmpeg: the loudness pass failed');
      after = loudness(wav);
      if (Math.abs(after.I - LUFS) <= 0.3) break;
      gain += LUFS - after.I;
    }
    // what the limiter took off the hottest peak: where it would have been after the gain, less where it ended up
    const took = Math.max(0, before.TP + applied - after.TP);
    console.log(`audio: rendered ${before.I.toFixed(1)} LUFS, ${before.TP.toFixed(1)} dBTP -> ${after.I.toFixed(1)} LUFS, ${after.TP.toFixed(1)} dBTP (gain ${applied.toFixed(1)} dB in the last pass, limiter took ${took.toFixed(1)} dB at the hottest peak, ${Math.min(pass + 1, 3)} pass${pass ? 'es' : ''})`);
    const tame = `tame it in the score: spread its energy over a longer decay, or lower --lufs for a few hits alone (sound.md, Balance)`;
    // which hit that is: the score's loudest sample, read as the hit that peaks there ((F + 1) / fps, sound.md, Timing)
    const hottest = () => {
      const x = new Float32Array(Uint8Array.from(spawnSync('ffmpeg', ['-v', 'error', '-i', raw, '-f', 'f32le', '-ac', '2', '-ar', '48000', '-'], { maxBuffer: 2 ** 31 }).stdout).buffer);
      let m = 0, k = 0; for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i]); if (v > m) { m = v; k = i; } }
      const s = Math.floor(k / 2) / 48000, f = Math.max(0, Math.round(s * fps) - 1);
      return TRACK ? `the peak at ${s.toFixed(3)} s (a hit on frame ${f}, or the song)` : `the hit on frame ${f} (its peak at ${s.toFixed(3)} s)`;
    };
    if (took > 6) failures.push(`audio: the limiter took ${took.toFixed(1)} dB off the hottest peak, over 6 dB, which flattens ${hottest()}: ${tame}`);
    else if (took > 3) console.warn(`warning: the limiter took ${took.toFixed(1)} dB off the hottest peak, which flattens ${hottest()}: ${tame}`);
    // the payoff: the loudest 100 ms window of the mix, and the longest run of windows at -40 dBFS or under in the 2 s before it
    const mix = spawnSync('ffmpeg', ['-v', 'error', '-i', wav, '-f', 'f32le', '-ac', '2', '-'], { maxBuffer: 2 ** 31 }).stdout;
    const pcm = new Float32Array(Uint8Array.from(mix).buffer), win = 4800 * 2, db = [];
    for (let w = 0; (w + 1) * win <= pcm.length; w++) { let q = 0; for (let i = w * win; i < (w + 1) * win; i++) q += pcm[i] * pcm[i]; db.push(10 * Math.log10(q / win + 1e-20)); }
    const L = db.indexOf(Math.max(...db));
    let run = 0, best = 0, bestEnd = L;
    for (let w = Math.max(0, L - 20); w < L; w++) { run = db[w] <= -40 ? run + 1 : 0; if (run > best) { best = run; bestEnd = w + 1; } }
    console.log(`payoff: the loudest 100 ms starts at ${(L / 10).toFixed(2)} s (frame ${Math.round(L / 10 * fps)}), ${db[L].toFixed(1)} dBFS; in the 2 s before it, ${(best / 10).toFixed(1)} s at -40 dBFS or under${best ? `, ending at ${(bestEnd / 10).toFixed(2)} s` : ''} (sound.md, The arc)`);
  }
}
// --- hit timing and level (--hits F,F,...): the score's parts rendered alone and measured the way sound.md defines them
if (hits) {
  if (!has.audio) die('--hits: the page defines no window.renderAudio()');
  const part = async (only) => {
    const r = await page.evaluate(async (o) => {
      const buf = await window.renderAudio({ only: o }), ch = buf.numberOfChannels, len = buf.length, f = new Float32Array(len * ch);
      for (let c = 0; c < ch; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) f[i * ch + c] = d[i]; }
      const bytes = new Uint8Array(f.buffer); let s = '';
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return { sr: buf.sampleRate, ch, b64: btoa(s) };
    }, only);
    return levels(Buffer.from(r.b64, 'base64'), r.ch, r.sr);
  };
  // per sample: the peak over the channels and the mean square
  function levels(raw, ch, sr) {
    const len = raw.length / 4 / ch, peak = new Float32Array(len), sq = new Float32Array(len);
    for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { const v = raw.readFloatLE((i * ch + c) * 4); peak[i] = Math.max(peak[i], Math.abs(v)); sq[i] += v * v / ch; }
    return { sr, peak, sq };
  }
  // with a song under the effects, the song is the bed
  const hp = await part('hits'), bp = TRACK ? levels(trackPcm(false), 2, 48000) : await part('bed'), sr = hp.sr, order = [...new Set(hits)].sort((a, b) => a - b);
  const rms = (sq, a, b) => { let s = 0; for (let i = Math.max(0, a); i < Math.min(sq.length, b); i++) s += sq[i]; return Math.sqrt(s / Math.max(1, b - a)); };
  console.log('hits: peak = the first sample at 90% of the largest in the hit\'s first 30 ms (or up to the next hit), against (F + 1) / fps; level = RMS of its first 60 ms against the bed\'s');
  order.forEach((F, k) => {
    const target = (F + 1) * sr / fps, from = Math.round(F * sr / fps), next = k + 1 < order.length ? Math.round(order[k + 1] * sr / fps) : Infinity;
    const to = Math.min(Math.round(target + 0.03 * sr), next, hp.peak.length);
    let top = 0; for (let i = from; i < to; i++) top = Math.max(top, hp.peak[i]);
    if (!(top > 1e-4)) { console.warn(`warning: hits: frame ${F}: nothing in renderAudio({ only: 'hits' }) between ${(from / sr).toFixed(3)} and ${(to / sr).toFixed(3)} s`); return; }
    let p = from; while (hp.peak[p] < 0.9 * top) p++;
    const ms = (p - target) / sr * 1000, a = Math.round(target), b = Math.round(target + 0.06 * sr), bed = rms(bp.sq, a, b);
    const level = bed > 1e-5 ? `${(20 * Math.log10(rms(hp.sq, a, b) / bed)).toFixed(1)} dB over the bed` : 'no bed';
    const line = `  frame ${F}: peak ${ms >= 0 ? '+' : ''}${ms.toFixed(2)} ms, ${level}`;
    if (Math.abs(ms) > 1) console.warn(`${line}: more than 1 ms off (sound.md, Timing)`); else console.log(line);
  });
}
await browser.close();

// --- video and GIF
if (!stills) {
  const mp4 = path.join(OUT, `${name}.mp4`);
  // the frames are sRGB and players read HD video as BT.709: convert with that matrix and tag all three properties
  // (setparams, because ffmpeg 9 drops the encoder's -color_primaries and -color_trc for frames that arrive untagged)
  const vf = 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv';
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(FRAMES, '%05d.png'),
    ...(wav ? ['-i', wav, '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '192k'] : ['-map', '0:v:0']),
    '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-frames:v', String(N), '-movflags', '+faststart', mp4], { stdio: 'inherit' });
  if (r.status !== 0) die('ffmpeg: the MP4 encode failed');
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=profile,pix_fmt,color_space,color_primaries,color_transfer,r_frame_rate', '-of', 'csv=p=0', mp4], { encoding: 'utf8' }).stdout.trim();
  console.log(`mp4: ${mp4} (${probe}, ${(fs.statSync(mp4).size / 1e6).toFixed(2)} MB)`);
  if (wav) {
    // measure what a player will decode: the AAC in the MP4, not the WAV that went in
    const { I, TP } = loudness(mp4);
    const line = `decoded MP4 audio: ${I.toFixed(1)} LUFS, true peak ${TP.toFixed(1)} dBTP`;
    if (!(TP <= MAX_DECODED_DBTP)) failures.push(`${line}: over ${MAX_DECODED_DBTP} dBTP, lower the hottest hits in the score`);
    else if (Math.abs(I - LUFS) > 1) failures.push(`${line}: more than 1 LU from ${LUFS} (the limiter took too much: the score is peaky, so tame its hottest hits)`);
    else console.log(line);
  }
  if (flag('gif')) {
    const gif = path.join(OUT, `${name}.gif`);
    const vf = `fps=${gifFps},scale=w='min(${X_GIF.width},iw)':h='min(${X_GIF.height},ih)':force_original_aspect_ratio=decrease:flags=lanczos,` +
      'split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle';
    const g = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(FRAMES, '%05d.png'), '-vf', vf, '-loop', '0', gif], { stdio: 'inherit' });
    if (g.status !== 0) die('ffmpeg: the GIF encode failed');
    const st = JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets,width,height', '-of', 'json', gif], { encoding: 'utf8' }).stdout).streams[0];
    const frames = Number(st.nb_read_packets), bytes = fs.statSync(gif).size;
    console.log(`gif: ${gif} (${st.width}x${st.height}, ${frames} frames at ${gifFps} fps, ${(bytes / 1e6).toFixed(2)} MB)`);
    if (st.width * st.height * frames > 300e6) console.warn(`warning: gif: ${st.width} x ${st.height} x ${frames} frames is over the 300 million pixels X recommends`);
    if (frames > X_GIF.frames) failures.push(`gif: ${frames} frames, over X's ${X_GIF.frames}: lower --gif-fps or shorten the loop`);
    if (bytes > X_GIF.bytes) failures.push(`gif: ${(bytes / 1e6).toFixed(1)} MB, over X's 15 MB: lower --gif-fps, the size, or the palette's detail`);
    else if (bytes > X_GIF.mobileBytes) console.log('gif: over 5 MB, the limit for uploads from X\'s mobile app: post it from the web');
  }
}

for (const e of errors) failures.push(`page error: ${e}`);
if (failures.length) { console.error('\nFAIL\n  ' + failures.join('\n  ')); process.exit(1); }
console.log('\nOK');
