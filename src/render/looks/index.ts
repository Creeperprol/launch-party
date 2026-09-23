import type { LookKind } from '../../sim/defs';
import type { Look } from '../lookKit';
import { CINDER_LOOK } from './cinder';
import { GALE_LOOK } from './gale';
import { RAVEN_LOOK } from './raven';
import { TALUS_LOOK } from './talus';
import { VOLT_LOOK } from './volt';

/** Pluggable models; the original four looks are drawn inline by fighterDraw. */
export const LOOKS: Partial<Record<LookKind, Look>> = {
  cinder: CINDER_LOOK,
  talus: TALUS_LOOK,
  raven: RAVEN_LOOK,
  volt: VOLT_LOOK,
  gale: GALE_LOOK,
};
