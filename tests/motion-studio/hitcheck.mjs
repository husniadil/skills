// A hit on frame F at 30 fps, built two ways, measured as the first sample reaching 90% of the hit's peak in its first 30 ms.
import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage();
const r = await p.evaluate(async () => {
  const sr = 48000, fps = 30, F = 15, tHit = (F + 1) / fps, f = 880;
  async function render(endAttackOnFrame) {
    const ac = new OfflineAudioContext(1, sr, sr), o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = f; o.connect(g).connect(ac.destination);
    const atk = 0.00075;
    if (endAttackOnFrame) {
      // envelope ends its attack on the frame; the sine starts a quarter period early so the frame sample is a crest
      g.gain.setValueAtTime(0, tHit - atk); g.gain.linearRampToValueAtTime(1, tHit); g.gain.exponentialRampToValueAtTime(0.001, tHit + 0.2);
      o.start(tHit - 1 / f / 4);
    } else {
      // the ambiguous reading: attack starts on the frame, sine from phase 0
      g.gain.setValueAtTime(0, tHit); g.gain.linearRampToValueAtTime(1, tHit + atk); g.gain.exponentialRampToValueAtTime(0.001, tHit + atk + 0.2);
      o.start(tHit);
    }
    o.stop(tHit + 0.3);
    const x = (await ac.startRendering()).getChannelData(0), s0 = Math.round((tHit - 0.002) * sr), s1 = Math.round((tHit + 0.03) * sr);
    let peak = 0; for (let i = s0; i < s1; i++) peak = Math.max(peak, Math.abs(x[i]));
    let first = s0; while (Math.abs(x[first]) < 0.9 * peak) first++;
    return ((first / sr - tHit) * 1000).toFixed(3) + ' ms';
  }
  return { attackEndsOnFrame: await render(true), attackStartsOnFrame: await render(false) };
});
console.log(r); await b.close();
