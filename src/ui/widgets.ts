import { VIEW_H, VIEW_W } from '../render/camera';
import { INK, PLAYER_COLORS, mix, rgba } from '../render/color';
import { FONT_DISPLAY, FONT_UI } from '../render/hud';

/** Shared menu drawing: slanted blocks, type, key caps, focus rings, animated backdrop. */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const SKEW = 0.18;

export function inRect(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function slabPath(ctx: CanvasRenderingContext2D, r: Rect, skew = SKEW): void {
  const k = r.h * skew;
  ctx.beginPath();
  ctx.moveTo(r.x + k, r.y);
  ctx.lineTo(r.x + r.w, r.y);
  ctx.lineTo(r.x + r.w - k, r.y + r.h);
  ctx.lineTo(r.x, r.y + r.h);
  ctx.closePath();
}

/** Slanted block with ink outline and a hard drop shadow. */
export function slab(ctx: CanvasRenderingContext2D, r: Rect, fill: string | CanvasGradient, o: { skew?: number; outline?: number; shadow?: number } = {}): void {
  const skew = o.skew ?? SKEW;
  const out = o.outline ?? 6;
  const sh = o.shadow ?? 8;
  if (sh > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    slabPath(ctx, { x: r.x + sh, y: r.y + sh, w: r.w, h: r.h }, skew);
    ctx.fill();
  }
  if (out > 0) {
    ctx.fillStyle = INK;
    slabPath(ctx, { x: r.x - out, y: r.y - out, w: r.w + out * 2, h: r.h + out * 2 }, skew);
    ctx.fill();
  }
  ctx.fillStyle = fill;
  slabPath(ctx, r, skew);
  ctx.fill();
}

export type Face = 'display' | 'ui';

export function font(size: number, face: Face = 'display', weight = 900): string {
  return face === 'display' ? `italic ${weight} ${size}px ${FONT_DISPLAY}` : `${weight} ${size}px ${FONT_UI}`;
}

/** Outlined display text (sticker style). */
export function label(
  ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number,
  o: { color?: string; face?: Face; weight?: number; align?: CanvasTextAlign; stroke?: number; strokeColor?: string; base?: CanvasTextBaseline } = {},
): void {
  ctx.font = font(size, o.face ?? 'display', o.weight ?? 900);
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = o.base ?? 'alphabetic';
  const st = o.stroke ?? 0;
  if (st > 0) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = st;
    ctx.strokeStyle = o.strokeColor ?? INK;
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = o.color ?? '#ffffff';
  ctx.fillText(s, x, y);
}

/** Keyboard key cap. */
export function keycap(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, h = 44): number {
  ctx.font = font(22, 'ui', 800);
  const w = Math.max(h, ctx.measureText(s).width + 26);
  ctx.fillStyle = INK;
  roundRectPath(ctx, x - 3, y - 3, w + 6, h + 9, 10);
  ctx.fill();
  ctx.fillStyle = '#e9e6f5';
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, x + 3, y + 2, w - 6, h - 10, 6);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x + w / 2, y + h / 2 - 3);
  ctx.textBaseline = 'alphabetic';
  return w;
}

export function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Player focus: thick colour ring plus a "P1" tab; multiple players stack outward. */
export function focusRing(ctx: CanvasRenderingContext2D, r: Rect, slots: number[], t: number, skew = SKEW): void {
  slots.forEach((s, i) => {
    const pad = 8 + i * 9;
    const pulse = 1 + Math.sin(t * 0.25) * 0.6;
    const rr = { x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 };
    ctx.lineWidth = 7 + pulse;
    ctx.strokeStyle = INK;
    slabPath(ctx, rr, skew * (r.h / rr.h));
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = PLAYER_COLORS[s % 4];
    ctx.stroke();
    const tx = rr.x + rr.h * skew * (r.h / rr.h) + 6 + i * 58;
    const ty = rr.y - 22;
    ctx.fillStyle = INK;
    roundRectPath(ctx, tx - 3, ty - 3, 54, 30, 8);
    ctx.fill();
    ctx.fillStyle = PLAYER_COLORS[s % 4];
    roundRectPath(ctx, tx, ty, 48, 24, 6);
    ctx.fill();
    label(ctx, `P${s + 1}`, tx + 24, ty + 20, 20, { align: 'center' });
  });
}

/** Mouse hover ring. */
export function hoverRing(ctx: CanvasRenderingContext2D, r: Rect, skew = SKEW): void {
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.setLineDash([12, 8]);
  slabPath(ctx, { x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12 }, skew);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Animated menu backdrop: deep navy with drifting diagonal bands in the four player colours. */
export function backdrop(ctx: CanvasRenderingContext2D, t: number, tint = '#1a1535'): void {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, mix(tint, '#000000', 0.2));
  g.addColorStop(1, mix(tint, '#000000', 0.55));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.translate(VIEW_W / 2, VIEW_H / 2);
  ctx.rotate(-0.32);
  const off = (t * 1.2) % 480;
  for (let i = -6; i < 7; i++) {
    const col = PLAYER_COLORS[((i % 4) + 4) % 4];
    ctx.fillStyle = rgba(col, 0.055);
    ctx.fillRect(i * 480 + off - 1400, -1400, 170, 2800);
  }
  ctx.restore();
  // dot grid
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  for (let y = 30; y < VIEW_H; y += 44) {
    for (let x = ((y / 44) % 2) * 22 + 20; x < VIEW_W; x += 44) ctx.fillRect(x, y, 3, 3);
  }
}

/** Header strip with title and a hint line. */
export function header(ctx: CanvasRenderingContext2D, title: string, sub?: string): void {
  slab(ctx, { x: -40, y: 34, w: 820, h: 92 }, '#ff3b4f', { skew: 0.35, shadow: 10 });
  label(ctx, title, 70, 108, 70, { stroke: 12 });
  if (sub) label(ctx, sub, 830, 100, 24, { face: 'ui', weight: 700, color: 'rgba(255,255,255,0.8)' });
}

/** Bottom hint bar: pairs of [keys, action]. */
export function hints(ctx: CanvasRenderingContext2D, items: [string[], string][]): void {
  ctx.fillStyle = 'rgba(10,8,22,0.78)';
  ctx.fillRect(0, VIEW_H - 64, VIEW_W, 64);
  let x = 40;
  for (const [keys, action] of items) {
    for (const k of keys) {
      x += keycap(ctx, k, x, VIEW_H - 54, 38) + 8;
    }
    ctx.font = font(22, 'ui', 700);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(action, x + 4, VIEW_H - 27);
    x += ctx.measureText(action).width + 44;
  }
}
