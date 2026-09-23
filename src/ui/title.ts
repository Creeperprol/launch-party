import type { App, Scene } from '../app';
import { FIGHTERS } from '../content/fighters';
import { VIEW_H, VIEW_W } from '../render/camera';
import { INK, PLAYER_COLORS } from '../render/color';
import { drawFighter } from '../render/fighterDraw';
import { star } from '../render/fx';
import type { Flow } from './flow';
import { posedFighter } from './poses';
import { backdrop, font, label, roundRectPath } from './widgets';

const SHOWCASE: [string, number, boolean][] = [
  ['fsmash', 15, false],
  ['uspecial', 3, false],
  ['bair', 7, true],
  ['utilt', 7, false],
];

export class TitleScene implements Scene {
  name = 'title';
  t = 0;
  private flow: Flow;

  constructor(flow: Flow) {
    this.flow = flow;
  }

  update(app: App): void {
    this.t++;
    if (this.t > 20 && app.devices.anyKey) {
      app.sfx.unlock();
      app.sfx.menuConfirm();
      this.flow.menu();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.t;
    backdrop(ctx, t, '#241a4a');
    // burst behind the logo
    ctx.save();
    ctx.translate(VIEW_W / 2, 330);
    ctx.rotate(t * 0.002);
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,200,59,0.10)' : 'rgba(255,59,79,0.10)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const a0 = (i / 16) * Math.PI * 2;
      const a1 = ((i + 0.5) / 16) * Math.PI * 2;
      ctx.lineTo(Math.cos(a0) * 1400, Math.sin(a0) * 1400);
      ctx.lineTo(Math.cos(a1) * 1400, Math.sin(a1) * 1400);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // fighters in action
    const xs = [330, 790, 1170, 1600];
    FIGHTERS.slice(0, xs.length).forEach((def, i) => {
      const [mv, fr, air] = SHOWCASE[i];
      const f = posedFighter(def, 0, mv, fr, air);
      const bob = Math.sin(t * 0.05 + i * 1.7) * 8;
      ctx.save();
      ctx.translate(xs[i], 935 + (air ? -20 : 0) + bob);
      const s = def.id === 'grott' ? 2.0 : 2.3;
      ctx.scale(i % 2 ? -s : s, s);
      drawFighter(ctx, f, { alpha: 1, flash: 0, shakeX: 0, shakeY: 0, t: t + i * 40 });
      ctx.restore();
    });
    // floor glow
    const g = ctx.createLinearGradient(0, 900, 0, VIEW_H);
    g.addColorStop(0, 'rgba(10,8,22,0)');
    g.addColorStop(1, 'rgba(10,8,22,0.85)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 900, VIEW_W, VIEW_H - 900);
    // logo
    ctx.save();
    ctx.translate(VIEW_W / 2, 300);
    ctx.rotate(-0.06);
    const pop = t < 20 ? 0.6 + (t / 20) * 0.4 + Math.sin((t / 20) * Math.PI) * 0.15 : 1;
    ctx.scale(pop, pop);
    logoWord(ctx, 'LAUNCH', -40, -30, 230, PLAYER_COLORS[0]);
    logoWord(ctx, 'PARTY', 90, 150, 230, PLAYER_COLORS[1]);
    ctx.fillStyle = '#ffe066';
    star(ctx, 560, -140, 70, 26, t * 0.02, 5);
    ctx.fillStyle = INK;
    ctx.restore();
    // press any button
    if (Math.floor(t / 30) % 2 === 0 || t < 30) {
      ctx.fillStyle = INK;
      roundRectPath(ctx, VIEW_W / 2 - 250, 598, 500, 72, 36);
      ctx.fill();
      ctx.fillStyle = '#ffe066';
      roundRectPath(ctx, VIEW_W / 2 - 244, 604, 488, 60, 30);
      ctx.fill();
      label(ctx, 'PRESS ANY BUTTON', VIEW_W / 2, 648, 40, { align: 'center', color: INK });
    }
    ctx.font = font(18, 'ui', 600);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'right';
    ctx.fillText('An original platform fighter · M to mute · ` debug overlay · P fps', VIEW_W - 30, VIEW_H - 24);
  }
}

function logoWord(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string): void {
  ctx.font = font(size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 40;
  ctx.strokeStyle = INK;
  ctx.strokeText(s, x + 10, y + 12);
  ctx.strokeText(s, x, y);
  ctx.lineWidth = 16;
  ctx.strokeStyle = color;
  ctx.strokeText(s, x, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(s, x, y);
  ctx.textBaseline = 'alphabetic';
}
