import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** GALE — wind support. Floaty, evasive, two midair jumps, low commitment pokes. */
const rig: Rig = {
  hipH: 36, torso: 25, headR: 13, arm1: 15, arm2: 14, leg1: 21, leg2: 20,
  bodyR: 10, limbR: 4.2, handR: 5.6, footR: 6,
};
const W = 44;
const H = 84;

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 16,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'handF', r: 13, dmg: 3, angle: 40, bkb: 22, kbg: 32, sfx: 'punch' }],
    anim: [{ f: 2, hF: [26, 60], lean: 4 }, { f: 4, hF: [50, 56], lean: 8 }],
  },
  ftilt: {
    id: 'ftilt', total: 20,
    hitboxes: [{ g: 0, from: 5, to: 7, at: 'footF', r: 16, dmg: 6, angle: 34, bkb: 28, kbg: 74, sfx: 'kick' }],
    anim: [{ f: 3, fF: [10, 30], lean: 2 }, { f: 5, fF: [56, 14], lean: 12 }],
  },
  utilt: {
    id: 'utilt', total: 22,
    hitboxes: [{ g: 0, from: 6, to: 9, at: 'footF', r: 16, dmg: 5, angle: 90, bkb: 30, kbg: 76, sfx: 'kick' }],
    anim: [{ f: 3, fF: [10, 30], lean: -6 }, { f: 6, fF: [-6, 96], lean: -12 }],
  },
  dtilt: {
    id: 'dtilt', total: 18,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'footF', r: 14, dmg: 4, angle: 10, bkb: 24, kbg: 60, sfx: 'kick' }],
    anim: [{ f: 3, hip: [0, 28], lean: 26, fF: [40, 6] }],
  },
  dashAttack: {
    id: 'dashAttack', total: 30,
    motion: [{ from: 1, to: 8, vx: 10 }, { from: 9, to: 18, damp: 0.85 }],
    hitboxes: [{ g: 0, from: 8, to: 12, at: 'center', off: [18, 0], r: 24, dmg: 7, angle: 42, bkb: 28, kbg: 68, sfx: 'punch' }],
    anim: [{ f: 5, lean: 16 }, { f: 8, lean: 24, hF: [24, 44] }],
  },
  fsmash: {
    id: 'fsmash', total: 38, charge: { frame: 8, smash: true },
    hitboxes: [{ g: 0, from: 9, to: 11, at: 'footF', r: 22, dmg: 12, angle: 32, bkb: 30, kbg: 88, sfx: 'kick' }],
    anim: [{ f: 5, fF: [-16, 50], lean: -18 }, { f: 9, fF: [64, 34], lean: 16 }],
  },
  usmash: {
    id: 'usmash', total: 36, charge: { frame: 7, smash: true },
    hitboxes: [{ g: 0, from: 8, to: 10, at: 'head', off: [0, 12], r: 20, dmg: 10, angle: 92, bkb: 34, kbg: 84, sfx: 'punch', fx: 'swoosh' }],
    anim: [{ f: 4, hip: [0, 30], hF: [16, 60] }, { f: 8, hip: [0, 48], hF: [10, 100] }],
  },
  dsmash: {
    id: 'dsmash', total: 36, charge: { frame: 7, smash: true },
    hitboxes: [
      { g: 0, from: 8, to: 10, pos: [32, 12], r: 20, dmg: 9, angle: 30, bkb: 30, kbg: 80, away: true, sfx: 'kick' },
      { g: 1, from: 8, to: 10, pos: [-32, 12], r: 20, dmg: 9, angle: 30, bkb: 30, kbg: 80, away: true, sfx: 'kick' },
    ],
    anim: [{ f: 4, hip: [0, 24], lean: 14 }, { f: 8, hip: [0, 24], fF: [28, 0], fB: [-28, 0] }],
  },
  nair: {
    id: 'nair', total: 32, air: true, landingLag: 6,
    hitboxes: [{ g: 0, from: 4, to: 20, at: 'center', r: 24, dmg: 6, angle: 45, bkb: 16, kbg: 76, sfx: 'punch' }],
    anim: [{ f: 2, spin: 0 }, { f: 20, spin: -540 }],
  },
  fair: {
    id: 'fair', total: 28, air: true, landingLag: 8,
    hitboxes: [{ g: 0, from: 5, to: 7, at: 'footF', r: 17, dmg: 8, angle: 36, bkb: 24, kbg: 78, sfx: 'kick' }],
    anim: [{ f: 3, fF: [10, 40], lean: -8 }, { f: 5, fF: [54, 22], lean: 12 }],
  },
  bair: {
    id: 'bair', total: 28, air: true, landingLag: 8,
    hitboxes: [{ g: 0, from: 5, to: 7, at: 'footB', r: 17, dmg: 9, angle: 148, bkb: 22, kbg: 82, sfx: 'kick' }],
    anim: [{ f: 3, fB: [-10, 40], lean: 8 }, { f: 5, fB: [-54, 22], lean: -12 }],
  },
  uair: {
    id: 'uair', total: 26, air: true, landingLag: 7,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'head', off: [0, 10], r: 18, dmg: 6, angle: 88, bkb: 26, kbg: 74, sfx: 'punch' }],
    anim: [{ f: 2, hip: [0, 34], hF: [10, 58] }],
  },
  dair: {
    id: 'dair', total: 34, air: true, landingLag: 12,
    hitboxes: [{ g: 0, from: 8, to: 20, at: 'footF', r: 18, dmg: 1.5, angle: 270, bkb: 14, kbg: 30, fixed: 8, sfx: 'kick' }],
    anim: [{ f: 5, fF: [8, -8], lean: 0 }, { f: 20, fF: [6, -14], spin: -360 }],
  },
  nspecial: {
    id: 'nspecial', total: 40,
    projectiles: [{
      frame: 14, kind: 'gust', at: 'handF', vx: 9, vy: 0, gravity: 0, life: 40, r: 26,
      hit: { dmg: 3, angle: 40, bkb: 46, kbg: 30, fixed: 24, sfx: 'punch' },
    }],
    hitboxes: [],
    anim: [{ f: 7, hF: [-10, 56], lean: -8 }, { f: 14, hF: [44, 58], lean: 10 }, { f: 20, hF: [38, 54], lean: 8 }],
  },
  sspecial: {
    id: 'sspecial', total: 46, airOnce: true,
    motion: [{ from: 1, to: 34, vx: 8.5, noGrav: true, vy: -1.2 }],
    hitboxes: [{ g: 0, from: 2, to: 34, at: 'center', r: 20, dmg: 0.6, angle: 45, bkb: 6, kbg: 16, fixed: 3, sfx: 'punch' }],
    anim: [{ f: 2, lean: -30, fF: [30, 20], fB: [-10, 30] }, { f: 34, lean: -30, fF: [30, 20], fB: [-10, 30] }],
  },
  uspecial: {
    id: 'uspecial', total: 50, helpless: true, helplessLag: 24, onLand: 'lag', ledgeFrom: 10, edgeStop: false,
    motion: [{ from: 1, to: 4, noGrav: true, vy: 0 }, { from: 5, to: 30, noGrav: true, vy: -8.0, drift: 0.85 }, { from: 31, to: 40, damp: 0.92 }],
    hitboxes: [{ g: 0, from: 4, to: 10, at: 'center', r: 24, dmg: 4, angle: 88, bkb: 22, kbg: 60, sfx: 'punch' }],
    hooks: { start: (f: Fighter) => leaveGround(f, -1) },
    anim: [{ f: 3, hip: [0, 40], fF: [10, 20], fB: [-10, 20] }, { f: 30, hip: [0, 40], fF: [10, 20], fB: [-10, 20] }],
  },
  dspecial: {
    id: 'dspecial', total: 36, air: true, landingLag: 10,
    hitboxes: [{ g: 0, from: 6, to: 24, at: 'center', off: [0, -30], r: 30, dmg: 1, angle: 270, bkb: 8, kbg: 20, fixed: 14, sfx: 'punch' }],
    anim: [{ f: 3, hip: [0, 34], hF: [10, 50], hB: [-10, 50] }, { f: 24, hip: [0, 34], hF: [10, 20], hB: [-10, 20] }],
  },
};

