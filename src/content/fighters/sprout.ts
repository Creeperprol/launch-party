import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** SPROUT — tiny plant sprite. Bouncing seeds, long vine whip, leaf-copter float, pollen burst. */
const rig: Rig = {
  hipH: 30, torso: 22, headR: 15, arm1: 13, arm2: 12, leg1: 17, leg2: 16,
  bodyR: 10, limbR: 4, handR: 5, footR: 6,
};
const W = 44;
const H = 82;

const vine = (g: number, from: number, to: number, x: number, y: number, dmg: number, kbg = 74): MoveDef['hitboxes'][number] =>
  ({ g, from, to, pos: [x, y], r: 17, dmg, angle: 38, bkb: 30, kbg, sfx: 'slash', fx: 'vine', link: true });

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 14,
    hitboxes: [{ g: 0, from: 3, to: 5, at: 'handF', r: 12, dmg: 3, angle: 45, bkb: 22, kbg: 30, sfx: 'punch' }],
    anim: [{ f: 2, hF: [20, 46] }, { f: 3, hF: [38, 44], lean: 8 }],
  },
  ftilt: {
    id: 'ftilt', total: 22,
    hitboxes: [vine(0, 6, 9, 40, 40, 7), vine(0, 6, 9, 62, 38, 8, 78)],
    anim: [{ f: 3, hF: [-10, 56], lean: -6 }, { f: 6, hF: [42, 42], lean: 10 }],
  },
  utilt: {
    id: 'utilt', total: 24,
    hitboxes: [{ g: 0, from: 6, to: 10, at: 'head', off: [0, 10], r: 22, dmg: 7, angle: 90, bkb: 32, kbg: 80, sfx: 'slash' }],
    anim: [{ f: 3, hip: [0, 22], lean: 10 }, { f: 6, hip: [0, 36], lean: -8, hF: [10, 80], hB: [-10, 78] }],
  },
  dtilt: {
    id: 'dtilt', total: 18,
    hitboxes: [vine(0, 5, 8, 36, 6, 5, 60), vine(0, 5, 8, 58, 6, 6, 62)],
    anim: [{ f: 3, hip: [0, 20], lean: 30, hF: [40, 8] }],
  },
  dashAttack: {
    id: 'dashAttack', total: 30,
    motion: [{ from: 1, to: 12, vx: 10 }, { from: 13, to: 22, damp: 0.85 }],
    hitboxes: [{ g: 0, from: 4, to: 14, at: 'center', r: 22, dmg: 8, angle: 50, bkb: 36, kbg: 62, sfx: 'blunt' }],
    anim: [{ f: 3, hip: [0, 24], lean: 50, spin: 0 }, { f: 14, hip: [0, 24], lean: 50, spin: -720 }],
  },
  fsmash: {
    id: 'fsmash', total: 44, charge: { frame: 10, smash: true },
    hitboxes: [vine(0, 12, 15, 44, 40, 11, 82), vine(0, 12, 15, 76, 40, 13, 90), vine(0, 12, 15, 104, 40, 15, 96)],
    anim: [{ f: 5, hF: [-16, 60], lean: -14 }, { f: 12, hF: [44, 42], lean: 16 }, { f: 16, hF: [40, 40], lean: 16 }],
  },
  usmash: {
    id: 'usmash', total: 42, charge: { frame: 8, smash: true },
    hitboxes: [{ g: 0, from: 10, to: 16, at: 'head', off: [0, 30], r: 30, dmg: 14, angle: 90, bkb: 36, kbg: 90, sfx: 'slash', fx: 'swoosh' }],
    anim: [{ f: 8, hip: [0, 20], lean: 20 }, { f: 11, hip: [0, 40], lean: -4, hF: [10, 90], hB: [-10, 90] }],
  },
  dsmash: {
    id: 'dsmash', total: 42, charge: { frame: 7, smash: true },
    hitboxes: [vine(0, 10, 13, 60, 8, 12, 86), vine(0, 10, 13, -60, 8, 12, 86), vine(0, 10, 13, 34, 8, 10), vine(0, 10, 13, -34, 8, 10)],
    anim: [{ f: 7, hip: [0, 22], lean: 10 }, { f: 10, hip: [0, 20], hF: [48, 6], hB: [-48, 6] }, { f: 18, hip: [0, 20], hF: [48, 6], hB: [-48, 6] }],
  },
  nair: {
    id: 'nair', total: 30, air: true, landingLag: 6,
    hitboxes: [{ g: 0, from: 4, to: 16, at: 'center', r: 24, dmg: 6, angle: 45, bkb: 18, kbg: 76, sfx: 'slash' }],
    anim: [{ f: 2, spin: 0, hF: [30, 40], hB: [-30, 40] }, { f: 16, spin: 720, hF: [30, 40], hB: [-30, 40] }],
  },
  fair: {
    id: 'fair', total: 30, air: true, landingLag: 9,
    hitboxes: [vine(0, 7, 10, 40, 40, 8), vine(0, 7, 10, 66, 40, 10, 82)],
    anim: [{ f: 3, hF: [0, 64], lean: -6 }, { f: 7, hF: [44, 42], lean: 10 }],
  },
  bair: {
    id: 'bair', total: 30, air: true, landingLag: 9,
    hitboxes: [vine(0, 7, 10, -40, 40, 9, 84), vine(0, 7, 10, -66, 40, 11, 86)],
    anim: [{ f: 3, hB: [0, 60] }, { f: 7, hB: [-44, 42], lean: -10 }],
  },
  uair: {
    id: 'uair', total: 28, air: true, landingLag: 7,
    hitboxes: [{ g: 0, from: 5, to: 9, at: 'head', off: [0, 24], r: 24, dmg: 8, angle: 88, bkb: 28, kbg: 80, sfx: 'slash' }],
    anim: [{ f: 2, hF: [10, 60] }, { f: 5, hF: [0, 84], lean: -10 }],
  },
  dair: {
    id: 'dair', total: 36, air: true, landingLag: 14,
    hitboxes: [{ g: 0, from: 8, to: 11, at: 'footF', r: 18, dmg: 10, angle: 270, bkb: 22, kbg: 70, sfx: 'kick' }],
    anim: [{ f: 4, fF: [8, 20] }, { f: 8, fF: [4, -14], fB: [-6, 6] }],
  },
  nspecial: {
    id: 'nspecial', total: 36, iasa: 28,
    projectiles: [{
      frame: 11, kind: 'seed', at: 'handF', vx: 11, vy: -3, gravity: 0.32, maxFall: 11, bounce: 5.5, life: 70, r: 10,
      hit: { dmg: 6, angle: 40, bkb: 28, kbg: 42, sfx: 'blunt' },
    }],
    hitboxes: [],
    anim: [{ f: 5, hF: [-8, 50], lean: -6 }, { f: 11, hF: [36, 50], lean: 10 }, { f: 18, hF: [32, 48], lean: 8 }],
  },
  sspecial: {
    id: 'sspecial', total: 44, airOnce: true,
    hitboxes: [vine(0, 12, 16, 44, 44, 7), vine(0, 12, 16, 80, 44, 9), vine(0, 12, 16, 116, 44, 12, 88), vine(0, 12, 16, 148, 44, 13, 92)],
    anim: [{ f: 6, hF: [-16, 60], lean: -12 }, { f: 12, hF: [46, 44], lean: 14 }, { f: 18, hF: [44, 42], lean: 14 }],
  },
  uspecial: {
    id: 'uspecial', total: 66, helpless: true, helplessLag: 18, onLand: 'lag', ledgeFrom: 8, edgeStop: false,
    motion: [{ from: 1, to: 4, noGrav: true, vy: 0 }, { from: 5, to: 18, noGrav: true, vy: -8.6, drift: 1.4 }, { from: 19, to: 54, noGrav: true, vy: -2.4, drift: 1.5 }],
    hitboxes: [
      { g: 0, from: 5, to: 8, at: 'head', off: [0, 20], r: 26, dmg: 4, angle: 90, bkb: 30, kbg: 40, sfx: 'slash' },
      { g: 1, from: 12, to: 15, at: 'head', off: [0, 20], r: 26, dmg: 4, angle: 90, bkb: 30, kbg: 40, sfx: 'slash' },
      { g: 2, from: 19, to: 22, at: 'head', off: [0, 20], r: 28, dmg: 6, angle: 80, bkb: 40, kbg: 70, sfx: 'slash' },
    ],
    hooks: { start: (f: Fighter) => leaveGround(f, -2) },
    anim: [{ f: 4, hip: [0, 26], hF: [10, 60], hB: [-10, 60] }, { f: 8, hip: [0, 34], hF: [16, 76], hB: [-16, 76], fF: [4, 0], fB: [-4, 0] }, { f: 54, hip: [0, 34], hF: [16, 76], hB: [-16, 76] }],
  },
  dspecial: {
    id: 'dspecial', total: 46,
    hitboxes: [{ g: 0, from: 14, to: 18, at: 'center', r: 52, dmg: 9, angle: 70, bkb: 56, kbg: 46, sfx: 'spark', fx: 'spark', shieldDmg: 14 }],
    anim: [{ f: 8, hip: [0, 18], lean: 30, hF: [20, 20], hB: [-20, 20] }, { f: 14, hip: [0, 32], lean: -10, hF: [40, 70], hB: [-40, 70] }, { f: 24, hip: [0, 32], hF: [40, 70], hB: [-40, 70] }],
  },
};

