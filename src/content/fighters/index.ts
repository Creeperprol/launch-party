import type { FighterDef } from '../../sim/defs';
import { BISCUIT } from './biscuit';
import { BRUNO } from './bruno';
import { CINDER } from './cinder';
import { DIGBY } from './digby';
import { FANG } from './fang';
import { GALE } from './gale';
import { GROTT } from './grott';
import { KOI } from './koi';
import { MIRA } from './mira';
import { NOVA } from './nova';
import { NOX } from './nox';
import { RAVEN } from './raven';
import { RIVET } from './rivet';
import { ROCCO } from './rocco';
import { SABLE } from './sable';
import { SPROUT } from './sprout';
import { TALUS } from './talus';
import { VOLT } from './volt';
import { ZIP } from './zip';

export const FIGHTERS: readonly FighterDef[] = [
  NOVA, GROTT, ZIP, SABLE, CINDER, TALUS, RAVEN, VOLT, GALE,
  DIGBY, BRUNO, KOI, MIRA, RIVET, SPROUT, FANG, NOX, BISCUIT, ROCCO,
];

export function fighterById(id: string): FighterDef {
  const f = FIGHTERS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown fighter ${id}`);
  return f;
}

export { BISCUIT, BRUNO, CINDER, DIGBY, FANG, GALE, GROTT, KOI, MIRA, NOVA, NOX, RAVEN, RIVET, ROCCO, SABLE, SPROUT, TALUS, VOLT, ZIP };
