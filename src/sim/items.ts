import type { HitData } from './defs';
import type { Fighter } from './fighter';

export type ItemKind = 'bat' | 'blade' | 'bomb' | 'fruit';

export const ITEM_KINDS: readonly ItemKind[] = ['bat', 'blade', 'bomb', 'fruit'];

export interface Item {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: 'fall' | 'ground' | 'held' | 'thrown' | 'dead';
  holder: Fighter | null;
  /** Last fighter to throw it (KO credit). */
  owner: number;
  groundFrames: number;
  fuse: number;
  spin: number;
  r: number;
  hitVictims: number[];
}

export const ITEM_RADIUS: Record<ItemKind, number> = { bat: 22, blade: 24, bomb: 17, fruit: 16 };
/** Swing length when an item is used as a weapon. */
export const ITEM_LENGTH: Partial<Record<ItemKind, number>> = { bat: 72, blade: 86 };
/** Moves that swing the held item (they use the item as the pose weapon). */
export const ITEM_MOVES: ReadonlySet<string> = new Set(['batSwing', 'bladeJab', 'bladeTilt', 'bladeDash', 'bladeSmash']);

export const THROWN_HIT: HitData = { dmg: 8, angle: 45, bkb: 30, kbg: 60, sfx: 'blunt' };
export const BOMB_HIT: HitData = { dmg: 18, angle: 60, bkb: 60, kbg: 72, sfx: 'boom', radial: true };
export const BOMB_RADIUS = 100;
export const BOMB_FUSE = 300;
export const FRUIT_HEAL = 25;

/** Seconds-range between spawns for each item frequency setting (index = rules.items). */
export const SPAWN_INTERVAL: readonly [number, number][] = [
  [0, 0],
  [1200, 1800],
  [600, 900],
  [300, 480],
];
export const MAX_ITEMS = 3;

export interface Explosion {
  x: number;
  y: number;
  r: number;
  frames: number;
  owner: number;
  hit: HitData;
  victims: number[];
}
