import type { AnimKey, MoveDef, PosePoint, Rig } from './defs';
import { DEG, clamp, ease, lerp, type V2 } from './math';

/**
 * Procedural rig posing. The same pose drives hitbox attachment, hurtboxes,
 * and rendering, so a striking limb always sits on its hitbox.
 * Local space: +x forward (facing), +y up, feet at (0, 0).
 */
export interface PoseT {
  hx: number;
  hy: number;
  lean: number;
  hFx: number;
  hFy: number;
  hBx: number;
  hBy: number;
  fFx: number;
  fFy: number;
  fBx: number;
  fBy: number;
  w: number;
  spin: number;
}

export interface Resolved {
  hip: V2;
  neck: V2;
  head: V2;
  center: V2;
  shF: V2;
  shB: V2;
  elF: V2;
  elB: V2;
  hdF: V2;
  hdB: V2;
  hipF: V2;
  hipB: V2;
  knF: V2;
  knB: V2;
  ftF: V2;
  ftB: V2;
  wBase: V2;
  wTip: V2;
  lean: number;
  spin: number;
  w: number;
}

export interface PoseCtx {
  state: string;
  sf: number;
  t: number;
  grounded: boolean;
  /** Horizontal speed along facing (u/frame). */
  fwd: number;
  /** World vertical speed (+ = falling). */
  vy: number;
  move: { def: MoveDef; frame: number; vars?: Record<string, number> } | null;
  /** Frames since the last midair jump. */
  dj: number;
  width: number;
  height: number;
}

export function blankPose(): PoseT {
  return { hx: 0, hy: 0, lean: 0, hFx: 0, hFy: 0, hBx: 0, hBy: 0, fFx: 0, fFy: 0, fBx: 0, fBy: 0, w: 0, spin: 0 };
}

function reach(r: Rig): number {
  return r.arm1 + r.arm2;
}

/** Neutral standing pose, used as the base for grounded moves. */
export function standBase(r: Rig, out: PoseT = blankPose()): PoseT {
  const a = reach(r);
  out.hx = 0;
  out.hy = r.hipH * 0.95;
  out.lean = 6;
  out.hFx = a * 0.5 + 3;
  out.hFy = r.hipH + r.torso * 0.6;
  out.hBx = -a * 0.18;
  out.hBy = r.hipH + r.torso * 0.45;
  out.fFx = r.hipH * 0.28;
  out.fFy = 0;
  out.fBx = -r.hipH * 0.28;
  out.fBy = 0;
  out.w = r.weapon?.rest ?? -40;
  out.spin = 0;
  return out;
}

/** Neutral airborne pose, used as the base for aerials. */
export function airBase(r: Rig, out: PoseT = blankPose()): PoseT {
  const a = reach(r);
  out.hx = 0;
  out.hy = r.hipH;
  out.lean = 4;
  out.hFx = a * 0.45;
  out.hFy = r.hipH + r.torso * 0.75;
  out.hBx = -a * 0.35;
  out.hBy = r.hipH + r.torso * 0.8;
  out.fFx = r.hipH * 0.3;
  out.fFy = r.hipH * 0.3;
  out.fBx = -r.hipH * 0.22;
  out.fBy = r.hipH * 0.18;
  out.w = r.weapon?.rest ?? -25;
  out.spin = 0;
  return out;
}

