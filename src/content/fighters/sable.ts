import type { FighterDef, HitboxDef, MoveDef, Rig, Sfx } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** SABLE — swordfighter. Long disjointed blade (no hurtbox) with a stronger tip sweetspot. */
const rig: Rig = {
  hipH: 45, torso: 32, headR: 14, arm1: 18, arm2: 17, leg1: 24, leg2: 23,
  bodyR: 12, limbR: 5, handR: 6, footR: 7,
  weapon: { len: 80, width: 6 },
};
const W = 54;
const H = 106;

interface BladeOpts {
  r?: number;
  base?: boolean;
  tipAngle?: number;
  tipBkb?: number;
  tipKbg?: number;
  hitlag?: number;
  fixed?: number;
  sfx?: Sfx;
  away?: boolean;
}

/** Tip sweetspot first (priority), then mid, optionally base. */
function blade(g: number, from: number, to: number, tipDmg: number, midDmg: number, angle: number, bkb: number, kbg: number, o: BladeOpts = {}): HitboxDef[] {
  const r = o.r ?? 15;
  const common = { g, from, to, at: 'blade' as const, angle, bkb, kbg, fx: 'swoosh' as const, hitlag: o.hitlag, fixed: o.fixed, away: o.away };
  const out: HitboxDef[] = [
    { ...common, t: 1, r, dmg: tipDmg, angle: o.tipAngle ?? angle, bkb: o.tipBkb ?? bkb, kbg: o.tipKbg ?? kbg, sfx: 'tip' },
    { ...common, t: 0.58, r, dmg: midDmg, sfx: o.sfx ?? 'slash' },
  ];
  if (o.base) out.push({ ...common, t: 0.22, r: r - 2, dmg: midDmg, sfx: o.sfx ?? 'slash' });
  return out;
}

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 20,
    hitboxes: blade(0, 4, 5, 4.5, 4, 40, 25, 30, { r: 12, hitlag: 0.8 }),
    next: { from: 7, to: 18, btn: 'attack', id: 'jab2' },
    anim: [{ f: 2, hF: [18, 70], w: 60, lean: 6 }, { f: 4, hF: [30, 64], w: -10, lean: 12 }, { f: 6, hF: [26, 60], w: -40, lean: 12 }],
  },
  jab2: {
    id: 'jab2', total: 28,
    hitboxes: blade(0, 5, 6, 6, 5, 45, 40, 70, { r: 13 }),
    anim: [{ f: 3, hF: [24, 60], w: -40, lean: 10 }, { f: 5, hF: [28, 72], w: 30, lean: 14 }, { f: 7, hF: [26, 74], w: 60, lean: 12 }],
  },
  ftilt: {
    id: 'ftilt', total: 30,
    hitboxes: blade(0, 7, 9, 12, 10, 38, 20, 90, { r: 14, base: true, tipBkb: 22 }),
    anim: [
      { f: 4, hF: [8, 84], w: 110, lean: -6 },
      { f: 7, hF: [30, 70], w: 20, lean: 16 },
      { f: 9, hF: [32, 60], w: -30, lean: 18 },
    ],
  },
  utilt: {
    id: 'utilt', total: 32,
    hitboxes: blade(0, 6, 11, 10, 8, 92, 35, 100, { r: 15 }),
    anim: [
      { f: 4, hF: [26, 62], w: 10, lean: 6 },
      { f: 6, hF: [22, 80], w: 50, lean: 2 },
      { f: 9, hF: [6, 90], w: 100, lean: -6 },
      { f: 11, hF: [-8, 84], w: 150, lean: -10 },
    ],
  },
  dtilt: {
    id: 'dtilt', total: 24,
    hitboxes: blade(0, 6, 8, 10, 8, 30, 30, 70, { r: 13 }),
    anim: [
      { f: 3, hip: [0, 26], lean: 30, hF: [14, 30], w: -5, fF: [22, 0], fB: [-22, 0] },
      { f: 6, hip: [0, 26], lean: 30, hF: [36, 26], w: -5, fF: [22, 0], fB: [-22, 0] },
      { f: 9, hip: [0, 26], lean: 30, hF: [34, 26], w: -5 },
    ],
  },
  dashAttack: {
    id: 'dashAttack', total: 40,
    motion: [{ from: 1, to: 12, vx: 11 }, { from: 13, to: 30, damp: 0.86 }],
    hitboxes: blade(0, 9, 13, 12, 10, 45, 50, 70, { r: 15 }),
    anim: [
      { f: 6, hF: [20, 50], w: -60, lean: 18 },
      { f: 9, hF: [36, 70], w: 20, lean: 24 },
      { f: 13, hF: [26, 84], w: 70, lean: 10 },
    ],
  },
  fsmash: {
    id: 'fsmash', total: 54, charge: { frame: 9, smash: true },
    hitboxes: blade(0, 13, 15, 19, 16, 38, 30, 94, { r: 16, base: true, tipAngle: 36, tipBkb: 32, tipKbg: 96, hitlag: 1.2 }),
    anim: [
      { f: 6, hF: [-6, 96], w: 130, lean: -14 },
      { f: 9, hF: [-6, 96], w: 130, lean: -14 },
      { f: 13, hF: [32, 66], w: 0, lean: 20 },
      { f: 15, hF: [30, 50], w: -45, lean: 22 },
    ],
  },
  usmash: {
    id: 'usmash', total: 50, charge: { frame: 8, smash: true },
    hitboxes: blade(0, 12, 16, 17, 15, 90, 32, 92, { r: 16, tipBkb: 35, tipKbg: 94, hitlag: 1.1 }),
    anim: [
      { f: 8, hip: [0, 34], lean: 10, hF: [10, 40], w: 90 },
      { f: 12, hip: [0, 46], lean: -4, hF: [8, 100], w: 90 },
      { f: 16, hip: [0, 46], lean: -4, hF: [8, 98], w: 92 },
    ],
  },
  dsmash: {
    id: 'dsmash', total: 56, charge: { frame: 4, smash: true },
    hitboxes: [
      ...blade(0, 6, 8, 15, 12, 28, 28, 88, { r: 15, tipAngle: 25, tipBkb: 30, tipKbg: 90 }),
      ...blade(1, 20, 22, 17, 13, 152, 30, 90, { r: 15, tipAngle: 155, tipBkb: 32, tipKbg: 92 }),
    ],
    anim: [
      { f: 4, hip: [0, 26], lean: 26, hF: [20, 30], w: 170, fF: [24, 0], fB: [-24, 0] },
      { f: 6, hip: [0, 26], lean: 26, hF: [24, 26], w: -5 },
      { f: 8, hip: [0, 26], lean: 26, hF: [24, 26], w: -12 },
      { f: 20, hip: [0, 26], lean: 26, hF: [-24, 26], w: 185 },
      { f: 22, hip: [0, 26], lean: 26, hF: [-24, 26], w: 195 },
    ],
  },
  nair: {
    id: 'nair', total: 44, air: true, landingLag: 8,
    hitboxes: [
      ...blade(0, 5, 8, 4, 4, 70, 0, 0, { r: 15, fixed: 50, hitlag: 0.7, away: true }),
      ...blade(1, 13, 17, 8, 7, 45, 25, 90, { r: 16, away: true }),
    ],
    anim: [
      { f: 4, hF: [24, 60], w: -40, lean: 4 },
      { f: 8, hF: [-10, 70], w: 220, lean: 0 },
      { f: 12, hF: [-12, 60], w: 220, lean: 0 },
      { f: 17, hF: [24, 56], w: -140, lean: 4 },
    ],
  },
  fair: {
    id: 'fair', total: 36, air: true, landingLag: 8,
    hitboxes: blade(0, 5, 8, 11, 9, 42, 20, 80, { r: 15, tipAngle: 40, tipBkb: 25, tipKbg: 85 }),
    anim: [
      { f: 3, hF: [16, 84], w: 100, lean: -4 },
      { f: 5, hF: [30, 72], w: 50, lean: 8 },
      { f: 8, hF: [32, 56], w: -60, lean: 14 },
    ],
  },
  bair: {
    id: 'bair', total: 38, air: true, landingLag: 9,
    hitboxes: blade(0, 7, 10, 12, 10, 145, 25, 90, { r: 15 }),
    anim: [
      { f: 4, hF: [10, 80], w: 60, lean: 4 },
      { f: 7, hF: [-16, 70], w: 170, lean: -10 },
      { f: 10, hF: [-20, 56], w: 220, lean: -12 },
    ],
  },
  uair: {
    id: 'uair', total: 36, air: true, landingLag: 8,
    hitboxes: blade(0, 6, 10, 11, 9, 85, 30, 92, { r: 15, tipAngle: 82 }),
    anim: [
      { f: 4, hF: [-6, 80], w: 160, lean: -6 },
      { f: 6, hF: [0, 92], w: 120, lean: -4 },
      { f: 10, hF: [16, 88], w: 30, lean: 4 },
    ],
  },
  dair: {
    id: 'dair', total: 50, air: true, landingLag: 20,
    hitboxes: blade(0, 14, 17, 15, 12, 60, 25, 80, { r: 16, tipAngle: 270, tipBkb: 30, tipKbg: 75 }),
    anim: [
      { f: 10, hF: [8, 80], w: 90, lean: -6 },
      { f: 14, hF: [8, 30], w: -90, lean: 4 },
      { f: 17, hF: [8, 30], w: -90, lean: 4 },
    ],
  },
  nspecial: {
    id: 'nspecial', total: 44, charge: { frame: 8, btn: 'special', max: 60 },
    hitboxes: [
      { g: 0, from: 12, to: 15, at: 'blade', t: 1, r: 18, dmg: 8, angle: 38, bkb: 30, kbg: 70, sfx: 'tip', fx: 'swoosh', charge: { dmg: [8, 22], bkb: [30, 60], kbg: [70, 90], shieldDmg: [0, 100] } },
      { g: 0, from: 12, to: 15, at: 'blade', t: 0.55, r: 16, dmg: 7, angle: 38, bkb: 30, kbg: 70, sfx: 'slash', fx: 'swoosh', charge: { dmg: [7, 19], bkb: [30, 55], kbg: [70, 88], shieldDmg: [0, 100] } },
    ],
    anim: [
      { f: 5, hF: [-10, 66], w: 0, lean: -10, fF: [22, 0], fB: [-24, 0] },
      { f: 8, hF: [-10, 66], w: 0, lean: -10, fF: [22, 0], fB: [-24, 0] },
      { f: 12, hF: [40, 66], w: 0, lean: 22, hip: [8, 40], fF: [34, 0], fB: [-24, 0] },
      { f: 16, hF: [38, 66], w: 0, lean: 22, hip: [8, 40] },
    ],
  },
  sspecial: {
    id: 'sspecial', total: 34, airOnce: true,
    motion: [{ from: 1, to: 12, vx: 3, vy: 0, noGrav: true }],
    hitboxes: blade(0, 6, 8, 4, 4, 72, 35, 20, { r: 14 }),
    next: { from: 9, to: 26, btn: 'special', id: 'sspecial2' },
    anim: [{ f: 4, hF: [20, 80], w: 80, lean: 4 }, { f: 6, hF: [34, 64], w: -20, lean: 16 }, { f: 9, hF: [32, 60], w: -30, lean: 16 }],
  },
  sspecial2: {
    id: 'sspecial2', total: 34,
    motion: [{ from: 1, to: 10, vx: 3, vy: 0, noGrav: true }],
    hitboxes: blade(0, 5, 7, 4, 4, 75, 38, 20, { r: 14 }),
    next: { from: 8, to: 26, btn: 'special', id: 'sspecial3' },
    anim: [{ f: 3, hF: [26, 50], w: -40, lean: 10 }, { f: 5, hF: [30, 76], w: 60, lean: 12 }, { f: 8, hF: [28, 80], w: 75, lean: 8 }],
  },
  sspecial3: {
    id: 'sspecial3', total: 44,
    motion: [{ from: 1, to: 12, vx: 4, vy: 0, noGrav: true }],
    hitboxes: blade(0, 7, 10, 7, 7, 40, 50, 95, { r: 16 }),
    anim: [
      { f: 4, hF: [-10, 80], w: 150, lean: -8 },
      { f: 7, hF: [34, 66], w: 0, lean: 18 },
      { f: 10, hF: [30, 50], w: -60, lean: 20 },
    ],
  },
  uspecial: {
    id: 'uspecial', total: 54, helpless: true, helplessLag: 22, onLand: 'lag', ledgeFrom: 14, edgeStop: false,
    motion: [
      { from: 1, to: 3, vx: 0, vy: 0, noGrav: true },
      { from: 4, to: 13, vy: -16, noGrav: true, drift: 0.3 },
      { from: 14, to: 22, vy: -9, noGrav: true, drift: 0.5 },
      { from: 23, to: 30, damp: 0.85, drift: 0.6 },
    ],
    hitboxes: [
      ...blade(0, 4, 6, 12, 11, 80, 70, 60, { r: 16, base: true }),
      ...blade(1, 7, 16, 4, 4, 80, 40, 40, { r: 14 }),
    ],
    hooks: { start: (f: Fighter) => leaveGround(f, -2) },
    anim: [
      { f: 3, hip: [0, 32], lean: 20, hF: [24, 30], w: -30 },
      { f: 5, hip: [0, 45], lean: -4, hF: [30, 90], w: 80 },
      { f: 12, hip: [0, 45], lean: -6, hF: [12, 108], w: 95, fF: [8, 8], fB: [-10, 16] },
      { f: 24, hip: [0, 45], lean: -6, hF: [12, 108], w: 95, fF: [8, 8], fB: [-10, 16] },
    ],
  },
  dspecial: {
    id: 'dspecial', total: 46,
    counter: { from: 5, to: 26, next: 'dspecialHit', mult: 1.2, min: 8 },
    hitboxes: [],
    hooks: {
      frame(f: Fighter) {
        if (!f.grounded && f.move!.frame <= 30) {
          f.noGrav = true;
          f.vy = Math.min(f.vy, 0.8);
        }
      },
    },
    anim: [
      { f: 4, hF: [18, 70], w: 100, lean: -6, hip: [0, 40] },
      { f: 26, hF: [18, 70], w: 100, lean: -6, hip: [0, 40] },
    ],
  },
  dspecialHit: {
    id: 'dspecialHit', total: 40, intangible: [[1, 20]],
    hitboxes: [
      { g: 0, from: 8, to: 11, at: 'blade', t: 1, r: 18, dmg: 8, dmgVar: 'counterDmg', angle: 40, bkb: 60, kbg: 72, sfx: 'tip', fx: 'swoosh', hitlag: 1.2 },
      { g: 0, from: 8, to: 11, at: 'blade', t: 0.55, r: 18, dmg: 8, dmgVar: 'counterDmg', angle: 40, bkb: 60, kbg: 72, sfx: 'slash', fx: 'swoosh', hitlag: 1.2 },
      { g: 0, from: 8, to: 11, at: 'blade', t: 0.2, r: 16, dmg: 8, dmgVar: 'counterDmg', angle: 40, bkb: 60, kbg: 72, sfx: 'slash', fx: 'swoosh', hitlag: 1.2 },
    ],
    hooks: {
      frame(f: Fighter) {
        if (!f.grounded && f.move!.frame <= 20) {
          f.noGrav = true;
          f.vy = Math.min(f.vy, 0.5);
        }
      },
    },
    anim: [
      { f: 4, hF: [-4, 88], w: 140, lean: -8 },
      { f: 8, hF: [34, 64], w: -10, lean: 20 },
      { f: 11, hF: [30, 52], w: -60, lean: 22 },
    ],
  },
};

