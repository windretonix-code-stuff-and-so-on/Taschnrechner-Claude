// Transparent Canvas 2D reactive particle system for the orb's rear/front
// smoke layers. Kept deliberately simple/cheap (soft radial-gradient
// "puffs" instead of per-particle blur filters) so it stays smooth on
// modest hardware, including future phones (brief performance note).
//
// Density model: instead of tracking the exact pixel origin of every
// hidden character (which would need tight coupling to text layout/fonts),
// hidden-character *count* drives a target particle density that the
// system eases toward — smoke visibly thickens as characters are pushed
// out of the 9-char window and thins as they return. This is the
// documented "intentional freedom" interpretation of the accumulation/
// restoration behavior described in the brief.

const MAX_DPR = 2;
const IDLE_PARTICLES = 5;
const PER_HIDDEN_PARTICLES = 1.4;
const MAX_DENSITY_PARTICLES = 26;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

class Particle {
  constructor(layer, cx, cy, radius) {
    this.layer = layer;
    this.respawn(cx, cy, radius);
  }

  respawn(cx, cy, radius) {
    const angle = rand(0, Math.PI * 2);
    const dist = rand(0, radius * 0.85);
    this.x = cx + Math.cos(angle) * dist;
    this.y = cy + Math.sin(angle) * dist;
    this.vx = rand(-4, 4);
    this.vy = rand(-8, -2);
    this.r = rand(radius * 0.06, radius * 0.16);
    this.alpha = 0;
    this.targetAlpha = rand(0.06, 0.16);
    this.hue = 'rgba(150,165,255,';
    this.age = 0;
    this.attract = false;
  }
}

export function createSmokeRenderer({ rearCanvas, frontCanvas }) {
  const layers = { rear: { canvas: rearCanvas, ctx: null, w: 0, h: 0 }, front: { canvas: frontCanvas, ctx: null, w: 0, h: 0 } };
  const particles = [];
  let targetDensity = IDLE_PARTICLES;
  let turbulent = false;
  let condensing = false;
  let rafId = null;
  let lastT = performance.now();

  function resize() {
    for (const layer of Object.values(layers)) {
      const rect = layer.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      layer.canvas.width = Math.max(1, Math.round(rect.width * dpr));
      layer.canvas.height = Math.max(1, Math.round(rect.height * dpr));
      layer.ctx = layer.canvas.getContext('2d');
      layer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layer.w = rect.width;
      layer.h = rect.height;
    }
  }

  function center() {
    const { w, h } = layers.rear;
    return { cx: w / 2, cy: h / 2, radius: Math.min(w, h) / 2 };
  }

  function setHiddenCount(count) {
    targetDensity = IDLE_PARTICLES + Math.min(count, 18) * PER_HIDDEN_PARTICLES;
    targetDensity = Math.min(targetDensity, MAX_DENSITY_PARTICLES);
  }

  function setTurbulent(on) {
    turbulent = on;
  }

  // A burst of particles pulled toward the orb's center, briefly forming a
  // dense bright/dark cloud — used for the result condensation and the
  // error sequence's initial turbulence build-up.
  function burst(count, opts = {}) {
    const { cx, cy, radius } = center();
    for (let i = 0; i < count; i += 1) {
      const p = new Particle(opts.layer ?? (i % 2 === 0 ? 'rear' : 'front'), cx, cy, radius);
      p.attract = true;
      p.targetAlpha = rand(0.18, 0.34);
      if (opts.dark) p.hue = 'rgba(70,30,90,';
      particles.push(p);
    }
  }

  function step(dt) {
    const { cx, cy, radius } = center();

    // ease particle count toward target density
    const desired = Math.round(condensing ? targetDensity * 1.6 : targetDensity);
    while (particles.length < desired) particles.push(new Particle(Math.random() < 0.5 ? 'rear' : 'front', cx, cy, radius));
    while (particles.length > desired && particles.length > 0) {
      const idx = particles.findIndex((p) => !p.attract);
      if (idx === -1) break;
      particles.splice(idx, 1);
    }

    for (const p of particles) {
      p.age += dt;
      p.alpha += (p.targetAlpha - p.alpha) * Math.min(1, dt * 3);

      if (p.attract) {
        const dx = cx - p.x;
        const dy = cy - p.y;
        p.vx += dx * 0.0006 * dt;
        p.vy += dy * 0.0006 * dt;
      }
      if (turbulent) {
        p.vx += rand(-0.4, 0.4);
        p.vy += rand(-0.4, 0.4);
      }
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      p.vx *= 0.96;
      p.vy *= 0.96;

      const dist = Math.hypot(p.x - cx, p.y - cy);
      if (dist > radius * 1.05 && !p.attract) {
        p.respawn(cx, cy, radius);
      }
    }
  }

  function draw() {
    for (const layer of Object.values(layers)) {
      if (layer.ctx) layer.ctx.clearRect(0, 0, layer.w, layer.h);
    }
    for (const p of particles) {
      const layer = layers[p.layer];
      if (!layer.ctx) continue;
      const grad = layer.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, `${p.hue}${p.alpha})`);
      grad.addColorStop(1, `${p.hue}0)`);
      layer.ctx.fillStyle = grad;
      layer.ctx.beginPath();
      layer.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      layer.ctx.fill();
    }
  }

  function loop(t) {
    const dt = Math.min(48, t - lastT);
    lastT = t;
    step(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    resize();
    lastT = performance.now();
    if (rafId === null) rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function rebind(newRearCanvas, newFrontCanvas) {
    layers.rear.canvas = newRearCanvas;
    layers.front.canvas = newFrontCanvas;
    resize();
  }

  return {
    start,
    stop,
    resize,
    rebind,
    setHiddenCount,
    setTurbulent,
    burst,
    setCondensing: (on) => {
      condensing = on;
    },
    reset: () => {
      particles.length = 0;
      targetDensity = IDLE_PARTICLES;
      turbulent = false;
      condensing = false;
    },
  };
}
