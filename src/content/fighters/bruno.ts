import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import type { Match } from '../../sim/match';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** BRUNO — masked bear wrestler. Command-grab suplex, belly flop, roar that shoves. */
const rig: Rig = {
  hipH: 42, torso: 40, headR: 18, arm1: 22, arm2: 21, leg1: 22, leg2: 21,
  bodyR: 24, limbR: 9, handR: 11, footR: 11,
};
const W = 80;
const H = 120;

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 22,
    hitboxes: [{ g: 0, from: 5, to: 7, at: 'handF', r: 18, dmg: 5, angle: 40, bkb: 28, kbg: 36, sfx: 'blunt' }],
    anim: [{ f: 2, hF: [26, 76], lean: 6 }, { f: 5, hF: [60, 72], lean: 14 }, { f: 9, hF: [56, 70], lean: 12 }],
  },
  ftilt: {
    id: 'ftilt', total: 34,
    hitboxes: [{ g: 0, from: 9, to: 12, at: 'handF', r: 22, dmg: 12, angle: 35, bkb: 26, kbg: 88, sfx: 'heavy' }],
    anim: [{ f: 5, hF: [-14, 96], lean: -10 }, { f: 9, hF: [70, 60], lean: 22 }, { f: 12, hF: [64, 44], lean: 24 }],
  },
  utilt: {
    id: 'utilt', total: 34,
    hitboxes: [{ g: 0, from: 9, to: 14, at: 'handF', r: 22, dmg: 11, angle: 90, bkb: 40, kbg: 90, sfx: 'heavy' }],
    anim: [{ f: 5, hF: [40, 50], lean: 10 }, { f: 9, hF: [40, 120], lean: 0 }, { f: 14, hF: [-20, 124], lean: -12 }],
  },
  dtilt: {
    id: 'dtilt', total: 28,
    hitboxes: [{ g: 0, from: 8, to: 10, at: 'handF', r: 21, dmg: 10, angle: 22, bkb: 34, kbg: 76, sfx: 'heavy' }],
    anim: [{ f: 4, hip: [0, 30], lean: 36, hF: [24, 40] }, { f: 8, hip: [0, 30], lean: 36, hF: [70, 12] }],
  },
  dashAttack: {
    id: 'dashAttack', total: 42,
    motion: [{ from: 1, to: 10, vx: 9 }, { from: 11, to: 30, damp: 0.86 }],
    hitboxes: [{ g: 0, from: 8, to: 16, at: 'center', off: [22, 0], r: 36, dmg: 13, angle: 40, bkb: 52, kbg: 74, sfx: 'heavy', fx: 'shock' }],
    anim: [{ f: 6, lean: -6 }, { f: 9, lean: 44, hip: [10, 40], hF: [44, 60], hB: [36, 50] }, { f: 16, lean: 44, hip: [10, 40] }],
  },
  fsmash: {
    id: 'fsmash', total: 58, charge: { frame: 15, smash: true },
    hitboxes: [{ g: 0, from: 18, to: 21, at: 'handF', r: 28, dmg: 22, angle: 38, bkb: 32, kbg: 94, sfx: 'heavy', fx: 'shock', hitlag: 1.2 }],
    anim: [{ f: 8, hF: [-20, 120], hB: [-24, 116], lean: -18 }, { f: 15, hF: [-20, 120], lean: -18 }, { f: 18, hF: [74, 56], hB: [66, 50], lean: 30 }, { f: 22, hF: [70, 50], lean: 30 }],
  },
  usmash: {
    id: 'usmash', total: 52, charge: { frame: 10, smash: true },
    hitboxes: [{ g: 0, from: 14, to: 18, at: 'head', off: [0, 16], r: 30, dmg: 18, angle: 90, bkb: 40, kbg: 90, sfx: 'heavy', fx: 'shock' }],
    anim: [{ f: 10, hip: [0, 28], lean: 30 }, { f: 14, hip: [0, 54], lean: -4, hF: [24, 124], hB: [-24, 124] }, { f: 18, hip: [0, 52] }],
  },
  dsmash: {
    id: 'dsmash', total: 54, charge: { frame: 9, smash: true },
    hitboxes: [
      { g: 0, from: 13, to: 16, pos: [56, 14], r: 32, dmg: 16, angle: 32, bkb: 34, kbg: 90, away: true, sfx: 'heavy', fx: 'shock' },
      { g: 0, from: 13, to: 16, pos: [-56, 14], r: 32, dmg: 16, angle: 32, bkb: 34, kbg: 90, away: true, sfx: 'heavy', fx: 'shock' },
    ],
    anim: [{ f: 9, hip: [0, 50], hF: [30, 130], hB: [-30, 130] }, { f: 13, hip: [0, 30], lean: 20, hF: [60, 10], hB: [-60, 10] }, { f: 24, hip: [0, 30], lean: 20, hF: [60, 10], hB: [-60, 10] }],
  },
  nair: {
    id: 'nair', total: 44, air: true, landingLag: 12,
    hitboxes: [{ g: 0, from: 6, to: 20, at: 'center', r: 42, dmg: 11, angle: 45, bkb: 22, kbg: 92, away: true, sfx: 'heavy' }],
    anim: [{ f: 4, lean: 40, hF: [40, 70], hB: [-40, 70], fF: [30, 40], fB: [-30, 40] }, { f: 20, lean: 40, hF: [40, 70], hB: [-40, 70] }],
  },
  fair: {
    id: 'fair', total: 50, air: true, landingLag: 15,
    hitboxes: [{ g: 0, from: 11, to: 14, at: 'handF', r: 26, dmg: 15, angle: 285, bkb: 30, kbg: 80, sfx: 'heavy' }],
    anim: [{ f: 6, hF: [20, 130], hB: [10, 126], lean: -8 }, { f: 11, hF: [66, 40], hB: [56, 34], lean: 22 }, { f: 15, hF: [60, 20], lean: 26 }],
  },
  bair: {
    id: 'bair', total: 42, air: true, landingLag: 12,
    hitboxes: [{ g: 0, from: 9, to: 12, at: 'footB', r: 24, dmg: 15, angle: 148, bkb: 26, kbg: 94, sfx: 'heavy' }],
    anim: [{ f: 5, fB: [-10, 40], lean: 20 }, { f: 9, fB: [-60, 50], lean: 36 }],
  },
  uair: {
    id: 'uair', total: 44, air: true, landingLag: 12,
    hitboxes: [{ g: 0, from: 9, to: 13, at: 'head', off: [0, 12], r: 30, dmg: 13, angle: 85, bkb: 30, kbg: 90, sfx: 'heavy' }],
    anim: [{ f: 5, hip: [0, 40], hF: [30, 70] }, { f: 9, hip: [0, 52], lean: -20, hF: [-30, 100], hB: [-40, 94] }],
  },
  dair: {
    id: 'dair', total: 52, air: true, landingLag: 26,
    hitboxes: [{ g: 0, from: 14, to: 18, at: 'hip', off: [0, -26], r: 34, dmg: 15, angle: 270, bkb: 30, kbg: 80, sfx: 'heavy', fx: 'shock' }],
    anim: [{ f: 10, lean: -10, hF: [30, 110], hB: [-30, 110] }, { f: 14, lean: 0, hF: [40, 60], hB: [-40, 60], fF: [16, -10], fB: [-16, -10] }],
  },
  nspecial: {
    id: 'nspecial', total: 52,
    hitboxes: [
      { g: 0, from: 16, to: 26, at: 'head', off: [30, -6], r: 58, dmg: 5, angle: 20, bkb: 80, kbg: 20, sfx: 'blunt', fx: 'shock' },
    ],
    anim: [{ f: 10, hip: [0, 36], lean: 20, hF: [20, 60], hB: [0, 60] }, { f: 16, hip: [0, 46], lean: -12, hF: [40, 110], hB: [-30, 110] }, { f: 26, hip: [0, 46], lean: -12, hF: [40, 110], hB: [-30, 110] }],
  },
  sspecial: {
    id: 'sspecial', total: 48, airOnce: true,
    motion: [{ from: 1, to: 14, vx: 6 }],
    hitboxes: [],
    grab: { from: 9, to: 15, at: 'handF', r: 36, command: 'sspecialSuplex' },
    anim: [{ f: 5, hF: [10, 100], hB: [0, 96], lean: -6 }, { f: 9, hF: [64, 70], hB: [58, 60], lean: 26 }, { f: 16, hF: [60, 66], hB: [54, 58], lean: 26 }],
  },
  sspecialSuplex: {
    id: 'sspecialSuplex', total: 50, onLand: 'keep',
    throwDef: { release: 30, hit: { dmg: 15, angle: 135, bkb: 74, kbg: 64, sfx: 'heavy' } },
    hitboxes: [],
    hooks: { start: (f: Fighter) => leaveGround(f, -9) },
    anim: [{ f: 0, hF: [58, 66], hB: [52, 58], lean: 20 }, { f: 14, hF: [30, 150], hB: [20, 146], lean: -30 }, { f: 30, hF: [-60, 40], hB: [-66, 34], lean: -60 }, { f: 36, hF: [-60, 40], lean: -60 }],
  },
  uspecial: {
    id: 'uspecial', total: 58, helpless: true, helplessLag: 26, onLand: 'lag', ledgeFrom: 10, edgeStop: false,
    motion: [{ from: 1, to: 5, noGrav: true, vy: 0 }, { from: 6, to: 26, noGrav: true, vy: -9, drift: 0.9 }, { from: 27, to: 36, damp: 0.9 }],
    hitboxes: [{ g: 0, from: 6, to: 16, at: 'handF', r: 28, dmg: 13, angle: 82, bkb: 40, kbg: 80, sfx: 'heavy' }],
    hooks: { start: (f: Fighter) => leaveGround(f, -3) },
    anim: [{ f: 5, hip: [0, 34], lean: 20, hF: [30, 50] }, { f: 8, hip: [0, 56], hF: [20, 130], hB: [-10, 120] }, { f: 30, hip: [0, 56], hF: [20, 130] }],
  },
  dspecial: {
    id: 'dspecial', total: 64, onLand: 'hook', edgeStop: false, armor: { from: 1, to: 64, threshold: 12 },
    hitboxes: [{ g: 0, from: 14, to: 64, at: 'hip', off: [0, -20], r: 36, dmg: 14, angle: 270, bkb: 40, kbg: 70, sfx: 'heavy', fx: 'shock' }],
    hooks: {
      start(f: Fighter) {
        leaveGround(f, -11);
      },
      frame(f: Fighter) {
        f.noGrav = true;
        if (f.move!.frame <= 13) {
          f.vy = Math.min(f.vy + 0.9, 0.4);
          f.vx *= 0.9;
        } else {
          f.vy = 17;
          f.vx = 0;
        }
      },
      land(f: Fighter, m: Match) {
        f.startMove('dspecialLand', m);
        return true;
      },
    },
    anim: [{ f: 6, hip: [0, 50], lean: -30, hF: [40, 110], hB: [-40, 110] }, { f: 14, hip: [0, 46], lean: 70, hF: [60, 40], hB: [-20, 40], fF: [20, 30], fB: [-30, 30] }, { f: 64, hip: [0, 46], lean: 70 }],
  },
  dspecialLand: {
    id: 'dspecialLand', total: 34,
    hitboxes: [
      { g: 0, from: 1, to: 3, pos: [64, 16], r: 40, dmg: 9, angle: 60, bkb: 56, kbg: 56, away: true, sfx: 'heavy', fx: 'shock' },
      { g: 0, from: 1, to: 3, pos: [-64, 16], r: 40, dmg: 9, angle: 60, bkb: 56, kbg: 56, away: true, sfx: 'heavy', fx: 'shock' },
    ],
    anim: [{ f: 0, hip: [0, 24], lean: 80, hF: [60, 10], hB: [-30, 10] }, { f: 20, hip: [0, 24], lean: 80 }],
  },
};

