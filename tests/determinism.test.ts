import { describe, expect, it } from 'vitest';
import { CpuController } from '../src/ai/cpu';
import { hashMatch } from '../src/sim/hash';
import { Match } from '../src/sim/match';
import { FIGHTERS, STAGES } from './helpers';

function runCpuMatch(seed: number, frames: number): string {
  const m = new Match({
    stage: STAGES[2],
    players: FIGHTERS.map((f, i) => ({ fighter: f, cpu: 9 - i * 2, palette: i, slot: i })),
    rules: { stocks: 3, time: 3 },
    seed,
  });
  const cpus = FIGHTERS.map((_, i) => new CpuController(i, 9 - i * 2, seed * 31 + i));
  for (let f = 0; f < frames && m.phase !== 'ended'; f++) {
    m.step(cpus.map((c) => c.update(m)));
    m.drainEvents();
  }
  return hashMatch(m);
}

describe('determinism', () => {
  it('the same seed and inputs produce an identical final state', () => {
    const a = runCpuMatch(7, 4000);
    const b = runCpuMatch(7, 4000);
    expect(a).toBe(b);
  });

  it('a different seed diverges', () => {
    expect(runCpuMatch(7, 4000)).not.toBe(runCpuMatch(8, 4000));
  });
});
