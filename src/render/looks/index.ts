import type { LookKind } from '../../sim/defs';
import type { Look } from '../lookKit';
import { BISCUIT_LOOK } from './biscuit';
import { BRUNO_LOOK } from './bruno';
import { CINDER_LOOK } from './cinder';
import { DIGBY_LOOK } from './digby';
import { FANG_LOOK } from './fang';
import { GALE_LOOK } from './gale';
import { KOI_LOOK } from './koi';
import { MIRA_LOOK } from './mira';
import { NOX_LOOK } from './nox';
import { RAVEN_LOOK } from './raven';
import { RIVET_LOOK } from './rivet';
import { ROCCO_LOOK } from './rocco';
import { SPROUT_LOOK } from './sprout';
import { TALUS_LOOK } from './talus';
import { VOLT_LOOK } from './volt';

/** Pluggable models; the original four looks are drawn inline by fighterDraw. */
export const LOOKS: Partial<Record<LookKind, Look>> = {
  cinder: CINDER_LOOK,
  talus: TALUS_LOOK,
  raven: RAVEN_LOOK,
  volt: VOLT_LOOK,
  gale: GALE_LOOK,
  digby: DIGBY_LOOK,
  bruno: BRUNO_LOOK,
  koi: KOI_LOOK,
  mira: MIRA_LOOK,
  rivet: RIVET_LOOK,
  sprout: SPROUT_LOOK,
  fang: FANG_LOOK,
  nox: NOX_LOOK,
  biscuit: BISCUIT_LOOK,
  rocco: ROCCO_LOOK,
};
