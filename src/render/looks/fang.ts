import { INK, mix } from '../color';
import { add, band, bdir, bp, cartoonEyes, disc, hp, line, mood, OUT, poly, shape, type Look, type LookCtx } from '../lookKit';
import type { V2 } from '../../sim/math';

/** FANG — wolf ninja. Snout, pointed ears, headband tails, bushy tail, wrapped gi. */
function tail(c: LookCtx): V2[] {
  const sw = Math.sin(c.t * 0.14) * 8;
  const sp = Math.max(0, Math.min(14, c.sp));
  const base = bp(c, -c.r.bodyR * 0.8, 6);
  const d = bdir(c, 162 + sw + sp * 2.2);
  const perp = { x: -d.y, y: d.x };
  const len = c.r.torso * 1.05;
  return [
    add(base, perp, 5), add(add(base, d, len * 0.4), perp, 13), add(add(base, d, len * 0.8), perp, 12), add(add(base, d, len * 1.05), perp, 4),
    add(base, d, len * 1.12), add(add(base, d, len * 0.95), perp, -7), add(add(base, d, len * 0.5), perp, -9), add(base, perp, -5),
  ];
}

function snout(c: LookCtx): V2[] {
  return [[0.35, 0.2], [1.7, -0.05], [1.62, -0.42], [0.35, -0.62]].map(([u, v]) => hp(c, u, v));
}

function ears(c: LookCtx): V2[][] {
  const back = Math.max(0, Math.min(1, c.sp / 12)) * 0.35;
  return [
    [[-0.75, 0.6], [-0.75 - back, 1.65], [-0.1, 0.85]],
    [[0.0, 0.85], [0.3 - back, 1.75], [0.62, 0.62]],
  ].map((e) => e.map(([u, v]) => hp(c, u, v)));
}

function bandTails(c: LookCtx): V2[] {
  const sp = Math.max(-2, Math.min(14, c.sp));
  const w = Math.sin(c.t * 0.22) * 3;
  const a = hp(c, -0.95, 0.42);
  return [a, { x: a.x - 12 - sp, y: a.y - 4 + w }, { x: a.x - 22 - sp * 1.8, y: a.y - 10 + w * 1.6 }];
}

export const FANG_LOOK: Look = {
  arm: (c) => c.pal.main,
  leg: (c) => mix(c.pal.main, INK, 0.15),
  hand: (c) => c.pal.skin,
  foot: (c) => c.pal.dark,
  behind(ctx, c, outline) {
    const t = tail(c);
    shape(ctx, t, c.pal.skin, outline);
    if (!outline) poly(ctx, [t[2], t[3], t[4], t[5]], c.pal.light, false);
    band(ctx, bandTails(c), 5, c.pal.accent, outline);
  },
  torso(ctx, c) {
    const { P, r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    line(ctx, [P.hip, P.neck], b * 2, pal.main);
    line(ctx, [bp(c, -b * 0.7, T + 1), bp(c, b * 0.9, T * 0.35)], 3, pal.dark);
    line(ctx, [bp(c, b * 0.1, T + 1), bp(c, b * 0.95, T * 0.6)], 3, pal.dark);
    line(ctx, [bp(c, -b, 4), bp(c, b, 4)], 5.5, pal.accent);
    line(ctx, [bp(c, -b * 0.4, T + 3), bp(c, b * 0.8, T + 1)], 7, mix(pal.accent, INK, 0.2));
  },
  head(ctx, c, outline) {
    const hr = c.r.headR;
    for (const e of ears(c)) shape(ctx, e, c.pal.skin, outline);
    disc(ctx, c.P.head, hr + (outline ? OUT : 0), outline ? INK : c.pal.skin);
    shape(ctx, snout(c), c.pal.skin, outline);
    if (outline) return;
    for (const e of ears(c)) poly(ctx, [e[0], { x: (e[0].x + e[1].x * 2) / 3, y: (e[0].y + e[1].y * 2) / 3 }, e[2]], mix(c.pal.skin, '#ff9aa0', 0.3), false);
    poly(ctx, [hp(c, 0.35, -0.3), hp(c, 1.6, -0.3), hp(c, 1.55, -0.44), hp(c, 0.35, -0.62)], c.pal.light, false);
    disc(ctx, hp(c, 1.62, -0.1), hr * 0.17, INK);
    line(ctx, [hp(c, -1.0, 0.42), hp(c, 0.95, 0.5)], hr * 0.3, c.pal.accent);
    disc(ctx, hp(c, 0.4, 0.49), hr * 0.13, mix(c.pal.accent, '#ffffff', 0.5));
  },
  face(ctx, c) {
    const hr = c.r.headR;
    cartoonEyes(ctx, c, [[hp(c, 0.55, 0.12), hr * 0.17]]);
    line(ctx, [hp(c, 0.25, 0.3), hp(c, 0.85, 0.22)], 2.4, INK);
    if (mood(c).hurt) return;
    line(ctx, [hp(c, 0.8, -0.5), hp(c, 1.45, -0.45)], 1.5, INK);
    poly(ctx, [hp(c, 1.2, -0.46), hp(c, 1.26, -0.62), hp(c, 1.32, -0.46)], '#ffffff', false);
  },
};

