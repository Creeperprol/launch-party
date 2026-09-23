import type { InputFrame } from '../sim/input';

/** Minimal shape of the Gamepad API object (so the mapping can be tested with plain objects). */
export interface GamepadLike {
  index: number;
  id: string;
  mapping?: string;
  connected?: boolean;
  axes: readonly number[];
  buttons: readonly { pressed: boolean; value: number }[];
}

export const DEADZONE = 0.2;

/** Standard-mapping button indices. */
export const PAD = {
  BOTTOM: 0,
  RIGHT: 1,
  LEFT: 2,
  TOP: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  SELECT: 8,
  START: 9,
  L3: 10,
  R3: 11,
  UP: 12,
  DOWN: 13,
  DLEFT: 14,
  DRIGHT: 15,
} as const;

/** Radial deadzone, rescaled so values just outside the zone start near 0. */
export function deadzone(x: number, y: number, dz = DEADZONE): [number, number] {
  const m = Math.hypot(x, y);
  if (m < dz) return [0, 0];
  const k = Math.min(1, (m - dz) / (1 - dz)) / m;
  return [x * k, y * k];
}

function btn(gp: GamepadLike, i: number): boolean {
  const b = gp.buttons[i];
  return !!b && (b.pressed || b.value > 0.5);
}

/**
 * Map a standard-layout gamepad to the input struct.
 * Left stick moves, right stick = smash/aerial ("C-stick"), bottom face = attack, right face = special,
 * left/top face = jump, bumpers = grab, triggers = shield. Stick y is flipped so +1 = up.
 */
export function mapGamepad(gp: GamepadLike): InputFrame {
  let [x, y] = deadzone(gp.axes[0] ?? 0, -(gp.axes[1] ?? 0));
  const [cx, cy] = deadzone(gp.axes[2] ?? 0, -(gp.axes[3] ?? 0));
  if (x === 0 && y === 0) {
    x = (btn(gp, PAD.DRIGHT) ? 1 : 0) - (btn(gp, PAD.DLEFT) ? 1 : 0);
    y = (btn(gp, PAD.UP) ? 1 : 0) - (btn(gp, PAD.DOWN) ? 1 : 0);
  }
  return {
    x,
    y,
    cx,
    cy,
    attack: btn(gp, PAD.BOTTOM),
    special: btn(gp, PAD.RIGHT),
    jump: btn(gp, PAD.LEFT) || btn(gp, PAD.TOP),
    grab: btn(gp, PAD.LB) || btn(gp, PAD.RB),
    shield: btn(gp, PAD.LT) || btn(gp, PAD.RT),
    smash: false,
    digital: false,
  };
}

export interface MenuPress {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  confirm: boolean;
  back: boolean;
  start: boolean;
}

/** Menu-level reading of a pad (held state; edges are computed by the device manager). */
export function padMenuHeld(gp: GamepadLike): MenuPress {
  const [x, y] = deadzone(gp.axes[0] ?? 0, -(gp.axes[1] ?? 0), 0.5);
  return {
    up: y > 0.5 || btn(gp, PAD.UP),
    down: y < -0.5 || btn(gp, PAD.DOWN),
    left: x < -0.5 || btn(gp, PAD.DLEFT),
    right: x > 0.5 || btn(gp, PAD.DRIGHT),
    confirm: btn(gp, PAD.BOTTOM),
    back: btn(gp, PAD.RIGHT),
    start: btn(gp, PAD.START),
  };
}
