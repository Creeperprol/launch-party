import { clamp } from '../sim/math';
import { neutralInput, type InputFrame } from '../sim/input';

export type TouchBtn = 'jump' | 'attack' | 'special' | 'shield' | 'grab' | 'smash';

const BTN_KEYS: readonly TouchBtn[] = ['jump', 'attack', 'special', 'shield', 'grab', 'smash'];
const BTN_LABEL: Record<TouchBtn, string> = { jump: 'JUMP', attack: 'ATK', special: 'SPC', shield: 'SH', grab: 'GR', smash: 'SM' };

interface Circle {
  x: number;
  y: number;
  r: number;
}

/** True on phones/tablets and any browser reporting touch support. */
export function isTouchCapable(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
}

/**
 * On-screen virtual joystick + action buttons + pause, driving one player exactly like
 * a keyboard or gamepad: it only ever produces an InputFrame, never touches the simulation.
 * Inactive (and non-capturing) unless a match explicitly turns it on.
 */
export class TouchPad {
  active = false;

  readonly stick: Circle = { x: 190, y: 780, r: 100 };
  readonly stickTravel = 78;
  readonly buttons: Record<TouchBtn, Circle> = {
    jump: { x: 1590, y: 700, r: 58 },
    special: { x: 1710, y: 700, r: 58 },
    smash: { x: 1830, y: 700, r: 58 },
    shield: { x: 1590, y: 830, r: 58 },
    attack: { x: 1710, y: 830, r: 64 },
    grab: { x: 1850, y: 830, r: 58 },
  };
  readonly pause: Circle = { x: 60, y: 60, r: 40 };

  private toLogical: (cx: number, cy: number) => [number, number] = (x, y) => [x, y];
  private stickPointer: number | null = null;
  private stickX = 0;
  private stickY = 0;
  private drawX = 0;
  private drawY = 0;
  private btnPointer = new Map<TouchBtn, number>();
  private held: Record<TouchBtn, boolean> = { jump: false, attack: false, special: false, shield: false, grab: false, smash: false };
  private pausePointer: number | null = null;
  private pauseTapped = false;
  private pauseHeld = false;

  attach(canvas: HTMLCanvasElement, toLogical: (cx: number, cy: number) => [number, number]): void {
    this.toLogical = toLogical;
    canvas.addEventListener('pointerdown', (e) => this.onDown(e), { passive: false });
    window.addEventListener('pointermove', (e) => this.onMove(e), { passive: false });
    window.addEventListener('pointerup', (e) => this.onUp(e));
    window.addEventListener('pointercancel', (e) => this.onUp(e));
  }

  setActive(v: boolean): void {
    if (this.active === v) return;
    this.active = v;
    if (!v) this.reset();
  }

  private reset(): void {
    this.stickPointer = null;
    this.stickX = 0;
    this.stickY = 0;
    this.drawX = 0;
    this.drawY = 0;
    this.btnPointer.clear();
    for (const b of BTN_KEYS) this.held[b] = false;
    this.pausePointer = null;
    this.pauseHeld = false;
  }

  private dist(x: number, y: number, c: Circle): number {
    return Math.hypot(x - c.x, y - c.y);
  }

  private onDown(e: PointerEvent): void {
    if (!this.active) return;
    const [x, y] = this.toLogical(e.clientX, e.clientY);
    if (this.stickPointer === null && this.dist(x, y, this.stick) <= this.stick.r + 40) {
      this.stickPointer = e.pointerId;
      this.updateStick(x, y);
      e.preventDefault();
      return;
    }
    for (const b of BTN_KEYS) {
      if (this.btnPointer.has(b)) continue;
      const c = this.buttons[b];
      if (this.dist(x, y, c) <= c.r + 16) {
        this.btnPointer.set(b, e.pointerId);
        this.held[b] = true;
        e.preventDefault();
        return;
      }
    }
    if (this.pausePointer === null && this.dist(x, y, this.pause) <= this.pause.r + 16) {
      this.pausePointer = e.pointerId;
      this.pauseHeld = true;
      this.pauseTapped = true;
      e.preventDefault();
    }
  }

  private onMove(e: PointerEvent): void {
    if (this.stickPointer === e.pointerId) {
      const [x, y] = this.toLogical(e.clientX, e.clientY);
      this.updateStick(x, y);
      e.preventDefault();
    }
  }

  private onUp(e: PointerEvent): void {
    if (this.stickPointer === e.pointerId) {
      this.stickPointer = null;
      this.stickX = 0;
      this.stickY = 0;
      this.drawX = 0;
      this.drawY = 0;
    }
    for (const b of BTN_KEYS) {
      if (this.btnPointer.get(b) === e.pointerId) {
        this.btnPointer.delete(b);
        this.held[b] = false;
      }
    }
    if (this.pausePointer === e.pointerId) {
      this.pausePointer = null;
      this.pauseHeld = false;
    }
  }

  private updateStick(x: number, y: number): void {
    let dx = x - this.stick.x;
    let dy = y - this.stick.y;
    const d = Math.hypot(dx, dy);
    const dz = 8;
    if (d < dz) {
      this.stickX = 0;
      this.stickY = 0;
      this.drawX = 0;
      this.drawY = 0;
      return;
    }
    const clamped = Math.min(d, this.stickTravel);
    dx = (dx / d) * clamped;
    dy = (dy / d) * clamped;
    this.drawX = dx;
    this.drawY = dy;
    // stick y is +1 = up; screen y grows downward, so flip
    this.stickX = clamp(dx / this.stickTravel, -1, 1);
    this.stickY = clamp(-dy / this.stickTravel, -1, 1);
  }

  /** Read-and-clear: true if the pause button was tapped since the last read. */
  consumePause(): boolean {
    const v = this.pauseTapped;
    this.pauseTapped = false;
    return v;
  }

  frame(): InputFrame {
    if (!this.active) return neutralInput();
    return {
      x: this.stickX, y: this.stickY, cx: 0, cy: 0,
      jump: this.held.jump, attack: this.held.attack, special: this.held.special,
      shield: this.held.shield, grab: this.held.grab, smash: this.held.smash,
      digital: false,
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    ctx.save();
    // joystick
    ctx.fillStyle = 'rgba(20,16,40,0.38)';
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.stick.x, this.stick.y, this.stick.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const active = this.stickPointer !== null;
    ctx.fillStyle = active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(this.stick.x + this.drawX, this.stick.y + this.drawY, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,11,31,0.7)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // buttons
    ctx.font = '800 22px "Avenir Next", "Futura", "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const b of BTN_KEYS) {
      const c = this.buttons[b];
      const pressed = this.held[b];
      ctx.fillStyle = pressed ? 'rgba(255,224,102,0.85)' : 'rgba(20,16,40,0.42)';
      ctx.strokeStyle = pressed ? 'rgba(20,16,40,0.9)' : 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = pressed ? '#15111f' : 'rgba(255,255,255,0.85)';
      ctx.fillText(BTN_LABEL[b], c.x, c.y + 1);
    }
    // pause
    ctx.fillStyle = this.pauseHeld ? 'rgba(255,224,102,0.85)' : 'rgba(20,16,40,0.5)';
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.pause.x, this.pause.y, this.pause.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = this.pauseHeld ? '#15111f' : 'rgba(255,255,255,0.85)';
    ctx.fillRect(this.pause.x - 9, this.pause.y - 12, 6, 24);
    ctx.fillRect(this.pause.x + 3, this.pause.y - 12, 6, 24);
    ctx.restore();
  }
}
