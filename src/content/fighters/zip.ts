import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** ZIP — speedster. Fastest runner and faller, light, laser + reflector. */
const rig: Rig = {
  hipH: 37, torso: 24, headR: 13, arm1: 14, arm2: 14, leg1: 20, leg2: 19,
  bodyR: 10, limbR: 4.5, handR: 5.5, footR: 6.5,
};
const W = 48;
const H = 86;

const LAUNCH_SPEED = 16.5;

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 14,
    hitboxes: [{ g: 0, from: 2, to: 3, at: 'handF', r: 11, dmg: 2, angle: 30, bkb: 18, kbg: 25, sfx: 'punch', hitlag: 0.8 }],
    next: { from: 4, to: 12, btn: 'attack', id: 'jab2' },
    anim: [{ f: 1, hF: [12, 54], lean: 8 }, { f: 2, hF: [30, 56], lean: 12 }, { f: 5, hF: [27, 56], lean: 12 }],
  },
  jab2: {
    id: 'jab2', total: 16,
    hitboxes: [{ g: 0, from: 2, to: 3, at: 'handB', r: 11, dmg: 2, angle: 35, bkb: 18, kbg: 25, sfx: 'punch', hitlag: 0.8 }],
    next: { from: 4, to: 12, btn: 'attack', id: 'jab3' },
    anim: [{ f: 1, hB: [10, 52], lean: 10 }, { f: 2, hB: [29, 54], hF: [4, 48], lean: 14 }, { f: 5, hB: [27, 54], lean: 14 }],
  },
  jab3: {
    id: 'jab3', total: 28,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'footF', r: 13, dmg: 4, angle: 40, bkb: 40, kbg: 85, sfx: 'kick', fx: 'swoosh' }],
    anim: [{ f: 2, fF: [6, 22], lean: -6 }, { f: 4, fF: [37, 30], hip: [-3, 35], lean: -14 }, { f: 7, fF: [35, 30], hip: [-3, 35], lean: -14 }],
  },
  ftilt: {
    id: 'ftilt', total: 22,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'footF', r: 14, dmg: 7, angle: 38, bkb: 10, kbg: 95, sfx: 'kick', fx: 'swoosh' }],
    anim: [{ f: 2, fF: [10, 26], lean: -8 }, { f: 4, fF: [38, 36], hip: [-4, 36], lean: -20 }, { f: 7, fF: [36, 36], hip: [-4, 36], lean: -20 }],
  },
  utilt: {
    id: 'utilt', total: 22,
    hitboxes: [{ g: 0, from: 4, to: 8, at: 'footF', r: 14, dmg: 7, angle: 95, bkb: 25, kbg: 115, sfx: 'kick', fx: 'swoosh' }],
    anim: [
      { f: 2, fF: [20, 20], lean: -6 },
      { f: 4, fF: [18, 74], lean: -18, hF: [16, 30], hB: [-14, 30] },
      { f: 6, fF: [-6, 80], lean: -22 },
      { f: 8, fF: [-24, 60], lean: -22 },
    ],
  },
  dtilt: {
    id: 'dtilt', total: 18,
    hitboxes: [{ g: 0, from: 4, to: 6, at: 'footF', r: 13, dmg: 6, angle: 75, bkb: 40, kbg: 60, sfx: 'kick', fx: 'swoosh' }],
    anim: [
      { f: 2, hip: [0, 20], lean: 30, fF: [12, 4], fB: [-12, 0], hF: [14, 30], hB: [-8, 24] },
      { f: 4, hip: [0, 20], lean: 30, fF: [40, 4], fB: [-12, 0], hF: [14, 30], hB: [-8, 24] },
      { f: 7, hip: [0, 20], lean: 30, fF: [38, 4] },
    ],
  },
  dashAttack: {
    id: 'dashAttack', total: 32,
    motion: [{ from: 1, to: 14, vx: 13 }, { from: 15, to: 32, damp: 0.85 }],
    hitboxes: [
      { g: 0, from: 4, to: 7, at: 'footF', r: 15, dmg: 7, angle: 50, bkb: 55, kbg: 65, sfx: 'kick', fx: 'swoosh' },
      { g: 0, from: 8, to: 14, at: 'footF', r: 13, dmg: 5, angle: 55, bkb: 40, kbg: 55, sfx: 'kick' },
    ],
    anim: [
      { f: 3, hip: [0, 18], lean: -30, fF: [40, 4], fB: [-10, 14], hF: [-10, 40], hB: [-24, 30] },
      { f: 14, hip: [0, 18], lean: -30, fF: [40, 4], fB: [-10, 14], hF: [-10, 40], hB: [-24, 30] },
    ],
  },
  fsmash: {
    id: 'fsmash', total: 44, charge: { frame: 8, smash: true },
    hitboxes: [{ g: 0, from: 12, to: 14, at: 'footF', r: 17, dmg: 14, angle: 38, bkb: 28, kbg: 97, sfx: 'kick', fx: 'swoosh' }],
    anim: [
      { f: 5, fF: [6, 30], lean: 10, hF: [10, 50] },
      { f: 8, fF: [6, 30], lean: 10, hF: [10, 50] },
      { f: 12, fF: [46, 40], hip: [8, 38], lean: -24, hF: [-12, 56], hB: [-22, 50] },
      { f: 15, fF: [44, 40], hip: [8, 38], lean: -24 },
    ],
  },
  usmash: {
    id: 'usmash', total: 40, charge: { frame: 5, smash: true },
    hitboxes: [{ g: 0, from: 8, to: 12, at: 'footF', r: 16, dmg: 13, angle: 88, bkb: 30, kbg: 98, sfx: 'kick', fx: 'swoosh' }],
    anim: [
      { f: 5, hip: [0, 26], lean: 20, fF: [10, 6] },
      { f: 8, hip: [0, 38], fF: [14, 76], lean: -24, hF: [10, 20], hB: [-12, 20] },
      { f: 12, hip: [0, 38], fF: [-10, 76], lean: -24 },
    ],
  },
  dsmash: {
    id: 'dsmash', total: 42, charge: { frame: 3, smash: true },
    hitboxes: [
      { g: 0, from: 5, to: 7, at: 'footF', r: 15, dmg: 12, angle: 25, bkb: 26, kbg: 95, sfx: 'kick', fx: 'swoosh' },
      { g: 0, from: 5, to: 7, at: 'footB', r: 15, dmg: 12, angle: 155, bkb: 26, kbg: 95, sfx: 'kick', fx: 'swoosh' },
    ],
    anim: [
      { f: 3, hip: [0, 16], lean: 10, fF: [14, 4], fB: [-14, 4], hF: [10, 10], hB: [-10, 10] },
      { f: 5, hip: [0, 16], lean: 10, fF: [42, 6], fB: [-42, 6], hF: [10, 10], hB: [-10, 10] },
      { f: 8, hip: [0, 16], lean: 10, fF: [40, 6], fB: [-40, 6] },
    ],
  },
  nair: {
    id: 'nair', total: 36, air: true, landingLag: 6,
    hitboxes: [
      { g: 0, from: 3, to: 5, at: 'footF', r: 15, dmg: 9, angle: 40, bkb: 10, kbg: 100, sfx: 'kick', fx: 'swoosh' },
      { g: 0, from: 6, to: 22, at: 'footF', r: 13, dmg: 5, angle: 40, bkb: 5, kbg: 90, sfx: 'kick' },
    ],
    anim: [
      { f: 3, fF: [38, 32], fB: [-8, 26], lean: -12, hF: [-4, 62], hB: [-16, 58] },
      { f: 22, fF: [36, 32], fB: [-8, 26], lean: -12, hF: [-4, 62], hB: [-16, 58] },
    ],
  },
  fair: {
    id: 'fair', total: 40, air: true, landingLag: 10,
    hitboxes: [
      { g: 0, from: 6, to: 7, at: 'footF', r: 14, dmg: 4, angle: 70, bkb: 0, kbg: 0, fixed: 55, hitlag: 0.6, sfx: 'kick', fx: 'swoosh' },
      { g: 1, from: 11, to: 13, at: 'footB', r: 15, dmg: 6, angle: 42, bkb: 30, kbg: 85, sfx: 'kick', fx: 'swoosh' },
    ],
    anim: [
      { f: 6, fF: [37, 40], fB: [-6, 24], lean: -14 },
      { f: 9, fF: [10, 28], fB: [0, 24], lean: -4 },
      { f: 11, fB: [37, 36], fF: [6, 26], lean: -16 },
      { f: 13, fB: [35, 36], lean: -16 },
    ],
  },
  bair: {
    id: 'bair', total: 34, air: true, landingLag: 8,
    hitboxes: [{ g: 0, from: 6, to: 9, at: 'footB', r: 16, dmg: 12, angle: 145, bkb: 12, kbg: 100, sfx: 'kick', fx: 'swoosh' }],
    anim: [{ f: 4, fB: [-8, 30], lean: 20 }, { f: 6, fB: [-42, 42], lean: 26, hF: [16, 50] }, { f: 9, fB: [-40, 42], lean: 26 }],
  },
  uair: {
    id: 'uair', total: 30, air: true, landingLag: 6,
    hitboxes: [
      { g: 0, from: 4, to: 5, at: 'footF', r: 14, dmg: 5, angle: 80, bkb: 0, kbg: 0, fixed: 55, hitlag: 0.6, sfx: 'kick', fx: 'swoosh' },
      { g: 1, from: 8, to: 10, at: 'footB', r: 15, dmg: 8, angle: 80, bkb: 30, kbg: 110, sfx: 'kick', fx: 'swoosh' },
    ],
    anim: [
      { f: 4, fF: [10, 78], lean: -20 },
      { f: 6, fF: [16, 40], fB: [-6, 30], lean: -10 },
      { f: 8, fB: [-10, 80], fF: [14, 26], lean: -20 },
    ],
  },
  dair: {
    id: 'dair', total: 44, air: true, landingLag: 16,
    hitboxes: [
      { g: 0, from: 6, to: 7, at: 'footF', r: 14, dmg: 1.5, angle: 275, bkb: 0, kbg: 0, fixed: 28, hitlag: 0.5, sfx: 'kick', fx: 'swoosh' },
      { g: 1, from: 9, to: 10, at: 'footF', r: 14, dmg: 1.5, angle: 275, bkb: 0, kbg: 0, fixed: 28, hitlag: 0.5, sfx: 'kick', fx: 'swoosh' },
      { g: 2, from: 12, to: 13, at: 'footF', r: 14, dmg: 1.5, angle: 275, bkb: 0, kbg: 0, fixed: 28, hitlag: 0.5, sfx: 'kick', fx: 'swoosh' },
      { g: 3, from: 15, to: 16, at: 'footF', r: 14, dmg: 1.5, angle: 275, bkb: 0, kbg: 0, fixed: 28, hitlag: 0.5, sfx: 'kick', fx: 'swoosh' },
      { g: 4, from: 20, to: 21, at: 'footF', r: 16, dmg: 3, angle: 60, bkb: 50, kbg: 80, sfx: 'kick', fx: 'swoosh' },
    ],
    anim: [
      { f: 5, fF: [5, -4], fB: [-2, 0], lean: 0, hF: [12, 80], hB: [-12, 80] },
      { f: 21, fF: [5, -4], fB: [-2, 0], lean: 0, hF: [12, 80], hB: [-12, 80] },
    ],
  },
  nspecial: {
    id: 'nspecial', total: 22, iasa: 17,
    projectiles: [{
      frame: 7, kind: 'laser', at: 'handF', vx: 32, vy: 0, life: 22, r: 9,
      hit: { dmg: 3, angle: 0, bkb: 0, kbg: 0, fixed: 0, hitlag: 0.3, sfx: 'zap' },
    }],
    hitboxes: [],
    anim: [{ f: 4, hF: [26, 60], hB: [10, 50], lean: 4 }, { f: 12, hF: [26, 60], hB: [10, 50], lean: 4 }],
  },
  sspecial: {
    id: 'sspecial', total: 46, airOnce: true, helpless: true, helplessLag: 18, edgeStop: false,
    motion: [
      { from: 1, to: 11, vx: 0.5, vy: 0, noGrav: true },
      { from: 12, to: 17, vx: 62, vy: 0, noGrav: true },
      { from: 18, to: 26, vx: 3, vy: 0, noGrav: true },
      { from: 27, to: 46, damp: 0.9 },
    ],
    hitboxes: [{ g: 0, from: 12, to: 17, at: 'center', r: 30, dmg: 6, angle: 60, bkb: 45, kbg: 50, sfx: 'zap', fx: 'spark' }],
    anim: [
      { f: 10, lean: 30, hip: [0, 30], hF: [-10, 40], hB: [-18, 36] },
      { f: 12, lean: 55, hip: [0, 34], hF: [-24, 44], hB: [-30, 40], fF: [-10, 20], fB: [-30, 26] },
      { f: 18, lean: 55, hip: [0, 34], hF: [-24, 44], hB: [-30, 40], fF: [-10, 20], fB: [-30, 26] },
    ],
  },
  uspecial: {
    id: 'uspecial', total: 78, helpless: true, helplessLag: 24, onLand: 'lag', ledgeFrom: 38, edgeStop: false,
    motion: [{ from: 1, to: 35, damp: 0.9, noGrav: true, drift: 0 }, { from: 36, to: 60, drift: 0, noGrav: true }, { from: 61, to: 78, damp: 0.88, drift: 0.4 }],
    hitboxes: [
      { g: 0, from: 8, to: 9, at: 'center', r: 38, dmg: 1.5, angle: 80, bkb: 0, kbg: 0, fixed: 30, hitlag: 0.5, away: true, sfx: 'fire', fx: 'fire' },
      { g: 1, from: 16, to: 17, at: 'center', r: 38, dmg: 1.5, angle: 80, bkb: 0, kbg: 0, fixed: 30, hitlag: 0.5, away: true, sfx: 'fire', fx: 'fire' },
      { g: 2, from: 24, to: 25, at: 'center', r: 38, dmg: 1.5, angle: 80, bkb: 0, kbg: 0, fixed: 30, hitlag: 0.5, away: true, sfx: 'fire', fx: 'fire' },
      { g: 3, from: 32, to: 33, at: 'center', r: 38, dmg: 1.5, angle: 80, bkb: 0, kbg: 0, fixed: 30, hitlag: 0.5, away: true, sfx: 'fire', fx: 'fire' },
      { g: 4, from: 36, to: 60, at: 'center', r: 32, dmg: 14, angle: 50, bkb: 60, kbg: 70, sfx: 'fire', fx: 'fire' },
    ],
    hooks: {
      start(f: Fighter) {
        leaveGround(f, -1);
      },
      frame(f: Fighter) {
        const mv = f.move!;
        const F = mv.frame;
        if (F <= 35) {
          f.vy = 0.6;
        } else if (F === 36) {
          const I = f.input.cur;
          let ang = Math.PI / 2;
          if (Math.hypot(I.x, I.y) >= 0.3) ang = Math.round(Math.atan2(I.y, I.x) / (Math.PI / 4)) * (Math.PI / 4);
          const wx = Math.cos(ang);
          const wy = Math.sin(ang);
          if (Math.abs(wx) > 0.01) f.facing = wx > 0 ? 1 : -1;
          mv.vars.wx = Math.abs(wx) < 1e-6 ? 0 : wx;
          mv.vars.wy = wy;
          const localAng = Math.atan2(wy, Math.abs(wx) < 1e-6 ? 0 : Math.abs(wx)) * (180 / Math.PI);
          mv.vars.poseSpin = localAng - 90;
        }
        if (F >= 36 && F <= 60) {
          f.vx = mv.vars.wx * LAUNCH_SPEED;
          f.vy = -mv.vars.wy * LAUNCH_SPEED;
        }
      },
    },
    anim: [
      { f: 3, hip: [0, 30], lean: 30, fF: [14, 20], fB: [-6, 16], hF: [16, 44], hB: [4, 40] },
      { f: 35, hip: [0, 30], lean: 30, fF: [14, 20], fB: [-6, 16], hF: [16, 44], hB: [4, 40] },
      { f: 36, hip: [0, 37], lean: 0, fF: [4, 0], fB: [-4, 2], hF: [8, 84], hB: [-8, 84] },
      { f: 60, hip: [0, 37], lean: 0, fF: [4, 0], fB: [-4, 2], hF: [8, 84], hB: [-8, 84] },
    ],
  },
  dspecial: {
    id: 'dspecial', total: 32, reflect: { from: 4, to: 22, r: 58 }, jumpCancel: [6, 24],
    hitboxes: [{ g: 0, from: 4, to: 5, at: 'center', r: 42, dmg: 5, angle: 80, bkb: 60, kbg: 30, away: true, sfx: 'zap', fx: 'spark' }],
    hooks: {
      frame(f: Fighter) {
        if (!f.grounded && f.move!.frame <= 24) {
          f.noGrav = true;
          f.vy = Math.min(f.vy, 1);
        }
      },
    },
    anim: [
      { f: 3, hip: [0, 30], lean: 0, hF: [24, 50], hB: [-24, 50] },
      { f: 22, hip: [0, 30], lean: 0, hF: [24, 50], hB: [-24, 50] },
    ],
  },
};

