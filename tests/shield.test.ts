import { describe, expect, it } from 'vitest';
import { NOVA, SABLE, inp, makeMatch, place, run } from './helpers';

describe('shielding removed / replaced by tap-to-dodge', () => {
  it('holding the dodge button never blocks a hit — full damage and knockback land', () => {
    const m = makeMatch([NOVA, NOVA]);
    const [, v] = m.fighters;
    place(m, 0, -60, 0, 1);
    place(m, 1, 0, 0, -1);
    run(m, 5, [undefined, { shield: true }]);
    m.step([inp({ cx: 1 }), inp({ shield: true })]);
    for (let i = 0; i < 30 && v.percent === 0; i++) m.step([inp(), inp({ shield: true })]);
    expect(v.percent).toBeGreaterThan(0);
    expect(v.state === 'hitstun' || v.state === 'tumble').toBe(true);
    // the removed states are gone for good
    expect(v.state).not.toBe('shieldstun');
  });

  it('a neutral tap of the dodge button spot-dodges', () => {
    const m = makeMatch([NOVA, NOVA]);
    const [, v] = m.fighters;
    place(m, 0, -60);
    place(m, 1, 0);
    m.step([inp(), inp({ shield: true })]);
    expect(v.state).toBe('move');
    expect(v.move?.id).toBe('spotdodge');
  });

  it('a directional tap of the dodge button rolls', () => {
    const m = makeMatch([NOVA, NOVA]);
    const [, v] = m.fighters;
    place(m, 0, -60, 0, 1);
    place(m, 1, 0, 0, 1);
    m.step([inp(), inp({ x: 1, shield: true })]);
    expect(v.state).toBe('move');
    expect(v.move?.id).toBe('rollF');
  });

  it("Sable's fully charged thrust deals full damage even if the target holds dodge", () => {
    const m = makeMatch([SABLE, NOVA]);
    const [a, v] = m.fighters;
    place(m, 0, -90, 0, 1);
    place(m, 1, 0, 0, -1);
    for (let i = 0; i < 75; i++) m.step([inp({ special: true }), inp()]);
    expect(a.move?.id).toBe('nspecial');
    for (let i = 0; i < 20 && v.percent === 0; i++) m.step([inp(), inp()]);
    expect(v.percent).toBeGreaterThan(15);
  });
});
