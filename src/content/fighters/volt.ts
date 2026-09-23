import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** VOLT — electric speedster. Fastest fighter in the game; light and combo-heavy. */
const rig: Rig = {
  hipH: 34, torso: 24, headR: 12, arm1: 14, arm2: 13, leg1: 20, leg2: 19,
  bodyR: 9, limbR: 4, handR: 5.4, footR: 5.8,
};
const W = 42;
const H = 80;

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 12,
    hitboxes: [{ g: 0, from: 3, to: 5, at: 'handF', r: 12, dmg: 2, angle: 40, bkb: 20, kbg: 30, sfx: 'zap' }],
    next: { from: 3, to: 10, btn: 'attack', id: 'jab2' },
    anim: [{ f: 2, hF: [30, 60], lean: 6 }, { f: 4, hF: [50, 58], lean: 10 }],
  },
  jab2: {
    id: 'jab2', total: 16,
    hitboxes: [{ g: 0, from: 3, to: 5, at: 'footF', r: 12, dmg: 4, angle: 50, bkb: 40, kbg: 60, sfx: 'zap' }],
    anim: [{ f: 2, fF: [30, 30], lean: 10 }, { f: 4, fF: [50, 10], lean: 16 }],
  },
  ftilt: {
    id: 'ftilt', total: 16,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'footF', r: 15, dmg: 7, angle: 30, bkb: 26, kbg: 78, sfx: 'zap' }],
    anim: [{ f: 2, fF: [10, 30], lean: 4 }, { f: 4, fF: [60, 10], lean: 18 }],
  },
  utilt: {
    id: 'utilt', total: 18,
    hitboxes: [{ g: 0, from: 5, to: 7, at: 'footF', r: 15, dmg: 6, angle: 95, bkb: 32, kbg: 80, sfx: 'zap' }],
    anim: [{ f: 3, fF: [10, 30], lean: -4 }, { f: 5, fF: [-10, 90], lean: -10 }],
  },
  dtilt: {
    id: 'dtilt', total: 14,
    hitboxes: [{ g: 0, from: 3, to: 5, at: 'footF', r: 13, dmg: 5, angle: 12, bkb: 26, kbg: 66, sfx: 'zap' }],
    anim: [{ f: 2, hip: [0, 26], lean: 30, fF: [40, 6] }],
  },
  dashAttack: {
    id: 'dashAttack', total: 26,
    motion: [{ from: 1, to: 6, vx: 13 }, { from: 7, to: 16, damp: 0.82 }],
    hitboxes: [{ g: 0, from: 6, to: 10, at: 'center', off: [16, 0], r: 24, dmg: 8, angle: 40, bkb: 30, kbg: 70, sfx: 'zap' }],
    anim: [{ f: 3, lean: 20 }, { f: 6, lean: 30, hF: [26, 40] }],
  },
  fsmash: {
    id: 'fsmash', total: 34, charge: { frame: 6, smash: true },
    hitboxes: [{ g: 0, from: 7, to: 9, at: 'handF', r: 20, dmg: 14, angle: 30, bkb: 32, kbg: 92, sfx: 'zap', fx: 'spark' }],
    anim: [{ f: 4, hF: [-20, 60], lean: -14 }, { f: 7, hF: [60, 58], lean: 20 }],
  },
  usmash: {
    id: 'usmash', total: 30, charge: { frame: 5, smash: true },
    hitboxes: [{ g: 0, from: 6, to: 9, at: 'head', off: [0, 14], r: 22, dmg: 12, angle: 92, bkb: 36, kbg: 88, sfx: 'zap', fx: 'spark' }],
    anim: [{ f: 3, hip: [0, 30], hF: [20, 60] }, { f: 6, hip: [0, 50], hF: [10, 110] }],
  },
  dsmash: {
    id: 'dsmash', total: 32, charge: { frame: 5, smash: true },
    hitboxes: [
      { g: 0, from: 6, to: 8, pos: [34, 14], r: 22, dmg: 10, angle: 25, bkb: 32, kbg: 84, away: true, sfx: 'zap' },
      { g: 1, from: 6, to: 8, pos: [-34, 14], r: 22, dmg: 10, angle: 25, bkb: 32, kbg: 84, away: true, sfx: 'zap' },
    ],
    anim: [{ f: 3, hip: [0, 24], lean: 20 }, { f: 6, hip: [0, 24], fF: [30, 0], fB: [-30, 0] }],
  },
  nair: {
    id: 'nair', total: 26, air: true, landingLag: 5,
    hitboxes: [{ g: 0, from: 3, to: 16, at: 'center', r: 22, dmg: 7, angle: 45, bkb: 18, kbg: 78, sfx: 'zap' }],
    anim: [{ f: 2, spin: 0 }, { f: 16, spin: -540 }],
  },
  fair: {
    id: 'fair', total: 24, air: true, landingLag: 7,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'footF', r: 16, dmg: 9, angle: 38, bkb: 26, kbg: 80, sfx: 'zap' }],
    anim: [{ f: 2, fF: [10, 40], lean: -8 }, { f: 4, fF: [50, 20], lean: 14 }],
  },
  bair: {
    id: 'bair', total: 24, air: true, landingLag: 7,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'footB', r: 16, dmg: 10, angle: 150, bkb: 24, kbg: 84, sfx: 'zap' }],
    anim: [{ f: 2, fB: [-10, 40], lean: 8 }, { f: 4, fB: [-50, 20], lean: -14 }],
  },
  uair: {
    id: 'uair', total: 22, air: true, landingLag: 6,
    hitboxes: [{ g: 0, from: 3, to: 5, at: 'head', off: [0, 10], r: 18, dmg: 6, angle: 88, bkb: 28, kbg: 76, sfx: 'zap' }],
    anim: [{ f: 2, hip: [0, 34], hF: [10, 60] }],
  },
  dair: {
    id: 'dair', total: 28, air: true, landingLag: 14,
    hitboxes: [{ g: 0, from: 6, to: 8, at: 'footF', r: 16, dmg: 11, angle: 270, bkb: 26, kbg: 68, sfx: 'zap' }],
    anim: [{ f: 3, fF: [6, -10], lean: 0 }, { f: 6, fF: [4, -16] }],
  },
  nspecial: {
    id: 'nspecial', total: 34,
    hitboxes: [
      { g: 0, from: 6, to: 8, at: 'handF', r: 14, dmg: 2, angle: 40, bkb: 10, kbg: 20, fixed: 3, sfx: 'zap' },
      { g: 0, from: 10, to: 12, at: 'handF', r: 14, dmg: 2, angle: 40, bkb: 10, kbg: 20, fixed: 3, sfx: 'zap' },
      { g: 0, from: 14, to: 16, at: 'handF', r: 14, dmg: 2, angle: 40, bkb: 10, kbg: 20, fixed: 3, sfx: 'zap' },
      { g: 1, from: 18, to: 20, at: 'handF', r: 16, dmg: 5, angle: 45, bkb: 40, kbg: 60, sfx: 'zap', fx: 'spark' },
    ],
    anim: [
      { f: 4, hF: [30, 60], lean: 6 },
      { f: 6, hF: [40, 55], lean: 8 },
      { f: 10, hF: [42, 58], lean: 8 },
      { f: 14, hF: [40, 55], lean: 8 },
      { f: 18, hF: [50, 50], lean: 12 },
    ],
  },
  sspecial: {
    id: 'sspecial', total: 34, airOnce: true,
    motion: [{ from: 1, to: 14, vx: 16 }, { from: 15, to: 24, damp: 0.8 }],
    grab: { from: 3, to: 12, at: 'handF', r: 22, command: 'sspecialGrab' },
    hitboxes: [],
    anim: [{ f: 2, lean: 30, hF: [40, 52] }, { f: 14, lean: 30, hF: [40, 52] }],
  },
  sspecialGrab: {
    id: 'sspecialGrab', total: 30,
    hitboxes: [],
    throwDef: { release: 8, hit: { dmg: 11, angle: 40, bkb: 50, kbg: 62, sfx: 'zap' } },
    anim: [{ f: 3, hip: [0, 20], lean: 20 }, { f: 6, hip: [0, 20], lean: 20 }],
  },
  uspecial: {
    id: 'uspecial', total: 38, helpless: true, helplessLag: 18, onLand: 'lag', ledgeFrom: 6, edgeStop: false,
    motion: [{ from: 1, to: 3, noGrav: true, vy: 0 }, { from: 4, to: 16, noGrav: true, vy: -10.2 }, { from: 17, to: 22, damp: 0.9 }],
    hitboxes: [{ g: 0, from: 4, to: 14, at: 'center', r: 22, dmg: 8, angle: 85, bkb: 30, kbg: 70, sfx: 'zap', fx: 'spark' }],
    hooks: { start: (f: Fighter) => leaveGround(f, -1) },
    anim: [{ f: 3, hip: [0, 40], hF: [10, 70], hB: [-10, 68] }, { f: 16, hip: [0, 40], hF: [10, 70], hB: [-10, 68] }],
  },
  dspecial: {
    id: 'dspecial', total: 40, onLand: 'keep', armor: { from: 1, to: 40, threshold: 6 },
    hitboxes: [{ g: 0, from: 1, to: 40, at: 'center', r: 30, dmg: 1, angle: 90, bkb: 6, kbg: 14, fixed: 4, sfx: 'zap' }],
    anim: [{ f: 0, hip: [0, 24], spin: 0 }, { f: 40, hip: [0, 24], spin: 1080 }],
  },
};

