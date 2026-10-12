// Isolated onsets of three kinds at known times: a noise burst, a low kick and a 1 kHz tone, each every 0.8 s.
import fs from 'node:fs';
const [out, kind] = process.argv.slice(2), SR = 44100, n = SR * 12, x = new Float32Array(n); let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
for (let k = 0; k < 14; k++) { const s0 = Math.round((0.5 + 0.8 * k + 0.0137 * k) * SR);
  for (let i = 0; i < 0.2 * SR && s0 + i < n; i++) { const t = i / SR; x[s0 + i] += kind === 'noise' ? 0.5 * Math.exp(-t * 60) * rnd() : kind === 'kick' ? 0.8 * Math.exp(-t * 14) * Math.sin(2 * Math.PI * (55 + 120 * Math.exp(-t * 30)) * t) : 0.5 * Math.exp(-t * 20) * Math.sin(2 * Math.PI * 1000 * t); } }
const b = Buffer.alloc(44 + n * 2), w = (o, s) => b.write(s, o, 'ascii');
w(0, 'RIFF'); b.writeUInt32LE(36 + n * 2, 4); w(8, 'WAVEfmt '); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); w(36, 'data'); b.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i])) * 30000), 44 + i * 2);
fs.writeFileSync(out, b);
