import { INK, mix } from '../color';
import { band, bp, cartoonEyes, disc, hp, line, mood, OUT, shape, type Look, type LookCtx } from '../lookKit';
import type { V2 } from '../../sim/math';

/** GALE — wind wanderer. Pointed hood, streaming ribbons, swirl emblem. */
function hood(c: LookCtx): V2[] {
  const sweep = Math.max(0, Math.min(1, c.sp / 12));
  const fl = Math.sin(c.t * 0.15) * 0.15;
  return [
    [0.78, 0.68], [0.35, 1.2], [-0.45, 1.28], [-1.2, 1.02], [-2.15 - sweep * 0.6, 0.75 + fl - sweep * 0.2],
    [-1.25, 0.3], [-1.02, -0.35], [-0.55, -0.88], [-0.1, -0.52], [-0.05, 0.32], [0.42, 0.6],
  ].map(([u, v]) => hp(c, u, v));
}

function ribbon(c: LookCtx, phase: number, len: number): V2[] {
  const T = c.r.torso;
  const A = bp(c, -c.r.bodyR * 0.4, T + 1);
  const sp = Math.max(-2, Math.min(14, c.sp));
  const pts: V2[] = [];
  for (let k = 0; k <= 9; k++) {
    const s = k / 9;
    const along = -s * len - sp * s * 1.4;
    const wave = Math.sin(c.t * 0.2 - s * 5 + phase) * (2 + s * 9);
    pts.push(bp(c, -c.r.bodyR * 0.4 + along, T + 1 - s * 10 + wave));
  }
  pts[0] = A;
  return pts;
}

export const GALE_LOOK: Look = {
  arm: (c) => c.pal.main,
  leg: (c) => mix(c.pal.main, c.pal.dark, 0.55),
  hand: (c) => c.pal.skin,
  foot: (c) => c.pal.light,
  behind(ctx, c, outline) {
    const T = c.r.torso;
    band(ctx, ribbon(c, 0, T * 2.3), 6, c.pal.accent, outline);
    band(ctx, ribbon(c, 1.6, T * 1.8), 5, c.pal.light, outline);
    if (!outline && !c.f.grounded) {
      ctx.save();
      ctx.globalAlpha *= 0.45;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (const k of [0, 1]) {
        const ctr = bp(c, 0, -8 - k * 10);
        ctx.beginPath();
        ctx.ellipse(ctr.x, ctr.y, 18 - k * 5, 5, 0, c.t * 0.25 + k * 2, c.t * 0.25 + k * 2 + 3.6);
        ctx.stroke();
      }
      ctx.restore();
    }
  },
  torso(ctx, c) {
    const { P, r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    line(ctx, [P.hip, P.neck], b * 2, pal.main);
    const ctr = bp(c, b * 0.35, T * 0.55);
    ctx.strokeStyle = pal.light;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(ctr.x, ctr.y, b * 0.5, 0.3, 5.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ctr.x, ctr.y, b * 0.22, 2.0, 6.6);
    ctx.stroke();
    line(ctx, [bp(c, -b, 4), bp(c, b, 7)], 5, pal.accent);
  },
  head(ctx, c, outline) {
    const hr = c.r.headR;
    const h = hood(c);
    if (outline) {
      shape(ctx, h, INK, true);
      disc(ctx, c.P.head, hr + OUT, INK);
      return;
    }
    disc(ctx, c.P.head, hr, c.pal.skin);
    shape(ctx, h, c.pal.main, false);
    line(ctx, [h[0], h[10], h[9], h[8], h[7]], 2.5, mix(c.pal.main, c.pal.dark, 0.6));
    line(ctx, [hp(c, 0.2, 1.08), hp(c, -0.8, 1.1)], 2, mix(c.pal.main, '#ffffff', 0.45));
  },
  face(ctx, c) {
    const hr = c.r.headR;
    cartoonEyes(ctx, c, [[hp(c, 0.55, 0.08), hr * 0.21], [hp(c, 0.16, 0.1), hr * 0.17]]);
    const m = mood(c);
    if (m.hurt) {
      line(ctx, [hp(c, 0.5, -0.45), hp(c, 0.8, -0.42)], 2.5, INK);
      return;
    }
    const mc = hp(c, 0.62, -0.32);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(mc.x, mc.y, hr * 0.18, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  },
};
