#!/usr/bin/env node
// Beat map of a music track, so a piece can cut on the song's own grid (sound.md, A track of your own): its tempo, the
// first beat, every beat, the strongest hits, the loudest 100 ms and the quiet drops. It does not find where bars start.
//
// usage: node beats.mjs <track.wav|mp3|m4a|caf> [--start 0] [--seconds 30] [--bpm 70-180 | --bpm 128] [--out beats.json]
//          --start, --seconds   the part of the track the piece uses; every time printed is from --start
//          --bpm 70-180         the range searched (default); --bpm 128, a tempo you know, is only refined (+-2%)
//
// Method: ffmpeg decodes mono at 22.05 kHz. The onset strength is the positive change of the log spectrum from one
// 2048-sample frame to the next (hop 256, 11.6 ms). The tempo is the autocorrelation peak of that strength, weighted
// toward 120 BPM; then tempo and the first beat are refined together as the grid that collects the most onset strength,
// and each beat is placed on its attack to the millisecond. The tempo is assumed constant.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const USAGE = 'usage: node beats.mjs <track> [--start 0] [--seconds 30] [--bpm 70-180 | --bpm 128] [--out beats.json]';
const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : dflt; };
const die = (msg, code = 1) => { console.error(msg); process.exit(code); };
const track = argv[0];
if (!track || track.startsWith('--')) die(USAGE, 2);
if (!fs.existsSync(track)) die(`not found: ${track}`);
const start = Number(opt('start', '0')), seconds = opt('seconds') ? Number(opt('seconds')) : null;
const bpmArg = opt('bpm', '70-180').split('-').map(Number);
const known = bpmArg.length === 1 ? bpmArg[0] : null, [lo, hi] = known ? [known * 0.98, known * 1.02] : bpmArg;
if (!(start >= 0) || (seconds !== null && !(seconds > 0)) || !(lo > 20 && hi > lo && hi < 400)) die(USAGE, 2);
if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) die('missing: ffmpeg (brew install ffmpeg, sudo apt-get install ffmpeg, winget install Gyan.FFmpeg)');

// --- decode
const SR = 22050, N = 2048, HOP = 256, FR = SR / HOP;
const dec = spawnSync('ffmpeg', ['-v', 'error', '-ss', String(start), ...(seconds ? ['-t', String(seconds)] : []), '-i', track, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 2 ** 31 });
if (dec.status !== 0 || !dec.stdout.length) die(`ffmpeg could not decode ${track}`);
const x = new Float32Array(Uint8Array.from(dec.stdout).buffer), dur = x.length / SR;
if (dur < 4) die(`${dur.toFixed(1)} s of audio: a beat map needs at least 4 s`);

