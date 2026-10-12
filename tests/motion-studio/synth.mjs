// Writes a test track: kicks on every beat (louder and lower on the bar's first), hats on the off-beats, a bass note per bar,
// light noise. usage: node synth.mjs out.wav bpm firstBeat seconds [drop0 drop1]
import fs from 'node:fs';
const [out, bpmS, offS, secS, d0, d1] = process.argv.slice(2), bpm = +bpmS, off = +offS, secs = +secS, SR = 44100, n = Math.round(secs * SR);
const x = new Float32Array(n); let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const p = 60 / bpm, quiet = (t) => d0 !== undefined && t >= +d0 && t < +d1;
for (let k = 0; off + k * p < secs; k++) {
  const t0 = off + k * p; if (quiet(t0)) continue;
  const bar = k % 4 === 0, s0 = Math.round(t0 * SR);
  for (let i = 0; i < 0.25 * SR && s0 + i < n; i++) { const t = i / SR, f = (bar ? 55 : 70) + 120 * Math.exp(-t * 30); x[s0 + i] += (bar ? 0.9 : 0.6) * Math.exp(-t * 14) * Math.sin(2 * Math.PI * f * t); }
  const h0 = Math.round((t0 + p / 2) * SR); for (let i = 0; i < 0.05 * SR && h0 + i < n; i++) x[h0 + i] += 0.15 * Math.exp(-i / SR * 80) * rnd();
  if (bar) for (let i = 0; i < 4 * p * SR * 0.9 && s0 + i < n; i++) x[s0 + i] += 0.12 * Math.sin(2 * Math.PI * 41.2 * i / SR);
}
for (let i = 0; i < n; i++) x[i] += 0.01 * rnd();
const b = Buffer.alloc(44 + n * 2), w = (o, s) => b.write(s, o, 'ascii');
w(0, 'RIFF'); b.writeUInt32LE(36 + n * 2, 4); w(8, 'WAVEfmt '); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); w(36, 'data'); b.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(x[i] * 30000))), 44 + i * 2);
fs.writeFileSync(out, b);
