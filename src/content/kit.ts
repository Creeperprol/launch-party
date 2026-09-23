import type { AnimKey, HitData, MoveDef, Rig } from '../sim/defs';
import type { Fighter } from '../sim/fighter';
import type { Match } from '../sim/match';
import { airBase, standBase } from '../sim/pose';

/** Shared building blocks for fighter content: base-pose keys and universal moves. */

export function standKey(r: Rig, f: number): AnimKey {
  const p = standBase(r);
  return { f, hip: [p.hx, p.hy], lean: p.lean, hF: [p.hFx, p.hFy], hB: [p.hBx, p.hBy], fF: [p.fFx, p.fFy], fB: [p.fBx, p.fBy], w: p.w, spin: 0 };
}

export function airKey(r: Rig, f: number): AnimKey {
  const p = airBase(r);
  return { f, hip: [p.hx, p.hy], lean: p.lean, hF: [p.hFx, p.hFy], hB: [p.hBx, p.hBy], fF: [p.fFx, p.fFy], fB: [p.fBx, p.fBy], w: p.w, spin: 0 };
}

/** A tucked ball pose at frame f (rolls, dodges). */
function tuckKey(r: Rig, f: number, hipK = 0.6, spin?: number): AnimKey {
  const a = r.arm1 + r.arm2;
  const k: AnimKey = {
    f,
    hip: [0, r.hipH * hipK],
    lean: 40,
    hF: [a * 0.45, r.hipH * hipK + r.torso * 0.3],
    hB: [a * 0.2, r.hipH * hipK + r.torso * 0.15],
    fF: [r.hipH * 0.3, r.hipH * hipK * 0.25],
    fB: [-r.hipH * 0.15, r.hipH * hipK * 0.1],
  };
  if (spin !== undefined) k.spin = spin;
  return k;
}

export interface ThrowSet {
  f: HitData;
  b: HitData;
  u: HitData;
  d: HitData;
}

