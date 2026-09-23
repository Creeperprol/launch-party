import { INK, mix } from '../color';
import { star } from '../fx';
import { add, bp, cartoonEyes, disc, hp, line, mood, OUT, poly, shape, type Look, type LookCtx } from '../lookKit';
import type { V2 } from '../../sim/math';

/** MIRA — star witch. Bent pointed hat, long hair, flared dress, star-tipped staff. */
const hairCol = (c: LookCtx) => mix(c.pal.dark, INK, 0.15);

function hatCone(c: LookCtx): V2[] {
  const sw = Math.sin(c.t * 0.08) * 0.12;
  const back = Math.max(0, Math.min(1, c.sp / 12)) * 0.4;
  return [[-0.85, 0.72], [0.9, 0.72], [0.25, 1.85], [-1.25 - back + sw, 2.55 + sw], [-0.4, 1.8]].map(([u, v]) => hp(c, u, v));
}

function brim(c: LookCtx): V2[] {
  return [[-1.65, 0.55], [1.75, 0.55], [1.45, 0.85], [-1.4, 0.85]].map(([u, v]) => hp(c, u, v));
}

function hairBack(c: LookCtx): V2[] {
  const sw = Math.sin(c.t * 0.1) * 0.12;
  const back = Math.max(0, Math.min(1, c.sp / 12)) * 0.7;
  return [[-0.2, 0.7], [-1.05, 0.5], [-1.4 - back + sw, -0.6], [-1.3 - back * 1.3 + sw, -1.9], [-0.55, -1.2], [-0.3, -0.4]].map(([u, v]) => hp(c, u, v));
}

function skirt(c: LookCtx): V2[] {
  const b = c.r.bodyR;
  const T = c.r.torso;
  const sw = Math.sin(c.t * 0.12) * 2;
  return [bp(c, -b * 0.9, T * 0.45), bp(c, b * 0.9, T * 0.45), bp(c, b * 1.7 + sw, -12), bp(c, 0, -15), bp(c, -b * 1.8 - Math.max(0, c.sp) + sw, -11)];
}

export const MIRA_LOOK: Look = {
  arm: (c) => c.pal.main,
  leg: (c) => mix(c.pal.dark, INK, 0.1),
  hand: (c) => c.pal.skin,
  foot: (c) => mix(c.pal.dark, INK, 0.4),
  behind(ctx, c, outline) {
    shape(ctx, hairBack(c), hairCol(c), outline);
    if (outline) shape(ctx, skirt(c), INK, true);
  },
  torso(ctx, c) {
    const { P, r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    poly(ctx, skirt(c), pal.main, false);
    line(ctx, [skirt(c)[4], skirt(c)[3], skirt(c)[2]], 3, pal.accent);
    line(ctx, [P.hip, P.neck], b * 2, pal.main);
    line(ctx, [bp(c, -b, T * 0.42), bp(c, b, T * 0.42)], 4, mix(pal.dark, INK, 0.2));
    ctx.fillStyle = pal.accent;
    const s = bp(c, b * 0.4, T * 0.72);
    star(ctx, s.x, s.y, 5, 2.2, 0, 5);
  },
  head(ctx, c, outline) {
    const hr = c.r.headR;
    if (outline) {
      disc(ctx, c.P.head, hr + OUT, INK);
      shape(ctx, hatCone(c), INK, true);
      shape(ctx, brim(c), INK, true);
      return;
    }
    disc(ctx, c.P.head, hr, c.pal.skin);
    poly(ctx, [hp(c, 0.95, 0.6), hp(c, 0.55, 0.15), hp(c, 0.2, 0.5), hp(c, -0.3, 0.2), hp(c, -0.95, 0.4), hp(c, -0.9, 0.7)], hairCol(c), false);
    const hat = mix(c.pal.main, INK, 0.35);
    poly(ctx, hatCone(c), hat, false);
    poly(ctx, brim(c), hat, false);
    line(ctx, [hp(c, -0.8, 0.95), hp(c, 0.82, 0.95)], 4, c.pal.accent);
    ctx.fillStyle = c.pal.accent;
    const b = hp(c, 0.1, 0.97);
    star(ctx, b.x, b.y, 5, 2.2, 0.3, 5);
  },
  face(ctx, c) {
    const hr = c.r.headR;
    cartoonEyes(ctx, c, [[hp(c, 0.52, 0.1), hr * 0.2], [hp(c, 0.12, 0.12), hr * 0.16]]);
    if (mood(c).hurt) return;
    ctx.save();
    ctx.globalAlpha *= 0.35;
    disc(ctx, hp(c, 0.55, -0.3), hr * 0.16, '#ff7a9a');
    ctx.restore();
    line(ctx, [hp(c, 0.6, -0.45), hp(c, 0.82, -0.4)], 1.6, INK);
  },
  held(ctx, c) {
    const { P, pal } = c;
    if ((c.r.weapon?.len ?? 0) <= 0) return;
    const a = (P.w * Math.PI) / 180;
    const d = { x: Math.cos(a), y: Math.sin(a) };
    const tip = P.wTip;
    const butt = add(P.wBase, d, -16);
    line(ctx, [butt, add(tip, d, -6)], 4.5 + OUT * 1.4, INK);
    line(ctx, [butt, add(tip, d, -6)], 4.5, '#6a4428');
    const glow = 0.5 + 0.3 * Math.sin(c.t * 0.15);
    ctx.save();
    ctx.globalAlpha *= glow;
    disc(ctx, tip, 13, mix(pal.accent, '#ffffff', 0.4));
    ctx.restore();
    ctx.fillStyle = INK;
    star(ctx, tip.x, tip.y, 11, 5, c.t * 0.03, 5);
    ctx.fillStyle = pal.accent;
    star(ctx, tip.x, tip.y, 8.5, 3.8, c.t * 0.03, 5);
  },
};
