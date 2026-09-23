import { describe, expect, it } from 'vitest';
import { LAUNCH_SCALE } from '../src/sim/constants';
import { DEG } from '../src/sim/math';
import { applyDI, hitlagFrames, hitstunFrames, knockback } from '../src/sim/knockback';
import { NOVA, inp, makeMatch, place, run } from './helpers';

describe('knockback formula', () => {
  it('matches hand-computed values', () => {
    // ((5 + 25) * 1 * 1.4 + 18) * 1 + 20 = 80
    expect(knockback(50, 10, 100, 100, 20)).toBeCloseTo(80, 6);
    // p=120, d=16, w=135, KBG=95, BKB=30: ((12 + 96) * 200/235 * 1.4 + 18) * 0.95 + 30 = 169.3468
    expect(knockback(120, 16, 135, 95, 30)).toBeCloseTo(169.3468, 3);
    // 0% hit: only the +18 term and BKB remain: 18 * 0.5 + 10 = 19
    expect(knockback(0, 5, 75, 50, 10)).toBeCloseTo(19, 6);
  });

  it('heavier fighters take less knockback', () => {
    expect(knockback(100, 12, 135, 100, 30)).toBeLessThan(knockback(100, 12, 100, 100, 30));
    expect(knockback(100, 12, 75, 100, 30)).toBeGreaterThan(knockback(100, 12, 100, 100, 30));
  });
});

describe('hitlag, hitstun, DI', () => {
  it('hitlag = floor((d*0.65 + 6) * mult), capped at 20', () => {
    expect(hitlagFrames(10)).toBe(12);
    expect(hitlagFrames(4, 0.5)).toBe(4);
    expect(hitlagFrames(30)).toBe(20);
  });

  it('hitstun = floor(KB * 0.4)', () => {
    expect(hitstunFrames(100)).toBe(40);
    expect(hitstunFrames(79.9)).toBe(31);
  });

  it('DI rotates up to 15 degrees toward the perpendicular held direction', () => {
    expect(applyDI(0, 0, 1) / DEG).toBeCloseTo(15, 6);
    expect(applyDI(90 * DEG, 1, 0) / DEG).toBeCloseTo(75, 6);
    expect(applyDI(40 * DEG, Math.cos(40 * DEG), Math.sin(40 * DEG)) / DEG).toBeCloseTo(40, 6);
    expect(applyDI(40 * DEG, 0.1, 0.1) / DEG).toBeCloseTo(40, 6);
  });

  it('a connecting hit freezes both fighters and applies hitstun from the formula', () => {
    const m = makeMatch([NOVA, NOVA]);
    const [a, v] = m.fighters;
    place(m, 0, 0, 0, 1);
    place(m, 1, 45, 0, -1);
    // keyboard forward tilt (digital input: no flick-smash)
    m.step([inp({ attack: true, x: 1, digital: true }), inp()]);
    let guard = 0;
    while (v.stats.taken === 0 && guard++ < 30) m.step([inp({ x: 1, digital: true }), inp()]);
    expect(a.move?.id).toBe('ftilt');
    expect(v.percent).toBeCloseTo(8, 6);
    const kb = knockback(8, 8, 100, 100, 10);
    expect(v.hitlag).toBe(hitlagFrames(8));
    expect(a.hitlag).toBe(hitlagFrames(8));
    expect(v.hitstun).toBe(hitstunFrames(kb));
    expect(v.pendingLaunch?.speed).toBeCloseTo(kb * LAUNCH_SCALE, 6);
    // After hitlag the launch is applied and the victim moves away from the attacker.
    run(m, hitlagFrames(8) + 3);
    expect(v.x).toBeGreaterThan(45);
  });
});
