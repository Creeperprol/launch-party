import { INK, mix } from '../color';
import { add, bp, cartoonEyes, disc, ellipse, hp, line, mood, OUT, poly, type Look, type LookCtx } from '../lookKit';

/** BISCUIT — brawling chef. Puffy toque, big mustache, double-breasted coat, cast-iron pan. */
const PUFFS: [number, number, number][] = [[-0.6, 1.35, 0.55], [0.1, 1.62, 0.62], [0.72, 1.3, 0.5], [0.05, 1.2, 0.6]];

function toque(ctx: CanvasRenderingContext2D, c: LookCtx, outline: boolean): void {
  const hr = c.r.headR;
  const o = outline ? OUT : 0;
  for (const [u, v, s] of PUFFS) disc(ctx, hp(c, u, v), hr * s + o, outline ? INK : '#ffffff');
  const band = [hp(c, -0.92, 0.55), hp(c, 0.95, 0.55), hp(c, 0.95, 1.0), hp(c, -0.92, 1.0)];
  if (outline) poly(ctx, band, INK, true);
  else {
    poly(ctx, band, '#f4f1ea', false);
    line(ctx, [hp(c, -0.3, 0.6), hp(c, -0.3, 0.95)], 1.4, '#d8d2c4');
    line(ctx, [hp(c, 0.35, 0.6), hp(c, 0.35, 0.95)], 1.4, '#d8d2c4');
  }
}

export const BISCUIT_LOOK: Look = {
  arm: (c) => c.pal.main,
  leg: (c) => c.pal.dark,
  hand: (c) => c.pal.skin,
  foot: (c) => mix(c.pal.dark, INK, 0.4),
  torso(ctx, c) {
    const { P, r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    line(ctx, [P.hip, P.neck], b * 2, pal.main);
    for (const f of [0.15, 0.6]) for (const u of [0.45, 0.65, 0.85]) disc(ctx, bp(c, f * b, u * T), 2.2, pal.dark);
    line(ctx, [bp(c, b * 0.45, -6), bp(c, b * 0.45, T * 0.4)], b * 1.1, mix(pal.light, '#e8dcc4', 0.6));
    line(ctx, [bp(c, -b, T * 0.4), bp(c, b, T * 0.4)], 2.5, mix(pal.light, '#e8dcc4', 0.6));
    poly(ctx, [bp(c, -b * 0.3, T + 3), bp(c, b * 0.95, T + 1), bp(c, b * 0.4, T * 0.7)], pal.accent, false);
  },
  head(ctx, c, outline) {
    const hr = c.r.headR;
    toque(ctx, c, outline);
    disc(ctx, c.P.head, hr + (outline ? OUT : 0), outline ? INK : c.pal.skin);
    if (!outline) poly(ctx, [hp(c, -1, 0.1), hp(c, -0.55, 0.1), hp(c, -0.55, 0.6), hp(c, -0.95, 0.6)], '#5a3a22', false);
  },
  face(ctx, c) {
    const hr = c.r.headR;
    cartoonEyes(ctx, c, [[hp(c, 0.55, 0.18), hr * 0.16], [hp(c, 0.18, 0.2), hr * 0.13]]);
    line(ctx, [hp(c, 0.35, 0.42), hp(c, 0.75, 0.4)], 2.2, '#5a3a22');
    disc(ctx, hp(c, 1.0, -0.05), hr * 0.2, mix(c.pal.skin, '#ff6a6a', 0.35));
    const rot = Math.atan2(c.HF.y, c.HF.x);
    const stache = mood(c).hurt ? -0.35 : 0;
    ellipse(ctx, hp(c, 0.95, -0.32), hr * 0.34, hr * 0.14, rot + 0.35 + stache, '#5a3a22', 1.4);
    ellipse(ctx, hp(c, 0.45, -0.3), hr * 0.34, hr * 0.14, rot - 0.35 - stache, '#5a3a22', 1.4);
  },
  held(ctx, c) {
    const { P } = c;
    if ((c.r.weapon?.len ?? 0) <= 0) return;
    const a = (P.w * Math.PI) / 180;
    const d = { x: Math.cos(a), y: Math.sin(a) };
    const tip = P.wTip;
    const neck = add(tip, d, -14);
    line(ctx, [add(P.wBase, d, -4), neck], 5 + OUT * 1.4, INK);
    line(ctx, [add(P.wBase, d, -4), neck], 5, '#2a2a30');
    const ctr = add(tip, d, -2);
    ellipse(ctx, ctr, 15, 12, a, '#3a3a44', OUT * 2);
    ellipse(ctx, ctr, 10.5, 8, a, '#55555f', 0);
    ctx.strokeStyle = '#8a8a96';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(ctr.x, ctr.y, 12, 9, a, 3.6, 4.8);
    ctx.stroke();
  },
};
