import { DI_MAX_DEG, HITSTUN_MULT, MAX_HITLAG } from './constants';
import { DEG, clamp } from './math';

/**
 * Knockback: KB = ((((p/10 + p*d/20) * 200/(w+100) * 1.4) + 18) * KBG/100) + BKB
 * p = victim percent after the hit, d = damage, w = victim weight.
 */
export function knockback(p: number, d: number, w: number, kbg: number, bkb: number): number {
  return ((((p / 10 + (p * d) / 20) * (200 / (w + 100)) * 1.4) + 18) * (kbg / 100)) + bkb;
}

/** Freeze frames for attacker and victim. */
export function hitlagFrames(d: number, mult = 1): number {
  return Math.max(0, Math.min(MAX_HITLAG, Math.floor((d * 0.65 + 6) * mult)));
}

export function hitstunFrames(kb: number): number {
  return Math.floor(kb * HITSTUN_MULT);
}

/**
 * Directional influence: the held direction rotates the launch angle toward it by up to
 * DI_MAX_DEG, scaled by how perpendicular it is to the launch. Angles in radians, y-up.
 */
export function applyDI(angle: number, sx: number, sy: number): number {
  const mag = Math.hypot(sx, sy);
  if (mag < 0.2) return angle;
  const nx = -Math.sin(angle);
  const ny = Math.cos(angle);
  const amount = clamp((sx * nx + sy * ny) / Math.max(1, mag), -1, 1) * Math.min(1, mag);
  return angle + amount * DI_MAX_DEG * DEG;
}
