import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import type { Match } from '../../sim/match';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** TALUS — stone golem with a warhammer. The heaviest, slowest fighter; huge armored hits. */
const rig: Rig = {
  hipH: 48, torso: 46, headR: 20, arm1: 26, arm2: 25, leg1: 26, leg2: 25,
  bodyR: 30, limbR: 10.5, handR: 13, footR: 13,
  weapon: { len: 62, width: 9 },
};
const W = 88;
const H = 132;

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 26,
    hitboxes: [{ g: 0, from: 6, to: 8, at: 'handF', r: 19, dmg: 5, angle: 35, bkb: 30, kbg: 35, sfx: 'blunt' }],
    anim: [{ f: 3, hF: [22, 84], lean: 8 }, { f: 6, hF: [62, 82], lean: 16 }, { f: 10, hF: [58, 80], lean: 16 }],
  },
  ftilt: {
    id: 'ftilt', total: 40,
    hitboxes: [{ g: 0, from: 11, to: 14, at: 'blade', t: 1, r: 26, dmg: 14, angle: 35, bkb: 24, kbg: 92, sfx: 'heavy', fx: 'rock' }],
    anim: [{ f: 6, w: 150, lean: -12 }, { f: 11, w: -20, lean: 20 }, { f: 15, w: -55, lean: 22 }],
  },
  utilt: {
    id: 'utilt', total: 38,
    hitboxes: [{ g: 0, from: 10, to: 15, at: 'handF', r: 24, dmg: 12, angle: 92, bkb: 42, kbg: 96, sfx: 'heavy', fx: 'swoosh' }],
    anim: [
      { f: 6, hF: [42, 62], lean: 10 },
      { f: 10, hF: [44, 122], lean: 2 },
      { f: 13, hF: [0, 138], lean: -8 },
      { f: 15, hF: [-34, 120], lean: -14 },
    ],
  },
  dtilt: {
    id: 'dtilt', total: 32,
    hitboxes: [{ g: 0, from: 9, to: 11, at: 'handF', r: 23, dmg: 11, angle: 24, bkb: 36, kbg: 82, sfx: 'heavy', fx: 'swoosh' }],
    anim: [
      { f: 5, hip: [0, 32], lean: 38, hF: [22, 42], fF: [24, 0], fB: [-28, 0] },
      { f: 9, hip: [0, 32], lean: 38, hF: [72, 14] },
      { f: 12, hip: [0, 32], lean: 38, hF: [68, 14] },
    ],
  },
  dashAttack: {
    id: 'dashAttack', total: 46,
    motion: [{ from: 1, to: 10, vx: 6 }, { from: 11, to: 20, vx: 9 }, { from: 21, to: 38, damp: 0.85 }],
    hitboxes: [{ g: 0, from: 11, to: 18, at: 'center', off: [24, 0], r: 38, dmg: 15, angle: 45, bkb: 55, kbg: 78, sfx: 'heavy', fx: 'rock' }],
    anim: [
      { f: 8, lean: -10, hF: [-10, 82] },
      { f: 11, lean: 44, hip: [10, 42], hF: [46, 62], hB: [36, 52], fB: [-42, 10] },
      { f: 18, lean: 44, hip: [10, 42], hF: [46, 62], hB: [36, 52], fB: [-42, 10] },
    ],
  },
  fsmash: {
    id: 'fsmash', total: 66, charge: { frame: 18, smash: true }, armor: { from: 1, to: 23, threshold: 10 },
    hitboxes: [{ g: 0, from: 24, to: 26, at: 'blade', t: 1, r: 32, dmg: 25, angle: 36, bkb: 32, kbg: 96, sfx: 'heavy', fx: 'rock', hitlag: 1.3 }],
    anim: [
      { f: 10, w: 150, lean: -20 },
      { f: 18, w: 150, lean: -20 },
      { f: 24, w: -60, lean: 32, hip: [12, 42] },
      { f: 30, w: -65, lean: 32, hip: [12, 42] },
    ],
  },
  usmash: {
    id: 'usmash', total: 60, charge: { frame: 12, smash: true }, armor: { from: 1, to: 17, threshold: 10 },
    hitboxes: [{ g: 0, from: 16, to: 20, at: 'blade', t: 1, r: 32, dmg: 20, angle: 90, bkb: 40, kbg: 92, sfx: 'heavy', fx: 'rock', hitlag: 1.2 }],
    anim: [
      { f: 12, hip: [0, 30], lean: 32, w: -60 },
      { f: 16, hip: [0, 58], lean: -4, w: 90 },
      { f: 21, hip: [0, 56], lean: -8, w: 160 },
    ],
  },
  dsmash: {
    id: 'dsmash', total: 60, charge: { frame: 9, smash: true }, armor: { from: 1, to: 12, threshold: 10 },
    hitboxes: [
      { g: 0, from: 13, to: 17, pos: [60, 26], r: 36, dmg: 17, angle: 30, bkb: 36, kbg: 92, away: true, sfx: 'heavy', fx: 'swoosh' },
      { g: 0, from: 13, to: 17, pos: [-60, 26], r: 36, dmg: 17, angle: 30, bkb: 36, kbg: 92, away: true, sfx: 'heavy', fx: 'swoosh' },
    ],
    anim: [
      { f: 9, hip: [0, 28], lean: 60, spin: 0 },
      { f: 13, hip: [0, 28], lean: 60, spin: 0 },
      { f: 26, hip: [0, 28], lean: 60, spin: -720 },
      { f: 32, hip: [0, 32], lean: 40, spin: -720 },
    ],
  },
  nair: {
    id: 'nair', total: 48, air: true, landingLag: 13,
    hitboxes: [
      { g: 0, from: 7, to: 10, at: 'center', r: 44, dmg: 13, angle: 45, bkb: 22, kbg: 100, away: true, sfx: 'heavy', fx: 'swoosh' },
      { g: 0, from: 11, to: 24, at: 'center', r: 38, dmg: 9, angle: 45, bkb: 16, kbg: 90, away: true, sfx: 'heavy' },
    ],
    anim: [
      { f: 5, hip: [0, 52], lean: 50, fF: [26, 40], fB: [0, 34], hF: [30, 72], hB: [10, 66], spin: 0 },
      { f: 24, hip: [0, 52], lean: 50, fF: [26, 40], fB: [0, 34], hF: [30, 72], hB: [10, 66], spin: -720 },
    ],
  },
  fair: {
    id: 'fair', total: 54, air: true, landingLag: 16,
    hitboxes: [{ g: 0, from: 11, to: 14, at: 'blade', t: 1, r: 28, dmg: 16, angle: 40, bkb: 32, kbg: 90, sfx: 'heavy', fx: 'rock' }],
    anim: [{ f: 7, w: 140, lean: -8 }, { f: 11, w: -20, lean: 18 }, { f: 15, w: -70, lean: 24 }],
  },
  bair: {
    id: 'bair', total: 48, air: true, landingLag: 13,
    hitboxes: [{ g: 0, from: 12, to: 15, at: 'footB', r: 26, dmg: 17, angle: 145, bkb: 26, kbg: 96, sfx: 'heavy', fx: 'swoosh' }],
    anim: [
      { f: 8, fB: [-10, 42], lean: 30 },
      { f: 12, fB: [-58, 54], fF: [-42, 42], lean: 40, hF: [42, 82], hB: [32, 72] },
      { f: 15, fB: [-56, 52], fF: [-40, 42], lean: 40 },
    ],
  },
  uair: {
    id: 'uair', total: 50, air: true, landingLag: 13,
    hitboxes: [{ g: 0, from: 11, to: 15, at: 'head', off: [0, 12], r: 30, dmg: 15, angle: 80, bkb: 32, kbg: 92, sfx: 'heavy', fx: 'swoosh' }],
    anim: [
      { f: 7, hip: [0, 42], lean: 10, hF: [22, 62], hB: [-22, 62] },
      { f: 11, hip: [0, 56], lean: -24, hF: [-32, 72], hB: [-42, 66] },
      { f: 15, hip: [0, 54], lean: -26 },
    ],
  },
  dair: {
    id: 'dair', total: 62, air: true, landingLag: 32,
    hitboxes: [{ g: 0, from: 17, to: 21, at: 'footF', r: 26, dmg: 16, angle: 270, bkb: 32, kbg: 82, sfx: 'heavy', fx: 'rock' }],
    anim: [
      { f: 13, fF: [10, 42], lean: -6, hF: [32, 114], hB: [-32, 114] },
      { f: 17, fF: [8, -18], fB: [-10, 10], lean: 0, hF: [32, 114], hB: [-32, 114] },
      { f: 21, fF: [8, -18], fB: [-10, 10], lean: 0 },
    ],
  },
  nspecial: {
    id: 'nspecial', total: 50, iasa: 40,
    projectiles: [{
      frame: 16, kind: 'rock', at: 'handF', vx: 10, vy: -9, gravity: 0.45, maxFall: 12, bounce: 8, life: 100, r: 18,
      hit: { dmg: 12, angle: 45, bkb: 30, kbg: 48, sfx: 'heavy', hitlag: 0.9 },
    }],
    hitboxes: [],
    anim: [
      { f: 8, hF: [-10, 60], hB: [-16, 50], lean: -10 },
      { f: 16, hF: [42, 66], hB: [30, 56], lean: 16 },
      { f: 22, hF: [40, 62], hB: [28, 52], lean: 14 },
    ],
  },
  sspecial: {
    id: 'sspecial', total: 50, airOnce: true, armor: { from: 1, to: 20, threshold: 12 },
    motion: [{ from: 1, to: 20, vx: 9 }, { from: 21, to: 34, damp: 0.85 }],
    hitboxes: [{ g: 0, from: 6, to: 20, at: 'center', off: [26, 0], r: 32, dmg: 14, angle: 40, bkb: 55, kbg: 68, sfx: 'heavy', fx: 'rock' }],
    anim: [
      { f: 4, hip: [4, 46], lean: -24, hF: [-18, 64], hB: [-26, 56] },
      { f: 20, hip: [4, 46], lean: -24 },
      { f: 26, lean: 0 },
    ],
  },
  uspecial: {
    id: 'uspecial', total: 56, helpless: true, helplessLag: 26, onLand: 'lag', ledgeFrom: 10, edgeStop: false,
    motion: [
      { from: 1, to: 4, vy: 0, noGrav: true },
      { from: 5, to: 20, vy: -9.4, noGrav: true, drift: 0.9 },
      { from: 21, to: 30, damp: 0.9, drift: 0.7 },
    ],
    hitboxes: [{ g: 0, from: 4, to: 18, at: 'head', off: [0, 20], r: 30, dmg: 15, angle: 85, bkb: 40, kbg: 88, sfx: 'heavy', fx: 'rock' }],
    hooks: { start: (f: Fighter) => leaveGround(f, -3) },
    anim: [
      { f: 3, hip: [0, 48], lean: -10, hF: [10, 64], hB: [-10, 60], fF: [16, 30], fB: [-16, 30] },
      { f: 5, hip: [0, 60], lean: -14, hF: [10, 132], hB: [-10, 128] },
      { f: 30, hip: [0, 60], lean: -14, hF: [10, 132], hB: [-10, 128] },
    ],
  },
  dspecial: {
    id: 'dspecial', total: 68, onLand: 'hook', edgeStop: false, armor: { from: 1, to: 68, threshold: 14 },
    hitboxes: [{ g: 0, from: 15, to: 68, at: 'hip', off: [0, -24], r: 36, dmg: 16, angle: 270, bkb: 42, kbg: 72, sfx: 'heavy', fx: 'rock' }],
    hooks: {
      start(f: Fighter) {
        leaveGround(f, -10);
      },
      frame(f: Fighter) {
        const mv = f.move!;
        f.noGrav = true;
        if (mv.frame <= 14) {
          f.vy = Math.min(f.vy, 0.4);
          f.vx *= 0.85;
        } else {
          f.vy = 18;
          f.vx = 0;
        }
      },
      land(f: Fighter, m: Match) {
        f.startMove('dspecialLand', m);
        return true;
      },
    },
    anim: [
      { f: 6, hip: [0, 52], lean: -10, hF: [30, 130], hB: [-30, 130], fF: [16, 30], fB: [-16, 30] },
      { f: 15, hip: [0, 48], lean: 0, hF: [30, 120], hB: [-30, 120], fF: [10, -6], fB: [-10, -6] },
      { f: 68, hip: [0, 48], lean: 0, hF: [30, 120], hB: [-30, 120], fF: [10, -6], fB: [-10, -6] },
    ],
  },
  dspecialLand: {
    id: 'dspecialLand', total: 36,
    hitboxes: [
      { g: 0, from: 1, to: 3, pos: [66, 16], r: 42, dmg: 10, angle: 60, bkb: 58, kbg: 58, away: true, sfx: 'heavy', fx: 'rock' },
      { g: 0, from: 1, to: 3, pos: [-66, 16], r: 42, dmg: 10, angle: 60, bkb: 58, kbg: 58, away: true, sfx: 'heavy', fx: 'rock' },
    ],
    anim: [{ f: 0, hip: [0, 30], lean: 26, fF: [32, 0], fB: [-32, 0] }, { f: 14, hip: [0, 30], lean: 26, fF: [32, 0], fB: [-32, 0] }],
  },
};

