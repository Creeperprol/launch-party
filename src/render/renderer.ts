import type { SimEvent } from '../sim/events';
import type { Fighter } from '../sim/fighter';
import type { Match } from '../sim/match';
import { Camera, VIEW_H, VIEW_W } from './camera';
import { CPU_GREY, INK, PLAYER_COLORS, mix, percentColor, rgba } from './color';
import { drawDebugLabels, drawDebugWorld } from './debug';
import { drawFighter } from './fighterDraw';
import { Particles, Swooshes, star } from './fx';
import { drawHud } from './hud';
import { drawItemShape } from './itemDraw';
import { drawBackground, drawStage } from './stageDraw';

export interface PlayerInfo {
  slot: number;
  cpu: number;
  name: string;
}

/** Draws a match: background, stage, fighters, effects, HUD, and the debug overlay. */
export class MatchRenderer {
  cam = new Camera();
  particles = new Particles();
  swoosh = new Swooshes();
  t = 0;
  debug = false;
  players: PlayerInfo[];
  hudShake: number[];
  lastPercent: number[];
  flashScreen = 0;
  flashColor = '#ffffff';

  constructor(m: Match, players: PlayerInfo[]) {
    this.players = players;
    this.hudShake = players.map(() => 0);
    this.lastPercent = players.map(() => 0);
    this.cam.reset(m);
  }

  colorOf(i: number): string {
    const p = this.players[i];
    return p ? PLAYER_COLORS[p.slot % 4] : CPU_GREY;
  }

  /** Called once per simulation step. */
  step(m: Match, events: SimEvent[]): void {
    this.t++;
    for (const e of events) this.onEvent(m, e);
    for (const f of m.fighters) {
      if (!f.alive()) continue;
      const sp = Math.hypot(f.kbx, f.kby);
      if (f.state === 'tumble' && sp > 7 && this.t % 2 === 0) this.particles.smoke(f.cx, f.cy, sp > 20);
      if (f.move && f.move.charging && this.t % 5 === 0) this.particles.sparkle(f.cx, f.cy, '#fff6a0', 1);
      if (f.state === 'move' && f.move?.id === 'uspecial' && f.def.id === 'zip' && this.t % 2 === 0) this.particles.smoke(f.cx, f.cy, true);
    }
    for (let i = 0; i < m.fighters.length; i++) {
      const f = m.fighters[i];
      if (f.percent > this.lastPercent[i] + 0.01) this.hudShake[i] = Math.min(14, 4 + (f.percent - this.lastPercent[i]) * 0.8);
      this.lastPercent[i] = f.percent;
      this.hudShake[i] *= 0.85;
    }
    this.swoosh.record(m);
    this.particles.update();
    this.cam.update(m);
    if (this.flashScreen > 0) this.flashScreen--;
  }

  onEvent(m: Match, e: SimEvent): void {
    const P = this.particles;
    switch (e.t) {
      case 'hit':
        P.hitSpark(e.x, e.y, e.dmg, e.kb, e.blocked, e.sfx);
        if (!e.blocked) this.cam.punch(Math.min(24, e.kb * 0.08 + e.dmg * 0.25));
        break;
      case 'ko': {
        P.koBlast(e.x, e.y, e.angle, this.colorOf(e.victim));
        this.cam.punch(26);
        this.flashScreen = 6;
        this.flashColor = this.colorOf(e.victim);
        break;
      }
      case 'land':
        P.dust(e.x, e.y, e.hard ? 8 : 4, dustColor(m), e.hard ? 1.6 : 1);
        break;
      case 'jump':
        if (!e.air) P.dust(e.x, e.y, 5, dustColor(m));
        else P.add({ kind: 'ring', x: e.x, y: e.y, life: 12, size: 34, color: '#ffffff' });
        break;
      case 'dash':
        P.dust(e.x - e.dir * 10, e.y, 4, dustColor(m), 1.2);
        break;
      case 'shieldbreak':
        P.shatter(e.x, e.y, this.colorOf(e.who));
        this.cam.punch(18);
        break;
      case 'tech':
        P.add({ kind: 'ring', x: e.x, y: e.y - 30, life: 14, size: 70, color: '#ffffff' });
        P.sparkle(e.x, e.y - 30, '#ffffff', 6);
        break;
      case 'ledge':
        P.sparkle(e.x, e.y, '#bff6ff', 4);
        break;
      case 'explode':
        P.explosion(e.x, e.y, e.r);
        this.cam.punch(22);
        break;
      case 'reflect':
        P.add({ kind: 'ring', x: e.x, y: e.y, life: 12, size: 50, color: '#8ff6ff' });
        break;
      case 'counter':
        P.add({ kind: 'star', x: e.x, y: e.y, life: 16, size: 90, color: '#bfe0ff', rot: 0.3, vr: 0.05 });
        break;
      case 'item':
        if (e.action === 'heal') P.heal(e.x, e.y);
        else if (e.action === 'spawn') P.sparkle(e.x, e.y + 600, '#fff6a0', 0);
        break;
      case 'finalhit':
        this.cam.focus = { x: e.x, y: e.y, zoom: 1.9, frames: 40 };
        this.flashScreen = 8;
        this.flashColor = '#ffffff';
        break;
      default:
        break;
    }
  }

