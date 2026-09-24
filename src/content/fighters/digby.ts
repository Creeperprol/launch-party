import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** DIGBY — blocky miner-builder. Pickaxe swings, lobbed dirt blocks, stacks a pillar to recover. */
const rig: Rig = {
  hipH: 38, torso: 30, headR: 15, arm1: 16, arm2: 15, leg1: 21, leg2: 20,
  bodyR: 13, limbR: 6, handR: 6.5, footR: 7,
  weapon: { len: 46, width: 6, rest: 105, run: 125 },
};
const W = 52;
const H = 98;

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 18,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'handF', r: 13, dmg: 3, angle: 45, bkb: 22, kbg: 30, sfx: 'punch' }],
    next: { from: 4, to: 14, btn: 'attack', id: 'jab2' },
    anim: [{ f: 2, hF: [22, 60], lean: 4 }, { f: 4, hF: [44, 60], lean: 10 }],
  },
  jab2: {
    id: 'jab2', total: 24,
    hitboxes: [{ g: 0, from: 6, to: 9, at: 'blade', t: 0.9, r: 15, dmg: 6, angle: 40, bkb: 42, kbg: 70, sfx: 'blunt' }],
    anim: [{ f: 3, w: 90, lean: -6 }, { f: 7, w: -30, lean: 14 }, { f: 10, w: -40, lean: 14 }],
  },
  ftilt: {
    id: 'ftilt', total: 28,
    hitboxes: [{ g: 0, from: 9, to: 12, at: 'blade', t: 0.95, r: 16, dmg: 10, angle: 35, bkb: 30, kbg: 84, sfx: 'blunt' }],
    anim: [{ f: 5, w: 110, lean: -10 }, { f: 9, w: -20, lean: 16 }, { f: 12, w: -45, lean: 18 }],
  },
  utilt: {
    id: 'utilt', total: 28,
    hitboxes: [{ g: 0, from: 8, to: 12, at: 'blade', t: 0.95, r: 16, dmg: 9, angle: 92, bkb: 36, kbg: 84, sfx: 'blunt' }],
    anim: [{ f: 3, w: -40 }, { f: 8, w: 90, lean: -4 }, { f: 12, w: 150, lean: -8 }],
  },
  dtilt: {
    id: 'dtilt', total: 22,
    hitboxes: [{ g: 0, from: 6, to: 9, at: 'blade', t: 0.9, r: 14, dmg: 7, angle: 20, bkb: 30, kbg: 68, sfx: 'blunt' }],
    anim: [{ f: 3, hip: [0, 26], lean: 30, w: 40 }, { f: 6, hip: [0, 26], lean: 30, w: -60 }, { f: 10, hip: [0, 26], lean: 30, w: -64 }],
  },
  dashAttack: {
    id: 'dashAttack', total: 34,
    motion: [{ from: 1, to: 8, vx: 10 }, { from: 9, to: 22, damp: 0.85 }],
    hitboxes: [{ g: 0, from: 8, to: 13, at: 'blade', t: 0.9, r: 16, dmg: 10, angle: 45, bkb: 36, kbg: 70, sfx: 'blunt' }],
    anim: [{ f: 4, w: 120, lean: 6 }, { f: 8, w: -20, lean: 22 }, { f: 13, w: -50, lean: 22 }],
  },
  fsmash: {
    id: 'fsmash', total: 52, charge: { frame: 12, smash: true },
    hitboxes: [{ g: 0, from: 14, to: 17, at: 'blade', t: 1, r: 18, dmg: 17, angle: 36, bkb: 32, kbg: 96, sfx: 'heavy', fx: 'swoosh' }],
    anim: [{ f: 6, w: 150, lean: -16 }, { f: 12, w: 150, lean: -16 }, { f: 15, w: -30, lean: 24 }, { f: 18, w: -60, lean: 26 }],
  },
  usmash: {
    id: 'usmash', total: 46, charge: { frame: 9, smash: true },
    hitboxes: [{ g: 0, from: 11, to: 15, at: 'blade', t: 1, r: 18, dmg: 15, angle: 90, bkb: 38, kbg: 92, sfx: 'heavy' }],
    anim: [{ f: 5, w: -60, lean: 6 }, { f: 9, w: -60, lean: 6 }, { f: 12, w: 90, lean: -6 }, { f: 15, w: 160, lean: -10 }],
  },
  dsmash: {
    id: 'dsmash', total: 48, charge: { frame: 8, smash: true },
    hitboxes: [
      { g: 0, from: 10, to: 13, at: 'blade', t: 1, r: 20, dmg: 13, angle: 25, bkb: 32, kbg: 88, sfx: 'blunt' },
      { g: 1, from: 20, to: 23, at: 'blade', t: 1, r: 20, dmg: 13, angle: 25, bkb: 32, kbg: 88, sfx: 'blunt' },
    ],
    anim: [
      { f: 4, hip: [0, 28], lean: 20, w: 60 },
      { f: 10, hip: [0, 28], lean: 26, w: -60, hF: [24, 44] },
      { f: 16, hip: [0, 28], lean: -20, w: 100, hF: [0, 70] },
      { f: 20, hip: [0, 28], lean: -24, w: -120, hF: [-22, 44] },
      { f: 24, hip: [0, 28], lean: -24, w: -120, hF: [-22, 44] },
    ],
  },
  nair: {
    id: 'nair', total: 34, air: true, landingLag: 8,
    hitboxes: [{ g: 0, from: 5, to: 18, at: 'blade', t: 0.8, r: 16, dmg: 8, angle: 45, bkb: 20, kbg: 80, sfx: 'blunt' }],
    anim: [{ f: 3, spin: 0, w: 0 }, { f: 18, spin: -360, w: 0 }],
  },
  fair: {
    id: 'fair', total: 38, air: true, landingLag: 12,
    hitboxes: [{ g: 0, from: 10, to: 13, at: 'blade', t: 1, r: 17, dmg: 13, angle: 290, bkb: 30, kbg: 76, sfx: 'heavy' }],
    anim: [{ f: 5, w: 120, lean: -10 }, { f: 10, w: -40, lean: 16 }, { f: 13, w: -80, lean: 16 }],
  },
  bair: {
    id: 'bair', total: 32, air: true, landingLag: 10,
    hitboxes: [{ g: 0, from: 7, to: 10, at: 'footB', r: 16, dmg: 11, angle: 145, bkb: 26, kbg: 86, sfx: 'kick' }],
    anim: [{ f: 3, fB: [-10, 36], lean: 10 }, { f: 7, fB: [-50, 26], lean: -12 }],
  },
  uair: {
    id: 'uair', total: 32, air: true, landingLag: 9,
    hitboxes: [{ g: 0, from: 7, to: 11, at: 'blade', t: 1, r: 16, dmg: 10, angle: 85, bkb: 28, kbg: 82, sfx: 'blunt' }],
    anim: [{ f: 3, w: -20 }, { f: 7, w: 80 }, { f: 11, w: 170 }],
  },
  dair: {
    id: 'dair', total: 40, air: true, landingLag: 18,
    hitboxes: [{ g: 0, from: 10, to: 14, at: 'blade', t: 1, r: 17, dmg: 14, angle: 270, bkb: 24, kbg: 76, sfx: 'heavy' }],
    anim: [{ f: 5, w: 80 }, { f: 10, w: -100 }, { f: 14, w: -95 }],
  },
  nspecial: {
    id: 'nspecial', total: 42, iasa: 34,
    projectiles: [{
      frame: 14, kind: 'block', at: 'handF', vx: 9, vy: -8, gravity: 0.5, maxFall: 13, life: 80, r: 14,
      hit: { dmg: 9, angle: 45, bkb: 30, kbg: 56, sfx: 'blunt' },
    }],
    hitboxes: [],
    anim: [{ f: 7, hF: [-12, 70], lean: -8 }, { f: 14, hF: [40, 74], lean: 12 }, { f: 20, hF: [36, 66], lean: 10 }],
  },
  sspecial: {
    id: 'sspecial', total: 44, airOnce: true,
    motion: [{ from: 1, to: 12, vx: 11 }, { from: 13, to: 26, damp: 0.84 }],
    hitboxes: [{ g: 0, from: 8, to: 13, at: 'blade', t: 1, r: 18, dmg: 12, angle: 38, bkb: 40, kbg: 74, sfx: 'heavy', fx: 'swoosh' }],
    anim: [{ f: 4, w: 150, lean: 10 }, { f: 9, w: -10, lean: 26 }, { f: 13, w: -60, lean: 26 }],
  },
  uspecial: {
    id: 'uspecial', total: 46, helpless: true, helplessLag: 22, onLand: 'lag', ledgeFrom: 10, edgeStop: false,
    motion: [{ from: 1, to: 4, noGrav: true, vy: 0 }, { from: 5, to: 22, noGrav: true, vy: -9.4, drift: 0.8 }, { from: 23, to: 30, damp: 0.9 }],
    hitboxes: [{ g: 0, from: 5, to: 12, pos: [0, -6], r: 24, dmg: 10, angle: 80, bkb: 40, kbg: 70, sfx: 'blunt' }],
    hooks: { start: (f: Fighter) => leaveGround(f, -2) },
    anim: [{ f: 4, hip: [0, 30], lean: 10, hF: [20, 40] }, { f: 12, hip: [0, 44], lean: -4, hF: [10, 100], w: 90 }, { f: 24, hip: [0, 44], w: 90 }],
  },
  dspecial: {
    id: 'dspecial', total: 56,
    hitboxes: [
      { g: 0, from: 20, to: 23, at: 'blade', t: 1, r: 26, dmg: 15, angle: 75, bkb: 45, kbg: 80, sfx: 'heavy', fx: 'rock' },
      { g: 0, from: 20, to: 23, pos: [80, 10], r: 20, dmg: 11, angle: 60, bkb: 40, kbg: 70, sfx: 'blunt', fx: 'rock' },
    ],
    anim: [{ f: 8, w: 170, lean: -14, hip: [0, 40] }, { f: 17, w: 170, lean: -14 }, { f: 20, w: -90, lean: 34, hip: [0, 28] }, { f: 30, w: -95, lean: 34, hip: [0, 28] }],
  },
};

