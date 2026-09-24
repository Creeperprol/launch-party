import type { StageDef } from '../sim/defs';

/** World units: the stage surface is y = 0 and +y points down. */

export const CROWN_RUINS: StageDef = {
  id: 'crown',
  name: 'CROWN RUINS',
  subtitle: 'Three platforms over a sunset sea',
  main: { x1: -480, x2: 480, top: 0, bottom: 220 },
  platforms: [
    { x1: -330, x2: -130, y: -170 },
    { x1: 130, x2: 330, y: -170 },
    { x1: -100, x2: 100, y: -340 },
  ],
  blast: { left: -1400, right: 1400, top: -1150, bottom: 850 },
  camera: { left: -1150, right: 1150, top: -980, bottom: 560 },
  spawns: [[-330, 0], [330, 0], [-110, 0], [110, 0]],
  respawn: [0, -560],
  theme: 'sunset',
};

export const VANISHING_POINT: StageDef = {
  id: 'vanish',
  name: 'VANISHING POINT',
  subtitle: 'One flat slab at the edge of space',
  main: { x1: -560, x2: 560, top: 0, bottom: 150 },
  platforms: [],
  blast: { left: -1500, right: 1500, top: -1150, bottom: 850 },
  camera: { left: -1250, right: 1250, top: -980, bottom: 560 },
  spawns: [[-380, 0], [380, 0], [-130, 0], [130, 0]],
  respawn: [0, -520],
  theme: 'space',
};

export const LANTERN_DOCK: StageDef = {
  id: 'dock',
  name: 'LANTERN DOCK',
  subtitle: 'Catch the ferry — it will not wait',
  main: { x1: -500, x2: 500, top: 0, bottom: 200 },
  platforms: [{ x1: -110, x2: 110, y: -190, move: { amp: 380, period: 720 } }],
  blast: { left: -1420, right: 1420, top: -1150, bottom: 850 },
  camera: { left: -1170, right: 1170, top: -980, bottom: 560 },
  spawns: [[-340, 0], [340, 0], [-120, 0], [120, 0]],
  respawn: [0, -560],
  theme: 'harbor',
};

export const TRAINING_CAVE: StageDef = {
  id: 'cave',
  name: 'TRAINING CAVE',
  subtitle: 'Torchlit stone — bring a dummy and drill combos',
  main: { x1: -640, x2: 640, top: 0, bottom: 260 },
  platforms: [
    { x1: -260, x2: -70, y: -190 },
    { x1: 70, x2: 260, y: -190 },
  ],
  blast: { left: -1500, right: 1500, top: -1200, bottom: 900 },
  camera: { left: -1250, right: 1250, top: -1000, bottom: 600 },
  spawns: [[-360, 0], [360, 0], [-140, 0], [140, 0]],
  respawn: [0, -580],
  theme: 'cave',
};

export const STAGES: readonly StageDef[] = [CROWN_RUINS, VANISHING_POINT, LANTERN_DOCK, TRAINING_CAVE];

export function stageById(id: string): StageDef {
  const s = STAGES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown stage ${id}`);
  return s;
}
