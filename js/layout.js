// Normalized master coordinate system(s). All positions/radii are defined
// in design units on a fixed-size canvas (desktop: 1000x1000, portrait:
// 700x1000) and later scaled uniformly to the viewport — see
// fitToViewport(). Geometry here is pure/testable; DOM creation is kept in
// createLayout() below.
//
// Digit symmetry (brief): 0/9 lowest & level, 1<->8, 2<->7, 3<->6, 4<->5,
// with the empty apex gap between 4 and 5 (no digit at top-center).
import { renderBaseLayer, renderOrnamentLayer } from './frameRenderer.js';

const DIGIT_PAIRS = [
  { angleDeg: 14, left: 4, right: 5 },
  { angleDeg: 32, left: 3, right: 6 },
  { angleDeg: 50, left: 2, right: 7 },
  { angleDeg: 68, left: 1, right: 8 },
  { angleDeg: 86, left: 0, right: 9 },
];

// Row 1 (primary) left-to-right: + − C = ⌫ × ÷. C sits directly left of =,
// ⌫ directly right of =; +/− lower-left, ×/÷ lower-right (brief). Angles
// are measured from straight-down (0°), positive = toward the right.
const ROW1_LAYOUT = [
  { id: 'plus', angleDeg: -58 },
  { id: 'minus', angleDeg: -38 },
  { id: 'clear', angleDeg: -18 },
  { id: 'equals', angleDeg: 0 },
  { id: 'backspace', angleDeg: 18 },
  { id: 'multiply', angleDeg: 38 },
  { id: 'divide', angleDeg: 58 },
];

// Row 2 (secondary), centered under =, left to right: ( +/- , )
const ROW2_LAYOUT = [
  { id: 'lparen', xFactor: -2.2 },
  { id: 'negate', xFactor: -0.75 },
  { id: 'decimal', xFactor: 0.75 },
  { id: 'rparen', xFactor: 2.2 },
];

function polarFromTop(cx, cy, radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.sin(rad), y: cy - radius * Math.cos(rad) };
}

function polarFromBottom(cx, cy, radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.sin(rad), y: cy + radius * Math.cos(rad) };
}

function buildMaster({ cx, cy, orbR }) {
  const smallR = orbR * 0.14;
  const eqR = orbR * 0.18;
  const digitRadius = orbR + smallR * 0.55;
  const row1Radius = orbR + smallR * 0.6;

  const digits = [];
  for (const { angleDeg, left, right } of DIGIT_PAIRS) {
    const l = polarFromTop(cx, cy, digitRadius, -angleDeg);
    const r = polarFromTop(cx, cy, digitRadius, angleDeg);
    digits.push({ digit: left, x: l.x, y: l.y, r: smallR });
    digits.push({ digit: right, x: r.x, y: r.y, r: smallR });
  }
  digits.sort((a, b) => a.digit - b.digit);

  const controlsPrimary = ROW1_LAYOUT.map(({ id, angleDeg }) => {
    const p = polarFromBottom(cx, cy, row1Radius, angleDeg);
    return { id, x: p.x, y: p.y, r: id === 'equals' ? eqR : smallR };
  });

  const equalsPos = controlsPrimary.find((c) => c.id === 'equals');
  const row2Y = equalsPos.y + smallR * 2.3;
  const controlsSecondary = ROW2_LAYOUT.map(({ id, xFactor }) => ({
    id,
    x: cx + xFactor * smallR,
    y: row2Y,
    r: smallR,
  }));

  const candle = {
    x: cx + orbR * 1.05,
    y: cy + orbR * 1.35,
    r: orbR * 0.13,
  };

  // Fit the master canvas tightly around the actual composition (plus a
  // safety margin for glow/ornament) instead of an arbitrary fixed size, so
  // fitToViewport's "85-90% of viewport height" applies to the real
  // artifact bounds (brief), not to unused canvas padding.
  const circles = [{ ...candle }, { x: cx, y: cy, r: orbR }, ...digits, ...controlsPrimary, ...controlsSecondary];
  const margin = orbR * 0.15;
  const minX = Math.min(...circles.map((c) => c.x - c.r)) - margin;
  const maxX = Math.max(...circles.map((c) => c.x + c.r)) + margin;
  const minY = Math.min(...circles.map((c) => c.y - c.r)) - margin;
  const maxY = Math.max(...circles.map((c) => c.y + c.r)) + margin;

  const shift = (p) => ({ ...p, x: p.x - minX, y: p.y - minY });

  return {
    width: maxX - minX,
    height: maxY - minY,
    orb: { cx: cx - minX, cy: cy - minY, r: orbR },
    digits: digits.map(shift),
    controlsPrimary: controlsPrimary.map(shift),
    controlsSecondary: controlsSecondary.map(shift),
    candle: shift(candle),
    smallSphereRadius: smallR,
    equalsSphereRadius: eqR,
  };
}

