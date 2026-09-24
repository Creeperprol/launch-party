import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** BISCUIT — brawling chef. Frying-pan swings that bat projectiles back, lobbed donuts, hot oil. */
const rig: Rig = {
  hipH: 38, torso: 32, headR: 15, arm1: 17, arm2: 16, leg1: 21, leg2: 20,
  bodyR: 16, limbR: 5.5, handR: 7, footR: 7.5,
  weapon: { len: 34, width: 6, rest: 65, run: 40 },
};
const W = 58;
const H = 112;

const pan = (g: number, from: number, to: number, dmg: number, angle: number, kbg: number, r = 18): MoveDef['hitboxes'][number] =>
  ({ g, from, to, at: 'blade', t: 0.9, r, dmg, angle, bkb: 30, kbg, sfx: 'blunt' });

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 20,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'handB', r: 14, dmg: 4, angle: 45, bkb: 24, kbg: 32, sfx: 'punch' }],
    anim: [{ f: 2, hB: [10, 70] }, { f: 4, hB: [48, 66], lean: 10 }],
  },
  ftilt: {
    id: 'ftilt', total: 28,
    hitboxes: [pan(0, 8, 11, 10, 36, 82)],
    anim: [{ f: 4, w: 120, lean: -8 }, { f: 8, w: -10, lean: 16 }, { f: 11, w: -40, lean: 16 }],
  },
  utilt: {
    id: 'utilt', total: 28,
    hitboxes: [pan(0, 8, 12, 9, 92, 84)],
    anim: [{ f: 3, w: -60 }, { f: 8, w: 80, lean: -4 }, { f: 12, w: 150, lean: -8 }],
  },
  dtilt: {
    id: 'dtilt', total: 22,
    hitboxes: [pan(0, 6, 9, 7, 22, 66)],
    anim: [{ f: 3, hip: [0, 26], lean: 30, w: 40 }, { f: 6, hip: [0, 26], lean: 30, w: -60 }, { f: 9, hip: [0, 26], lean: 30, w: -60 }],
  },
  dashAttack: {
    id: 'dashAttack', total: 36,
    motion: [{ from: 1, to: 10, vx: 10 }, { from: 11, to: 24, damp: 0.86 }],
    hitboxes: [pan(0, 8, 13, 10, 45, 70, 20)],
    anim: [{ f: 4, w: 140, lean: 6 }, { f: 8, w: 0, lean: 22 }, { f: 13, w: -40, lean: 22 }],
  },
  fsmash: {
    id: 'fsmash', total: 52, charge: { frame: 13, smash: true },
    hitboxes: [{ ...pan(0, 15, 18, 18, 36, 96, 24), sfx: 'heavy', fx: 'shock' }],
    anim: [{ f: 6, w: 160, lean: -18 }, { f: 13, w: 160, lean: -18 }, { f: 15, w: 0, lean: 24 }, { f: 19, w: -30, lean: 26 }],
  },
  usmash: {
    id: 'usmash', total: 46, charge: { frame: 9, smash: true },
    hitboxes: [{ ...pan(0, 12, 16, 15, 90, 92, 24), sfx: 'heavy' }],
    anim: [{ f: 9, w: -40, lean: 6 }, { f: 12, w: 90, lean: -4 }, { f: 16, w: 160, lean: -8 }],
  },
  dsmash: {
    id: 'dsmash', total: 48, charge: { frame: 8, smash: true },
    hitboxes: [pan(0, 11, 14, 13, 28, 86, 22), pan(1, 20, 23, 13, 28, 86, 22)],
    anim: [
      { f: 5, hip: [0, 28], lean: 20, w: 60 },
      { f: 11, hip: [0, 28], lean: 26, w: -60, hF: [26, 44] },
      { f: 16, hip: [0, 28], lean: -20, w: 100, hF: [0, 70] },
      { f: 20, hip: [0, 28], lean: -24, w: -120, hF: [-24, 44] },
      { f: 24, hip: [0, 28], lean: -24, w: -120, hF: [-24, 44] },
    ],
  },
  nair: {
    id: 'nair', total: 36, air: true, landingLag: 8,
    hitboxes: [pan(0, 5, 18, 9, 45, 80)],
    anim: [{ f: 3, spin: 0, w: 0 }, { f: 18, spin: -360, w: 0 }],
  },
  fair: {
    id: 'fair', total: 38, air: true, landingLag: 12,
    hitboxes: [{ ...pan(0, 10, 13, 13, 285, 76, 20), sfx: 'heavy' }],
    anim: [{ f: 5, w: 120, lean: -10 }, { f: 10, w: -40, lean: 16 }, { f: 13, w: -80, lean: 16 }],
  },
  bair: {
    id: 'bair', total: 34, air: true, landingLag: 10,
    hitboxes: [pan(0, 8, 11, 12, 145, 88, 20)],
    anim: [{ f: 4, w: -20 }, { f: 8, w: 170, lean: -8 }, { f: 11, w: 190, lean: -8 }],
  },
  uair: {
    id: 'uair', total: 34, air: true, landingLag: 9,
    hitboxes: [pan(0, 7, 11, 10, 85, 82, 20)],
    anim: [{ f: 3, w: -20 }, { f: 7, w: 80 }, { f: 11, w: 170 }],
  },
  dair: {
    id: 'dair', total: 42, air: true, landingLag: 18,
    hitboxes: [{ ...pan(0, 11, 15, 13, 270, 74, 22), sfx: 'heavy' }],
    anim: [{ f: 5, w: 80 }, { f: 11, w: -90 }, { f: 15, w: -90 }],
  },
  nspecial: {
    id: 'nspecial', total: 40, iasa: 32,
    projectiles: [{
      frame: 13, kind: 'food', at: 'handB', vx: 7.5, vy: -9, gravity: 0.46, maxFall: 12, bounce: 6.5, life: 90, r: 13,
      hit: { dmg: 7, angle: 45, bkb: 30, kbg: 48, sfx: 'blunt' },
    }],
    hitboxes: [],
    anim: [{ f: 6, hB: [-20, 60], lean: -6 }, { f: 13, hB: [40, 80], lean: 10 }, { f: 20, hB: [36, 72], lean: 8 }],
  },
  sspecial: {
    id: 'sspecial', total: 44, reflect: { from: 9, to: 16, r: 46 },
    hitboxes: [{ ...pan(0, 10, 14, 14, 38, 88, 24), sfx: 'heavy', fx: 'swoosh' }],
    anim: [{ f: 5, w: 170, lean: -14 }, { f: 10, w: 0, lean: 20 }, { f: 14, w: -30, lean: 22 }],
  },
  uspecial: {
    id: 'uspecial', total: 52, helpless: true, helplessLag: 22, onLand: 'lag', ledgeFrom: 10, edgeStop: false,
    motion: [{ from: 1, to: 4, noGrav: true, vy: 0 }, { from: 5, to: 22, noGrav: true, vy: -9.6, drift: 0.9 }, { from: 23, to: 32, damp: 0.9 }],
    hitboxes: [pan(0, 5, 10, 6, 80, 50, 22), pan(1, 12, 16, 6, 80, 60, 22), pan(2, 18, 22, 8, 80, 74, 22)],
    hooks: { start: (f: Fighter) => leaveGround(f, -2) },
    anim: [{ f: 4, hip: [0, 30], w: 90 }, { f: 22, hip: [0, 44], spin: 1080, w: 90 }, { f: 26, hip: [0, 44], spin: 1080, w: 90 }],
  },
  dspecial: {
    id: 'dspecial', total: 52,
    hitboxes: [
      { g: 0, from: 14, to: 16, pos: [56, 8], r: 26, dmg: 3, angle: 60, bkb: 10, kbg: 10, fixed: 30, sfx: 'fire', fx: 'fire' },
      { g: 1, from: 22, to: 24, pos: [56, 8], r: 26, dmg: 3, angle: 60, bkb: 10, kbg: 10, fixed: 30, sfx: 'fire', fx: 'fire' },
      { g: 2, from: 30, to: 32, pos: [56, 8], r: 28, dmg: 6, angle: 60, bkb: 50, kbg: 60, sfx: 'fire', fx: 'fire' },
    ],
    anim: [{ f: 8, w: 80, lean: -6 }, { f: 14, w: -60, lean: 16, hip: [0, 32] }, { f: 34, w: -60, lean: 16, hip: [0, 32] }],
  },
};

