import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** RIVET — scrapyard robot. Missiles, drill dash, jetpack recovery, armored ground-pound. */
const rig: Rig = {
  hipH: 42, torso: 34, headR: 15, arm1: 19, arm2: 18, leg1: 22, leg2: 21,
  bodyR: 17, limbR: 6.5, handR: 8.5, footR: 9,
};
const W = 64;
const H = 110;

const drill = (from: number, g: number): MoveDef['hitboxes'][number] =>
  ({ g, from, to: from + 1, at: 'handF', r: 20, dmg: 2, angle: 30, bkb: 10, kbg: 10, fixed: 30, sfx: 'zap' });

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 20,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'handF', r: 15, dmg: 4, angle: 40, bkb: 24, kbg: 34, sfx: 'blunt' }],
    anim: [{ f: 2, hF: [26, 70], lean: 4 }, { f: 4, hF: [54, 68], lean: 10 }, { f: 8, hF: [50, 66], lean: 8 }],
  },
  ftilt: {
    id: 'ftilt', total: 30,
    hitboxes: [{ g: 0, from: 8, to: 11, at: 'handF', r: 19, dmg: 11, angle: 34, bkb: 28, kbg: 86, sfx: 'blunt' }],
    anim: [{ f: 4, hF: [-10, 80], lean: -8 }, { f: 8, hF: [66, 64], lean: 18 }, { f: 11, hF: [62, 60], lean: 18 }],
  },
  utilt: {
    id: 'utilt', total: 30,
    hitboxes: [{ g: 0, from: 8, to: 12, at: 'handF', r: 20, dmg: 10, angle: 90, bkb: 36, kbg: 86, sfx: 'blunt' }],
    anim: [{ f: 4, hF: [30, 60] }, { f: 8, hF: [20, 124], lean: -6 }, { f: 12, hF: [-10, 120], lean: -10 }],
  },
  dtilt: {
    id: 'dtilt', total: 26,
    hitboxes: [{ g: 0, from: 7, to: 9, at: 'handF', r: 18, dmg: 8, angle: 20, bkb: 32, kbg: 70, sfx: 'blunt' }],
    anim: [{ f: 3, hip: [0, 30], lean: 32, hF: [20, 40] }, { f: 7, hip: [0, 30], lean: 32, hF: [66, 12] }],
  },
  dashAttack: {
    id: 'dashAttack', total: 38,
    motion: [{ from: 1, to: 12, vx: 10 }, { from: 13, to: 26, damp: 0.86 }],
    hitboxes: [{ g: 0, from: 6, to: 14, at: 'center', off: [20, 0], r: 30, dmg: 11, angle: 42, bkb: 44, kbg: 70, sfx: 'heavy' }],
    anim: [{ f: 5, lean: 30, hF: [50, 60], hB: [40, 56] }, { f: 14, lean: 30, hF: [50, 60] }],
  },
  fsmash: {
    id: 'fsmash', total: 54, charge: { frame: 12, smash: true },
    hitboxes: [drill(14, 0), drill(17, 1), { g: 2, from: 20, to: 22, at: 'handF', r: 24, dmg: 13, angle: 36, bkb: 36, kbg: 92, sfx: 'heavy', fx: 'spark' }],
    anim: [{ f: 6, hF: [-10, 72], lean: -12 }, { f: 12, hF: [-10, 72], lean: -12 }, { f: 14, hF: [70, 64], lean: 18 }, { f: 24, hF: [72, 62], lean: 20 }],
  },
  usmash: {
    id: 'usmash', total: 50, charge: { frame: 10, smash: true },
    hitboxes: [drill(13, 0), drill(16, 1), { g: 2, from: 19, to: 21, at: 'handF', r: 24, dmg: 12, angle: 90, bkb: 40, kbg: 88, sfx: 'heavy', fx: 'spark' }],
    anim: [{ f: 10, hF: [30, 60], lean: 8 }, { f: 13, hF: [14, 136], lean: -4 }, { f: 22, hF: [14, 136], lean: -4 }],
  },
  dsmash: {
    id: 'dsmash', total: 50, charge: { frame: 8, smash: true },
    hitboxes: [
      { g: 0, from: 12, to: 15, pos: [56, 12], r: 26, dmg: 15, angle: 28, bkb: 34, kbg: 88, away: true, sfx: 'heavy', fx: 'shock' },
      { g: 0, from: 12, to: 15, pos: [-56, 12], r: 26, dmg: 15, angle: 28, bkb: 34, kbg: 88, away: true, sfx: 'heavy', fx: 'shock' },
    ],
    anim: [{ f: 8, hip: [0, 46], hF: [30, 110], hB: [-30, 110] }, { f: 12, hip: [0, 28], lean: 20, hF: [58, 8], hB: [-58, 8] }, { f: 22, hip: [0, 28], hF: [58, 8], hB: [-58, 8] }],
  },
  nair: {
    id: 'nair', total: 40, air: true, landingLag: 10,
    hitboxes: [{ g: 0, from: 5, to: 20, at: 'center', r: 36, dmg: 10, angle: 45, bkb: 20, kbg: 84, sfx: 'blunt' }],
    anim: [{ f: 3, spin: 0, hF: [50, 60], hB: [-50, 60] }, { f: 20, spin: -540, hF: [50, 60], hB: [-50, 60] }],
  },
  fair: {
    id: 'fair', total: 42, air: true, landingLag: 12,
    hitboxes: [{ g: 0, from: 10, to: 13, at: 'handF', r: 22, dmg: 13, angle: 40, bkb: 30, kbg: 86, sfx: 'heavy' }],
    anim: [{ f: 5, hF: [10, 110], lean: -8 }, { f: 10, hF: [66, 60], lean: 16 }, { f: 13, hF: [60, 40], lean: 20 }],
  },
  bair: {
    id: 'bair', total: 38, air: true, landingLag: 11,
    hitboxes: [{ g: 0, from: 8, to: 11, at: 'footB', r: 22, dmg: 14, angle: 145, bkb: 26, kbg: 90, sfx: 'heavy' }],
    anim: [{ f: 4, fB: [-10, 40], lean: 14 }, { f: 8, fB: [-60, 46], lean: 30 }],
  },
  uair: {
    id: 'uair', total: 36, air: true, landingLag: 10,
    hitboxes: [drill(6, 0), drill(9, 1), { g: 2, from: 12, to: 14, at: 'handF', r: 22, dmg: 7, angle: 85, bkb: 34, kbg: 84, sfx: 'zap' }],
    anim: [{ f: 3, hF: [30, 90] }, { f: 6, hF: [10, 136] }, { f: 14, hF: [10, 136] }],
  },
  dair: {
    id: 'dair', total: 48, air: true, landingLag: 22,
    hitboxes: [{ g: 0, from: 12, to: 16, at: 'footF', r: 24, dmg: 14, angle: 270, bkb: 28, kbg: 76, sfx: 'heavy' }],
    anim: [{ f: 7, fF: [10, 40], fB: [-10, 40] }, { f: 12, fF: [6, -20], fB: [-6, -20] }],
  },
  nspecial: {
    id: 'nspecial', total: 48, iasa: 38,
    projectiles: [{
      frame: 16, kind: 'missile', pos: [30, 80], vx: 10.5, vy: 0, life: 80, r: 13, reflectable: true,
      hit: { dmg: 11, angle: 40, bkb: 40, kbg: 56, sfx: 'heavy' },
    }],
    hitboxes: [],
    anim: [{ f: 8, hF: [20, 80], lean: -6 }, { f: 16, hF: [60, 80], lean: 6 }, { f: 26, hF: [56, 78], lean: 4 }],
  },
  sspecial: {
    id: 'sspecial', total: 46, airOnce: true,
    motion: [{ from: 4, to: 22, vx: 10, noGrav: true, vy: 0 }, { from: 23, to: 32, damp: 0.84 }],
    hitboxes: [drill(5, 0), drill(9, 1), drill(13, 2), drill(17, 3), { g: 4, from: 21, to: 23, at: 'handF', r: 24, dmg: 7, angle: 40, bkb: 50, kbg: 60, sfx: 'zap', fx: 'spark' }],
    anim: [{ f: 3, hF: [70, 66], lean: 24 }, { f: 22, hF: [72, 64], lean: 24 }],
  },
  uspecial: {
    id: 'uspecial', total: 56, helpless: true, helplessLag: 24, onLand: 'lag', ledgeFrom: 8, edgeStop: false,
    motion: [{ from: 1, to: 5, noGrav: true, vy: 0 }, { from: 6, to: 36, noGrav: true, vy: -8.2, drift: 1.3 }, { from: 37, to: 44, damp: 0.9 }],
    hitboxes: [
      { g: 0, from: 6, to: 34, at: 'hip', off: [-10, -30], r: 22, dmg: 2, angle: 270, bkb: 10, kbg: 10, fixed: 40, sfx: 'fire', fx: 'fire' },
    ],
    hooks: { start: (f: Fighter) => leaveGround(f, -2) },
    anim: [{ f: 5, hip: [0, 34], hF: [30, 70] }, { f: 8, hip: [0, 46], hF: [20, 60], hB: [-20, 60], fF: [6, 0], fB: [-6, 0] }, { f: 36, hip: [0, 46] }],
  },
  dspecial: {
    id: 'dspecial', total: 52, armor: { from: 1, to: 18, threshold: 14 },
    hitboxes: [
      { g: 0, from: 18, to: 21, pos: [60, 14], r: 34, dmg: 13, angle: 60, bkb: 50, kbg: 64, away: true, sfx: 'heavy', fx: 'shock' },
      { g: 0, from: 18, to: 21, pos: [-60, 14], r: 34, dmg: 13, angle: 60, bkb: 50, kbg: 64, away: true, sfx: 'heavy', fx: 'shock' },
    ],
    anim: [{ f: 10, hip: [0, 50], hF: [26, 130], hB: [-26, 130] }, { f: 18, hip: [0, 26], lean: 24, hF: [40, 4], hB: [-40, 4] }, { f: 30, hip: [0, 26], lean: 24, hF: [40, 4], hB: [-40, 4] }],
  },
};

