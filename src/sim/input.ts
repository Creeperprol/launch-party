import { BUFFER_FRAMES } from './constants';

/**
 * The one per-frame input struct. Keyboards, gamepads, and CPUs all drive
 * fighters exclusively through this. Stick y is +1 = up.
 */
export interface InputFrame {
  x: number;
  y: number;
  /** Right stick / "C-stick": smash attacks on the ground, aerials in the air. */
  cx: number;
  cy: number;
  jump: boolean;
  attack: boolean;
  special: boolean;
  shield: boolean;
  grab: boolean;
  /** Keyboard smash key. */
  smash: boolean;
  /** Digital source (keyboard, touch): stick flicks aren't possible, so flick-smash is disabled and threshold crossings count as flicks. */
  digital: boolean;
}

export const NEUTRAL: Readonly<InputFrame> = Object.freeze({
  x: 0, y: 0, cx: 0, cy: 0,
  jump: false, attack: false, special: false, shield: false, grab: false, smash: false,
  digital: false,
});

export function neutralInput(): InputFrame {
  return { ...NEUTRAL };
}

export type Btn = 'jump' | 'attack' | 'special' | 'shield' | 'grab' | 'smash';
export const BTNS: readonly Btn[] = ['jump', 'attack', 'special', 'shield', 'grab', 'smash'];

export type Dir4 = 'u' | 'd' | 'l' | 'r';

const NEVER = -100000;

/** Edge detection, buffering, and flick detection on top of raw input frames. */
export class InputState {
  cur: InputFrame = neutralInput();
  prev: InputFrame = neutralInput();
  frame = 0;
  private pressAt: Record<Btn, number> = { jump: NEVER, attack: NEVER, special: NEVER, shield: NEVER, grab: NEVER, smash: NEVER };
  private used: Record<Btn, boolean> = { jump: true, attack: true, special: true, shield: true, grab: true, smash: true };
  private xHist: number[] = [0, 0, 0, 0];
  private yHist: number[] = [0, 0, 0, 0];
  flickXAt = NEVER;
  flickXDir = 0;
  flickYAt = NEVER;
  flickYDir = 0;
  private flickXUsed = true;
  private flickYUsed = true;
  cAt = NEVER;
  cX = 0;
  cY = 0;
  private cUsed = true;
  /** Button presses + stick flicks this frame (grab escape mashing). */
  mash = 0;

  update(inp: InputFrame): void {
    this.prev = this.cur;
    this.cur = { ...inp };
    this.frame++;
    this.mash = 0;
    for (const b of BTNS) {
      if (this.cur[b] && !this.prev[b]) {
        this.pressAt[b] = this.frame;
        this.used[b] = false;
        this.mash++;
      }
    }
    const x = this.cur.x;
    const y = this.cur.y;
    // Digital sources (keys, touch stick) can't physically flick, so crossing the threshold counts.
    const dig = this.cur.digital;
    if (Math.abs(x) >= 0.8 && Math.abs(this.prev.x) < 0.8 && (dig || this.wasNeutral(this.xHist, Math.sign(x)))) {
      this.flickXAt = this.frame;
      this.flickXDir = Math.sign(x);
      this.flickXUsed = false;
      this.mash++;
    }
    if (Math.abs(y) >= 0.8 && Math.abs(this.prev.y) < 0.8 && (dig || this.wasNeutral(this.yHist, Math.sign(y)))) {
      this.flickYAt = this.frame;
      this.flickYDir = Math.sign(y);
      this.flickYUsed = false;
      this.mash++;
    }
    this.xHist.shift();
    this.xHist.push(x);
    this.yHist.shift();
    this.yHist.push(y);
    const cm = Math.hypot(this.cur.cx, this.cur.cy);
    const pm = Math.hypot(this.prev.cx, this.prev.cy);
    if (cm >= 0.6 && pm < 0.6) {
      this.cAt = this.frame;
      if (Math.abs(this.cur.cy) > Math.abs(this.cur.cx)) {
        this.cX = 0;
        this.cY = Math.sign(this.cur.cy);
      } else {
        this.cX = Math.sign(this.cur.cx);
        this.cY = 0;
      }
      this.cUsed = false;
    }
  }

  /** True if the stick sat below 0.3 in the flick direction within the last 3 frames. */
  private wasNeutral(hist: number[], dir: number): boolean {
    for (let i = hist.length - 3; i < hist.length; i++) {
      if (hist[i] * dir < 0.3) return true;
    }
    return false;
  }

  held(b: Btn): boolean {
    return this.cur[b];
  }

  pressed(b: Btn, window = BUFFER_FRAMES): boolean {
    return !this.used[b] && this.frame - this.pressAt[b] < window;
  }

  pressedAgo(b: Btn): number {
    return this.frame - this.pressAt[b];
  }

  consume(b: Btn): void {
    this.used[b] = true;
  }

  /** Horizontal flick direction within the last `window` frames (0 if none). */
  flickX(window = 3): number {
    return !this.flickXUsed && this.frame - this.flickXAt < window ? this.flickXDir : 0;
  }

  flickY(window = 3): number {
    return !this.flickYUsed && this.frame - this.flickYAt < window ? this.flickYDir : 0;
  }

  consumeFlickX(): void {
    this.flickXUsed = true;
  }

  consumeFlickY(): void {
    this.flickYUsed = true;
  }

  cPressed(window = BUFFER_FRAMES): boolean {
    return !this.cUsed && this.frame - this.cAt < window;
  }

  consumeC(): void {
    this.cUsed = true;
  }

  cHeld(): boolean {
    return Math.hypot(this.cur.cx, this.cur.cy) >= 0.5;
  }

  /** Clears all pending presses (used when a fighter respawns or a match starts). */
  clearBuffer(): void {
    for (const b of BTNS) this.used[b] = true;
    this.flickXUsed = true;
    this.flickYUsed = true;
    this.cUsed = true;
  }
}
