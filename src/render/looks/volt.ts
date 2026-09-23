import { INK, mix } from '../color';
import { band, bp, disc, hp, line, OUT, poly, wob, type Look, type LookCtx } from '../lookKit';
import type { V2 } from '../../sim/math';

/** VOLT — lightning courier. Visored helmet with a bolt crest and a crackling tail. */
function crest(c: LookCtx): V2[] {
  const sweep = Math.max(0, Math.min(1, c.sp / 13));
  return [[0.35, 0.9], [-0.2, 1.55], [-0.4, 1.12], [-1.4 - sweep * 0.5, 1.55 - sweep * 0.3]].map(([u, v]) => hp(c, u, v));
}

function visor(c: LookCtx): V2[] {
  return [[0.0, 0.52], [1.08, 0.36], [1.02, -0.12], [0.12, -0.02]].map(([u, v]) => hp(c, u, v));
}

export const VOLT_LOOK: Look = {
  arm: (c) => c.pal.main,
  leg: (c) => mix(c.pal.main, c.pal.dark, 0.3),
  hand: (c) => c.pal.light,
  foot: (c) => c.pal.accent,
  behind(ctx, c, outline) {
    if (outline) return;
    const { r } = c;
    const speed = Math.min(1, Math.abs(c.sp) / 10);
    const pts: V2[] = [];
    for (let i = 0; i < 6; i++) {
      pts.push(bp(c, -r.bodyR * (1 + i * 0.95) - Math.max(0, c.sp) * i * 0.7, r.torso * 0.15 + (i % 2 ? 7 : -7) + wob(c.t, i) * 4));
    }
    ctx.save();
    ctx.globalAlpha *= 0.15 + 0.85 * speed;
    line(ctx, pts, 6, c.pal.accent);
    line(ctx, pts, 2, '#ffffff');
    ctx.restore();
  },
  torso(ctx, c) {
    const { P, r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    line(ctx, [P.hip, P.neck], b * 2, pal.main);
    line(ctx, [bp(c, -b * 0.95, T * 0.2), bp(c, -b * 0.95, T * 0.9)], 3, mix(pal.main, INK, 0.25));
    const bolt = [bp(c, b * 0.25, T * 0.9), bp(c, b * 0.85, T * 0.55), bp(c, b * 0.35, T * 0.5), bp(c, b * 0.9, T * 0.12)];
    line(ctx, bolt, 4 + OUT, INK);
    line(ctx, bolt, 4, pal.accent);
  },
  head(ctx, c, outline) {
    const hr = c.r.headR;
    band(ctx, crest(c), hr * 0.38, c.pal.accent, outline);
    if (outline) {
      disc(ctx, c.P.head, hr + OUT, INK);
      return;
    }
    disc(ctx, c.P.head, hr, c.pal.main);
    // helmet stripe
    line(ctx, [hp(c, -0.95, 0.2), hp(c, -0.2, 0.95)], 3, c.pal.light);
    // chin guard
    disc(ctx, hp(c, 0.55, -0.55), hr * 0.32, mix(c.pal.main, INK, 0.2));
  },
  face(ctx, c) {
    const v = visor(c);
    poly(ctx, v, '#16233d', false);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    line(ctx, [hp(c, 0.25, 0.36), hp(c, 0.85, 0.26)], 2, '#8fe3ff');
    disc(ctx, hp(c, 0.95, 0.05), 1.6, '#8fe3ff');
  },
  held(ctx, c) {
    if (Math.abs(c.sp) < 7 && c.f.state !== 'move') return;
    const h = c.P.hdF;
    const k = Math.floor(c.t / 3);
    const pts = [h, { x: h.x + 6 + wob(k, 1) * 3, y: h.y + 5 }, { x: h.x + 2, y: h.y + 9 + wob(k, 2) * 2 }, { x: h.x + 9, y: h.y + 15 }];
    line(ctx, pts, 2.2, c.pal.accent);
    line(ctx, pts, 0.9, '#ffffff');
  },
};