function statePose(r: Rig, c: PoseCtx, p: PoseT): void {
  const a = reach(r);
  const L = r.leg1 + r.leg2;
  switch (c.state) {
    case 'idle':
    case 'respawn': {
      standBase(r, p);
      const b = Math.sin(c.t * 0.09);
      p.hy += b * 1.2;
      p.hFy += b * 1.6;
      p.hBy += b * 1.4;
      if (c.state === 'respawn') {
        p.hFx = a * 0.6;
        p.hFy = r.hipH + r.torso * 1.1;
        p.hBx = -a * 0.6;
        p.hBy = r.hipH + r.torso * 1.1;
      }
      return;
    }
    case 'walk':
    case 'dash':
    case 'run': {
      standBase(r, p);
      const running = c.state !== 'walk';
      const spd = Math.abs(c.fwd);
      const ph = c.t * (running ? 0.42 : 0.24) + (c.state === 'dash' ? 1.3 : 0);
      const stride = running ? r.hipH * 0.55 : r.hipH * 0.35;
      const lift = running ? r.hipH * 0.35 : r.hipH * 0.16;
      p.lean = running ? 16 + Math.min(10, spd) : 8;
      p.hy = r.hipH * (running ? 0.9 : 0.94) + Math.abs(Math.sin(ph)) * (running ? 3 : 1.5);
      p.fFx = Math.sin(ph) * stride + 4;
      p.fFy = Math.max(0, Math.cos(ph)) * lift;
      p.fBx = -Math.sin(ph) * stride + 4;
      p.fBy = Math.max(0, -Math.cos(ph)) * lift;
      const sw = running ? a * 0.55 : a * 0.35;
      p.hFx = -Math.sin(ph) * sw + a * 0.1;
      p.hFy = r.hipH + r.torso * (running ? 0.55 : 0.4) + Math.abs(Math.cos(ph)) * 4;
      p.hBx = Math.sin(ph) * sw - a * 0.05;
      p.hBy = r.hipH + r.torso * (running ? 0.5 : 0.38);
      p.w = running ? r.weapon?.run ?? -150 : r.weapon?.rest ?? -60;
      return;
    }
    case 'runbrake': {
      standBase(r, p);
      p.lean = -14;
      p.hy = r.hipH * 0.82;
      p.fFx = r.hipH * 0.6;
      p.fBx = -r.hipH * 0.1;
      p.hFx = a * 0.2;
      p.hFy = r.hipH + r.torso * 0.9;
      p.hBx = -a * 0.5;
      p.hBy = r.hipH + r.torso * 0.9;
      return;
    }
    case 'runturn': {
      standBase(r, p);
      p.lean = -6;
      p.hy = r.hipH * 0.85;
      p.fFx = r.hipH * 0.45;
      p.fBx = -r.hipH * 0.35;
      return;
    }
    case 'crouch':
    case 'jumpsquat':
    case 'land': {
      standBase(r, p);
      const k = c.state === 'crouch' ? 0.55 : c.state === 'jumpsquat' ? 0.62 : 0.72;
      p.hy = r.hipH * k;
      p.lean = c.state === 'crouch' ? 24 : 14;
      p.fFx = r.hipH * 0.42;
      p.fBx = -r.hipH * 0.42;
      p.hFx = a * 0.55;
      p.hFy = p.hy + r.torso * 0.5;
      p.hBx = -a * 0.05;
      p.hBy = p.hy + r.torso * 0.35;
      p.w = r.weapon?.rest ?? -20;
      return;
    }
    case 'air':
    case 'helpless':
    case 'shieldbreak': {
      airBase(r, p);
      if (c.vy < 0) {
        p.fFx = r.hipH * 0.25;
        p.fFy = r.hipH * 0.42;
        p.fBx = -r.hipH * 0.15;
        p.fBy = r.hipH * 0.12;
      } else {
        const k = clamp(c.vy / 8, 0, 1);
        p.fFy = lerp(r.hipH * 0.3, r.hipH * 0.08, k);
        p.fBy = lerp(r.hipH * 0.18, r.hipH * 0.14, k);
        p.hFy = r.hipH + r.torso * lerp(0.75, 1.15, k);
        p.hBy = r.hipH + r.torso * lerp(0.8, 1.2, k);
      }
      if (c.dj < 22) p.spin = -(c.dj / 22) * 360;
      if (c.state === 'helpless') {
        const wob = Math.sin(c.t * 0.35) * 6;
        p.hFx = a * 0.3;
        p.hFy = r.hipH + r.torso + a * 0.8 + wob;
        p.hBx = -a * 0.3;
        p.hBy = r.hipH + r.torso + a * 0.8 - wob;
        p.fFy = r.hipH * 0.05;
        p.fBy = r.hipH * 0.1;
        p.lean = -6;
      }
      if (c.state === 'shieldbreak') p.spin = c.sf * 14;
      return;
    }
    case 'hitstun':
    case 'grabbed':
    case 'grabrelease': {
      standBase(r, p);
      p.lean = -22;
      p.hy = c.grounded ? r.hipH * 0.88 : r.hipH;
      p.hFx = -a * 0.1;
      p.hFy = r.hipH + r.torso + a * 0.4;
      p.hBx = -a * 0.6;
      p.hBy = r.hipH + r.torso * 0.9;
      if (!c.grounded) {
        p.fFx = r.hipH * 0.35;
        p.fFy = r.hipH * 0.2;
        p.fBx = -r.hipH * 0.1;
        p.fBy = r.hipH * 0.05;
      }
      return;
    }
    case 'tumble':
    case 'thrown': {
      airBase(r, p);
      p.hFx = a * 0.7;
      p.hFy = r.hipH + r.torso + a * 0.3;
      p.hBx = -a * 0.7;
      p.hBy = r.hipH + r.torso + a * 0.2;
      p.fFx = r.hipH * 0.5;
      p.fFy = r.hipH * 0.1;
      p.fBx = -r.hipH * 0.45;
      p.fBy = r.hipH * 0.15;
      p.spin = c.state === 'thrown' ? -c.sf * 20 : c.sf * 16;
      return;
    }
    case 'knockdown': {
      lyingPose(r, p);
      return;
    }
    case 'dizzy': {
      standBase(r, p);
      const s = Math.sin(c.t * 0.12);
      p.lean = s * 12;
      p.hy = r.hipH * 0.9;
      p.hFx = a * 0.2 + s * 6;
      p.hFy = r.hipH + r.torso * 0.25;
      p.hBx = -a * 0.2 + s * 6;
      p.hBy = r.hipH + r.torso * 0.25;
      p.w = -80;
      return;
    }
    case 'ledge': {
      airBase(r, p);
      const gx = c.width / 2 + 2;
      const gy = c.height * 0.72;
      p.hy = r.hipH;
      p.lean = -4;
      p.hFx = gx - 2;
      p.hFy = gy + 2;
      p.hBx = gx - 8;
      p.hBy = gy;
      p.fFx = 4 + Math.sin(c.t * 0.07) * 2;
      p.fFy = 0;
      p.fBx = -4;
      p.fBy = 4;
      p.w = -90;
      return;
    }
    case 'grabhold': {
      standBase(r, p);
      p.lean = 10;
      p.hFx = a * 0.85;
      p.hFy = r.hipH + r.torso * 0.55;
      p.hBx = a * 0.7;
      p.hBy = r.hipH + r.torso * 0.4;
      return;
    }
    default:
      standBase(r, p);
      if (L <= 0) p.hy = 0;
  }
}

