window.MS = window.MS || {};

MS.sound = {
  enabled: true,
  ctx: null,
  storageKey: 'minesweeper-sound',

  load() {
    try {
      this.enabled = localStorage.getItem(this.storageKey) !== '0';
    } catch (err) {
      this.enabled = true;
    }
  },

  save() {
    try {
      localStorage.setItem(this.storageKey, this.enabled ? '1' : '0');
    } catch (err) { /* 无法写入时只在本次会话生效 */ }
  },

  ensure() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) this.ctx = new AudioCtx();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  toggle() {
    this.enabled = !this.enabled;
    this.save();
    if (this.enabled) this.play('on');
    return this.enabled;
  },

  tone(freq, duration, type, volume, delay) {
    const ctx = this.ctx;
    const start = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  },

  noise(duration, volume, delay) {
    const ctx = this.ctx;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(ctx.currentTime + (delay || 0));
  },

  play(name) {
    if (!this.enabled) return;
    if (!this.ensure()) return;
    if (name === 'reveal') this.tone(620, 0.07, 'sine', 0.08);
    else if (name === 'open') {
      this.tone(420, 0.09, 'triangle', 0.06);
      this.tone(560, 0.1, 'sine', 0.04, 0.04);
    } else if (name === 'flag') this.tone(880, 0.06, 'square', 0.04);
    else if (name === 'question') this.tone(540, 0.08, 'triangle', 0.05);
    else if (name === 'unmark') this.tone(360, 0.05, 'sine', 0.04);
    else if (name === 'chord') {
      this.tone(520, 0.06, 'sine', 0.06);
      this.tone(700, 0.08, 'sine', 0.05, 0.05);
    } else if (name === 'explode') {
      this.noise(0.28, 0.18);
      this.tone(110, 0.32, 'sawtooth', 0.08);
    } else if (name === 'win') {
      this.tone(523, 0.1, 'sine', 0.07);
      this.tone(659, 0.1, 'sine', 0.07, 0.1);
      this.tone(784, 0.18, 'sine', 0.08, 0.2);
    } else if (name === 'lose') {
      this.tone(220, 0.16, 'triangle', 0.07, 0.05);
      this.tone(140, 0.28, 'sine', 0.08, 0.16);
    } else if (name === 'on') this.tone(740, 0.08, 'sine', 0.06);
  }
};

MS.sound.load();