export const BRUNO: FighterDef = {
  id: 'bruno',
  name: 'BRUNO',
  archetype: 'Bear Wrestler',
  tagline: 'Hugs are free. The suplex costs extra.',
  weight: 138,
  height: H,
  width: W,
  walkSpeed: 4.4, runSpeed: 8, dashSpeed: 8.8, dashFrames: 13, traction: 0.74,
  airSpeed: 5.2, airAccel: 0.38, airFriction: 0.09, gravity: 0.6, fallSpeed: 10.4,
  jumpV: 14.2, shortHopV: 9.8, doubleJumpV: 13.6, jumps: 1,
  rig,
  look: 'bruno',
  palettes: [
    { main: '#d8322f', dark: '#6a3a1e', light: '#e8c090', accent: '#ffd23f', skin: '#8a5a32', eye: '#ffffff' },
    { main: '#2f5ad8', dark: '#2a2a2a', light: '#d0d0d0', accent: '#ffffff', skin: '#3a3230', eye: '#ffffff' },
    { main: '#2fa85a', dark: '#c8b8a0', light: '#fff8ec', accent: '#ff4a6a', skin: '#f0ece4', eye: '#ffffff' },
    { main: '#9a3ad8', dark: '#8a4a1e', light: '#f0c890', accent: '#5affd8', skin: '#c07a3a', eye: '#ffffff' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 10, angle: 45, bkb: 66, kbg: 60 },
      b: { dmg: 12, angle: 135, bkb: 64, kbg: 74 },
      u: { dmg: 9, angle: 90, bkb: 70, kbg: 64 },
      d: { dmg: 8, angle: 70, bkb: 60, kbg: 50 },
    }),
    ...moves,
  },
};