  draw(ctx: CanvasRenderingContext2D, m: Match, perf?: string): void {
    const cam = this.cam;
    drawBackground(ctx, m.stage, cam, this.t);
    ctx.save();
    cam.apply(ctx);
    drawStage(ctx, m.stage, this.t);
    this.drawRespawnPlatforms(ctx, m);
    for (const it of m.items) {
      if (it.state === 'held' || it.state === 'dead') continue;
      ctx.save();
      ctx.translate(it.x, it.y - (it.state === 'ground' ? it.r : 0));
      if (it.state !== 'ground') ctx.rotate(it.spin);
      if (it.state === 'ground' && it.groundFrames > 780 && Math.floor(this.t / 4) % 2 === 0) ctx.globalAlpha = 0.35;
      drawItemShape(ctx, it.kind, 1, this.t, false);
      ctx.restore();
    }
    for (const f of m.fighters) if (f.alive()) this.drawOneFighter(ctx, f, m);
    this.swoosh.draw(ctx, m.fighters);
    this.drawProjectiles(ctx, m);
    this.drawActiveFx(ctx, m);
    this.particles.draw(ctx);
    if (this.debug) drawDebugWorld(ctx, m);
    ctx.restore();
    for (const f of m.fighters) if (f.alive()) this.drawIndicator(ctx, f);
    this.drawMagnifiers(ctx, m);
    if (this.flashScreen > 0) {
      ctx.fillStyle = rgba(this.flashColor.startsWith('#') ? this.flashColor : '#ffffff', this.flashScreen * 0.05);
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    drawHud(ctx, m, this);
    if (this.debug) {
      drawDebugLabels(ctx, m, (x, y) => cam.toScreen(x, y));
      if (perf) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(16, 16, 460, 34);
        ctx.fillStyle = '#9ff7c0';
        ctx.font = '600 20px ui-monospace, Menlo, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(perf, 26, 40);
      }
    }
  }

