import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** ROCCO — prize-fighter. Fast jabs, charged haymaker, dashing uppercut, counter-punch. */
const rig: Rig = {
  hipH: 40, torso: 30, headR: 14, arm1: 17, arm2: 16, leg1: 23, leg2: 22,
  bodyR: 13, limbR: 5, handR: 10, footR: 6.5,
};
const W = 52;
const H = 98;

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 12,
    hitboxes: [{ g: 0, from: 3, to: 4, at: 'handF', r: 14, dmg: 3, angle: 50, bkb: 18, kbg: 26, sfx: 'punch' }],
    next: { from: 3, to: 10, btn: 'attack', id: 'jab2' },
    anim: [{ f: 1, hF: [30, 70], lean: 6 }, { f: 3, hF: [56, 68], lean: 10 }],
  },
  jab2: {
    id: 'jab2', total: 14,
    hitboxes: [{ g: 0, from: 3, to: 4, at: 'handB', r: 14, dmg: 3, angle: 50, bkb: 18, kbg: 26, sfx: 'punch' }],
    next: { from: 3, to: 12, btn: 'attack', id: 'jab3' },
    anim: [{ f: 1, hB: [30, 70], lean: 8 }, { f: 3, hB: [58, 66], lean: 12 }],
  },
  jab3: {
    id: 'jab3', total: 26,
    hitboxes: [{ g: 0, from: 5, to: 7, at: 'handF', r: 17, dmg: 6, angle: 40, bkb: 46, kbg: 80, sfx: 'heavy' }],
    anim: [{ f: 2, hF: [10, 60], lean: -6 }, { f: 5, hF: [62, 64], lean: 18 }, { f: 10, hF: [60, 62], lean: 16 }],
  },
  ftilt: {
    id: 'ftilt', total: 24,
    hitboxes: [{ g: 0, from: 6, to: 9, at: 'handF', r: 17, dmg: 10, angle: 36, bkb: 28, kbg: 82, sfx: 'heavy' }],
    anim: [{ f: 3, hF: [10, 66], lean: -8 }, { f: 6, hF: [64, 64], lean: 20 }],
  },
  utilt: {
    id: 'utilt', total: 24,
    hitboxes: [{ g: 0, from: 6, to: 10, at: 'handF', r: 18, dmg: 9, angle: 88, bkb: 34, kbg: 84, sfx: 'punch' }],
    anim: [{ f: 3, hF: [30, 40], lean: 10 }, { f: 6, hF: [26, 116], lean: -6 }, { f: 10, hF: [10, 112] }],
  },
  dtilt: {
    id: 'dtilt', total: 18,
    hitboxes: [{ g: 0, from: 5, to: 7, at: 'handF', r: 16, dmg: 6, angle: 30, bkb: 30, kbg: 60, sfx: 'punch' }],
    anim: [{ f: 2, hip: [0, 26], lean: 30, hF: [30, 30] }, { f: 5, hip: [0, 26], lean: 30, hF: [60, 20] }],
  },
  dashAttack: {
    id: 'dashAttack', total: 32,
    motion: [{ from: 1, to: 9, vx: 12 }, { from: 10, to: 22, damp: 0.84 }],
    hitboxes: [{ g: 0, from: 6, to: 11, at: 'handF', r: 20, dmg: 10, angle: 40, bkb: 36, kbg: 70, sfx: 'heavy' }],
    anim: [{ f: 3, lean: 20, hF: [20, 56] }, { f: 6, lean: 34, hF: [66, 56] }],
  },
  fsmash: {
    id: 'fsmash', total: 48, charge: { frame: 12, smash: true },
    motion: [{ from: 13, to: 17, vx: 6 }],
    hitboxes: [{ g: 0, from: 14, to: 17, at: 'handF', r: 22, dmg: 19, angle: 34, bkb: 30, kbg: 96, sfx: 'heavy', fx: 'shock', hitlag: 1.3 }],
    anim: [{ f: 6, hF: [-20, 70], lean: -20 }, { f: 12, hF: [-20, 70], lean: -20 }, { f: 14, hF: [70, 66], lean: 26 }, { f: 18, hF: [68, 64], lean: 26 }],
  },
  usmash: {
    id: 'usmash', total: 44, charge: { frame: 9, smash: true },
    hitboxes: [{ g: 0, from: 11, to: 15, at: 'handF', r: 22, dmg: 16, angle: 88, bkb: 38, kbg: 92, sfx: 'heavy', fx: 'shock' }],
    anim: [{ f: 9, hip: [0, 28], hF: [30, 30], lean: 20 }, { f: 12, hip: [0, 44], hF: [20, 124], lean: -6 }, { f: 16, hip: [0, 44], hF: [16, 120] }],
  },
  dsmash: {
    id: 'dsmash', total: 44, charge: { frame: 7, smash: true },
    hitboxes: [
      { g: 0, from: 10, to: 12, pos: [44, 14], r: 20, dmg: 13, angle: 28, bkb: 32, kbg: 88, sfx: 'heavy' },
      { g: 1, from: 16, to: 18, pos: [-44, 14], r: 20, dmg: 13, angle: 28, bkb: 32, kbg: 88, sfx: 'heavy' },
    ],
    anim: [{ f: 7, hip: [0, 24], lean: 20 }, { f: 10, hip: [0, 24], lean: 30, hF: [50, 14] }, { f: 16, hip: [0, 24], lean: -10, hB: [-50, 14] }],
  },
  nair: {
    id: 'nair', total: 30, air: true, landingLag: 7,
    hitboxes: [{ g: 0, from: 4, to: 16, at: 'center', r: 28, dmg: 8, angle: 45, bkb: 20, kbg: 78, sfx: 'punch' }],
    anim: [{ f: 2, spin: 0, hF: [40, 60], hB: [-40, 60] }, { f: 16, spin: -540, hF: [40, 60], hB: [-40, 60] }],
  },
  fair: {
    id: 'fair', total: 32, air: true, landingLag: 10,
    hitboxes: [{ g: 0, from: 7, to: 10, at: 'handF', r: 19, dmg: 11, angle: 38, bkb: 28, kbg: 84, sfx: 'heavy' }],
    anim: [{ f: 3, hF: [10, 70], lean: -8 }, { f: 7, hF: [64, 60], lean: 16 }],
  },
  bair: {
    id: 'bair', total: 30, air: true, landingLag: 9,
    hitboxes: [{ g: 0, from: 6, to: 9, at: 'handB', r: 19, dmg: 12, angle: 148, bkb: 26, kbg: 88, sfx: 'heavy' }],
    anim: [{ f: 3, hB: [10, 60] }, { f: 6, hB: [-60, 60], lean: -12 }],
  },
  uair: {
    id: 'uair', total: 30, air: true, landingLag: 8,
    hitboxes: [{ g: 0, from: 5, to: 9, at: 'handF', r: 19, dmg: 9, angle: 88, bkb: 28, kbg: 80, sfx: 'punch' }],
    anim: [{ f: 2, hF: [40, 60] }, { f: 5, hF: [20, 110] }, { f: 9, hF: [0, 104] }],
  },
  dair: {
    id: 'dair', total: 38, air: true, landingLag: 14,
    hitboxes: [{ g: 0, from: 10, to: 13, at: 'handF', r: 20, dmg: 13, angle: 270, bkb: 24, kbg: 76, sfx: 'heavy' }],
    anim: [{ f: 5, hF: [40, 110] }, { f: 10, hF: [20, -10], lean: 10 }],
  },
  nspecial: {
    id: 'nspecial', total: 44, charge: { frame: 10, btn: 'special', max: 60 },
    motion: [{ from: 11, to: 16, vx: 9 }, { from: 17, to: 26, damp: 0.82 }],
    hitboxes: [{
      g: 0, from: 12, to: 16, at: 'handF', r: 22, sfx: 'heavy', fx: 'shock',
      dmg: 10, angle: 36, bkb: 36, kbg: 70,
      charge: { dmg: [10, 26], bkb: [36, 50], kbg: [70, 98] },
    }],
    anim: [{ f: 6, hF: [-30, 64], lean: -18 }, { f: 10, hF: [-30, 64], lean: -18 }, { f: 12, hF: [72, 64], lean: 28 }, { f: 18, hF: [70, 62], lean: 28 }],
  },
  sspecial: {
    id: 'sspecial', total: 42, airOnce: true,
    motion: [{ from: 3, to: 12, vx: 13 }, { from: 13, to: 22, damp: 0.8, vy: -3 }],
    hitboxes: [{ g: 0, from: 10, to: 15, at: 'handF', r: 22, dmg: 11, angle: 72, bkb: 50, kbg: 70, sfx: 'heavy' }],
    anim: [{ f: 3, hip: [0, 28], lean: 30, hF: [20, 30] }, { f: 10, hip: [0, 40], lean: -6, hF: [40, 110] }, { f: 15, hip: [0, 40], hF: [36, 110] }],
  },
  uspecial: {
    id: 'uspecial', total: 48, helpless: true, helplessLag: 22, onLand: 'lag', ledgeFrom: 10, edgeStop: false,
    motion: [{ from: 1, to: 4, noGrav: true, vy: 0 }, { from: 5, to: 20, noGrav: true, vy: -10.6, drift: 0.9 }, { from: 21, to: 28, damp: 0.9 }],
    hitboxes: [
      { g: 0, from: 5, to: 8, at: 'handF', r: 22, dmg: 12, angle: 80, bkb: 40, kbg: 84, sfx: 'heavy', fx: 'shock' },
      { g: 0, from: 9, to: 18, at: 'handF', r: 18, dmg: 6, angle: 80, bkb: 36, kbg: 60, sfx: 'punch' },
    ],
    hooks: { start: (f: Fighter) => leaveGround(f, -2) },
    anim: [{ f: 4, hip: [0, 30], hF: [30, 40], lean: 16 }, { f: 6, hip: [0, 46], hF: [14, 126], lean: -4 }, { f: 20, hip: [0, 46], hF: [14, 126], spin: 360 }],
  },
  dspecial: {
    id: 'dspecial', total: 44,
    counter: { from: 4, to: 24, next: 'dspecialHit', mult: 1.3, min: 9 },
    hitboxes: [],
    anim: [{ f: 3, hF: [26, 90], hB: [16, 86], lean: -10 }, { f: 24, hF: [26, 90], hB: [16, 86], lean: -10 }],
  },
  dspecialHit: {
    id: 'dspecialHit', total: 38, intangible: [[1, 14]],
    hitboxes: [{ g: 0, from: 7, to: 10, at: 'handF', r: 26, dmg: 9, dmgVar: 'counterDmg', angle: 38, bkb: 60, kbg: 76, sfx: 'heavy', fx: 'shock', hitlag: 1.3 }],
    anim: [{ f: 3, hF: [-20, 70], lean: -16 }, { f: 7, hF: [70, 66], lean: 26 }, { f: 12, hF: [68, 64], lean: 26 }],
  },
};

