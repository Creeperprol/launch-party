import type { FighterDef } from '../src/sim/defs';
import { NOVA, inp, makeMatch, place } from './helpers';

/**
 * Hit a victim standing at Stage 1 centre with the attacker's uncharged forward smash
 * (no DI, no inputs) and report whether the victim is KO'd.
 */
export function fsmashKOs(attacker: FighterDef, victim: FighterDef, percent: number): boolean {
  const m = makeMatch([attacker, victim]);
  const a = m.fighters[0];
  const v = m.fighters[1];
  place(m, 1, 0, 0, -1);
  // Find a spacing where the forward smash connects: step the attacker toward the victim until it does.
  place(m, 0, -70, 0, 1);
  v.percent = percent;
  const neutral = [inp(), inp()];
  m.step([inp({ cx: 1 }), inp()]);
  let hit = false;
  for (let i = 0; i < 600; i++) {
    m.step(neutral);
    if (v.stats.taken > 0) hit = true;
    if (v.stocks < 3) return true;
    if (!hit) continue;
    // The launch itself must carry the victim out: landing, grabbing a ledge, or running out of launch speed means it survived.
    if (v.state !== 'tumble' && v.state !== 'hitstun') return false;
    if (v.hitlag === 0 && !v.pendingLaunch && v.hitstun === 0 && Math.hypot(v.kbx, v.kby) < 0.5) return false;
  }
  if (!hit) throw new Error(`fsmash from ${attacker.id} never connected`);
  void a;
  return false;
}

/** Lowest pre-hit percent (integer) at which the uncharged forward smash KOs. */
export function lowestKOPercent(attacker: FighterDef, victim: FighterDef = NOVA): number {
  let lo = 0;
  let hi = 400;
  if (!fsmashKOs(attacker, victim, hi)) return Infinity;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (fsmashKOs(attacker, victim, mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}
