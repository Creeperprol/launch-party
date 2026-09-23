import { describe, expect, it } from 'vitest';
import { SHIELD_BREAK_DIZZY, SHIELD_MAX } from '../src/sim/constants';
import { NOVA, SABLE, inp, makeMatch, place, run } from './helpers';

describe('shields', () => {
  it('holding shield drains it and a strong hit on a weak shield breaks it', () => {
    const m = makeMatch([NOVA, NOVA]);
    const [, v] = m.fighters;
    place(m, 0, -60, 0, 1);
    place(m, 1, 0, 0, -1);
    run(m, 30, [undefined, { shield: true }]);
    expect(v.state).toBe('shield');
    expect(v.shieldHP).toBeLessThan(SHIELD_MAX);
    v.shieldHP = 6;
    m.step([inp({ cx: 1 }), inp({ shield: true })]);
    for (let i = 0; i < 30 && v.state !== 'shieldbreak'; i++) m.step([inp(), inp({ shield: true })]);
    expect(v.state).toBe('shieldbreak');
    for (let i = 0; i < 120 && v.state !== 'dizzy'; i++) m.step([inp(), inp()]);
    expect(v.state).toBe('dizzy');
    run(m, SHIELD_BREAK_DIZZY + 2);
    expect(v.state).toBe('idle');
    expect(v.shieldHP).toBeGreaterThan(0);
  });

  it('blocked hits deal damage x1.2 to the shield and no percent', () => {
    const m = makeMatch([NOVA, NOVA]);
    const [, v] = m.fighters;
    place(m, 0, -60, 0, 1);
    place(m, 1, 0, 0, -1);
    run(m, 2, [undefined, { shield: true }]);
    const before = v.shieldHP;
    m.step([inp({ cx: 1 }), inp({ shield: true })]);
    for (let i = 0; i < 30 && v.state !== 'shieldstun'; i++) m.step([inp(), inp({ shield: true })]);
    expect(v.state).toBe('shieldstun');
    expect(v.percent).toBe(0);
    expect(before - v.shieldHP).toBeGreaterThan(16 * 1.2 - 1);
  });

  it("Sable's fully charged thrust breaks a full shield", () => {
    const m = makeMatch([SABLE, NOVA]);
    const [a, v] = m.fighters;
    place(m, 0, -90, 0, 1);
    place(m, 1, 0, 0, -1);
    v.shieldHP = SHIELD_MAX;
    for (let i = 0; i < 75; i++) m.step([inp({ special: true }), inp({ shield: true })]);
    expect(a.move?.id).toBe('nspecial');
    for (let i = 0; i < 20 && v.state !== 'shieldbreak'; i++) m.step([inp(), inp({ shield: true })]);
    expect(v.state).toBe('shieldbreak');
  });
});
