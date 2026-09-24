import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** MIRA — star witch. Staff pokes, star bolts, broom dash, warp recovery, hex circle. */
const rig: Rig = {
  hipH: 38, torso: 28, headR: 13, arm1: 16, arm2: 15, leg1: 22, leg2: 21,
  bodyR: 11, limbR: 4.4, handR: 5.6, footR: 6,
  weapon: { len: 62, width: 5, rest: 88, run: 110 },
};
const W = 46;
const H = 100;

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 18,
    hitboxes: [{ g: 0, from: 5, to: 7, at: 'blade', t: 0.95, r: 13, dmg: 4, angle: 40, bkb: 24, kbg: 34, sfx: 'spark' }],
    anim: [{ f: 2, w: 30 }, { f: 5, w: -10, lean: 10 }, { f: 9, w: -10, lean: 8 }],
  },
  ftilt: {
    id: 'ftilt', total: 26,
    hitboxes: [{ g: 0, from: 8, to: 11, at: 'blade', t: 1, r: 15, dmg: 9, angle: 34, bkb: 30, kbg: 80, sfx: 'spark', fx: 'spark' }],
    anim: [{ f: 4, w: 80, lean: -8 }, { f: 8, w: -20, lean: 14 }, { f: 11, w: -30, lean: 14 }],
  },
  utilt: {
    id: 'utilt', total: 28,
    hitboxes: [{ g: 0, from: 8, to: 12, at: 'blade', t: 1, r: 16, dmg: 8, angle: 90, bkb: 34, kbg: 82, sfx: 'spark' }],
    anim: [{ f: 3, w: -40 }, { f: 8, w: 70 }, { f: 12, w: 130, lean: -6 }],
  },
  dtilt: {
    id: 'dtilt', total: 22,
    hitboxes: [{ g: 0, from: 6, to: 9, at: 'blade', t: 1, r: 14, dmg: 6, angle: 18, bkb: 28, kbg: 64, sfx: 'spark' }],
    anim: [{ f: 3, hip: [0, 26], lean: 26, w: 20 }, { f: 6, hip: [0, 26], lean: 26, w: -20 }, { f: 9, hip: [0, 26], lean: 26, w: -20 }],
  },
  dashAttack: {
    id: 'dashAttack', total: 32,
    motion: [{ from: 1, to: 9, vx: 9 }, { from: 10, to: 20, damp: 0.86 }],
    hitboxes: [{ g: 0, from: 7, to: 12, at: 'blade', t: 1, r: 16, dmg: 9, angle: 42, bkb: 34, kbg: 70, sfx: 'spark', fx: 'spark' }],
    anim: [{ f: 4, w: 20, lean: 12 }, { f: 7, w: -10, lean: 24 }, { f: 12, w: -10, lean: 22 }],
  },
  fsmash: {
    id: 'fsmash', total: 48, charge: { frame: 12, smash: true },
    hitboxes: [{ g: 0, from: 14, to: 18, at: 'blade', t: 1, r: 24, dmg: 16, angle: 34, bkb: 34, kbg: 92, sfx: 'spark', fx: 'spark' }],
    anim: [{ f: 6, w: 20, lean: -14, hF: [-10, 64] }, { f: 12, w: 20, lean: -14, hF: [-10, 64] }, { f: 14, w: 0, lean: 18, hF: [44, 60] }, { f: 20, w: 0, lean: 18, hF: [44, 60] }],
  },
  usmash: {
    id: 'usmash', total: 46, charge: { frame: 9, smash: true },
    hitboxes: [{ g: 0, from: 12, to: 18, at: 'blade', t: 1, r: 26, dmg: 14, angle: 90, bkb: 38, kbg: 90, sfx: 'spark', fx: 'spark' }],
    anim: [{ f: 9, w: 40, hF: [20, 50] }, { f: 12, w: 90, hF: [10, 96] }, { f: 18, w: 90, hF: [10, 96] }],
  },
  dsmash: {
    id: 'dsmash', total: 46, charge: { frame: 8, smash: true },
    hitboxes: [
      { g: 0, from: 11, to: 15, pos: [54, 12], r: 24, dmg: 12, angle: 28, bkb: 32, kbg: 86, away: true, sfx: 'spark', fx: 'spark' },
      { g: 0, from: 11, to: 15, pos: [-54, 12], r: 24, dmg: 12, angle: 28, bkb: 32, kbg: 86, away: true, sfx: 'spark', fx: 'spark' },
    ],
    anim: [{ f: 6, w: 80, hF: [10, 80] }, { f: 11, w: -90, hF: [16, 64], hip: [0, 30], lean: 10 }, { f: 20, w: -90, hip: [0, 30] }],
  },
  nair: {
    id: 'nair', total: 32, air: true, landingLag: 7,
    hitboxes: [{ g: 0, from: 4, to: 18, at: 'blade', t: 0.9, r: 16, dmg: 7, angle: 45, bkb: 18, kbg: 78, sfx: 'spark' }],
    anim: [{ f: 2, w: 0 }, { f: 18, w: 720 }],
  },
  fair: {
    id: 'fair', total: 34, air: true, landingLag: 10,
    hitboxes: [{ g: 0, from: 8, to: 11, at: 'blade', t: 1, r: 18, dmg: 10, angle: 40, bkb: 28, kbg: 84, sfx: 'spark', fx: 'spark' }],
    anim: [{ f: 4, w: 100, lean: -8 }, { f: 8, w: -10, lean: 12 }, { f: 11, w: -30, lean: 12 }],
  },
  bair: {
    id: 'bair', total: 34, air: true, landingLag: 10,
    hitboxes: [{ g: 0, from: 8, to: 11, at: 'blade', t: 1, r: 18, dmg: 12, angle: 145, bkb: 26, kbg: 88, sfx: 'spark' }],
    anim: [{ f: 4, w: -20 }, { f: 8, w: 170, lean: -8 }, { f: 11, w: 190, lean: -8 }],
  },
  uair: {
    id: 'uair', total: 32, air: true, landingLag: 8,
    hitboxes: [{ g: 0, from: 6, to: 10, at: 'blade', t: 1, r: 18, dmg: 9, angle: 85, bkb: 28, kbg: 80, sfx: 'spark' }],
    anim: [{ f: 3, w: 10 }, { f: 6, w: 90 }, { f: 10, w: 150 }],
  },
  dair: {
    id: 'dair', total: 40, air: true, landingLag: 16,
    hitboxes: [{ g: 0, from: 11, to: 14, at: 'blade', t: 1, r: 18, dmg: 12, angle: 270, bkb: 26, kbg: 74, sfx: 'spark', fx: 'spark' }],
    anim: [{ f: 5, w: 40 }, { f: 11, w: -90 }, { f: 14, w: -90 }],
  },
  nspecial: {
    id: 'nspecial', total: 38, iasa: 30,
    projectiles: [{
      frame: 12, kind: 'star', at: 'handF', vx: 14, vy: 0, life: 56, r: 14, reflectable: true,
      hit: { dmg: 8, angle: 38, bkb: 30, kbg: 50, sfx: 'spark' },
    }],
    hitboxes: [],
    anim: [{ f: 6, w: 60, lean: -6 }, { f: 12, w: 0, lean: 10, hF: [40, 62] }, { f: 20, w: 0, lean: 8, hF: [40, 62] }],
  },
  sspecial: {
    id: 'sspecial', total: 44, airOnce: true,
    motion: [{ from: 4, to: 28, vx: 12, noGrav: true, vy: -0.4 }, { from: 29, to: 36, damp: 0.84 }],
    hitboxes: [{ g: 0, from: 5, to: 28, at: 'center', r: 24, dmg: 9, angle: 40, bkb: 42, kbg: 60, sfx: 'spark' }],
    anim: [{ f: 3, hip: [0, 40], lean: 40, w: 180, fF: [20, 20], fB: [-24, 20] }, { f: 28, hip: [0, 40], lean: 40, w: 180, fF: [20, 20], fB: [-24, 20] }],
  },
  uspecial: {
    id: 'uspecial', total: 42, helpless: true, helplessLag: 22, onLand: 'lag', ledgeFrom: 16, edgeStop: false,
    intangible: [[6, 18]],
    motion: [{ from: 1, to: 5, noGrav: true, vy: 0 }, { from: 6, to: 16, noGrav: true, vy: -15, drift: 1.2 }, { from: 17, to: 26, damp: 0.86 }],
    hitboxes: [{ g: 0, from: 18, to: 21, at: 'center', r: 32, dmg: 7, angle: 70, bkb: 50, kbg: 50, sfx: 'spark', fx: 'spark' }],
    hooks: { start: (f: Fighter) => leaveGround(f, -1) },
    anim: [{ f: 4, hip: [0, 30], w: 90, hF: [10, 80] }, { f: 16, hip: [0, 40], spin: 720, w: 90 }, { f: 20, hip: [0, 40], spin: 720, w: 90 }],
  },
  dspecial: {
    id: 'dspecial', total: 50,
    hitboxes: [
      { g: 0, from: 16, to: 28, pos: [0, 16], r: 60, dmg: 2, angle: 90, bkb: 10, kbg: 10, fixed: 30, sfx: 'spark', fx: 'spark' },
      { g: 1, from: 29, to: 32, pos: [0, 30], r: 64, dmg: 8, angle: 80, bkb: 50, kbg: 70, sfx: 'spark', fx: 'spark' },
    ],
    anim: [{ f: 8, w: 90, hF: [20, 100], lean: -6 }, { f: 16, w: -90, hF: [20, 40], lean: 12 }, { f: 32, w: -90, hF: [20, 40], lean: 12 }],
  },
};

