import type { Match } from '../sim/match';
import { ECB_FOOT, ECB_W } from '../sim/physics';
import { posePoint } from '../sim/pose';

/** Debug overlay: hitboxes, hurtboxes, ledge-grab boxes, collision boxes, state + frame. */
export function drawDebugWorld(ctx: CanvasRenderingContext2D, m: Match): void {
  ctx.save();
  ctx.lineCap = 'round';
  for (const f of m.fighters) {
    if (!f.alive()) continue;
    const intang = f.intangibleNow();
    // hurtboxes
    for (const c of f.hurt) {
      ctx.strokeStyle = intang ? 'rgba(80,255,160,0.55)' : 'rgba(255,230,60,0.55)';
      ctx.lineWidth = c.r * 2;
      ctx.beginPath();
      ctx.moveTo(c.ax, c.ay);
      ctx.lineTo(c.bx + 0.01, c.by);
      ctx.stroke();
    }
    // ECB
    const w = (f.W / 2) * ECB_W;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(f.x - w, f.y - f.H, w * 2, f.H * (1 - ECB_FOOT));
    ctx.beginPath();
    ctx.moveTo(f.x - 6, f.y);
    ctx.lineTo(f.x + 6, f.y);
    ctx.stroke();
    // ledge grab box
    if (!f.grounded) {
      ctx.strokeStyle = 'rgba(80,220,255,0.7)';
      ctx.strokeRect(f.x - f.W / 2 - 36, f.y - f.H - 24, f.W + 72, f.H * 0.65 + 24);
    }
    // hitboxes
    for (const h of f.hits) {
      ctx.strokeStyle = 'rgba(255,40,60,0.55)';
      ctx.lineWidth = h.r * 2;
      ctx.beginPath();
      ctx.moveTo(h.px, h.py);
      ctx.lineTo(h.x + 0.01, h.y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    const mv = f.move;
    if (mv && f.state === 'move' && mv.def.grab && mv.frame >= mv.def.grab.from && mv.frame <= mv.def.grab.to) {
      const g = mv.def.grab;
      const lp = g.pos ? { x: g.pos[0], y: g.pos[1] } : posePoint(f.pose, g.at ?? 'handF');
      ctx.fillStyle = 'rgba(180,80,255,0.55)';
      ctx.beginPath();
      ctx.arc(f.x + lp.x * f.facing, f.y - lp.y, g.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (mv && mv.def.reflect && mv.frame >= mv.def.reflect.from && mv.frame <= mv.def.reflect.to) {
      ctx.strokeStyle = 'rgba(80,255,255,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(f.shieldX, f.shieldY, mv.def.reflect.r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  for (const L of m.stage.ledges) {
    ctx.fillStyle = L.occupant >= 0 ? '#ff5' : '#5ff';
    ctx.fillRect(L.x - 5, L.y - 5, 10, 10);
  }
  // projectiles
  for (const p of m.projectiles) {
    ctx.strokeStyle = 'rgba(255,40,60,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // blast zones
  const B = m.stage.blast;
  ctx.strokeStyle = 'rgba(255,60,60,0.6)';
  ctx.setLineDash([20, 14]);
  ctx.lineWidth = 3;
  ctx.strokeRect(B.left, B.top, B.right - B.left, B.bottom - B.top);
  const C = m.stage.def.camera;
  ctx.strokeStyle = 'rgba(120,200,255,0.5)';
  ctx.strokeRect(C.left, C.top, C.right - C.left, C.bottom - C.top);
  ctx.setLineDash([]);
  ctx.restore();
}

/** Screen-space labels for the debug overlay. */
export function drawDebugLabels(ctx: CanvasRenderingContext2D, m: Match, toScreen: (x: number, y: number) => [number, number]): void {
  ctx.save();
  ctx.font = '600 18px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  for (const f of m.fighters) {
    if (!f.alive()) continue;
    const [sx, sy] = toScreen(f.x, f.y - f.H - 40);
    const mv = f.move && f.state === 'move' ? `${f.move.id} f${f.move.frame}${f.move.charging ? ` c${f.move.charge}` : ''}` : `${f.state} ${f.sf}`;
    const extra = `${f.hitlag ? ` hl${f.hitlag}` : ''}${f.hitstun ? ` hs${f.hitstun}` : ''}${f.intangibleNow() ? ' INT' : ''}`;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const text = mv + extra;
    const w = ctx.measureText(text).width + 12;
    ctx.fillRect(sx - w / 2, sy - 18, w, 24);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, sx, sy);
  }
  ctx.restore();
}
