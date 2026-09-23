import { FASTFALL_MULT, KB_DECAY } from './constants';
import type { Fighter } from './fighter';
import { approach, clamp } from './math';
import type { Match } from './match';
import type { StageRT } from './stage';

/** Environment collision box: a bit narrower than the body and ending above the feet, so fighters can walk off ledges cleanly. */
export const ECB_W = 0.8;
export const ECB_FOOT = 0.3;

export function overlapsMain(f: Fighter, st: StageRT, x: number, y: number): boolean {
  const M = st.main;
  const w = (f.W / 2) * ECB_W;
  return x + w > M.x1 && x - w < M.x2 && y - f.H * ECB_FOOT > M.top + 0.5 && y - f.H < M.bottom;
}

/**
 * Swept movement with the stage. Substeps of at most 8 u guarantee nothing tunnels
 * through the solid block; platform landings use a crossing test, which cannot tunnel.
 */
export function moveAndCollide(f: Fighter, m: Match, dx: number, dy: number): void {
  const st = m.stage;
  const M = st.main;
  const W2 = (f.W / 2) * ECB_W;
  const H = f.H;
  if (f.grounded) {
    const [x1, x2, top] = st.surfaceRange(f.groundId);
    let nx = f.x + dx;
    if (nx < x1 || nx > x2) {
      if (f.edgeStops()) {
        nx = clamp(nx, x1, x2);
        f.vx = 0;
        f.kbx = 0;
      } else {
        f.x = nx;
        f.y = top;
        f.leaveGround(m);
        return;
      }
    }
    f.x = nx;
    f.y = top;
    return;
  }
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 8));
  const sx = dx / n;
  const sy = dy / n;
  for (let i = 0; i < n; i++) {
    f.x += sx;
    if (overlapsMain(f, st, f.x, f.y)) {
      if (sx > 0) f.x = M.x1 - W2 - 0.01;
      else if (sx < 0) f.x = M.x2 + W2 + 0.01;
      else f.x = f.x < (M.x1 + M.x2) / 2 ? M.x1 - W2 - 0.01 : M.x2 + W2 + 0.01;
      f.onWall();
    }
    const py = f.y;
    f.y += sy;
    if (sy > 0) {
      if (py <= M.top + 1e-6 && f.y >= M.top && f.x >= M.x1 && f.x <= M.x2) {
        f.y = M.top;
        f.land(m, -1);
        return;
      }
      for (const p of st.plats) {
        if (f.platIgnoreTimer > 0 && f.platIgnore === p.id) continue;
        if (py <= p.y + 1e-6 && f.y >= p.y && f.x >= p.x1 && f.x <= p.x2) {
          f.y = p.y;
          f.land(m, p.id);
          return;
        }
      }
    } else if (sy < 0) {
      const top = f.y - H;
      const ptop = py - H;
      if (ptop >= M.bottom - 1e-6 && top < M.bottom && f.x + W2 > M.x1 && f.x - W2 < M.x2) {
        f.y = M.bottom + H + 0.01;
        f.onCeiling();
      }
    }
    if (overlapsMain(f, st, f.x, f.y)) {
      if (sy >= 0 && f.y - M.top < f.H * ECB_FOOT + 14 && f.x >= M.x1 && f.x <= M.x2) {
        f.y = M.top;
        f.land(m, -1);
        return;
      }
      const leftPen = f.x + W2 - M.x1;
      const rightPen = M.x2 - (f.x - W2);
      f.x = leftPen < rightPen ? M.x1 - W2 - 0.01 : M.x2 + W2 + 0.01;
      f.onWall();
    }
  }
}

/** Gravity, knockback decay, movement, and ledge grabs for one fighter. */
export function fighterPhysics(f: Fighter, m: Match): void {
  const s = f.state;
  if (s === 'dead' || s === 'ledge' || s === 'respawn' || s === 'grabbed' || s === 'thrown') return;
  const d = f.def;
  if (!f.grounded) {
    if (!f.noGrav) {
      const maxFall = f.fastFalling ? d.fallSpeed * FASTFALL_MULT : d.fallSpeed;
      if (f.vy < maxFall) f.vy = Math.min(maxFall, f.vy + d.gravity);
      else if (f.vy > maxFall) f.vy = approach(f.vy, maxFall, 0.6);
    }
  } else {
    f.vy = 0;
  }
  if (f.kbx !== 0 || f.kby !== 0) {
    if (f.grounded) {
      f.kbx = approach(f.kbx, 0, d.traction);
      f.kby = 0;
    } else {
      const mag = Math.hypot(f.kbx, f.kby);
      const nm = Math.max(0, mag - KB_DECAY);
      if (nm <= 0) {
        f.kbx = 0;
        f.kby = 0;
      } else {
        const k = nm / mag;
        f.kbx *= k;
        f.kby *= k;
      }
    }
  }
  let dx = f.vx + f.kbx;
  const dy = f.grounded ? 0 : f.vy + f.kby;
  if (f.grounded && f.groundId >= 0) dx += m.stage.plats[f.groundId].vx;
  moveAndCollide(f, m, dx, dy);
  if (!f.grounded) checkLedge(f, m);
}

export function checkLedge(f: Fighter, m: Match): void {
  if (!f.canGrabLedgeNow()) return;
  const W2 = f.W / 2;
  const H = f.H;
  for (const L of m.stage.ledges) {
    if (L.dir < 0 ? f.x > L.x + 6 : f.x < L.x - 6) continue;
    if (L.x < f.x - W2 - 36 || L.x > f.x + W2 + 36) continue;
    if (L.y < f.y - H - 24 || L.y > f.y - H * 0.35) continue;
    f.grabLedge(L, m);
    return;
  }
}
