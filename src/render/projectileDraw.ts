import type { Projectile } from '../sim/projectiles';
import { INK, rgba } from './color';
import { star } from './fx';

/** Per-kind projectile art. Returns false for kinds drawn by the generic glowing orb. */
export function drawProjectileKind(ctx: CanvasRenderingContext2D, p: Projectile, owner: string): boolean {
  const d = Math.sign(p.vx) || 1;
  const r = p.r;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  switch (p.kind) {
    case 'block': {
      ctx.rotate(p.age * 0.18 * d);
      const s = r * 1.15;
      ctx.fillStyle = INK;
      ctx.fillRect(-s - 3, -s - 3, s * 2 + 6, s * 2 + 6);
      ctx.fillStyle = '#8a5a34';
      ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.fillStyle = '#5fae43';
      ctx.fillRect(-s, -s, s * 2, s * 0.6);
      ctx.fillStyle = '#6d4526';
      for (const [x, y] of [[-0.5, 0.2], [0.3, 0.55], [0.45, -0.05], [-0.2, 0.7]]) ctx.fillRect(x * s, y * s, s * 0.3, s * 0.3);
      break;
    }
    case 'bubble': {
      const wob = 1 + Math.sin(p.age * 0.3) * 0.08;
      ctx.scale(wob, 2 - wob);
      ctx.fillStyle = 'rgba(120,220,255,0.35)';
      ctx.strokeStyle = 'rgba(210,245,255,0.95)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-r * 0.4, -r * 0.4, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'star': {
      for (let k = 1; k <= 3; k++) {
        ctx.fillStyle = rgba('#ffe066', 0.35 / k);
        star(ctx, -d * k * r * 0.9, 0, r * (1 - k * 0.2), r * 0.4, 0, 5);
      }
      ctx.fillStyle = INK;
      star(ctx, 0, 0, r * 1.25, r * 0.55, p.age * 0.25, 5);
      ctx.fillStyle = '#ffe066';
      star(ctx, 0, 0, r, r * 0.42, p.age * 0.25, 5);
      break;
    }
    case 'missile': {
      ctx.scale(d, 1);
      const fl = 6 + Math.sin(p.age * 1.3) * 3;
      ctx.fillStyle = '#ffb03b';
      ctx.beginPath();
      ctx.moveTo(-r * 1.2, -r * 0.35);
      ctx.lineTo(-r * 1.2 - fl * 2, 0);
      ctx.lineTo(-r * 1.2, r * 0.35);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(-r * 1.4, -r * 0.6);
      ctx.lineTo(r * 0.7, -r * 0.6);
      ctx.lineTo(r * 1.6, 0);
      ctx.lineTo(r * 0.7, r * 0.6);
      ctx.lineTo(-r * 1.4, r * 0.6);
      ctx.fill();
      ctx.fillStyle = '#dfe6ee';
      ctx.fillRect(-r * 1.2, -r * 0.4, r * 1.9, r * 0.8);
      ctx.fillStyle = owner;
      ctx.beginPath();
      ctx.moveTo(r * 0.7, -r * 0.4);
      ctx.lineTo(r * 1.35, 0);
      ctx.lineTo(r * 0.7, r * 0.4);
      ctx.fill();
      break;
    }
    case 'seed': {
      ctx.rotate(p.age * 0.3 * d);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.1 + 2.5, r * 0.75 + 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9a25a';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.1, r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7ccf4a';
      ctx.beginPath();
      ctx.ellipse(r * 0.9, -r * 0.5, r * 0.6, r * 0.3, -0.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'kunai': {
      ctx.scale(d, 1);
      ctx.strokeStyle = rgba('#ffffff', 0.35);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-r * 4, 0);
      ctx.lineTo(-r * 1.5, 0);
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(r * 2.1, 0);
      ctx.lineTo(0, -r * 0.8);
      ctx.lineTo(-r * 0.6, 0);
      ctx.lineTo(0, r * 0.8);
      ctx.fill();
      ctx.fillStyle = '#d7dee8';
      ctx.beginPath();
      ctx.moveTo(r * 1.7, 0);
      ctx.lineTo(0, -r * 0.5);
      ctx.lineTo(-r * 0.3, 0);
      ctx.lineTo(0, r * 0.5);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, 0);
      ctx.lineTo(-r * 1.6, 0);
      ctx.stroke();
      ctx.strokeStyle = owner;
      ctx.beginPath();
      ctx.arc(-r * 1.9, 0, r * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'wisp': {
      const fl = Math.sin(p.age * 0.4);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2);
      g.addColorStop(0, 'rgba(230,255,250,0.95)');
      g.addColorStop(0.4, 'rgba(120,255,210,0.6)');
      g.addColorStop(1, 'rgba(80,200,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,255,225,0.7)';
      ctx.beginPath();
      ctx.moveTo(-d * r * 0.2, -r * 0.7);
      ctx.quadraticCurveTo(-d * r * 2.6, -r * 0.2 + fl * 5, -d * r * 3.2, fl * 8);
      ctx.quadraticCurveTo(-d * r * 2.2, r * 0.6, -d * r * 0.2, r * 0.7);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillRect(d * r * 0.1 - 2, -4, 3, 5);
      ctx.fillRect(d * r * 0.45 - 2, -4, 3, 5);
      break;
    }
    case 'food': {
      ctx.rotate(p.age * 0.2 * d);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8b35a';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff6fa0';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 5; k++) {
        const a = k * 1.3;
        ctx.fillRect(Math.cos(a) * r * 0.35 - 1.5, Math.sin(a) * r * 0.35 - 1, 3, 2);
      }
      break;
    }
    case 'rock': {
      ctx.rotate(p.age * 0.12 * d);
      const pts = [[-1, -0.7], [-0.3, -1.05], [0.7, -0.8], [1.05, 0.1], [0.6, 0.9], [-0.4, 1], [-1.05, 0.3]];
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * r, y * r) : ctx.moveTo(x * r, y * r)));
      ctx.closePath();
      ctx.lineWidth = 5.6;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.fillStyle = '#8a8478';
      ctx.fill();
      ctx.strokeStyle = '#ff9a3a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.3);
      ctx.lineTo(r * 0.1, r * 0.1);
      ctx.lineTo(-r * 0.1, r * 0.5);
      ctx.stroke();
      break;
    }
    case 'blade': {
      ctx.rotate(p.age * 0.7 * d);
      ctx.fillStyle = INK;
      star(ctx, 0, 0, r * 1.4, r * 0.45, 0, 4);
      ctx.fillStyle = '#d7dee8';
      star(ctx, 0, 0, r * 1.1, r * 0.3, 0, 4);
      break;
    }
    case 'gust': {
      ctx.scale(d, 1);
      const a = Math.min(1, (p.maxLife - p.age) / 12);
      ctx.strokeStyle = `rgba(230,250,255,${0.75 * a})`;
      ctx.lineWidth = 4;
      for (let k = 0; k < 3; k++) {
        const o = (k - 1) * r * 0.55;
        ctx.beginPath();
        ctx.arc(-r * 0.3, o, r * (0.9 - Math.abs(k - 1) * 0.25), -1.1, 1.1);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-r * 2, -r * 0.2);
      ctx.lineTo(-r * 0.6, -r * 0.2);
      ctx.moveTo(-r * 1.6, r * 0.35);
      ctx.lineTo(-r * 0.4, r * 0.35);
      ctx.stroke();
      break;
    }
    default:
      ctx.restore();
      return false;
  }
  ctx.restore();
  return true;
}
