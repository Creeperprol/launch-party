import { describe, expect, it } from 'vitest';
import { GROTT, NOVA, ZIP } from './helpers';
import { lowestKOPercent } from './calib';

describe('knockback calibration (Stage 1 centre, uncharged forward smash, no DI)', () => {
  it("the all-rounder's forward smash KOs a middleweight between 100% and 140%", () => {
    const mid = lowestKOPercent(NOVA, NOVA);
    expect(mid).toBeGreaterThanOrEqual(100);
    expect(mid).toBeLessThanOrEqual(140);
  });

  it('the heavyweight survives longer and the lightweight dies earlier', () => {
    const mid = lowestKOPercent(NOVA, NOVA);
    expect(lowestKOPercent(NOVA, GROTT)).toBeGreaterThan(mid);
    expect(lowestKOPercent(NOVA, ZIP)).toBeLessThan(mid);
  });
});
