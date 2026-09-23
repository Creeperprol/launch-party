import { FIGHTERS, GROTT, NOVA, SABLE, ZIP } from '../src/content/fighters';
import { CROWN_RUINS, STAGES } from '../src/content/stages';
import type { FighterDef, StageDef } from '../src/sim/defs';
import { neutralInput, type InputFrame } from '../src/sim/input';
import { Match, type Rules } from '../src/sim/match';

export { FIGHTERS, GROTT, NOVA, SABLE, ZIP, CROWN_RUINS, STAGES };

export const RULES: Rules = { stocks: 3, time: 0, items: 0 };

export function makeMatch(fighters: FighterDef[] = [NOVA, NOVA], stage: StageDef = CROWN_RUINS, rules: Partial<Rules> = {}, seed = 1): Match {
  return new Match({
    stage,
    players: fighters.map((f) => ({ fighter: f, cpu: 0 })),
    rules: { ...RULES, ...rules },
    seed,
    skipCountdown: true,
  });
}

export function inp(p: Partial<InputFrame> = {}): InputFrame {
  return { ...neutralInput(), ...p };
}

/** Step the match n frames with fixed inputs per player (missing = neutral). */
export function run(m: Match, n: number, inputs: (Partial<InputFrame> | undefined)[] = []): void {
  const frame = m.fighters.map((_, i) => inp(inputs[i] ?? {}));
  for (let k = 0; k < n; k++) m.step(frame);
}

/** Place fighter i at (x, y) standing on the main stage (or airborne if y < 0 and not on a platform). */
export function place(m: Match, i: number, x: number, y = 0, facing: 1 | -1 = 1): void {
  const f = m.fighters[i];
  f.x = x;
  f.y = y;
  f.vx = f.vy = f.kbx = f.kby = 0;
  f.facing = facing;
  const surf = y === 0 && x >= m.stage.main.x1 && x <= m.stage.main.x2 ? -1 : m.surfaceAt(x, y);
  const onGround = y === 0 ? x >= m.stage.main.x1 && x <= m.stage.main.x2 : m.stage.plats.some((p) => p.id === surf && Math.abs(p.y - y) < 1);
  f.grounded = onGround;
  f.groundId = onGround ? surf : -1;
  f.enter(onGround ? 'idle' : 'air');
}
