import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** FANG — wolf ninja with a katana. Kunai, shadow-step dash, smoke teleport, substitution counter. */
const rig: Rig = {
  hipH: 38, torso: 27, headR: 13, arm1: 16, arm2: 15, leg1: 23, leg2: 22,
  bodyR: 10, limbR: 4.4, handR: 5.6, footR: 6.2,
  weapon: { len: 58, width: 4 },
};
const W = 46;
const H = 92;

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 12,
    hitboxes: [{ g: 0, from: 3, to: 4, at: 'handF', r: 12, dmg: 2, angle: 50, bkb: 18, kbg: 26, sfx: 'slash' }],
    next: { from: 3, to: 10, btn: 'attack', id: 'jab2' },
    anim: [{ f: 2, hF: [30, 60], lean: 6 }, { f: 3, hF: [48, 58], lean: 10 }],
  },
  jab2: {
    id: 'jab2', total: 20,
    hitboxes: [{ g: 0, from: 3, to: 5, at: 'footF', r: 14, dmg: 5, angle: 40, bkb: 40, kbg: 64, sfx: 'kick' }],
    anim: [{ f: 2, fF: [30, 50], lean: -10 }, { f: 3, fF: [56, 56], lean: -20 }],
  },
  ftilt: {
    id: 'ftilt', total: 22,
    hitboxes: [{ g: 0, from: 5, to: 7, at: 'blade', t: 0.85, r: 15, dmg: 9, angle: 34, bkb: 26, kbg: 80, sfx: 'slash', fx: 'slash' }],
    anim: [{ f: 2, w: 110, lean: -6 }, { f: 5, w: -20, lean: 16 }, { f: 8, w: -55, lean: 16 }],
  },
  utilt: {
    id: 'utilt', total: 22,
    hitboxes: [{ g: 0, from: 5, to: 9, at: 'footF', r: 16, dmg: 7, angle: 95, bkb: 30, kbg: 80, sfx: 'kick' }],
    anim: [{ f: 3, fF: [20, 30], lean: -10 }, { f: 5, fF: [-6, 104], lean: -30 }],
  },
  dtilt: {
    id: 'dtilt', total: 16,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'footF', r: 14, dmg: 5, angle: 80, bkb: 40, kbg: 40, sfx: 'kick' }],
    anim: [{ f: 2, hip: [0, 22], lean: 20, fF: [46, 4] }],
  },
  dashAttack: {
    id: 'dashAttack', total: 28,
    motion: [{ from: 1, to: 8, vx: 13 }, { from: 9, to: 18, damp: 0.82 }],
    hitboxes: [{ g: 0, from: 5, to: 10, at: 'blade', t: 0.85, r: 16, dmg: 9, angle: 40, bkb: 34, kbg: 64, sfx: 'slash', fx: 'slash' }],
    anim: [{ f: 3, lean: 30, w: 150 }, { f: 5, lean: 34, w: -10 }, { f: 10, lean: 30, w: -45 }],
  },
  fsmash: {
    id: 'fsmash', total: 44, charge: { frame: 9, smash: true },
    hitboxes: [
      { g: 0, from: 11, to: 12, at: 'blade', t: 0.8, r: 18, dmg: 5, angle: 30, bkb: 10, kbg: 10, fixed: 40, sfx: 'slash', fx: 'slash' },
      { g: 1, from: 15, to: 17, at: 'blade', t: 0.95, r: 20, dmg: 13, angle: 34, bkb: 32, kbg: 94, sfx: 'tip', fx: 'slash' },
    ],
    anim: [
      { f: 5, w: 160, lean: -14 }, { f: 9, w: 160, lean: -14 }, { f: 11, w: -10, lean: 16 },
      { f: 13, w: 120, lean: 4 }, { f: 15, w: -30, lean: 22 }, { f: 18, w: -65, lean: 22 },
    ],
  },
  usmash: {
    id: 'usmash', total: 40, charge: { frame: 7, smash: true },
    hitboxes: [{ g: 0, from: 9, to: 14, at: 'footF', r: 22, dmg: 13, angle: 90, bkb: 36, kbg: 90, sfx: 'kick', fx: 'swoosh' }],
    anim: [{ f: 4, hip: [0, 30], lean: 20 }, { f: 9, hip: [0, 50], spin: 0, fF: [10, 110] }, { f: 14, hip: [0, 50], spin: 300, fF: [10, 110] }],
  },
  dsmash: {
    id: 'dsmash', total: 38, charge: { frame: 6, smash: true },
    hitboxes: [
      { g: 0, from: 8, to: 11, pos: [46, 10], r: 20, dmg: 11, angle: 25, bkb: 30, kbg: 86, away: true, sfx: 'kick' },
      { g: 0, from: 8, to: 11, pos: [-46, 10], r: 20, dmg: 11, angle: 25, bkb: 30, kbg: 86, away: true, sfx: 'kick' },
    ],
    anim: [{ f: 4, hip: [0, 20], lean: 40 }, { f: 8, hip: [0, 20], lean: 40, fF: [50, 8], fB: [-50, 8] }],
  },
  nair: {
    id: 'nair', total: 28, air: true, landingLag: 6,
    hitboxes: [{ g: 0, from: 3, to: 14, at: 'footF', r: 18, dmg: 7, angle: 45, bkb: 20, kbg: 76, sfx: 'kick' }],
    anim: [{ f: 2, spin: 0, fF: [40, 30] }, { f: 14, spin: -720, fF: [40, 30] }],
  },
  fair: {
    id: 'fair', total: 28, air: true, landingLag: 8,
    hitboxes: [{ g: 0, from: 5, to: 8, at: 'blade', t: 0.9, r: 17, dmg: 10, angle: 40, bkb: 26, kbg: 80, sfx: 'slash', fx: 'slash' }],
    anim: [{ f: 2, w: 120, lean: -8 }, { f: 5, w: -10, lean: 14 }, { f: 8, w: -65, lean: 14 }],
  },
  bair: {
    id: 'bair', total: 26, air: true, landingLag: 8,
    hitboxes: [{ g: 0, from: 5, to: 8, at: 'footB', r: 17, dmg: 11, angle: 150, bkb: 24, kbg: 86, sfx: 'kick' }],
    anim: [{ f: 2, fB: [-10, 40], lean: 8 }, { f: 5, fB: [-56, 30], lean: -14 }],
  },
  uair: {
    id: 'uair', total: 26, air: true, landingLag: 7,
    hitboxes: [{ g: 0, from: 4, to: 8, at: 'blade', t: 0.9, r: 17, dmg: 8, angle: 88, bkb: 28, kbg: 78, sfx: 'slash', fx: 'slash' }],
    anim: [{ f: 2, w: -30 }, { f: 4, w: 80 }, { f: 8, w: 175 }],
  },
  dair: {
    id: 'dair', total: 34, air: true, landingLag: 12,
    motion: [{ from: 6, to: 20, vx: 8, vy: 11 }],
    hitboxes: [{ g: 0, from: 6, to: 20, at: 'footF', r: 18, dmg: 9, angle: 60, bkb: 30, kbg: 60, sfx: 'kick' }],
    anim: [{ f: 4, fF: [20, 30], lean: 10 }, { f: 6, fF: [40, -10], fB: [-10, 30], lean: 30 }, { f: 20, fF: [40, -10], lean: 30 }],
  },
  nspecial: {
    id: 'nspecial', total: 30, iasa: 22,
    projectiles: [{
      frame: 8, kind: 'kunai', at: 'handF', vx: 21, vy: 0.4, gravity: 0.04, life: 34, r: 8, reflectable: true,
      hit: { dmg: 5, angle: 30, bkb: 20, kbg: 30, sfx: 'slash' },
    }],
    hitboxes: [],
    anim: [{ f: 4, hF: [-10, 70], lean: -8 }, { f: 8, hF: [50, 60], lean: 12 }, { f: 14, hF: [46, 58], lean: 10 }],
  },
  sspecial: {
    id: 'sspecial', total: 38, airOnce: true, intangible: [[3, 12]],
    motion: [{ from: 3, to: 12, vx: 18, noGrav: true, vy: 0 }, { from: 13, to: 24, damp: 0.78 }],
    hitboxes: [{ g: 0, from: 4, to: 12, at: 'center', r: 26, dmg: 9, angle: 45, bkb: 40, kbg: 58, sfx: 'slash', fx: 'slash' }],
    anim: [{ f: 2, lean: 40, hF: [-30, 40], hB: [-40, 44] }, { f: 12, lean: 40, hF: [-30, 40] }, { f: 16, lean: 10, hF: [50, 50] }],
  },
  uspecial: {
    id: 'uspecial', total: 40, helpless: true, helplessLag: 20, onLand: 'lag', ledgeFrom: 16, edgeStop: false,
    intangible: [[4, 20]],
    motion: [{ from: 1, to: 7, noGrav: true, vy: 0, drift: 0 }, { from: 8, to: 16, noGrav: true, vy: -16, drift: 1.6 }, { from: 17, to: 24, damp: 0.8 }],
    hitboxes: [{ g: 0, from: 17, to: 20, at: 'center', r: 30, dmg: 7, angle: 75, bkb: 46, kbg: 56, sfx: 'slash', fx: 'swoosh' }],
    hooks: { start: (f: Fighter) => leaveGround(f, -1) },
    anim: [{ f: 4, hip: [0, 22], lean: 20, hF: [10, 60], hB: [-10, 60] }, { f: 8, hip: [0, 40], lean: 0, spin: 0 }, { f: 16, hip: [0, 40], spin: 720 }],
  },
  dspecial: {
    id: 'dspecial', total: 40,
    counter: { from: 4, to: 22, next: 'dspecialHit', mult: 1.1, min: 7 },
    hitboxes: [],
    anim: [{ f: 3, hF: [20, 70], hB: [-4, 74], lean: -6 }, { f: 22, hF: [20, 70], hB: [-4, 74], lean: -6 }],
  },
  dspecialHit: {
    id: 'dspecialHit', total: 36, intangible: [[1, 16]],
    motion: [{ from: 1, to: 6, vx: 16, noGrav: true, vy: 0 }, { from: 7, to: 12, vx: 0, noGrav: true, vy: 0 }],
    hitboxes: [{ g: 0, from: 8, to: 11, at: 'blade', t: 0.9, r: 24, dmg: 8, dmgVar: 'counterDmg', angle: 40, bkb: 56, kbg: 70, sfx: 'tip', fx: 'slash', hitlag: 1.2 }],
    hooks: {
      frame(f: Fighter) {
        // dash through the attacker, then turn to strike from behind
        if (f.move!.frame === 7) f.facing = f.facing === 1 ? -1 : 1;
      },
    },
    anim: [{ f: 3, lean: 10, w: 170 }, { f: 8, lean: 22, w: -20 }, { f: 12, lean: 22, w: -65 }],
  },
};

