import type { Match } from '../sim/match';

export const VIEW_W = 1920;
export const VIEW_H = 1080;

/** Smooth follow camera that frames every fighter inside the stage's camera bounds. */
export class Camera {
  x = 0;
  y = -250;
  zoom = 0.75;
  shake = 0;
  sx = 0;
  sy = 0;
  focus: { x: number; y: number; zoom: number; frames: number } | null = null;

  reset(m: Match): void {
    this.compute(m, true);
  }

  punch(amount: number): void {
    this.shake = Math.min(28, Math.max(this.shake, amount));
  }

  update(m: Match): void {
    this.compute(m, false);
    if (this.shake > 0.1) {
      this.sx = (Math.random() * 2 - 1) * this.shake;
      this.sy = (Math.random() * 2 - 1) * this.shake;
      this.shake *= 0.86;
    } else {
      this.shake = 0;
      this.sx = this.sy = 0;
    }
  }

  private compute(m: Match, snap: boolean): void {
    const C = m.stage.def.camera;
    let x1 = Infinity;
    let x2 = -Infinity;
    let y1 = Infinity;
    let y2 = -Infinity;
    for (const f of m.fighters) {
      if (f.state === 'dead' || f.eliminated) continue;
      x1 = Math.min(x1, f.x - 170);
      x2 = Math.max(x2, f.x + 170);
      y1 = Math.min(y1, f.y - f.H - 170);
      y2 = Math.max(y2, f.y + 110);
    }
    if (!isFinite(x1)) {
      x1 = m.stage.main.x1;
      x2 = m.stage.main.x2;
      y1 = -400;
      y2 = 100;
    }
    let w = Math.max(x2 - x1, 1350);
    let h = Math.max(y2 - y1, 760);
    let cx = (x1 + x2) / 2;
    let cy = (y1 + y2) / 2;
    if (w / h > VIEW_W / VIEW_H) h = (w * VIEW_H) / VIEW_W;
    else w = (h * VIEW_W) / VIEW_H;
    const cw = C.right - C.left;
    const ch = C.bottom - C.top;
    if (w > cw) {
      w = cw;
      h = (w * VIEW_H) / VIEW_W;
    }
    if (h > ch) {
      h = ch;
      w = (h * VIEW_W) / VIEW_H;
    }
    cx = Math.min(Math.max(cx, C.left + w / 2), C.right - w / 2);
    cy = Math.min(Math.max(cy, C.top + h / 2), C.bottom - h / 2);
    let zoom = VIEW_W / w;
    if (this.focus && this.focus.frames > 0) {
      cx = this.focus.x;
      cy = this.focus.y;
      zoom = this.focus.zoom;
      this.focus.frames--;
    }
    if (snap) {
      this.x = cx;
      this.y = cy;
      this.zoom = zoom;
    } else {
      const k = this.focus && this.focus.frames > 0 ? 0.18 : 0.085;
      this.x += (cx - this.x) * k;
      this.y += (cy - this.y) * k;
      this.zoom += (zoom - this.zoom) * k;
    }
  }

  apply(ctx: CanvasRenderingContext2D): void {
    ctx.translate(VIEW_W / 2, VIEW_H / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x + this.sx, -this.y + this.sy);
  }

  toScreen(wx: number, wy: number): [number, number] {
    return [(wx - this.x + this.sx) * this.zoom + VIEW_W / 2, (wy - this.y + this.sy) * this.zoom + VIEW_H / 2];
  }

  /** Visible world rectangle. */
  bounds(): { x1: number; y1: number; x2: number; y2: number } {
    const hw = VIEW_W / 2 / this.zoom;
    const hh = VIEW_H / 2 / this.zoom;
    return { x1: this.x - hw, y1: this.y - hh, x2: this.x + hw, y2: this.y + hh };
  }
}
