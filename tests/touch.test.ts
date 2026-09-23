import { describe, expect, it } from 'vitest';
import { NOVA, inp, makeMatch, place, run } from './helpers';

/** Push the stick from neutral to (x, y) over `frames` frames, like a thumb dragging a touch stick. */
function ramp(m: ReturnType<typeof makeMatch>, x: number, y: number, frames: number, digital: boolean): void {
  for (let k = 1; k <= frames; k++) {
    const t = k / frames;
    m.step([inp({ x: x * t, y: y * t, digital }), inp()]);
  }
}

describe('touch stick (slow drags)', () => {
  it('a gradual push to full dashes into a run', () => {
    const m = makeMatch([NOVA, NOVA]);
    place(m, 0, -200);
    place(m, 1, 400);
    ramp(m, 1, 0, 10, true);
    run(m, 20, [{ x: 1, digital: true }]);
    expect(m.fighters[0].state).toBe('run');
    expect(Math.abs(m.fighters[0].vx)).toBeGreaterThan(NOVA.walkSpeed);
  });

  it('the same slow push from an analog stick still only walks', () => {
    const m = makeMatch([NOVA, NOVA]);
    place(m, 0, -200);
    place(m, 1, 400);
    ramp(m, 1, 0, 10, false);
    run(m, 20, [{ x: 1 }]);
    expect(m.fighters[0].state).toBe('walk');
  });

  it('a gradual push down at the top of a jump fast-falls', () => {
    const m = makeMatch([NOVA, NOVA]);
    place(m, 0, -200);
    place(m, 1, 400);
    run(m, 1, [{ jump: true, digital: true }]);
    run(m, 6, [{ digital: true }]);
    expect(m.fighters[0].grounded).toBe(false);
    let f = 0;
    while (m.fighters[0].vy < 0 && f++ < 120) run(m, 1, [{ digital: true }]);
    ramp(m, 0, -1, 8, true);
    expect(m.fighters[0].fastFalling).toBe(true);
  });
});