/** Lying on the back, used by knockdown and getups. */
export function lyingPose(r: Rig, p: PoseT): PoseT {
  const a = reach(r);
  const L = r.leg1 + r.leg2;
  p.hx = 4;
  p.hy = r.bodyR * 0.9 + 2;
  p.lean = -90;
  p.hFx = -r.torso * 0.6;
  p.hFy = r.handR;
  p.hBx = -r.torso * 0.2 - a * 0.4;
  p.hBy = r.handR + 4;
  p.fFx = L * 0.85;
  p.fFy = r.footR;
  p.fBx = L * 0.7;
  p.fBy = r.footR + 6;
  p.w = 180;
  p.spin = 0;
  return p;
}

type Field = keyof PoseT;
const PAIR_FIELDS: [keyof AnimKey, Field, Field][] = [
  ['hip', 'hx', 'hy'],
  ['hF', 'hFx', 'hFy'],
  ['hB', 'hBx', 'hBy'],
  ['fF', 'fFx', 'fFy'],
  ['fB', 'fBx', 'fBy'],
];
const SCALAR_FIELDS: [keyof AnimKey, Field][] = [
  ['lean', 'lean'],
  ['w', 'w'],
  ['spin', 'spin'],
];

interface Track {
  f: number[];
  v: number[][];
  e: (AnimKey['e'])[];
}

const trackCache = new WeakMap<MoveDef, Map<string, Track>>();

function tracksFor(def: MoveDef): Map<string, Track> {
  let m = trackCache.get(def);
  if (m) return m;
  m = new Map();
  const keys = [...def.anim].sort((a, b) => a.f - b.f);
  for (const [k] of PAIR_FIELDS) {
    const tr: Track = { f: [], v: [], e: [] };
    for (const key of keys) {
      const val = key[k] as [number, number] | undefined;
      if (val) {
        tr.f.push(key.f);
        tr.v.push([val[0], val[1]]);
        tr.e.push(key.e);
      }
    }
    if (tr.f.length) m.set(k as string, tr);
  }
  for (const [k] of SCALAR_FIELDS) {
    const tr: Track = { f: [], v: [], e: [] };
    for (const key of keys) {
      const val = key[k] as number | undefined;
      if (val !== undefined) {
        tr.f.push(key.f);
        tr.v.push([val]);
        tr.e.push(key.e);
      }
    }
    if (tr.f.length) m.set(k as string, tr);
  }
  trackCache.set(def, m);
  return m;
}

