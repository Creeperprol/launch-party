import { describe, expect, it } from 'vitest';
import { NOVA, inp, makeMatch, place, run } from './helpers';

describe('blast zones and KO credit', () => {
  it('crossing a side blast zone with no attacker is a self-destruct', () => {
    const m = makeMatch([NOVA, NOVA]);
    const f = m.fighters[0];
    place(m, 1, 0, 0, 1);
    f.x = m.stage.blast.right + 10;
    f.y = 0;
    f.grounded = false;
    f.enter('air');
    run(m, 1);
    expect(f.stocks).toBe(2);
    expect(f.state).toBe('dead');
    expect(f.stats.falls).toBe(1);
    expect(f.stats.sds).toBe(1);
    expect(m.fighters[1].stats.kos).toBe(0);
  });

  it('the last attacker gets the KO credit', () => {
    const m = makeMatch([NOVA, NOVA]);
    const [a, v] = m.fighters;
    place(m, 0, 400, 0, 1);
    place(m, 1, 465, 0, -1);
    v.percent = 400;
    m.step([inp({ cx: 1 }), inp()]);
    for (let i = 0; i < 300 && v.stocks === 3; i++) m.step([inp(), inp()]);
    expect(v.stocks).toBe(2);
    expect(a.stats.kos).toBe(1);
    expect(v.stats.sds).toBe(0);
  });

  it('credit resets once the victim is back on the ground and actionable', () => {
    const m = makeMatch([NOVA, NOVA]);
    const [, v] = m.fighters;
    place(m, 0, -300, 0, 1);
    place(m, 1, 0, 0, 1);
    v.lastHitBy = 0;
    run(m, 2);
    expect(v.lastHitBy).toBe(-1);
    // walking off now is a self-destruct
    for (let i = 0; i < 400 && v.stocks === 3; i++) m.step([inp(), inp({ x: 1, digital: true })]);
    expect(v.stats.sds).toBe(1);
  });

  it('top blast zone only KOs fighters in hitstun', () => {
    const m = makeMatch([NOVA, NOVA]);
    const f = m.fighters[0];
    place(m, 1, 0, 0, 1);
    f.x = 0;
    f.y = m.stage.blast.top - 50;
    f.grounded = false;
    f.enter('air');
    run(m, 1);
    expect(f.stocks).toBe(3);
    f.y = m.stage.blast.top - 50;
    f.enter('tumble');
    f.hitstun = 20;
    run(m, 1);
    expect(f.stocks).toBe(2);
  });

  it('losing the last stock ends the match with placements', () => {
    const m = makeMatch([NOVA, NOVA, NOVA], undefined, { stocks: 1 });
    place(m, 2, 0, 0, 1);
    m.fighters[0].x = m.stage.blast.left - 10;
    m.fighters[0].grounded = false;
    run(m, 1);
    expect(m.phase).toBe('play');
    m.fighters[1].x = m.stage.blast.right + 10;
    m.fighters[1].grounded = false;
    run(m, 1);
    expect(m.phase).toBe('ended');
    expect(m.winner).toBe(2);
    expect(m.placements).toEqual([2, 1, 0]);
  });

  it('respawns on the revival platform after a KO', () => {
    const m = makeMatch([NOVA, NOVA]);
    const f = m.fighters[0];
    f.x = m.stage.blast.left - 10;
    f.grounded = false;
    run(m, 1);
    run(m, 95);
    expect(f.state).toBe('respawn');
    expect(f.percent).toBe(0);
    expect(f.canBeHit()).toBe(false);
  });
});