export const SABLE: FighterDef = {
  id: 'sable',
  name: 'SABLE',
  archetype: 'Swordfighter',
  tagline: 'Masked duelist. Keep her at the tip and you are already gone.',
  weight: 90,
  height: H,
  width: W,
  walkSpeed: 6.5,
  runSpeed: 12.5,
  dashSpeed: 13,
  dashFrames: 11,
  traction: 0.65,
  airSpeed: 7.2,
  airAccel: 0.5,
  airFriction: 0.1,
  gravity: 0.47,
  fallSpeed: 8.6,
  jumpV: 13.19,
  shortHopV: 9.2,
  doubleJumpV: 12.83,
  jumps: 1,
  rig,
  look: 'sable',
  palettes: [
    { main: '#2b3a78', dark: '#161e45', light: '#8fa0e8', accent: '#e8384f', skin: '#f3d6c0', eye: '#e8f0ff' },
    { main: '#7a2b4a', dark: '#451628', light: '#e88fb0', accent: '#f0c040', skin: '#f3d6c0', eye: '#fff0e8' },
    { main: '#e8e4dc', dark: '#9a948a', light: '#ffffff', accent: '#3a6ae8', skin: '#e0c0a8', eye: '#20243a' },
    { main: '#1f5a4a', dark: '#0e3228', light: '#7ed8b8', accent: '#ff8a3a', skin: '#e8c8b0', eye: '#e8fff4' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 8, angle: 45, bkb: 60, kbg: 60 },
      b: { dmg: 9, angle: 135, bkb: 60, kbg: 72 },
      u: { dmg: 7, angle: 90, bkb: 68, kbg: 62 },
      d: { dmg: 6, angle: 70, bkb: 55, kbg: 45 },
    }),
    ...moves,
  },
};
