import type { FighterDef, StageDef } from '../sim/defs';
import { neutralInput, type InputFrame } from '../sim/input';
import { Match } from '../sim/match';

/** Measured recovery reach for a fighter (simulated once in a sandbox, then cached). */
export interface Recovery {
  /** Height gained by the midair jump from a standstill. */
  djRise: number;
  /** Height gained by up special (stick up). */
  ubRise: number;
  /** Horizontal travel during the up special while drifting forward. */
  ubDrift: number;
  /** For 8-way launches: reach along a 45° diagonal. */
  ubDiag: number;
  /** Frames before the up special starts moving. */
  ubStartup: number;
}

const SANDBOX: StageDef = {
  id: 'sandbox', name: '', subtitle: '',
  main: { x1: -50, x2: 50, top: 50000, bottom: 50100 },
  platforms: [],
  blast: { left: -1e7, right: 1e7, top: -1e7, bottom: 1e7 },
  camera: { left: -1e4, right: 1e4, top: -1e4, bottom: 1e4 },
  spawns: [[0, 50000], [0, 50000]],
  respawn: [0, 0],
  theme: 'space',
};

const cache = new Map<string, Recovery>();

function sandbox(def: FighterDef): Match {
  const m = new Match({ stage: SANDBOX, players: [{ fighter: def, cpu: 0 }, { fighter: def, cpu: 0 }], rules: { stocks: 1, time: 0 }, seed: 1, skipCountdown: true });
  for (const f of m.fighters) {
    f.x = f.idx === 0 ? 0 : 1e6;
    f.y = 0;
    f.grounded = false;
    f.groundId = -1;
    f.enter('air');
    f.vx = f.vy = 0;
  }
  return m;
}

function run(def: FighterDef, first: Partial<InputFrame>, hold: Partial<InputFrame>, frames: number): { rise: number; drift: number } {
  const m = sandbox(def);
  const f = m.fighters[0];
  let minY = 0;
  let driftAtApex = 0;
  for (let i = 0; i < frames; i++) {
    const inp = { ...neutralInput(), ...(i === 0 ? first : hold) };
    m.step([inp, neutralInput()]);
    if (f.y < minY) {
      minY = f.y;
      driftAtApex = Math.abs(f.x);
    }
  }
  return { rise: -minY, drift: driftAtApex };
}

export function measureRecovery(def: FighterDef): Recovery {
  const hit = cache.get(def.id);
  if (hit) return hit;
  const dj = run(def, { jump: true }, {}, 90);
  const ub = run(def, { special: true, y: 1 }, { y: 1, x: 0.01 }, 140);
  const ubF = run(def, { special: true, y: 1 }, { x: 1, y: 0.2 }, 140);
  const diag = run(def, { special: true, y: 1 }, { x: 0.72, y: 0.72 }, 140);
  const up = def.moves.uspecial;
  let startup = 1;
  if (up?.motion) {
    for (const md of up.motion) if (md.vy !== undefined && md.vy < 0) {
      startup = md.from;
      break;
    }
  }
  if (def.id === 'zip') startup = 36;
  const rec: Recovery = {
    djRise: dj.rise,
    ubRise: ub.rise,
    ubDrift: ubF.drift,
    ubDiag: Math.hypot(diag.rise, diag.drift),
    ubStartup: startup,
  };
  cache.set(def.id, rec);
  return rec;
}
