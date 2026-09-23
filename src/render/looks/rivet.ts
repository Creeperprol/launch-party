import { INK, mix } from '../color';
import { add, band, bp, disc, glowSlit, hp, line, mood, norm, OUT, poly, shape, type Look, type LookCtx } from '../lookKit';
import type { V2 } from '../../sim/math';

/** RIVET — scrap robot. Boxy chassis, antenna, visor eye, twin-can jetpack, drill arm. */
function chassis(c: LookCtx): V2[] {
  const b = c.r.bodyR;
  const T = c.r.torso;
  return [bp(c, -b * 0.9, -6), bp(c, b * 0.9, -6), bp(c, b * 1.05, T * 0.2), bp(c, b * 1.05, T + 4), bp(c, -b * 1.05, T + 4), bp(c, -b * 1.05, T * 0.2)];
}

function skull(c: LookCtx): V2[] {
  return [[-1, -0.7], [-0.75, -1], [0.85, -1], [1.1, -0.7], [1.1, 0.75], [0.85, 1], [-0.75, 1], [-1, 0.75]].map(([u, v]) => hp(c, u, v));
}

function jetting(c: LookCtx): boolean {
  return (c.f.state === 'move' && c.f.move?.id === 'uspecial') || (c.f.state === 'air' && c.f.vy < -4);
}

export const RIVET_LOOK: Look = {
  arm: (c) => c.pal.main,
  leg: (c) => mix(c.pal.main, c.pal.dark, 0.45),
  hand: (c) => mix(c.pal.main, '#ffffff', 0.2),
  foot: (c) => c.pal.dark,
  behind(ctx, c, outline) {
    const { r } = c;
    const b = r.bodyR;
    const T = r.torso;
    for (const k of [0, 1]) {
      const f = -b * (1.15 + k * 0.45);
      const top = bp(c, f, T * 0.95);
      const bot = bp(c, f, T * 0.25);
      band(ctx, [bot, top], 13, k ? mix(c.pal.dark, INK, 0.2) : c.pal.dark, outline);
      if (!outline) {
        line(ctx, [bp(c, f, T * 0.7), bp(c, f, T * 0.8)], 13, c.pal.accent);
        if (jetting(c)) {
          const fl = 14 + Math.sin(c.t * 1.4 + k) * 5;
          const d = { x: -c.U.x, y: -c.U.y };
          const perp = { x: -d.y, y: d.x };
          const base = add(bot, d, 3);
          poly(ctx, [add(base, perp, 6), add(base, d, fl * 1.6), add(base, perp, -6)], '#ffb03b', false);
          poly(ctx, [add(base, perp, 3), add(base, d, fl), add(base, perp, -3)], '#fff6c8', false);
        }
      }
    }
    if (outline) shape(ctx, chassis(c), INK, true);
  },
  torso(ctx, c) {
    const { r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    poly(ctx, chassis(c), pal.main, false);
    poly(ctx, [bp(c, -b * 0.35, T * 0.3), bp(c, b * 0.8, T * 0.3), bp(c, b * 0.8, T * 0.85), bp(c, -b * 0.35, T * 0.85)], pal.dark, false);
    const g = bp(c, b * 0.22, T * 0.58);
    disc(ctx, g, 6.5, INK);
    disc(ctx, g, 5, pal.light);
    line(ctx, [g, add(g, norm(c.F.x + c.U.x, c.F.y + c.U.y), 4.5)], 1.6, pal.accent);
    for (const [f, u] of [[-0.8, 0.1], [0.85, 0.1], [-0.8, 0.95], [0.85, 0.95]]) disc(ctx, bp(c, f * b, u * T), 2.2, mix(pal.main, '#ffffff', 0.45));
  },
  head(ctx, c, outline) {
    const ant = [hp(c, -0.25, 0.95), hp(c, -0.45, 1.75)];
    band(ctx, ant, 2.5, mix(c.pal.main, INK, 0.3), outline);
    const bulb = hp(c, -0.45, 1.8);
    disc(ctx, bulb, 4.5 + (outline ? OUT : 0), outline ? INK : Math.floor(c.t / 20) % 2 ? c.pal.accent : mix(c.pal.accent, '#ffffff', 0.5));
    shape(ctx, skull(c), c.pal.main, outline);
    if (outline) return;
    line(ctx, [hp(c, -0.95, 0.85), hp(c, 0.6, 0.85)], 2.5, mix(c.pal.main, '#ffffff', 0.4));
    poly(ctx, [hp(c, -0.05, 0.42), hp(c, 1.08, 0.42), hp(c, 1.08, -0.12), hp(c, -0.05, -0.12)], '#15182a', false);
  },
  face(ctx, c) {
    const hr = c.r.headR;
    glowSlit(ctx, c, hp(c, 0.2, 0.15), hp(c, 0.9, 0.15), hr * 0.2, c.pal.eye);
    const grill = mix(c.pal.main, INK, 0.45);
    for (const u of [0.35, 0.6, 0.85]) line(ctx, [hp(c, u, -0.45), hp(c, u, -0.75)], 2, grill);
    if (mood(c).dizzy) disc(ctx, hp(c, -0.45, 1.8), 6, '#ffffff');
  },
  held(ctx, c) {
    const { P, r } = c;
    const d = norm(P.hdF.x - P.elF.x, P.hdF.y - P.elF.y);
    const perp = { x: -d.y, y: d.x };
    const base = add(P.hdF, d, r.handR * 0.3);
    const len = r.handR * 2.4;
    const tip = add(base, d, len);
    poly(ctx, [add(base, perp, r.handR * 0.95), tip, add(base, perp, -r.handR * 0.95)], '#c8d0da', true);
    const spin = c.f.state === 'move' ? (c.t * 0.5) % 1 : 0.3;
    for (let k = 0; k < 3; k++) {
      const s = (k + spin) / 3.2;
      const w = r.handR * 0.95 * (1 - s);
      const p = add(base, d, len * s);
      line(ctx, [add(p, perp, w), add(add(p, d, 3), perp, -w)], 1.6, '#7a8696');
    }
  },
};
