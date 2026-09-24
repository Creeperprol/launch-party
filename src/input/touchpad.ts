import { VIEW_H, VIEW_W } from '../render/camera';
import { mix, rgba } from '../render/color';
import { GLYPH_COLOR, drawGlyph, drawPauseGlyph } from './touchIcons';
import { clamp } from '../sim/math';
import { neutralInput, type InputFrame } from '../sim/input';

/** 'shield' has no blocking stance any more — it just triggers a dodge/roll/tech, same as every other device. */
export type TouchBtn = 'jump' | 'attack' | 'special' | 'shield' | 'smash' | 'grab';

const BTN_KEYS: readonly TouchBtn[] = ['jump', 'attack', 'special', 'shield', 'smash', 'grab'];
const BTN_LABEL: Record<TouchBtn, string> = { jump: 'JUMP', attack: 'ATTACK', special: 'SPECIAL', shield: 'DODGE', smash: 'SMASH', grab: 'GRAB' };
/** Touches left of this line that miss every control become a floating joystick. */
const STICK_ZONE_X = VIEW_W * 0.45;

interface Circle {
  x: number;
  y: number;
  r: number;
}

/** Saved/restorable screen positions for every touch element. */
export interface TouchLayout {
  stick: { x: number; y: number };
  buttons: Record<TouchBtn, { x: number; y: number }>;
  pause: { x: number; y: number };
}

