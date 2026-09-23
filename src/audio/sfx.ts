import type { SimEvent } from '../sim/events';

/** Synthesized sound effects (Web Audio only — no audio files). */
export class Sfx {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;
  private recent = 0;
  private recentAt = 0;

  unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 6;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.55, this.ctx.currentTime, 0.02);
  }

  private ok(): boolean {
    if (!this.ctx || !this.master || this.ctx.state !== 'running') return false;
    const now = this.ctx.currentTime;
    if (now - this.recentAt > 0.03) {
      this.recentAt = now;
      this.recent = 0;
    }
    return ++this.recent <= 5;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0): void {
    const c = this.ctx!;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, freq: number, q: number, type: BiquadFilterType = 'bandpass', slideTo?: number, delay = 0): void {
    const c = this.ctx!;
    const t = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (slideTo) f.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(this.master!);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.02);
  }

  hit(dmg: number, kind: string, blocked: boolean): void {
    if (!this.ok()) return;
    const k = Math.min(1, dmg / 20);
    if (blocked) {
      this.tone(1400 - k * 400, 0.09, 'triangle', 0.18);
      this.noise(0.06, 0.12, 3000, 2);
      return;
    }
    const pitch = 220 - k * 120;
    switch (kind) {
      case 'slash':
      case 'tip':
        this.noise(0.12 + k * 0.1, 0.35 + k * 0.3, 5200, 1.5, 'bandpass', 1800);
        this.tone(kind === 'tip' ? 1900 : 900, 0.12, 'sawtooth', 0.08 + (kind === 'tip' ? 0.1 : 0), 300);
        break;
      case 'fire':
        this.noise(0.2 + k * 0.2, 0.35 + k * 0.3, 1400, 0.8, 'lowpass', 400);
        this.tone(pitch, 0.18, 'sawtooth', 0.15, pitch * 0.5);
        break;
      case 'spark':
      case 'zap':
        this.tone(1600, 0.07, 'square', 0.08, 700);
        this.noise(0.08, 0.2, 6000, 3);
        break;
      case 'boom':
        this.explode();
        return;
      default:
        this.noise(0.08 + k * 0.14, 0.4 + k * 0.35, 1200 - k * 500, 1.1, 'lowpass', 200);
        this.tone(pitch, 0.1 + k * 0.12, 'sine', 0.35 + k * 0.25, pitch * 0.45);
    }
    if (dmg >= 14) this.tone(70, 0.28, 'sine', 0.35, 38);
  }

  ko(): void {
    if (!this.ok()) return;
    this.tone(90, 0.7, 'sine', 0.5, 30);
    this.noise(0.8, 0.5, 900, 0.7, 'lowpass', 120);
    this.tone(1320, 0.5, 'triangle', 0.12, 1320, 0.05);
    this.tone(1760, 0.6, 'triangle', 0.1, 1760, 0.12);
  }

  explode(): void {
    this.noise(0.6, 0.6, 700, 0.6, 'lowpass', 90);
    this.tone(80, 0.5, 'sine', 0.45, 32);
  }

  jump(air: boolean): void {
    if (!this.ok()) return;
    this.tone(air ? 520 : 380, 0.12, 'triangle', 0.1, air ? 980 : 720);
  }

  land(hard: boolean): void {
    if (!this.ok()) return;
    this.noise(hard ? 0.14 : 0.06, hard ? 0.22 : 0.08, 500, 0.8, 'lowpass', 120);
  }

  dash(): void {
    if (!this.ok()) return;
    this.noise(0.08, 0.07, 2400, 1.2, 'bandpass', 900);
  }

  menuMove(): void {
    if (!this.ok()) return;
    this.tone(880, 0.05, 'triangle', 0.08);
  }

  menuConfirm(): void {
    if (!this.ok()) return;
    this.tone(660, 0.09, 'triangle', 0.12);
    this.tone(990, 0.14, 'triangle', 0.12, undefined, 0.06);
  }

  menuBack(): void {
    if (!this.ok()) return;
    this.tone(520, 0.1, 'triangle', 0.1, 330);
  }

  countdown(n: number): void {
    if (!this.ok()) return;
    this.tone(n > 0 ? 620 : 1240, n > 0 ? 0.2 : 0.5, 'square', 0.12);
  }

  fanfare(): void {
    if (!this.ok()) return;
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.14, undefined, i * 0.09));
  }

  event(e: SimEvent): void {
    switch (e.t) {
      case 'hit':
        this.hit(e.dmg, e.sfx, e.blocked);
        break;
      case 'ko':
        this.ko();
        break;
      case 'jump':
        this.jump(e.air);
        break;
      case 'land':
        if (e.hard) this.land(true);
        break;
      case 'dash':
        this.dash();
        break;
      case 'shieldbreak':
        if (this.ok()) {
          this.noise(0.5, 0.4, 4000, 1, 'highpass');
          this.tone(1200, 0.4, 'triangle', 0.15, 300);
        }
        break;
      case 'tech':
        if (this.ok()) this.tone(1500, 0.1, 'triangle', 0.1, 2200);
        break;
      case 'explode':
        if (this.ok()) this.explode();
        break;
      case 'shoot':
        if (this.ok()) {
          if (e.kind === 'laser') this.tone(1800, 0.09, 'square', 0.07, 600);
          else this.tone(700, 0.14, 'sine', 0.12, 1300);
        }
        break;
      case 'reflect':
        if (this.ok()) this.tone(2400, 0.12, 'triangle', 0.1, 3600);
        break;
      case 'counter':
        if (this.ok()) {
          this.tone(1800, 0.2, 'triangle', 0.14, 900);
          this.noise(0.1, 0.2, 6000, 2);
        }
        break;
      case 'grab':
        if (this.ok()) this.noise(0.07, 0.15, 900, 1.5);
        break;
      case 'item':
        if (!this.ok()) break;
        if (e.action === 'heal') [660, 880, 1100].forEach((f, i) => this.tone(f, 0.12, 'sine', 0.1, undefined, i * 0.06));
        else if (e.action === 'pickup') this.tone(900, 0.07, 'triangle', 0.1, 1200);
        else if (e.action === 'throw') this.noise(0.1, 0.12, 1800, 1.2, 'bandpass', 700);
        else if (e.action === 'spawn') this.tone(1400, 0.2, 'sine', 0.05, 1900);
        break;
      case 'countdown':
        this.countdown(e.n);
        break;
      case 'go':
        this.countdown(0);
        break;
      case 'game':
      case 'time':
        this.fanfare();
        break;
      case 'finalhit':
        if (this.ok()) this.tone(60, 1.0, 'sine', 0.5, 30);
        break;
      default:
        break;
    }
  }
}
