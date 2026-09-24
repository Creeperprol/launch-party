import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** NOX — lantern specter with a soul scythe. Three midair jumps, drifting wisps, phase-through dash, reaping slam. */
const rig: Rig = {
  hipH: 36, torso: 28, headR: 14, arm1: 16, arm2: 15, leg1: 20, leg2: 19,
  bodyR: 12, limbR: 4.4, handR: 5.6, footR: 5,
  weapon: { len: 72, width: 5, rest: 95, run: 150 },
};
const W = 48;
const H = 92;

const reap = (g: number, from: number, to: number, dmg: number, angle: number, kbg: number, r = 18): MoveDef['hitboxes'][number] =>
  ({ g, from, to, at: 'blade', t: 0.95, r, dmg, angle, bkb: 30, kbg, sfx: 'slash', fx: 'soul' });

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 18,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'handB', r: 13, dmg: 4, angle: 45, bkb: 24, kbg: 32, sfx: 'punch' }],
    anim: [{ f: 2, hB: [10, 60] }, { f: 4, hB: [44, 58], lean: 8 }],
  },
  ftilt: {
    id: 'ftilt', total: 28,
    hitboxes: [reap(0, 8, 11, 10, 36, 80)],
    anim: [{ f: 4, w: 130, lean: -8 }, { f: 8, w: -10, lean: 14 }, { f: 12, w: -55, lean: 14 }],
  },
  utilt: {
    id: 'utilt', total: 28,
    hitboxes: [reap(0, 7, 12, 9, 90, 82)],
    anim: [{ f: 3, w: -30 }, { f: 7, w: 80 }, { f: 12, w: 175, lean: -8 }],
  },
  dtilt: {
    id: 'dtilt', total: 20,
    hitboxes: [{ g: 0, from: 5, to: 8, pos: [40, 6], r: 18, dmg: 6, angle: 30, bkb: 30, kbg: 60, sfx: 'fire', fx: 'soul' }],
    anim: [{ f: 3, hip: [0, 24], lean: 30, hF: [46, 12] }],
  },
  dashAttack: {
    id: 'dashAttack', total: 34,
    motion: [{ from: 1, to: 10, vx: 10, noGrav: true }, { from: 11, to: 22, damp: 0.86 }],
    hitboxes: [{ g: 0, from: 4, to: 14, at: 'center', off: [12, 0], r: 26, dmg: 8, angle: 45, bkb: 36, kbg: 60, sfx: 'fire' }],
    anim: [{ f: 3, hip: [0, 44], lean: 50, fF: [0, 20], fB: [-20, 24] }, { f: 14, hip: [0, 44], lean: 50 }],
  },
  fsmash: {
    id: 'fsmash', total: 52, charge: { frame: 12, smash: true },
    hitboxes: [reap(0, 15, 18, 17, 36, 94, 24)],
    anim: [{ f: 6, w: 165, lean: -16 }, { f: 12, w: 165, lean: -16 }, { f: 15, w: -10, lean: 22 }, { f: 20, w: -65, lean: 24 }],
  },
  usmash: {
    id: 'usmash', total: 48, charge: { frame: 9, smash: true },
    hitboxes: [reap(0, 11, 16, 15, 90, 90, 24)],
    anim: [{ f: 9, w: -30, lean: 10 }, { f: 11, w: 60 }, { f: 16, w: 175, lean: -10 }],
  },
  dsmash: {
    id: 'dsmash', total: 46, charge: { frame: 8, smash: true },
    hitboxes: [
      { g: 0, from: 11, to: 14, pos: [50, 10], r: 24, dmg: 13, angle: 28, bkb: 32, kbg: 86, away: true, sfx: 'fire', fx: 'soul' },
      { g: 0, from: 11, to: 14, pos: [-50, 10], r: 24, dmg: 13, angle: 28, bkb: 32, kbg: 86, away: true, sfx: 'fire', fx: 'soul' },
    ],
    anim: [{ f: 8, hip: [0, 40], hF: [20, 100] }, { f: 11, hip: [0, 26], lean: 20, hF: [50, 10], hB: [-50, 10] }, { f: 20, hip: [0, 26], hF: [50, 10], hB: [-50, 10] }],
  },
  nair: {
    id: 'nair', total: 36, air: true, landingLag: 6,
    hitboxes: [{ ...reap(0, 5, 20, 7, 45, 76), t: 0.8 }],
    anim: [{ f: 3, spin: 0, w: 0 }, { f: 20, spin: 720, w: 0 }],
  },
  fair: {
    id: 'fair', total: 34, air: true, landingLag: 9,
    hitboxes: [reap(0, 8, 11, 11, 40, 84)],
    anim: [{ f: 4, w: 130, lean: -8 }, { f: 8, w: -10, lean: 14 }, { f: 11, w: -60, lean: 16 }],
  },
  bair: {
    id: 'bair', total: 32, air: true, landingLag: 9,
    hitboxes: [{ g: 0, from: 7, to: 10, at: 'handB', r: 18, dmg: 11, angle: 145, bkb: 26, kbg: 86, sfx: 'punch' }],
    anim: [{ f: 3, hB: [0, 60] }, { f: 7, hB: [-50, 56], lean: -10 }],
  },
  uair: {
    id: 'uair', total: 32, air: true, landingLag: 8,
    hitboxes: [reap(0, 6, 11, 9, 88, 80)],
    anim: [{ f: 3, w: 10 }, { f: 6, w: 90 }, { f: 11, w: 170 }],
  },
  dair: {
    id: 'dair', total: 40, air: true, landingLag: 16,
    hitboxes: [reap(0, 11, 15, 12, 270, 72)],
    anim: [{ f: 5, w: 90 }, { f: 11, w: -100 }, { f: 15, w: -95 }],
  },
  nspecial: {
    id: 'nspecial', total: 40, iasa: 30,
    projectiles: [{
      frame: 13, kind: 'wisp', at: 'handF', vx: 6.5, vy: -0.4, gravity: 0.006, life: 100, r: 14, reflectable: true,
      hit: { dmg: 8, angle: 50, bkb: 30, kbg: 52, sfx: 'fire', fx: 'soul' },
    }],
    hitboxes: [],
    anim: [{ f: 6, hF: [10, 60], lean: -4 }, { f: 13, hF: [50, 62], lean: 10 }, { f: 20, hF: [46, 60], lean: 8 }],
  },
  sspecial: {
    id: 'sspecial', total: 42, airOnce: true, intangible: [[2, 20]],
    motion: [{ from: 2, to: 20, vx: 12, noGrav: true, vy: 0 }, { from: 21, to: 30, damp: 0.8 }],
    hitboxes: [{ g: 0, from: 20, to: 23, at: 'center', r: 34, dmg: 9, angle: 50, bkb: 44, kbg: 60, sfx: 'fire', fx: 'soul' }],
    anim: [{ f: 2, hip: [0, 40], lean: 40, hF: [20, 50], hB: [-30, 50] }, { f: 20, hip: [0, 40], lean: 40 }, { f: 23, hip: [0, 40], lean: 0, hF: [50, 70], hB: [-50, 70] }],
  },
  uspecial: {
    id: 'uspecial', total: 60, helpless: true, helplessLag: 20, onLand: 'lag', ledgeFrom: 8, edgeStop: false,
    motion: [{ from: 1, to: 4, noGrav: true, vy: 0 }, { from: 5, to: 44, noGrav: true, vy: -6.4, drift: 1.5 }, { from: 45, to: 52, damp: 0.9 }],
    hitboxes: [{ g: 0, from: 5, to: 9, at: 'center', r: 30, dmg: 6, angle: 80, bkb: 40, kbg: 50, sfx: 'fire', fx: 'soul' }],
    hooks: { start: (f: Fighter) => leaveGround(f, -2) },
    anim: [{ f: 4, hip: [0, 30], hF: [20, 60] }, { f: 8, hip: [0, 44], hF: [10, 100], hB: [-10, 90], fF: [2, 10], fB: [-2, 10] }, { f: 44, hip: [0, 44], hF: [10, 100] }],
  },
  dspecial: {
    id: 'dspecial', total: 54,
    hitboxes: [
      reap(0, 20, 23, 16, 70, 82, 30),
      { g: 0, from: 20, to: 23, pos: [70, 10], r: 30, dmg: 12, angle: 70, bkb: 40, kbg: 76, sfx: 'slash', fx: 'soul' },
    ],
    anim: [{ f: 10, w: 175, lean: -16 }, { f: 18, w: 175, lean: -16 }, { f: 20, w: -80, lean: 30 }, { f: 30, w: -85, lean: 30 }],
  },
};

