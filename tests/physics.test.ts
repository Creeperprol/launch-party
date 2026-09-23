import { describe, expect, it } from 'vitest';
import { overlapsMain } from '../src/sim/physics';
import { GROTT, NOVA, ZIP, inp, makeMatch, place, run } from './helpers';

describe('soft platforms', () => {
  it('a fighter can stand on a platform and drop through it by holding down', () => {
    const m = makeMatch([NOVA, NOVA]);
    const f = m.fighters[0];
    place(m, 0, -230, -170, 1);
    place(m, 1, 400, 0, -1);
    run(m, 20);
    expect(f.grounded).toBe(true);
    expect(f.groundId).toBe(0);
    expect(f.y).toBe(-170);
    run(m, 8, [{ y: -1, digital: true }]);
    expect(f.grounded).toBe(false);
    expect(f.y).toBeGreaterThan(-170);
    run(m, 60);
    expect(f.grounded).toBe(true);
    expect(f.groundId).toBe(-1);
    expect(f.y).toBe(0);
  });

  it('jumping from below passes through and lands on top', () => {
    const m = makeMatch([NOVA, NOVA]);
    const f = m.fighters[0];
    place(m, 0, -230, 0, 1);
    place(m, 1, 400, 0, -1);
    m.step([inp({ jump: true }), inp()]);
    run(m, 20, [{ jump: true }]);
    run(m, 60);
    expect(f.grounded).toBe(true);
    expect(f.groundId).toBe(0);
    expect(f.y).toBe(-170);
  });
});

describe('swept collision', () => {
  it('fast launches never tunnel into or through the stage', () => {
    for (const def of [NOVA, GROTT, ZIP]) {
      for (let deg = 180; deg <= 360; deg += 15) {
        for (const speed of [40, 90, 160]) {
          const m = makeMatch([def, NOVA]);
          const f = m.fighters[0];
          const M = m.stage.main;
          place(m, 1, 0, 0, -1);
          const a = (deg * Math.PI) / 180;
          // start 320u away from the stage centre-top along the reverse of the launch direction
          f.x = -Math.cos(a) * 320;
          f.y = M.top + Math.sin(a) * 320 - 40;
          f.grounded = false;
          f.groundId = -1;
          f.enter('tumble');
          f.hitstun = 60;
          f.kbx = Math.cos(a) * speed;
          f.kby = -Math.sin(a) * speed;
          for (let i = 0; i < 40; i++) {
            m.step([inp(), inp()]);
            const inside = overlapsMain(f, m.stage, f.x, f.y);
            expect(inside, `${def.id} ${deg}° ${speed}u/f frame ${i}: (${f.x.toFixed(1)}, ${f.y.toFixed(1)})`).toBe(false);
            const below = f.y - f.H > M.bottom && f.x > M.x1 && f.x < M.x2;
            expect(below, `${def.id} ${deg}° ${speed}u/f passed under the stage`).toBe(false);
          }
        }
      }
    }
  });

  it('walls stop horizontal launches into the side of the stage', () => {
    const m = makeMatch([NOVA, NOVA]);
    const f = m.fighters[0];
    const M = m.stage.main;
    place(m, 1, 0, 0, 1);
    f.x = M.x1 - 300;
    f.y = 120;
    f.grounded = false;
    f.enter('tumble');
    f.hitstun = 30;
    f.kbx = 120;
    f.kby = 0;
    run(m, 10);
    expect(overlapsMain(f, m.stage, f.x, f.y)).toBe(false);
    expect(f.x).toBeLessThan(M.x1);
  });
});
