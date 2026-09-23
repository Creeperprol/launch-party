import type { FighterDef } from '../../sim/defs';
import { GROTT } from './grott';
import { NOVA } from './nova';
import { SABLE } from './sable';
import { ZIP } from './zip';

export const FIGHTERS: readonly FighterDef[] = [NOVA, GROTT, ZIP, SABLE];

export function fighterById(id: string): FighterDef {
  const f = FIGHTERS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown fighter ${id}`);
  return f;
}

export { GROTT, NOVA, SABLE, ZIP };