/** Grabs, pummel, throws. */
export function grabMoves(r: Rig, t: ThrowSet): Record<string, MoveDef> {
  const a = r.arm1 + r.arm2;
  const hold: [number, number] = [a * 0.85, r.hipH + r.torso * 0.55];
  const holdB: [number, number] = [a * 0.7, r.hipH + r.torso * 0.4];
  const grab: MoveDef = {
    id: 'grab',
    total: 30,
    hitboxes: [],
    grab: { from: 6, to: 7, at: 'handF', r: 16 },
    anim: [
      { f: 3, hF: [a * 0.3, r.hipH + r.torso * 0.5], hB: [a * 0.2, r.hipH + r.torso * 0.4], lean: 10 },
      { f: 6, hF: [a * 0.98 + 6, r.hipH + r.torso * 0.4], hB: [a * 0.85, r.hipH + r.torso * 0.3], lean: 20 },
      { f: 12, hF: [a * 0.9, r.hipH + r.torso * 0.4], hB: [a * 0.8, r.hipH + r.torso * 0.3], lean: 18 },
    ],
  };
  const dashGrab: MoveDef = {
    id: 'dashGrab',
    total: 40,
    hitboxes: [],
    grab: { from: 8, to: 10, at: 'handF', r: 18 },
    motion: [{ from: 1, to: 10, vx: 6 }, { from: 11, to: 24, damp: 0.85 }],
    anim: [
      { f: 5, hF: [a * 0.3, r.hipH + r.torso * 0.5], lean: 16 },
      { f: 8, hF: [a * 1.0 + 8, r.hipH + r.torso * 0.35], hB: [a * 0.9, r.hipH + r.torso * 0.25], lean: 30, hip: [4, r.hipH * 0.85] },
      { f: 16, hF: [a * 0.9, r.hipH + r.torso * 0.35], hB: [a * 0.8, r.hipH + r.torso * 0.25], lean: 24 },
    ],
  };
  const pummel: MoveDef = {
    id: 'pummel',
    total: 14,
    hitboxes: [],
    pummel: { frame: 4, dmg: 1.3 },
    anim: [
      { f: 0, hF: hold, hB: [a * 0.3, r.hipH + r.torso * 0.5] },
      { f: 4, hF: hold, hB: [a * 0.95, r.hipH + r.torso * 0.5] },
      { f: 14, hF: hold, hB: holdB },
    ],
  };
  const fthrow: MoveDef = {
    id: 'fthrow',
    total: 34,
    hitboxes: [],
    throwDef: { release: 12, hit: { sfx: 'blunt', ...t.f } },
    anim: [
      { f: 0, hF: hold, hB: holdB, lean: 10 },
      { f: 8, hF: [a * 0.35, r.hipH + r.torso * 0.8], hB: [a * 0.25, r.hipH + r.torso * 0.7], lean: -12 },
      { f: 12, hF: [a * 1.0, r.hipH + r.torso * 0.85], hB: [a * 0.9, r.hipH + r.torso * 0.75], lean: 24 },
    ],
  };
  const bthrow: MoveDef = {
    id: 'bthrow',
    total: 40,
    hitboxes: [],
    throwDef: { release: 16, hit: { sfx: 'heavy', ...t.b } },
    anim: [
      { f: 0, hF: hold, hB: holdB, lean: 10 },
      { f: 8, hF: [a * 0.2, r.hipH + r.torso + a * 0.8], hB: [0, r.hipH + r.torso + a * 0.7], lean: -6 },
      { f: 16, hF: [-a * 0.95, r.hipH + r.torso * 0.6], hB: [-a * 0.8, r.hipH + r.torso * 0.5], lean: -26 },
    ],
  };
  const uthrow: MoveDef = {
    id: 'uthrow',
    total: 38,
    hitboxes: [],
    throwDef: { release: 14, hit: { sfx: 'blunt', ...t.u } },
    anim: [
      { f: 0, hF: hold, hB: holdB, lean: 10 },
      { f: 9, hF: [a * 0.5, r.hipH * 0.7 + r.torso * 0.4], hB: [a * 0.4, r.hipH * 0.7 + r.torso * 0.3], hip: [0, r.hipH * 0.7], lean: 20 },
      { f: 14, hF: [a * 0.15, r.hipH + r.torso + a * 0.95], hB: [-a * 0.1, r.hipH + r.torso + a * 0.9], hip: [0, r.hipH], lean: -8 },
    ],
  };
  const dthrow: MoveDef = {
    id: 'dthrow',
    total: 40,
    hitboxes: [],
    throwDef: { release: 18, hit: { sfx: 'heavy', ...t.d } },
    anim: [
      { f: 0, hF: hold, hB: holdB, lean: 10 },
      { f: 10, hF: [a * 0.7, r.hipH + r.torso + 12], hB: [a * 0.6, r.hipH + r.torso + 6], lean: -10 },
      { f: 18, hF: [a * 0.9, 8], hB: [a * 0.8, 6], hip: [0, r.hipH * 0.7], lean: 40 },
    ],
  };
  return { grab, dashGrab, pummel, fthrow, bthrow, uthrow, dthrow };
}

