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

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

// A purpose-built (not a scaled static image) old-wizard face: procedural
// SVG shapes animated via CSS classes (.is-laughing / .is-visible) so head,
// beard and mouth genuinely move in sync with the 3 laugh impulses
// (animationController.js drives the classes; audioController.js drives
// the actual sound in feature/audio-candle).
function buildWizard() {
  const wrap = document.createElement('div');
  wrap.className = 'wizard';

  const svg = el('svg', { viewBox: '0 0 200 160', class: 'wizard-svg' });

  const defs = el('defs', {});
  const skinGrad = el('radialGradient', { id: 'wizardSkin', cx: '45%', cy: '35%', r: '70%' });
  skinGrad.appendChild(el('stop', { offset: '0%', 'stop-color': '#d9b98a' }));
  skinGrad.appendChild(el('stop', { offset: '60%', 'stop-color': '#a9825a' }));
  skinGrad.appendChild(el('stop', { offset: '100%', 'stop-color': '#5c4230' }));
  defs.appendChild(skinGrad);
  const beardGrad = el('linearGradient', { id: 'wizardBeard', x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
  beardGrad.appendChild(el('stop', { offset: '0%', 'stop-color': '#e8e4da' }));
  beardGrad.appendChild(el('stop', { offset: '100%', 'stop-color': '#8f8a7c' }));
  defs.appendChild(beardGrad);
  svg.appendChild(defs);

  // beard (drawn first, sits behind/below the head, its lower contour
  // fades into the smoke via a CSS mask)
  svg.appendChild(
    el('path', {
      class: 'wizard-beard',
      d: 'M55 78 C50 130, 70 155, 100 158 C130 155, 150 130, 145 78 C130 100, 70 100, 55 78 Z',
      fill: 'url(#wizardBeard)',
    })
  );

  // head
  svg.appendChild(el('ellipse', { cx: '100', cy: '62', rx: '46', ry: '50', fill: 'url(#wizardSkin)' }));

  // eyebrows
  svg.appendChild(el('path', { class: 'wizard-brow', d: 'M68 48 Q80 38 94 46', fill: 'none', stroke: '#3a2c1e', 'stroke-width': '5', 'stroke-linecap': 'round' }));
  svg.appendChild(el('path', { class: 'wizard-brow', d: 'M106 46 Q120 38 132 48', fill: 'none', stroke: '#3a2c1e', 'stroke-width': '5', 'stroke-linecap': 'round' }));

  // eyes (amused/mischievous: slightly narrowed)
  svg.appendChild(el('path', { class: 'wizard-eye', d: 'M70 58 Q80 52 90 58', fill: 'none', stroke: '#1a120c', 'stroke-width': '4', 'stroke-linecap': 'round' }));
  svg.appendChild(el('path', { class: 'wizard-eye', d: 'M110 58 Q120 52 130 58', fill: 'none', stroke: '#1a120c', 'stroke-width': '4', 'stroke-linecap': 'round' }));

  // nose
  svg.appendChild(el('path', { d: 'M98 55 Q94 72 100 76 Q106 74 102 68', fill: 'none', stroke: '#5c4230', 'stroke-width': '3', 'stroke-linecap': 'round' }));

  // mouth (animated open/close for the laugh)
  svg.appendChild(el('path', { class: 'wizard-mouth', d: 'M82 84 Q100 88 118 84', fill: 'none', stroke: '#3a2418', 'stroke-width': '5', 'stroke-linecap': 'round' }));

  // moustache
  svg.appendChild(el('path', { d: 'M74 80 Q88 90 100 82 Q112 90 126 80', fill: 'none', stroke: '#c9c4b6', 'stroke-width': '6', 'stroke-linecap': 'round' }));

  wrap.appendChild(svg);
  return wrap;
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

    // Orb content stack (back to front): rear smoke -> display text ->
    // wizard (error sequence) -> front smoke -> (front glass highlight is
    // the .main-orb box-shadow itself).
    const rearCanvas = document.createElement('canvas');
    rearCanvas.className = 'smoke-canvas smoke-canvas--rear';
    orbEl.appendChild(rearCanvas);

    const displayEl = document.createElement('div');
    displayEl.className = 'display';
    displayEl.style.fontSize = `${master.orb.r * 0.22}px`;
    orbEl.appendChild(displayEl);

    const wizardEl = buildWizard();
    orbEl.appendChild(wizardEl);

    const frontCanvas = document.createElement('canvas');
    frontCanvas.className = 'smoke-canvas smoke-canvas--front';
    orbEl.appendChild(frontCanvas);

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

  return {
    fitToViewport,
    getMaster: () => currentMaster,
    getDisplayElement: () => rootEl.querySelector('.display'),
    getWizardElement: () => rootEl.querySelector('.wizard'),
    getRearCanvas: () => rootEl.querySelector('.smoke-canvas--rear'),
    getFrontCanvas: () => rootEl.querySelector('.smoke-canvas--front'),
  };
}
