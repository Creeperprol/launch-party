import type { Sfx } from './defs';

/** Events emitted by the simulation for rendering and audio. The sim never reads them back. */
export type SimEvent =
  | { t: 'hit'; x: number; y: number; dmg: number; kb: number; attacker: number; victim: number; sfx: Sfx; blocked: boolean }
  | { t: 'ko'; x: number; y: number; victim: number; angle: number; credit: number }
  | { t: 'jump'; x: number; y: number; who: number; air: boolean }
  | { t: 'land'; x: number; y: number; who: number; hard: boolean }
  | { t: 'dash'; x: number; y: number; who: number; dir: number }
  | { t: 'shieldbreak'; x: number; y: number; who: number }
  | { t: 'tech'; x: number; y: number; who: number }
  | { t: 'ledge'; x: number; y: number; who: number }
  | { t: 'respawn'; who: number }
  | { t: 'explode'; x: number; y: number; r: number }
  | { t: 'shoot'; x: number; y: number; kind: string; who: number }
  | { t: 'reflect'; x: number; y: number; who: number }
  | { t: 'counter'; x: number; y: number; who: number }
  | { t: 'grab'; x: number; y: number; who: number }
  | { t: 'item'; x: number; y: number; kind: string; action: 'spawn' | 'pickup' | 'throw' | 'heal' }
  | { t: 'finalhit'; x: number; y: number; victim: number }
  | { t: 'countdown'; n: number }
  | { t: 'go' }
  | { t: 'game' }
  | { t: 'time' }
  | { t: 'suddendeath' };