/** Interpolate a keyframe track; before the first key it blends from base, after the last it blends back to base by `total`. */
function sample(tr: Track, frame: number, total: number, base: number[], out: number[]): void {
  const n = tr.f.length;
  const dims = base.length;
  if (frame <= tr.f[0]) {
    const f0 = tr.f[0];
    const t = f0 <= 0 ? 1 : ease(clamp(frame / f0, 0, 1), tr.e[0] ?? 'out');
    for (let i = 0; i < dims; i++) out[i] = lerp(base[i], tr.v[0][i], t);
    return;
  }
  for (let k = 0; k < n - 1; k++) {
    if (frame < tr.f[k + 1]) {
      const span = tr.f[k + 1] - tr.f[k];
      const t = ease(clamp((frame - tr.f[k]) / span, 0, 1), tr.e[k + 1]);
      for (let i = 0; i < dims; i++) out[i] = lerp(tr.v[k][i], tr.v[k + 1][i], t);
      return;
    }
  }
  const last = tr.f[n - 1];
  const span = total - last;
  const t = span <= 0 ? 0 : ease(clamp((frame - last) / span, 0, 1), 'io');
  for (let i = 0; i < dims; i++) out[i] = lerp(tr.v[n - 1][i], base[i], t);
}

const tmpBase = [0, 0];
const tmpOut = [0, 0];

export function applyMove(def: MoveDef, frame: number, p: PoseT): void {
  const tracks = tracksFor(def);
  for (const [k, fx, fy] of PAIR_FIELDS) {
    const tr = tracks.get(k as string);
    if (!tr) continue;
    tmpBase[0] = p[fx];
    tmpBase[1] = p[fy];
    sample(tr, frame, def.total, tmpBase, tmpOut);
    p[fx] = tmpOut[0];
    p[fy] = tmpOut[1];
  }
  for (const [k, f] of SCALAR_FIELDS) {
    const tr = tracks.get(k as string);
    if (!tr) continue;
    const b = [p[f]];
    const o = [0];
    sample(tr, frame, def.total, b, o);
    p[f] = o[0];
  }
}

/** Compute pose targets for a fighter context. */
export function poseTargets(r: Rig, c: PoseCtx, out: PoseT = blankPose()): PoseT {
  if (c.move) {
    const d = c.move.def;
    if (d.id.startsWith('getup') || d.id.startsWith('tech')) lyingPose(r, out);
    else if (d.air || !c.grounded) airBase(r, out);
    else standBase(r, out);
    applyMove(d, c.move.frame, out);
    const ps = c.move.vars?.poseSpin;
    if (ps !== undefined) out.spin += ps;
  } else {
    statePose(r, c, out);
  }
  return out;
}

function ik(
  rx: number, ry: number, tx: number, ty: number, a: number, b: number, bend: number,
  joint: V2, end: V2,
): void {
  let dx = tx - rx;
  let dy = ty - ry;
  let d = Math.hypot(dx, dy);
  const max = a + b - 0.01;
  const min = Math.abs(a - b) + 0.5;
  if (d < 1e-6) {
    dx = 0;
    dy = -1;
    d = 1;
  }
  const ux = dx / d;
  const uy = dy / d;
  const dc = clamp(d, min, max);
  end.x = rx + ux * dc;
  end.y = ry + uy * dc;
  const cosA = clamp((a * a + dc * dc - b * b) / (2 * a * dc), -1, 1);
  const A = Math.acos(cosA) * bend;
  const base = Math.atan2(uy, ux);
  joint.x = rx + Math.cos(base + A) * a;
  joint.y = ry + Math.sin(base + A) * a;
}

function v(): V2 {
  return { x: 0, y: 0 };
}

