import type { Palette, Rig } from '../sim/defs';
import type { Fighter } from '../sim/fighter';
import { ITEM_MOVES, type Item } from '../sim/items';
import type { V2 } from '../sim/math';
import type { Resolved } from '../sim/pose';
import { INK, mix } from './color';
import { drawItemShape } from './itemDraw';

const OUT = 2.8;

interface LookCtx {
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

function norm(x: number, y: number): V2 {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}

/** Head-space point: u along head-forward, v along head-up, in units of the head radius. */
function hp(c: LookCtx, u: number, v: number): V2 {
  const hr = c.r.headR;
  return { x: c.P.head.x + c.HF.x * u * hr + c.HU.x * v * hr, y: c.P.head.y + c.HF.y * u * hr + c.HU.y * v * hr };
}

function line(ctx: CanvasRenderingContext2D, pts: V2[], w: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}

function disc(ctx: CanvasRenderingContext2D, p: V2, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(0.1, r), 0, Math.PI * 2);
  ctx.fill();
}

function poly(ctx: CanvasRenderingContext2D, pts: V2[], fill: string, outline = true): void {
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

function ellipse(ctx: CanvasRenderingContext2D, c: V2, rx: number, ry: number, rot: number, fill: string, outline: number): void {
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

function tintPal(p: Palette, k: number, to = '#ffffff'): Palette {
  if (k <= 0) return p;
  return {
    main: mix(p.main, to, k), dark: mix(p.dark, to, k), light: mix(p.light, to, k),
    accent: mix(p.accent, to, k), skin: mix(p.skin, to, k), eye: p.eye,
  };
}

export interface DrawOpts {
  alpha: number;
  /** 0..1 white flash (hit / charge). */
  flash: number;
  flashColor?: string;
  shakeX: number;
  shakeY: number;
  /** Render-only frame counter (idle cloth sway, blinking). */
  t: number;
}

const LIMB_DARK = 0.28;

export function drawFighter(ctx: CanvasRenderingContext2D, f: Fighter, o: DrawOpts): void {
  const P = f.pose;
  const r = f.def.rig;
  const pal = tintPal(f.def.palettes[f.palette % f.def.palettes.length], o.flash, o.flashColor);
  const U = norm(P.neck.x - P.hip.x, P.neck.y - P.hip.y);
  const HU = norm(P.head.x - P.neck.x, P.head.y - P.neck.y);
  const c: LookCtx = {
    f, P, r, pal, t: o.t,
    sp: f.vx * f.facing + f.kbx * f.facing,
    U, F: { x: U.y, y: -U.x }, HU, HF: { x: HU.y, y: -HU.x },
    flash: o.flash,
  };
  ctx.save();
  ctx.globalAlpha = o.alpha;
  ctx.translate(f.x + o.shakeX, f.y + o.shakeY);
  ctx.scale(f.facing, -1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const armW = r.limbR * 2;
  const legW = r.limbR * 2.5;
  const look = f.def.look;
  const it = f.item;
  const itemSwing = !!(it && f.move && f.state === 'move' && ITEM_MOVES.has(f.move.id));

  // ---- pass 1: silhouette outline
  behindExtras(ctx, c, true);
  line(ctx, [P.shB, P.elB, P.hdB], armW + OUT * 2, INK);
  disc(ctx, P.hdB, r.handR + OUT, INK);
  line(ctx, [P.hipB, P.knB, P.ftB], legW + OUT * 2, INK);
  footShape(ctx, c, P.ftB, P.knB, true, INK);
  line(ctx, [P.hip, P.neck], r.bodyR * 2 + OUT * 2, INK);
  line(ctx, [P.hipF, P.knF, P.ftF], legW + OUT * 2, INK);
  footShape(ctx, c, P.ftF, P.knF, true, INK);
  headShape(ctx, c, true);
  line(ctx, [P.shF, P.elF, P.hdF], armW + OUT * 2, INK);
  disc(ctx, P.hdF, r.handR + OUT, INK);

  // ---- pass 2: fills, back to front
  behindExtras(ctx, c, false);
  const limbMain = look === 'grott' ? mix(pal.skin, INK, 0.12) : look === 'zip' ? pal.main : pal.main;
  const legMain = look === 'nova' ? pal.dark : look === 'sable' ? mix(pal.dark, INK, 0.1) : limbMain;
  line(ctx, [P.shB, P.elB, P.hdB], armW, mix(limbMain, INK, LIMB_DARK));
  disc(ctx, P.hdB, r.handR, mix(handColor(c), INK, LIMB_DARK));
  line(ctx, [P.hipB, P.knB, P.ftB], legW, mix(legMain, INK, LIMB_DARK));
  footShape(ctx, c, P.ftB, P.knB, false, mix(footColor(c), INK, LIMB_DARK));
  // back-hand item (not swinging)
  if (it && !itemSwing) drawHeldItem(ctx, it, P.hdB, 70 + Math.sin(o.t * 0.1) * 4);
  torso(ctx, c);
  line(ctx, [P.hipF, P.knF, P.ftF], legW, legMain);
  footShape(ctx, c, P.ftF, P.knF, false, footColor(c));
  headShape(ctx, c, false);
  face(ctx, c);
  frontExtras(ctx, c);
  // front arm with its own thin outline so it reads over the torso
  line(ctx, [P.shF, P.elF, P.hdF], armW + OUT * 1.4, INK);
  line(ctx, [P.shF, P.elF, P.hdF], armW, limbMain);
  disc(ctx, P.hdF, r.handR + OUT * 0.7, INK);
  disc(ctx, P.hdF, r.handR, handColor(c));
  if (look === 'grott') claws(ctx, c);
  if (itemSwing && it) drawSwingItem(ctx, it, P);
  else if (look === 'sable' && !(f.move && f.move.def.hideWeapon)) sword(ctx, c);
  ctx.restore();
}

function handColor(c: LookCtx): string {
  switch (c.f.def.look) {
    case 'nova':
      return c.pal.light;
    case 'grott':
      return mix(c.pal.skin, '#000000', 0.08);
    case 'zip':
      return c.pal.light;
    case 'sable':
      return mix(c.pal.dark, INK, 0.2);
  }
}

function footColor(c: LookCtx): string {
  switch (c.f.def.look) {
    case 'nova':
      return mix(c.pal.dark, INK, 0.35);
    case 'grott':
      return mix(c.pal.skin, INK, 0.2);
    case 'zip':
      return c.pal.accent;
    case 'sable':
      return mix(c.pal.dark, INK, 0.45);
  }
}

function footShape(ctx: CanvasRenderingContext2D, c: LookCtx, ft: V2, kn: V2, outline: boolean, color: string): void {
  const r = c.r.footR + (outline ? OUT : 0);
  // toe points roughly forward, perpendicular to the shin
  const sh = norm(ft.x - kn.x, ft.y - kn.y);
  const toe = { x: ft.x - sh.y * r * 0.9 + sh.x * r * 0.1, y: ft.y + sh.x * r * 0.9 + sh.y * r * 0.1 };
  line(ctx, [ft, toe], r * 1.6, color);
}

function torso(ctx: CanvasRenderingContext2D, c: LookCtx): void {
  const { P, r, pal } = c;
  switch (c.f.def.look) {
    case 'nova': {
      line(ctx, [P.hip, P.neck], r.bodyR * 2, pal.main);
      // jacket zip + belt
      const mid = { x: (P.hip.x + P.neck.x) / 2, y: (P.hip.y + P.neck.y) / 2 };
      line(ctx, [{ x: P.hip.x + c.F.x * 4, y: P.hip.y + c.F.y * 4 }, { x: P.neck.x + c.F.x * 3, y: P.neck.y + c.F.y * 3 }], 2, mix(pal.main, INK, 0.35));
      line(ctx, [{ x: P.hip.x - c.F.x * r.bodyR, y: P.hip.y - c.F.y * r.bodyR + 4 }, { x: P.hip.x + c.F.x * r.bodyR, y: P.hip.y + c.F.y * r.bodyR + 4 }], 5, mix(pal.dark, INK, 0.3));
      void mid;
      break;
    }
    case 'grott': {
      line(ctx, [P.hip, P.neck], r.bodyR * 2, mix(pal.skin, '#ffffff', 0.12));
      for (let i = 1; i <= 3; i++) {
        const t = i / 4;
        const a = { x: P.hip.x + (P.neck.x - P.hip.x) * t, y: P.hip.y + (P.neck.y - P.hip.y) * t };
        line(ctx, [{ x: a.x - c.F.x * r.bodyR * 0.2, y: a.y - c.F.y * r.bodyR * 0.2 }, { x: a.x + c.F.x * r.bodyR * 0.85, y: a.y + c.F.y * r.bodyR * 0.85 }], 2.5, mix(pal.skin, INK, 0.3));
      }
      break;
    }
    case 'zip': {
      line(ctx, [P.hip, P.neck], r.bodyR * 2, pal.main);
      line(ctx, [{ x: P.hip.x + c.F.x * r.bodyR * 0.45, y: P.hip.y + c.F.y * r.bodyR * 0.45 }, { x: P.neck.x + c.F.x * r.bodyR * 0.45, y: P.neck.y + c.F.y * r.bodyR * 0.45 }], r.bodyR * 0.9, pal.light);
      line(ctx, [{ x: P.hip.x - c.F.x * 2, y: P.hip.y - c.F.y * 2 }, { x: P.neck.x - c.F.x * 6, y: P.neck.y - c.F.y * 6 }], 3, pal.accent);
      break;
    }
    case 'sable': {
      line(ctx, [P.hip, P.neck], r.bodyR * 2, pal.main);
      // sash
      const a = { x: P.neck.x - c.F.x * r.bodyR * 0.8, y: P.neck.y - c.F.y * r.bodyR * 0.8 - 2 };
      const b = { x: P.hip.x + c.F.x * r.bodyR * 0.9, y: P.hip.y + c.F.y * r.bodyR * 0.9 + 6 };
      line(ctx, [a, b], 5, pal.accent);
      line(ctx, [{ x: P.hip.x - c.F.x * r.bodyR, y: P.hip.y - c.F.y * r.bodyR + 3 }, { x: P.hip.x + c.F.x * r.bodyR, y: P.hip.y + c.F.y * r.bodyR + 3 }], 4, mix(pal.dark, INK, 0.3));
      break;
    }
  }
}

function headShape(ctx: CanvasRenderingContext2D, c: LookCtx, outline: boolean): void {
  const { P, r, pal } = c;
  const hr = r.headR;
  const o = outline ? OUT : 0;
  const col = outline ? INK : null;
  switch (c.f.def.look) {
    case 'nova': {
      if (outline) {
        hair(ctx, c, true);
        disc(ctx, P.head, hr + o, INK);
      } else {
        disc(ctx, P.head, hr, pal.skin);
        hair(ctx, c, false);
      }
      break;
    }
    case 'grott': {
      const snout = hp(c, 0.72, -0.22);
      disc(ctx, P.head, hr * 1.05 + o, col ?? pal.skin);
      disc(ctx, snout, hr * 0.62 + o, col ?? mix(pal.skin, '#ffffff', 0.1));
      // horn
      const horn = [hp(c, 0.55, 0.25), hp(c, 1.35, 1.0), hp(c, 0.95, 0.12)];
      if (outline) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = OUT * 2;
        ctx.beginPath();
        ctx.moveTo(horn[0].x, horn[0].y);
        ctx.lineTo(horn[1].x, horn[1].y);
        ctx.lineTo(horn[2].x, horn[2].y);
        ctx.closePath();
        ctx.stroke();
      } else {
        poly(ctx, horn, pal.light, false);
      }
      break;
    }
    case 'zip': {
      if (outline) {
        ears(ctx, c, true);
        disc(ctx, P.head, hr + o, INK);
        disc(ctx, hp(c, 0.7, -0.25), hr * 0.5 + o, INK);
      } else {
        ears(ctx, c, false);
        disc(ctx, P.head, hr, pal.main);
        disc(ctx, hp(c, 0.7, -0.25), hr * 0.5, pal.light);
      }
      break;
    }
    case 'sable': {
      if (outline) {
        plume(ctx, c, true);
        disc(ctx, P.head, hr + o, INK);
      } else {
        plume(ctx, c, false);
        disc(ctx, P.head, hr, pal.skin);
        // hair cap
        ctx.fillStyle = mix(pal.dark, INK, 0.35);
        ctx.beginPath();
        const a0 = Math.atan2(c.HU.y, c.HU.x);
        ctx.arc(P.head.x, P.head.y, hr, a0 - 0.2, a0 + Math.PI * 0.95);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
  }
}

function hair(ctx: CanvasRenderingContext2D, c: LookCtx, outline: boolean): void {
  const pts = [
    [-1.0, 0.1], [-1.5, 0.55], [-0.85, 0.72], [-1.15, 1.25], [-0.35, 1.0], [-0.3, 1.55], [0.2, 1.02], [0.7, 1.28], [0.72, 0.72], [0.95, 0.45], [0.3, 0.55], [-0.4, 0.45],
  ].map(([u, v]) => hp(c, u, v));
  if (outline) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = OUT * 2;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.fill();
  } else {
    poly(ctx, pts, mix(c.pal.dark, INK, 0.45), false);
    // spark streak
    line(ctx, [hp(c, -0.15, 1.05), hp(c, -0.25, 1.4)], 2.2, c.pal.accent);
  }
}

function ears(ctx: CanvasRenderingContext2D, c: LookCtx, outline: boolean): void {
  const hr = c.r.headR;
  const sweep = Math.min(1, Math.max(0, c.sp / 12));
  const wob = Math.sin(c.t * 0.12) * 0.06;
  for (const [du, back] of [[-0.35, 1], [0.05, 0]] as const) {
    const base = hp(c, du, 0.7);
    const ang = (1.95 + sweep * 0.75 + wob + back * 0.15);
    // angle in head space: 0 = forward, π/2 = up
    const dir = { x: c.HF.x * Math.cos(ang) + c.HU.x * Math.sin(ang), y: c.HF.y * Math.cos(ang) + c.HU.y * Math.sin(ang) };
    const len = hr * 2.2;
    const tip = { x: base.x + dir.x * len, y: base.y + dir.y * len };
    if (outline) line(ctx, [base, tip], hr * 0.62 + OUT * 2, INK);
    else {
      const col = back ? mix(c.pal.main, INK, 0.2) : c.pal.main;
      line(ctx, [base, tip], hr * 0.62, col);
      const mid = { x: base.x + dir.x * len * 0.25, y: base.y + dir.y * len * 0.25 };
      line(ctx, [mid, { x: tip.x - dir.x * 3, y: tip.y - dir.y * 3 }], hr * 0.25, c.pal.accent);
    }
  }
}

function plume(ctx: CanvasRenderingContext2D, c: LookCtx, outline: boolean): void {
  const a = hp(c, -0.75, 0.55);
  const sw = Math.sin(c.t * 0.1) * 3;
  const back = Math.max(0, c.sp) * 1.2;
  const b = { x: a.x - 14 - back, y: a.y - 2 + sw };
  const d = { x: b.x - 12 - back * 0.8, y: b.y - 12 + sw * 1.5 };
  if (outline) line(ctx, [a, b, d], 9 + OUT * 2, INK);
  else {
    line(ctx, [a, b, d], 9, c.pal.accent);
    line(ctx, [a, b], 3, mix(c.pal.accent, '#ffffff', 0.4));
  }
}

function behindExtras(ctx: CanvasRenderingContext2D, c: LookCtx, outline: boolean): void {
  const { P, r, pal } = c;
  switch (c.f.def.look) {
    case 'nova': {
      // scarf tails
      const anchor = { x: P.neck.x - c.F.x * r.bodyR * 0.55, y: P.neck.y - c.F.y * r.bodyR * 0.55 - 2 };
      const sp = Math.max(-4, Math.min(14, c.sp));
      const w1 = Math.sin(c.t * 0.22) * 3;
      const w2 = Math.sin(c.t * 0.22 + 1.2) * 4;
      const p1 = { x: anchor.x - 12 - sp * 1.1, y: anchor.y - 8 + sp * 0.3 + w1 };
      const p2 = { x: p1.x - 10 - sp * 1.0, y: p1.y - 10 + sp * 0.5 + w2 };
      if (outline) line(ctx, [anchor, p1, p2], 8 + OUT * 2, INK);
      else {
        line(ctx, [anchor, p1, p2], 8, pal.accent);
        line(ctx, [p1, p2], 3, mix(pal.accent, '#ffffff', 0.35));
      }
      break;
    }
    case 'grott': {
      const ang = Math.atan2(c.U.y, c.U.x) - Math.PI / 2;
      const ctr = { x: P.center.x - c.F.x * r.bodyR * 0.55 + c.U.x * r.torso * 0.08, y: P.center.y - c.F.y * r.bodyR * 0.55 + c.U.y * r.torso * 0.08 };
      const rx = r.bodyR * 1.15;
      const ry = r.torso * 0.78;
      if (outline) {
        ellipse(ctx, ctr, rx + OUT, ry + OUT, ang, INK, 0);
        spikes(ctx, c, ctr, rx, ry, ang, true);
      } else {
        spikes(ctx, c, ctr, rx, ry, ang, false);
        ellipse(ctx, ctr, rx, ry, ang, pal.main, 0);
        // plates
        ctx.strokeStyle = pal.dark;
        ctx.lineWidth = 3;
        for (const [u, v, s] of [[-0.35, 0.3, 0.42], [0.1, -0.25, 0.4], [-0.45, -0.4, 0.3], [0.2, 0.45, 0.3]] as const) {
          const px = ctr.x + Math.cos(ang) * u * rx - Math.sin(ang) * v * ry;
          const py = ctr.y + Math.sin(ang) * u * rx + Math.cos(ang) * v * ry;
          hexagon(ctx, px, py, s * rx * 0.6, ang);
        }
        ctx.lineWidth = 4;
        ctx.strokeStyle = mix(pal.main, '#ffffff', 0.25);
        ctx.beginPath();
        ctx.ellipse(ctr.x, ctr.y, rx * 0.86, ry * 0.86, ang, 0.2, 1.4);
        ctx.stroke();
      }
      break;
    }
    case 'zip': {
      const tail = { x: P.hip.x - c.F.x * r.bodyR * 1.2, y: P.hip.y - c.F.y * r.bodyR * 1.2 + 3 };
      disc(ctx, tail, r.bodyR * 0.8 + (outline ? OUT : 0), outline ? INK : pal.light);
      break;
    }
    case 'sable': {
      const A = { x: P.neck.x - c.F.x * r.bodyR * 0.2, y: P.neck.y - c.F.y * r.bodyR * 0.2 - 3 };
      const sp = Math.max(-4, Math.min(14, c.sp));
      const sw = Math.sin(c.t * 0.09) * 4;
      const len = r.torso * 1.45;
      const pts = [
        A,
        { x: A.x - r.bodyR * 1.3 - sp * 0.8, y: A.y - len * 0.25 },
        { x: A.x - r.bodyR * 1.6 - sp * 2.2 + sw, y: A.y - len + sp * 1.2 },
        { x: A.x - r.bodyR * 0.3 - sp * 1.4 + sw * 0.6, y: A.y - len * 0.95 + sp * 1.0 },
        { x: A.x + r.bodyR * 0.4, y: A.y - len * 0.4 },
      ];
      if (outline) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = OUT * 2;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (const p of pts) ctx.lineTo(p.x, p.y);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.fill();
      } else {
        poly(ctx, pts, mix(pal.dark, INK, 0.15), false);
        line(ctx, [pts[2], pts[3]], 4, pal.accent);
      }
      break;
    }
  }
}

function spikes(ctx: CanvasRenderingContext2D, c: LookCtx, ctr: V2, rx: number, ry: number, ang: number, outline: boolean): void {
  for (const t of [-1.9, -2.5, -3.05, 2.9]) {
    const bx = Math.cos(t) * rx;
    const by = Math.sin(t) * ry;
    const nx = Math.cos(t) * (rx + 16);
    const ny = Math.sin(t) * (ry + 16);
    const rot = (x: number, y: number): V2 => ({ x: ctr.x + x * Math.cos(ang) - y * Math.sin(ang), y: ctr.y + x * Math.sin(ang) + y * Math.cos(ang) });
    const perp = { x: -Math.sin(t) * 9, y: Math.cos(t) * 9 };
    const pts = [rot(bx + perp.x, by + perp.y), rot(nx, ny), rot(bx - perp.x, by - perp.y)];
    if (outline) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = OUT * 2;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.lineTo(pts[2].x, pts[2].y);
      ctx.closePath();
      ctx.stroke();
    } else poly(ctx, pts, c.pal.accent, false);
  }
}

function hexagon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = rot + (i * Math.PI) / 3;
    const px = x + Math.cos(a) * s;
    const py = y + Math.sin(a) * s;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

function frontExtras(ctx: CanvasRenderingContext2D, c: LookCtx): void {
  const { P, r, pal } = c;
  switch (c.f.def.look) {
    case 'nova': {
      // scarf wrap + goggles
      const a = { x: P.neck.x - c.F.x * r.bodyR * 0.8, y: P.neck.y - c.F.y * r.bodyR * 0.8 - 3 };
      const b = { x: P.neck.x + c.F.x * r.bodyR * 0.85, y: P.neck.y + c.F.y * r.bodyR * 0.85 - 3 };
      line(ctx, [a, b], 8 + OUT * 1.4, INK);
      line(ctx, [a, b], 8, pal.accent);
      const g1 = hp(c, -0.98, 0.55);
      const g2 = hp(c, 0.95, 0.6);
      line(ctx, [g1, g2], r.headR * 0.26, mix(pal.dark, INK, 0.3));
      const lens = hp(c, 0.5, 0.66);
      disc(ctx, lens, r.headR * 0.3 + 1.5, INK);
      disc(ctx, lens, r.headR * 0.3, pal.light);
      disc(ctx, hp(c, 0.42, 0.74), r.headR * 0.09, '#ffffff');
      break;
    }
    case 'zip': {
      const a = hp(c, -0.05, 0.22);
      const b = hp(c, 1.08, 0.16);
      line(ctx, [a, b], r.headR * 0.46 + OUT * 1.2, INK);
      line(ctx, [a, b], r.headR * 0.46, pal.accent);
      line(ctx, [hp(c, 0.2, 0.3), hp(c, 0.85, 0.27)], 1.6, 'rgba(255,255,255,0.8)');
      disc(ctx, hp(c, 1.12, -0.25), 2.4, INK);
      break;
    }
    case 'sable': {
      const a = hp(c, -0.35, 0.28);
      const b = hp(c, 1.02, 0.2);
      line(ctx, [a, b], r.headR * 0.55 + OUT * 1.2, INK);
      line(ctx, [a, b], r.headR * 0.55, pal.main);
      line(ctx, [hp(c, 0.4, 0.22), hp(c, 0.82, 0.2)], 2.6, pal.eye);
      break;
    }
    case 'grott':
      break;
  }
}

function claws(ctx: CanvasRenderingContext2D, c: LookCtx): void {
  const { P, r, pal } = c;
  const a = norm(P.hdF.x - P.elF.x, P.hdF.y - P.elF.y);
  const perp = { x: -a.y, y: a.x };
  for (const k of [-0.6, 0, 0.6]) {
    const b = { x: P.hdF.x + a.x * r.handR * 0.7 + perp.x * k * r.handR, y: P.hdF.y + a.y * r.handR * 0.7 + perp.y * k * r.handR };
    const tip = { x: b.x + a.x * 8, y: b.y + a.y * 8 };
    line(ctx, [b, tip], 4.5, INK);
    line(ctx, [b, tip], 2.5, pal.light);
  }
}

function face(ctx: CanvasRenderingContext2D, c: LookCtx): void {
  const f = c.f;
  const look = f.def.look;
  if (look === 'sable') return;
  const hr = c.r.headR;
  const hurt = f.hitlag > 0 && f.hurtFlash > 0 || f.state === 'tumble' || f.state === 'hitstun';
  const dizzy = f.state === 'dizzy';
  const blink = Math.floor(c.t / 7) % 34 === 0;
  const eyes: [V2, number][] = look === 'grott'
    ? [[hp(c, 0.42, 0.38), hr * 0.17]]
    : look === 'zip'
      ? []
      : [[hp(c, 0.5, 0.12), hr * 0.2], [hp(c, 0.08, 0.14), hr * 0.16]];
  for (const [e, s] of eyes) {
    if (dizzy) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(e.x, e.y, s * 1.1, c.t * 0.3, c.t * 0.3 + 4.5);
      ctx.stroke();
      continue;
    }
    if (hurt) {
      line(ctx, [{ x: e.x - s, y: e.y + s }, { x: e.x + s, y: e.y }, { x: e.x - s, y: e.y - s }], 2.2, INK);
      continue;
    }
    if (blink) {
      line(ctx, [{ x: e.x - s, y: e.y }, { x: e.x + s, y: e.y }], 2, INK);
      continue;
    }
    if (look === 'grott') {
      disc(ctx, e, s * 1.25, INK);
      disc(ctx, e, s, c.pal.eye);
      line(ctx, [{ x: e.x, y: e.y - s * 0.8 }, { x: e.x, y: e.y + s * 0.8 }], 1.6, INK);
      // brow
      line(ctx, [hp(c, 0.05, 0.62), hp(c, 0.75, 0.5)], 5, mix(c.pal.dark, INK, 0.2));
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, s * 0.9, s * 1.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      disc(ctx, { x: e.x + s * 0.3, y: e.y }, s * 0.62, c.pal.eye);
      disc(ctx, { x: e.x + s * 0.45, y: e.y + s * 0.35 }, s * 0.2, '#ffffff');
    }
  }
  if (look === 'nova') {
    const m1 = hp(c, 0.55, -0.42);
    const m2 = hp(c, 0.85, -0.38);
    line(ctx, [m1, m2], hurt ? 3 : 1.8, INK);
  }
}

