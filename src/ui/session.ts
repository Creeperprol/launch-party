import { FIGHTERS } from '../content/fighters';
import { STAGES } from '../content/stages';
import type { DeviceId } from '../input/devices';
import type { Rules } from '../sim/match';
import type { MatchConfig, SlotConfig } from './matchScene';

export type SlotType = 'off' | 'human' | 'cpu';

export interface SlotState {
  type: SlotType;
  device: DeviceId | null;
  /** Index into FIGHTERS, or -1 for random. */
  fighter: number;
  level: number;
  ready: boolean;
}

export const STOCK_OPTIONS = [1, 2, 3, 4, 5];
export const TIME_OPTIONS = [0, 3, 5, 7];
export const ITEM_LABELS = ['OFF', 'LOW', 'MEDIUM', 'HIGH'];

/** Settings that persist across screens during a session. */
export class Session {
  rules: Rules = { stocks: 3, time: 7, items: 2 };
  slots: SlotState[] = [0, 1, 2, 3].map((i) => ({ type: 'off' as SlotType, device: null, fighter: i % FIGHTERS.length, level: 5, ready: false }));
  /** Index into STAGES, or -1 for random. */
  stage = 0;
  seed = 1;
  last: MatchConfig | null = null;

  active(): number[] {
    return this.slots.map((s, i) => (s.type !== 'off' ? i : -1)).filter((i) => i >= 0);
  }

  canStart(): boolean {
    const act = this.active();
    return act.length >= 2 && act.every((i) => this.slots[i].type === 'cpu' || this.slots[i].ready);
  }

  /** Resolve randoms and duplicate costumes into a concrete match config. */
  buildConfig(): MatchConfig {
    const seed = this.seed++;
    let r = (seed * 2654435761) >>> 0;
    const rand = (n: number) => {
      r = (Math.imul(r ^ (r >>> 15), 2246822519) + 0x9e3779b9) >>> 0;
      return r % n;
    };
    const slots: SlotConfig[] = [];
    const used = new Map<number, number>();
    for (const i of this.active()) {
      const s = this.slots[i];
      const fi = s.fighter < 0 ? rand(FIGHTERS.length) : s.fighter;
      const pal = used.get(fi) ?? 0;
      used.set(fi, pal + 1);
      slots.push({ slot: i, device: s.type === 'human' ? s.device : null, cpu: s.type === 'cpu' ? s.level : 0, fighter: FIGHTERS[fi], palette: pal % 4 });
    }
    const stage = this.stage < 0 ? STAGES[rand(STAGES.length)] : STAGES[this.stage];
    const cfg: MatchConfig = { slots, stage, rules: { ...this.rules }, seed };
    this.last = cfg;
    return cfg;
  }
}
