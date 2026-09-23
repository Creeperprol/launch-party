// Headless CPU-vs-CPU batch runner.
// Usage: npm run sim -- --matches 40 --seed 1 --levels 9,9 [--verbose]
import { CpuController } from '../src/ai/cpu';
import { FIGHTERS } from '../src/content/fighters';
import { STAGES } from '../src/content/stages';
import { Match } from '../src/sim/match';

function arg(name: string, def: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const matches = Number(arg('matches', '20'));
const seed0 = Number(arg('seed', '1'));
const levels = arg('levels', '9,9').split(',').map((x) => Number(x.trim()));
const stocks = Number(arg('stocks', '3'));
const verbose = process.argv.includes('--verbose');
if (levels.length < 2 || levels.length > 4 || levels.some((l) => !(l >= 1 && l <= 9))) {
  console.error('--levels needs 2–4 CPU levels between 1 and 9, e.g. --levels 9,1');
  process.exit(2);
}

const MAX_FRAMES = 7 * 3600 + 180 + 3600 * 4;
const n = levels.length;
let errors = 0;
let nanFrames = 0;
let stockOuts = 0;
let timeouts = 0;
let totalFrames = 0;
let falls = 0;
let sds = 0;
let kos = 0;
const winsByLevel = new Map<number, number>();
const winsBySlot = new Array(n).fill(0);
const winsByFighter = new Map<string, number>();
const sdsByLevel = new Map<number, number>();
const fallsByLevel = new Map<number, number>();
const t0 = Date.now();

for (let i = 0; i < matches; i++) {
  const seed = seed0 * 1000 + i;
  const stage = STAGES[i % STAGES.length];
  const fighters = levels.map((_, p) => FIGHTERS[(i + p * (1 + Math.floor(i / FIGHTERS.length))) % FIGHTERS.length]);
  try {
    const m = new Match({ stage, players: fighters.map((f, p) => ({ fighter: f, cpu: levels[p], palette: p, slot: p })), rules: { stocks, time: 7, items: 2 }, seed });
    const cpus = levels.map((l, p) => new CpuController(p, l, seed * 97 + p * 13));
    let f = 0;
    let bad = false;
    while (m.phase !== 'ended' && f < MAX_FRAMES) {
      m.step(cpus.map((c) => c.update(m)));
      m.drainEvents();
      for (const ft of m.fighters) {
        if (!Number.isFinite(ft.x) || !Number.isFinite(ft.y) || !Number.isFinite(ft.percent)) bad = true;
      }
      if (bad) break;
      f++;
    }
    if (bad) {
      nanFrames++;
      console.log(`match ${i}: NaN position at frame ${f}`);
      continue;
    }
    totalFrames += f;
    const byTime = m.eliminated.length < n - 1 || m.suddenDeath || m.phase !== 'ended';
    if (m.phase !== 'ended') {
      console.log(`match ${i}: did not finish within ${MAX_FRAMES} frames`);
      errors++;
      continue;
    }
    if (!byTime) stockOuts++;
    else timeouts++;
    const w = m.winner;
    winsBySlot[w]++;
    winsByLevel.set(levels[w], (winsByLevel.get(levels[w]) ?? 0) + 1);
    winsByFighter.set(fighters[w].id, (winsByFighter.get(fighters[w].id) ?? 0) + 1);
    for (const ft of m.fighters) {
      falls += ft.stats.falls;
      sds += ft.stats.sds;
      kos += ft.stats.kos;
      fallsByLevel.set(levels[ft.idx], (fallsByLevel.get(levels[ft.idx]) ?? 0) + ft.stats.falls);
      sdsByLevel.set(levels[ft.idx], (sdsByLevel.get(levels[ft.idx]) ?? 0) + ft.stats.sds);
    }
    if (verbose) {
      const desc = m.fighters.map((ft) => `${ft.def.id}(L${levels[ft.idx]}) st${ft.stocks} f${ft.stats.falls} sd${ft.stats.sds} ko${ft.stats.kos}`).join('  ');
      console.log(`match ${String(i).padStart(3)} ${stage.id.padEnd(6)} ${(f / 60).toFixed(0).padStart(4)}s ${byTime ? 'TIME' : 'STOCK'} winner P${w + 1} ${fighters[w].id}  | ${desc}`);
    }
  } catch (e) {
    errors++;
    console.log(`match ${i}: EXCEPTION ${(e as Error).stack}`);
  }
}

const done = stockOuts + timeouts;
const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}%` : '—');
console.log('');
console.log(`LAUNCH PARTY headless sim — ${matches} matches, levels ${levels.join(' vs ')}, seed ${seed0}, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log('┌──────────────────────────────┬────────────┐');
const row = (k: string, v: string) => console.log(`│ ${k.padEnd(28)} │ ${v.padStart(10)} │`);
row('finished', `${done}/${matches}`);
row('exceptions / unfinished', String(errors));
row('NaN positions', String(nanFrames));
row('ended on stocks (in time)', `${stockOuts} (${pct(stockOuts, done)})`);
row('went to time / sudden death', String(timeouts));
row('avg match length', `${(totalFrames / 60 / Math.max(1, done)).toFixed(1)}s`);
row('KOs / falls', `${kos} / ${falls}`);
row('self-destructs', `${sds} (${pct(sds, falls)} of falls)`);
for (const l of [...new Set(levels)].sort((a, b) => b - a)) {
  row(`level ${l} wins`, `${winsByLevel.get(l) ?? 0} (${pct(winsByLevel.get(l) ?? 0, done)})`);
  row(`level ${l} SDs / falls`, `${sdsByLevel.get(l) ?? 0} / ${fallsByLevel.get(l) ?? 0}`);
}
for (let p = 0; p < n; p++) row(`slot P${p + 1} wins`, String(winsBySlot[p]));
for (const [id, w] of [...winsByFighter.entries()].sort()) row(`${id} wins`, String(w));
console.log('└──────────────────────────────┴────────────┘');
process.exit(errors > 0 || nanFrames > 0 ? 1 : 0);