export function blankResolved(): Resolved {
  return {
    hip: v(), neck: v(), head: v(), center: v(), shF: v(), shB: v(), elF: v(), elB: v(), hdF: v(), hdB: v(),
    hipF: v(), hipB: v(), knF: v(), knB: v(), ftF: v(), ftB: v(), wBase: v(), wTip: v(), lean: 0, spin: 0, w: 0,
  };
}

const ROT_KEYS: (keyof Resolved)[] = [
  'hip', 'neck', 'head', 'shF', 'shB', 'elF', 'elB', 'hdF', 'hdB', 'hipF', 'hipB', 'knF', 'knB', 'ftF', 'ftB', 'wBase', 'wTip',
];

/** Resolve joints with two-bone IK, then apply whole-body spin around the centre. */
export function resolvePose(r: Rig, p: PoseT, out: Resolved = blankResolved(), wlen = r.weapon ? r.weapon.len : 0): Resolved {
  const lr = p.lean * DEG;
  const ux = Math.sin(lr);
  const uy = Math.cos(lr);
  const fx = uy;
  const fy = -ux;
  out.hip.x = p.hx;
  out.hip.y = p.hy;
  out.neck.x = p.hx + ux * r.torso;
  out.neck.y = p.hy + uy * r.torso;
  out.head.x = out.neck.x + ux * r.headR * 0.85;
  out.head.y = out.neck.y + uy * r.headR * 0.85;
  out.center.x = p.hx + ux * r.torso * 0.45;
  out.center.y = p.hy + uy * r.torso * 0.45;
  const sh = r.torso - r.bodyR * 0.3;
  out.shF.x = p.hx + ux * sh + fx * r.bodyR * 0.25;
  out.shF.y = p.hy + uy * sh + fy * r.bodyR * 0.25;
  out.shB.x = p.hx + ux * sh - fx * r.bodyR * 0.25;
  out.shB.y = p.hy + uy * sh - fy * r.bodyR * 0.25;
  out.hipF.x = p.hx + fx * r.bodyR * 0.3;
  out.hipF.y = p.hy + fy * r.bodyR * 0.3;
  out.hipB.x = p.hx - fx * r.bodyR * 0.3;
  out.hipB.y = p.hy - fy * r.bodyR * 0.3;
  ik(out.shF.x, out.shF.y, p.hFx, p.hFy, r.arm1, r.arm2, -1, out.elF, out.hdF);
  ik(out.shB.x, out.shB.y, p.hBx, p.hBy, r.arm1, r.arm2, -1, out.elB, out.hdB);
  ik(out.hipF.x, out.hipF.y, p.fFx, p.fFy, r.leg1, r.leg2, 1, out.knF, out.ftF);
  ik(out.hipB.x, out.hipB.y, p.fBx, p.fBy, r.leg1, r.leg2, 1, out.knB, out.ftB);
  const wl = wlen;
  const wa = p.w * DEG;
  out.wBase.x = out.hdF.x;
  out.wBase.y = out.hdF.y;
  out.wTip.x = out.hdF.x + Math.cos(wa) * wl;
  out.wTip.y = out.hdF.y + Math.sin(wa) * wl;
  out.lean = p.lean;
  out.w = p.w;
  out.spin = p.spin;
  if (p.spin !== 0) {
    const s = p.spin * DEG;
    const cs = Math.cos(s);
    const sn = Math.sin(s);
    const cx = out.center.x;
    const cy = out.center.y;
    for (const k of ROT_KEYS) {
      const pt = out[k] as V2;
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      pt.x = cx + dx * cs - dy * sn;
      pt.y = cy + dx * sn + dy * cs;
    }
    out.w = p.w + p.spin;
  }
  return out;
}

/** Local position of a pose point (blade uses t along the weapon). */
export function posePoint(res: Resolved, at: PosePoint, t = 1): V2 {
  switch (at) {
    case 'handF':
      return res.hdF;
    case 'handB':
      return res.hdB;
    case 'footF':
      return res.ftF;
    case 'footB':
      return res.ftB;
    case 'head':
      return res.head;
    case 'hip':
      return res.hip;
    case 'neck':
      return res.neck;
    case 'center':
      return res.center;
    case 'blade':
      return {
        x: res.wBase.x + (res.wTip.x - res.wBase.x) * t,
        y: res.wBase.y + (res.wTip.y - res.wBase.y) * t,
      };
  }
}
