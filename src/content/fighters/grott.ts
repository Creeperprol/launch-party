import type { FighterDef, HitboxDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import type { Match } from '../../sim/match';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** GROTT — heavyweight. Slow, huge knockback, armored smashes, command grab. */
const rig: Rig = {
  hipH: 46, torso: 42, headR: 19, arm1: 24, arm2: 23, leg1: 25, leg2: 24,
  bodyR: 28, limbR: 9.5, handR: 12, footR: 12,
};
const W = 82;
const H = 124;

function spinHits(): HitboxDef[] {
  const out: HitboxDef[] = [];
  const starts = [6, 12, 18, 24, 30, 36];
  starts.forEach((s, i) => {
    out.push({ g: i, from: s, to: s + 2, pos: [42, 56], r: 34, dmg: 2, angle: 85, bkb: 0, kbg: 0, fixed: 48, hitlag: 0.5, away: true, sfx: 'heavy', fx: 'swoosh' });
    out.push({ g: i, from: s, to: s + 2, pos: [-42, 56], r: 34, dmg: 2, angle: 85, bkb: 0, kbg: 0, fixed: 48, hitlag: 0.5, away: true, sfx: 'heavy', fx: 'swoosh' });
  });
  out.push({ g: 9, from: 42, to: 44, pos: [0, 64], r: 52, dmg: 5, angle: 70, bkb: 60, kbg: 80, away: true, sfx: 'heavy', fx: 'shock' });
  return out;
}

function flameHits(): HitboxDef[] {
  const out: HitboxDef[] = [];
  [10, 16, 22, 28, 34, 40].forEach((s, i) => {
    out.push({ g: i, from: s, to: s + 3, pos: [76, 62], r: 28, dmg: 2.2, angle: 22, bkb: 0, kbg: 0, fixed: 42, hitlag: 0.4, sfx: 'fire', fx: 'fire' });
    out.push({ g: i, from: s, to: s + 3, pos: [126, 56], r: 24, dmg: 2.2, angle: 22, bkb: 0, kbg: 0, fixed: 42, hitlag: 0.4, sfx: 'fire', fx: 'fire' });
  });
  out.push({ g: 9, from: 46, to: 48, pos: [102, 58], r: 36, dmg: 4, angle: 35, bkb: 55, kbg: 65, sfx: 'fire', fx: 'fire' });
  return out;
}

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 22,
    hitboxes: [{ g: 0, from: 5, to: 6, at: 'handF', r: 18, dmg: 4, angle: 35, bkb: 25, kbg: 30, sfx: 'blunt' }],
    next: { from: 8, to: 18, btn: 'attack', id: 'jab2' },
    anim: [{ f: 3, hF: [20, 80], lean: 8 }, { f: 5, hF: [58, 78], lean: 14 }, { f: 8, hF: [55, 78], lean: 14 }],
  },
  jab2: {
    id: 'jab2', total: 30,
    hitboxes: [{ g: 0, from: 5, to: 7, at: 'handB', r: 20, dmg: 5.5, angle: 40, bkb: 45, kbg: 75, sfx: 'heavy', fx: 'swoosh' }],
    anim: [{ f: 3, hB: [10, 70], lean: 10 }, { f: 5, hB: [58, 72], hF: [10, 64], lean: 18 }, { f: 8, hB: [55, 70], lean: 18 }],
  },
  ftilt: {
    id: 'ftilt', total: 34,
    hitboxes: [{ g: 0, from: 9, to: 11, at: 'handF', r: 22, dmg: 12, angle: 38, bkb: 25, kbg: 90, sfx: 'heavy', fx: 'swoosh' }],
    anim: [
      { f: 6, hF: [-10, 100], lean: -10 },
      { f: 9, hF: [60, 70], lean: 18 },
      { f: 11, hF: [56, 48], lean: 20 },
    ],
  },
  utilt: {
    id: 'utilt', total: 36,
    hitboxes: [{ g: 0, from: 9, to: 14, at: 'handF', r: 22, dmg: 11, angle: 92, bkb: 40, kbg: 95, sfx: 'heavy', fx: 'swoosh' }],
    anim: [
      { f: 6, hF: [40, 60], lean: 10 },
      { f: 9, hF: [42, 116], lean: 2 },
      { f: 12, hF: [0, 132], lean: -8 },
      { f: 14, hF: [-32, 116], lean: -14 },
    ],
  },
  dtilt: {
    id: 'dtilt', total: 30,
    hitboxes: [{ g: 0, from: 8, to: 10, at: 'handF', r: 22, dmg: 10, angle: 25, bkb: 35, kbg: 80, sfx: 'heavy', fx: 'swoosh' }],
    anim: [
      { f: 5, hip: [0, 30], lean: 36, hF: [20, 40], fF: [22, 0], fB: [-26, 0] },
      { f: 8, hip: [0, 30], lean: 36, hF: [70, 12], fF: [22, 0], fB: [-26, 0] },
      { f: 11, hip: [0, 30], lean: 36, hF: [66, 12] },
    ],
  },
  dashAttack: {
    id: 'dashAttack', total: 44,
    motion: [{ from: 1, to: 9, vx: 6 }, { from: 10, to: 18, vx: 10 }, { from: 19, to: 36, damp: 0.85 }],
    hitboxes: [{ g: 0, from: 10, to: 16, at: 'center', off: [22, 0], r: 36, dmg: 13, angle: 45, bkb: 50, kbg: 75, sfx: 'heavy', fx: 'shock' }],
    anim: [
      { f: 8, lean: -10, hF: [-10, 80] },
      { f: 10, lean: 42, hip: [10, 40], hF: [44, 60], hB: [34, 50], fB: [-40, 10] },
      { f: 16, lean: 42, hip: [10, 40], hF: [44, 60], hB: [34, 50], fB: [-40, 10] },
    ],
  },
  fsmash: {
    id: 'fsmash', total: 62, charge: { frame: 16, smash: true }, armor: { from: 1, to: 21, threshold: 8 },
    hitboxes: [
      { g: 0, from: 22, to: 24, at: 'handF', r: 28, dmg: 22, angle: 38, bkb: 35, kbg: 92, sfx: 'heavy', fx: 'shock', hitlag: 1.2 },
      { g: 0, from: 22, to: 24, at: 'handF', off: [24, 0], r: 22, dmg: 22, angle: 38, bkb: 35, kbg: 92, sfx: 'heavy', fx: 'shock', hitlag: 1.2 },
    ],
    anim: [
      { f: 10, hF: [-10, 130], hB: [-20, 126], lean: -18 },
      { f: 16, hF: [-10, 130], hB: [-20, 126], lean: -18 },
      { f: 22, hF: [70, 60], hB: [62, 54], lean: 30, hip: [10, 40] },
      { f: 26, hF: [68, 56], hB: [60, 50], lean: 30, hip: [10, 40] },
    ],
  },
  usmash: {
    id: 'usmash', total: 56, charge: { frame: 10, smash: true }, armor: { from: 1, to: 15, threshold: 8 },
    hitboxes: [{ g: 0, from: 14, to: 18, at: 'head', off: [0, 14], r: 30, dmg: 18, angle: 90, bkb: 38, kbg: 90, sfx: 'heavy', fx: 'shock', hitlag: 1.1 }],
    anim: [
      { f: 10, hip: [0, 28], lean: 30, hF: [20, 60], hB: [-10, 50] },
      { f: 14, hip: [0, 56], lean: -4, hF: [22, 120], hB: [-22, 120], fF: [12, 0], fB: [-12, 0] },
      { f: 18, hip: [0, 54], lean: -4, hF: [22, 118], hB: [-22, 118] },
    ],
  },
  dsmash: {
    id: 'dsmash', total: 58, charge: { frame: 8, smash: true }, armor: { from: 1, to: 11, threshold: 8 },
    hitboxes: [
      { g: 0, from: 12, to: 16, pos: [58, 24], r: 34, dmg: 16, angle: 30, bkb: 35, kbg: 90, away: true, sfx: 'heavy', fx: 'swoosh' },
      { g: 0, from: 12, to: 16, pos: [-58, 24], r: 34, dmg: 16, angle: 30, bkb: 35, kbg: 90, away: true, sfx: 'heavy', fx: 'swoosh' },
    ],
    anim: [
      { f: 8, hip: [0, 26], lean: 60, spin: 0 },
      { f: 12, hip: [0, 26], lean: 60, spin: 0 },
      { f: 24, hip: [0, 26], lean: 60, spin: -720 },
      { f: 30, hip: [0, 30], lean: 40, spin: -720 },
    ],
  },
  nair: {
    id: 'nair', total: 46, air: true, landingLag: 12,
    hitboxes: [
      { g: 0, from: 6, to: 9, at: 'center', r: 42, dmg: 12, angle: 45, bkb: 20, kbg: 100, away: true, sfx: 'heavy', fx: 'swoosh' },
      { g: 0, from: 10, to: 22, at: 'center', r: 36, dmg: 8, angle: 45, bkb: 15, kbg: 90, away: true, sfx: 'heavy' },
    ],
    anim: [
      { f: 4, hip: [0, 50], lean: 50, fF: [26, 40], fB: [0, 34], hF: [30, 70], hB: [10, 64], spin: 0 },
      { f: 22, hip: [0, 50], lean: 50, fF: [26, 40], fB: [0, 34], hF: [30, 70], hB: [10, 64], spin: -720 },
    ],
  },
  fair: {
    id: 'fair', total: 50, air: true, landingLag: 14,
    hitboxes: [{ g: 0, from: 10, to: 13, at: 'handF', r: 24, dmg: 13, angle: 40, bkb: 30, kbg: 90, sfx: 'heavy', fx: 'swoosh' }],
    anim: [
      { f: 6, hF: [20, 130], lean: -8 },
      { f: 10, hF: [64, 80], lean: 18 },
      { f: 13, hF: [52, 40], lean: 24 },
    ],
  },
  bair: {
    id: 'bair', total: 46, air: true, landingLag: 12,
    hitboxes: [{ g: 0, from: 11, to: 14, at: 'footB', r: 24, dmg: 16, angle: 145, bkb: 25, kbg: 95, sfx: 'heavy', fx: 'swoosh' }],
    anim: [
      { f: 8, fB: [-10, 40], lean: 30 },
      { f: 11, fB: [-56, 52], fF: [-40, 40], lean: 40, hF: [40, 80], hB: [30, 70] },
      { f: 14, fB: [-54, 50], fF: [-38, 40], lean: 40 },
    ],
  },
  uair: {
    id: 'uair', total: 48, air: true, landingLag: 12,
    hitboxes: [{ g: 0, from: 10, to: 14, at: 'head', off: [0, 10], r: 28, dmg: 14, angle: 80, bkb: 30, kbg: 92, sfx: 'heavy', fx: 'swoosh' }],
    anim: [
      { f: 6, hip: [0, 40], lean: 10, hF: [20, 60], hB: [-20, 60] },
      { f: 10, hip: [0, 54], lean: -24, hF: [-30, 70], hB: [-40, 64] },
      { f: 14, hip: [0, 52], lean: -26 },
    ],
  },
  dair: {
    id: 'dair', total: 60, air: true, landingLag: 30,
    hitboxes: [{ g: 0, from: 16, to: 20, at: 'footF', r: 24, dmg: 15, angle: 270, bkb: 30, kbg: 80, sfx: 'heavy', fx: 'shock' }],
    anim: [
      { f: 12, fF: [10, 40], lean: -6, hF: [30, 110], hB: [-30, 110] },
      { f: 16, fF: [8, -16], fB: [-10, 10], lean: 0, hF: [30, 110], hB: [-30, 110] },
      { f: 20, fF: [8, -16], fB: [-10, 10], lean: 0 },
    ],
  },
  nspecial: {
    id: 'nspecial', total: 60,
    motion: [{ from: 6, to: 48, drift: 0.3 }],
    hitboxes: flameHits(),
    hooks: {
      frame(f: Fighter) {
        const F = f.move!.frame;
        if (!f.grounded && F >= 6 && F <= 48) f.vy = Math.min(f.vy, 1.4);
      },
    },
    anim: [
      { f: 6, lean: -12, hF: [30, 70], hB: [20, 60] },
      { f: 10, lean: 22, hF: [44, 60], hB: [34, 54] },
      { f: 48, lean: 22, hF: [44, 60], hB: [34, 54] },
    ],
  },
  sspecial: {
    id: 'sspecial', total: 44, airOnce: true,
    motion: [{ from: 1, to: 13, vx: 5 }],
    hitboxes: [],
    grab: { from: 8, to: 13, at: 'handF', r: 34, command: 'sspecialSlam' },
    anim: [
      { f: 5, hF: [10, 90], hB: [0, 84], lean: -6 },
      { f: 8, hF: [62, 70], hB: [56, 60], lean: 24 },
      { f: 14, hF: [58, 66], hB: [52, 58], lean: 24 },
    ],
  },
  sspecialSlam: {
    id: 'sspecialSlam', total: 46, onLand: 'keep',
    throwDef: { release: 30, hit: { dmg: 14, angle: 60, bkb: 72, kbg: 62, sfx: 'heavy' } },
    hitboxes: [],
    hooks: {
      start(f: Fighter) {
        leaveGround(f, -11);
        f.vx = 4 * f.facing;
      },
    },
    anim: [
      { f: 0, hF: [58, 66], hB: [52, 58], lean: 20 },
      { f: 12, hF: [40, 140], hB: [30, 136], lean: -10 },
      { f: 28, hF: [70, 20], hB: [62, 16], lean: 40 },
      { f: 32, hF: [70, 20], hB: [62, 16], lean: 40 },
    ],
  },
  uspecial: {
    id: 'uspecial', total: 64, helpless: true, helplessLag: 26, onLand: 'lag', ledgeFrom: 10, edgeStop: false,
    motion: [
      { from: 1, to: 4, vy: 0, noGrav: true, drift: 0 },
      { from: 5, to: 38, vy: -8.6, noGrav: true, drift: 1.6 },
      { from: 39, to: 50, damp: 0.9, drift: 1.2 },
    ],
    hitboxes: spinHits(),
    hooks: { start: (f: Fighter) => leaveGround(f, -2) },
    anim: [
      { f: 4, hip: [0, 46], lean: 50, fF: [26, 36], fB: [0, 30], hF: [34, 70], hB: [12, 60], spin: 0 },
      { f: 44, hip: [0, 46], lean: 50, fF: [26, 36], fB: [0, 30], hF: [34, 70], hB: [12, 60], spin: -1440 },
    ],
  },
  dspecial: {
    id: 'dspecial', total: 100, onLand: 'hook', edgeStop: false, armor: { from: 1, to: 100, threshold: 12 },
    hitboxes: [{ g: 0, from: 13, to: 100, at: 'hip', off: [0, -22], r: 34, dmg: 15, angle: 270, bkb: 40, kbg: 70, sfx: 'heavy', fx: 'shock' }],
    hooks: {
      start(f: Fighter) {
        leaveGround(f, -12);
      },
      frame(f: Fighter) {
        const mv = f.move!;
        f.noGrav = true;
        if (mv.frame <= 12) {
          if (mv.vars.hop) f.vy = Math.min(f.vy + 1.0, 1);
          else f.vy = Math.min(f.vy, 0.5);
          f.vx *= 0.85;
        } else {
          f.vy = 20;
          f.vx = 0;
        }
      },
      land(f: Fighter, m: Match) {
        f.startMove('dspecialLand', m);
        return true;
      },
    },
    anim: [
      { f: 6, hip: [0, 50], lean: -10, hF: [30, 130], hB: [-30, 130], fF: [16, 30], fB: [-16, 30] },
      { f: 13, hip: [0, 46], lean: 0, hF: [30, 120], hB: [-30, 120], fF: [10, -6], fB: [-10, -6] },
      { f: 100, hip: [0, 46], lean: 0, hF: [30, 120], hB: [-30, 120], fF: [10, -6], fB: [-10, -6] },
    ],
  },
  dspecialLand: {
    id: 'dspecialLand', total: 34,
    hitboxes: [
      { g: 0, from: 1, to: 3, pos: [62, 16], r: 40, dmg: 9, angle: 60, bkb: 55, kbg: 55, away: true, sfx: 'heavy', fx: 'shock' },
      { g: 0, from: 1, to: 3, pos: [-62, 16], r: 40, dmg: 9, angle: 60, bkb: 55, kbg: 55, away: true, sfx: 'heavy', fx: 'shock' },
    ],
    anim: [{ f: 0, hip: [0, 28], lean: 26, fF: [30, 0], fB: [-30, 0] }, { f: 12, hip: [0, 28], lean: 26, fF: [30, 0], fB: [-30, 0] }],
  },
};

