import { INK, mix } from '../color';
import { bp, cartoonEyes, disc, hp, line, mood, OUT, poly, type Look } from '../lookKit';

/** BRUNO — bear wrestler. Round ears, luchador mask, singlet, championship belt. */
export const BRUNO_LOOK: Look = {
  arm: (c) => c.pal.skin,
  leg: (c) => c.pal.skin,
  hand: (c) => mix(c.pal.skin, '#000000', 0.1),
  foot: (c) => mix(c.pal.skin, INK, 0.3),
  behind(ctx, c, outline) {
    const tail = bp(c, -c.r.bodyR * 1.05, 6);
    disc(ctx, tail, 8 + (outline ? OUT : 0), outline ? INK : c.pal.skin);
  },
  torso(ctx, c) {
    const { P, r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    line(ctx, [P.hip, P.neck], b * 2, pal.skin);
    // belly fur
    ctx.fillStyle = pal.light;
    ctx.beginPath();
    const belly = bp(c, b * 0.35, T * 0.5);
    ctx.ellipse(belly.x, belly.y, b * 0.65, T * 0.42, Math.atan2(c.U.y, c.U.x), 0, Math.PI * 2);
    ctx.fill();
    // singlet
    line(ctx, [bp(c, 0, 0), bp(c, 0, T * 0.35)], b * 2, pal.main);
    line(ctx, [bp(c, b * 0.55, T * 0.3), bp(c, b * 0.45, T + 2)], 7, pal.main);
    line(ctx, [bp(c, -b * 0.55, T * 0.3), bp(c, -b * 0.5, T + 2)], 7, mix(pal.main, INK, 0.25));
    // championship belt
    line(ctx, [bp(c, -b, 8), bp(c, b, 8)], 10, mix(pal.accent, INK, 0.15));
    const plate = bp(c, b * 0.55, 8);
    disc(ctx, plate, 9.5, INK);
    disc(ctx, plate, 8, pal.accent);
    disc(ctx, plate, 4, mix(pal.accent, '#ffffff', 0.55));
  },
  head(ctx, c, outline) {
    const hr = c.r.headR;
    const o = outline ? OUT : 0;
    const col = (fill: string) => (outline ? INK : fill);
    for (const [u, v] of [[-0.6, 0.82], [0.25, 0.95]]) {
      disc(ctx, hp(c, u, v), hr * 0.36 + o, col(c.pal.skin));
      if (!outline) disc(ctx, hp(c, u, v), hr * 0.18, mix(c.pal.skin, '#ff9aa0', 0.35));
    }
    disc(ctx, c.P.head, hr + o, col(c.pal.skin));
    disc(ctx, hp(c, 0.62, -0.32), hr * 0.46 + o, col(c.pal.light));
    if (outline) return;
    // luchador mask over the eyes
    const mask = [[-0.95, 0.05], [-0.8, 0.62], [0.2, 0.72], [1.02, 0.42], [0.98, 0.02], [0.3, -0.05]].map(([u, v]) => hp(c, u, v));
    poly(ctx, mask, c.pal.main, false);
    line(ctx, [hp(c, -0.8, 0.62), hp(c, 0.2, 0.72), hp(c, 1.02, 0.42)], 2.5, c.pal.accent);
    poly(ctx, [hp(c, -0.2, 0.68), hp(c, 0.05, 1.0), hp(c, 0.3, 0.7)], c.pal.accent, false);
    disc(ctx, hp(c, 1.0, -0.15), hr * 0.17, INK);
  },
  face(ctx, c) {
    const hr = c.r.headR;
    const e = hp(c, 0.58, 0.3);
    disc(ctx, e, hr * 0.22, '#ffffff');
    cartoonEyes(ctx, c, [[e, hr * 0.14]], INK);
    line(ctx, [hp(c, 0.15, 0.48), hp(c, 0.85, 0.45)], 2.4, INK);
    const hurt = mood(c).hurt;
    line(ctx, [hp(c, 0.55, -0.55), hp(c, 0.95, -0.5)], hurt ? 3 : 2, INK);
  },
};