// --- onset strength per frame: positive spectral flux of log magnitude, all bins and the band under 150 Hz
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a), h = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < h; k++) {
        const p = i + k, q = p + h, tr = re[q] * cr - im[q] * ci, ti = re[q] * ci + im[q] * cr;
        re[q] = re[p] - tr; im[q] = im[p] - ti; re[p] += tr; im[p] += ti;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
const frames = Math.max(0, Math.floor((x.length - N) / HOP) + 1), BINS = N / 2, LOW = Math.round(150 * N / SR), MID = Math.round(2500 * N / SR);
const hann = Float32Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
const flux = new Float32Array(frames), low = new Float32Array(frames), mid = new Float32Array(frames);
let prev = new Float32Array(BINS), cur = new Float32Array(BINS);
const re = new Float64Array(N), im = new Float64Array(N);
for (let f = 0; f < frames; f++) {
  for (let i = 0; i < N; i++) { re[i] = x[f * HOP + i] * hann[i]; im[i] = 0; }
  fft(re, im);
  let s = 0, sl = 0, sm = 0;
  for (let k = 1; k < BINS; k++) { cur[k] = Math.log1p(100 * Math.hypot(re[k], im[k])); const d = cur[k] - prev[k]; if (f && d > 0) { s += d; if (k <= LOW) sl += d; else if (k <= MID) sm += d; } }
  flux[f] = s; low[f] = sl; mid[f] = sm; [prev, cur] = [cur, prev];
}
// a frame's time is its window's centre; the flux of frame f compares it with frame f - 1, so it rises half a hop earlier
const timeOf = (f) => (f * HOP + N / 2 - HOP / 2) / SR;
// the strength over its local mean (half a second), so a loud passage doesn't outweigh the beats of a quiet one
const env = new Float32Array(frames), half = Math.round(FR / 4);
{ let sum = 0, from = 0, to = 0; for (let f = 0; f < frames; f++) { while (to < Math.min(frames, f + half + 1)) sum += flux[to++]; while (from < f - half) sum -= flux[from++]; env[f] = Math.max(0, flux[f] - sum / (to - from)); } }
const envAt = (t) => { const p = (t * SR - N / 2 + HOP / 2) / HOP, i = Math.floor(p); return i < 0 || i + 1 >= frames ? 0 : env[i] + (env[i + 1] - env[i]) * (p - i); };

// --- tempo: autocorrelation of the strength, weighted by a log-normal prior around 120 BPM (one octave wide)
const mean = env.reduce((a, b) => a + b, 0) / frames, e0 = env.map((v) => v - mean);
const acf = (lag) => { let s = 0; for (let f = 0; f + lag < frames; f++) s += e0[f] * e0[f + lag]; return s / (frames - lag); };
const bpmOfLag = (lag) => 60 * FR / lag;
const acfAt = (l) => { const a = Math.floor(l); return a + 1 >= frames ? 0 : acf(a) + (acf(a + 1) - acf(a)) * (l - a); };
// a beat's period, two beats and a bar together: a pulse at 4/3 or 3/4 of the beat repeats too, but not over the bar
const scoreAt = (bpm) => { const l = 60 * FR / bpm; return acfAt(l) + 0.5 * acfAt(2 * l) + 0.25 * acfAt(4 * l); };
const prior = (bpm) => (known ? 1 : Math.exp(-0.5 * Math.log2(bpm / 120) ** 2));
let bestLag = 0, best = -Infinity;
for (let lag = Math.floor(60 * FR / hi); lag <= Math.ceil(60 * FR / lo); lag++) {
  const bpm = bpmOfLag(lag); if (bpm < lo || bpm > hi) continue;
  const s = scoreAt(bpm) * prior(bpm); if (s > best) { best = s; bestLag = lag; }
}
if (!bestLag) die('no tempo found in that range');
let bpm0 = bpmOfLag(bestLag);
// between lags: a parabola through the scores either side, moved at most half a lag
{ const sc = (lag) => scoreAt(bpmOfLag(lag)), a = sc(bestLag - 1), b = sc(bestLag), c = sc(bestLag + 1), d = a - 2 * b + c;
  if (d < 0) bpm0 = bpmOfLag(bestLag + Math.max(-0.5, Math.min(0.5, 0.5 * (a - c) / d))); }

// --- tempo and first beat together: the grid that collects the most onset strength, within 1.5% of the estimate
const collect = (bpm, phase) => { const p = 60 / bpm; let s = 0; for (let t = phase; t < dur; t += p) s += envAt(t); return s; };
let bpm = bpm0, phase = 0, top = -Infinity;
for (let b = bpm0 * 0.985; b <= bpm0 * 1.015; b += 0.02) {
  if (b < lo || b > hi) continue;
  const p = 60 / b;
  for (let ph = 0; ph < p; ph += 0.002) { const s = collect(b, ph); if (s > top) { top = s; bpm = b; phase = ph; } }
}
// the beat or the half beat: hats on the off-beats can outweigh the kicks and snares in the spectrum, so take the phase
// whose beats carry more of the bands under 2.5 kHz, each band scaled by its own mean
const bandAt = (band, t) => { let m = 0; for (let f = Math.max(0, Math.round((t - 0.05) * FR)); f <= Math.min(frames - 1, Math.round((t + 0.05) * FR)); f++) m = Math.max(m, band[f]); return m; };
const meanOf = (a) => a.reduce((u, v) => u + v, 0) / a.length || 1, lowMean = meanOf(low), midMean = meanOf(mid);
const lowAt = (t) => bandAt(low, t) / lowMean, midAt = (t) => bandAt(mid, t) / midMean;
const onGrid = (ph) => { let s = 0; for (let t = ph; t < dur; t += 60 / bpm) s += lowAt(t) + midAt(t); return s; };
{ const other = (phase + 30 / bpm) % (60 / bpm); if (onGrid(other) > onGrid(phase)) phase = other; }
// to the millisecond: the spectral peak comes 25 to 40 ms early (a frame is 93 ms long, and the log jumps as soon as an
// attack enters it), so find each beat's attack as the steepest 5 ms rise of the energy and move the grid by the median
// on the sample-to-sample difference, a high-pass that keeps the attack's transient and flattens the ripple a low note
// leaves in 5 ms windows (up to 10 dB on a 55 Hz kick's tail)
const MS = SR / 1000, eDb = new Float32Array(Math.floor(x.length / MS));
for (let j = 0; j + 5 < eDb.length; j++) { let q = 0; for (let i = Math.max(1, Math.round(j * MS)); i < Math.round((j + 5) * MS); i++) q += (x[i] - x[i - 1]) ** 2; eDb[j] = 10 * Math.log10(q / (5 * MS) + 1e-12); }
const attackNear = (t) => {
  let bestJ = -1, rise = 6;   // a rise under 6 dB in 5 ms is no attack
  for (let j = Math.max(0, Math.round(t * 1000) - 60); j < Math.min(eDb.length - 10, Math.round(t * 1000) + 80); j++) { const r = eDb[j + 5] - eDb[j]; if (r > rise) { rise = r; bestJ = j; } }
  return bestJ < 0 ? null : (bestJ + 5) / 1000;
};
{ const offs = []; for (let t = phase; t < dur; t += 60 / bpm) { const a = attackNear(t); if (a !== null) offs.push(a - t); }
  if (offs.length >= 4) { offs.sort((a, b) => a - b); phase += offs[Math.floor(offs.length / 2)]; } }
const period = 60 / bpm;
phase = ((phase % period) + period) % period;
const beats = [];
for (let t = phase; t < dur; t += period) beats.push(+t.toFixed(3));

// --- the strongest hits: of the beats and the 40 biggest peaks of the strength, each placed on its attack, the 8 loudest
// over the 50 ms after it (the spectrum favours a quiet hat over a loud kick), at least 0.25 s apart
const peaks = [];
for (let f = 1; f + 1 < frames; f++) if (env[f] > env[f - 1] && env[f] >= env[f + 1]) peaks.push([timeOf(f), env[f]]);
peaks.sort((a, b) => b[1] - a[1]);
const levelAfter = (t) => { let q = 0; const a = Math.round(t * SR), b = Math.min(x.length, a + Math.round(0.05 * SR)); for (let i = a; i < b; i++) q += x[i] * x[i]; return q / Math.max(1, b - a); };
const cands = [...beats, ...peaks.slice(0, 40).map(([t0]) => t0)].map((t0) => attackNear(t0) ?? t0).map((t) => [t, levelAfter(t)]).sort((a, b) => b[1] - a[1]), hits = [];
for (const [t] of cands) { if (hits.length === 8) break; if (hits.every((h) => Math.abs(h - t) >= 0.25)) hits.push(t); }
hits.sort((a, b) => a - b);
const nearest = (t) => { const k = Math.round((t - phase) / period); return { beat: k, ms: Math.round((t - (phase + k * period)) * 1000) }; };

// --- loudness in 100 ms windows: the loudest, and drops at least 10 dB under the median for 0.4 s or more
const W100 = SR / 10, db = [];
for (let w = 0; (w + 1) * W100 <= x.length; w++) { let q = 0; for (let i = w * W100; i < (w + 1) * W100; i++) q += x[i] * x[i]; db.push(10 * Math.log10(q / W100 + 1e-20)); }
const median = [...db].sort((a, b) => a - b)[Math.floor(db.length / 2)], L = db.indexOf(Math.max(...db)), quiet = [];
{ let from = null; for (let w = 0; w <= db.length; w++) { const q = w < db.length && db[w] < median - 10; if (q && from === null) from = w; else if (!q && from !== null) { if (w - from >= 4) quiet.push([from / 10, w / 10]); from = null; } } }

// --- other tempos a listener might count: half, double, two-thirds and three-halves time, by the same weighted score
const others = [0.5, 2, 2 / 3, 1.5].map((m) => bpm * m).filter((b) => b >= 40 && b <= 300).map((b) => ({ bpm: +b.toFixed(2), score: +(scoreAt(b) * prior(b) / (scoreAt(bpm) * prior(bpm))).toFixed(2) }));

const out = {
  track, start, seconds: +dur.toFixed(3), bpm: +bpm.toFixed(2), beat: +period.toFixed(4), firstBeat: +phase.toFixed(3),
  beats, hits: hits.map((t) => ({ t: +t.toFixed(3), ...nearest(t) })), loudest: { t: L / 10, db: +db[L].toFixed(1) },
  quiet, otherTempos: others,
};
console.log(`tempo: ${out.bpm} BPM (${out.beat} s a beat), first beat at ${out.firstBeat} s, ${beats.length} beats in ${out.seconds} s`);
console.log(`other tempos, score against this one: ${others.map((o) => `${o.bpm} (${o.score})`).join(', ')}`);
console.log(`hits: ${out.hits.map((h) => `${h.t} s (beat ${h.beat}${h.ms ? `, ${h.ms > 0 ? '+' : ''}${h.ms} ms` : ''})`).join(', ')}`);
console.log(`loudest 100 ms at ${out.loudest.t} s (${out.loudest.db} dBFS); quiet drops: ${quiet.length ? quiet.map(([a, b]) => `${a}-${b} s`).join(', ') : 'none'}`);
if (opt('out')) { fs.writeFileSync(opt('out'), JSON.stringify(out, null, 1)); console.log(`wrote ${opt('out')}`); }
