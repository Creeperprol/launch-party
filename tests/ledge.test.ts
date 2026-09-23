import { describe, expect, it } from 'vitest';
import { LEDGE_INTANGIBLE, LEDGE_MAX_HANG } from '../src/sim/constants';
import { NOVA, makeMatch, place, run } from './helpers';

function dropNearRightLedge(m: ReturnType<typeof makeMatch>, i: number): void {
  const f = m.fighters[i];
  const L = m.stage.ledges[1];
  f.x = L.x + 40;
  f.y = L.y + 60;
  f.vx = 0;
  f.vy = 2;
  f.grounded = false;
  f.groundId = -1;
  f.enter('air');
}

describe('ledges', () => {
  it('a falling fighter next to the ledge grabs it with intangibility', () => {
    const m = makeMatch([NOVA, NOVA]);
    place(m, 1, -300, 0, 1);
    dropNearRightLedge(m, 0);
    run(m, 1);
    const f = m.fighters[0];
    expect(f.state).toBe('ledge');
    expect(m.stage.ledges[1].occupant).toBe(0);
    expect(f.facing).toBe(-1);
    expect(f.intangible).toBeGreaterThanOrEqual(LEDGE_INTANGIBLE - 1);
  });

  it('a second fighter grabbing an occupied ledge pops the first off', () => {
    const m = makeMatch([NOVA, NOVA]);
    dropNearRightLedge(m, 0);
    run(m, 1);
    expect(m.fighters[0].state).toBe('ledge');
    dropNearRightLedge(m, 1);
    run(m, 1);
    expect(m.fighters[1].state).toBe('ledge');
    expect(m.stage.ledges[1].occupant).toBe(1);
    expect(m.fighters[0].state).toBe('air');
    expect(m.fighters[0].ledgeCooldown).toBeGreaterThan(0);
  });

  it('regrabbing without touching the ground gives no new intangibility', () => {
    const m = makeMatch([NOVA, NOVA]);
    place(m, 1, -300, 0, 1);
    dropNearRightLedge(m, 0);
    run(m, 1);
    const f = m.fighters[0];
    run(m, LEDGE_INTANGIBLE + 5);
    expect(f.intangible).toBe(0);
    // drop (hold away), wait out the regrab cooldown, fall back onto it
    run(m, 2, [{ x: 1, digital: true }]);
    expect(f.state).toBe('air');
    run(m, 40);
    dropNearRightLedge(m, 0);
    run(m, 1);
    expect(f.state).toBe('ledge');
    expect(f.intangible).toBe(0);
  });

  it('hanging too long drops the fighter', () => {
    const m = makeMatch([NOVA, NOVA]);
    place(m, 1, -300, 0, 1);
    dropNearRightLedge(m, 0);
    run(m, 1);
    run(m, LEDGE_MAX_HANG + 2);
    expect(m.fighters[0].state).not.toBe('ledge');
    expect(m.stage.ledges[1].occupant).toBe(-1);
  });

  it('climbing up puts the fighter on the stage', () => {
    const m = makeMatch([NOVA, NOVA]);
    place(m, 1, -300, 0, 1);
    dropNearRightLedge(m, 0);
    run(m, 1);
    run(m, 10);
    run(m, 1, [{ x: -1, digital: true }]);
    run(m, 40);
    const f = m.fighters[0];
    expect(f.grounded).toBe(true);
    expect(f.y).toBe(0);
    expect(f.x).toBeLessThan(m.stage.main.x2);
  });
});
