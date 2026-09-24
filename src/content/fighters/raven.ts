import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** RAVEN — naginata duelist. Long disjointed range, technical spacing tool. */
const rig: Rig = {
  hipH: 40, torso: 30, headR: 13, arm1: 17, arm2: 16, leg1: 24, leg2: 23,
  bodyR: 11, limbR: 4.6, handR: 6, footR: 6.5,
  weapon: { len: 92, width: 5, rest: 80, run: 165 },
};
const W = 50;
const H = 96;

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 20,
    hitboxes: [{ g: 0, from: 5, to: 8, at: 'blade', t: 0.7, r: 12, dmg: 4, angle: 40, bkb: 24, kbg: 34, sfx: 'slash' }],
    anim: [{ f: 2, w: 10, lean: 6 }, { f: 5, w: -30, lean: 12 }, { f: 9, w: -20, lean: 8 }],
  },
  ftilt: {
    id: 'ftilt', total: 26,
    hitboxes: [{ g: 0, from: 9, to: 12, at: 'blade', t: 0.85, r: 14, dmg: 10, angle: 30, bkb: 30, kbg: 82, sfx: 'slash' }],
    anim: [{ f: 4, w: 60, lean: -10 }, { f: 9, w: -40, lean: 14 }, { f: 12, w: -50, lean: 14 }],
  },
  utilt: {
    id: 'utilt', total: 28,
    hitboxes: [{ g: 0, from: 8, to: 12, at: 'blade', t: 0.9, r: 14, dmg: 9, angle: 88, bkb: 36, kbg: 84, sfx: 'slash' }],
    anim: [{ f: 3, w: -80, lean: 4 }, { f: 8, w: 100, lean: -6 }, { f: 12, w: 96, lean: -6 }],
  },
  dtilt: {
    id: 'dtilt', total: 22,
    hitboxes: [{ g: 0, from: 6, to: 9, at: 'blade', t: 0.8, r: 13, dmg: 7, angle: 16, bkb: 30, kbg: 70, sfx: 'slash' }],
    anim: [
      { f: 3, hip: [0, 30], lean: 30, w: 30 },
      { f: 6, hip: [0, 30], lean: 30, w: -50 },
      { f: 10, hip: [0, 30], lean: 30, w: -46 },
    ],
  },
  dashAttack: {
    id: 'dashAttack', total: 34,
    motion: [{ from: 1, to: 9, vx: 10 }, { from: 10, to: 22, damp: 0.86 }],
    hitboxes: [{ g: 0, from: 10, to: 14, at: 'blade', t: 0.9, r: 15, dmg: 11, angle: 40, bkb: 34, kbg: 78, sfx: 'slash' }],
    anim: [{ f: 6, lean: 14, w: 40 }, { f: 10, lean: 18, w: -60 }, { f: 14, lean: 16, w: -56 }],
  },
  fsmash: {
    id: 'fsmash', total: 52, charge: { frame: 12, smash: true },
    hitboxes: [{ g: 0, from: 13, to: 16, at: 'blade', t: 1.0, r: 16, dmg: 18, angle: 32, bkb: 34, kbg: 96, sfx: 'slash', fx: 'swoosh' }],
    anim: [{ f: 6, w: 100, lean: -16 }, { f: 12, w: 100, lean: -16 }, { f: 14, w: -70, lean: 20 }, { f: 17, w: -78, lean: 22 }],
  },
  usmash: {
    id: 'usmash', total: 48, charge: { frame: 10, smash: true },
    hitboxes: [{ g: 0, from: 11, to: 14, at: 'blade', t: 1.0, r: 16, dmg: 16, angle: 90, bkb: 38, kbg: 94, sfx: 'slash' }],
    anim: [{ f: 5, w: -120, lean: 6 }, { f: 10, w: -120, lean: 6 }, { f: 12, w: 110, lean: -8 }, { f: 15, w: 118, lean: -8 }],
  },
  dsmash: {
    id: 'dsmash', total: 50, charge: { frame: 9, smash: true },
    hitboxes: [
      { g: 0, from: 10, to: 13, pos: [58, 20], r: 20, dmg: 13, angle: 20, bkb: 34, kbg: 90, sfx: 'slash' },
      { g: 1, from: 22, to: 25, pos: [-58, 20], r: 20, dmg: 13, angle: 20, bkb: 34, kbg: 90, sfx: 'slash' },
    ],
    anim: [
      { f: 5, hip: [0, 30], lean: 20, w: 20 },
      { f: 10, hip: [0, 30], lean: 20, w: -60 },
      { f: 16, hip: [0, 30], lean: -20, w: 60 },
      { f: 23, hip: [0, 30], lean: -20, w: -50 },
    ],
  },
  nair: {
    id: 'nair', total: 36, air: true, landingLag: 9,
    hitboxes: [{ g: 0, from: 5, to: 20, at: 'blade', t: 0.75, r: 15, dmg: 8, angle: 45, bkb: 20, kbg: 82, sfx: 'slash' }],
    anim: [{ f: 3, spin: 0, w: 0 }, { f: 20, spin: -360, w: 0 }],
  },
  fair: {
    id: 'fair', total: 34, air: true, landingLag: 11,
    hitboxes: [{ g: 0, from: 8, to: 11, at: 'blade', t: 1.0, r: 15, dmg: 12, angle: 38, bkb: 30, kbg: 86, sfx: 'slash' }],
    anim: [{ f: 4, w: 70, lean: -10 }, { f: 8, w: -60, lean: 12 }, { f: 11, w: -66, lean: 12 }],
  },
  bair: {
    id: 'bair', total: 32, air: true, landingLag: 10,
    hitboxes: [{ g: 0, from: 8, to: 11, at: 'blade', t: 1.0, r: 15, dmg: 13, angle: 145, bkb: 30, kbg: 88, sfx: 'slash' }],
    anim: [{ f: 4, w: -70, lean: 8 }, { f: 8, w: 70, lean: -12 }, { f: 11, w: 76, lean: -12 }],
  },
  uair: {
    id: 'uair', total: 32, air: true, landingLag: 9,
    hitboxes: [{ g: 0, from: 7, to: 10, at: 'blade', t: 1.0, r: 15, dmg: 10, angle: 85, bkb: 30, kbg: 84, sfx: 'slash' }],
    anim: [{ f: 3, w: -100, lean: 0 }, { f: 7, w: 110, lean: 0 }, { f: 10, w: 116, lean: 0 }],
  },
  dair: {
    id: 'dair', total: 42, air: true, landingLag: 20,
    hitboxes: [{ g: 0, from: 11, to: 15, at: 'blade', t: 1.0, r: 15, dmg: 15, angle: 270, bkb: 26, kbg: 76, sfx: 'slash', fx: 'swoosh' }],
    anim: [{ f: 6, w: 90, lean: 0 }, { f: 11, w: -170, lean: 0 }, { f: 15, w: -160, lean: 0 }],
  },
  nspecial: {
    id: 'nspecial', total: 44, charge: { frame: 10, btn: 'special', max: 30 },
    hitboxes: [{
      g: 0, from: 11, to: 14, at: 'blade', t: 1.0, r: 14, sfx: 'tip',
      dmg: 10, angle: 30, bkb: 30, kbg: 70,
      charge: { dmg: [10, 20], bkb: [30, 45], kbg: [70, 96] },
    }],
    anim: [{ f: 6, w: -50, lean: -10 }, { f: 10, w: -50, lean: -10 }, { f: 12, w: 40, lean: 14 }, { f: 16, w: 34, lean: 14 }],
  },
  sspecial: {
    id: 'sspecial', total: 42, airOnce: true,
    motion: [{ from: 1, to: 16, vx: 13, vy: -1.5 }, { from: 17, to: 28, damp: 0.85 }],
    hitboxes: [{ g: 0, from: 3, to: 16, at: 'footF', r: 22, dmg: 12, angle: 300, bkb: 40, kbg: 62, sfx: 'kick' }],
    hooks: { start: (f: Fighter) => leaveGround(f, -4) },
    anim: [{ f: 2, lean: -50, fF: [40, 20], fB: [-10, 30] }, { f: 16, lean: -50, fF: [40, 20], fB: [-10, 30] }],
  },
  uspecial: {
    id: 'uspecial', total: 44, helpless: true, helplessLag: 20, onLand: 'lag', ledgeFrom: 8, edgeStop: false,
    motion: [{ from: 1, to: 3, noGrav: true, vy: 0 }, { from: 4, to: 18, noGrav: true, vy: -8.6, drift: 0.7 }, { from: 19, to: 26, damp: 0.9 }],
    hitboxes: [{ g: 0, from: 4, to: 18, at: 'blade', t: 0.85, r: 16, dmg: 11, angle: 80, bkb: 32, kbg: 78, sfx: 'slash', fx: 'swoosh' }],
    hooks: { start: (f: Fighter) => leaveGround(f, -2) },
    anim: [{ f: 3, spin: 0, w: 0 }, { f: 18, spin: 900, w: 0 }],
  },
  dspecial: {
    id: 'dspecial', total: 46,
    projectiles: [{
      frame: 14, kind: 'blade', at: 'handF', vx: 15, vy: -1, gravity: 0.1, life: 55, r: 10, reflectable: true,
      hit: { dmg: 8, angle: 20, bkb: 28, kbg: 48, sfx: 'slash' },
    }],
    hitboxes: [],
    anim: [{ f: 7, hF: [-10, 60], lean: -6 }, { f: 14, hF: [46, 62], lean: 8 }, { f: 20, hF: [40, 58], lean: 6 }],
  },
};