export const MIRA: FighterDef = {
  id: 'mira',
  name: 'MIRA',
  archetype: 'Star Witch',
  tagline: 'Keeps you at staff length and fills the sky with falling stars.',
  weight: 80,
  height: H,
  width: W,
  walkSpeed: 5, runSpeed: 8.8, dashSpeed: 9.6, dashFrames: 11, traction: 0.6,
  airSpeed: 6.6, airAccel: 0.46, airFriction: 0.09, gravity: 0.42, fallSpeed: 7.6,
  jumpV: 13, shortHopV: 9, doubleJumpV: 12.8, jumps: 1,
  rig,
  look: 'mira',
  palettes: [
    { main: '#6a3ad8', dark: '#2a1a5a', light: '#e0d0ff', accent: '#ffd23f', skin: '#f3d0b0', eye: '#6a3ad8' },
    { main: '#1a1a2a', dark: '#0a0a14', light: '#c0c0d8', accent: '#5affd8', skin: '#e0c0a0', eye: '#5affd8' },
    { main: '#d83a8a', dark: '#5a1a3a', light: '#ffd0e8', accent: '#ffffff', skin: '#c89a74', eye: '#d83a8a' },
    { main: '#2f8a5a', dark: '#1a3a2a', light: '#d0ffe0', accent: '#ff9a3a', skin: '#f0d8c0', eye: '#2f8a5a' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 6, angle: 45, bkb: 56, kbg: 52 },
      b: { dmg: 8, angle: 135, bkb: 56, kbg: 64 },
      u: { dmg: 6, angle: 90, bkb: 64, kbg: 54 },
      d: { dmg: 4, angle: 75, bkb: 50, kbg: 40 },
    }),
    ...moves,
  },
};
