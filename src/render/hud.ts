import type { FighterDef } from '../sim/defs';
import { Fighter } from '../sim/fighter';
import type { Match } from '../sim/match';
import { VIEW_H, VIEW_W } from './camera';
import { CPU_GREY, INK, PLAYER_COLORS, mix, percentColor } from './color';
import { drawFighter } from './fighterDraw';
import type { MatchRenderer } from './renderer';
import { roundRect } from './stageDraw';

export const FONT_DISPLAY = '"Avenir Next Condensed", "Futura", "Arial Narrow", "Arial Black", sans-serif';
export const FONT_UI = '"Avenir Next", "Futura", "Helvetica Neue", Arial, sans-serif';

const portraitCache = new Map<string, Fighter>();

/** A posed, never-simulated fighter used for portraits and menus. */
export function portraitFighter(def: FighterDef, palette: number): Fighter {
  const key = `${def.id}:${palette}`;
  let f = portraitCache.get(key);
  if (!f) {
    f = new Fighter(0, def, palette, 0);
    f.x = 0;
    f.y = 0;
    f.facing = 1;
    f.computeBoxes();
    portraitCache.set(key, f);
  }
  return f;
}

/** Draw a fighter's head-and-shoulders portrait centred at (cx, cy) with the given head height. */
export function drawPortrait(ctx: CanvasRenderingContext2D, def: FighterDef, palette: number, cx: number, cy: number, scale: number, t = 0): void {
  const f = portraitFighter(def, palette);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-f.pose.head.x * 0.6, f.pose.head.y * 0.92);
  drawFighter(ctx, f, { alpha: 1, flash: 0, shakeX: 0, shakeY: 0, t });
  ctx.restore();
}

export function drawHud(ctx: CanvasRenderingContext2D, m: Match, r: MatchRenderer): void {
  const n = m.fighters.length;
  const cardW = 300;
  const gap = 34;
  const total = n * cardW + (n - 1) * gap;
  const x0 = (VIEW_W - total) / 2;
  const y0 = VIEW_H - 150;
  for (let i = 0; i < n; i++) {
    const f = m.fighters[i];
    const p = r.players[i];
    const col = p.cpu > 0 ? CPU_GREY : PLAYER_COLORS[p.slot % 4];
    const x = x0 + i * (cardW + gap);
    const out = f.eliminated;
    ctx.save();
    ctx.globalAlpha = out ? 0.45 : 1;
    // card: slanted plate
    ctx.fillStyle = INK;
    skew(ctx, x - 6, y0 - 6, cardW + 12, 128);
    ctx.fill();
    const g = ctx.createLinearGradient(x, y0, x, y0 + 116);
    g.addColorStop(0, mix(col, '#ffffff', 0.12));
    g.addColorStop(1, mix(col, INK, 0.35));
    ctx.fillStyle = g;
    skew(ctx, x, y0, cardW, 116);
    ctx.fill();
    // portrait window
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 62, y0 + 58, 48, 0, Math.PI * 2);
    ctx.fillStyle = mix(col, INK, 0.6);
    ctx.fill();
    ctx.clip();
    drawPortrait(ctx, f.def, f.palette, x + 62, y0 + 70, 1.25, r.t);
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x + 62, y0 + 58, 48, 0, Math.PI * 2);
    ctx.stroke();
    // name + tag
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 italic 24px ${FONT_DISPLAY}`;
    ctx.textAlign = 'left';
    ctx.fillText(f.def.name, x + 120, y0 + 30);
    ctx.font = `800 16px ${FONT_UI}`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(p.cpu > 0 ? `CPU  LV ${p.cpu}` : `P${p.slot + 1}`, x + 120, y0 + 50);
    // percent
    const shake = r.hudShake[i];
    const sx = (Math.random() * 2 - 1) * shake;
    const sy = (Math.random() * 2 - 1) * shake;
    const pct = Math.floor(f.percent);
    const dec = Math.floor((f.percent - pct) * 10);
    ctx.textAlign = 'right';
    ctx.lineJoin = 'round';
    ctx.font = `900 italic 62px ${FONT_DISPLAY}`;
    const px = x + cardW - 44 + sx;
    const py = y0 + 104 + sy;
    ctx.lineWidth = 9;
    ctx.strokeStyle = INK;
    ctx.strokeText(`${pct}`, px, py);
    ctx.fillStyle = out ? '#8a8aa0' : percentColor(f.percent);
    ctx.fillText(`${pct}`, px, py);
    ctx.font = `900 italic 26px ${FONT_DISPLAY}`;
    ctx.lineWidth = 6;
    ctx.strokeText(`.${dec}%`, x + cardW - 6 + sx, py);
    ctx.fillText(`.${dec}%`, x + cardW - 6 + sx, py);
    // stocks
    const stocks = Math.max(0, f.stocks);
    for (let s = 0; s < Math.min(stocks, 5); s++) {
      const cx = x + 128 + s * 22;
      const cy = y0 + 72;
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.def.palettes[f.palette % 4].main;
      ctx.beginPath();
      ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (stocks > 5) {
      ctx.fillStyle = '#fff';
      ctx.font = `800 16px ${FONT_UI}`;
      ctx.textAlign = 'left';
      ctx.fillText(`×${stocks}`, x + 128 + 5 * 22, y0 + 78);
    }
    ctx.restore();
  }
  if (m.timeLeft >= 0 || m.suddenDeath) {
    const frames = Math.max(0, m.timeLeft);
    const secs = frames / 60;
    const mm = Math.floor(secs / 60);
    const ss = Math.floor(secs % 60);
    const cs = Math.floor((secs * 100) % 100);
    const text = m.suddenDeath ? 'SUDDEN DEATH' : `${mm}:${String(ss).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = `900 italic 44px ${FONT_DISPLAY}`;
    ctx.lineWidth = 8;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, VIEW_W - 36, 66);
    ctx.fillStyle = frames < 600 && !m.suddenDeath ? '#ff6a5a' : '#ffffff';
    ctx.fillText(text, VIEW_W - 36, 66);
    ctx.restore();
  }
}

function skew(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const k = 14;
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - k, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

export { roundRect };
