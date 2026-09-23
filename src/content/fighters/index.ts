import type { FighterDef } from '../../sim/defs';
import { CINDER } from './cinder';
import { GALE } from './gale';
import { GROTT } from './grott';
import { NOVA } from './nova';
import { RAVEN } from './raven';
import { SABLE } from './sable';
import { TALUS } from './talus';
import { VOLT } from './volt';
import { ZIP } from './zip';

export const FIGHTERS: readonly FighterDef[] = [NOVA, GROTT, ZIP, SABLE, CINDER, TALUS, RAVEN, VOLT, GALE];

export function fighterById(id: string): FighterDef {
  const f = FIGHTERS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown fighter ${id}`);
  return f;
}

export { CINDER, GALE, GROTT, NOVA, RAVEN, SABLE, TALUS, VOLT, ZIP };
