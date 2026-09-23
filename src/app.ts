import { Sfx } from './audio/sfx';
import { Devices } from './input/devices';
import { isTouchCapable } from './input/touchpad';
import { VIEW_H, VIEW_W } from './render/camera';
import { loadSettings, saveSettings } from './ui/settings';

export interface Scene {
  name: string;
  update(app: App): void;
  render(ctx: CanvasRenderingContext2D, app: App): void;
}

/** Canvas, fixed 60 Hz loop, input, audio, and scene switching. */
export class App {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  devices = new Devices();
  sfx = new Sfx();
  scene: Scene;
  debug = false;
  /** FPS counter only, independent of the full hitbox/state debug overlay. */
  showFps = false;
  tick = 0;
  private acc = 0;
  private last = 0;
  private scale = 1;
  private offX = 0;
  private offY = 0;
  private rotateT = 0;
  perf = { update: 0, render: 0, fps: 60, samples: [] as number[], frameTimes: [] as number[] };

  constructor(canvas: HTMLCanvasElement, first: Scene) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.scene = first;
    this.devices.attach(canvas);
    this.devices.toLogical = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      return [((cx - r.left) / r.width) * VIEW_W, ((cy - r.top) / r.height) * VIEW_H];
    };
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 60));
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'Backquote') this.debug = !this.debug;
      if (e.code === 'KeyP' && !e.metaKey && !e.ctrlKey) {
        this.showFps = !this.showFps;
        this.persistSettings();
      }
      if (e.code === 'KeyM' && !e.metaKey && !e.ctrlKey) this.sfx.toggleMute();
      this.sfx.unlock();
    });
    // A touch pointerdown is not a user activation; audio can only start on the release/click.
    for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click'] as const) {
      window.addEventListener(ev, () => this.sfx.unlock(), { capture: true, passive: true });
    }
    const saved = loadSettings();
    this.showFps = saved.showFps;
    this.devices.touch.setLayout(saved.touchLayout);
    this.resize();
    const w = window as unknown as Record<string, unknown>;
    w.__game = {
      scene: () => this.scene.name,
      perf: () => ({ ...this.perf, samples: undefined, frameTimes: undefined }),
      app: this,
    };
  }

  /** Save the current FPS-counter and touch-layout settings to localStorage. */
  persistSettings(): void {
    saveSettings({ showFps: this.showFps, touchLayout: this.devices.touch.getLayout() });
  }

  resize(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const s = Math.min(ww / VIEW_W, wh / VIEW_H);
    const cw = Math.floor(VIEW_W * s);
    const ch = Math.floor(VIEW_H * s);
    this.canvas.style.width = `${cw}px`;
    this.canvas.style.height = `${ch}px`;
    this.canvas.width = Math.floor(cw * dpr);
    this.canvas.height = Math.floor(ch * dpr);
    this.scale = this.canvas.width / VIEW_W;
    this.offX = 0;
    this.offY = 0;
  }

  setScene(s: Scene): void {
    this.scene = s;
  }

  /** Switch scenes behind a diagonal wipe. */
  goto(s: Scene): void {
    if (this.wipe) {
      this.wipe.next = s;
      return;
    }
    this.wipe = { t: 0, next: s, swapped: false };
  }

  wipe: { t: number; next: Scene; swapped: boolean } | null = null;
  private reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  private wipeLen(): number {
    return this.reducedMotion ? 8 : 26;
  }

  private drawWipe(ctx: CanvasRenderingContext2D): void {
    const w = this.wipe;
    if (!w) return;
    const L = this.wipeLen();
    const half = L / 2;
    // cover: band sweeps in from the right; reveal: continues out to the left
    const p = w.t < half ? w.t / half : (w.t - half) / half;
    const ease = (x: number) => 1 - (1 - x) * (1 - x);
    const k = ease(Math.min(1, p));
    const slant = 380;
    const span = VIEW_W + slant;
    const colors = ['#ff3b4f', '#ffc83b', '#3b8bff', '#15111f'];
    ctx.save();
    for (let i = 0; i < colors.length; i++) {
      const lag = i * 0.08;
      const kk = Math.max(0, Math.min(1, (k - lag) / (1 - lag * 0.5)));
      let x0: number;
      let x1: number;
      if (w.t < half) {
        x0 = VIEW_W - kk * (span + 200) - 100;
        x1 = VIEW_W + slant + 200;
      } else {
        x0 = -slant - 200;
        x1 = VIEW_W + slant - kk * (span + 400);
      }
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.moveTo(x0 + slant, 0);
      ctx.lineTo(x1 + slant, 0);
      ctx.lineTo(x1, VIEW_H);
      ctx.lineTo(x0, VIEW_H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private needsRotate(): boolean {
    return isTouchCapable() && window.innerHeight > window.innerWidth;
  }

  private drawRotatePrompt(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#07060d';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    ctx.save();
    ctx.translate(cx, cy - 140);
    ctx.rotate((-90 * Math.PI) / 180 + Math.sin(this.rotateT * 0.05) * 0.12);
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 10;
    ctx.strokeRect(-70, -120, 140, 240);
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(0, 100, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '900 italic 64px "Avenir Next Condensed", "Futura", "Arial Narrow", "Arial Black", sans-serif';
    ctx.fillText('ROTATE YOUR DEVICE', cx, cy + 90);
    ctx.font = '600 28px "Avenir Next", "Futura", "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('LAUNCH PARTY plays in landscape', cx, cy + 140);
  }

  start(): void {
    this.canvas.focus();
    this.last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(100, now - this.last);
      this.last = now;
      if (this.needsRotate()) {
        this.rotateT++;
        this.acc = 0;
        this.devices.poll();
        this.devices.endTick();
        const ctx = this.ctx;
        ctx.setTransform(this.scale, 0, 0, this.scale, this.offX, this.offY);
        this.drawRotatePrompt(ctx);
        requestAnimationFrame(frame);
        return;
      }
      this.acc += dt;
      const step = 1000 / 60;
      const t0 = performance.now();
      let n = 0;
      while (this.acc >= step && n < 4) {
        this.devices.poll();
        if (this.wipe) {
          this.wipe.t++;
          if (!this.wipe.swapped && this.wipe.t >= this.wipeLen() / 2) {
            this.wipe.swapped = true;
            this.scene = this.wipe.next;
          }
          if (this.wipe.t >= this.wipeLen()) this.wipe = null;
          // Scene.update() doesn't run during a wipe, so don't clear input edges (click/tap
          // pulses) here either — otherwise a click landing mid-transition is silently lost
          // before the new scene ever gets a chance to see it.
        } else {
          this.scene.update(this);
          this.devices.endTick();
        }
        this.tick++;
        this.acc -= step;
        n++;
      }
      if (n === 4) this.acc = 0;
      const t1 = performance.now();
      const ctx = this.ctx;
      ctx.setTransform(this.scale, 0, 0, this.scale, this.offX, this.offY);
      this.scene.render(ctx, this);
      this.drawWipe(ctx);
      const t2 = performance.now();
      this.recordPerf(t1 - t0, t2 - t1, dt, n);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  private recordPerf(update: number, render: number, dt: number, steps: number): void {
    const p = this.perf;
    // cost per simulated frame: update time is split across the steps taken this rAF
    p.samples.push(update + render);
    p.frameTimes.push(dt);
    if (p.samples.length > 120) p.samples.shift();
    if (p.frameTimes.length > 120) p.frameTimes.shift();
    const k = 0.05;
    p.update = p.update * (1 - k) + (steps > 0 ? update / steps : 0) * k;
    p.render = p.render * (1 - k) + render * k;
    const avg = p.frameTimes.reduce((a, b) => a + b, 0) / p.frameTimes.length;
    p.fps = 1000 / Math.max(1, avg);
  }

  perfText(): string {
    const p = this.perf;
    return `update ${p.update.toFixed(2)}ms  render ${p.render.toFixed(2)}ms  ${p.fps.toFixed(0)} fps`;
  }
}