function sword(ctx: CanvasRenderingContext2D, c: LookCtx): void {
  const { P, r, pal } = c;
  const wl = r.weapon?.len ?? 0;
  if (wl <= 0) return;
  const a = (c.P.w * Math.PI) / 180;
  const d = { x: Math.cos(a), y: Math.sin(a) };
  const base = P.wBase;
  const tip = P.wTip;
  const perp = { x: -d.y, y: d.x };
  const hilt = { x: base.x - d.x * 12, y: base.y - d.y * 12 };
  const guardA = { x: base.x + d.x * 5 + perp.x * 9, y: base.y + d.y * 5 + perp.y * 9 };
  const guardB = { x: base.x + d.x * 5 - perp.x * 9, y: base.y + d.y * 5 - perp.y * 9 };
  line(ctx, [hilt, base], 5 + OUT * 1.4, INK);
  line(ctx, [hilt, base], 5, mix(pal.dark, INK, 0.4));
  const bladeStart = { x: base.x + d.x * 6, y: base.y + d.y * 6 };
  line(ctx, [bladeStart, tip], 7 + OUT * 1.4, INK);
  line(ctx, [bladeStart, tip], 7, '#e3e9f4');
  line(ctx, [bladeStart, { x: tip.x - d.x * 8, y: tip.y - d.y * 8 }], 2, '#9fb3d8');
  line(ctx, [guardA, guardB], 5 + OUT * 1.2, INK);
  line(ctx, [guardA, guardB], 5, pal.accent);
  disc(ctx, hilt, 4, pal.accent);
}

function drawHeldItem(ctx: CanvasRenderingContext2D, it: Item, hand: V2, angleDeg: number): void {
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate((angleDeg * Math.PI) / 180);
  drawItemShape(ctx, it.kind, 0.8, 0, true);
  ctx.restore();
}

function drawSwingItem(ctx: CanvasRenderingContext2D, it: Item, P: Resolved): void {
  const ang = Math.atan2(P.wTip.y - P.wBase.y, P.wTip.x - P.wBase.x);
  ctx.save();
  ctx.translate(P.wBase.x, P.wBase.y);
  ctx.rotate(ang);
  drawItemShape(ctx, it.kind, 1, 0, true);
  ctx.restore();
}