export const NOX: FighterDef = {
  id: 'nox',
  name: 'NOX',
  archetype: 'Lantern Specter',
  tagline: 'Drifts where nobody else can follow. Glows brightest right before the swing.',
  weight: 74,
  height: H,
  width: W,
  walkSpeed: 4.8, runSpeed: 8.4, dashSpeed: 9.2, dashFrames: 11, traction: 0.5,
  airSpeed: 6.4, airAccel: 0.44, airFriction: 0.07, gravity: 0.32, fallSpeed: 6,
  jumpV: 11.6, shortHopV: 8, doubleJumpV: 10.8, jumps: 3,
  rig,
  look: 'nox',
  palettes: [
    { main: '#3a2a5a', dark: '#1a1030', light: '#b8a8e8', accent: '#7affc8', skin: '#e8f0ff', eye: '#7affc8' },
    { main: '#5a2a2a', dark: '#2a0e0e', light: '#e8a8a8', accent: '#ffb03b', skin: '#fff0e0', eye: '#ffb03b' },
    { main: '#e8e8f4', dark: '#9a9ab8', light: '#ffffff', accent: '#7ac8ff', skin: '#2a2a3a', eye: '#7ac8ff' },
    { main: '#1a3a3a', dark: '#0a1a1a', light: '#8ad8d8', accent: '#ff5aa8', skin: '#d8fff4', eye: '#ff5aa8' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 5, angle: 45, bkb: 52, kbg: 50 },
      b: { dmg: 7, angle: 135, bkb: 52, kbg: 62 },
      u: { dmg: 5, angle: 90, bkb: 62, kbg: 52 },
      d: { dmg: 4, angle: 76, bkb: 48, kbg: 36 },
    }),
    ...moves,
  },
};
