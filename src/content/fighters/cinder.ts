import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** CINDER — pyro rushdown. Light, fast, high damage combos; low defense. */
const rig: Rig = {
  hipH: 40, torso: 28, headR: 14, arm1: 16, arm2: 15, leg1: 22, leg2: 21,
  bodyR: 12, limbR: 5, handR: 6.5, footR: 7,
};
const W = 50;
const H = 92;

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 15,
    hitboxes: [{ g: 0, from: 2, to: 3, at: 'handF', r: 12, dmg: 2, angle: 30, bkb: 15, kbg: 25, sfx: 'fire', fx: 'fire' }],
    next: { from: 5, to: 13, btn: 'attack', id: 'jab2' },
    anim: [{ f: 1, hF: [12, 60], lean: 8 }, { f: 2, hF: [30, 62], lean: 12 }, { f: 5, hF: [27, 62], lean: 12 }],
  },
  jab2: {
    id: 'jab2', total: 22,
    hitboxes: [{ g: 0, from: 3, to: 5, at: 'footF', r: 13, dmg: 6, angle: 45, bkb: 40, kbg: 80, sfx: 'fire', fx: 'fire' }],
    anim: [
      { f: 2, fF: [8, 24], lean: -6 },
      { f: 3, fF: [40, 30], hip: [-3, 34], lean: -16, hF: [-4, 66], hB: [-18, 60] },
      { f: 6, fF: [38, 30], hip: [-3, 34], lean: -16 },
    ],
  },
  ftilt: {
    id: 'ftilt', total: 20,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'handF', r: 15, dmg: 8, angle: 35, bkb: 20, kbg: 95, sfx: 'fire', fx: 'fire' }],
    anim: [
      { f: 2, hF: [10, 50], lean: -6 },
      { f: 4, hF: [46, 56], hip: [4, 36], lean: 16 },
      { f: 7, hF: [44, 52], hip: [4, 36], lean: 16 },
    ],
  },
  utilt: {
    id: 'utilt', total: 22,
    hitboxes: [{ g: 0, from: 4, to: 8, at: 'handF', r: 14, dmg: 6, angle: 92, bkb: 25, kbg: 110, sfx: 'fire', fx: 'fire' }],
    anim: [
      { f: 2, hF: [22, 46], lean: 6 },
      { f: 4, hF: [24, 82], lean: 0 },
      { f: 8, hF: [-16, 88], lean: -8 },
    ],
  },
  dtilt: {
    id: 'dtilt', total: 16,
    hitboxes: [{ g: 0, from: 3, to: 5, at: 'footF', r: 13, dmg: 6, angle: 78, bkb: 40, kbg: 55, sfx: 'fire', fx: 'fire' }],
    anim: [
      { f: 2, hip: [0, 22], lean: 28, fF: [12, 4], fB: [-12, 0] },
      { f: 3, hip: [0, 22], lean: 28, fF: [42, 6] },
      { f: 6, hip: [0, 22], lean: 28, fF: [40, 6] },
    ],
  },
  dashAttack: {
    id: 'dashAttack', total: 32,
    motion: [{ from: 1, to: 8, vx: 12 }, { from: 9, to: 22, damp: 0.85 }],
    hitboxes: [
      { g: 0, from: 5, to: 8, at: 'center', off: [16, 0], r: 26, dmg: 9, angle: 50, bkb: 45, kbg: 70, sfx: 'fire', fx: 'fire' },
    ],
    anim: [
      { f: 3, hip: [4, 40], lean: -18, fF: [16, 26] },
      { f: 5, hip: [4, 40], lean: -20, hF: [-6, 60], hB: [-18, 52] },
      { f: 12, hip: [4, 38], lean: -18 },
    ],
  },
  fsmash: {
    id: 'fsmash', total: 46, charge: { frame: 8, smash: true },
    hitboxes: [
      { g: 0, from: 13, to: 15, at: 'handF', r: 20, dmg: 15, angle: 36, bkb: 26, kbg: 96, sfx: 'fire', fx: 'fire' },
    ],
    anim: [
      { f: 5, hF: [-14, 54], lean: -12 },
      { f: 8, hF: [-14, 54], lean: -12 },
      { f: 13, hF: [50, 58], hip: [6, 34], lean: 24 },
      { f: 16, hF: [48, 50], hip: [6, 34], lean: 24 },
    ],
  },
  usmash: {
    id: 'usmash', total: 40, charge: { frame: 5, smash: true },
    hitboxes: [{ g: 0, from: 8, to: 12, at: 'head', r: 18, dmg: 13, angle: 88, bkb: 30, kbg: 96, sfx: 'fire', fx: 'fire' }],
    anim: [
      { f: 4, hip: [0, 26], lean: 16 },
      { f: 8, hip: [0, 46], lean: -6, hF: [-14, 60], hB: [-20, 56] },
      { f: 12, hip: [0, 44], lean: -10 },
    ],
  },
  dsmash: {
    id: 'dsmash', total: 42, charge: { frame: 3, smash: true },
    hitboxes: [
      { g: 0, from: 4, to: 6, at: 'footF', r: 15, dmg: 11, angle: 28, bkb: 24, kbg: 92, sfx: 'fire', fx: 'fire' },
      { g: 0, from: 10, to: 12, at: 'footB', r: 15, dmg: 11, angle: 150, bkb: 24, kbg: 92, sfx: 'fire', fx: 'fire' },
    ],
    anim: [
      { f: 3, hip: [0, 20], lean: 36, fF: [14, 4], fB: [-8, 4] },
      { f: 4, hip: [0, 20], lean: 36, fF: [40, 6] },
      { f: 8, hip: [0, 20], lean: 36, fF: [8, 16], fB: [-8, 10] },
      { f: 10, hip: [0, 20], lean: 36, fB: [-40, 6] },
    ],
  },
  nair: {
    id: 'nair', total: 34, air: true, landingLag: 6,
    hitboxes: [
      { g: 0, from: 3, to: 6, at: 'center', r: 26, dmg: 8, angle: 40, bkb: 10, kbg: 100, away: true, sfx: 'fire', fx: 'fire' },
    ],
    anim: [{ f: 3, hip: [0, 48], lean: 6, hF: [22, 44], hB: [-16, 44], fF: [14, 30], fB: [-14, 30] }, { f: 20, hip: [0, 48], lean: 6 }],
  },
  fair: {
    id: 'fair', total: 40, air: true, landingLag: 12,
    hitboxes: [{ g: 0, from: 8, to: 11, at: 'handF', r: 17, dmg: 11, angle: 38, bkb: 24, kbg: 90, sfx: 'fire', fx: 'fire' }],
    anim: [{ f: 5, hF: [8, 74], lean: -10 }, { f: 8, hF: [42, 54], lean: 16 }, { f: 11, hF: [40, 44], lean: 18 }],
  },
  bair: {
    id: 'bair', total: 30, air: true, landingLag: 7,
    hitboxes: [{ g: 0, from: 5, to: 8, at: 'footB', r: 16, dmg: 10, angle: 145, bkb: 14, kbg: 98, sfx: 'fire', fx: 'fire' }],
    anim: [{ f: 3, fB: [-8, 30], lean: 18 }, { f: 5, fB: [-40, 38], lean: 24 }, { f: 8, fB: [-38, 38], lean: 24 }],
  },
  uair: {
    id: 'uair', total: 28, air: true, landingLag: 6,
    hitboxes: [{ g: 0, from: 3, to: 6, at: 'footF', r: 15, dmg: 7, angle: 80, bkb: 22, kbg: 108, sfx: 'fire', fx: 'fire' }],
    anim: [{ f: 2, fF: [10, 26] }, { f: 3, fF: [18, 78], lean: -16 }, { f: 6, fF: [-14, 74], lean: -20 }],
  },
  dair: {
    id: 'dair', total: 38, air: true, landingLag: 15,
    hitboxes: [{ g: 0, from: 9, to: 13, at: 'footF', r: 15, dmg: 12, angle: 270, bkb: 26, kbg: 80, sfx: 'fire', fx: 'fire' }],
    anim: [{ f: 6, fF: [6, 30], lean: -8 }, { f: 9, fF: [6, -6], lean: 4 }, { f: 13, fF: [6, -6], lean: 4 }],
  },
  nspecial: {
    id: 'nspecial', total: 40,
    hitboxes: [
      { g: 0, from: 6, to: 8, pos: [30, 56], r: 20, dmg: 2, angle: 20, bkb: 0, kbg: 0, fixed: 30, hitlag: 0.4, sfx: 'fire', fx: 'fire' },
      { g: 1, from: 9, to: 11, pos: [46, 54], r: 20, dmg: 2, angle: 20, bkb: 0, kbg: 0, fixed: 30, hitlag: 0.4, sfx: 'fire', fx: 'fire' },
      { g: 2, from: 12, to: 14, pos: [62, 52], r: 20, dmg: 2, angle: 20, bkb: 0, kbg: 0, fixed: 30, hitlag: 0.4, sfx: 'fire', fx: 'fire' },
      { g: 3, from: 15, to: 17, pos: [72, 50], r: 22, dmg: 4, angle: 35, bkb: 40, kbg: 70, sfx: 'fire', fx: 'fire' },
    ],
    anim: [
      { f: 4, hF: [10, 58], lean: -6 },
      { f: 6, hF: [40, 56], lean: 14 },
      { f: 17, hF: [40, 56], lean: 14 },
    ],
  },
  sspecial: {
    id: 'sspecial', total: 40, airOnce: true,
    motion: [{ from: 1, to: 16, vx: 14 }, { from: 17, to: 26, damp: 0.82 }],
    hitboxes: [{ g: 0, from: 4, to: 16, at: 'center', off: [14, 0], r: 24, dmg: 10, angle: 40, bkb: 40, kbg: 65, sfx: 'fire', fx: 'fire' }],
    anim: [
      { f: 3, hip: [4, 44], lean: -30, hF: [-14, 56], hB: [-20, 50] },
      { f: 16, hip: [4, 44], lean: -30 },
      { f: 22, lean: 0 },
    ],
  },
  uspecial: {
    id: 'uspecial', total: 46, helpless: true, helplessLag: 22, onLand: 'lag', ledgeFrom: 12, edgeStop: false,
    motion: [
      { from: 1, to: 2, vy: 0, noGrav: true },
      { from: 3, to: 14, vy: -14.5, noGrav: true, drift: 0.6 },
      { from: 15, to: 24, vy: -6, noGrav: true, drift: 0.7 },
    ],
    hitboxes: [{ g: 0, from: 3, to: 12, at: 'center', r: 24, dmg: 12, angle: 80, bkb: 40, kbg: 90, sfx: 'fire', fx: 'fire' }],
    hooks: { start: (f: Fighter) => leaveGround(f, -2) },
    anim: [
      { f: 2, hip: [0, 32], lean: 10 },
      { f: 3, hip: [0, 44], lean: -8, hF: [10, 90], hB: [-10, 50], fF: [8, 6], fB: [-10, 14] },
      { f: 24, hip: [0, 44], lean: -8 },
    ],
  },
  dspecial: {
    id: 'dspecial', total: 46,
    hitboxes: [
      { g: 0, from: 10, to: 12, pos: [36, 12], r: 30, dmg: 8, angle: 65, bkb: 45, kbg: 60, away: true, sfx: 'fire', fx: 'fire' },
      { g: 0, from: 10, to: 12, pos: [-36, 12], r: 30, dmg: 8, angle: 65, bkb: 45, kbg: 60, away: true, sfx: 'fire', fx: 'fire' },
    ],
    anim: [
      { f: 4, hip: [0, 30], lean: -20, hF: [-10, 44], hB: [-16, 40] },
      { f: 10, hip: [0, 22], lean: 22, fF: [16, 0], fB: [-16, 0] },
      { f: 14, hip: [0, 22], lean: 22, fF: [16, 0], fB: [-16, 0] },
    ],
  },
};

