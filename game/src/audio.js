/** Tiny Web Audio synthesizer: no asset files. */
export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let ambient = null;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }

  function beep({ freq = 440, dur = 0.08, type = 'sine', gain = 0.3, slide = 0, delay = 0 }) {
    if (muted) return;
    ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  return {
    resume() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    toggleMute() { muted = !muted; if (muted && ambient) { try { ambient.stop(); } catch (_) {} ambient = null; } return muted; },
    isMuted() { return muted; },
    startAmbient() {
      if (muted) return;
      ensure();
      if (!ctx || ambient) return;
      if (ctx.state === 'suspended') ctx.resume();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 55;
      lfo.frequency.value = 0.08;
      lfoG.gain.value = 12;
      lfo.connect(lfoG);
      lfoG.connect(o.frequency);
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(master);
      o.start();
      lfo.start();
      ambient = { stop() { o.stop(); lfo.stop(); } };
    },
    ui() { beep({ freq: 660, dur: 0.05, type: 'triangle', gain: 0.2 }); },
    start() { beep({ freq: 220, dur: 0.12, type: 'sawtooth', gain: 0.15, slide: 220 }); beep({ freq: 440, dur: 0.1, type: 'triangle', gain: 0.18, delay: 0.08 }); },
    wakeSet() { beep({ freq: 880, dur: 0.04, type: 'sine', gain: 0.08 }); },
    hit() { beep({ freq: 180, dur: 0.16, type: 'square', gain: 0.18, slide: -120 }); },
    kill() { beep({ freq: 520, dur: 0.07, type: 'triangle', gain: 0.22, slide: 300 }); beep({ freq: 780, dur: 0.1, type: 'sine', gain: 0.12, delay: 0.05 }); },
    core() { beep({ freq: 740, dur: 0.09, type: 'sine', gain: 0.2 }); beep({ freq: 980, dur: 0.12, type: 'triangle', gain: 0.14, delay: 0.05 }); },
    hurt() { beep({ freq: 120, dur: 0.2, type: 'sawtooth', gain: 0.25, slide: -80 }); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => beep({ freq: f, dur: 0.18, type: 'triangle', gain: 0.18, delay: i * 0.1 }));
    },
    lose() { beep({ freq: 300, dur: 0.35, type: 'sawtooth', gain: 0.2, slide: -200 }); },
    wave() { beep({ freq: 400, dur: 0.08, type: 'triangle', gain: 0.15 }); beep({ freq: 600, dur: 0.12, type: 'sine', gain: 0.12, delay: 0.1 }); },
  };
}