export const VOLT: FighterDef = {
  id: 'volt',
  name: 'VOLT',
  archetype: 'Electric Speedster',
  tagline: 'The fastest thing on the stage. If it catches you, it never stops.',
  weight: 70,
  height: H,
  width: W,
  walkSpeed: 7.6,
  runSpeed: 13.6,
  dashSpeed: 14.0,
  dashFrames: 8,
  traction: 0.5,
  airSpeed: 7.8,
  airAccel: 0.62,
  airFriction: 0.13,
  gravity: 0.48,
  fallSpeed: 8.4,
  jumpV: 13.2,
  shortHopV: 9.4,
  doubleJumpV: 12.8,
  jumps: 1,
  rig,
  look: 'volt',
  palettes: [
    { main: '#ffe066', dark: '#a89424', light: '#fff5c0', accent: '#2ab0ff', skin: '#f3c9a0', eye: '#2a1810' },
    { main: '#66e0ff', dark: '#2494a8', light: '#c0f5ff', accent: '#ff5a8a', skin: '#e0b088', eye: '#2a1810' },
    { main: '#ff5a8a', dark: '#a8244a', light: '#ffc0d4', accent: '#66ffb0', skin: '#f0d0a0', eye: '#2a1810' },
    { main: '#b0ff66', dark: '#5aa424', light: '#e4ffc0', accent: '#ff9a2a', skin: '#d8a884', eye: '#2a1810' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 5, angle: 45, bkb: 50, kbg: 50 },
      b: { dmg: 7, angle: 135, bkb: 50, kbg: 62 },
      u: { dmg: 4, angle: 90, bkb: 60, kbg: 52 },
      d: { dmg: 3, angle: 78, bkb: 46, kbg: 36 },
    }),
    ...moves,
  },
};
