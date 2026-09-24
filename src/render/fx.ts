import type { Fighter } from '../sim/fighter';
import type { Match } from '../sim/match';
import { posePoint } from '../sim/pose';
import { rgba } from './color';

/** Render-only particles. Randomness here is cosmetic and never touches the simulation. */
type Kind = 'spark' | 'ring' | 'dust' | 'smoke' | 'star' | 'shard' | 'flame' | 'plus' | 'beam' | 'glow' | 'streak' | 'crescent' | 'drop';

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  grav: number;
  drag: number;
  len: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class Particles {
  list: Particle[] = [];

  add(p: Partial<Particle> & { kind: Kind; x: number; y: number }): void {
    if (this.list.length > 900) this.list.shift();
    this.list.push({
      vx: 0, vy: 0, life: 20, max: 20, size: 8, color: '#ffffff', rot: 0, vr: 0, grav: 0, drag: 0.92, len: 0,
      ...p,
    } as Particle);
    const q = this.list[this.list.length - 1];
    q.max = q.life;
  }

  /** `ang` is the launch angle in degrees (y-up), used to throw debris the way the victim flies. */
  hitSpark(x: number, y: number, dmg: number, kb: number, blocked: boolean, sfx: string, fx?: string, ang?: number): void {
    const big = Math.min(1, dmg / 18);
    const el = blocked ? undefined : fx;
    const color = blocked
      ? '#9fd6ff'
      : el && ELEMENT_COLOR[el]
        ? ELEMENT_COLOR[el]
        : sfx === 'fire' ? '#ff9a3a' : sfx === 'spark' || sfx === 'zap' ? '#7ff5ff' : sfx === 'slash' || sfx === 'tip' ? '#e8f0ff' : '#fff1a8';
    const n = blocked ? 6 : 6 + Math.round(big * 8);
    const dir = ang === undefined ? null : (ang * Math.PI) / 180;
    for (let i = 0; i < n; i++) {
      // half the streaks follow the launch direction so impacts read as directional
      const a = dir !== null && i % 2 === 0 ? -dir + rand(-0.7, 0.7) : rand(0, Math.PI * 2);
      const s = rand(6, 14) * (0.6 + big);
      this.add({ kind: 'streak', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(8, 14), size: 3 + big * 3, len: 16 + big * 26, color, drag: 0.8 });
    }
    this.add({ kind: 'ring', x, y, life: 12, size: 16 + big * 40, color: blocked ? '#9fd6ff' : '#ffffff', grav: 0 });
    this.add({ kind: 'star', x, y, life: 9, size: 26 + big * 46 + Math.min(40, kb * 0.15), color, rot: rand(0, Math.PI), vr: 0.08 });
    if (sfx === 'tip') this.add({ kind: 'star', x, y, life: 14, size: 60 + big * 50, color: '#bfe6ff', rot: 0.4, vr: -0.05 });
    if (sfx === 'fire') for (let i = 0; i < 8; i++) this.add({ kind: 'flame', x, y, vx: rand(-4, 4), vy: rand(-6, -1), life: rand(14, 24), size: rand(8, 16), color: '#ff7a2a', drag: 0.9 });
    switch (el) {
      case 'slash': {
        const rot = dir !== null ? -dir : rand(-0.6, 0.6);
        this.add({ kind: 'crescent', x, y, life: 12, size: 44 + big * 50, color: '#ffffff', rot });
        this.add({ kind: 'crescent', x, y, life: 9, size: 34 + big * 40, color: '#ff4a6a', rot: rot + 0.5 });
        break;
      }
      case 'water': {
        for (let i = 0; i < 12 + big * 10; i++) {
          const a = rand(-Math.PI * 0.95, -Math.PI * 0.05);
          const sp = rand(4, 11) * (0.7 + big);
          this.add({ kind: 'drop', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(18, 30), size: rand(3, 6), color: i % 3 ? '#7fdcff' : '#e6fbff', grav: 0.55, drag: 0.97 });
        }
        this.add({ kind: 'ring', x, y, life: 18, size: 50 + big * 50, color: '#7fdcff' });
        break;
      }
      case 'soul': {
        for (let i = 0; i < 6 + big * 6; i++) {
          this.add({ kind: 'glow', x: x + rand(-18, 18), y: y + rand(-14, 14), vx: rand(-1, 1), vy: rand(-3.5, -1.5), life: rand(22, 36), size: rand(10, 18), color: i % 2 ? '#8affd0' : '#c8b8ff', drag: 0.96 });
        }
        this.add({ kind: 'ring', x, y, life: 16, size: 46 + big * 40, color: '#8affd0' });
        break;
      }
      case 'rock': {
        for (let i = 0; i < 8 + big * 10; i++) {
          const a = rand(0, Math.PI * 2);
          const sp = rand(4, 12) * (0.6 + big);
          this.add({ kind: 'shard', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, life: rand(22, 36), size: rand(5, 11), color: i % 2 ? '#8a8478' : '#c9a878', rot: rand(0, 6), vr: rand(-0.3, 0.3), grav: 0.6, drag: 0.97 });
        }
        this.dust(x, y + 10, 5, '#c9b89a', 1.4);
        break;
      }
      default:
        break;
    }
  }

  dust(x: number, y: number, n: number, color = '#e8dcc8', spread = 1): void {
    for (let i = 0; i < n; i++) {
      this.add({ kind: 'dust', x: x + rand(-10, 10) * spread, y: y - 4, vx: rand(-3, 3) * spread, vy: rand(-2.5, -0.5), life: rand(16, 28), size: rand(7, 13), color, drag: 0.9 });
    }
  }

  smoke(x: number, y: number, hot: boolean): void {
    this.add({ kind: hot ? 'flame' : 'smoke', x: x + rand(-6, 6), y: y + rand(-6, 6), vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6), life: hot ? 16 : 26, size: rand(9, 16), color: hot ? '#ff8a3a' : '#d8d4e0', drag: 0.95 });
  }

  koBlast(x: number, y: number, angle: number, color: string): void {
    this.add({ kind: 'beam', x, y, rot: angle, life: 55, size: 150, len: 2600, color });
    for (let i = 0; i < 40; i++) {
      const a = angle + rand(-0.7, 0.7);
      const s = rand(10, 36);
      this.add({ kind: 'streak', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(20, 40), size: rand(4, 9), len: rand(30, 70), color: i % 3 ? color : '#ffffff', drag: 0.93 });
    }
    this.add({ kind: 'ring', x, y, life: 30, size: 380, color });
  }

  shatter(x: number, y: number, color: string): void {
    for (let i = 0; i < 22; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(4, 14);
      this.add({ kind: 'shard', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3, life: rand(24, 40), size: rand(6, 14), color, rot: rand(0, 6), vr: rand(-0.3, 0.3), grav: 0.5, drag: 0.97 });
    }
    this.add({ kind: 'ring', x, y, life: 20, size: 160, color });
  }

  sparkle(x: number, y: number, color: string, n = 8): void {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      this.add({ kind: 'star', x: x + Math.cos(a) * rand(4, 30), y: y + Math.sin(a) * rand(4, 30), life: rand(14, 26), size: rand(8, 16), color, rot: rand(0, 3), vr: 0.1 });
    }
  }

  update(): void {
    const L = this.list;
    let w = 0;
    for (let i = 0; i < L.length; i++) {
      const p = L[i];
      p.life--;
      if (p.life <= 0) continue;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.grav;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      L[w++] = p;
    }
    L.length = w;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.list) {
      const k = p.life / p.max;
      switch (p.kind) {
        case 'streak': {
          const sp = Math.hypot(p.vx, p.vy) || 1;
          const l = p.len * k;
          ctx.strokeStyle = rgba(p.color, Math.min(1, k * 1.5));
          ctx.lineWidth = p.size * k + 1;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - (p.vx / sp) * l, p.y - (p.vy / sp) * l);
          ctx.stroke();
          break;
        }
        case 'ring': {
          ctx.strokeStyle = rgba(p.color, k * 0.9);
          ctx.lineWidth = 3 + 8 * k;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - k * 0.85), 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'star': {
          const s = p.size * (0.4 + 0.6 * k);
          ctx.fillStyle = rgba(p.color, Math.min(1, k * 1.6));
          star(ctx, p.x, p.y, s, s * 0.28, p.rot, 4);
          break;
        }
        case 'dust':
        case 'smoke': {
          ctx.fillStyle = rgba(p.color, k * (p.kind === 'dust' ? 0.55 : 0.5));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1.6 - k * 0.8), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'flame': {
          ctx.fillStyle = rgba(k > 0.5 ? '#ffe27a' : p.color, k * 0.85);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.4 + k * 0.7), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'shard': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = rgba(p.color, k);
          ctx.beginPath();
          ctx.moveTo(-p.size, 0);
          ctx.lineTo(0, -p.size * 0.5);
          ctx.lineTo(p.size * 0.7, p.size * 0.4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'plus': {
          ctx.strokeStyle = rgba(p.color, k);
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(p.x - p.size / 2, p.y);
          ctx.lineTo(p.x + p.size / 2, p.y);
          ctx.moveTo(p.x, p.y - p.size / 2);
          ctx.lineTo(p.x, p.y + p.size / 2);
          ctx.stroke();
          break;
        }
        case 'glow': {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          g.addColorStop(0, rgba(p.color, 0.9 * k));
          g.addColorStop(1, rgba(p.color, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'crescent': {
          const grow = 1 - k;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.strokeStyle = rgba(p.color, Math.min(1, k * 1.4));
          ctx.lineCap = 'round';
          ctx.lineWidth = 2 + 9 * k;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * (0.7 + grow * 0.5), -1.2, 1.2);
          ctx.stroke();
          ctx.restore();
          break;
        }
        case 'drop': {
          const sp = Math.hypot(p.vx, p.vy) || 1;
          ctx.fillStyle = rgba(p.color, Math.min(1, k * 1.3));
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size, p.size * (1 + Math.min(1.2, sp * 0.12)), Math.atan2(p.vy, p.vx) + Math.PI / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'beam': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          const w = p.size * (0.3 + 0.7 * k);
          const g = ctx.createLinearGradient(0, 0, p.len, 0);
          g.addColorStop(0, rgba('#ffffff', 0.95 * k));
          g.addColorStop(0.15, rgba(p.color, 0.8 * k));
          g.addColorStop(1, rgba(p.color, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(0, -w * 0.15);
          ctx.lineTo(p.len, -w);
          ctx.lineTo(p.len, w);
          ctx.lineTo(0, w * 0.15);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }
      }
    }
  }
}

/** Impact and trail colour per hit element. */
export const ELEMENT_COLOR: Record<string, string> = {
  fire: '#ffb04a',
  spark: '#8ff6ff',
  slash: '#ffffff',
  water: '#7fdcff',
  soul: '#8affd0',
  rock: '#e0c090',
};

export function star(ctx: CanvasRenderingContext2D, x: number, y: number, R: number, r: number, rot: number, n: number): void {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n;
    const rr = i % 2 === 0 ? R : r;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// ------------------------------------------------------------------ attack swooshes

interface TrailPt {
  x: number;
  y: number;
  bx: number;
  by: number;
}

interface Trail {
  move: object | null;
  pts: Map<string, TrailPt[]>;
  lastActive: Map<string, number>;
  fx: Map<string, string>;
}

/**
 * Records the world path of each attacking pose point so an attack draws a swoosh arc
 * along the exact path its hitbox took.
 */
export class Swooshes {
  trails = new Map<number, Trail>();
  frame = 0;

  record(m: Match): void {
    this.frame++;
    for (const f of m.fighters) {
      const mv = f.move && f.state === 'move' ? f.move : null;
      let tr = this.trails.get(f.idx);
      if (!tr) {
        tr = { move: null, pts: new Map(), lastActive: new Map(), fx: new Map() };
        this.trails.set(f.idx, tr);
      }
      if (!mv) {
        for (const [k, last] of tr.lastActive) if (this.frame - last > 8) tr.pts.delete(k);
        continue;
      }
      if (tr.move !== mv) {
        tr.move = mv;
        tr.pts.clear();
        tr.lastActive.clear();
      }
      const seen = new Set<string>();
      for (const h of mv.def.hitboxes) {
        if (!h.at || h.fx === 'none' || h.fx === 'shock') continue;
        const k = h.at === 'blade' ? 'blade' : h.at;
        if (seen.has(k)) continue;
        seen.add(k);
        const active = mv.frame >= h.from && mv.frame <= h.to;
        const soon = mv.frame >= h.from - 4 && mv.frame <= h.to;
        if (!soon) continue;
        const tip = posePoint(f.pose, h.at, h.at === 'blade' ? 1.05 : 1);
        const base = h.at === 'blade' ? posePoint(f.pose, 'blade', 0.3) : tip;
        const wx = f.x + tip.x * f.facing;
        const wy = f.y - tip.y;
        const bx = f.x + base.x * f.facing;
        const by = f.y - base.y;
        let arr = tr.pts.get(k);
        if (!arr) {
          arr = [];
          tr.pts.set(k, arr);
        }
        const last = arr[arr.length - 1];
        if (!last || Math.hypot(last.x - wx, last.y - wy) > 0.5) arr.push({ x: wx, y: wy, bx, by });
        if (arr.length > 9) arr.shift();
        if (active) tr.lastActive.set(k, this.frame);
        tr.fx.set(k, h.fx ?? 'swoosh');
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, fighters: Fighter[]): void {
    for (const f of fighters) {
      const tr = this.trails.get(f.idx);
      if (!tr) continue;
      for (const [k, arr] of tr.pts) {
        const last = tr.lastActive.get(k);
        if (last === undefined || arr.length < 2) continue;
        const age = this.frame - last;
        if (age > 6) continue;
        const a = 1 - age / 7;
        const fx = tr.fx.get(k) ?? 'swoosh';
        const col = ELEMENT_COLOR[fx] ?? '#ffffff';
        if (k === 'blade') {
          ctx.fillStyle = rgba(col, 0.42 * a);
          ctx.beginPath();
          ctx.moveTo(arr[0].x, arr[0].y);
          for (const p of arr) ctx.lineTo(p.x, p.y);
          for (let i = arr.length - 1; i >= 0; i--) ctx.lineTo(arr[i].bx, arr[i].by);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = rgba(col, 0.9 * a);
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(arr[0].x, arr[0].y);
          for (const p of arr) ctx.lineTo(p.x, p.y);
          ctx.stroke();
        } else {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          for (let i = 1; i < arr.length; i++) {
            const t = i / (arr.length - 1);
            ctx.strokeStyle = rgba(col, (0.25 + 0.6 * t) * a);
            ctx.lineWidth = 3 + 13 * t;
            ctx.beginPath();
            ctx.moveTo(arr[i - 1].x, arr[i - 1].y);
            ctx.lineTo(arr[i].x, arr[i].y);
            ctx.stroke();
          }
        }
      }
    }
  }
}
