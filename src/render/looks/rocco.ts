import { INK, mix } from '../color';
import { add, bp, cartoonEyes, disc, hp, line, mood, norm, OUT, poly, shape, type Look, type LookCtx } from '../lookKit';
import type { V2 } from '../../sim/math';

/** ROCCO — prize-fighter. Padded headgear, big gloves, trunks with a stripe, mouthguard. */
function headgear(c: LookCtx): V2[] {
  return [[-1.08, -0.35], [-1.1, 0.55], [-0.55, 1.08], [0.45, 1.1], [0.98, 0.62], [0.82, 0.42], [0.3, 0.7], [-0.35, 0.62], [-0.55, -0.35]].map(([u, v]) => hp(c, u, v));
}

function trunks(c: LookCtx): V2[] {
  const b = c.r.bodyR;
  return [bp(c, -b * 1.12, -16), bp(c, b * 1.12, -16), bp(c, b * 1.08, 8), bp(c, -b * 1.08, 8)];
}

export const ROCCO_LOOK: Look = {
  arm: (c) => c.pal.skin,
  leg: (c) => c.pal.skin,
  hand: (c) => c.pal.main,
  foot: (c) => c.pal.light,
  behind(ctx, c, outline) {
    if (outline) shape(ctx, trunks(c), INK, true);
  },
  torso(ctx, c) {
    const { P, r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    line(ctx, [P.hip, P.neck], b * 2, pal.skin);
    const shade = mix(pal.skin, INK, 0.25);
    line(ctx, [bp(c, b * 0.05, T * 0.72), bp(c, b * 0.55, T * 0.66), bp(c, b * 0.95, T * 0.74)], 1.8, shade);
    line(ctx, [bp(c, b * 0.45, T * 0.2), bp(c, b * 0.45, T * 0.5)], 1.5, shade);
    poly(ctx, trunks(c), pal.main, false);
    line(ctx, [bp(c, -b * 1.08, 5), bp(c, b * 1.08, 5)], 5, pal.light);
    line(ctx, [bp(c, b * 0.75, 3), bp(c, b * 0.8, -15)], 3.5, pal.accent);
  },
  head(ctx, c, outline) {
    const hr = c.r.headR;
    disc(ctx, c.P.head, hr + (outline ? OUT : 0), outline ? INK : c.pal.skin);
    shape(ctx, headgear(c), c.pal.main, outline);
    if (outline) return;
    line(ctx, [hp(c, -0.85, 0.75), hp(c, -0.3, 1.0), hp(c, 0.4, 1.0)], 2.2, mix(c.pal.main, '#ffffff', 0.35));
    disc(ctx, hp(c, -0.75, 0.15), hr * 0.18, c.pal.accent);
  },
  face(ctx, c) {
    const hr = c.r.headR;
    cartoonEyes(ctx, c, [[hp(c, 0.55, 0.14), hr * 0.17], [hp(c, 0.17, 0.16), hr * 0.14]]);
    line(ctx, [hp(c, 0.1, 0.38), hp(c, 0.8, 0.3)], 2.6, INK);
    line(ctx, [hp(c, 0.75, 0.05), hp(c, 0.95, -0.08)], 3.2, '#f6ecd8');
    const hurt = mood(c).hurt;
    line(ctx, [hp(c, 0.5, -0.46), hp(c, 0.88, -0.4)], hurt ? 4 : 3.2, hurt ? INK : c.pal.accent);
  },
  front(ctx, c) {
    // trunks cover the top of the front thigh
    const { P, r } = c;
    const mid = { x: P.hipF.x + (P.knF.x - P.hipF.x) * 0.42, y: P.hipF.y + (P.knF.y - P.hipF.y) * 0.42 };
    line(ctx, [P.hipF, mid], r.limbR * 2.5 + OUT * 1.4, INK);
    line(ctx, [P.hipF, mid], r.limbR * 2.5 + 1, c.pal.main);
  },
  held(ctx, c) {
    const { P, r } = c;
    const d = norm(P.hdF.x - P.elF.x, P.hdF.y - P.elF.y);
    const cuff = add(P.hdF, d, -r.handR * 1.05);
    line(ctx, [add(cuff, d, -1.5), add(cuff, d, 1.5)], r.limbR * 2.2 + OUT, INK);
    line(ctx, [add(cuff, d, -1.5), add(cuff, d, 1.5)], r.limbR * 2.2, c.pal.light);
    disc(ctx, add(add(P.hdF, { x: -d.y, y: d.x }, r.handR * 0.4), d, r.handR * 0.2), r.handR * 0.22, mix(c.pal.main, '#ffffff', 0.4));
  },
};
