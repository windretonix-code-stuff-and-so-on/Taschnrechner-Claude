import { assertEqual } from './assert.js';
import { computeDesktopMaster, computePortraitMaster, pickMaster } from '../js/layout.js';

function digit(master, n) {
  return master.digits.find((d) => d.digit === n);
}

function approxEqual(a, b, eps = 1e-9, message = '') {
  if (Math.abs(a - b) > eps) {
    throw new Error(`${message} expected ~${b}, got ${a}`);
  }
}

function checkMasterSymmetry(master, name) {
  return [
    {
      name: `${name}: exactly 10 digit spheres`,
      fn: () => assertEqual(master.digits.length, 10),
    },
    {
      name: `${name}: 0 and 9 are level (same y) and are the lowest digits`,
      fn: () => {
        const d0 = digit(master, 0);
        const d9 = digit(master, 9);
        approxEqual(d0.y, d9.y, 1e-9, '0/9 should be level');
        const maxOtherY = Math.max(...master.digits.filter((d) => d.digit !== 0 && d.digit !== 9).map((d) => d.y));
        if (d0.y <= maxOtherY) throw new Error('0/9 should be the lowest (largest y) digits');
      },
    },
    {
      name: `${name}: mirror pairs share the same y and mirror around center x`,
      fn: () => {
        for (const [a, b] of [[1, 8], [2, 7], [3, 6], [4, 5]]) {
          const da = digit(master, a);
          const db = digit(master, b);
          approxEqual(da.y, db.y, 1e-9, `${a}/${b} y mismatch`);
          approxEqual(da.x - master.orb.cx, -(db.x - master.orb.cx), 1e-9, `${a}/${b} x not mirrored`);
        }
      },
    },
    {
      name: `${name}: no digit sits exactly on the top-center apex`,
      fn: () => {
        for (const d of master.digits) {
          if (Math.abs(d.x - master.orb.cx) < 1e-6 && d.y < master.orb.cy) {
            throw new Error(`digit ${d.digit} sits on the top apex`);
          }
        }
      },
    },
    {
      name: `${name}: C is directly left of =, backspace directly right of =`,
      fn: () => {
        const byId = Object.fromEntries(master.controlsPrimary.map((c) => [c.id, c]));
        if (!(byId.clear.x < byId.equals.x)) throw new Error('C should be left of =');
        if (!(byId.backspace.x > byId.equals.x)) throw new Error('backspace should be right of =');
        if (!(byId.plus.x < byId.clear.x && byId.minus.x < byId.clear.x)) {
          throw new Error('+/- should be further left than C');
        }
        if (!(byId.multiply.x > byId.backspace.x && byId.divide.x > byId.backspace.x)) {
          throw new Error('×/÷ should be further right than backspace');
        }
      },
    },
    {
      name: `${name}: = sphere is larger than a standard small sphere`,
      fn: () => {
        const eq = master.controlsPrimary.find((c) => c.id === 'equals');
        if (!(eq.r > master.smallSphereRadius)) throw new Error('= should be larger');
      },
    },
    {
      name: `${name}: candle sits lower-right of the orb, outside its radius`,
      fn: () => {
        if (!(master.candle.x > master.orb.cx && master.candle.y > master.orb.cy)) {
          throw new Error('candle should be lower-right of the orb center');
        }
      },
    },
  ];
}

export const tests = [
  ...checkMasterSymmetry(computeDesktopMaster(), 'desktop master'),
  ...checkMasterSymmetry(computePortraitMaster(), 'portrait master'),
  {
    name: 'pickMaster: wide/square viewports use the desktop master',
    fn: () => assertEqual(pickMaster(1200, 800).width, computeDesktopMaster().width),
  },
  {
    name: 'pickMaster: tall narrow viewports use the portrait master',
    fn: () => assertEqual(pickMaster(400, 900).width, computePortraitMaster().width),
  },
];
