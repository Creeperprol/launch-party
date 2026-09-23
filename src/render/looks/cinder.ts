import { INK, mix } from '../color';
import { bp, cartoonEyes, disc, hp, line, mood, OUT, poly, shape, type Look, type LookCtx } from '../lookKit';
import type { V2 } from '../../sim/math';

/** CINDER — street brawler whose hair is literally on fire. Tank top, wrapped burning fists. */
function flameHair(c: LookCtx): V2[] {
  const sweep = Math.max(0, Math.min(1, c.sp / 12)) * 0.5;
  const f = (k: number) => Math.sin(c.t * 0.35 + k * 1.7) * 0.14;
  return [
    [-0.98, 0.05], [-1.75 - sweep + f(1), 0.95 + f(2)], [-0.95, 0.72],
    [-1.4 - sweep + f(3), 1.75 + f(4)], [-0.5, 1.0], [-0.45 - sweep * 0.6 + f(5), 2.2 + f(6)],
    [0.02, 1.05], [0.4 - sweep * 0.4 + f(7), 1.8 + f(8)], [0.55, 0.88], [1.0 + f(9), 1.05], [0.88, 0.48],
    [0.25, 0.6], [-0.5, 0.42],
  ].map(([u, v]) => hp(c, u, v));
}

function shrink(pts: V2[], o: V2, k: number): V2[] {
  return pts.map((p) => ({ x: o.x + (p.x - o.x) * k, y: o.y + (p.y - o.y) * k }));
}

function fistFlame(ctx: CanvasRenderingContext2D, c: LookCtx, p: V2, size: number): void {
  const fl = Math.sin(c.t * 0.5) * 2;
  const s = size;
  const outer = [
    { x: p.x - 7 * s, y: p.y }, { x: p.x - 5 * s, y: p.y + 10 * s + fl }, { x: p.x - 1 * s, y: p.y + 6 * s },
    { x: p.x + 1 * s, y: p.y + 17 * s - fl }, { x: p.x + 4 * s, y: p.y + 7 * s }, { x: p.x + 7 * s, y: p.y + 11 * s + fl }, { x: p.x + 7 * s, y: p.y },
  ];
  ctx.save();
  ctx.globalAlpha *= 0.9;
  poly(ctx, outer, c.pal.main, false);
  poly(ctx, shrink(outer, { x: p.x, y: p.y + 2 }, 0.55), c.pal.accent, false);
  ctx.restore();
}

export const CINDER_LOOK: Look = {
  arm: (c) => c.pal.skin,
  leg: (c) => c.pal.dark,
  hand: (c) => mix(c.pal.accent, '#ffffff', 0.25),
  foot: (c) => mix(c.pal.dark, INK, 0.45),
  torso(ctx, c) {
    const { P, r, pal } = c;
    const T = r.torso;
    line(ctx, [P.hip, P.neck], r.bodyR * 2, pal.main);
    // flame emblem
    poly(ctx, [
      bp(c, r.bodyR * 0.05, T * 0.28), bp(c, r.bodyR * 0.85, T * 0.3), bp(c, r.bodyR * 0.72, T * 0.62),
      bp(c, r.bodyR * 0.58, T * 0.48), bp(c, r.bodyR * 0.45, T * 0.8), bp(c, r.bodyR * 0.25, T * 0.52), bp(c, r.bodyR * 0.1, T * 0.62),
    ], pal.accent, false);
    line(ctx, [bp(c, -r.bodyR, 4), bp(c, r.bodyR, 4)], 5, mix(pal.dark, INK, 0.35));
  },
  head(ctx, c, outline) {
    const hr = c.r.headR;
    const hair = flameHair(c);
    if (outline) {
      shape(ctx, hair, INK, true);
      disc(ctx, c.P.head, hr + OUT, INK);
      return;
    }
    disc(ctx, c.P.head, hr, c.pal.skin);
    poly(ctx, hair, mix(c.pal.main, c.pal.accent, 0.1), false);
    const core = hp(c, -0.3, 0.85);
    poly(ctx, shrink(hair, core, 0.6), c.pal.accent, false);
    poly(ctx, shrink(hair, core, 0.25), '#fff6c8', false);
  },
  face(ctx, c) {
    const hr = c.r.headR;
    cartoonEyes(ctx, c, [[hp(c, 0.5, 0.1), hr * 0.2], [hp(c, 0.08, 0.12), hr * 0.16]]);
    // fierce brow + smirk
    line(ctx, [hp(c, 0.2, 0.42), hp(c, 0.78, 0.32)], 2.6, INK);
    const hurt = mood(c).hurt;
    line(ctx, [hp(c, 0.45, -0.45), hp(c, 0.7, -0.4), hp(c, 0.85, -0.28)], hurt ? 3 : 1.8, INK);
    // bandage on the cheek
    line(ctx, [hp(c, -0.2, -0.2), hp(c, 0.1, -0.3)], 3.5, '#f6ecd8');
  },
  held(ctx, c) {
    // wrist wrap sits over the front forearm
    const { P } = c;
    const a = { x: P.elF.x + (P.hdF.x - P.elF.x) * 0.72, y: P.elF.y + (P.hdF.y - P.elF.y) * 0.72 };
    disc(ctx, a, c.r.limbR * 1.25, '#f6ecd8');
    const attacking = c.f.state === 'move';
    fistFlame(ctx, c, c.P.hdF, attacking ? 1 : 0.55);
  },
};