export const SPROUT: FighterDef = {
  id: 'sprout',
  name: 'SPROUT',
  archetype: 'Vine Sprite',
  tagline: 'Small enough to miss. Long enough reach to never need to get close.',
  weight: 72,
  height: H,
  width: W,
  walkSpeed: 5.2, runSpeed: 8.8, dashSpeed: 9.6, dashFrames: 10, traction: 0.6,
  airSpeed: 6.4, airAccel: 0.5, airFriction: 0.1, gravity: 0.42, fallSpeed: 7.6,
  jumpV: 12.4, shortHopV: 8.6, doubleJumpV: 12.4, jumps: 1,
  rig,
  look: 'sprout',
  palettes: [
    { main: '#5fbf4a', dark: '#2a6a2a', light: '#d8ffb0', accent: '#ff7ab0', skin: '#8fdc6a', eye: '#1a2a1a' },
    { main: '#d8a83a', dark: '#6a4a1a', light: '#fff0b0', accent: '#ff5a3a', skin: '#e8c86a', eye: '#2a1a0a' },
    { main: '#3aa8a0', dark: '#1a4a4a', light: '#c0fff4', accent: '#ffe066', skin: '#6ad8c8', eye: '#0a2a2a' },
    { main: '#a84ac8', dark: '#4a1a5a', light: '#f0c8ff', accent: '#ffe066', skin: '#c88ae0', eye: '#1a0a2a' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 5, angle: 45, bkb: 52, kbg: 50 },
      b: { dmg: 7, angle: 135, bkb: 52, kbg: 62 },
      u: { dmg: 5, angle: 90, bkb: 62, kbg: 52 },
      d: { dmg: 3, angle: 76, bkb: 48, kbg: 36 },
    }),
    ...moves,
  },
};
