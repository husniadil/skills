// Share of background pixels under #t2 darker than its pane, and the 10th-percentile WCAG ratio for white text,
// under the font's line box and under the glyphs' ink (render.mjs's sampling: every 2 px, glyph fill hidden)
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 640, height: 360 } });
await p.goto('file://' + process.argv[2]);
const boxes = await p.evaluate(() => { const el = document.getElementById('t2'), r = document.createRange(); r.selectNodeContents(el.firstChild); const q = r.getClientRects()[0], cs = getComputedStyle(el);
  const ctx = document.createElement('canvas').getContext('2d'); ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = ctx.measureText(el.textContent), k = q.height / (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent);
  return { line: [q.left, q.top, q.right, q.bottom], ink: [q.left, q.top + (m.fontBoundingBoxAscent - m.actualBoundingBoxAscent) * k, q.right, q.top + (m.fontBoundingBoxAscent + m.actualBoundingBoxDescent) * k] }; });
await p.addStyleTag({ content: '*{color:transparent!important;-webkit-text-fill-color:transparent!important}' });
const g = spawnSync('ffmpeg', ['-v', 'error', '-i', '-', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { input: await p.screenshot({ type: 'png' }), maxBuffer: 2 ** 26 }).stdout;
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
boxes.original = [80, 225, 560, 280];
for (const [name, [l, t, r, bt]] of Object.entries(boxes)) {
  let n = 0, dark = 0; const ratios = [];
  for (let y = Math.max(0, Math.floor(t)); y < Math.ceil(bt); y += (name === "original" ? 1 : 2)) for (let x = Math.floor(l); x < Math.ceil(r); x += (name === "original" ? 1 : 2)) { const v = g[y * 640 + x]; n++; if (v < 128) dark++; ratios.push(1.05 / (lin(v) + 0.05)); }
  ratios.sort((a, c) => a - c);
  console.log(name, [t, bt].map((v) => v.toFixed(1)).join('-'), `under 128: ${(100 * dark / n).toFixed(0)}%`, `90% reach ${ratios[Math.floor(ratios.length * 0.1)].toFixed(2)}:1`);
}
await b.close();