export const ZIP: FighterDef = {
  id: 'zip',
  name: 'ZIP',
  archetype: 'Speedster',
  tagline: 'Jackrabbit courier. Blink and you missed the knockout.',
  weight: 75,
  height: H,
  width: W,
  walkSpeed: 7,
  runSpeed: 14,
  dashSpeed: 14.5,
  dashFrames: 10,
  traction: 0.8,
  airSpeed: 7.2,
  airAccel: 0.55,
  airFriction: 0.12,
  gravity: 0.62,
  fallSpeed: 11,
  jumpV: 15.35,
  shortHopV: 10.56,
  doubleJumpV: 14.3,
  jumps: 1,
  rig,
  look: 'zip',
  palettes: [
    { main: '#f2f0ea', dark: '#9a96a8', light: '#ffffff', accent: '#ff3d7f', skin: '#f2f0ea', eye: '#1b1530' },
    { main: '#2e2a3a', dark: '#15121e', light: '#5a5470', accent: '#3dffb0', skin: '#2e2a3a', eye: '#ffffff' },
    { main: '#ffb03d', dark: '#c46f10', light: '#ffe0a8', accent: '#3d7fff', skin: '#ffb03d', eye: '#1b1530' },
    { main: '#7fd8ff', dark: '#3a8ab8', light: '#d8f4ff', accent: '#ff7f3d', skin: '#7fd8ff', eye: '#1b1530' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 7, angle: 40, bkb: 55, kbg: 55 },
      b: { dmg: 9, angle: 135, bkb: 55, kbg: 70 },
      u: { dmg: 6, angle: 90, bkb: 75, kbg: 55 },
      d: { dmg: 5, angle: 75, bkb: 50, kbg: 45 },
    }),
    ...moves,
  },
};