export const ROCCO: FighterDef = {
  id: 'rocco',
  name: 'ROCCO',
  archetype: 'Prize Fighter',
  tagline: 'Twelve rounds of footwork, one punch that ends it.',
  weight: 98,
  height: H,
  width: W,
  walkSpeed: 5.8, runSpeed: 10.4, dashSpeed: 11, dashFrames: 10, traction: 0.72,
  airSpeed: 5.8, airAccel: 0.44, airFriction: 0.1, gravity: 0.56, fallSpeed: 9.6,
  jumpV: 13.6, shortHopV: 9.4, doubleJumpV: 13, jumps: 1,
  rig,
  look: 'rocco',
  palettes: [
    { main: '#e8323f', dark: '#2a2a3a', light: '#ffffff', accent: '#ffd23f', skin: '#c68a5e', eye: '#1a1a1a' },
    { main: '#2f5ad8', dark: '#e8e8e8', light: '#ffffff', accent: '#e8323f', skin: '#f0c8a0', eye: '#1a1a1a' },
    { main: '#1a1a1a', dark: '#d8a83a', light: '#ffe8a0', accent: '#ffffff', skin: '#6a4a30', eye: '#1a1a1a' },
    { main: '#2fa85a', dark: '#1a1a1a', light: '#e0ffe8', accent: '#ff9a2a', skin: '#e8b890', eye: '#1a1a1a' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 6, angle: 45, bkb: 56, kbg: 54 },
      b: { dmg: 8, angle: 135, bkb: 56, kbg: 66 },
      u: { dmg: 6, angle: 90, bkb: 64, kbg: 56 },
      d: { dmg: 5, angle: 75, bkb: 50, kbg: 40 },
    }),
    ...moves,
  },
};
