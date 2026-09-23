import { INK, mix } from '../color';
import { add, bp, disc, hp, line, mood, OUT, poly, shape, type Look, type LookCtx } from '../lookKit';
import type { V2 } from '../../sim/math';

/** DIGBY — blocky miner. Cube head, hard hat with lamp, plaid shirt + overalls, iron pickaxe. */
function quad(c: LookCtx, u0: number, v0: number, u1: number, v1: number): V2[] {
  return [hp(c, u0, v0), hp(c, u1, v0), hp(c, u1, v1), hp(c, u0, v1)];
}

function block(c: LookCtx): V2[] {
  const b = c.r.bodyR;
  const T = c.r.torso;
  return [bp(c, -b, -6), bp(c, b, -6), bp(c, b, T + 4), bp(c, -b, T + 4)];
}

function hat(c: LookCtx): V2[] {
  return [[-1.2, 0.72], [1.35, 0.72], [1.05, 1.12], [0.55, 1.42], [-0.55, 1.42], [-1.02, 1.12]].map(([u, v]) => hp(c, u, v));
}

export const DIGBY_LOOK: Look = {
  arm: (c) => c.pal.main,
  leg: (c) => c.pal.dark,
  hand: (c) => c.pal.skin,
  foot: () => '#4a2e18',
  behind(ctx, c, outline) {
    if (outline) shape(ctx, block(c), INK, true);
  },
  torso(ctx, c) {
    const { r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    poly(ctx, block(c), pal.main, false);
    const plaid = mix(pal.main, INK, 0.28);
    for (const f of [-0.45, 0.35]) line(ctx, [bp(c, f * b, T * 0.5), bp(c, f * b, T + 3)], 2.5, plaid);
    line(ctx, [bp(c, -b, T * 0.78), bp(c, b, T * 0.78)], 2.5, plaid);
    // overalls bib + straps
    poly(ctx, [bp(c, -b, -6), bp(c, b, -6), bp(c, b, T * 0.4), bp(c, b * 0.6, T * 0.62), bp(c, -b * 0.6, T * 0.62), bp(c, -b, T * 0.4)], pal.dark, false);
    line(ctx, [bp(c, b * 0.5, T * 0.6), bp(c, b * 0.55, T + 3)], 4, pal.dark);
    line(ctx, [bp(c, -b * 0.5, T * 0.6), bp(c, -b * 0.55, T + 3)], 4, mix(pal.dark, INK, 0.25));
    disc(ctx, bp(c, b * 0.5, T * 0.55), 2.6, pal.light);
    line(ctx, [bp(c, b * 0.1, T * 0.1), bp(c, b * 0.7, T * 0.1)], 3, mix(pal.dark, INK, 0.35));
  },
  head(ctx, c, outline) {
    const cube = quad(c, -1, -1, 1, 1);
    shape(ctx, cube, INK, outline);
    shape(ctx, hat(c), INK, outline);
    if (outline) return;
    poly(ctx, cube, c.pal.skin, false);
    poly(ctx, quad(c, -1, -0.35, -0.5, 0.75), '#5a3a22', false);
    poly(ctx, quad(c, -1, 0.5, 1, 0.75), '#5a3a22', false);
    poly(ctx, quad(c, -0.2, -1, 0.9, -0.72), mix(c.pal.skin, INK, 0.18), false);
    poly(ctx, hat(c), c.pal.light, false);
    line(ctx, [hp(c, -1.15, 0.78), hp(c, 1.3, 0.78)], 3, mix(c.pal.light, INK, 0.3));
    line(ctx, [hp(c, -0.4, 1.35), hp(c, 0.4, 1.35)], 2.5, mix(c.pal.light, '#ffffff', 0.5));
    const lamp = hp(c, 0.95, 1.02);
    disc(ctx, lamp, 4.6, INK);
    disc(ctx, lamp, 3.4, '#fff6c8');
  },
  face(ctx, c) {
    const m = mood(c);
    if (m.hurt || m.blink) {
      line(ctx, [hp(c, 0.15, 0.2), hp(c, 0.45, 0.2)], 2.4, INK);
      line(ctx, [hp(c, 0.6, 0.2), hp(c, 0.9, 0.2)], 2.4, INK);
    } else {
      for (const u of [0.15, 0.6]) {
        poly(ctx, quad(c, u, 0.08, u + 0.32, 0.34), '#ffffff', false);
        poly(ctx, quad(c, u + 0.16, 0.08, u + 0.32, 0.34), c.pal.eye, false);
      }
    }
    poly(ctx, quad(c, 0.35, -0.55, 0.85, -0.42), mix(c.pal.skin, INK, 0.55), false);
  },
  held(ctx, c) {
    const { P } = c;
    if ((c.r.weapon?.len ?? 0) <= 0) return;
    const a = (P.w * Math.PI) / 180;
    const d = { x: Math.cos(a), y: Math.sin(a) };
    const perp = { x: -d.y, y: d.x };
    const tip = P.wTip;
    const butt = add(P.wBase, d, -8);
    line(ctx, [butt, tip], 5 + OUT * 1.4, INK);
    line(ctx, [butt, tip], 5, '#8a5a2a');
    const head = [
      add(add(tip, perp, 18), d, -9), add(add(tip, perp, 5), d, 3), add(add(tip, perp, -5), d, 3),
      add(add(tip, perp, -18), d, -9), add(add(tip, perp, -4), d, -3), add(add(tip, perp, 4), d, -3),
    ];
    poly(ctx, head, '#aab6c4', true);
    line(ctx, [add(add(tip, perp, 15), d, -6), add(add(tip, perp, 4), d, 1)], 1.8, '#e6edf5');
  },
};
