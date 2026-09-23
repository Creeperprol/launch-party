import type { App, Scene } from '../app';
import { STAGES } from '../content/stages';
import { Camera, VIEW_H, VIEW_W } from '../render/camera';
import { INK } from '../render/color';
import { drawBackground, drawStage } from '../render/stageDraw';
import type { StageDef } from '../sim/defs';
import { StageRT } from '../sim/stage';
import type { Flow } from './flow';
import { menuIn } from './menuInput';
import { backButton, backdrop, font, header, hints, hoverRing, inRect, label, slab, slabPath, type Rect } from './widgets';

const shots = new Map<string, HTMLCanvasElement>();

/** Static half-resolution snapshot of a stage (background + geometry). */
function snapshot(def: StageDef): HTMLCanvasElement {
  let c = shots.get(def.id);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = VIEW_W / 2;
  c.height = VIEW_H / 2;
  const g = c.getContext('2d')!;
  g.scale(0.5, 0.5);
  const st = new StageRT(def);
  const cam = new Camera();
  cam.x = 0;
  cam.y = -170;
  cam.zoom = 1920 / 1500;
  drawBackground(g, st, cam, 0);
  g.save();
  cam.apply(g);
  drawStage(g, st, 0);
  g.restore();
  shots.set(def.id, c);
  return c;
}

interface Card {
  idx: number;
  rect: Rect;
}

export class StageSelectScene implements Scene {
  name = 'stageselect';
  t = 0;
  sel: number;
  hover = -1;
  cards: Card[] = [];
  backRect: Rect = { x: 1650, y: 44, w: 230, h: 74 };
  hoverBack = false;
  private flow: Flow;

  constructor(flow: Flow) {
    this.flow = flow;
    const w = 540;
    const h = 304;
    const gap = 60;
    const x0 = (VIEW_W - (3 * w + 2 * gap)) / 2;
    STAGES.forEach((_, i) => this.cards.push({ idx: i, rect: { x: x0 + i * (w + gap), y: 230, w, h } }));
    this.cards.push({ idx: -1, rect: { x: VIEW_W / 2 - 230, y: 760, w: 460, h: 120 } });
    this.sel = flow.session.stage < 0 ? 3 : flow.session.stage;
  }

  update(app: App): void {
    this.t++;
    const joined = this.flow.session.slots.filter((s) => s.type === 'human' && s.device).map((s) => s.device!);
    const inp = menuIn(app, joined.length ? joined : undefined);
    const d = app.devices;
    const m = d.mouse;
    this.hover = this.cards.findIndex((c) => inRect(c.rect, m.x, m.y));
    if (m.moved && this.hover >= 0) this.sel = this.hover;
    if (inp.left) this.step(app, -1);
    if (inp.right) this.step(app, 1);
    if (inp.down && this.sel < 3) {
      this.sel = 3;
      app.sfx.menuMove();
    }
    if (inp.up && this.sel === 3) {
      this.sel = 1;
      app.sfx.menuMove();
    }
    this.hoverBack = inRect(this.backRect, m.x, m.y);
    if (m.clicked && this.hoverBack) {
      app.sfx.menuBack();
      this.flow.charSelect();
      return;
    }
    let go = inp.confirm || d.globalConfirm;
    if (m.clicked && this.hover >= 0) {
      this.sel = this.hover;
      go = true;
    }
    if (go) {
      app.sfx.menuConfirm();
      this.flow.session.stage = this.cards[this.sel].idx;
      this.flow.match(this.flow.session.buildConfig());
      return;
    }
    if (inp.back || d.globalBack) {
      app.sfx.menuBack();
      this.flow.charSelect();
    }
  }

  private step(app: App, dir: number): void {
    this.sel = (this.sel + dir + this.cards.length) % this.cards.length;
    app.sfx.menuMove();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.t;
    const cur = this.cards[this.sel];
    backdrop(ctx, t, '#1a2045');
    if (cur.idx >= 0) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.drawImage(snapshot(STAGES[cur.idx]), 0, 0, VIEW_W, VIEW_H);
      ctx.restore();
      ctx.fillStyle = 'rgba(10,8,24,0.45)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    header(ctx, 'CHOOSE A STAGE');
    this.cards.forEach((c, i) => {
      const sel = i === this.sel;
      const r = c.rect;
      if (c.idx >= 0) {
        const def = STAGES[c.idx];
        slab(ctx, r, INK, { skew: 0.06, shadow: sel ? 14 : 8 });
        ctx.save();
        slabPath(ctx, r, 0.06);
        ctx.clip();
        ctx.drawImage(snapshot(def), r.x, r.y, r.w, r.h);
        if (!sel) {
          ctx.fillStyle = 'rgba(10,8,24,0.35)';
          ctx.fillRect(r.x, r.y, r.w, r.h);
        }
        ctx.restore();
        label(ctx, def.name, r.x + 10, r.y + r.h + 58, 46, { stroke: 10, color: sel ? '#ffe066' : '#ffffff' });
        ctx.font = font(22, 'ui', 700);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.textAlign = 'left';
        ctx.fillText(def.subtitle, r.x + 14, r.y + r.h + 92);
      } else {
        slab(ctx, r, sel ? '#ffe066' : '#3b3566', { shadow: sel ? 12 : 6 });
        label(ctx, 'RANDOM STAGE', r.x + r.w / 2 + 6, r.y + 78, 50, { align: 'center', stroke: 10, color: sel ? INK : '#ffffff', strokeColor: sel ? '#ffffff' : INK });
      }
      if (sel) {
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#ffe066';
        slabPath(ctx, { x: r.x - 10, y: r.y - 10, w: r.w + 20, h: r.h + 20 }, c.idx >= 0 ? 0.06 * (r.h / (r.h + 20)) : 0.18 * (r.h / (r.h + 20)));
        ctx.stroke();
      }
      if (this.hover === i) hoverRing(ctx, r, c.idx >= 0 ? 0.06 : undefined);
    });
    backButton(ctx, this.backRect, this.hoverBack);
    hints(ctx, [[['A', 'D'], 'or'], [['←', '→'], 'choose'], [['F', "'", 'Enter'], 'fight!'], [['Esc', 'G', ';'], 'back']]);
  }
}
