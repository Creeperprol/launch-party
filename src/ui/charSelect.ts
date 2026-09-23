import type { App, Scene } from '../app';
import { FIGHTERS } from '../content/fighters';
import { DEVICE_IDS, deviceLabel, type DeviceId } from '../input/devices';
import { VIEW_W } from '../render/camera';
import { CPU_GREY, INK, PLAYER_COLORS, mix, rgba } from '../render/color';
import { drawFighter } from '../render/fighterDraw';
import type { Flow } from './flow';
import { posedFighter } from './poses';
import { ITEM_LABELS, STOCK_OPTIONS, TIME_OPTIONS, type Session } from './session';
import { backdrop, focusRing, font, header, hoverRing, inRect, label, roundRectPath, slab, slabPath, type Rect } from './widgets';

type ElKind = 'rule' | 'roster' | 'type' | 'fighter' | 'level' | 'fight';

interface El {
  id: string;
  kind: ElKind;
  /** Rule name, fighter index (-1 random), or slot index. */
  arg: number;
  rect: Rect;
}

interface Cursor {
  slot: number;
  focus: string;
}

const RULES = ['stocks', 'time', 'items'] as const;
const CARD_Y = 548;
const CARD_H = 412;

export class CharSelectScene implements Scene {
  name = 'charselect';
  t = 0;
  private flow: Flow;
  private s: Session;
  els: El[] = [];
  byId = new Map<string, El>();
  cursors = new Map<DeviceId, Cursor>();
  hover: El | null = null;
  mouseSlot = 0;
  toast = '';
  toastT = 0;

  constructor(flow: Flow) {
    this.flow = flow;
    this.s = flow.session;
    this.build();
    for (const [i, sl] of this.s.slots.entries()) {
      if (sl.type === 'human' && sl.device) this.cursors.set(sl.device, { slot: i, focus: `roster:${sl.fighter}` });
    }
  }

  private build(): void {
    const add = (e: El) => {
      this.els.push(e);
      this.byId.set(e.id, e);
    };
    RULES.forEach((r, i) => add({ id: `rule:${r}`, kind: 'rule', arg: i, rect: { x: 930 + i * 322, y: 46, w: 296, h: 72 } }));
    const tw = 330;
    const gap = 24;
    const x0 = (VIEW_W - (5 * tw + 4 * gap)) / 2;
    for (let i = 0; i < 5; i++) {
      const fi = i < 4 ? i : -1;
      add({ id: `roster:${fi}`, kind: 'roster', arg: fi, rect: { x: x0 + i * (tw + gap), y: 170, w: tw, h: 300 } });
    }
    const cw = 420;
    const cg = 30;
    const c0 = (VIEW_W - (4 * cw + 3 * cg)) / 2;
    for (let i = 0; i < 4; i++) {
      const x = c0 + i * (cw + cg);
      add({ id: `type:${i}`, kind: 'type', arg: i, rect: { x: x + 16, y: CARD_Y + 14, w: cw - 32, h: 58 } });
      add({ id: `fighter:${i}`, kind: 'fighter', arg: i, rect: { x: x + 16, y: CARD_Y + 262, w: cw - 32, h: 62 } });
      add({ id: `level:${i}`, kind: 'level', arg: i, rect: { x: x + 16, y: CARD_Y + 338, w: cw - 32, h: 58 } });
    }
    add({ id: 'fight', kind: 'fight', arg: 0, rect: { x: 170, y: 976, w: VIEW_W - 340, h: 74 } });
  }

  cardRect(i: number): Rect {
    const cw = 420;
    const cg = 30;
    const c0 = (VIEW_W - (4 * cw + 3 * cg)) / 2;
    return { x: c0 + i * (cw + cg), y: CARD_Y, w: cw, h: CARD_H };
  }