export function computeDesktopMaster() {
  return buildMaster({ cx: 500, cy: 400, orbR: 280 });
}

export function computePortraitMaster() {
  return buildMaster({ cx: 350, cy: 340, orbR: 260 });
}

const DESKTOP_MASTER = computeDesktopMaster();
const PORTRAIT_MASTER = computePortraitMaster();

// Smartphone portrait gets its own master; desktop/tablet and phone
// landscape share the standard one (brief).
export function pickMaster(viewportWidth, viewportHeight) {
  const aspect = viewportWidth / viewportHeight;
  return aspect < 0.75 ? PORTRAIT_MASTER : DESKTOP_MASTER;
}

const VIEWPORT_FILL_RATIO = 0.87; // 85-90% of usable viewport height (brief)

const CONTROL_LABELS = {
  plus: '+',
  minus: '−',
  clear: 'C',
  equals: '=',
  backspace: '←',
  multiply: '×',
  divide: '÷',
  lparen: '(',
  rparen: ')',
  negate: '+/−',
  decimal: ',',
};

function svgLayer(className) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', className);
  return svg;
}

export function createLayout(rootEl) {
  let currentMaster = null;

  function render(master) {
    rootEl.innerHTML = '';
    rootEl.style.width = `${master.width}px`;
    rootEl.style.height = `${master.height}px`;

    const sphere = (key, { x, y, r }, extraClass = '', label = '') => {
      const el = document.createElement('div');
      el.className = `sphere ${extraClass}`.trim();
      el.dataset.key = key;
      el.style.left = `${x - r}px`;
      el.style.top = `${y - r}px`;
      el.style.width = `${r * 2}px`;
      el.style.height = `${r * 2}px`;
      el.style.fontSize = `${r * 0.9}px`;
      if (label) {
        const labelEl = document.createElement('span');
        labelEl.className = 'sphere-label';
        labelEl.textContent = label;
        el.appendChild(labelEl);
      }
      rootEl.appendChild(el);
      return el;
    };

    // Layer order (back to front): base plate (metal) -> main orb (crystal)
    // -> small spheres (crystal) -> ornaments (metal struts/prongs that
    // visually grip each sphere) -> candle.
    const baseLayer = svgLayer('frame-layer frame-layer--base');
    rootEl.appendChild(baseLayer);
    renderBaseLayer(baseLayer, master);

    const orbEl = document.createElement('div');
    orbEl.className = 'main-orb';
    orbEl.style.left = `${master.orb.cx - master.orb.r}px`;
    orbEl.style.top = `${master.orb.cy - master.orb.r}px`;
    orbEl.style.width = `${master.orb.r * 2}px`;
    orbEl.style.height = `${master.orb.r * 2}px`;
    rootEl.appendChild(orbEl);

    for (const d of master.digits) {
      sphere(`digit-${d.digit}`, d, 'sphere--digit', String(d.digit));
    }
    for (const c of master.controlsPrimary) {
      sphere(c.id, c, `sphere--control sphere--${c.id}`, CONTROL_LABELS[c.id]);
    }
    for (const c of master.controlsSecondary) {
      sphere(c.id, c, `sphere--control sphere--${c.id}`, CONTROL_LABELS[c.id]);
    }

    const ornamentLayer = svgLayer('frame-layer frame-layer--ornament');
    rootEl.appendChild(ornamentLayer);
    renderOrnamentLayer(ornamentLayer, master);

    const candleEl = document.createElement('div');
    candleEl.className = 'candle';
    candleEl.dataset.key = 'candle';
    candleEl.style.left = `${master.candle.x - master.candle.r}px`;
    candleEl.style.top = `${master.candle.y - master.candle.r}px`;
    candleEl.style.width = `${master.candle.r * 2}px`;
    candleEl.style.height = `${master.candle.r * 2}px`;
    rootEl.appendChild(candleEl);

    const flameEl = document.createElement('div');
    flameEl.className = 'candle-flame';
    candleEl.appendChild(flameEl);
  }

  function fitToViewport() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const master = pickMaster(vw, vh);
    if (master !== currentMaster) {
      currentMaster = master;
      render(master);
    }
    const scale = Math.min((vh * VIEWPORT_FILL_RATIO) / master.height, vw / master.width);
    rootEl.style.transform = `scale(${scale})`;
  }

  window.addEventListener('resize', fitToViewport);
  fitToViewport();

  return { fitToViewport, getMaster: () => currentMaster };
}