export const TALUS: FighterDef = {
  id: 'talus',
  name: 'TALUS',
  archetype: 'Stone Golem',
  tagline: 'Slower than everyone. Hits harder than everyone.',
  weight: 150,
  height: H,
  width: W,
  walkSpeed: 4.0,
  runSpeed: 7.2,
  dashSpeed: 8.2,
  dashFrames: 14,
  traction: 0.75,
  airSpeed: 4.8,
  airAccel: 0.36,
  airFriction: 0.09,
  gravity: 0.62,
  fallSpeed: 10.8,
  jumpV: 14.0,
  shortHopV: 9.6,
  doubleJumpV: 13.5,
  jumps: 1,
  rig,
  look: 'talus',
  palettes: [
    { main: '#8a8478', dark: '#524e46', light: '#d8d2c4', accent: '#ff9a3a', skin: '#6a6458', eye: '#ffe066' },
    { main: '#5a6a7a', dark: '#2e3944', light: '#a8bcc8', accent: '#ff5a5a', skin: '#48545e', eye: '#66e0ff' },
    { main: '#7a5a3a', dark: '#442f1c', light: '#c8a878', accent: '#5affb0', skin: '#5a3f24', eye: '#ffe066' },
    { main: '#5a3a6a', dark: '#301c3c', light: '#b088c8', accent: '#ffd85a', skin: '#402850', eye: '#66e0ff' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 11, angle: 45, bkb: 66, kbg: 62 },
      b: { dmg: 13, angle: 135, bkb: 64, kbg: 76 },
      u: { dmg: 10, angle: 90, bkb: 72, kbg: 66 },
      d: { dmg: 9, angle: 70, bkb: 60, kbg: 52 },
    }),
    ...moves,
  },
};
