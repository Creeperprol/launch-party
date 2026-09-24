import { INK, mix } from '../color';
import { add, bp, disc, hp, line, mood, OUT, poly, shape, weaponFrame, type Look, type LookCtx } from '../lookKit';
import type { V2 } from '../../sim/math';

/** NOX — lantern specter. Tattered hooded cloak, void face with glowing eyes, hanging lantern. */
function cloak(c: LookCtx): V2[] {
  const b = c.r.bodyR;
  const T = c.r.torso;
  const sp = Math.max(-3, Math.min(12, c.sp));
  const low = -c.r.hipH * 0.55;
  const pts: V2[] = [bp(c, -b * 1.1, T + 4), bp(c, b * 1.0, T + 4), bp(c, b * 1.5, T * 0.3)];
  // tattered hem, front to back
  for (let k = 0; k <= 6; k++) {
    const s = k / 6;
    const f = b * 1.7 - s * (b * 3.9 + sp * 1.6);
    const flutter = Math.sin(c.t * 0.18 + k * 1.3) * 4;
    pts.push(bp(c, f, low + (k % 2 ? 10 : 0) + flutter + s * sp * 0.8));
  }
  pts.push(bp(c, -b * 1.6 - sp, T * 0.35));
  return pts;
}

function hood(c: LookCtx): V2[] {
  const sw = Math.sin(c.t * 0.1) * 0.1;
  return [[1.05, 0.55], [0.6, 1.2], [-0.4, 1.3], [-1.55 + sw, 1.1 + sw], [-1.2, 0.3], [-1.15, -0.7], [-0.2, -1.15], [0.9, -0.7]].map(([u, v]) => hp(c, u * 1.1, v * 1.1));
}

function lantern(ctx: CanvasRenderingContext2D, c: LookCtx, h: V2): void {
  const body = { x: h.x, y: h.y - 14 };
  line(ctx, [h, { x: h.x, y: h.y - 4 }], 2, INK);
  const glow = 0.22 + 0.1 * Math.sin(c.t * 0.12);
  ctx.save();
  ctx.globalAlpha *= glow;
  disc(ctx, body, 14, c.pal.accent);
  ctx.restore();
  const frame = [add(body, { x: -6, y: 8 }), add(body, { x: 6, y: 8 }), add(body, { x: 7, y: -8 }), add(body, { x: -7, y: -8 })];
  poly(ctx, frame, mix(c.pal.accent, '#ffffff', 0.55), true);
  line(ctx, [add(body, { x: -8, y: 8 }), add(body, { x: 8, y: 8 })], 3.5, INK);
  line(ctx, [add(body, { x: -9, y: -8 }), add(body, { x: 9, y: -8 })], 3.5, INK);
  disc(ctx, body, 3 + Math.sin(c.t * 0.4), '#ffffff');
}

export const NOX_LOOK: Look = {
  arm: (c) => c.pal.main,
  leg: (c) => mix(c.pal.dark, INK, 0.3),
  hand: (c) => c.pal.skin,
  foot: (c) => mix(c.pal.dark, INK, 0.45),
  behind(ctx, c, outline) {
    shape(ctx, cloak(c), mix(c.pal.main, INK, 0.12), outline);
    if (!outline) lantern(ctx, c, c.P.hdB);
  },
  torso(ctx, c) {
    const { P, r, pal } = c;
    const b = r.bodyR;
    const T = r.torso;
    line(ctx, [P.hip, P.neck], b * 2, pal.main);
    line(ctx, [bp(c, -b, 6), bp(c, b, 8)], 3.5, mix(pal.light, INK, 0.3));
    line(ctx, [bp(c, b * 0.6, 8), bp(c, b * 0.7, -6)], 2.5, mix(pal.light, INK, 0.3));
    const clasp = bp(c, b * 0.3, T + 1);
    disc(ctx, clasp, 4.5, INK);
    disc(ctx, clasp, 3.2, pal.accent);
  },
  head(ctx, c, outline) {
    shape(ctx, hood(c), c.pal.main, outline);
    if (outline) return;
    ctx.fillStyle = '#07050f';
    const v = hp(c, 0.3, -0.1);
    ctx.beginPath();
    ctx.ellipse(v.x, v.y, c.r.headR * 0.78, c.r.headR * 0.85, Math.atan2(c.HU.y, c.HU.x), 0, Math.PI * 2);
    ctx.fill();
    line(ctx, [hp(c, 0.95, 0.6), hp(c, 0.5, 1.15), hp(c, -0.4, 1.28)], 2.2, mix(c.pal.main, '#ffffff', 0.3));
  },
  face(ctx, c) {
    const hr = c.r.headR;
    const m = mood(c);
    const eyes = [hp(c, 0.62, 0.05), hp(c, 0.18, 0.08)];
    if (m.hurt) {
      for (const e of eyes) line(ctx, [{ x: e.x - 3, y: e.y + 3 }, { x: e.x + 3, y: e.y - 3 }], 2, c.pal.eye);
      return;
    }
    const pulse = m.dizzy ? 0.5 + 0.5 * Math.sin(c.t * 0.5) : 1;
    ctx.save();
    ctx.globalAlpha *= 0.35 * pulse;
    for (const e of eyes) disc(ctx, e, hr * 0.32, c.pal.eye);
    ctx.restore();
    ctx.fillStyle = c.pal.eye;
    for (const e of eyes) {
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, hr * 0.1, m.blink ? 1 : hr * 0.17, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  held(ctx, c) {
    const w = weaponFrame(c);
    if (!w) return;
    const { d, n, base, tip } = w;
    const butt = add(base, d, -18);
    line(ctx, [butt, tip], 4.5 + OUT * 1.4, INK);
    line(ctx, [butt, tip], 4.5, '#3a2438');
    line(ctx, [add(base, d, -4), add(base, d, 3)], 6, c.pal.light);
    // crescent blade hooks back from the tip on the -n side
    const down = { x: -n.x, y: -n.y };
    const blade = [
      add(tip, down, -3), add(add(tip, d, -12), down, 13), add(add(tip, d, -30), down, 20), add(add(tip, d, -46), down, 15),
      add(add(tip, d, -30), down, 12), add(add(tip, d, -14), down, 6), add(tip, down, 4),
    ];
    const glow = 0.35 + 0.2 * Math.sin(c.t * 0.12);
    ctx.save();
    ctx.globalAlpha *= glow;
    line(ctx, blade.slice(0, 4), 9, c.pal.accent);
    ctx.restore();
    poly(ctx, blade, '#dfe6ef', true);
    line(ctx, blade.slice(0, 4), 1.8, mix(c.pal.accent, '#ffffff', 0.4));
    disc(ctx, tip, 4 + OUT * 0.6, INK);
    disc(ctx, tip, 4, c.pal.accent);
  },
};
