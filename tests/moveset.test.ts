import { describe, expect, it } from 'vitest';
import { REQUIRED_MOVES } from '../src/sim/defs';
import { FIGHTERS } from './helpers';

describe('movesets', () => {
  for (const f of FIGHTERS) {
    it(`${f.name} defines every required move with something that connects`, () => {
      for (const id of REQUIRED_MOVES) {
        const d = f.moves[id];
        expect(d, `${f.id}.${id} missing`).toBeDefined();
        const connects = d.hitboxes.length > 0 || !!d.projectiles?.length || !!d.grab || !!d.throwDef || !!d.pummel || !!d.counter || !!d.reflect;
        expect(connects, `${f.id}.${id} has no hitbox/projectile/grab/throw/counter`).toBe(true);
        expect(d.id).toBe(id);
      }
    });

    it(`${f.name} move references resolve`, () => {
      for (const d of Object.values(f.moves)) {
        if (d.next) expect(f.moves[d.next.id], `${f.id}.${d.id} -> ${d.next.id}`).toBeDefined();
        if (d.counter) expect(f.moves[d.counter.next]?.hitboxes.length).toBeGreaterThan(0);
        if (d.grab?.command) expect(f.moves[d.grab.command]?.throwDef).toBeDefined();
        for (const h of d.hitboxes) {
          expect(h.from).toBeLessThanOrEqual(h.to);
          expect(h.to).toBeLessThanOrEqual(d.total);
          if (d.charge) expect(h.from, `${f.id}.${d.id} hitbox active during charge`).toBeGreaterThan(d.charge.frame);
        }
      }
    });
  }

  it('the swordfighter blade is disjointed and has a stronger tip', () => {
    const sable = FIGHTERS.find((f) => f.id === 'sable')!;
    const ft = sable.moves.ftilt.hitboxes;
    const tip = ft.find((h) => h.at === 'blade' && h.t === 1)!;
    const mid = ft.find((h) => h.at === 'blade' && h.t !== 1)!;
    expect(tip.dmg).toBeGreaterThan(mid.dmg);
    expect(ft.indexOf(tip)).toBe(0);
  });
});
