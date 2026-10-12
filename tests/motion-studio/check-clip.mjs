// Reads the frame index coded into each clip on every rendered frame of pages/clip.html and compares it with the
// frame the timeline mapping asks for. usage: node check-clip.mjs <frames dir> [fps]
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const dir = process.argv[2], fps = Number(process.argv[3] || 30), W = 640, H = 360;
const files = fs.readdirSync(dir).filter((f) => /^\d{5}\.png$/.test(f)).sort();
const raw = spawnSync('ffmpeg', ['-v', 'error', '-i', `${dir}/%05d.png`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1e9 }).stdout;
const px = (f, x, y) => raw[f * W * H + y * W + x];
const read = (f, x0) => px(f, x0 + 300, 135) < 100 ? 'hidden' : Array.from({ length: 10 }, (_, k) => px(f, x0 + 16 + 32 * k, 45) > 128 ? 1 << k : 0).reduce((a, b) => a + b);
const want = {
  a: (t) => { if (t < 0.5) return 'hidden'; let s = 1 + (t - 0.5); if (s >= 4) s = 3.999; return Math.floor(s * 24 + 1e-9); },
  b: (t) => Math.floor(t * 0.5 * 25 + 1e-9),
};
let bad = 0;
for (let i = 0; i < files.length; i++) {
  const f = Number(files[i].slice(0, 5)), t = f / fps;
  for (const [k, x0] of [['a', 0], ['b', 320]]) {
    const got = read(i, x0), exp = want[k](t);
    if (got !== exp) { bad++; if (bad <= 12) console.log(`frame ${f} clip ${k}: shows ${got}, expected ${exp}`); }
  }
}
console.log(`${files.length} frames, ${bad} clip frames off`);
