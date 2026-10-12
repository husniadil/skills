// A 65 Hz sine started a quarter period before its crest at 0.1 s, its envelope starting 1 ms before the crest
// (sound.md, Timing): the largest sample before the envelope starts, with and without gain.setValueAtTime(0, 0)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch(), p = await b.newPage();
for (const zero of [false, true]) {
  const r = await p.evaluate(async (zero) => {
    const ctx = new OfflineAudioContext(1, 48000 * 0.2, 48000), f = 65.41, t = 0.1, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
    if (zero) g.gain.setValueAtTime(0, 0);
    g.gain.setValueAtTime(0, t - 0.001); g.gain.linearRampToValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.start(t - 1 / (4 * f)); o.stop(t + 0.35);
    const x = (await ctx.startRendering()).getChannelData(0); let before = 0, hit = 0;
    for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i]); if (i < (t - 0.001) * 48000) before = Math.max(before, v); else hit = Math.max(hit, v); }
    return { before, hit };
  }, zero);
  console.log(zero ? 'with setValueAtTime(0, 0):' : 'without:', `largest sample before the envelope ${r.before.toFixed(3)}, the hit's own peak ${r.hit.toFixed(3)}`);
}
await b.close();
