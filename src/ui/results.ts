import type { App, Scene } from '../app';
import { VIEW_H, VIEW_W } from '../render/camera';
import { CPU_GREY, INK, PLAYER_COLORS, mix, rgba } from '../render/color';
import { drawFighter } from '../render/fighterDraw';
import { drawPortrait } from '../render/hud';
import type { Flow } from './flow';
import type { MatchResult } from './matchScene';
import { menuIn } from './menuInput';
import { victoryFighter } from './poses';
import { font, hints, hoverRing, inRect, label, slab, type Rect } from './widgets';

const ORD = ['1ST', '2ND', '3RD', '4TH'];

export class ResultsScene implements Scene {
  name = 'results';
  t = 0;
  sel = 0;
  hover = -1;
  r: MatchResult;
  buttons: { label: string; rect: Rect }[] = [
    { label: 'REMATCH', rect: { x: 1000, y: 900, w: 380, h: 88 } },
    { label: 'CHARACTER SELECT', rect: { x: 1410, y: 900, w: 460, h: 88 } },
  ];
  private flow: Flow;

  constructor(flow: Flow, r: MatchResult) {
    this.flow = flow;
    this.r = r;
  }

  update(app: App): void {
    this.t++;
    if (this.t < 30) return;
    const inp = menuIn(app);
    const m = app.devices.mouse;
    this.hover = this.buttons.findIndex((b) => inRect(b.rect, m.x, m.y));
    if (m.moved && this.hover >= 0) this.sel = this.hover;
    if (inp.left || inp.right) {
      this.sel = 1 - this.sel;
      app.sfx.menuMove();
    }
    let go = inp.confirm;
    if (m.clicked && this.hover >= 0) {
      this.sel = this.hover;
      go = true;
    }
    if (go) {
      app.sfx.menuConfirm();
      if (this.sel === 0) this.flow.rematch();
      else this.flow.charSelect();
    } else if (inp.back) {
      app.sfx.menuBack();
      this.flow.charSelect();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.t;
    const r = this.r;
    const wi = r.winner;
    const ws = r.config.slots[wi];
    const wcol = ws.cpu > 0 ? mix(PLAYER_COLORS[ws.slot], CPU_GREY, 0.4) : PLAYER_COLORS[ws.slot];
    // backdrop: winner colour with rotating rays
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, mix(wcol, '#000000', 0.35));
    g.addColorStop(1, mix(wcol, '#000000', 0.8));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.save();
    ctx.translate(470, 560);
    ctx.rotate(t * 0.003);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = rgba('#ffffff', 0.06);
      const a0 = (i / 18) * Math.PI * 2;
      const a1 = ((i + 0.45) / 18) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a0) * 1600, Math.sin(a0) * 1600);
      ctx.lineTo(Math.cos(a1) * 1600, Math.sin(a1) * 1600);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // winner
    const k = Math.min(1, t / 24);
    const ease = 1 - (1 - k) * (1 - k);
    ctx.save();
    ctx.translate(470 - (1 - ease) * 300, 930);
    const s = ws.fighter.id === 'grott' ? 3.6 : 4.3;
    ctx.scale(s, s);
    const bob = Math.sin(t * 0.08) * 1.5;
    ctx.translate(0, bob);
    drawFighter(ctx, victoryFighter(ws.fighter, ws.palette), { alpha: 1, flash: 0, shakeX: 0, shakeY: 0, t });
    ctx.restore();
    ctx.save();
    ctx.translate(90, 150);
    ctx.rotate(-0.04);
    label(ctx, `${ws.fighter.name} WINS!`, 0, 0, 120, { stroke: 20, color: '#ffffff' });
    ctx.restore();
    label(ctx, ws.cpu > 0 ? `CPU  ·  LEVEL ${ws.cpu}` : `PLAYER ${ws.slot + 1}`, 100, 210, 34, { face: 'ui', weight: 800, stroke: 6, color: wcol });
    // standings
    const x0 = 930;
    const cols = [x0 + 520, x0 + 640, x0 + 760, x0 + 880];
    label(ctx, 'KOs', cols[0], 330, 26, { align: 'center', face: 'ui', weight: 800, color: 'rgba(255,255,255,0.8)' });
    label(ctx, 'FALLS', cols[1], 330, 26, { align: 'center', face: 'ui', weight: 800, color: 'rgba(255,255,255,0.8)' });
    label(ctx, 'SDs', cols[2], 330, 26, { align: 'center', face: 'ui', weight: 800, color: 'rgba(255,255,255,0.8)' });
    label(ctx, 'DAMAGE', cols[3], 330, 26, { align: 'center', face: 'ui', weight: 800, color: 'rgba(255,255,255,0.8)' });
    r.placements.forEach((fi, place) => {
      const sl = r.config.slots[fi];
      const st = r.stats[fi];
      const col = sl.cpu > 0 ? mix(PLAYER_COLORS[sl.slot], CPU_GREY, 0.5) : PLAYER_COLORS[sl.slot];
      const y = 350 + place * 130;
      const appear = Math.max(0, Math.min(1, (t - 10 - place * 6) / 14));
      ctx.save();
      ctx.globalAlpha = appear;
      ctx.translate((1 - appear) * 200, 0);
      slab(ctx, { x: x0, y, w: 960, h: 110 }, mix(col, INK, place === 0 ? 0.25 : 0.55), { skew: 0.12, shadow: 8 });
      label(ctx, ORD[place], x0 + 40, y + 78, place === 0 ? 64 : 54, { stroke: 10, color: place === 0 ? '#ffe066' : '#ffffff' });
      ctx.save();
      ctx.beginPath();
      ctx.arc(x0 + 210, y + 55, 44, 0, Math.PI * 2);
      ctx.fillStyle = mix(col, INK, 0.6);
      ctx.fill();
      ctx.clip();
      drawPortrait(ctx, sl.fighter, sl.palette, x0 + 210, y + 66, 1.15, t);
      ctx.restore();
      ctx.lineWidth = 5;
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.arc(x0 + 210, y + 55, 44, 0, Math.PI * 2);
      ctx.stroke();
      label(ctx, sl.fighter.name, x0 + 272, y + 56, 38, { stroke: 8 });
      label(ctx, sl.cpu > 0 ? `CPU ${sl.cpu}` : `P${sl.slot + 1}`, x0 + 274, y + 88, 22, { face: 'ui', weight: 800, color: col, stroke: 5 });
      const vals = [st.kos, st.falls, st.sds, `${Math.round(st.dealt)}%`];
      vals.forEach((v, j) => label(ctx, String(v), cols[j], y + 70, 44, { align: 'center', stroke: 8 }));
      ctx.restore();
    });
    this.buttons.forEach((b, i) => {
      const sel = i === this.sel;
      slab(ctx, b.rect, sel ? '#ffe066' : '#2d2758', { shadow: sel ? 12 : 6 });
      label(ctx, b.label, b.rect.x + b.rect.w / 2 + 6, b.rect.y + 60, 40, { align: 'center', color: sel ? INK : '#ffffff', stroke: sel ? 0 : 8 });
      if (this.hover === i) hoverRing(ctx, b.rect);
    });
    hints(ctx, [[['A', 'D'], 'or'], [['←', '→'], 'choose'], [['F', "'", 'Enter'], 'select'], [['Esc'], 'character select']]);
    void font;
  }
}