export const RAVEN: FighterDef = {
  id: 'raven',
  name: 'RAVEN',
  archetype: 'Naginata Duelist',
  tagline: 'Wins the neutral before the fight even starts.',
  weight: 92,
  height: H,
  width: W,
  walkSpeed: 5.6,
  runSpeed: 9.6,
  dashSpeed: 10.4,
  dashFrames: 11,
  traction: 0.68,
  airSpeed: 6.2,
  airAccel: 0.46,
  airFriction: 0.1,
  gravity: 0.5,
  fallSpeed: 8.8,
  jumpV: 13.4,
  shortHopV: 9.2,
  doubleJumpV: 13.0,
  jumps: 1,
  rig,
  look: 'raven',
  palettes: [
    { main: '#40405e', dark: '#1e1e30', light: '#9a9ab8', accent: '#ff4a6a', skin: '#e0c0a0', eye: '#ff4a6a' },
    { main: '#5a2a44', dark: '#2a1020', light: '#c888a8', accent: '#ffd85a', skin: '#d0a888', eye: '#ffd85a' },
    { main: '#2a4460', dark: '#12202e', light: '#88aac8', accent: '#5affd8', skin: '#e0c0a0', eye: '#5affd8' },
    { main: '#3e5428', dark: '#1a2610', light: '#a8c888', accent: '#ff8a5a', skin: '#d0b088', eye: '#ff8a5a' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 6, angle: 45, bkb: 56, kbg: 54 },
      b: { dmg: 8, angle: 135, bkb: 56, kbg: 66 },
      u: { dmg: 5, angle: 90, bkb: 66, kbg: 56 },
      d: { dmg: 4, angle: 75, bkb: 50, kbg: 38 },
    }),
    ...moves,
  },
};
