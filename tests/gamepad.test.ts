import { describe, expect, it } from 'vitest';
import { DEADZONE, PAD, mapGamepad, padMenuHeld, type GamepadLike } from '../src/input/gamepad';

function pad(axes: number[], pressed: number[] = []): GamepadLike {
  const buttons = Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i), value: pressed.includes(i) ? 1 : 0 }));
  return { index: 0, id: 'Mock Standard Gamepad', mapping: 'standard', connected: true, axes, buttons };
}

describe('gamepad mapping (standard layout)', () => {
  it('maps sticks with y flipped so up = +1, and applies the deadzone', () => {
    const f = mapGamepad(pad([1, -1, 0, 0]));
    expect(f.x).toBeGreaterThan(0.6);
    expect(f.y).toBeGreaterThan(0.6);
    const idle = mapGamepad(pad([DEADZONE * 0.6, 0.1, 0.1, -0.1]));
    expect(idle.x).toBe(0);
    expect(idle.y).toBe(0);
    expect(idle.cx).toBe(0);
    const c = mapGamepad(pad([0, 0, 0, 1]));
    expect(c.cy).toBeLessThan(-0.9);
    expect(f.digital).toBe(false);
  });

  it('maps face buttons, bumpers, and triggers', () => {
    expect(mapGamepad(pad([0, 0, 0, 0], [PAD.BOTTOM])).attack).toBe(true);
    expect(mapGamepad(pad([0, 0, 0, 0], [PAD.RIGHT])).special).toBe(true);
    expect(mapGamepad(pad([0, 0, 0, 0], [PAD.LEFT])).jump).toBe(true);
    expect(mapGamepad(pad([0, 0, 0, 0], [PAD.TOP])).jump).toBe(true);
    expect(mapGamepad(pad([0, 0, 0, 0], [PAD.LB])).grab).toBe(true);
    expect(mapGamepad(pad([0, 0, 0, 0], [PAD.RB])).grab).toBe(true);
    expect(mapGamepad(pad([0, 0, 0, 0], [PAD.LT])).shield).toBe(true);
    expect(mapGamepad(pad([0, 0, 0, 0], [PAD.RT])).shield).toBe(true);
    const none = mapGamepad(pad([0, 0, 0, 0]));
    expect(none.attack || none.special || none.jump || none.grab || none.shield || none.smash).toBe(false);
  });

  it('uses the d-pad as digital movement when the stick is neutral', () => {
    const f = mapGamepad(pad([0, 0, 0, 0], [PAD.DLEFT, PAD.UP]));
    expect(f.x).toBe(-1);
    expect(f.y).toBe(1);
  });

  it('reads menu directions and Start', () => {
    const m = padMenuHeld(pad([0, 1, 0, 0], [PAD.START, PAD.BOTTOM]));
    expect(m.down).toBe(true);
    expect(m.start).toBe(true);
    expect(m.confirm).toBe(true);
    expect(m.back).toBe(false);
  });
});
