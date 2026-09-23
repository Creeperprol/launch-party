import type { FighterDef, MoveDef, Rig } from '../../sim/defs';
import type { Fighter } from '../../sim/fighter';
import type { Match } from '../../sim/match';
import { commonMoves, grabMoves, leaveGround } from '../kit';

/** NOVA — all-rounder. Medium everything, bouncing spark projectile. */
const rig: Rig = {
  hipH: 42, torso: 30, headR: 15, arm1: 17, arm2: 16, leg1: 23, leg2: 22,
  bodyR: 14, limbR: 5.5, handR: 7, footR: 7.5,
};
const W = 56;
const H = 100;

const moves: Record<string, MoveDef> = {
  jab1: {
    id: 'jab1', total: 18,
    hitboxes: [{ g: 0, from: 3, to: 4, at: 'handF', r: 13, dmg: 2.5, angle: 30, bkb: 20, kbg: 25, sfx: 'punch', hitlag: 0.8 }],
    next: { from: 6, to: 16, btn: 'attack', id: 'jab2' },
    anim: [{ f: 2, hF: [14, 64], lean: 8 }, { f: 3, hF: [34, 66], lean: 12 }, { f: 6, hF: [31, 66], lean: 12 }],
  },
  jab2: {
    id: 'jab2', total: 20,
    hitboxes: [{ g: 0, from: 3, to: 4, at: 'handB', r: 13, dmg: 2, angle: 35, bkb: 20, kbg: 25, sfx: 'punch', hitlag: 0.8 }],
    next: { from: 6, to: 16, btn: 'attack', id: 'jab3' },
    anim: [{ f: 2, hB: [10, 60], lean: 10 }, { f: 3, hB: [33, 63], hF: [4, 56], lean: 15 }, { f: 6, hB: [30, 62], lean: 14 }],
  },
  jab3: {
    id: 'jab3', total: 32,
    hitboxes: [{ g: 0, from: 5, to: 7, at: 'footF', r: 15, dmg: 4, angle: 40, bkb: 45, kbg: 90, sfx: 'kick', fx: 'swoosh' }],
    anim: [
      { f: 3, fF: [6, 22], lean: -4 },
      { f: 5, fF: [42, 34], hip: [-4, 40], lean: -14, hF: [-4, 70], hB: [-18, 62] },
      { f: 8, fF: [40, 34], hip: [-4, 40], lean: -14 },
    ],
  },
  ftilt: {
    id: 'ftilt', total: 26,
    hitboxes: [{ g: 0, from: 5, to: 7, at: 'footF', r: 16, dmg: 8, angle: 38, bkb: 10, kbg: 100, sfx: 'kick', fx: 'swoosh' }],
    anim: [
      { f: 3, fF: [8, 30], lean: -8 },
      { f: 5, fF: [45, 40], hip: [-6, 40], lean: -18, hF: [-5, 70], hB: [-20, 60] },
      { f: 8, fF: [43, 40], hip: [-6, 40], lean: -18 },
    ],
  },
  utilt: {
    id: 'utilt', total: 28,
    hitboxes: [{ g: 0, from: 5, to: 10, at: 'handF', r: 15, dmg: 6, angle: 95, bkb: 30, kbg: 115, sfx: 'punch', fx: 'swoosh' }],
    anim: [
      { f: 3, hF: [24, 50], lean: 8 },
      { f: 5, hF: [26, 86], lean: 2 },
      { f: 8, hF: [4, 102], lean: -6 },
      { f: 10, hF: [-20, 92], lean: -10 },
    ],
  },
  dtilt: {
    id: 'dtilt', total: 20,
    hitboxes: [{ g: 0, from: 5, to: 7, at: 'footF', r: 14, dmg: 7, angle: 80, bkb: 45, kbg: 55, sfx: 'kick', fx: 'swoosh' }],
    anim: [
      { f: 3, hip: [0, 24], lean: 30, fF: [14, 4], fB: [-14, 0], hF: [18, 40], hB: [-10, 30] },
      { f: 5, hip: [0, 24], lean: 30, fF: [47, 6], fB: [-14, 0], hF: [18, 40], hB: [-10, 30] },
      { f: 8, hip: [0, 24], lean: 30, fF: [44, 6] },
    ],
  },
  dashAttack: {
    id: 'dashAttack', total: 38,
    motion: [{ from: 1, to: 8, vx: 10 }, { from: 9, to: 26, damp: 0.88 }],
    hitboxes: [
      { g: 0, from: 6, to: 9, at: 'footF', r: 17, dmg: 9, angle: 55, bkb: 60, kbg: 70, sfx: 'kick', fx: 'swoosh' },
      { g: 0, from: 10, to: 14, at: 'footF', r: 15, dmg: 6, angle: 60, bkb: 40, kbg: 60, sfx: 'kick' },
    ],
    anim: [
      { f: 4, hip: [4, 46], lean: -20, fF: [20, 30] },
      { f: 6, hip: [4, 46], lean: -22, fF: [48, 36], fB: [-20, 10], hF: [-6, 72], hB: [-22, 64] },
      { f: 14, hip: [4, 44], lean: -20, fF: [46, 34], fB: [-18, 8] },
    ],
  },
  fsmash: {
    id: 'fsmash', total: 52, charge: { frame: 10, smash: true },
    hitboxes: [
      { g: 0, from: 15, to: 17, at: 'handF', r: 20, dmg: 16, angle: 40, bkb: 30, kbg: 95, sfx: 'fire', fx: 'fire' },
      { g: 0, from: 15, to: 17, at: 'handF', off: [16, 0], r: 16, dmg: 16, angle: 40, bkb: 30, kbg: 95, sfx: 'fire', fx: 'fire' },
    ],
    anim: [
      { f: 6, hF: [-18, 60], hB: [-24, 52], lean: -14, hip: [-4, 38], fF: [16, 0], fB: [-22, 0] },
      { f: 10, hF: [-18, 60], hB: [-24, 52], lean: -14, hip: [-4, 38], fF: [16, 0], fB: [-22, 0] },
      { f: 15, hF: [51, 62], hB: [-18, 56], lean: 22, hip: [6, 36], fF: [30, 0], fB: [-24, 0] },
      { f: 18, hF: [50, 62], lean: 22, hip: [6, 36], fF: [30, 0], fB: [-24, 0] },
    ],
  },
  usmash: {
    id: 'usmash', total: 44, charge: { frame: 6, smash: true },
    hitboxes: [{ g: 0, from: 9, to: 13, at: 'head', r: 20, dmg: 14, angle: 88, bkb: 32, kbg: 98, sfx: 'heavy', fx: 'swoosh' }],
    anim: [
      { f: 6, hip: [0, 30], lean: 20, hF: [-10, 50], hB: [-16, 46] },
      { f: 9, hip: [0, 50], lean: -8, hF: [-16, 64], hB: [-24, 60], fF: [10, 0], fB: [-10, 0] },
      { f: 13, hip: [0, 48], lean: -15, hF: [-16, 64], hB: [-24, 60] },
    ],
  },
  dsmash: {
    id: 'dsmash', total: 48, charge: { frame: 3, smash: true },
    hitboxes: [
      { g: 0, from: 5, to: 6, at: 'footF', r: 18, dmg: 10, angle: 30, bkb: 25, kbg: 100, sfx: 'kick', fx: 'swoosh' },
      { g: 0, from: 12, to: 13, at: 'footB', r: 18, dmg: 12, angle: 150, bkb: 25, kbg: 100, sfx: 'kick', fx: 'swoosh' },
    ],
    anim: [
      { f: 3, hip: [0, 22], lean: 40, hF: [20, 4], hB: [-8, 4], fF: [14, 12], fB: [-10, 8] },
      { f: 5, hip: [0, 22], lean: 40, hF: [20, 4], hB: [-8, 4], fF: [48, 8], fB: [-10, 10] },
      { f: 9, hip: [0, 22], lean: 40, fF: [10, 20], fB: [-10, 10] },
      { f: 12, hip: [0, 22], lean: 40, fF: [8, 14], fB: [-48, 8] },
      { f: 14, hip: [0, 22], lean: 40, fF: [8, 14], fB: [-46, 8] },
    ],
  },
  nair: {
    id: 'nair', total: 42, air: true, landingLag: 7,
    hitboxes: [
      { g: 0, from: 3, to: 6, at: 'footF', r: 16, dmg: 8, angle: 40, bkb: 10, kbg: 100, sfx: 'kick', fx: 'swoosh' },
      { g: 0, from: 7, to: 24, at: 'footF', r: 14, dmg: 5, angle: 40, bkb: 5, kbg: 90, sfx: 'kick' },
    ],
    anim: [
      { f: 3, fF: [42, 36], fB: [-10, 30], lean: -12, hF: [-4, 72], hB: [-20, 66] },
      { f: 24, fF: [40, 36], fB: [-10, 30], lean: -12, hF: [-4, 72], hB: [-20, 66] },
    ],
  },
  fair: {
    id: 'fair', total: 56, air: true, landingLag: 16,
    hitboxes: [{ g: 0, from: 16, to: 18, at: 'handF', r: 18, dmg: 13, angle: 40, bkb: 30, kbg: 85, sfx: 'heavy', fx: 'swoosh' }],
    anim: [
      { f: 10, hF: [-6, 94], lean: -12 },
      { f: 16, hF: [46, 60], lean: 18 },
      { f: 19, hF: [44, 52], lean: 18 },
    ],
  },
  bair: {
    id: 'bair', total: 34, air: true, landingLag: 7,
    hitboxes: [{ g: 0, from: 6, to: 10, at: 'footB', r: 17, dmg: 10.5, angle: 145, bkb: 12, kbg: 100, sfx: 'kick', fx: 'swoosh' }],
    anim: [
      { f: 4, fB: [-10, 34], lean: 20 },
      { f: 6, fB: [-46, 44], lean: 26, hF: [18, 60], fF: [10, 30] },
      { f: 10, fB: [-44, 44], lean: 26 },
    ],
  },
  uair: {
    id: 'uair', total: 30, air: true, landingLag: 6,
    hitboxes: [{ g: 0, from: 4, to: 8, at: 'footF', r: 16, dmg: 7, angle: 75, bkb: 22, kbg: 110, sfx: 'kick', fx: 'swoosh' }],
    anim: [
      { f: 2, fF: [12, 30], lean: -10 },
      { f: 4, fF: [20, 92], lean: -22, hF: [20, 50], hB: [-20, 50] },
      { f: 8, fF: [-18, 90], lean: -26 },
    ],
  },
  dair: {
    id: 'dair', total: 44, air: true, landingLag: 14,
    hitboxes: [
      { g: 0, from: 5, to: 6, at: 'footF', r: 16, dmg: 1.5, angle: 280, bkb: 0, kbg: 0, fixed: 28, hitlag: 0.5, sfx: 'kick', fx: 'swoosh' },
      { g: 1, from: 8, to: 9, at: 'footF', r: 16, dmg: 1.5, angle: 280, bkb: 0, kbg: 0, fixed: 28, hitlag: 0.5, sfx: 'kick', fx: 'swoosh' },
      { g: 2, from: 11, to: 12, at: 'footF', r: 16, dmg: 1.5, angle: 280, bkb: 0, kbg: 0, fixed: 28, hitlag: 0.5, sfx: 'kick', fx: 'swoosh' },
      { g: 3, from: 14, to: 15, at: 'footF', r: 16, dmg: 1.5, angle: 280, bkb: 0, kbg: 0, fixed: 28, hitlag: 0.5, sfx: 'kick', fx: 'swoosh' },
      { g: 4, from: 18, to: 19, at: 'footF', r: 18, dmg: 4, angle: 60, bkb: 50, kbg: 90, sfx: 'kick', fx: 'swoosh' },
    ],
    anim: [
      { f: 4, fF: [6, -4], fB: [-2, 0], lean: 0, hF: [16, 96], hB: [-16, 96] },
      { f: 19, fF: [6, -4], fB: [-2, 0], lean: 0, hF: [16, 96], hB: [-16, 96] },
    ],
  },
  nspecial: {
    id: 'nspecial', total: 44,
    projectiles: [{
      frame: 14, kind: 'spark', at: 'handF', vx: 8, vy: -1, gravity: 0.38, maxFall: 10, bounce: 7.5, life: 90, r: 15,
      hit: { dmg: 5, angle: 50, bkb: 25, kbg: 35, sfx: 'spark', hitlag: 0.7 },
    }],
    hitboxes: [],
    anim: [{ f: 8, hF: [-6, 66], lean: -8 }, { f: 14, hF: [38, 66], lean: 12 }, { f: 18, hF: [36, 66], lean: 12 }],
  },
  sspecial: {
    id: 'sspecial', total: 46, airOnce: true, edgeStop: false, onLand: 'keep',
    motion: [
      { from: 1, to: 8, vx: 1, vy: 0, noGrav: true },
      { from: 9, to: 24, vx: 16, vy: 0, noGrav: true },
      { from: 25, to: 46, damp: 0.85 },
    ],
    hitboxes: [{ g: 0, from: 10, to: 22, at: 'center', off: [18, 4], r: 26, dmg: 10, angle: 40, bkb: 55, kbg: 65, sfx: 'heavy', fx: 'shock' }],
    anim: [
      { f: 8, lean: -10, hF: [-20, 60], hB: [-26, 54] },
      { f: 10, lean: 32, hip: [6, 40], hF: [20, 50], hB: [10, 44], fB: [-26, 4], fF: [14, 10] },
      { f: 22, lean: 32, hip: [6, 40], hF: [20, 50], hB: [10, 44], fB: [-26, 4], fF: [14, 10] },
    ],
  },
  uspecial: {
    id: 'uspecial', total: 52, helpless: true, helplessLag: 22, onLand: 'lag', ledgeFrom: 14, edgeStop: false,
    motion: [
      { from: 1, to: 2, vy: 0, noGrav: true, drift: 0 },
      { from: 3, to: 12, vy: -14, noGrav: true, drift: 0.5 },
      { from: 13, to: 22, vy: -10, noGrav: true, drift: 0.5 },
      { from: 23, to: 30, vy: -3, noGrav: true, drift: 0.6 },
    ],
    hitboxes: [
      { g: 0, from: 3, to: 4, at: 'handF', r: 17, dmg: 1.5, angle: 88, bkb: 0, kbg: 0, fixed: 62, hitlag: 0.5, sfx: 'spark', fx: 'spark' },
      { g: 1, from: 6, to: 7, at: 'handF', r: 17, dmg: 1.5, angle: 88, bkb: 0, kbg: 0, fixed: 62, hitlag: 0.5, sfx: 'spark', fx: 'spark' },
      { g: 2, from: 9, to: 10, at: 'handF', r: 17, dmg: 1.5, angle: 88, bkb: 0, kbg: 0, fixed: 62, hitlag: 0.5, sfx: 'spark', fx: 'spark' },
      { g: 3, from: 12, to: 13, at: 'handF', r: 17, dmg: 1.5, angle: 88, bkb: 0, kbg: 0, fixed: 62, hitlag: 0.5, sfx: 'spark', fx: 'spark' },
      { g: 4, from: 16, to: 17, at: 'handF', r: 20, dmg: 4, angle: 70, bkb: 60, kbg: 85, sfx: 'spark', fx: 'spark' },
    ],
    hooks: { start: (f: Fighter) => leaveGround(f, -2) },
    anim: [
      { f: 2, hip: [0, 30], hF: [16, 40], lean: 16 },
      { f: 3, hF: [18, 98], hB: [-14, 50], lean: -6, fF: [6, 10], fB: [-12, 20], hip: [0, 42] },
      { f: 24, hF: [16, 98], hB: [-14, 50], lean: -6, fF: [6, 10], fB: [-12, 20], hip: [0, 42] },
    ],
  },
  dspecial: {
    id: 'dspecial', total: 90, onLand: 'hook', edgeStop: false,
    hitboxes: [{ g: 0, from: 11, to: 90, at: 'hip', off: [0, -12], r: 26, dmg: 9, angle: 270, bkb: 30, kbg: 60, sfx: 'heavy', fx: 'shock' }],
    hooks: {
      start(f: Fighter) {
        leaveGround(f, -9);
      },
      frame(f: Fighter) {
        const mv = f.move!;
        f.noGrav = true;
        if (mv.frame <= 10) {
          if (mv.vars.hop) f.vy = Math.min(f.vy + 0.9, 2);
          else f.vy = 0;
          f.vx *= 0.8;
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
    anim: [
      { f: 4, spin: -180, fF: [12, 30], fB: [-6, 34], lean: 30 },
      { f: 10, spin: -360, fF: [6, 0], fB: [-6, 0], lean: 0, hF: [14, 100], hB: [-14, 100] },
      { f: 90, spin: -360, fF: [6, 0], fB: [-6, 0], lean: 0, hF: [14, 100], hB: [-14, 100] },
    ],
  },
  dspecialLand: {
    id: 'dspecialLand', total: 26,
    hitboxes: [
      { g: 0, from: 1, to: 3, pos: [40, 12], r: 30, dmg: 7, angle: 70, bkb: 50, kbg: 55, away: true, sfx: 'heavy', fx: 'shock' },
      { g: 0, from: 1, to: 3, pos: [-40, 12], r: 30, dmg: 7, angle: 70, bkb: 50, kbg: 55, away: true, sfx: 'heavy', fx: 'shock' },
    ],
    anim: [{ f: 0, hip: [0, 22], lean: 20, fF: [18, 0], fB: [-18, 0] }, { f: 8, hip: [0, 22], lean: 20, fF: [18, 0], fB: [-18, 0] }],
  },
};

export const NOVA: FighterDef = {
  id: 'nova',
  name: 'NOVA',
  archetype: 'All-rounder',
  tagline: 'Scrappy spark-slinger who does a bit of everything.',
  weight: 100,
  height: H,
  width: W,
  walkSpeed: 6,
  runSpeed: 10.5,
  dashSpeed: 11.5,
  dashFrames: 11,
  traction: 0.6,
  airSpeed: 6.6,
  airAccel: 0.5,
  airFriction: 0.1,
  gravity: 0.5,
  fallSpeed: 9,
  jumpV: 13.4,
  shortHopV: 9.5,
  doubleJumpV: 13.2,
  jumps: 1,
  rig,
  look: 'nova',
  palettes: [
    { main: '#ff5a4e', dark: '#b8263a', light: '#ffc2a8', accent: '#2fd4c8', skin: '#ffd9b8', eye: '#1b1530' },
    { main: '#4e8dff', dark: '#2a4bb8', light: '#c2d8ff', accent: '#ffb82e', skin: '#ffd9b8', eye: '#1b1530' },
    { main: '#ffcc3a', dark: '#c98a12', light: '#fff0b8', accent: '#8a4dff', skin: '#f0c49c', eye: '#1b1530' },
    { main: '#3ed07a', dark: '#1f8a4a', light: '#c8f5d8', accent: '#ff4e9a', skin: '#e6b48c', eye: '#1b1530' },
  ],
  moves: {
    ...commonMoves(rig, W, H),
    ...grabMoves(rig, {
      f: { dmg: 8, angle: 45, bkb: 60, kbg: 55 },
      b: { dmg: 10, angle: 135, bkb: 60, kbg: 68 },
      u: { dmg: 7, angle: 90, bkb: 70, kbg: 60 },
      d: { dmg: 6, angle: 72, bkb: 55, kbg: 42 },
    }),
    ...moves,
  },
};