export const RIVET: FighterDef = {
  id: 'rivet',
  name: 'RIVET',
  archetype: 'Scrap Robot',
  tagline: 'Built from junkyard parts. Armed with everything the junkyard had.',
  weight: 120,
  height: H,
  width: W,
  walkSpeed: 4.6, runSpeed: 8.4, dashSpeed: 9.2, dashFrames: 12, traction: 0.72,
  airSpeed: 5.6, airAccel: 0.4, airFriction: 0.09, gravity: 0.58, fallSpeed: 10,
  jumpV: 14, shortHopV: 9.6, doubleJumpV: 13.4, jumps: 1,
  rig,
  look: 'rivet',
  palettes: [
    { main: '#9aa8b8', dark: '#4a5668', light: '#e8eef6', accent: '#ff5a3a', skin: '#6a7688', eye: '#5affd8' },
    { main: '#e8b83a', dark: '#6a5018', light: '#fff4c8', accent: '#3a3a4a', skin: '#8a6a28', eye: '#ff3a3a' },
    { main: '#3a8aff', dark: '#1a3a7a', light: '#d0e4ff', accent: '#ffd23f', skin: '#2a5aa8', eye: '#ffd23f' },
    { main: '#d8d8d8', dark: '#3a3a3a', light: '#ffffff', accent: '#ff3a8a', skin: '#8a8a8a', eye: '#ff3a8a' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 8, angle: 45, bkb: 60, kbg: 58 },
      b: { dmg: 10, angle: 135, bkb: 60, kbg: 70 },
      u: { dmg: 8, angle: 90, bkb: 68, kbg: 60 },
      d: { dmg: 6, angle: 70, bkb: 56, kbg: 46 },
    }),
    ...moves,
  },
};