  drawOneFighter(ctx: CanvasRenderingContext2D, f: Fighter, m: Match): void {
    const hitFlash = f.hitlag > 0 && f.hurtFlash > 0 ? 0.65 : 0;
    const charge = f.move && f.move.charging && Math.floor(this.t / 4) % 2 === 0 ? 0.45 : 0;
    const intang = f.intangibleNow() && f.state !== 'respawn';
    const shake = f.hitlag > 0 && f.hurtFlash > 0 ? (Math.random() * 2 - 1) * 4 : 0;
    // ground shadow
    if (f.grounded || f.state === 'air') {
      const gy = f.grounded ? f.y : groundBelow(m, f.x, f.y);
      if (gy !== null) {
        const d = Math.max(0, gy - f.y);
        const s = Math.max(0.25, 1 - d / 500);
        ctx.fillStyle = `rgba(0,0,0,${0.28 * s})`;
        ctx.beginPath();
        ctx.ellipse(f.x, gy + 2, f.W * 0.55 * s, 7 * s, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    drawFighter(ctx, f, {
      alpha: intang ? (Math.floor(this.t / 3) % 2 ? 0.55 : 0.8) : 1,
      flash: Math.max(hitFlash, charge, intang ? 0.3 : 0),
      flashColor: charge && !hitFlash ? '#fff4a0' : hitFlash ? mix(percentColor(f.percent), '#ffffff', 0.35) : '#ffffff',
      shakeX: shake,
      shakeY: 0,
      t: this.t + f.idx * 37,
    });
    if (f.shielding()) {
      const col = this.colorOf(f.idx);
      const k = f.shieldHP / 50;
      ctx.fillStyle = rgba(col, 0.28 + (1 - k) * 0.15);
      ctx.strokeStyle = rgba('#ffffff', 0.7);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(f.shieldX, f.shieldY, f.shieldR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(f.shieldX - f.shieldR * 0.35, f.shieldY - f.shieldR * 0.35, f.shieldR * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
    if (f.state === 'dizzy') {
      for (let i = 0; i < 3; i++) {
        const a = this.t * 0.12 + (i * Math.PI * 2) / 3;
        ctx.fillStyle = '#fff27a';
        star(ctx, f.x + Math.cos(a) * 30, f.y - f.H - 10 + Math.sin(a) * 8, 9, 3.5, a, 5);
      }
    }
    const rf = f.reflectActive();
    if (rf) {
      ctx.strokeStyle = 'rgba(120,250,255,0.9)';
      ctx.fillStyle = 'rgba(120,250,255,0.18)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const n = 6;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2 + this.t * 0.2;
        const x = f.shieldX + Math.cos(a) * rf.r;
        const y = f.shieldY + Math.sin(a) * rf.r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.fill();
      ctx.stroke();
    }
    if (f.counterActive()) {
      ctx.strokeStyle = `rgba(190,220,255,${0.5 + Math.sin(this.t * 0.5) * 0.3})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(f.cx, f.cy, f.H * 0.62, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawRespawnPlatforms(ctx: CanvasRenderingContext2D, m: Match): void {
    for (const f of m.fighters) {
      if (f.state !== 'respawn') continue;
      const col = this.colorOf(f.idx);
      const y = f.y + 4;
      ctx.fillStyle = rgba(col, 0.3);
      ctx.beginPath();
      ctx.ellipse(f.x, y + 6, 70, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(f.x, y, 58, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(f.x, y - 1, 52, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(col, 0.9);
      ctx.beginPath();
      ctx.ellipse(f.x, y + 1, 44, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawProjectiles(ctx: CanvasRenderingContext2D, m: Match): void {
    for (const p of m.projectiles) {
      if (p.kind === 'laser') {
        const d = Math.sign(p.vx) || 1;
        ctx.strokeStyle = rgba(this.colorOf(p.owner), 0.5);
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x - d * 46, p.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.strokeStyle = '#eaffff';
        ctx.lineWidth = 5;
        ctx.stroke();
      } else {
        const pulse = 1 + Math.sin(p.age * 0.6) * 0.15;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 1.8 * pulse);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.35, '#fff27a');
        g.addColorStop(0.7, 'rgba(255,140,60,0.7)');
        g.addColorStop(1, 'rgba(255,90,60,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 1.8 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fffbe0';
        star(ctx, p.x, p.y, p.r * 0.9, p.r * 0.35, p.age * 0.3, 4);
      }
    }
    for (const e of m.explosions) {
      ctx.fillStyle = `rgba(255,200,100,${e.frames * 0.08})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Effects bound to hitboxes placed in space (fire breath, shockwaves, electric auras). */
  drawActiveFx(ctx: CanvasRenderingContext2D, m: Match): void {
    for (const f of m.fighters) {
      for (const h of f.hits) {
        const fx = h.def.fx;
        if (fx === 'fire' && (h.def.pos || h.def.at === 'center')) {
          const g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r * 1.2);
          g.addColorStop(0, 'rgba(255,245,180,0.95)');
          g.addColorStop(0.5, 'rgba(255,140,40,0.7)');
          g.addColorStop(1, 'rgba(255,60,30,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.r * 1.2, 0, Math.PI * 2);
          ctx.fill();
          if (this.t % 2 === 0) this.particles.add({ kind: 'flame', x: h.x + (Math.random() - 0.5) * h.r, y: h.y + (Math.random() - 0.5) * h.r, vy: -2, life: 14, size: h.r * 0.4, color: '#ff7a2a' });
        } else if (fx === 'shock') {
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.ellipse(h.x, h.y, h.r * 1.1, h.r * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();
          if (this.t % 2 === 0) this.particles.dust(h.x, h.y + h.r * 0.3, 1, dustColor(m), 1.5);
        } else if (fx === 'spark' && h.def.at === 'center') {
          ctx.strokeStyle = 'rgba(140,250,255,0.8)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + this.t;
            const r = h.r * (0.7 + Math.random() * 0.5);
            const x = h.x + Math.cos(a) * r;
            const y = h.y + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
  }

  drawIndicator(ctx: CanvasRenderingContext2D, f: Fighter): void {
    if (f.state === 'dead') return;
    const [sx, sy] = this.cam.toScreen(f.x, f.y - f.H - 18);
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) return;
    const col = this.colorOf(f.idx);
    const p = this.players[f.idx];
    const label = p && p.cpu > 0 ? 'CPU' : `P${(p?.slot ?? f.idx) + 1}`;
    ctx.save();
    ctx.font = '900 italic 20px "Avenir Next Condensed", "Futura", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    const w = ctx.measureText(label).width + 16;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(sx - w / 2 - 3, sy - 34);
    ctx.lineTo(sx + w / 2 + 3, sy - 34);
    ctx.lineTo(sx + w / 2 + 3, sy - 8);
    ctx.lineTo(sx + 9, sy - 8);
    ctx.lineTo(sx, sy + 3);
    ctx.lineTo(sx - 9, sy - 8);
    ctx.lineTo(sx - w / 2 - 3, sy - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p && p.cpu > 0 ? CPU_GREY : col;
    ctx.fillRect(sx - w / 2, sy - 31, w, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, sx, sy - 14);
    ctx.restore();
  }

  /** Fighters off-screen but still inside the blast zones appear in an edge bubble. */
  drawMagnifiers(ctx: CanvasRenderingContext2D, m: Match): void {
    const b = this.cam.bounds();
    for (const f of m.fighters) {
      if (!f.alive() || f.state === 'respawn') continue;
      const inView = f.x > b.x1 && f.x < b.x2 && f.cy > b.y1 && f.cy < b.y2;
      if (inView) continue;
      const [sx, sy] = this.cam.toScreen(f.x, f.cy);
      const R = 70;
      const bx = Math.min(VIEW_W - R - 16, Math.max(R + 16, sx));
      const by = Math.min(VIEW_H - R - 170, Math.max(R + 16, sy));
      const col = this.colorOf(f.idx);
      ctx.save();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(bx, by, R + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(bx, by, R + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(20,16,40,0.92)';
      ctx.beginPath();
      ctx.arc(bx, by, R - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.clip();
      ctx.translate(bx, by);
      ctx.scale(0.55, 0.55);
      ctx.translate(-f.x, -f.cy);
      drawFighter(ctx, f, { alpha: 1, flash: f.hitlag > 0 ? 0.5 : 0, shakeX: 0, shakeY: 0, t: this.t });
      ctx.restore();
      // pointer toward the real position
      const ang = Math.atan2(sy - by, sx - bx);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(bx + Math.cos(ang) * (R + 24), by + Math.sin(ang) * (R + 24));
      ctx.lineTo(bx + Math.cos(ang + 0.35) * (R + 4), by + Math.sin(ang + 0.35) * (R + 4));
      ctx.lineTo(bx + Math.cos(ang - 0.35) * (R + 4), by + Math.sin(ang - 0.35) * (R + 4));
      ctx.closePath();
      ctx.fill();
    }
  }
}

function dustColor(m: Match): string {
  return m.stage.def.theme === 'space' ? '#9fe8ff' : m.stage.def.theme === 'harbor' ? '#d8c8b0' : '#f0dcc4';
}

function groundBelow(m: Match, x: number, y: number): number | null {
  let best: number | null = null;
  const M = m.stage.main;
  if (x >= M.x1 && x <= M.x2 && M.top >= y) best = M.top;
  for (const p of m.stage.plats) if (x >= p.x1 && x <= p.x2 && p.y >= y && (best === null || p.y < best)) best = p.y;
  return best;
}
