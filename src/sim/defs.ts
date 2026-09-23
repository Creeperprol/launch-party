import type { Ease } from './math';
import type { Fighter } from './fighter';
import type { Match } from './match';

/** Points on the resolved pose that hitboxes can attach to. */
export type PosePoint = 'handF' | 'handB' | 'footF' | 'footB' | 'head' | 'hip' | 'center' | 'neck' | 'blade';

/** Visual + hitbox keyframe. Coordinates are local: +x forward, +y up, feet at (0,0). */
export interface AnimKey {
  f: number;
  hip?: [number, number];
  lean?: number;
  hF?: [number, number];
  hB?: [number, number];
  fF?: [number, number];
  fB?: [number, number];
  /** Weapon angle in degrees (0 = forward, 90 = up). */
  w?: number;
  /** Whole-body rotation in degrees (positive = counter-clockwise, i.e. a back flip when facing right). */
  spin?: number;
  e?: Ease;
}

export type Sfx = 'punch' | 'kick' | 'slash' | 'heavy' | 'fire' | 'spark' | 'zap' | 'blunt' | 'boom' | 'tip';

export interface HitData {
  dmg: number;
  /** Launch angle in degrees relative to the attacker's facing (0 = forward, 90 = up, 270 = down). */
  angle: number;
  bkb: number;
  kbg: number;
  /** Set knockback: ignores percent (multi-hits, no-flinch shots). */
  fixed?: number;
  hitlag?: number;
  shieldDmg?: number;
  sfx?: Sfx;
  /** Launch away from the source centre regardless of angle (explosions). */
  radial?: boolean;
  /** Horizontal launch direction decided by which side of the attacker the victim is on. */
  away?: boolean;
}

export interface HitboxDef extends HitData {
  /** Hit group: each group hits a given target at most once per move. */
  g: number;
  from: number;
  to: number;
  at?: PosePoint;
  /** 0..1 along the blade when at === 'blade'. */
  t?: number;
  off?: [number, number];
  pos?: [number, number];
  r: number;
  /** Take damage from move.vars[dmgVar] (counters). */
  dmgVar?: string;
  /** Linear scaling with charge fraction for charged specials. */
  charge?: { dmg?: [number, number]; bkb?: [number, number]; kbg?: [number, number]; shieldDmg?: [number, number] };
  fx?: 'swoosh' | 'fire' | 'spark' | 'shock' | 'none';
}

export interface GrabBoxDef {
  from: number;
  to: number;
  at?: PosePoint;
  pos?: [number, number];
  r: number;
  /** Command grab: start this move on catch (victim becomes 'thrown'). */
  command?: string;
}

export interface MotionDef {
  from: number;
  to: number;
  /** Velocity override (vx is multiplied by facing). */
  vx?: number;
  vy?: number;
  /** Disable gravity during the window. */
  noGrav?: boolean;
  /** Air drift factor (0 = none, 1 = normal) while in the window. */
  drift?: number;
  /** Multiply existing velocity each frame. */
  damp?: number;
}

export interface ProjectileSpawn {
  frame: number;
  kind: string;
  at?: PosePoint;
  pos?: [number, number];
  vx: number;
  vy: number;
  gravity?: number;
  maxFall?: number;
  /** Upward speed after touching a surface (bouncing projectiles). */
  bounce?: number;
  life: number;
  r: number;
  hit: HitData;
  reflectable?: boolean;
}

export interface ThrowDef {
  release: number;
  hit: HitData;
}

export interface MoveHooks {
  start?(f: Fighter, m: Match): void;
  frame?(f: Fighter, m: Match): void;
  /** Called when the fighter lands during the move. Return true if handled. */
  land?(f: Fighter, m: Match): boolean;
  end?(f: Fighter, m: Match): void;
}

export interface MoveDef {
  id: string;
  total: number;
  /** Aerial: landing during it causes `landingLag`. */
  air?: boolean;
  landingLag?: number;
  /** 'lag' (default for aerials): landing lag; 'keep': continue on the ground; 'hook': call hooks.land. */
  onLand?: 'lag' | 'keep' | 'hook';
  /** Enter helpless fall when the move ends in the air. */
  helpless?: boolean;
  helplessLag?: number;
  /** Stop at ledges while grounded (default true). */
  edgeStop?: boolean;
  /** Smash-style charge: hold the move at `frame` while the button is held. */
  charge?: { frame: number; btn?: 'attack' | 'special'; max?: number; smash?: boolean };
  hitboxes: HitboxDef[];
  grab?: GrabBoxDef;
  anim: AnimKey[];
  motion?: MotionDef[];
  armor?: { from: number; to: number; threshold: number };
  intangible?: [number, number][];
  reflect?: { from: number; to: number; r: number };
  counter?: { from: number; to: number; next: string; mult: number; min: number };
  projectiles?: ProjectileSpawn[];
  throwDef?: ThrowDef;
  pummel?: { frame: number; dmg: number };
  /** Earliest frame the fighter may grab a ledge during this move. */
  ledgeFrom?: number;
  /** Chain into another move if the button is pressed in the window. */
  next?: { from: number; to: number; btn: 'attack' | 'special'; id: string };
  jumpCancel?: [number, number];
  /** Interruptible from this frame. */
  iasa?: number;
  /** Once per airtime when started airborne. */
  airOnce?: boolean;
  hooks?: MoveHooks;
  /** Weapon hidden during this move. */
  hideWeapon?: boolean;
}

export interface Rig {
  hipH: number;
  torso: number;
  headR: number;
  arm1: number;
  arm2: number;
  leg1: number;
  leg2: number;
  bodyR: number;
  limbR: number;
  handR: number;
  footR: number;
  weapon?: { len: number; width: number };
}

export interface Palette {
  main: string;
  dark: string;
  light: string;
  accent: string;
  skin: string;
  eye: string;
}

export type LookKind = 'nova' | 'grott' | 'zip' | 'sable';

export interface FighterDef {
  id: string;
  name: string;
  archetype: string;
  tagline: string;
  weight: number;
  height: number;
  width: number;
  walkSpeed: number;
  runSpeed: number;
  dashSpeed: number;
  dashFrames: number;
  traction: number;
  airSpeed: number;
  airAccel: number;
  airFriction: number;
  gravity: number;
  fallSpeed: number;
  jumpV: number;
  shortHopV: number;
  doubleJumpV: number;
  jumps: number;
  rig: Rig;
  moves: Record<string, MoveDef>;
  look: LookKind;
  palettes: Palette[];
}

export interface PlatformDef {
  x1: number;
  x2: number;
  y: number;
  /** Horizontal travel: centre offset = amp × sin(2π·frame/period). */
  move?: { amp: number; period: number };
}

export interface StageDef {
  id: string;
  name: string;
  subtitle: string;
  main: { x1: number; x2: number; top: number; bottom: number };
  platforms: PlatformDef[];
  blast: { left: number; right: number; top: number; bottom: number };
  camera: { left: number; right: number; top: number; bottom: number };
  spawns: [number, number][];
  respawn: [number, number];
  theme: string;
}

/** Moves every fighter must define. */
export const REQUIRED_MOVES = [
  'jab1', 'ftilt', 'utilt', 'dtilt', 'dashAttack',
  'fsmash', 'usmash', 'dsmash',
  'nair', 'fair', 'bair', 'uair', 'dair',
  'nspecial', 'sspecial', 'uspecial', 'dspecial',
  'grab', 'dashGrab', 'pummel', 'fthrow', 'bthrow', 'uthrow', 'dthrow',
] as const;
