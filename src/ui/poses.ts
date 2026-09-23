import type { FighterDef } from '../sim/defs';
import { Fighter } from '../sim/fighter';
import { resolvePose } from '../sim/pose';

const cache = new Map<string, Fighter>();

/** A never-simulated fighter frozen at a given frame of a move (menus, results). */
export function posedFighter(def: FighterDef, palette: number, moveId: string | null, frame: number, air = false): Fighter {
  const key = `${def.id}:${palette}:${moveId}:${frame}:${air}`;
  let f = cache.get(key);
  if (f) return f;
  f = new Fighter(0, def, palette, 0);
  f.x = 0;
  f.y = 0;
  f.facing = 1;
  f.grounded = !air;
  if (air) f.enter('air');
  const d = moveId ? def.moves[moveId] : undefined;
  if (d) {
    f.move = {
      def: d, id: d.id, frame, charge: 0, charging: false, chargeDone: true,
      hitGroups: new Map(), vars: {}, prevHB: [], airStart: air,
    };
    f.state = 'move';
  }
  f.computeBoxes();
  cache.set(key, f);
  return f;
}

/** Arms-up victory pose built from the standing pose. */
export function victoryFighter(def: FighterDef, palette: number): Fighter {
  const key = `${def.id}:${palette}:victory`;
  let f = cache.get(key);
  if (f) return f;
  f = new Fighter(0, def, palette, 0);
  f.facing = 1;
  f.computeBoxes();
  const r = def.rig;
  const reach = r.arm1 + r.arm2;
  const p = f.poseT;
  p.hFx = reach * 0.7;
  p.hFy = r.hipH + r.torso + reach * 0.62;
  p.hBx = -reach * 0.55;
  p.hBy = r.hipH + r.torso + reach * 0.7;
  p.lean = -4;
  p.w = 80;
  p.fFx = r.hipH * 0.4;
  p.fBx = -r.hipH * 0.4;
  resolvePose(r, p, f.pose, r.weapon ? r.weapon.len : 0);
  cache.set(key, f);
  return f;
}
