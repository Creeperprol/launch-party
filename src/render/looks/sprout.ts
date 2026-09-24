import { INK, mix } from '../color';
import { add, band, bdir, bp, cartoonEyes, disc, hp, line, mood, OUT, shape, type Look, type LookCtx } from '../lookKit';
import type { V2 } from '../../sim/math';

/** SPROUT — plant sprite. Bulb head with two sprout leaves and a bud, petal collar, leaf skirt. */
function leaf(base: V2, tip: V2, w: number): V2[] {
  const d = { x: tip.x - base.x, y: tip.y - base.y };
  const l = Math.hypot(d.x, d.y) || 1;
  const perp = { x: (-d.y / l) * w, y: (d.x / l) * w };
  const mid = { x: base.x + d.x * 0.45, y: base.y + d.y * 0.45 };
  return [base, add(mid, perp), tip, add(mid, perp, -1)];
}

function headLeaves(c: LookCtx): V2[][] {
  const sw = Math.sin(c.t * 0.12) * 0.15;
  const back = Math.max(0, Math.min(1, c.sp / 12)) * 0.4;
  const stem = hp(c, -0.1, 1.25);
  return [leaf(stem, hp(c, -1.25 - back, 1.9 + sw), 7), leaf(stem, hp(c, 0.95 - back * 0.5, 1.95 - sw), 7)];
}

function skirtLeaf(c: LookCtx, k: number): V2[] {
  const sw = Math.sin(c.t * 0.15 + k) * 6;
  const base = bp(c, (k - 1.5) * c.r.bodyR * 0.45, 2);
  const tip = add(base, bdir(c, 255 + k * 10 + sw - (k < 2 ? 25 : -5)), 16);
  return leaf(base, tip, 6);
}

export const SPROUT_LOOK: Look = {
  arm: (c) => c.pal.skin,
  leg: (c) => c.pal.dark,
  hand: (c) => c.pal.skin,
  foot: (c) => mix(c.pal.dark, INK, 0.2),
  behind(ctx, c, outline) {
    for (let k = 0; k < 4; k++) shape(ctx, skirtLeaf(c, k), k % 2 ? c.pal.main : mix(c.pal.main, INK, 0.15), outline);
  },
  torso(ctx, c) {
    const { P, r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    line(ctx, [P.hip, P.neck], b * 2, pal.skin);
    line(ctx, [bp(c, b * 0.45, T * 0.1), bp(c, b * 0.45, T * 0.8)], b * 0.8, pal.light);
    for (let k = 0; k < 5; k++) {
      const p = bp(c, (k - 2) * b * 0.42, T + 2);
      disc(ctx, p, 4.2, INK);
      disc(ctx, p, 3.2, pal.accent);
    }
  },
  head(ctx, c, outline) {
    const hr = c.r.headR;
    band(ctx, [hp(c, -0.1, 0.9), hp(c, -0.1, 1.3)], 3, c.pal.dark, outline);
    for (const l of headLeaves(c)) shape(ctx, l, c.pal.main, outline);
    disc(ctx, c.P.head, hr * 1.05 + (outline ? OUT : 0), outline ? INK : c.pal.skin);
    if (outline) {
      disc(ctx, hp(c, 0.95, 2.0), 5 + OUT, INK);
      return;
    }
    for (const l of headLeaves(c)) line(ctx, [l[0], l[2]], 1.6, c.pal.light);
    const bud = hp(c, 0.95, 2.0);
    for (let k = 0; k < 5; k++) disc(ctx, add(bud, { x: Math.cos(k * 1.26) * 3.5, y: Math.sin(k * 1.26) * 3.5 }), 3, c.pal.accent);
    disc(ctx, bud, 2.4, '#ffe066');
    line(ctx, [hp(c, -0.6, 0.75), hp(c, 0.4, 0.95)], 2, mix(c.pal.skin, '#ffffff', 0.4));
  },
  face(ctx, c) {
    const hr = c.r.headR;
    cartoonEyes(ctx, c, [[hp(c, 0.5, 0.05), hr * 0.23], [hp(c, 0.05, 0.08), hr * 0.19]]);
    if (mood(c).hurt) return;
    ctx.save();
    ctx.globalAlpha *= 0.4;
    disc(ctx, hp(c, 0.7, -0.35), hr * 0.14, c.pal.accent);
    ctx.restore();
    const mc = hp(c, 0.45, -0.38);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mc.x, mc.y, hr * 0.12, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
  },
};