/** Rolls, dodges, getups, techs, ledge options, item swings, item throw. */
export function commonMoves(r: Rig, W: number, H: number): Record<string, MoveDef> {
  const a = r.arm1 + r.arm2;
  const L = r.leg1 + r.leg2;
  const moves: Record<string, MoveDef> = {};

  moves.airdodge = {
    id: 'airdodge',
    total: 44,
    air: true,
    landingLag: 10,
    hitboxes: [],
    anim: [
      { f: 2, ...pick(tuckKey(r, 2, 1.0)), lean: 24 },
      { f: 26, ...pick(tuckKey(r, 26, 1.0)), lean: 24 },
    ],
    hooks: {
      start(f: Fighter) {
        const I = f.input.cur;
        const mv = f.move!;
        if (Math.hypot(I.x, I.y) >= 0.3) {
          const ang = Math.round(Math.atan2(I.y, I.x) / (Math.PI / 4)) * (Math.PI / 4);
          mv.vars.dx = Math.cos(ang);
          mv.vars.dy = Math.sin(ang);
          mv.vars.dir = 1;
          mv.vars.int0 = 3;
          mv.vars.int1 = 17;
          mv.vars.landLag = 14;
        } else {
          mv.vars.dir = 0;
          mv.vars.int0 = 3;
          mv.vars.int1 = 27;
          mv.vars.landLag = 10;
          f.vx *= 0.4;
          f.vy = Math.min(f.vy, 0) * 0.3;
        }
        f.fastFalling = false;
      },
      frame(f: Fighter) {
        const mv = f.move!;
        const F = mv.frame;
        if (mv.vars.dir) {
          if (F <= 18) {
            const sp = F <= 4 ? 13 : 13 - ((F - 4) / 14) * 11;
            f.vx = mv.vars.dx * sp;
            f.vy = -mv.vars.dy * sp;
            f.noGrav = true;
          } else if (F <= 26) {
            f.vx *= 0.9;
          }
        } else if (F <= 24) {
          f.vy = Math.min(f.vy, 1.2);
        }
      },
    },
  };

  const roll = (id: string, dir: 1 | -1, flip: boolean): MoveDef => ({
    id,
    total: 30,
    hitboxes: [],
    intangible: [[4, 16]],
    motion: [{ from: 3, to: 20, vx: 7.4 * dir }, { from: 21, to: 30, damp: 0.7 }],
    anim: [
      { ...tuckKey(r, 3, 0.55, 0) },
      { ...tuckKey(r, 22, 0.55, dir === 1 ? -360 : 360) },
      { ...standKey(r, 30), spin: dir === 1 ? -360 : 360 },
    ],
    hooks: flip ? { start: (f: Fighter) => { f.move!.vars.endFlip = 1; } } : undefined,
  });
  moves.rollF = roll('rollF', 1, true);
  moves.rollB = roll('rollB', -1, false);

  moves.spotdodge = {
    id: 'spotdodge',
    total: 26,
    hitboxes: [],
    intangible: [[3, 17]],
    anim: [
      { f: 3, hip: [0, r.hipH * 0.72], lean: -12, hF: [a * 0.2, r.hipH + r.torso * 0.3], hB: [-a * 0.1, r.hipH + r.torso * 0.25] },
      { f: 17, hip: [0, r.hipH * 0.72], lean: -12, hF: [a * 0.2, r.hipH + r.torso * 0.3], hB: [-a * 0.1, r.hipH + r.torso * 0.25] },
    ],
  };

  const kneel = (f: number): AnimKey => ({
    f,
    hip: [0, r.hipH * 0.55],
    lean: 22,
    hF: [a * 0.5, r.hipH * 0.55 + r.torso * 0.3],
    hB: [-a * 0.1, r.hipH * 0.4],
    fF: [r.hipH * 0.35, 0],
    fB: [-r.hipH * 0.35, 0],
  });

  moves.getupStand = {
    id: 'getupStand',
    total: 30,
    hitboxes: [],
    intangible: [[1, 22]],
    anim: [kneel(14), standKey(r, 30)],
  };
  const getupRoll = (id: string, dir: 1 | -1, flip: boolean): MoveDef => ({
    id,
    total: 36,
    hitboxes: [],
    intangible: [[1, 26]],
    motion: [{ from: 6, to: 26, vx: 7 * dir }, { from: 27, to: 36, damp: 0.7 }],
    anim: [tuckKey(r, 6, 0.55, 0), tuckKey(r, 26, 0.55, dir === 1 ? -360 : 360), { ...standKey(r, 36), spin: dir === 1 ? -360 : 360 }],
    hooks: flip ? { start: (f: Fighter) => { f.move!.vars.endFlip = 1; } } : undefined,
  });
  moves.getupRollF = getupRoll('getupRollF', 1, true);
  moves.getupRollB = getupRoll('getupRollB', -1, false);
  moves.getupAttack = {
    id: 'getupAttack',
    total: 40,
    intangible: [[1, 17]],
    hitboxes: [
      { g: 0, from: 18, to: 20, pos: [W * 0.75, 18], r: 26, dmg: 7, angle: 30, bkb: 80, kbg: 20, away: true, sfx: 'kick', fx: 'swoosh' },
      { g: 0, from: 18, to: 20, pos: [-W * 0.75, 18], r: 26, dmg: 7, angle: 30, bkb: 80, kbg: 20, away: true, sfx: 'kick', fx: 'swoosh' },
    ],
    anim: [
      { f: 10, hip: [0, r.hipH * 0.4], lean: -40, hF: [-a * 0.3, 6], hB: [-a * 0.5, 6], fF: [L * 0.5, 10], fB: [-L * 0.3, 6] },
      { f: 18, hip: [0, r.hipH * 0.45], lean: -20, hF: [-a * 0.2, 6], hB: [-a * 0.4, 6], fF: [L * 0.95, 14], fB: [-L * 0.95, 14] },
      { f: 22, hip: [0, r.hipH * 0.45], lean: -20, fF: [L * 0.9, 14], fB: [-L * 0.9, 14] },
      standKey(r, 40),
    ],
  };

  moves.techIn = {
    id: 'techIn',
    total: 26,
    hitboxes: [],
    intangible: [[1, 20]],
    anim: [kneel(10), standKey(r, 26)],
  };
  const techRoll = (id: string, dir: 1 | -1, flip: boolean): MoveDef => ({
    id,
    total: 40,
    hitboxes: [],
    intangible: [[1, 20]],
    motion: [{ from: 4, to: 24, vx: 7.5 * dir }, { from: 25, to: 40, damp: 0.7 }],
    anim: [tuckKey(r, 4, 0.55, 0), tuckKey(r, 24, 0.55, dir === 1 ? -360 : 360), { ...standKey(r, 40), spin: dir === 1 ? -360 : 360 }],
    hooks: flip ? { start: (f: Fighter) => { f.move!.vars.endFlip = 1; } } : undefined,
  });
  moves.techRollF = techRoll('techRollF', 1, true);
  moves.techRollB = techRoll('techRollB', -1, false);

  // Ledge options. The fighter is already standing on the stage; the ledge is behind at local x ≈ -(W/2+4).
  const lx = -(W / 2 + 4);
  const hangHip: [number, number] = [-(W + 6), r.hipH - H * 0.72];
  const hangKey = (f: number): AnimKey => ({
    f,
    hip: hangHip,
    lean: -4,
    hF: [lx + 2, 2],
    hB: [lx - 4, 0],
    fF: [-(W + 2), -H * 0.72 + 4],
    fB: [-(W + 10), -H * 0.72],
  });
  moves.ledgeClimb = {
    id: 'ledgeClimb',
    total: 30,
    hitboxes: [],
    intangible: [[1, 26]],
    anim: [
      hangKey(0),
      { f: 12, hip: [lx - 4, r.hipH * 0.6], lean: 30, hF: [lx + 10, 4], hB: [lx, 2], fF: [lx + 12, 4], fB: [lx - 12, -H * 0.2] },
      { f: 22, hip: [-8, r.hipH * 0.8], lean: 16, fF: [r.hipH * 0.2, 0], fB: [-r.hipH * 0.3, 0] },
      standKey(r, 30),
    ],
  };
  moves.ledgeRoll = {
    id: 'ledgeRoll',
    total: 42,
    hitboxes: [],
    intangible: [[1, 32]],
    motion: [{ from: 10, to: 34, vx: 7 }, { from: 35, to: 42, damp: 0.6 }],
    anim: [hangKey(0), { ...tuckKey(r, 10, 0.55, 0) }, { ...tuckKey(r, 34, 0.55, -360) }, { ...standKey(r, 42), spin: -360 }],
  };
  moves.ledgeAttack = {
    id: 'ledgeAttack',
    total: 46,
    intangible: [[1, 20]],
    hitboxes: [
      { g: 0, from: 22, to: 25, at: 'footF', r: 20, dmg: 9, angle: 45, bkb: 90, kbg: 20, sfx: 'kick', fx: 'swoosh' },
    ],
    anim: [
      hangKey(0),
      { f: 14, hip: [lx + 4, r.hipH * 0.55], lean: 20, fF: [lx + 16, 6], fB: [lx - 8, -H * 0.1], hF: [lx + 10, 4], hB: [lx, 2] },
      { f: 22, hip: [4, r.hipH * 0.9], lean: -18, fF: [W * 0.95, r.hipH * 0.55], fB: [-r.hipH * 0.3, 0], hF: [-a * 0.3, r.hipH + r.torso], hB: [-a * 0.6, r.hipH + r.torso * 0.8] },
      { f: 26, hip: [4, r.hipH * 0.9], lean: -18, fF: [W * 0.9, r.hipH * 0.5] },
      standKey(r, 46),
    ],
  };

  // Item throw: direction from the stick when the throw starts.
  moves.itemThrow = {
    id: 'itemThrow',
    total: 22,
    hitboxes: [],
    anim: [
      { f: 3, hF: [-a * 0.4, r.hipH + r.torso * 0.9], lean: -10 },
      { f: 6, hF: [a * 0.95, r.hipH + r.torso * 0.8], lean: 18 },
    ],
    hooks: {
      start(f: Fighter) {
        const d = f.stickDir();
        f.move!.vars.dir = d === 'b' ? 1 : d === 'u' ? 2 : d === 'd' ? 3 : 0;
      },
      frame(f: Fighter, m: Match) {
        if (f.move!.frame === 6) m.throwItem(f, (['f', 'b', 'u', 'd'] as const)[f.move!.vars.dir]);
      },
    },
  };

  // Item swings (the held item becomes the pose weapon).
  const holdHi: [number, number] = [a * 0.2, r.hipH + r.torso * 0.95];
  moves.batSwing = {
    id: 'batSwing',
    total: 64,
    charge: { frame: 14, smash: true },
    hitboxes: [
      { g: 0, from: 20, to: 23, at: 'blade', t: 1, r: 26, dmg: 26, angle: 38, bkb: 60, kbg: 100, sfx: 'heavy', fx: 'swoosh', hitlag: 1.4 },
      { g: 0, from: 20, to: 23, at: 'blade', t: 0.55, r: 22, dmg: 26, angle: 38, bkb: 60, kbg: 100, sfx: 'heavy', fx: 'swoosh', hitlag: 1.4 },
    ],
    anim: [
      { f: 10, hF: [-a * 0.5, r.hipH + r.torso * 0.9], hB: [-a * 0.4, r.hipH + r.torso * 0.8], w: 150, lean: -14 },
      { f: 14, hF: [-a * 0.5, r.hipH + r.torso * 0.9], hB: [-a * 0.4, r.hipH + r.torso * 0.8], w: 150, lean: -14 },
      { f: 20, hF: [a * 0.85, r.hipH + r.torso * 0.5], hB: [a * 0.7, r.hipH + r.torso * 0.45], w: 0, lean: 22 },
      { f: 23, hF: [a * 0.7, r.hipH + r.torso * 0.35], w: -40, lean: 24 },
      { f: 40, hF: [-a * 0.1, r.hipH + r.torso * 0.4], w: -150, lean: 10 },
    ],
  };
  moves.bladeJab = {
    id: 'bladeJab',
    total: 22,
    hitboxes: [
      { g: 0, from: 5, to: 7, at: 'blade', t: 1, r: 18, dmg: 6, angle: 45, bkb: 30, kbg: 60, sfx: 'slash', fx: 'swoosh' },
      { g: 0, from: 5, to: 7, at: 'blade', t: 0.5, r: 16, dmg: 6, angle: 45, bkb: 30, kbg: 60, sfx: 'slash', fx: 'swoosh' },
    ],
    anim: [
      { f: 3, hF: holdHi, w: 120, lean: -4 },
      { f: 5, hF: [a * 0.8, r.hipH + r.torso * 0.5], w: 10, lean: 14 },
      { f: 8, hF: [a * 0.7, r.hipH + r.torso * 0.3], w: -50, lean: 14 },
    ],
  };
  moves.bladeTilt = {
    id: 'bladeTilt',
    total: 32,
    hitboxes: [
      { g: 0, from: 8, to: 11, at: 'blade', t: 1, r: 20, dmg: 12, angle: 40, bkb: 35, kbg: 90, sfx: 'slash', fx: 'swoosh' },
      { g: 0, from: 8, to: 11, at: 'blade', t: 0.5, r: 18, dmg: 12, angle: 40, bkb: 35, kbg: 90, sfx: 'slash', fx: 'swoosh' },
    ],
    anim: [
      { f: 5, hF: holdHi, w: 140, lean: -10 },
      { f: 8, hF: [a * 0.85, r.hipH + r.torso * 0.6], w: 20, lean: 18 },
      { f: 11, hF: [a * 0.75, r.hipH + r.torso * 0.3], w: -60, lean: 20 },
    ],
  };
  moves.bladeDash = {
    id: 'bladeDash',
    total: 38,
    motion: [{ from: 1, to: 14, vx: 8 }, { from: 15, to: 30, damp: 0.86 }],
    hitboxes: [
      { g: 0, from: 8, to: 13, at: 'blade', t: 1, r: 20, dmg: 12, angle: 45, bkb: 45, kbg: 75, sfx: 'slash', fx: 'swoosh' },
      { g: 0, from: 8, to: 13, at: 'blade', t: 0.5, r: 18, dmg: 12, angle: 45, bkb: 45, kbg: 75, sfx: 'slash', fx: 'swoosh' },
    ],
    anim: [
      { f: 5, hF: [a * 0.3, r.hipH + r.torso * 0.3], w: -80, lean: 20 },
      { f: 8, hF: [a * 0.9, r.hipH + r.torso * 0.6], w: 10, lean: 26 },
      { f: 13, hF: [a * 0.6, r.hipH + r.torso * 0.95], w: 80, lean: 14 },
    ],
  };
  moves.bladeSmash = {
    id: 'bladeSmash',
    total: 54,
    charge: { frame: 10, smash: true },
    hitboxes: [
      { g: 0, from: 16, to: 19, at: 'blade', t: 1, r: 22, dmg: 20, angle: 40, bkb: 40, kbg: 95, sfx: 'slash', fx: 'swoosh', hitlag: 1.2 },
      { g: 0, from: 16, to: 19, at: 'blade', t: 0.5, r: 20, dmg: 20, angle: 40, bkb: 40, kbg: 95, sfx: 'slash', fx: 'swoosh', hitlag: 1.2 },
    ],
    anim: [
      { f: 6, hF: [-a * 0.3, r.hipH + r.torso + a * 0.4], w: 135, lean: -16 },
      { f: 10, hF: [-a * 0.3, r.hipH + r.torso + a * 0.4], w: 135, lean: -16 },
      { f: 16, hF: [a * 0.9, r.hipH + r.torso * 0.6], w: 5, lean: 24 },
      { f: 19, hF: [a * 0.8, r.hipH + r.torso * 0.3], w: -55, lean: 26 },
    ],
  };
  void H;
  return moves;
}

function pick(k: AnimKey): Omit<AnimKey, 'f'> {
  const { f: _f, ...rest } = k;
  void _f;
  return rest;
}

/** Air/ground hop helper for moves that start with a small jump. */
export function leaveGround(f: Fighter, vy: number): void {
  if (f.grounded) {
    f.grounded = false;
    f.groundId = -1;
    f.vy = vy;
    f.move!.vars.hop = 1;
  }
}