export const CINDER: FighterDef = {
  id: 'cinder',
  name: 'CINDER',
  archetype: 'Pyro Rushdown',
  tagline: 'Glass cannon. Light on her feet, heavy on the burn damage.',
  weight: 82,
  height: H,
  width: W,
  walkSpeed: 6.4,
  runSpeed: 11.8,
  dashSpeed: 12.2,
  dashFrames: 10,
  traction: 0.62,
  airSpeed: 7.0,
  airAccel: 0.56,
  airFriction: 0.11,
  gravity: 0.5,
  fallSpeed: 9.2,
  jumpV: 13.6,
  shortHopV: 9.6,
  doubleJumpV: 13.3,
  jumps: 1,
  rig,
  look: 'nova',
  palettes: [
    { main: '#ff5a2a', dark: '#a8320f', light: '#ffc890', accent: '#ffe066', skin: '#f3c9a0', eye: '#2a1810' },
    { main: '#ff2a6a', dark: '#a8123f', light: '#ffb0d0', accent: '#66e0ff', skin: '#f3c9a0', eye: '#2a1810' },
    { main: '#2a3aff', dark: '#12189f', light: '#a8b8ff', accent: '#ffb066', skin: '#e0b088', eye: '#2a1810' },
    { main: '#2aff8a', dark: '#0f9f52', light: '#b0ffd0', accent: '#ff6688', skin: '#f0d0a0', eye: '#2a1810' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 7, angle: 45, bkb: 58, kbg: 55 },
      b: { dmg: 9, angle: 135, bkb: 58, kbg: 68 },
      u: { dmg: 6, angle: 90, bkb: 70, kbg: 58 },
      d: { dmg: 5, angle: 72, bkb: 52, kbg: 40 },
    }),
    ...moves,
  },
};