export const GROTT: FighterDef = {
  id: 'grott',
  name: 'GROTT',
  archetype: 'Heavyweight',
  tagline: 'Volcanic tortoise. Slow to start, impossible to stop.',
  weight: 135,
  height: H,
  width: W,
  walkSpeed: 4.5,
  runSpeed: 8,
  dashSpeed: 9,
  dashFrames: 13,
  traction: 0.7,
  airSpeed: 5.4,
  airAccel: 0.4,
  airFriction: 0.1,
  gravity: 0.6,
  fallSpeed: 10.5,
  jumpV: 13.86,
  shortHopV: 9.49,
  doubleJumpV: 13.4,
  jumps: 1,
  rig,
  look: 'grott',
  palettes: [
    { main: '#4f8a4a', dark: '#2c5230', light: '#9fd08a', accent: '#ff6a2a', skin: '#d8b070', eye: '#fff2a0' },
    { main: '#5a4a8a', dark: '#352a5a', light: '#b0a0e0', accent: '#ffcf3a', skin: '#c9a0c0', eye: '#fff2a0' },
    { main: '#8a5a3a', dark: '#553420', light: '#e0b890', accent: '#3ad0ff', skin: '#e0c090', eye: '#fff2a0' },
    { main: '#3a6a8a', dark: '#203e55', light: '#90c8e8', accent: '#ff3a6a', skin: '#b8d0d8', eye: '#fff2a0' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 10, angle: 45, bkb: 65, kbg: 60 },
      b: { dmg: 12, angle: 135, bkb: 62, kbg: 75 },
      u: { dmg: 9, angle: 90, bkb: 70, kbg: 65 },
      d: { dmg: 8, angle: 70, bkb: 60, kbg: 50 },
    }),
    ...moves,
  },
};
