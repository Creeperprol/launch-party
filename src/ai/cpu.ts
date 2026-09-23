import { neutralInput, type InputFrame } from '../sim/input';
import type { Match } from '../sim/match';

/** CPU opponent (levels 1–9). Placeholder until milestone 5: stands still. */
export class CpuController {
  idx: number;
  level: number;
  constructor(idx: number, level: number, seed: number) {
    this.idx = idx;
    this.level = level;
    void seed;
  }

  update(m: Match): InputFrame {
    void m;
    return neutralInput();
  }
}
