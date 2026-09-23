import type { App, Scene } from '../app';
import { CpuController } from '../ai/cpu';
import type { DeviceId } from '../input/devices';
import { VIEW_H, VIEW_W } from '../render/camera';
import { INK, PLAYER_COLORS } from '../render/color';
import { FONT_DISPLAY, FONT_UI } from '../render/hud';
import { MatchRenderer } from '../render/renderer';
import { roundRect } from '../render/stageDraw';
import type { FighterDef, StageDef } from '../sim/defs';
import type { Stats } from '../sim/fighter';
import { neutralInput, type InputFrame } from '../sim/input';
import { Match, type Rules } from '../sim/match';

export interface SlotConfig {
  slot: number;
  device: DeviceId | null;
  cpu: number;
  fighter: FighterDef;
  palette: number;
}

export interface MatchConfig {
  slots: SlotConfig[];
  stage: StageDef;
  rules: Rules;
  seed: number;
}

export interface MatchResult {
  config: MatchConfig;
  placements: number[];
  stats: Stats[];
  winner: number;
}

interface Banner {
  text: string;
  t: number;
  life: number;
  color: string;
}

export class MatchScene implements Scene {
  name = 'match';
  cfg: MatchConfig;
  match: Match;
  renderer: MatchRenderer;
  cpus: (CpuController | null)[];
  paused = false;
  pauseSel = 0;
  slowmo = 0;
  endTimer = -1;
  banner: Banner | null = null;
  private onExit: (r: MatchResult | 'quit') => void;
  private tickCount = 0;
  private usesTouch = false;

  constructor(cfg: MatchConfig, onExit: (r: MatchResult | 'quit') => void) {
    this.cfg = cfg;
    this.onExit = onExit;
    this.match = new Match({
      stage: cfg.stage,
      players: cfg.slots.map((s) => ({ fighter: s.fighter, cpu: s.cpu, palette: s.palette, slot: s.slot })),
      rules: cfg.rules,
      seed: cfg.seed,
    });
    this.renderer = new MatchRenderer(this.match, cfg.slots.map((s) => ({ slot: s.slot, cpu: s.cpu, name: s.fighter.name })));
    this.cpus = cfg.slots.map((s, i) => (s.cpu > 0 ? new CpuController(i, s.cpu, cfg.seed * 31 + i * 7919) : null));
    this.usesTouch = cfg.slots.some((s) => s.device === 'touch');
  }

  update(app: App): void {
    const d = app.devices;
    d.touch.setActive(this.usesTouch && this.match.phase !== 'ended' && !this.paused);
    const pauseReq = d.globalBack || this.cfg.slots.some((s) => s.device && d.pausePressed(s.device));
    if (this.match.phase === 'ended') {
      this.stepSim(app);
      this.endTimer++;
      if (this.endTimer > 170) {
        const m = this.match;
        this.onExit({ config: this.cfg, placements: m.placements, stats: m.fighters.map((f) => ({ ...f.stats })), winner: m.winner });
      }
      return;
    }
    if (this.paused) {
      this.updatePause(app, pauseReq);
      return;
    }
    if (pauseReq && this.match.phase === 'play') {
      this.paused = true;
      this.pauseSel = 0;
      app.sfx.menuBack();
      return;
    }
    this.tickCount++;
    if (this.slowmo > 0) {
      this.slowmo--;
      if (this.tickCount % 3 !== 0) {
        this.renderer.cam.update(this.match);
        return;
      }
    }
    this.stepSim(app);
  }

  private stepSim(app: App): void {
    const inputs: InputFrame[] = this.cfg.slots.map((s, i) => {
      const cpu = this.cpus[i];
      if (cpu) return cpu.update(this.match);
      return s.device ? app.devices.frame(s.device) : neutralInput();
    });
    this.match.step(inputs);
    const events = this.match.drainEvents();
    this.renderer.step(this.match, events);
    for (const e of events) {
      app.sfx.event(e);
      switch (e.t) {
        case 'countdown':
          this.banner = { text: String(e.n), t: 0, life: 58, color: '#ffffff' };
          break;
        case 'go':
          this.banner = { text: 'GO!', t: 0, life: 50, color: '#ffe066' };
          break;
        case 'game':
          this.banner = { text: 'GAME!', t: 0, life: 170, color: '#ffffff' };
          this.endTimer = 0;
          break;
        case 'time':
          this.banner = { text: 'TIME!', t: 0, life: 90, color: '#ffffff' };
          break;
        case 'suddendeath':
          this.banner = { text: 'SUDDEN DEATH', t: 0, life: 150, color: '#ff5a5a' };
          break;
        case 'finalhit':
          this.slowmo = 75;
          break;
        default:
          break;
      }
    }
    if (this.banner) {
      this.banner.t++;
      if (this.banner.t > this.banner.life) this.banner = null;
    }
  }