export const BISCUIT: FighterDef = {
  id: 'biscuit',
  name: 'BISCUIT',
  archetype: 'Brawler Chef',
  tagline: 'Serves hot meals. Serves hotter frying-pan uppercuts.',
  weight: 106,
  height: H,
  width: W,
  walkSpeed: 4.8, runSpeed: 8.6, dashSpeed: 9.4, dashFrames: 12, traction: 0.68,
  airSpeed: 5.8, airAccel: 0.42, airFriction: 0.09, gravity: 0.54, fallSpeed: 9.4,
  jumpV: 13.6, shortHopV: 9.4, doubleJumpV: 13.2, jumps: 1,
  rig,
  look: 'biscuit',
  palettes: [
    { main: '#f4f1ea', dark: '#3a3a4a', light: '#ffffff', accent: '#e8323f', skin: '#f0c090', eye: '#2a1a0a' },
    { main: '#2a2a2a', dark: '#1a1a1a', light: '#e0e0e0', accent: '#ffd23f', skin: '#8a5a38', eye: '#1a1a1a' },
    { main: '#ffd0e0', dark: '#8a3a5a', light: '#fff4f8', accent: '#3ad8a8', skin: '#f3d0b0', eye: '#3a1a2a' },
    { main: '#d8ecff', dark: '#2a4a7a', light: '#ffffff', accent: '#ff8a2a', skin: '#c89a74', eye: '#1a2a4a' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 7, angle: 45, bkb: 58, kbg: 56 },
      b: { dmg: 9, angle: 135, bkb: 58, kbg: 68 },
      u: { dmg: 7, angle: 90, bkb: 66, kbg: 58 },
      d: { dmg: 5, angle: 70, bkb: 52, kbg: 42 },
    }),
    ...moves,
  },
};
