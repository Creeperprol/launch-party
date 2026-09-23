import type { Match } from './match';

/** FNV-1a over the simulation state, for determinism checks. */
export function hashMatch(m: Match): string {
  let h = 0x811c9dc5;
  const add = (v: number | string | boolean) => {
    const s = typeof v === 'number' ? v.toString() : String(v);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    h ^= 0x2c;
    h = Math.imul(h, 0x01000193) >>> 0;
  };
  add(m.frame);
  add(m.phase);
  for (const f of m.fighters) {
    add(f.x); add(f.y); add(f.vx); add(f.vy); add(f.kbx); add(f.kby);
    add(f.percent); add(f.stocks); add(f.state); add(f.sf); add(f.facing);
    add(f.move ? f.move.id + ':' + f.move.frame : '-');
    add(f.shieldHP); add(f.hitlag); add(f.hitstun);
  }
  for (const p of m.projectiles) { add(p.kind); add(p.x); add(p.y); }
  add(m.rng.s);
  return h.toString(16).padStart(8, '0');
}
