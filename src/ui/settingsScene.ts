import type { App, Scene } from '../app';
import { isTouchCapable } from '../input/touchpad';
import { INK } from '../render/color';
import type { Flow } from './flow';
import { menuIn } from './menuInput';
import { backdrop, font, header, hints, hoverRing, inRect, label, slab, type Rect } from './widgets';

interface Btn {
  id: string;
  rect: Rect;
  label: string;
}

/** FPS-counter toggle and (on touch devices) a drag-to-reposition editor for the on-screen controls. */
export class SettingsScene implements Scene {
  name = 'settings';
  t = 0;
  private flow: Flow;
  private editing = false;
  private hover = -1;

  private fpsRow: Rect = { x: 150, y: 210, w: 900, h: 110 };
  private editBtn: Rect = { x: 150, y: 430, w: 420, h: 84 };
  private resetBtn: Rect = { x: 610, y: 430, w: 420, h: 84 };
  private doneBtn: Rect = { x: 760, y: 900, w: 400, h: 84 };
  private back: Rect = { x: 1590, y: 976, w: 290, h: 74 };

  constructor(flow: Flow) {
    this.flow = flow;
  }

  private touchAvailable(): boolean {
    return isTouchCapable();
  }

  private buttons(): Btn[] {
    if (this.editing) return [{ id: 'done', rect: this.doneBtn, label: 'DONE' }];
    const list: Btn[] = [{ id: 'fps', rect: this.fpsRow, label: 'fps' }, { id: 'back', rect: this.back, label: 'back' }];
    if (this.touchAvailable()) list.push({ id: 'edit', rect: this.editBtn, label: 'edit' }, { id: 'reset', rect: this.resetBtn, label: 'reset' });
    return list;
  }

  update(app: App): void {
    this.t++;
    const d = app.devices;
    if (this.editing) {
      d.touch.active = true;
      d.touch.editMode = true;
      const m = d.mouse;
      this.hover = inRect(this.doneBtn, m.x, m.y) ? 0 : -1;
      if ((m.clicked && this.hover === 0) || d.globalConfirm || d.globalBack) {
        this.stopEditing(app);
      }
      return;
    }
    const m = d.mouse;
    const list = this.buttons();
    this.hover = list.findIndex((b) => inRect(b.rect, m.x, m.y));
    if (m.clicked && this.hover >= 0) {
      const id = list[this.hover].id;
      app.sfx.menuMove();
      if (id === 'fps') {
        app.showFps = !app.showFps;
        app.persistSettings();
      } else if (id === 'edit') {
        this.editing = true;
        app.sfx.menuConfirm();
      } else if (id === 'reset') {
        d.touch.resetLayout();
        app.persistSettings();
      } else if (id === 'back') {
        app.sfx.menuBack();
        this.flow.menu();
      }
      return;
    }
    const inp = menuIn(app);
    if (inp.back || d.globalBack) {
      app.sfx.menuBack();
      this.flow.menu();
    }
  }

  private stopEditing(app: App): void {
    this.editing = false;
    app.devices.touch.editMode = false;
    app.devices.touch.active = false;
    app.persistSettings();
    app.sfx.menuConfirm();
  }

  render(ctx: CanvasRenderingContext2D, app: App): void {
    backdrop(ctx, this.t, '#1b2248');
    if (this.editing) {
      this.renderEditing(ctx, app);
      return;
    }
    header(ctx, 'SETTINGS');
    // FPS row
    const fr = this.fpsRow;
    const sel = this.hover === 0;
    slab(ctx, fr, sel ? '#3b3566' : '#2d2758', { shadow: 8, outline: 5 });
    label(ctx, 'SHOW FPS COUNTER', fr.x + 40, fr.y + 60, 38, { stroke: 8 });
    ctx.font = font(20, 'ui', 700);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textAlign = 'left';
    ctx.fillText('Same as pressing P during play', fr.x + 40, fr.y + 84);
    this.drawToggle(ctx, fr.x + fr.w - 190, fr.y + 20, app.showFps);
    if (this.hover === 0) hoverRing(ctx, fr);

    if (this.touchAvailable()) {
      label(ctx, 'TOUCH CONTROLS', 150, 390, 30, { face: 'ui', weight: 800, color: '#ffe066', stroke: 6 });
      const eb = this.editBtn;
      slab(ctx, eb, this.hover === 2 ? '#3b8bff' : '#2d2758', { shadow: 6, outline: 5 });
      label(ctx, 'EDIT LAYOUT', eb.x + eb.w / 2 + 4, eb.y + 52, 38, { align: 'center', stroke: 8 });
      if (this.hover === 2) hoverRing(ctx, eb);
      const rb = this.resetBtn;
      slab(ctx, rb, this.hover === 3 ? '#3b3566' : '#2d2758', { shadow: 6, outline: 5 });
      label(ctx, 'RESET TO DEFAULT', rb.x + rb.w / 2 + 4, rb.y + 52, 32, { align: 'center', stroke: 7 });
      if (this.hover === 3) hoverRing(ctx, rb);
      ctx.font = font(20, 'ui', 600);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.textAlign = 'left';
      ctx.fillText('Drag the joystick, buttons, or pause icon anywhere on screen to move them.', 150, 550);
    } else {
      ctx.font = font(22, 'ui', 600);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textAlign = 'left';
      ctx.fillText('Touch controls appear here automatically on a phone or tablet.', 150, 340);
    }

    const backIdx = this.buttons().findIndex((b) => b.id === 'back');
    const bb = this.back;
    const backSel = this.hover === backIdx;
    slab(ctx, bb, backSel ? '#ffe066' : '#3b3566', { shadow: 6 });
    label(ctx, 'BACK', bb.x + bb.w / 2 + 6, bb.y + 50, 40, { align: 'center', color: backSel ? INK : '#fff' });
    if (backSel) hoverRing(ctx, bb);

    hints(ctx, [[['Esc'], 'back'], [['P'], 'toggle fps']]);
  }

  private renderEditing(ctx: CanvasRenderingContext2D, app: App): void {
    ctx.fillStyle = 'rgba(10,8,22,0.35)';
    ctx.fillRect(0, 0, 1920, 1080);
    label(ctx, 'DRAG TO REPOSITION', 150, 260, 46, { stroke: 10, color: '#ffe066' });
    ctx.font = font(24, 'ui', 600);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText('Touch and drag the joystick, any button, or the pause icon. Tap DONE to save.', 150, 300);
    app.devices.touch.draw(ctx);
    const db = this.doneBtn;
    const sel = this.hover === 0;
    slab(ctx, db, sel ? '#ffe066' : '#3b8bff', { shadow: 10 });
    label(ctx, 'DONE', db.x + db.w / 2 + 4, db.y + 54, 42, { align: 'center', color: sel ? INK : '#fff' });
    if (sel) hoverRing(ctx, db);
  }

  private drawToggle(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean): void {
    const w = 150;
    const h = 56;
    ctx.fillStyle = on ? '#3ed07a' : 'rgba(255,255,255,0.18)';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, h / 2);
    else ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();
    const kx = on ? x + w - h / 2 : x + h / 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(kx, y + h / 2, h / 2 - 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = font(20, 'ui', 800);
    ctx.textAlign = on ? 'left' : 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(on ? 'ON' : 'OFF', on ? x + 16 : x + w - 16, y + h / 2 + 7);
  }
}
