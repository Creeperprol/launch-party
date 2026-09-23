import type { FighterDef, HitboxDef } from '../sim/defs';
import { knockback } from '../sim/knockback';
import { blankPose, blankResolved, posePoint, poseTargets, resolvePose, type PoseCtx } from '../sim/pose';

/** Static summary of an attack used by the CPU to judge range and timing. Local space: +x forward, +y up from the feet. */
export interface MoveInfo {
  id: string;
  startup: number;
  activeEnd: number;
  total: number;
  air: boolean;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  dmg: number;
  /** Hit with the largest knockback at 100%, used to estimate KO power. */
  best: HitboxDef | null;
  kb100: number;
  /** Forward travel before the first active frame (dash attacks, lunges). */
  travel: number;
  grab: boolean;
  projectile: boolean;
  /** Total forward travel over the whole move, and whether it can carry us off a ledge. */
  fullTravel: number;
  leavesStage: boolean;
  helpless: boolean;
}

const cache = new Map<string, Map<string, MoveInfo>>();

const IDS = [
  'jab1', 'ftilt', 'utilt', 'dtilt', 'dashAttack', 'fsmash', 'usmash', 'dsmash',
  'nair', 'fair', 'bair', 'uair', 'dair', 'grab', 'dashGrab', 'nspecial', 'sspecial', 'dspecial',
];

export function moveInfos(def: FighterDef): Map<string, MoveInfo> {
  let m = cache.get(def.id);
  if (m) return m;
  m = new Map();
  for (const id of IDS) {
    const info = compute(def, id);
    if (info) m.set(id, info);
  }
  cache.set(def.id, m);
  return m;
}

function compute(def: FighterDef, id: string): MoveInfo | null {
  const d = def.moves[id];
  if (!d) return null;
  const air = !!d.air;
  const pose = blankPose();
  const res = blankResolved();
  let x1 = Infinity;
  let x2 = -Infinity;
  let y1 = Infinity;
  let y2 = -Infinity;
  let startup = Infinity;
  let activeEnd = 0;
  let best: HitboxDef | null = null;
  let kb100 = 0;
  let dmg = 0;
  const wlen = def.rig.weapon ? def.rig.weapon.len : 0;
  const sample = (fr: number, lx: number | undefined, ly: number | undefined, at: HitboxDef['at'], t: number | undefined, off: [number, number] | undefined, r: number) => {
    let px: number;
    let py: number;
    if (lx !== undefined && ly !== undefined) {
      px = lx;
      py = ly;
    } else {
      const ctx: PoseCtx = {
        state: 'move', sf: 0, t: 0, grounded: !air, fwd: 0, vy: 0,
        move: { def: d, frame: fr }, dj: 999, width: def.width, height: def.height,
      };
      poseTargets(def.rig, ctx, pose);
      resolvePose(def.rig, pose, res, wlen);
      const p = posePoint(res, at ?? 'center', t ?? 1);
      px = p.x;
      py = p.y;
    }
    if (off) {
      px += off[0];
      py += off[1];
    }
    x1 = Math.min(x1, px - r);
    x2 = Math.max(x2, px + r);
    y1 = Math.min(y1, py - r);
    y2 = Math.max(y2, py + r);
  };
  for (const h of d.hitboxes) {
    startup = Math.min(startup, h.from);
    activeEnd = Math.max(activeEnd, h.to);
    const last = Math.min(h.to, h.from + 6);
    for (let fr = h.from; fr <= last; fr++) sample(fr, h.pos?.[0], h.pos?.[1], h.at, h.t, h.off, h.r);
    const kb = h.fixed !== undefined ? h.fixed : knockback(100 + h.dmg, h.dmg, 100, h.kbg, h.bkb);
    if (kb > kb100) {
      kb100 = kb;
      best = h;
    }
    dmg = Math.max(dmg, h.dmg);
  }
  if (d.grab) {
    startup = Math.min(startup, d.grab.from);
    activeEnd = Math.max(activeEnd, d.grab.to);
    for (let fr = d.grab.from; fr <= d.grab.to; fr++) sample(fr, d.grab.pos?.[0], d.grab.pos?.[1], d.grab.at, undefined, undefined, d.grab.r);
  }
  const projectile = !!d.projectiles?.length;
  if (projectile) {
    const p = d.projectiles![0];
    startup = Math.min(startup, p.frame + 4);
    activeEnd = Math.max(activeEnd, p.frame + 20);
    x1 = Math.min(x1, 20);
    x2 = Math.max(x2, p.vx * Math.min(p.life, 40));
    y1 = Math.min(y1, 10);
    y2 = Math.max(y2, 110);
    dmg = Math.max(dmg, p.hit.dmg);
  }
  if (!isFinite(startup)) return null;
  let travel = 0;
  if (d.motion) {
    for (let fr = 1; fr <= startup; fr++) {
      for (const md of d.motion) if (fr >= md.from && fr <= md.to && md.vx !== undefined) travel += md.vx;
    }
  }
  let fullTravel = 0;
  if (d.motion) {
    for (let fr = 1; fr <= d.total; fr++) {
      for (const md of d.motion) if (fr >= md.from && fr <= md.to && md.vx !== undefined) fullTravel += md.vx;
    }
  }
  return {
    id, startup, activeEnd, total: d.total, air, x1, x2, y1, y2, dmg, best, kb100, travel, grab: !!d.grab, projectile,
    fullTravel, leavesStage: d.edgeStop === false, helpless: !!d.helpless,
  };
}
