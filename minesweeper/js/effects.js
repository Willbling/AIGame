window.MS = window.MS || {};

MS.effects = {
  particles: [],
  raf: 0,

  resize() {
    const wrap = document.getElementById('boardWrap');
    const canvas = document.getElementById('fxCanvas');
    if (!wrap || !canvas) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx = ctx;
  },

  burst(el, kind) {
    if (!el || MS.state.theme !== 'ocean') return;
    const wrap = document.getElementById('boardWrap');
    if (!wrap) return;
    const host = wrap.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const x = rect.left - host.left + rect.width / 2;
    const y = rect.top - host.top + rect.height / 2;
    const explode = kind === 'explode';
    const count = explode ? 34 : 18;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = explode ? 1.4 + Math.random() * 3.4 : 0.6 + Math.random() * 2.2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (explode ? 0.4 : 0.8),
        life: 1,
        decay: explode ? 0.012 + Math.random() * 0.012 : 0.018 + Math.random() * 0.02,
        radius: explode ? 1.6 + Math.random() * 2.4 : 1.1 + Math.random() * 1.6,
        color: explode
          ? (Math.random() > 0.55 ? '160, 220, 255' : '126, 92, 255')
          : (Math.random() > 0.35 ? '150, 230, 255' : '235, 250, 255')
      });
    }
    this.kick();
  },

  kick() {
    if (this.raf) return;
    const step = () => {
      this.draw();
      if (this.particles.length) this.raf = requestAnimationFrame(step);
      else this.raf = 0;
    };
    this.raf = requestAnimationFrame(step);
  },

  draw() {
    if (!this.ctx) this.resize();
    const canvas = document.getElementById('fxCanvas');
    if (!this.ctx || !canvas) return;
    const ctx = this.ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    const next = [];
    for (const p of this.particles) {
      p.life -= p.decay;
      if (p.life <= 0) continue;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.color}, ${Math.max(p.life, 0)})`;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      next.push(p);
    }
    this.particles = next;
  }
};
