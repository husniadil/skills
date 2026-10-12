// Opens pages/clip.html without ?t= (the real-time preview) and samples each clip's playhead against the timeline.
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 640, height: 360 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(pathToFileURL(path.resolve('pages/clip.html')).href);
await p.waitForFunction(() => window.__ready === true && typeof window.previewT === 'number');
let worst = { a: 0, b: 0 }, n = 0, paused = { a: 0, b: 0 };
for (let k = 0; k < 40; k++) {
  await p.waitForTimeout(150);
  const s = await p.evaluate(() => ({ t: window.previewT, a: document.getElementById('a').currentTime, b: document.getElementById('b').currentTime, ap: document.getElementById('a').paused, bp: document.getElementById('b').paused }));
  const ea = s.t < 0.5 ? null : Math.min(1 + (s.t - 0.5), 3.999), eb = s.t * 0.5;
  // skip samples within 0.3 s after the wrap at 4 s, where a seek is in flight by design
  if (s.t < 0.3) continue;
  n++;
  if (ea !== null) { worst.a = Math.max(worst.a, Math.abs(s.a - ea)); if (s.ap && ea < 3.99) paused.a++; }
  worst.b = Math.max(worst.b, Math.abs(s.b - eb)); if (s.bp) paused.b++;
}
console.log(`preview: ${n} samples, worst drift a ${worst.a.toFixed(3)} s, b ${worst.b.toFixed(3)} s, paused while due to play a ${paused.a}, b ${paused.b}, page errors ${errs.length}`);
await b.close();