const DEFAULT_LAYOUT: TouchLayout = {
  stick: { x: 190, y: 780 },
  buttons: {
    jump: { x: 1590, y: 700 },
    special: { x: 1710, y: 700 },
    smash: { x: 1830, y: 700 },
    shield: { x: 1560, y: 840 },
    attack: { x: 1710, y: 840 },
    grab: { x: 1860, y: 840 },
  },
  pause: { x: 60, y: 60 },
};

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
  /** When true, dragging any element repositions it instead of pressing it. */
  editMode = false;

  readonly stick: Circle = { x: DEFAULT_LAYOUT.stick.x, y: DEFAULT_LAYOUT.stick.y, r: 100 };
  readonly stickTravel = 78;
  readonly buttons: Record<TouchBtn, Circle> = {
    jump: { ...DEFAULT_LAYOUT.buttons.jump, r: 58 },
    special: { ...DEFAULT_LAYOUT.buttons.special, r: 58 },
    smash: { ...DEFAULT_LAYOUT.buttons.smash, r: 58 },
    shield: { ...DEFAULT_LAYOUT.buttons.shield, r: 54 },
    attack: { ...DEFAULT_LAYOUT.buttons.attack, r: 66 },
    grab: { ...DEFAULT_LAYOUT.buttons.grab, r: 54 },
  };
  readonly pause: Circle = { x: DEFAULT_LAYOUT.pause.x, y: DEFAULT_LAYOUT.pause.y, r: 40 };

  private toLogical: (cx: number, cy: number) => [number, number] = (x, y) => [x, y];
  private stickPointer: number | null = null;
  /** Where the current stick touch is centred (the layout spot, or wherever a floating touch began). */
  private originX = 0;
  private originY = 0;
  private stickX = 0;
  private stickY = 0;
  private drawX = 0;
  private drawY = 0;
  private btnPointer = new Map<TouchBtn, number>();
  private held: Record<TouchBtn, boolean> = { jump: false, attack: false, special: false, shield: false, smash: false, grab: false };
  private pausePointer: number | null = null;
  private pauseTapped = false;
  private pauseHeld = false;
  /** Edit-mode drag: which element + pointer, and the grab offset from its center. */
  private editPointer: number | null = null;
  private editTarget: Circle | null = null;
  private editDX = 0;
  private editDY = 0;

  attach(canvas: HTMLCanvasElement, toLogical: (cx: number, cy: number) => [number, number]): void {
    this.toLogical = toLogical;
    canvas.addEventListener('pointerdown', (e) => this.onDown(e), { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
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

  /** All draggable circles, nearest-hit first is not required — first match wins. */
  private allCircles(): Circle[] {
    return [this.stick, ...BTN_KEYS.map((b) => this.buttons[b]), this.pause];
  }

  private onDown(e: PointerEvent): void {
    if (!this.active) return;
    const [x, y] = this.toLogical(e.clientX, e.clientY);
    if (this.editMode) {
      if (this.editPointer !== null) return;
      for (const c of this.allCircles()) {
        if (this.dist(x, y, c) <= c.r + 16) {
          this.editPointer = e.pointerId;
          this.editTarget = c;
          this.editDX = c.x - x;
          this.editDY = c.y - y;
          e.preventDefault();
          return;
        }
      }
      return;
    }
    if (this.pausePointer === null && this.dist(x, y, this.pause) <= this.pause.r + 16) {
      this.pausePointer = e.pointerId;
      this.pauseHeld = true;
      this.pauseTapped = true;
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
    if (this.stickPointer !== null) return;
    const onStick = this.dist(x, y, this.stick) <= this.stick.r + 40;
    if (onStick || x < STICK_ZONE_X) {
      this.stickPointer = e.pointerId;
      this.originX = onStick ? this.stick.x : x;
      this.originY = onStick ? this.stick.y : y;
      this.updateStick(x, y);
      e.preventDefault();
    }
  }

  private onMove(e: PointerEvent): void {
    if (this.editMode) {
      if (this.editPointer === e.pointerId && this.editTarget) {
        const [x, y] = this.toLogical(e.clientX, e.clientY);
        const c = this.editTarget;
        c.x = clamp(x + this.editDX, c.r, VIEW_W - c.r);
        c.y = clamp(y + this.editDY, c.r, VIEW_H - c.r);
        e.preventDefault();
      }
      return;
    }
    if (this.stickPointer === e.pointerId) {
      const [x, y] = this.toLogical(e.clientX, e.clientY);
      this.updateStick(x, y);
      e.preventDefault();
    }
  }

  private onUp(e: PointerEvent): void {
    if (this.editPointer === e.pointerId) {
      this.editPointer = null;
      this.editTarget = null;
      return;
    }
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

  getLayout(): TouchLayout {
    return {
      stick: { x: this.stick.x, y: this.stick.y },
      buttons: Object.fromEntries(BTN_KEYS.map((b) => [b, { x: this.buttons[b].x, y: this.buttons[b].y }])) as Record<TouchBtn, { x: number; y: number }>,
      pause: { x: this.pause.x, y: this.pause.y },
    };
  }

  setLayout(l: TouchLayout | null): void {
    const layout = l ?? DEFAULT_LAYOUT;
    this.stick.x = layout.stick.x;
    this.stick.y = layout.stick.y;
    for (const b of BTN_KEYS) {
      this.buttons[b].x = layout.buttons[b].x;
      this.buttons[b].y = layout.buttons[b].y;
    }
    this.pause.x = layout.pause.x;
    this.pause.y = layout.pause.y;
  }

  resetLayout(): void {
    this.setLayout(null);
  }

  private updateStick(x: number, y: number): void {
    let dx = x - this.originX;
    let dy = y - this.originY;
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
    if (!this.active || this.editMode) return neutralInput();
    return {
      x: this.stickX, y: this.stickY, cx: 0, cy: 0,
      jump: this.held.jump, attack: this.held.attack, special: this.held.special,
      shield: this.held.shield, grab: this.held.grab, smash: this.held.smash,
      digital: true,
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    ctx.save();
    if (this.editMode) {
      ctx.setLineDash([10, 8]);
      ctx.shadowColor = 'rgba(255,224,102,0.8)';
      ctx.shadowBlur = 14;
    }
    // joystick (follows a floating touch while held)
    const stickActive = this.stickPointer !== null;
    const sx = stickActive ? this.originX : this.stick.x;
    const sy = stickActive ? this.originY : this.stick.y;
    ctx.fillStyle = 'rgba(20,16,40,0.38)';
    ctx.strokeStyle = this.editTarget === this.stick ? '#ffe066' : 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(sx, sy, this.stick.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // direction marks on the ring
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      const cx = sx + Math.cos(a) * (this.stick.r - 16);
      const cy = sy + Math.sin(a) * (this.stick.r - 16);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8);
      ctx.lineTo(cx + Math.cos(a + 2.3) * 8, cy + Math.sin(a + 2.3) * 8);
      ctx.lineTo(cx + Math.cos(a - 2.3) * 8, cy + Math.sin(a - 2.3) * 8);
      ctx.fill();
    }
    ctx.fillStyle = stickActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(sx + this.drawX, sy + this.drawY, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,11,31,0.7)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // buttons: colour-coded face buttons with a glyph and a small caption
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const b of BTN_KEYS) {
      const c = this.buttons[b];
      const pressed = this.held[b];
      const dragging = this.editTarget === c;
      const col = GLYPH_COLOR[b];
      const r = pressed ? c.r * 0.93 : c.r;
      ctx.fillStyle = pressed ? col : rgba(col, 0.32);
      ctx.strokeStyle = dragging ? '#ffe066' : pressed ? '#ffffff' : rgba(col, 0.95);
      ctx.lineWidth = pressed ? 5 : 4;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const fg = pressed ? '#15111f' : '#ffffff';
      drawGlyph(ctx, b, c.x, c.y - r * 0.14, r * 0.36, fg, pressed ? col : mix(col, '#15111f', 0.55));
      ctx.font = `800 ${Math.round(r * 0.22)}px "Avenir Next", "Futura", "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = pressed ? '#15111f' : 'rgba(255,255,255,0.9)';
      ctx.fillText(BTN_LABEL[b], c.x, c.y + r * 0.58);
    }
    // pause
    ctx.fillStyle = this.pauseHeld ? 'rgba(255,224,102,0.85)' : 'rgba(20,16,40,0.5)';
    ctx.strokeStyle = this.editTarget === this.pause ? '#ffe066' : 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.pause.x, this.pause.y, this.pause.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawPauseGlyph(ctx, this.pause.x, this.pause.y, 13, this.pauseHeld ? '#15111f' : 'rgba(255,255,255,0.9)');
    ctx.restore();
  }
}
