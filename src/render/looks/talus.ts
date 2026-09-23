import { INK, mix } from '../color';
import { add, bdir, bp, glowSlit, hp, line, mood, poly, shape, type Look, type LookCtx } from '../lookKit';
import type { V2 } from '../../sim/math';

/** TALUS — a walking cliff. Slab torso with glowing magma cracks, boulder head, crystal back. */
function slab(c: LookCtx): V2[] {
  const b = c.r.bodyR;
  const T = c.r.torso;
  return [
    bp(c, -b * 0.85, -6), bp(c, b * 0.8, -6), bp(c, b * 1.15, T * 0.55),
    bp(c, b * 1.05, T + 4), bp(c, b * 0.2, T + 12), bp(c, -b * 0.95, T + 6), bp(c, -b * 1.2, T * 0.5),
  ];
}

function boulder(c: LookCtx): V2[] {
  return [
    [-1.0, -0.6], [-1.1, 0.35], [-0.55, 1.0], [0.35, 1.08], [1.05, 0.55], [1.15, -0.35], [0.55, -0.95], [-0.45, -0.92],
  ].map(([u, v]) => hp(c, u, v));
}

const CRYSTALS: [number, number, number, number, number][] = [
  // body-forward, body-up (fractions of bodyR / torso), angle, length, half-width
  [-0.75, 0.95, 128, 34, 9],
  [-1.05, 0.62, 158, 26, 8],
  [-0.2, 1.08, 104, 24, 7],
];

function crystal(c: LookCtx, k: number): V2[] {
  const [f, u, ang, len, w] = CRYSTALS[k];
  const base = bp(c, f * c.r.bodyR, u * c.r.torso);
  const d = bdir(c, ang);
  const perp = { x: -d.y, y: d.x };
  return [add(base, perp, w), add(add(base, d, len * 0.75), perp, w * 0.55), add(base, d, len), add(add(base, d, len * 0.75), perp, -w * 0.55), add(base, perp, -w)];
}

function glow(c: LookCtx): string {
  return mix(c.pal.accent, '#fff4c0', 0.25 + 0.2 * Math.sin(c.t * 0.08));
}

export const TALUS_LOOK: Look = {
  arm: (c) => c.pal.main,
  leg: (c) => mix(c.pal.main, c.pal.dark, 0.35),
  hand: (c) => mix(c.pal.main, '#ffffff', 0.1),
  foot: (c) => mix(c.pal.dark, INK, 0.15),
  behind(ctx, c, outline) {
    for (let k = 0; k < CRYSTALS.length; k++) {
      const pts = crystal(c, k);
      shape(ctx, pts, c.pal.accent, outline);
      if (!outline) line(ctx, [pts[0], pts[1], pts[2]], 2.5, mix(c.pal.accent, '#ffffff', 0.45));
    }
    if (outline) shape(ctx, slab(c), INK, true);
  },
  torso(ctx, c) {
    const { r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    poly(ctx, slab(c), pal.main, false);
    // chipped edge highlight + shadowed side
    line(ctx, [bp(c, b * 1.0, T * 0.6), bp(c, b * 0.95, T), bp(c, b * 0.2, T + 9)], 4, mix(pal.main, '#ffffff', 0.22));
    line(ctx, [bp(c, -b * 1.05, T * 0.5), bp(c, -b * 0.75, -3)], 5, mix(pal.main, INK, 0.3));
    // magma cracks
    const g = glow(c);
    const cracks: V2[][] = [
      [bp(c, b * 0.1, T * 0.2), bp(c, b * 0.5, T * 0.42), bp(c, b * 0.2, T * 0.62), bp(c, b * 0.6, T * 0.85)],
      [bp(c, -b * 0.6, T * 0.3), bp(c, -b * 0.25, T * 0.5), bp(c, -b * 0.5, T * 0.72)],
    ];
    for (const cr of cracks) {
      line(ctx, cr, 5.5, mix(pal.dark, INK, 0.4));
      line(ctx, cr, 2.6, g);
    }
    // core gem
    const core = bp(c, b * 0.45, T * 0.62);
    poly(ctx, [add(core, c.U, 7), add(core, c.F, 5), add(core, c.U, -7), add(core, c.F, -5)], g, true);
  },
  head(ctx, c, outline) {
    const pts = boulder(c);
    shape(ctx, pts, c.pal.main, outline);
    if (outline) return;
    line(ctx, [hp(c, 0.85, 0.5), hp(c, 0.3, 1.0), hp(c, -0.5, 0.95)], 3, mix(c.pal.main, '#ffffff', 0.25));
    line(ctx, [hp(c, -0.2, -0.3), hp(c, -0.55, 0.15)], 2.5, mix(c.pal.main, INK, 0.35));
    // moss tuft
    poly(ctx, [hp(c, -0.6, 0.95), hp(c, -0.2, 1.3), hp(c, 0.1, 1.05)], '#6fae5a', false);
  },
  face(ctx, c) {
    const hr = c.r.headR;
    line(ctx, [hp(c, -0.15, 0.48), hp(c, 1.1, 0.36)], 6, mix(c.pal.dark, INK, 0.25));
    glowSlit(ctx, c, hp(c, 0.05, 0.14), hp(c, 0.95, 0.1), hr * 0.16, c.pal.eye);
    if (mood(c).hurt) line(ctx, [hp(c, 0.45, -0.5), hp(c, 0.9, -0.45)], 3, INK);
  },
  held(ctx, c) {
    // knuckle ridge on the front fist
    const { P, r } = c;
    const d = { x: P.hdF.x - P.elF.x, y: P.hdF.y - P.elF.y };
    const l = Math.hypot(d.x, d.y) || 1;
    const perp = { x: -d.y / l, y: d.x / l };
    const k = add(P.hdF, { x: d.x / l, y: d.y / l }, r.handR * 0.55);
    line(ctx, [add(k, perp, r.handR * 0.6), add(k, perp, -r.handR * 0.6)], 2.5, mix(c.pal.main, INK, 0.4));
  },
};
