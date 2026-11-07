/* Original Web Audio for Haven's Garden — pick, plant, water, bloom, buzz, day-cycle, UI */
'use strict';

const AudioFX = (() => {
  let ac = null;
  let master = null;
  let muted = false;
  let voices = 0;
  const MAX_VOICES = 8;

  function ensure() {
    try {
      if (!ac) {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain();
        master.gain.value = 0.22;
        master.connect(ac.destination);
      }
      if (ac.state === 'suspended') ac.resume();
    } catch (e) {}
    return ac;
  }

  function setMuted(m) {
    muted = !!m;
    if (master) master.gain.value = muted ? 0 : 0.22;
  }

  function tone(freq, dur, type, vol, slide) {
    if (muted || !ensure() || voices >= MAX_VOICES) return;
    try {
      voices++;
      const t = ac.currentTime;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      const v = (vol == null ? 0.1 : vol);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + dur + 0.03);
      setTimeout(() => { voices = Math.max(0, voices - 1); }, dur * 1000 + 50);
    } catch (e) {
      voices = Math.max(0, voices - 1);
    }
  }

  function noiseBurst(dur, vol, hp) {
    if (muted || !ensure() || voices >= MAX_VOICES) return;
    try {
      voices++;
      const t = ac.currentTime;
      const n = ac.createBuffer(1, Math.max(1, (ac.sampleRate * dur) | 0), ac.sampleRate);
      const data = n.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = ac.createBufferSource();
      src.buffer = n;
      const g = ac.createGain();
      const f = ac.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = hp || 1200;
      g.gain.setValueAtTime(vol || 0.04, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(master);
      src.start(t);
      src.stop(t + dur + 0.02);
      setTimeout(() => { voices = Math.max(0, voices - 1); }, dur * 1000 + 40);
    } catch (e) {
      voices = Math.max(0, voices - 1);
    }
  }

  return {
    ensure,
    setMuted,
    isMuted: () => muted,
    ui() { tone(520, 0.05, 'triangle', 0.05); },
    rustle() { noiseBurst(0.08, 0.03, 800); tone(170, 0.05, 'triangle', 0.02); },
    /** Soft scraped-knee / bump — quiet enough for a preschooler. */
    ouch() {
      noiseBurst(0.07, 0.025, 600);
      tone(220, 0.09, 'triangle', 0.04);
      setTimeout(() => tone(180, 0.08, 'sine', 0.03), 40);
    },
    bloom() { tone(560, 0.08, 'sine', 0.07); setTimeout(() => tone(720, 0.09, 'sine', 0.06), 45); },
    pick(n) {
      const f = 440 + (n % 8) * 30;
      tone(f, 0.09, 'triangle', 0.12);
      tone(f * 1.5, 0.07, 'sine', 0.05);
      noiseBurst(0.05, 0.02, 1800);
    },
    bouquetFull() {
      tone(392, 0.1, 'sine', 0.11);
      setTimeout(() => tone(523, 0.12, 'sine', 0.1), 70);
      setTimeout(() => tone(659, 0.16, 'sine', 0.11), 150);
    },
    plant() {
      tone(330, 0.22, 'sine', 0.11, 720);
      setTimeout(() => tone(880, 0.16, 'sine', 0.08), 140);
      noiseBurst(0.1, 0.03, 400);
    },
    water() {
      noiseBurst(0.18, 0.05, 1400);
      tone(480, 0.08, 'sine', 0.07);
      setTimeout(() => tone(620, 0.1, 'triangle', 0.06), 50);
    },
    door() {
      tone(240, 0.12, 'triangle', 0.07);
      setTimeout(() => tone(360, 0.14, 'sine', 0.08), 90);
    },
    night() {
      tone(260, 0.4, 'sine', 0.07, 140);
      setTimeout(() => tone(196, 0.5, 'sine', 0.05), 200);
    },
    sunrise() {
      tone(523, 0.12, 'sine', 0.11);
      setTimeout(() => tone(659, 0.14, 'sine', 0.1), 90);
      setTimeout(() => tone(784, 0.18, 'sine', 0.09), 190);
    },
    grow() {
      tone(440, 0.1, 'sine', 0.08, 880);
      setTimeout(() => tone(990, 0.16, 'triangle', 0.07), 120);
    },
    upgrade() {
      tone(392, 0.12, 'sine', 0.12);
      setTimeout(() => tone(659, 0.14, 'sine', 0.11), 120);
      setTimeout(() => tone(988, 0.22, 'sine', 0.1), 260);
    },
    bee() {
      // gentle buzz looplet
      if (muted || !ensure()) return;
      try {
        const t = ac.currentTime;
        const o = ac.createOscillator();
        const o2 = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'sawtooth';
        o2.type = 'sine';
        o.frequency.setValueAtTime(120, t);
        o.frequency.linearRampToValueAtTime(150, t + 0.35);
        o2.frequency.value = 40;
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(0.03, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        o.connect(g);
        o2.connect(g);
        g.connect(master);
        o.start(t);
        o2.start(t);
        o.stop(t + 0.42);
        o2.stop(t + 0.42);
      } catch (e) {}
    },
    flutter() {
      tone(880, 0.04, 'sine', 0.03);
      setTimeout(() => tone(990, 0.04, 'triangle', 0.025), 40);
    },
    suspend() { try { ac && ac.suspend(); } catch (e) {} },
    resume() { try { ac && ac.resume(); } catch (e) {} }
  };
})();

window.AudioFX = AudioFX;
