import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** KOI — tide dancer with a coral trident. Floating bubbles, water whip, geyser recovery, splash reflector. */
const rig: Rig = {
  hipH: 38, torso: 27, headR: 13, arm1: 16, arm2: 15, leg1: 23, leg2: 22,
  bodyR: 10, limbR: 4.4, handR: 5.6, footR: 6,
  weapon: { len: 68, width: 5 },
};
const W = 46;
const H = 90;

const whip = (from: number, to: number, x: number, y: number, dmg: number, angle: number): MoveDef['hitboxes'][number] =>
  ({ g: 0, from, to, pos: [x, y], r: 18, dmg, angle, bkb: 30, kbg: 76, sfx: 'spark', fx: 'water' });

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 16,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'handF', r: 13, dmg: 3, angle: 45, bkb: 22, kbg: 30, sfx: 'punch' }],
    anim: [{ f: 2, hF: [24, 58], lean: 4 }, { f: 4, hF: [46, 56], lean: 8 }],
  },
  ftilt: {
    id: 'ftilt', total: 24,
    hitboxes: [{ g: 0, from: 6, to: 9, at: 'blade', t: 0.95, r: 15, dmg: 9, angle: 36, bkb: 28, kbg: 78, sfx: 'tip', fx: 'water' }],
    anim: [{ f: 3, w: 20, lean: -8, hF: [-4, 58] }, { f: 6, w: 0, lean: 16, hF: [44, 58] }, { f: 10, w: 0, lean: 14, hF: [40, 58] }],
  },
  utilt: {
    id: 'utilt', total: 24,
    hitboxes: [{ g: 0, from: 6, to: 10, at: 'footF', r: 16, dmg: 7, angle: 90, bkb: 30, kbg: 80, sfx: 'kick' }],
    anim: [{ f: 3, fF: [10, 30], lean: -10 }, { f: 6, fF: [0, 100], lean: -24 }],
  },
  dtilt: {
    id: 'dtilt', total: 18,
    hitboxes: [{ g: 0, from: 4, to: 7, at: 'footF', r: 14, dmg: 5, angle: 14, bkb: 26, kbg: 60, sfx: 'kick' }],
    anim: [{ f: 3, hip: [0, 24], lean: 28, fF: [44, 6] }],
  },
  dashAttack: {
    id: 'dashAttack', total: 32,
    motion: [{ from: 1, to: 10, vx: 10 }, { from: 11, to: 22, damp: 0.86 }],
    hitboxes: [{ g: 0, from: 5, to: 14, at: 'center', off: [10, -10], r: 24, dmg: 8, angle: 60, bkb: 36, kbg: 60, sfx: 'kick' }],
    anim: [{ f: 3, lean: 20 }, { f: 5, hip: [0, 20], lean: 50, fF: [40, 6], fB: [-20, 4] }, { f: 14, hip: [0, 20], lean: 50 }],
  },
  fsmash: {
    id: 'fsmash', total: 46, charge: { frame: 10, smash: true },
    motion: [{ from: 12, to: 15, vx: 5 }],
    hitboxes: [
      { g: 0, from: 12, to: 15, at: 'blade', t: 1, r: 18, dmg: 16, angle: 34, bkb: 32, kbg: 94, sfx: 'tip', fx: 'water' },
      { g: 0, from: 12, to: 15, at: 'blade', t: 0.6, r: 15, dmg: 12, angle: 38, bkb: 30, kbg: 84, sfx: 'slash', fx: 'water' },
    ],
    anim: [{ f: 6, w: 15, hF: [-14, 60], lean: -16 }, { f: 10, w: 15, hF: [-14, 60], lean: -16 }, { f: 12, w: 0, hF: [48, 58], lean: 20 }, { f: 17, w: 0, hF: [46, 58], lean: 18 }],
  },
  usmash: {
    id: 'usmash', total: 44, charge: { frame: 8, smash: true },
    hitboxes: [
      { g: 0, from: 10, to: 20, pos: [0, 80], r: 26, dmg: 3, angle: 90, bkb: 20, kbg: 20, fixed: 40, sfx: 'spark', fx: 'water' },
      { g: 1, from: 21, to: 24, pos: [0, 110], r: 30, dmg: 8, angle: 90, bkb: 40, kbg: 90, sfx: 'spark', fx: 'water' },
    ],
    anim: [{ f: 8, hF: [10, 70], hB: [-10, 70] }, { f: 12, hF: [10, 110], hB: [-10, 110], lean: -4 }, { f: 24, hF: [10, 110], hB: [-10, 110] }],
  },
  dsmash: {
    id: 'dsmash', total: 44, charge: { frame: 8, smash: true },
    hitboxes: [
      { g: 0, from: 11, to: 14, pos: [52, 10], r: 22, dmg: 12, angle: 25, bkb: 32, kbg: 86, away: true, sfx: 'spark', fx: 'water' },
      { g: 0, from: 11, to: 14, pos: [-52, 10], r: 22, dmg: 12, angle: 25, bkb: 32, kbg: 86, away: true, sfx: 'spark', fx: 'water' },
    ],
    anim: [{ f: 6, hip: [0, 24], lean: 10 }, { f: 11, hip: [0, 24], hF: [56, 16], hB: [-56, 16] }, { f: 20, hip: [0, 24], hF: [56, 16], hB: [-56, 16] }],
  },
  nair: {
    id: 'nair', total: 32, air: true, landingLag: 6,
    hitboxes: [{ g: 0, from: 4, to: 18, at: 'center', r: 26, dmg: 7, angle: 45, bkb: 18, kbg: 78, sfx: 'kick' }],
    anim: [{ f: 2, spin: 0, fF: [20, 20], fB: [-20, 20] }, { f: 18, spin: -540, fF: [20, 20], fB: [-20, 20] }],
  },
  fair: {
    id: 'fair', total: 32, air: true, landingLag: 9,
    hitboxes: [{ g: 0, from: 7, to: 10, at: 'blade', t: 0.95, r: 17, dmg: 11, angle: 40, bkb: 28, kbg: 80, sfx: 'tip', fx: 'water' }],
    anim: [{ f: 3, w: 40, hF: [0, 64], lean: -8 }, { f: 7, w: 0, hF: [46, 56], lean: 12 }],
  },
  bair: {
    id: 'bair', total: 30, air: true, landingLag: 9,
    hitboxes: [{ g: 0, from: 6, to: 9, at: 'footB', r: 17, dmg: 11, angle: 148, bkb: 24, kbg: 86, sfx: 'kick' }],
    anim: [{ f: 3, fB: [-10, 40], lean: 8 }, { f: 6, fB: [-54, 30], lean: -14 }],
  },
  uair: {
    id: 'uair', total: 30, air: true, landingLag: 8,
    hitboxes: [{ g: 0, from: 5, to: 9, at: 'blade', t: 0.95, r: 18, dmg: 9, angle: 88, bkb: 28, kbg: 80, sfx: 'tip', fx: 'water' }],
    anim: [{ f: 2, w: 60, hF: [10, 70] }, { f: 5, w: 90, hF: [4, 96] }, { f: 9, w: 92, hF: [4, 96] }],
  },
  dair: {
    id: 'dair', total: 38, air: true, landingLag: 14,
    hitboxes: [{ g: 0, from: 9, to: 12, at: 'blade', t: 1, r: 17, dmg: 12, angle: 270, bkb: 24, kbg: 72, sfx: 'tip', fx: 'water' }],
    anim: [{ f: 5, w: -40, hF: [10, 60] }, { f: 9, w: -90, hF: [6, 30] }, { f: 12, w: -90, hF: [6, 30] }],
  },
  nspecial: {
    id: 'nspecial', total: 40, iasa: 32,
    projectiles: [{
      frame: 13, kind: 'bubble', at: 'handF', vx: 4.2, vy: -0.6, gravity: -0.012, life: 110, r: 17, reflectable: true,
      hit: { dmg: 8, angle: 55, bkb: 42, kbg: 50, sfx: 'spark', fx: 'water' },
    }],
    hitboxes: [],
    anim: [{ f: 6, hF: [10, 50], hB: [0, 50], lean: -6 }, { f: 13, hF: [44, 60], hB: [40, 56], lean: 10 }, { f: 20, hF: [40, 58], lean: 8 }],
  },
  sspecial: {
    id: 'sspecial', total: 46, airOnce: true,
    hitboxes: [whip(12, 16, 40, 54, 7, 40), whip(12, 16, 76, 54, 9, 40), { ...whip(12, 16, 112, 54, 12, 38), kbg: 84 }],
    anim: [{ f: 6, hF: [-20, 80], lean: -12 }, { f: 12, hF: [60, 56], lean: 16 }, { f: 18, hF: [56, 52], lean: 16 }],
  },
  uspecial: {
    id: 'uspecial', total: 48, helpless: true, helplessLag: 20, onLand: 'lag', ledgeFrom: 8, edgeStop: false,
    motion: [{ from: 1, to: 4, noGrav: true, vy: 0 }, { from: 5, to: 24, noGrav: true, vy: -10.4, drift: 0.8 }, { from: 25, to: 32, damp: 0.9 }],
    hitboxes: [
      { g: 0, from: 5, to: 18, at: 'center', off: [0, -10], r: 26, dmg: 2, angle: 90, bkb: 20, kbg: 10, fixed: 50, sfx: 'spark', fx: 'water' },
      { g: 1, from: 20, to: 23, at: 'head', r: 24, dmg: 5, angle: 80, bkb: 40, kbg: 70, sfx: 'spark', fx: 'water' },
    ],
    hooks: { start: (f: Fighter) => leaveGround(f, -2) },
    anim: [{ f: 4, hip: [0, 30], hF: [10, 50] }, { f: 6, hip: [0, 44], hF: [10, 100], hB: [-6, 100], fF: [4, 0], fB: [-4, 0] }, { f: 24, hip: [0, 44], hF: [10, 100], hB: [-6, 100] }],
  },
  dspecial: {
    id: 'dspecial', total: 34, reflect: { from: 4, to: 20, r: 54 }, jumpCancel: [8, 22],
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'center', r: 34, dmg: 4, angle: 70, bkb: 50, kbg: 20, sfx: 'spark', fx: 'water' }],
    anim: [{ f: 3, hip: [0, 30], hF: [30, 70], hB: [-30, 70] }, { f: 20, hip: [0, 30], hF: [30, 70], hB: [-30, 70] }],
  },
};

