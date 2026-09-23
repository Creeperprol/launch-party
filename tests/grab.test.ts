import { describe, expect, it } from 'vitest';
import { GRAB_BASE, GRAB_PER_PERCENT } from '../src/sim/constants';
import { NOVA, inp, makeMatch, place } from './helpers';

function grabAndCount(percent: number, mash: boolean): number {
  const m = makeMatch([NOVA, NOVA]);
  const [a, v] = m.fighters;
  place(m, 0, 0, 0, 1);
  place(m, 1, 40, 0, -1);
  v.percent = percent;
  m.step([inp({ grab: true }), inp()]);
  for (let i = 0; i < 20 && v.state !== 'grabbed'; i++) m.step([inp(), inp()]);
  expect(v.state).toBe('grabbed');
  expect(a.state).toBe('grabhold');
  let frames = 0;
  while (v.state === 'grabbed' && frames < 400) {
    m.step([inp(), inp({ attack: mash && frames % 2 === 0 })]);
    frames++;
  }
  return frames;
}

describe('grabs', () => {
  it('victims break free after 60 + percent x 0.5 frames without mashing', () => {
    expect(Math.abs(grabAndCount(0, false) - GRAB_BASE)).toBeLessThanOrEqual(2);
    expect(Math.abs(grabAndCount(100, false) - (GRAB_BASE + 100 * GRAB_PER_PERCENT))).toBeLessThanOrEqual(2);
  });

  it('mashing escapes sooner', () => {
    expect(grabAndCount(100, true)).toBeLessThan(grabAndCount(100, false) * 0.6);
  });

  it('a throw releases the victim with damage and knockback', () => {
    const m = makeMatch([NOVA, NOVA]);
    const [, v] = m.fighters;
    place(m, 0, 0, 0, 1);
    place(m, 1, 40, 0, -1);
    m.step([inp({ grab: true }), inp()]);
    for (let i = 0; i < 20 && v.state !== 'grabbed'; i++) m.step([inp(), inp()]);
    for (let i = 0; i < 8; i++) m.step([inp(), inp()]);
    m.step([inp({ y: 1, digital: true }), inp()]);
    for (let i = 0; i < 30 && v.stats.taken === 0; i++) m.step([inp(), inp()]);
    expect(v.percent).toBeCloseTo(7, 5);
    for (let i = 0; i < 30; i++) m.step([inp(), inp()]);
    expect(v.y).toBeLessThan(-40);
  });
});