  private updatePause(app: App, pauseReq: boolean): void {
    const d = app.devices;
    let up = false;
    let down = false;
    let ok = d.globalConfirm;
    for (const s of this.cfg.slots) {
      if (!s.device) continue;
      const e = d.menu(s.device);
      up ||= e.up;
      down ||= e.down;
      ok ||= e.confirm;
    }
    for (const id of ['kb1', 'kb2'] as const) {
      const e = d.menu(id);
      up ||= e.up;
      down ||= e.down;
      ok ||= e.confirm;
    }
    const items = this.pauseItems();
    const m = d.mouse;
    for (let i = 0; i < items.length; i++) {
      const r = items[i];
      if (m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h) {
        if (m.moved && this.pauseSel !== i) this.pauseSel = i;
        if (m.clicked) {
          this.pauseSel = i;
          ok = true;
        }
      }
    }
    if (up || down) {
      this.pauseSel = (this.pauseSel + 1) % 2;
      app.sfx.menuMove();
    }
    if (pauseReq) {
      this.paused = false;
      app.sfx.menuConfirm();
      return;
    }
    if (ok) {
      app.sfx.menuConfirm();
      if (this.pauseSel === 0) this.paused = false;
      else this.onExit('quit');
    }
  }

  private pauseItems(): { x: number; y: number; w: number; h: number; label: string }[] {
    return [
      { x: VIEW_W / 2 - 220, y: 470, w: 440, h: 78, label: 'RESUME' },
      { x: VIEW_W / 2 - 220, y: 566, w: 440, h: 78, label: 'QUIT TO CHARACTER SELECT' },
    ];
  }

  render(ctx: CanvasRenderingContext2D, app: App): void {
    this.renderer.debug = app.debug;
    this.renderer.showFps = app.showFps;
    this.renderer.draw(ctx, this.match, app.perfText());
    app.devices.touch.draw(ctx);
    if (this.banner) this.drawBanner(ctx, this.banner);
    if (this.paused) this.drawPause(ctx);
  }

  private drawBanner(ctx: CanvasRenderingContext2D, b: Banner): void {
    const k = b.t / b.life;
    const pop = b.t < 8 ? 1.6 - (b.t / 8) * 0.6 : 1;
    const alpha = k > 0.8 ? (1 - k) / 0.2 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(VIEW_W / 2, VIEW_H * 0.42);
    ctx.scale(pop, pop);
    ctx.rotate(-0.05);
    const size = b.text.length > 6 ? 130 : 200;
    ctx.font = `900 italic ${size}px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 26;
    ctx.strokeStyle = INK;
    ctx.strokeText(b.text, 0, 0);
    ctx.lineWidth = 10;
    ctx.strokeStyle = b.text === 'GO!' ? '#ff5a3a' : PLAYER_COLORS[1];
    ctx.strokeText(b.text, 0, 0);
    ctx.fillStyle = b.color;
    ctx.fillText(b.text, 0, 0);
    ctx.restore();
  }

  private drawPause(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = 'rgba(8,6,20,0.62)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.font = `900 italic 110px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 16;
    ctx.strokeStyle = INK;
    ctx.strokeText('PAUSED', VIEW_W / 2, 400);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PAUSED', VIEW_W / 2, 400);
    this.pauseItems().forEach((it, i) => {
      const sel = i === this.pauseSel;
      ctx.fillStyle = INK;
      roundRect(ctx, it.x - 5, it.y - 5, it.w + 10, it.h + 10, 18);
      ctx.fill();
      ctx.fillStyle = sel ? '#ffe066' : '#2a2448';
      roundRect(ctx, it.x, it.y, it.w, it.h, 14);
      ctx.fill();
      ctx.fillStyle = sel ? INK : '#ffffff';
      ctx.font = `900 italic 34px ${FONT_DISPLAY}`;
      ctx.fillText(it.label, VIEW_W / 2, it.y + 52);
    });
    ctx.font = `700 20px ${FONT_UI}`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Esc / Start to resume', VIEW_W / 2, 700);
    ctx.restore();
  }
}
