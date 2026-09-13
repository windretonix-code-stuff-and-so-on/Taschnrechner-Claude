// Procedurally draws the aged gold/brass frame — base plate, ornamental
// struts connecting every small sphere to the main structure, and an open
// prong setting per sphere — as one SVG layer generated directly from the
// layout master's geometry (layout.js). This is deliberately NOT a static
// asset (unlike the orb/candle/wizard slots in ASSETS.md): strut endpoints
// must stay pixel-exact against sphere positions across two different
// masters (desktop/portrait) and any future tuning, which a hand-aligned
// static SVG could not guarantee.

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

function buildDefs() {
  const defs = svgEl('defs');

  const goldStops = [
    ['0%', '#241505'],
    ['18%', '#7a531e'],
    ['38%', '#e8c369'],
    ['52%', '#fff6d8'],
    ['66%', '#caa04a'],
    ['84%', '#5c3f16'],
    ['100%', '#1c1004'],
  ];
  const goldGrad = svgEl('linearGradient', { id: 'goldStrut', x1: '0%', y1: '0%', x2: '100%', y2: '100%' });
  for (const [offset, color] of goldStops) {
    goldGrad.appendChild(svgEl('stop', { offset, 'stop-color': color }));
  }
  defs.appendChild(goldGrad);

  const ringGrad = svgEl('radialGradient', { id: 'goldRing', cx: '35%', cy: '30%', r: '75%' });
  ringGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#fff6d8' }));
  ringGrad.appendChild(svgEl('stop', { offset: '35%', 'stop-color': '#e8c369' }));
  ringGrad.appendChild(svgEl('stop', { offset: '70%', 'stop-color': '#8a611f' }));
  ringGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#2a1a06' }));
  defs.appendChild(ringGrad);

  const baseGrad = svgEl('linearGradient', { id: 'goldBase', x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
  baseGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#8a6a2a' }));
  baseGrad.appendChild(svgEl('stop', { offset: '30%', 'stop-color': '#4a3411' }));
  baseGrad.appendChild(svgEl('stop', { offset: '55%', 'stop-color': '#caa04a' }));
  baseGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#1c1004' }));
  defs.appendChild(baseGrad);

  return defs;
}

// A thin ornamental ring + 3-4 curved prongs, sized to the sphere's own
// radius, gripping it from the outside without covering the glass.
function buildProngSetting(sphere) {
  const g = svgEl('g', { class: 'prong-setting' });
  const ringR = sphere.r * 1.1;
  g.appendChild(
    svgEl('circle', {
      cx: sphere.x,
      cy: sphere.y,
      r: ringR,
      fill: 'none',
      stroke: 'url(#goldRing)',
      'stroke-width': Math.max(2, sphere.r * 0.1),
    })
  );

  const prongCount = sphere.r > 45 ? 4 : 3; // = sphere gets four prongs
  for (let i = 0; i < prongCount; i += 1) {
    const angle = (i / prongCount) * Math.PI * 2 + Math.PI / prongCount;
    const innerR = sphere.r * 0.94;
    const outerR = sphere.r * 1.32;
    const x1 = sphere.x + innerR * Math.cos(angle);
    const y1 = sphere.y + innerR * Math.sin(angle);
    const x2 = sphere.x + outerR * Math.cos(angle);
    const y2 = sphere.y + outerR * Math.sin(angle);
    g.appendChild(
      svgEl('line', {
        x1,
        y1,
        x2,
        y2,
        stroke: 'url(#goldStrut)',
        'stroke-width': Math.max(2, sphere.r * 0.16),
        'stroke-linecap': 'round',
      })
    );
  }
  return g;
}

// A slender strut from a sphere toward a target point (the orb rim or the
// base), tapering slightly via two stacked strokes.
function buildStrut(sphere, target, orbR) {
  const dx = target.x - sphere.x;
  const dy = target.y - sphere.y;
  const dist = Math.hypot(dx, dy);
  const ux = dx / dist;
  const uy = dy / dist;
  const startR = sphere.r * 1.15;
  const x1 = sphere.x + ux * startR;
  const y1 = sphere.y + uy * startR;
  const x2 = target.x - ux * orbR * 0.02;
  const y2 = target.y - uy * orbR * 0.02;

  return svgEl('line', {
    x1,
    y1,
    x2,
    y2,
    stroke: 'url(#goldStrut)',
    'stroke-width': Math.max(2, sphere.r * 0.22),
    'stroke-linecap': 'round',
    class: 'strut',
  });
}

function nearestOrbPoint(orb, sphere) {
  const dx = sphere.x - orb.cx;
  const dy = sphere.y - orb.cy;
  const dist = Math.hypot(dx, dy) || 1;
  return { x: orb.cx + (dx / dist) * orb.r, y: orb.cy + (dy / dist) * orb.r };
}

function buildBasePlate(master) {
  const { orb, controlsPrimary, controlsSecondary } = master;
  const leftMost = Math.min(...controlsPrimary.map((c) => c.x - c.r));
  const rightMost = Math.max(...controlsPrimary.map((c) => c.x + c.r));
  const bottom = Math.max(...controlsSecondary.map((c) => c.y + c.r)) + master.smallSphereRadius * 0.9;
  const top = orb.cy + orb.r * 0.62;

  const d = [
    `M ${leftMost - master.smallSphereRadius * 0.6} ${top}`,
    `C ${leftMost - master.smallSphereRadius} ${(top + bottom) / 2}, ${leftMost} ${bottom}, ${orb.cx} ${bottom + master.smallSphereRadius * 0.5}`,
    `C ${rightMost} ${bottom}, ${rightMost + master.smallSphereRadius} ${(top + bottom) / 2}, ${rightMost + master.smallSphereRadius * 0.6} ${top}`,
    `L ${orb.cx + orb.r * 0.55} ${orb.cy + orb.r * 0.42}`,
    `A ${orb.r} ${orb.r} 0 0 1 ${orb.cx - orb.r * 0.55} ${orb.cy + orb.r * 0.42}`,
    'Z',
  ].join(' ');

  const group = svgEl('g');
  const clipId = 'baseClip';
  const clipPath = svgEl('clipPath', { id: clipId });
  clipPath.appendChild(svgEl('path', { d }));
  group.appendChild(clipPath);

  group.appendChild(svgEl('path', { d, fill: 'url(#goldBase)', class: 'base-plate', opacity: '0.97' }));

  // Patina/wear: a few soft dark blobs clipped to the plate, so it reads as
  // aged, unevenly worn metal instead of a flat fill.
  const patinaGroup = svgEl('g', { 'clip-path': `url(#${clipId})`, opacity: '0.5' });
  const patinaSpots = [
    { fx: 0.18, fy: 0.35, r: 0.22 },
    { fx: 0.82, fy: 0.4, r: 0.2 },
    { fx: 0.5, fy: 0.85, r: 0.3 },
    { fx: 0.32, fy: 0.65, r: 0.16 },
  ];
  for (const spot of patinaSpots) {
    patinaGroup.appendChild(
      svgEl('ellipse', {
        cx: leftMost + (rightMost - leftMost) * spot.fx,
        cy: top + (bottom - top) * spot.fy,
        rx: (rightMost - leftMost) * spot.r,
        ry: (bottom - top) * spot.r,
        fill: '#160c02',
      })
    );
  }
  group.appendChild(patinaGroup);

  // Polished rim highlight along the plate's own outline.
  group.appendChild(
    svgEl('path', { d, fill: 'none', stroke: '#f6dfa0', 'stroke-width': master.smallSphereRadius * 0.06, opacity: '0.55' })
  );

  return group;
}

// Two layers so spheres (rendered by layout.js between them) sit visually
// on top of the base plate but underneath the gripping prong settings.
export function renderBaseLayer(svgRoot, master) {
  svgRoot.innerHTML = '';
  svgRoot.setAttribute('viewBox', `0 0 ${master.width} ${master.height}`);
  svgRoot.appendChild(buildDefs());
  svgRoot.appendChild(buildBasePlate(master));
}

export function renderOrnamentLayer(svgRoot, master) {
  svgRoot.innerHTML = '';
  svgRoot.setAttribute('viewBox', `0 0 ${master.width} ${master.height}`);

  const allSpheres = [...master.digits, ...master.controlsPrimary, ...master.controlsSecondary];
  for (const sphere of allSpheres) {
    const target = master.controlsSecondary.includes(sphere)
      ? { x: master.orb.cx, y: sphere.y - master.smallSphereRadius }
      : nearestOrbPoint(master.orb, sphere);
    svgRoot.appendChild(buildStrut(sphere, target, master.orb.r));
  }
  for (const sphere of allSpheres) {
    svgRoot.appendChild(buildProngSetting(sphere));
  }
}
