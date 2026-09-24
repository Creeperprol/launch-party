import type { Palette, Rig } from '../sim/defs';
import type { Fighter } from '../sim/fighter';
import type { V2 } from '../sim/math';
import type { Resolved } from '../sim/pose';
import { INK } from './color';

/** Shared drawing kit for fighter looks. Local space: +x forward, +y up. */
export const OUT = 2.8;

export interface LookCtx {
  f: Fighter;
  P: Resolved;
  r: Rig;
  pal: Palette;
  t: number;
  /** Forward speed (u/frame). */
  sp: number;
  /** Body up / forward unit vectors. */
  U: V2;
  F: V2;
  HU: V2;
  HF: V2;
  flash: number;
}

/**
 * A fighter's visual model. Drawing runs in two passes: an ink silhouette (outline = true)
 * and then fills. The body capsule, limbs, hands and feet are drawn by the shared renderer.
 */
export interface Look {
  arm(c: LookCtx): string;
  leg(c: LookCtx): string;
  hand(c: LookCtx): string;
  foot(c: LookCtx): string;
  torso(ctx: CanvasRenderingContext2D, c: LookCtx): void;
  head(ctx: CanvasRenderingContext2D, c: LookCtx, outline: boolean): void;
  /** Drawn first in both passes (capes, tails, oversized torsos). */
  behind?(ctx: CanvasRenderingContext2D, c: LookCtx, outline: boolean): void;
  face?(ctx: CanvasRenderingContext2D, c: LookCtx): void;
  /** Drawn over the head and face, under the front arm. */
  front?(ctx: CanvasRenderingContext2D, c: LookCtx): void;
  /** Drawn last, over the front arm (weapons, fist effects). */
  held?(ctx: CanvasRenderingContext2D, c: LookCtx): void;
}

export function norm(x: number, y: number): V2 {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}

/** Head-space point: u along head-forward, v along head-up, in units of the head radius. */
export function hp(c: LookCtx, u: number, v: number): V2 {
  const hr = c.r.headR;
  return { x: c.P.head.x + c.HF.x * u * hr + c.HU.x * v * hr, y: c.P.head.y + c.HF.y * u * hr + c.HU.y * v * hr };
}

/** Body-space point: f along body-forward, u along body-up from the hip, in world units. */
export function bp(c: LookCtx, f: number, u: number): V2 {
  return { x: c.P.hip.x + c.F.x * f + c.U.x * u, y: c.P.hip.y + c.F.y * f + c.U.y * u };
}

/** Unit vector at `deg` in body space (0 = forward, 90 = up). */
export function bdir(c: LookCtx, deg: number): V2 {
  const a = (deg * Math.PI) / 180;
  return { x: c.F.x * Math.cos(a) + c.U.x * Math.sin(a), y: c.F.y * Math.cos(a) + c.U.y * Math.sin(a) };
}

export function add(p: V2, d: V2, k = 1): V2 {
  return { x: p.x + d.x * k, y: p.y + d.y * k };
}

export function line(ctx: CanvasRenderingContext2D, pts: V2[], w: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}

/** A polyline with an ink border (outline pass) or its fill colour. */
export function band(ctx: CanvasRenderingContext2D, pts: V2[], w: number, color: string, outline: boolean): void {
  if (outline) line(ctx, pts, w + OUT * 2, INK);
  else line(ctx, pts, w, color);
}

export function disc(ctx: CanvasRenderingContext2D, p: V2, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(0.1, r), 0, Math.PI * 2);
  ctx.fill();
}

export function poly(ctx: CanvasRenderingContext2D, pts: V2[], fill: string, outline = true): void {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  if (outline) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = OUT * 2;
    ctx.stroke();
  }
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Ink silhouette for a polygon (outline pass). */
export function inkPoly(ctx: CanvasRenderingContext2D, pts: V2[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.strokeStyle = INK;
  ctx.lineWidth = OUT * 2;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fill();
}

/** Silhouette in the outline pass, fill in the fill pass. */
export function shape(ctx: CanvasRenderingContext2D, pts: V2[], fill: string, outline: boolean): void {
  if (outline) inkPoly(ctx, pts);
  else poly(ctx, pts, fill, false);
}

export function ellipse(ctx: CanvasRenderingContext2D, c: V2, rx: number, ry: number, rot: number, fill: string, outline: number): void {
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
  if (outline > 0) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = outline;
    ctx.stroke();
  }
  ctx.fillStyle = fill;
  ctx.fill();
}

export function mood(c: LookCtx): { hurt: boolean; dizzy: boolean; blink: boolean } {
  const f = c.f;
  return {
    hurt: (f.hitlag > 0 && f.hurtFlash > 0) || f.state === 'tumble' || f.state === 'hitstun',
    dizzy: f.state === 'dizzy',
    blink: Math.floor(c.t / 7) % 34 === 0,
  };
}

/** Standard cartoon eyes (white sclera + iris), with hurt / dizzy / blink states. */
export function cartoonEyes(ctx: CanvasRenderingContext2D, c: LookCtx, eyes: [V2, number][], iris = c.pal.eye): void {
  const m = mood(c);
  for (const [e, s] of eyes) {
    if (m.dizzy) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(e.x, e.y, s * 1.1, c.t * 0.3, c.t * 0.3 + 4.5);
      ctx.stroke();
    } else if (m.hurt) {
      line(ctx, [{ x: e.x - s, y: e.y + s }, { x: e.x + s, y: e.y }, { x: e.x - s, y: e.y - s }], 2.2, INK);
    } else if (m.blink) {
      line(ctx, [{ x: e.x - s, y: e.y }, { x: e.x + s, y: e.y }], 2, INK);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, s * 0.9, s * 1.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      disc(ctx, { x: e.x + s * 0.3, y: e.y }, s * 0.62, iris);
      disc(ctx, { x: e.x + s * 0.45, y: e.y + s * 0.35 }, s * 0.2, '#ffffff');
    }
  }
}

/** Glowing slit eyes (visors, golems, masks). Go dark when hurt. */
export function glowSlit(ctx: CanvasRenderingContext2D, c: LookCtx, a: V2, b: V2, w: number, color: string): void {
  const m = mood(c);
  line(ctx, [a, b], w + 2.4, INK);
  if (m.hurt) return;
  const pulse = m.dizzy ? 0.4 + 0.4 * Math.sin(c.t * 0.5) : 1;
  ctx.save();
  ctx.globalAlpha *= pulse;
  line(ctx, [a, b], w, color);
  ctx.restore();
}

/** Deterministic render-only jitter in [-1, 1]. */
export function wob(t: number, k: number): number {
  return Math.sin(t * 0.9 + k * 2.3) * 0.6 + Math.sin(t * 1.7 + k * 5.1) * 0.4;
}

/** Weapon axis from the pose: grip at the front hand, tip `len` along the weapon angle. */
export function weaponFrame(c: LookCtx): { d: V2; n: V2; base: V2; tip: V2 } | null {
  if ((c.r.weapon?.len ?? 0) <= 0) return null;
  const a = (c.P.w * Math.PI) / 180;
  const d = { x: Math.cos(a), y: Math.sin(a) };
  return { d, n: { x: -d.y, y: d.x }, base: c.P.wBase, tip: c.P.wTip };
}