  /** Can this element be focused / used by this cursor? */
  enabled(e: El, cur: Cursor | null): boolean {
    const sl = e.kind === 'type' || e.kind === 'fighter' || e.kind === 'level' ? this.s.slots[e.arg] : null;
    switch (e.kind) {
      case 'rule':
      case 'roster':
        return true;
      case 'type':
        return !!sl && (sl.type !== 'human' || !cur || cur.slot === e.arg);
      case 'fighter':
        return !!sl && (sl.type === 'cpu' || (sl.type === 'human' && (!cur || cur.slot === e.arg)));
      case 'level':
        return !!sl && sl.type === 'cpu';
      case 'fight':
        return this.s.canStart();
    }
  }

  private move(cur: Cursor, dx: number, dy: number): boolean {
    const from = this.byId.get(cur.focus);
    if (!from) return false;
    const fx = from.rect.x + from.rect.w / 2;
    const fy = from.rect.y + from.rect.h / 2;
    let best: El | null = null;
    let bd = Infinity;
    for (const e of this.els) {
      if (e === from || !this.enabled(e, cur)) continue;
      const ex = e.rect.x + e.rect.w / 2;
      const ey = e.rect.y + e.rect.h / 2;
      const px = ex - fx;
      const py = ey - fy;
      const along = dx !== 0 ? px * dx : py * dy;
      if (along <= 8) continue;
      const cross = dx !== 0 ? Math.abs(py) : Math.abs(px);
      const d = along + cross * (dx !== 0 ? 3 : 0.9);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    if (best) {
      cur.focus = best.id;
      return true;
    }
    return false;
  }

  private say(msg: string): void {
    this.toast = msg;
    this.toastT = 150;
  }

  private start(app: App): void {
    if (!this.s.canStart()) {
      app.sfx.menuBack();
      this.say(this.s.active().length < 2 ? 'Need at least 2 fighters — join or add a CPU' : 'Every human needs to pick a fighter');
      return;
    }
    app.sfx.menuConfirm();
    this.flow.stageSelect();
  }

  private cycleRule(i: number, dir: number): void {
    const r = this.s.rules;
    if (i === 0) r.stocks = STOCK_OPTIONS[(STOCK_OPTIONS.indexOf(r.stocks) + dir + STOCK_OPTIONS.length) % STOCK_OPTIONS.length];
    else if (i === 1) r.time = TIME_OPTIONS[(TIME_OPTIONS.indexOf(r.time) + dir + TIME_OPTIONS.length) % TIME_OPTIONS.length];
    else r.items = (r.items + dir + 4) % 4;
  }

  /** Activate an element on behalf of a player cursor (or the mouse when cur is null). */
  private activate(app: App, e: El, cur: Cursor | null, dir = 1): void {
    const S = this.s;
    switch (e.kind) {
      case 'rule':
        this.cycleRule(e.arg, dir);
        app.sfx.menuMove();
        break;
      case 'roster': {
        const slot = cur ? cur.slot : this.mouseSlot;
        const sl = S.slots[slot];
        if (sl.type === 'off') {
          this.say('Click a card to add a CPU, or press a join button');
          app.sfx.menuBack();
          break;
        }
        sl.fighter = e.arg;
        if (sl.type === 'human') sl.ready = true;
        app.sfx.menuConfirm();
        break;
      }
      case 'type': {
        const sl = S.slots[e.arg];
        if (sl.type === 'off') {
          sl.type = 'cpu';
          sl.ready = true;
          sl.device = null;
        } else if (sl.type === 'cpu') {
          sl.type = 'off';
        } else if (!cur || cur.slot === e.arg) {
          this.leave(sl.device!);
        }
        app.sfx.menuMove();
        break;
      }
      case 'fighter': {
        const sl = S.slots[e.arg];
        if (sl.type === 'off') break;
        const n = FIGHTERS.length + 1;
        const idx = sl.fighter < 0 ? FIGHTERS.length : sl.fighter;
        const next = (idx + dir + n) % n;
        sl.fighter = next === FIGHTERS.length ? -1 : next;
        if (sl.type === 'human') sl.ready = true;
        app.sfx.menuMove();
        break;
      }
      case 'level': {
        const sl = S.slots[e.arg];
        if (sl.type !== 'cpu') break;
        sl.level = ((sl.level - 1 + dir + 9) % 9) + 1;
        app.sfx.menuMove();
        break;
      }
      case 'fight':
        this.start(app);
        break;
    }
  }

  private leave(dev: DeviceId): void {
    const cur = this.cursors.get(dev);
    if (!cur) return;
    const sl = this.s.slots[cur.slot];
    sl.type = 'off';
    sl.device = null;
    sl.ready = false;
    this.cursors.delete(dev);
  }

  update(app: App): void {
    this.t++;
    if (this.toastT > 0) this.toastT--;
    const d = app.devices;
    const S = this.s;
    // joins
    for (const id of DEVICE_IDS) {
      if (this.cursors.has(id) || !d.connected(id) || !d.joinPressed(id)) continue;
      const free = S.slots.findIndex((sl) => sl.type === 'off');
      if (free < 0) {
        this.say('All four slots are taken — turn a CPU off to join');
        continue;
      }
      const sl = S.slots[free];
      sl.type = 'human';
      sl.device = id;
      sl.ready = false;
      this.cursors.set(id, { slot: free, focus: `roster:${sl.fighter}` });
      app.sfx.menuConfirm();
    }
    // per-player navigation
    for (const [id, cur] of this.cursors) {
      const sl = S.slots[cur.slot];
      if (sl.type !== 'human' || sl.device !== id) {
        this.cursors.delete(id);
        continue;
      }
      const e = d.menu(id);
      const focusEl = this.byId.get(cur.focus);
      if (!focusEl || !this.enabled(focusEl, cur)) cur.focus = `roster:${sl.fighter}`;
      if (e.left && this.move(cur, -1, 0)) app.sfx.menuMove();
      if (e.right && this.move(cur, 1, 0)) app.sfx.menuMove();
      if (e.up && this.move(cur, 0, -1)) app.sfx.menuMove();
      if (e.down && this.move(cur, 0, 1)) app.sfx.menuMove();
      if (e.start) {
        this.start(app);
        return;
      }
      if (e.confirm && this.joined.has(id)) {
        const el = this.byId.get(cur.focus);
        if (el && this.enabled(el, cur)) this.activate(app, el, cur);
      }
      if (e.back) {
        if (sl.ready) {
          sl.ready = false;
          app.sfx.menuBack();
        } else {
          this.leave(id);
          app.sfx.menuBack();
        }
      }
    }
    this.joined = new Set(this.cursors.keys());
    // mouse
    const m = d.mouse;
    this.hover = null;
    for (const el of this.els) if (inRect(el.rect, m.x, m.y) && this.enabled(el, null)) this.hover = el;
    if (m.clicked) {
      for (let i = 0; i < 4; i++) if (inRect(this.cardRect(i), m.x, m.y) && S.slots[i].type !== 'off') this.mouseSlot = i;
      if (this.hover) {
        const r = this.hover.rect;
        const dir = (this.hover.kind === 'rule' || this.hover.kind === 'fighter' || this.hover.kind === 'level') && m.x < r.x + r.w / 2 ? -1 : 1;
        this.activate(app, this.hover, null, dir);
      }
    }
    if (S.slots[this.mouseSlot].type === 'off') {
      const first = S.active()[0];
      if (first !== undefined) this.mouseSlot = first;
    }
    if (d.globalConfirm) this.start(app);
    else if (d.globalBack) {
      app.sfx.menuBack();
      this.flow.menu();
    }
  }

  /** Devices joined before this tick (so a join press does not also select). */
  private joined = new Set<DeviceId>();

  render(ctx: CanvasRenderingContext2D, app: App): void {
    const t = this.t;
    const S = this.s;
    backdrop(ctx, t, '#1c1740');
    header(ctx, 'CHOOSE YOUR FIGHTER');
    // rules
    const ruleText = [
      `STOCKS  ${S.rules.stocks}`,
      `TIME  ${S.rules.time === 0 ? 'OFF' : `${S.rules.time}:00`}`,
      `ITEMS  ${ITEM_LABELS[S.rules.items]}`,
    ];
    RULES.forEach((r, i) => {
      const el = this.byId.get(`rule:${r}`)!;
      slab(ctx, el.rect, '#2d2758', { shadow: 6, outline: 5 });
      label(ctx, '◀', el.rect.x + 30, el.rect.y + 49, 22, { face: 'ui', color: 'rgba(255,255,255,0.5)' });
      label(ctx, '▶', el.rect.x + el.rect.w - 44, el.rect.y + 49, 22, { face: 'ui', color: 'rgba(255,255,255,0.5)' });
      ctx.font = font(34);
      const fs = Math.min(34, Math.floor(34 * (el.rect.w - 110) / ctx.measureText(ruleText[i]).width));
      label(ctx, ruleText[i], el.rect.x + el.rect.w / 2 + 4, el.rect.y + 50, fs, { align: 'center', stroke: 7 });
    });
    // roster
    for (let i = 0; i < 5; i++) {
      const fi = i < 4 ? i : -1;
      const el = this.byId.get(`roster:${fi}`)!;
      this.drawTile(ctx, el.rect, fi);
    }
    // cards
    for (let i = 0; i < 4; i++) this.drawCard(ctx, i);
    // fight banner / hint
    const fight = this.byId.get('fight')!;
    if (S.canStart()) {
      const pulse = 1 + Math.sin(t * 0.18) * 0.012;
      ctx.save();
      ctx.translate(fight.rect.x + fight.rect.w / 2, fight.rect.y + fight.rect.h / 2);
      ctx.scale(pulse, pulse);
      ctx.translate(-(fight.rect.x + fight.rect.w / 2), -(fight.rect.y + fight.rect.h / 2));
      const g = ctx.createLinearGradient(fight.rect.x, 0, fight.rect.x + fight.rect.w, 0);
      g.addColorStop(0, '#ff3b4f');
      g.addColorStop(0.5, '#ffb03b');
      g.addColorStop(1, '#ff3b4f');
      slab(ctx, fight.rect, g, { shadow: 10 });
      label(ctx, 'ALL SET — PRESS ENTER / START', fight.rect.x + fight.rect.w / 2, fight.rect.y + 55, 50, { align: 'center', stroke: 12 });
      ctx.restore();
    } else {
      ctx.font = font(24, 'ui', 700);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText('JOIN:  F (Keys 1)  ·  \' (Keys 2)  ·  A (gamepad)      ADD CPU: select an empty card      PICK: select a fighter', VIEW_W / 2, 1024);
    }
    // mouse hover + player focus rings
    if (this.hover) hoverRing(ctx, this.hover.rect);
    const focusMap = new Map<string, number[]>();
    for (const cur of this.cursors.values()) {
      const arr = focusMap.get(cur.focus) ?? [];
      arr.push(cur.slot);
      focusMap.set(cur.focus, arr);
    }
    for (const [id, slots] of focusMap) {
      const el = this.byId.get(id);
      if (el) focusRing(ctx, el.rect, slots.sort(), t);
    }
    if (this.toastT > 0) {
      const a = Math.min(1, this.toastT / 20);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = font(26, 'ui', 800);
      const w = ctx.measureText(this.toast).width + 60;
      ctx.fillStyle = INK;
      roundRectPath(ctx, VIEW_W / 2 - w / 2, 486, w, 50, 25);
      ctx.fill();
      ctx.fillStyle = '#ffe066';
      ctx.textAlign = 'center';
      ctx.fillText(this.toast, VIEW_W / 2, 520);
      ctx.restore();
    }
    void app;
  }

  private drawTile(ctx: CanvasRenderingContext2D, r: Rect, fi: number): void {
    const t = this.t;
    if (fi < 0) {
      slab(ctx, r, '#3b3566', { skew: 0.08 });
      label(ctx, '?', r.x + r.w / 2, r.y + 200, 190, { align: 'center', stroke: 18, color: '#ffe066' });
      label(ctx, 'RANDOM', r.x + 26, r.y + r.h - 24, 44, { stroke: 10 });
      return;
    }
    const def = FIGHTERS[fi];
    const pal = def.palettes[0];
    const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    g.addColorStop(0, mix(pal.main, '#ffffff', 0.1));
    g.addColorStop(1, mix(pal.main, INK, 0.65));
    slab(ctx, r, g, { skew: 0.08 });
    ctx.save();
    slabPath(ctx, r, 0.08);
    ctx.clip();
    ctx.fillStyle = rgba('#000000', 0.15);
    for (let i = 0; i < 6; i++) ctx.fillRect(r.x + i * 70 - 60 + ((t * 0.3) % 70), r.y, 26, r.h);
    ctx.translate(r.x + r.w * 0.55, r.y + r.h + 6);
    const s = def.id === 'grott' ? 2.05 : def.id === 'zip' ? 2.6 : 2.35;
    ctx.scale(s, s);
    drawFighter(ctx, posedFighter(def, 0, null, 0), { alpha: 1, flash: 0, shakeX: 0, shakeY: 0, t: t + fi * 50 });
    ctx.restore();
    label(ctx, def.name, r.x + 30, r.y + r.h - 50, 50, { stroke: 11 });
    label(ctx, def.archetype.toUpperCase(), r.x + 24, r.y + r.h - 20, 22, { face: 'ui', weight: 800, color: pal.light, stroke: 5 });
  }

  private drawCard(ctx: CanvasRenderingContext2D, i: number): void {
    const S = this.s;
    const sl = S.slots[i];
    const r = this.cardRect(i);
    const col = PLAYER_COLORS[i];
    const t = this.t;
    if (sl.type === 'off') {
      ctx.save();
      ctx.fillStyle = 'rgba(20,16,40,0.7)';
      slabPath(ctx, r, 0.06);
      ctx.fill();
      ctx.setLineDash([16, 12]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = rgba(col, 0.6);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      label(ctx, `P${i + 1}`, r.x + r.w / 2, r.y + 190, 90, { align: 'center', color: rgba(col, 0.5), stroke: 0 });
      label(ctx, 'EMPTY', r.x + r.w / 2, r.y + 240, 30, { align: 'center', face: 'ui', weight: 800, color: 'rgba(255,255,255,0.45)' });
      const tb = this.byId.get(`type:${i}`)!;
      slab(ctx, tb.rect, '#2d2758', { shadow: 4, outline: 4 });
      label(ctx, '+ ADD CPU', tb.rect.x + tb.rect.w / 2, tb.rect.y + 41, 30, { align: 'center', stroke: 6 });
      return;
    }
    const cpu = sl.type === 'cpu';
    const base = cpu ? mix(col, CPU_GREY, 0.55) : col;
    const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    g.addColorStop(0, mix(base, '#ffffff', 0.08));
    g.addColorStop(1, mix(base, INK, 0.55));
    slab(ctx, r, g, { skew: 0.06, shadow: 10 });
    // fighter
    const fi = sl.fighter;
    ctx.save();
    slabPath(ctx, { x: r.x, y: r.y + 80, w: r.w, h: 176 }, 0.06);
    ctx.clip();
    ctx.fillStyle = rgba('#000000', 0.18);
    ctx.fillRect(r.x, r.y + 80, r.w, 176);
    if (fi >= 0) {
      const def = FIGHTERS[fi];
      const pal = this.paletteFor(i);
      const s = 250 / def.height;
      ctx.translate(r.x + r.w * 0.5, r.y + 96 + def.height * s);
      ctx.scale(s, s);
      drawFighter(ctx, posedFighter(def, pal, null, 0), { alpha: 1, flash: 0, shakeX: 0, shakeY: 0, t: t + i * 30 });
    } else {
      label(ctx, '?', r.x + r.w / 2, r.y + 230, 150, { align: 'center', stroke: 14, color: '#ffe066' });
    }
    ctx.restore();
    // type button
    const tb = this.byId.get(`type:${i}`)!;
    slab(ctx, tb.rect, INK, { shadow: 0, outline: 0 });
    const typeText = cpu ? 'CPU' : deviceLabel(sl.device!);
    label(ctx, `P${i + 1}`, tb.rect.x + 22, tb.rect.y + 44, 38, { color: col, stroke: 0 });
    label(ctx, typeText, tb.rect.x + tb.rect.w - 20, tb.rect.y + 42, 30, { align: 'right', face: 'ui', weight: 800 });
    // fighter selector
    const fb = this.byId.get(`fighter:${i}`)!;
    slab(ctx, fb.rect, 'rgba(10,8,22,0.82)', { shadow: 0, outline: 4 });
    label(ctx, '◀', fb.rect.x + 24, fb.rect.y + 42, 24, { face: 'ui', color: 'rgba(255,255,255,0.6)' });
    label(ctx, '▶', fb.rect.x + fb.rect.w - 40, fb.rect.y + 42, 24, { face: 'ui', color: 'rgba(255,255,255,0.6)' });
    label(ctx, fi >= 0 ? FIGHTERS[fi].name : 'RANDOM', fb.rect.x + fb.rect.w / 2 + 4, fb.rect.y + 47, 44, { align: 'center', stroke: 9 });
    // level / status
    const lb = this.byId.get(`level:${i}`)!;
    if (cpu) {
      slab(ctx, lb.rect, 'rgba(10,8,22,0.82)', { shadow: 0, outline: 4 });
      label(ctx, '◀', lb.rect.x + 24, lb.rect.y + 40, 24, { face: 'ui', color: 'rgba(255,255,255,0.6)' });
      label(ctx, '▶', lb.rect.x + lb.rect.w - 40, lb.rect.y + 40, 24, { face: 'ui', color: 'rgba(255,255,255,0.6)' });
      label(ctx, `LEVEL ${sl.level}`, lb.rect.x + lb.rect.w / 2, lb.rect.y + 42, 34, { align: 'center', stroke: 7 });
      for (let k = 0; k < 9; k++) {
        ctx.fillStyle = k < sl.level ? '#ffe066' : 'rgba(255,255,255,0.18)';
        ctx.fillRect(lb.rect.x + 70 + k * 30, lb.rect.y + 50, 24, 5);
      }
    } else {
      const ready = sl.ready;
      label(ctx, ready ? 'READY!' : 'PICK A FIGHTER', lb.rect.x + lb.rect.w / 2, lb.rect.y + 42, ready ? 44 : 30, {
        align: 'center', stroke: 9, color: ready ? '#ffe066' : 'rgba(255,255,255,0.85)',
      });
    }
    if (this.mouseSlot === i && S.active().length > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(r.x + r.w / 2 - 14, r.y - 20);
      ctx.lineTo(r.x + r.w / 2 + 14, r.y - 20);
      ctx.lineTo(r.x + r.w / 2, r.y - 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  /** Costume index: duplicates of the same fighter take the next palette. */
  paletteFor(slot: number): number {
    const S = this.s;
    const f = S.slots[slot].fighter;
    let n = 0;
    for (let i = 0; i < slot; i++) if (S.slots[i].type !== 'off' && S.slots[i].fighter === f) n++;
    return n % 4;
  }
}