export const GALE: FighterDef = {
  id: 'gale',
  name: 'GALE',
  archetype: 'Wind Support',
  tagline: 'Floats above the fray and never lands where you expect.',
  weight: 76,
  height: H,
  width: W,
  walkSpeed: 5.8,
  runSpeed: 9.4,
  dashSpeed: 10.0,
  dashFrames: 10,
  traction: 0.6,
  airSpeed: 7.4,
  airAccel: 0.5,
  airFriction: 0.085,
  gravity: 0.34,
  fallSpeed: 6.4,
  jumpV: 12.6,
  shortHopV: 8.8,
  doubleJumpV: 12.4,
  jumps: 2,
  rig,
  look: 'gale',
  palettes: [
    { main: '#8ad8ff', dark: '#3a7ea8', light: '#e0f6ff', accent: '#ffe066', skin: '#f3c9a0', eye: '#2a1810' },
    { main: '#c0ffb0', dark: '#5aa848', light: '#eaffe0', accent: '#ff9ad8', skin: '#e0b088', eye: '#2a1810' },
    { main: '#ffd0f0', dark: '#a85a94', light: '#fff0fa', accent: '#66e0ff', skin: '#f0d0a0', eye: '#2a1810' },
    { main: '#fff0b0', dark: '#a8945a', light: '#fffbe0', accent: '#66ffb0', skin: '#d8a884', eye: '#2a1810' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 5, angle: 45, bkb: 52, kbg: 50 },
      b: { dmg: 7, angle: 135, bkb: 52, kbg: 62 },
      u: { dmg: 4, angle: 90, bkb: 62, kbg: 52 },
      d: { dmg: 3, angle: 76, bkb: 48, kbg: 36 },
    }),
    ...moves,
  },
};
