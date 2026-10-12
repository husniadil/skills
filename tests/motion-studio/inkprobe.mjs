// For each div: the line rect, the ink box from measureText, and the rows its glyph pixels actually cover
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + process.argv[2]); await p.evaluate(() => document.fonts.ready);
const boxes = await p.evaluate(() => [...document.querySelectorAll('div')].map((el) => {
  const r = document.createRange(); r.selectNodeContents(el.firstChild); const q = r.getClientRects()[0], cs = getComputedStyle(el);
  const ctx = document.createElement('canvas').getContext('2d'); ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = ctx.measureText(el.textContent), fh = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent, k = q.height / fh;
  return { id: el.id, l: q.left, r: q.right, rect: [q.top, q.bottom], ink: [q.top + (m.fontBoundingBoxAscent - m.actualBoundingBoxAscent) * k, q.top + (m.fontBoundingBoxAscent + m.actualBoundingBoxDescent) * k] };
}));
for (const bx of boxes) {
  await p.evaluate((keep) => document.querySelectorAll('div').forEach((d) => { d.style.visibility = d.id === keep ? 'visible' : 'hidden'; }), bx.id);
  const png = await p.screenshot({ type: 'png' });
  const g = spawnSync('ffmpeg', ['-v', 'error', '-i', '-', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { input: png, maxBuffer: 2 ** 26 }).stdout;
  let top = -1, bot = -1;
  for (let y = 0; y < 1920; y++) for (let x = Math.floor(bx.l); x < Math.min(1080, bx.r); x++) if (g[y * 1080 + x] > 40) { if (top < 0) top = y; bot = y + 1; break; }
  console.log(bx.id, 'rect', bx.rect.map(Math.round).join('-'), 'ink', bx.ink.map((v) => v.toFixed(1)).join('-'), 'pixels', `${top}-${bot}`);
}
await b.close();