export const FANG: FighterDef = {
  id: 'fang',
  name: 'FANG',
  archetype: 'Wolf Ninja',
  tagline: 'Hits you from the front. Then from behind. Then from the front.',
  weight: 84,
  height: H,
  width: W,
  walkSpeed: 6.4, runSpeed: 12.2, dashSpeed: 12.8, dashFrames: 9, traction: 0.56,
  airSpeed: 7, airAccel: 0.58, airFriction: 0.12, gravity: 0.56, fallSpeed: 9.8,
  jumpV: 14, shortHopV: 9.8, doubleJumpV: 13.6, jumps: 1,
  rig,
  look: 'fang',
  palettes: [
    { main: '#3a3f5a', dark: '#1a1d2e', light: '#c8ccdc', accent: '#e8323f', skin: '#8a8fa8', eye: '#ffd23f' },
    { main: '#5a4030', dark: '#2a1a10', light: '#f0dcc0', accent: '#3ad8ff', skin: '#b08a60', eye: '#3ad8ff' },
    { main: '#e8e8f0', dark: '#8a8ea8', light: '#ffffff', accent: '#7a3ad8', skin: '#dcdcea', eye: '#7a3ad8' },
    { main: '#2a2a2a', dark: '#0a0a0a', light: '#8a8a8a', accent: '#ff9a2a', skin: '#4a4a4a', eye: '#ff9a2a' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 5, angle: 45, bkb: 54, kbg: 52 },
      b: { dmg: 8, angle: 135, bkb: 54, kbg: 64 },
      u: { dmg: 5, angle: 90, bkb: 62, kbg: 54 },
      d: { dmg: 4, angle: 80, bkb: 50, kbg: 38 },
    }),
    ...moves,
  },
};