export const KOI: FighterDef = {
  id: 'koi',
  name: 'KOI',
  archetype: 'Tide Dancer',
  tagline: 'Flows around every attack, then turns the whole river on you.',
  weight: 82,
  height: H,
  width: W,
  walkSpeed: 5.8, runSpeed: 9.8, dashSpeed: 10.6, dashFrames: 10, traction: 0.58,
  airSpeed: 6.8, airAccel: 0.5, airFriction: 0.1, gravity: 0.44, fallSpeed: 8,
  jumpV: 13, shortHopV: 9, doubleJumpV: 12.8, jumps: 1,
  rig,
  look: 'koi',
  palettes: [
    { main: '#ff7a3a', dark: '#b23a1a', light: '#fff2e0', accent: '#5ad8ff', skin: '#f3d0b0', eye: '#2a4a8a' },
    { main: '#f2f2f2', dark: '#d8322f', light: '#ffffff', accent: '#ff5a5a', skin: '#e8c0a0', eye: '#1a1a1a' },
    { main: '#ffd23f', dark: '#b88a1a', light: '#fffae0', accent: '#3a8aff', skin: '#c89a74', eye: '#1a3a6a' },
    { main: '#3a3a4a', dark: '#1a1a24', light: '#d0d8ff', accent: '#ffd23f', skin: '#f0d8c0', eye: '#ffd23f' },
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
