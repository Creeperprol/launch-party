import type { App, Scene } from '../app';
import { FIGHTERS } from '../content/fighters';
import { VIEW_W } from '../render/camera';
import { INK, PLAYER_COLORS, mix } from '../render/color';
import { drawFighter } from '../render/fighterDraw';
import type { Flow } from './flow';
import { menuIn } from './menuInput';
import { posedFighter } from './poses';
import { backdrop, font, hints, hoverRing, inRect, label, slab, type Rect } from './widgets';

interface Item {
  id: 'versus' | 'controls';
  rect: Rect;
  title: string;
  sub: string;
  color: string;
}

export class MainMenuScene implements Scene {
  name = 'menu';
  t = 0;
  sel = 0;
  hover = -1;
  private flow: Flow;
  items: Item[] = [
    { id: 'versus', rect: { x: 150, y: 300, w: 800, h: 220 }, title: 'VERSUS', sub: '2–4 players · any mix of humans and CPUs', color: PLAYER_COLORS[0] },
    { id: 'controls', rect: { x: 150, y: 600, w: 640, h: 150 }, title: 'CONTROLS', sub: 'Keyboard & gamepad layouts', color: PLAYER_COLORS[1] },
  ];

  constructor(flow: Flow) {
    this.flow = flow;
  }

  update(app: App): void {
    this.t++;
    const inp = menuIn(app);
    const m = app.devices.mouse;
    this.hover = this.items.findIndex((it) => inRect(it.rect, m.x, m.y));
    if (m.moved && this.hover >= 0) this.sel = this.hover;
    if (inp.up || inp.down) {
      this.sel = (this.sel + 1) % this.items.length;
      app.sfx.menuMove();
    }
    let go = inp.confirm;
    if (m.clicked && this.hover >= 0) {
      this.sel = this.hover;
      go = true;
    }
    if (go) {
      app.sfx.menuConfirm();
      if (this.items[this.sel].id === 'versus') this.flow.charSelect();
      else this.flow.controls();
      return;
    }
    if (inp.back) {
      app.sfx.menuBack();
      this.flow.title();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.t;
    backdrop(ctx, t);
    // small logo
    label(ctx, 'LAUNCH', 150, 170, 84, { stroke: 18, color: '#ffffff' });
    label(ctx, 'PARTY', 470, 170, 84, { stroke: 18, color: '#ffe066' });
    this.items.forEach((it, i) => {
      const sel = i === this.sel;
      const r = sel ? { x: it.rect.x - 10, y: it.rect.y - 8, w: it.rect.w + 20, h: it.rect.h + 16 } : it.rect;
      const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      g.addColorStop(0, mix(it.color, '#ffffff', sel ? 0.15 : 0));
      g.addColorStop(1, mix(it.color, INK, sel ? 0.25 : 0.45));
      slab(ctx, r, g, { shadow: sel ? 14 : 8 });
      const big = it.id === 'versus' ? 132 : 88;
      label(ctx, it.title, r.x + 70, r.y + r.h * 0.62, big, { stroke: 16, color: sel ? '#ffffff' : 'rgba(255,255,255,0.8)' });
      label(ctx, it.sub, r.x + 76, r.y + r.h * 0.62 + 44, 26, { face: 'ui', weight: 700, color: 'rgba(255,255,255,0.88)' });
      if (sel) {
        ctx.fillStyle = '#ffe066';
        ctx.beginPath();
        const ay = r.y + r.h / 2;
        ctx.moveTo(r.x - 70 + Math.sin(t * 0.2) * 6, ay - 26);
        ctx.lineTo(r.x - 26 + Math.sin(t * 0.2) * 6, ay);
        ctx.lineTo(r.x - 70 + Math.sin(t * 0.2) * 6, ay + 26);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = INK;
        ctx.stroke();
      }
      if (this.hover === i) hoverRing(ctx, r);
    });
    // fighter showcase
    const idx = Math.floor(t / 200) % FIGHTERS.length;
    const def = FIGHTERS[idx];
    const k = (t % 200) / 200;
    const slide = k < 0.1 ? (1 - k / 0.1) * 160 : 0;
    const alpha = k > 0.92 ? (1 - k) / 0.08 : 1;
    const pal = def.palettes[0];
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    slab(ctx, { x: 1120 + slide, y: 230, w: 700, h: 640 }, mix(pal.main, INK, 0.55), { skew: 0.08, shadow: 12 });
    ctx.save();
    ctx.translate(1450 + slide, 800);
    ctx.scale(3.3, 3.3);
    drawFighter(ctx, posedFighter(def, 0, null, 0), { alpha: 1, flash: 0, shakeX: 0, shakeY: 0, t });
    ctx.restore();
    label(ctx, def.name, 1170 + slide, 330, 96, { stroke: 16 });
    label(ctx, def.archetype.toUpperCase(), 1176 + slide, 372, 30, { face: 'ui', weight: 800, color: pal.accent, stroke: 6 });
    ctx.font = font(24, 'ui', 600);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(def.tagline, 1176 + slide, 850);
    ctx.restore();
    hints(ctx, [
      [['W', 'S'], 'or'],
      [['↑', '↓'], 'choose'],
      [['F', "'", 'Enter'], 'select'],
      [['Esc'], 'back'],
    ]);
    void VIEW_W;
  }
}
