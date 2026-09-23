import type { StageDef } from './defs';

export interface PlatRT {
  id: number;
  x1: number;
  x2: number;
  y: number;
  vx: number;
  baseX1: number;
  baseX2: number;
  amp: number;
  period: number;
}

export interface LedgeRT {
  x: number;
  y: number;
  /** Outward direction: -1 for the left ledge, +1 for the right. */
  dir: number;
  occupant: number;
}

export interface Blast {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class StageRT {
  def: StageDef;
  main: { x1: number; x2: number; top: number; bottom: number };
  plats: PlatRT[];
  ledges: LedgeRT[];
  blast: Blast;

  constructor(def: StageDef) {
    this.def = def;
    this.main = { ...def.main };
    this.plats = def.platforms.map((p, i) => ({
      id: i,
      x1: p.x1,
      x2: p.x2,
      y: p.y,
      vx: 0,
      baseX1: p.x1,
      baseX2: p.x2,
      amp: p.move?.amp ?? 0,
      period: p.move?.period ?? 1,
    }));
    this.ledges = [
      { x: def.main.x1, y: def.main.top, dir: -1, occupant: -1 },
      { x: def.main.x2, y: def.main.top, dir: 1, occupant: -1 },
    ];
    this.blast = { ...def.blast };
    this.update(0);
  }

  update(frame: number): void {
    for (const p of this.plats) {
      if (p.amp === 0) {
        p.vx = 0;
        continue;
      }
      const off = p.amp * Math.sin((2 * Math.PI * frame) / p.period);
      const nx1 = p.baseX1 + off;
      p.vx = nx1 - p.x1;
      p.x1 = nx1;
      p.x2 = p.baseX2 + off;
    }
  }

  /** Top surface y under x at `id` ('main' = -1). */
  surfaceRange(id: number): [number, number, number] {
    if (id < 0) return [this.main.x1, this.main.x2, this.main.top];
    const p = this.plats[id];
    return [p.x1, p.x2, p.y];
  }
}
