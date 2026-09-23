import { INK, mix } from '../color';
import { add, bdir, bp, disc, glowSlit, hp, line, OUT, poly, shape, type Look, type LookCtx } from '../lookKit';
import type { V2 } from '../../sim/math';

/** RAVEN — masked polearm duelist. Bird-skull mask, feather cape, naginata. */
function feather(c: LookCtx, k: number): V2[] {
  const T = c.r.torso;
  const sp = Math.max(-4, Math.min(14, c.sp));
  const sway = Math.sin(c.t * 0.1 + k * 0.9) * 5;
  const A = bp(c, -c.r.bodyR * 0.3, T + 2);
  const ang = 205 + k * 13 - sp * 1.6 + sway;
  const len = T * (1.35 - k * 0.12);
  const d = bdir(c, ang);
  const perp = { x: -d.y, y: d.x };
  const w = 7 - k * 0.6;
  return [add(A, perp, w * 0.6), add(add(A, d, len * 0.5), perp, w), add(A, d, len), add(add(A, d, len * 0.55), perp, -w * 0.7), add(A, perp, -w * 0.4)];
}

function mask(c: LookCtx): V2[] {
  return [[0.15, 0.5], [1.0, 0.38], [2.05, -0.2], [0.95, -0.48], [0.2, -0.6]].map(([u, v]) => hp(c, u, v));
}

function crest(c: LookCtx): V2[][] {
  const sw = Math.sin(c.t * 0.12) * 0.12;
  const back = Math.max(0, Math.min(1, c.sp / 12)) * 0.35;
  return [
    [[-0.2, 0.9], [-1.5 - back, 1.45 + sw], [-0.55, 0.65]],
    [[-0.55, 0.7], [-1.85 - back, 0.9 + sw], [-0.85, 0.35]],
    [[-0.8, 0.35], [-1.7 - back, 0.2 + sw], [-0.95, 0.0]],
  ].map((tri) => tri.map(([u, v]) => hp(c, u, v)));
}

function naginata(ctx: CanvasRenderingContext2D, c: LookCtx): void {
  const { P, pal } = c;
  if ((c.r.weapon?.len ?? 0) <= 0) return;
  const a = (P.w * Math.PI) / 180;
  const d = { x: Math.cos(a), y: Math.sin(a) };
  const perp = { x: -d.y, y: d.x };
  const tip = P.wTip;
  const butt = add(P.wBase, d, -26);
  const bs = add(tip, d, -30);
  line(ctx, [butt, bs], 4.5 + OUT * 1.4, INK);
  line(ctx, [butt, bs], 4.5, '#6b4428');
  line(ctx, [add(P.wBase, d, -9), add(P.wBase, d, -3)], 6, pal.accent);
  disc(ctx, butt, 4 + OUT * 0.7, INK);
  disc(ctx, butt, 4, pal.accent);
  // tassel at the collar
  const sway = Math.sin(c.t * 0.15) * 3;
  line(ctx, [bs, add(add(bs, perp, -10), d, -4 + sway)], 2.5, pal.accent);
  const blade = [add(bs, perp, 3.2), add(add(bs, d, 15), perp, 6.8), add(tip, perp, 4.5), add(add(bs, d, 19), perp, -1.2), add(bs, perp, -3.2)];
  poly(ctx, blade, '#e3e9f4', true);
  line(ctx, [add(bs, perp, -2), add(add(bs, d, 19), perp, -0.6)], 1.6, '#ffffff');
  line(ctx, [add(bs, d, -3), add(bs, d, 3)], 7 + OUT, INK);
  line(ctx, [add(bs, d, -3), add(bs, d, 3)], 7, mix(pal.accent, INK, 0.2));
}

export const RAVEN_LOOK: Look = {
  arm: (c) => c.pal.main,
  leg: (c) => mix(c.pal.dark, INK, 0.1),
  hand: (c) => mix(c.pal.dark, INK, 0.2),
  foot: (c) => mix(c.pal.dark, INK, 0.45),
  behind(ctx, c, outline) {
    for (let k = 3; k >= 0; k--) {
      const pts = feather(c, k);
      shape(ctx, pts, k % 2 ? mix(c.pal.dark, INK, 0.15) : c.pal.main, outline);
      if (!outline && k === 0) line(ctx, [pts[1], pts[2]], 2.5, c.pal.accent);
    }
  },
  torso(ctx, c) {
    const { P, r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    line(ctx, [P.hip, P.neck], b * 2, pal.main);
    line(ctx, [bp(c, -b * 0.6, T + 2), bp(c, b * 0.35, T * 0.5), bp(c, b * 0.95, T + 1)], 3.5, pal.accent);
    line(ctx, [bp(c, -b, 5), bp(c, b, 5)], 7, mix(pal.accent, INK, 0.25));
    line(ctx, [bp(c, b * 0.2, 5), bp(c, b * 0.45, -8)], 3, mix(pal.accent, INK, 0.25));
  },
  head(ctx, c, outline) {
    const hr = c.r.headR;
    for (const tri of crest(c)) shape(ctx, tri, c.pal.accent, outline);
    if (outline) {
      disc(ctx, c.P.head, hr + OUT, INK);
      shape(ctx, mask(c), INK, true);
      return;
    }
    disc(ctx, c.P.head, hr, mix(c.pal.dark, INK, 0.1));
    poly(ctx, mask(c), mix(c.pal.light, '#ffffff', 0.6), false);
  },
  face(ctx, c) {
    const hr = c.r.headR;
    line(ctx, [hp(c, 1.0, -0.12), hp(c, 1.95, -0.2)], 1.4, INK);
    disc(ctx, hp(c, 0.62, 0.12), hr * 0.24, INK);
    glowSlit(ctx, c, hp(c, 0.48, 0.14), hp(c, 0.78, 0.1), 2.4, c.pal.eye);
    line(ctx, [hp(c, 0.25, 0.42), hp(c, 0.95, 0.3)], 1.2, mix(c.pal.light, INK, 0.35));
  },
  held(ctx, c) {
    naginata(ctx, c);
  },
};

