import type { HitData } from './defs';

export interface Projectile {
  id: number;
  kind: string;
  owner: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  maxFall: number;
  bounce: number;
  life: number;
  maxLife: number;
  r: number;
  hit: HitData;
  reflectable: boolean;
  dead: boolean;
  age: number;
  /** Previous position for swept hit tests. */
  px: number;
  py: number;
}
