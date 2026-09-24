import { INK, mix } from '../color';
import { add, bdir, bp, cartoonEyes, disc, hp, line, mood, OUT, poly, shape, weaponFrame, type Look, type LookCtx } from '../lookKit';
import type { V2 } from '../../sim/math';

/** KOI — tide dancer. Fin-like flowing hair with koi spots, scaled leotard, tail fins, water ribbon. */
function hair(c: LookCtx): V2[] {
  const w = Math.sin(c.t * 0.14) * 0.15;
  const back = Math.max(0, Math.min(1, c.sp / 12)) * 0.5;
  return [
    [0.75, 0.75], [0.1, 1.3], [-0.9, 1.3], [-1.9 - back + w, 1.0 + w], [-1.3, 0.55],
    [-2.1 - back - w, 0.15 - w], [-1.05, -0.15], [-0.95, 0.35], [-0.1, 0.8],
  ].map(([u, v]) => hp(c, u, v));
}

function fin(c: LookCtx, k: number): V2[] {
  const sw = Math.sin(c.t * 0.16 + k * 1.3) * 10;
  const base = bp(c, -c.r.bodyR * 0.6, 2);
  const d = bdir(c, 225 + k * 30 + sw - Math.max(0, c.sp) * 1.5);
  const perp = { x: -d.y, y: d.x };
  const len = c.r.torso * 1.1;
  return [add(base, perp, 3), add(add(base, d, len), perp, 12), add(base, d, len * 0.7), add(add(base, d, len), perp, -12), add(base, perp, -3)];
}

export const KOI_LOOK: Look = {
  arm: (c) => c.pal.skin,
  leg: (c) => mix(c.pal.main, c.pal.dark, 0.3),
  hand: (c) => c.pal.skin,
  foot: (c) => c.pal.light,
  behind(ctx, c, outline) {
    for (const k of [0, 1]) {
      const pts = fin(c, k);
      shape(ctx, pts, k ? mix(c.pal.main, INK, 0.12) : c.pal.main, outline);
      if (!outline) line(ctx, [pts[0], pts[2]], 2, c.pal.light);
    }
  },
  torso(ctx, c) {
    const { P, r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    line(ctx, [P.hip, P.neck], b * 2, pal.main);
    ctx.strokeStyle = mix(pal.main, '#ffffff', 0.45);
    ctx.lineWidth = 1.6;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const p = bp(c, (col - 0.3) * b * 0.8 + (row % 2) * 3, T * (0.25 + row * 0.22));
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
    }
    line(ctx, [bp(c, -b, 3), bp(c, b, 5)], 4.5, pal.accent);
  },
  head(ctx, c, outline) {
    const hr = c.r.headR;
    const h = hair(c);
    if (outline) {
      shape(ctx, h, INK, true);
      disc(ctx, c.P.head, hr + OUT, INK);
      return;
    }
    disc(ctx, c.P.head, hr, c.pal.skin);
    poly(ctx, h, c.pal.main, false);
    for (const [u, v, s] of [[-0.6, 1.0, 0.22], [-1.4, 0.8, 0.18], [-1.3, 0.15, 0.16]]) disc(ctx, hp(c, u, v), hr * s, c.pal.dark);
    line(ctx, [hp(c, -0.2, 1.1), hp(c, -1.5, 0.95)], 1.6, c.pal.light);
    line(ctx, [hp(c, -0.8, 0.5), hp(c, -1.7, 0.2)], 1.6, c.pal.light);
  },
  face(ctx, c) {
    const hr = c.r.headR;
    cartoonEyes(ctx, c, [[hp(c, 0.52, 0.12), hr * 0.21], [hp(c, 0.12, 0.14), hr * 0.17]]);
    if (!mood(c).hurt) {
      const mc = hp(c, 0.62, -0.36);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mc.x, mc.y, hr * 0.14, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    }
  },
  held(ctx, c) {
    const w = weaponFrame(c);
    if (w) {
      const { d, n, base, tip } = w;
      const shaftEnd = add(tip, d, -16);
      const butt = add(base, d, -18);
      line(ctx, [butt, shaftEnd], 4 + OUT * 1.4, INK);
      line(ctx, [butt, shaftEnd], 4, '#e8a86a');
      line(ctx, [add(base, d, -3), add(base, d, 3)], 5.5, c.pal.accent);
      const cross = add(tip, d, -14);
      const steel = '#bfeef6';
      // three prongs with barbed tips
      const prongs: [number, number][] = [[-8, 12], [0, 16], [8, 12]];
      line(ctx, [add(cross, n, -9), add(cross, n, 9)], 4 + OUT, INK);
      for (const [o, l] of prongs) line(ctx, [add(cross, n, o), add(add(cross, n, o), d, l)], 3.4 + OUT, INK);
      line(ctx, [add(cross, n, -9), add(cross, n, 9)], 4, steel);
      for (const [o, l] of prongs) {
        const a = add(cross, n, o);
        const b = add(a, d, l);
        line(ctx, [a, b], 3.4, steel);
        poly(ctx, [add(b, n, 3), add(b, d, 5), add(b, n, -3)], steel, false);
      }
      disc(ctx, cross, 3.2, c.pal.accent);
    }
    if (c.f.state !== 'move') return;
    const h = c.P.hdF;
    ctx.save();
    ctx.globalAlpha *= 0.7;
    ctx.strokeStyle = c.pal.accent;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(h.x, h.y, 14, c.t * 0.3, c.t * 0.3 + 4.2);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  },
};
