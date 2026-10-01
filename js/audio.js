// 全部音效用 WebAudio 即时合成：不用下载音档，也不会有格式兼容问题。
let ctx = null, master = null, muted = false, cricketTimer = null;

export function unlock() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}
export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.55; }
export function isMuted() { return muted; }

function tone(freq, dur, { type = 'sine', vol = 0.3, at = 0, slide = 0 } = {}) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
}

function noiseBurst(dur, { vol = 0.3, at = 0, freq = 1200, q = 0.8 } = {}) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + at;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(f).connect(g).connect(master); src.start(t);
}

export const sfx = {
  click: () => tone(880, 0.07, { type: 'triangle', vol: 0.12 }),
  torch: () => { noiseBurst(0.04, { vol: 0.5, freq: 3000, q: 2 }); tone(1500, 0.04, { type: 'square', vol: 0.05 }); },
  powerOff: () => { noiseBurst(0.12, { vol: 0.6, freq: 500 }); tone(110, 0.6, { type: 'sawtooth', vol: 0.12, slide: -70 }); },
  powerOn: () => { tone(70, 0.5, { type: 'sawtooth', vol: 0.08, slide: 60 }); tone(660, 0.25, { vol: 0.1, at: 0.35 }); },
  collect: (i = 0) => { const n = [523, 587, 659, 784, 880, 988, 1047]; tone(n[i % n.length], 0.25, { type: 'triangle', vol: 0.18 }); tone(n[i % n.length] * 2, 0.18, { vol: 0.05, at: 0.05 }); },
  step: (i = 0) => { noiseBurst(0.06, { vol: 0.35, freq: 400 + i * 60, q: 1.4 }); tone(392 + i * 33, 0.12, { type: 'triangle', vol: 0.08 }); },
  soft: () => tone(220, 0.18, { type: 'sine', vol: 0.12, slide: -40 }),
  door: () => { tone(300, 0.35, { type: 'sawtooth', vol: 0.04, slide: 180 }); noiseBurst(0.08, { vol: 0.3, freq: 250, at: 0.3 }); },
  success: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.14, at: i * 0.09 })); },
  tick: () => tone(1200, 0.05, { type: 'square', vol: 0.05 }),
  dawn: () => { [392, 494, 587, 784].forEach((f, i) => tone(f, 0.9, { vol: 0.08, at: i * 0.22 })); },
};

// 夜晚虫鸣（很小声，让黑暗不那么吓人）
export function crickets(on) {
  clearInterval(cricketTimer);
  if (!on) return;
  cricketTimer = setInterval(() => {
    if (!ctx || muted || Math.random() < 0.35) return;
    const base = 4200 + Math.random() * 600;
    for (let k = 0; k < 3; k++) tone(base, 0.035, { vol: 0.018, at: k * 0.06 });
  }, 900);
}