export const DIGBY: FighterDef = {
  id: 'digby',
  name: 'DIGBY',
  archetype: 'Block Builder',
  tagline: 'Mines by day, stacks a tower out of anything by night.',
  weight: 100,
  height: H,
  width: W,
  walkSpeed: 5.4, runSpeed: 9.2, dashSpeed: 10, dashFrames: 11, traction: 0.7,
  airSpeed: 6, airAccel: 0.45, airFriction: 0.1, gravity: 0.54, fallSpeed: 9.4,
  jumpV: 13.6, shortHopV: 9.4, doubleJumpV: 13.2, jumps: 1,
  rig,
  look: 'digby',
  palettes: [
    { main: '#d8452f', dark: '#3a5aa0', light: '#f2c14e', accent: '#ffd23f', skin: '#e8b48a', eye: '#3a2a1a' },
    { main: '#2f8a5a', dark: '#6a4a2a', light: '#f2e14e', accent: '#ff9a3a', skin: '#c68a5e', eye: '#1a1a1a' },
    { main: '#6a4ad8', dark: '#2a2a3a', light: '#e0e0ff', accent: '#5affd8', skin: '#f0c8a0', eye: '#2a1a3a' },
    { main: '#e8e2d0', dark: '#8a3a2a', light: '#ffffff', accent: '#ff4a6a', skin: '#8a5a3a', eye: '#1a1a1a' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 7, angle: 45, bkb: 58, kbg: 56 },
      b: { dmg: 9, angle: 135, bkb: 58, kbg: 66 },
      u: { dmg: 7, angle: 90, bkb: 66, kbg: 58 },
      d: { dmg: 5, angle: 70, bkb: 52, kbg: 42 },
    }),
    ...moves,
  },
};
