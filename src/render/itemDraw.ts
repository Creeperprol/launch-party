import type { ItemKind } from '../sim/items';
import { INK } from './color';

/**
 * Draw an item in its local frame. In hand, long items extend along +x from the origin (the grip);
 * on the ground they are centred.
 */
export function drawItemShape(ctx: CanvasRenderingContext2D, kind: ItemKind, scale: number, t: number, inHand: boolean): void {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (kind) {
    case 'bat': {
      const L = 72;
      if (!inHand) ctx.translate(-L / 2, 0);
      ctx.fillStyle = INK;
      barPath(ctx, L, 5.5, 11, 3);
      ctx.fill();
      ctx.fillStyle = '#d4964f';
      barPath(ctx, L, 3.5, 9, 0);
      ctx.fill();
      ctx.strokeStyle = '#a86a30';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(L * 0.45, -2);
      ctx.lineTo(L * 0.9, -3.5);
      ctx.stroke();
      ctx.fillStyle = '#2b2b3a';
      ctx.fillRect(-1, -4.5, 12, 9);
      break;
    }
    case 'blade': {
      const L = 86;
      if (!inHand) ctx.translate(-L / 2, 0);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(16, 0);
      ctx.stroke();
      ctx.strokeStyle = '#3a3550';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = '#ff4fa0';
      ctx.fillRect(14, -8, 5, 16);
      const pulse = 0.7 + Math.sin(t * 0.3) * 0.15;
      ctx.strokeStyle = `rgba(255,79,160,${0.35 * pulse})`;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(L, 0);
      ctx.stroke();
      ctx.strokeStyle = '#ff9ccb';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      break;
    }
    case 'bomb': {
      if (inHand) ctx.translate(14, 0);
      const r = 17;
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a2d4a';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(-6, -6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a8fb0';
      ctx.fillRect(-5, -r - 6, 10, 7);
      ctx.strokeStyle = '#6b4a2a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -r - 6);
      ctx.quadraticCurveTo(6, -r - 14, 12, -r - 12);
      ctx.stroke();
      if (Math.floor(t / 3) % 2 === 0) {
        ctx.fillStyle = '#ffe36a';
        ctx.beginPath();
        ctx.arc(12, -r - 12, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'fruit': {
      if (inHand) ctx.translate(12, 0);
      const r = 16;
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(-5, 0, r * 0.75 + 3, 0, Math.PI * 2);
      ctx.arc(5, 0, r * 0.75 + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff7a8a';
      ctx.beginPath();
      ctx.arc(-5, 0, r * 0.75, 0, Math.PI * 2);
      ctx.arc(5, 0, r * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffc0a0';
      ctx.beginPath();
      ctx.arc(-7, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4ccf6a';
      ctx.beginPath();
      ctx.ellipse(4, -r * 0.9, 7, 3.5, -0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

function barPath(ctx: CanvasRenderingContext2D, L: number, w0: number, w1: number, grow: number): void {
  ctx.beginPath();
  ctx.moveTo(-grow, -w0);
  ctx.lineTo(L * 0.35, -w0);
  ctx.quadraticCurveTo(L * 0.6, -w1, L + grow, -w1);
  ctx.arc(L + grow - w1, 0, w1, -Math.PI / 2, Math.PI / 2);
  ctx.quadraticCurveTo(L * 0.6, w1, L * 0.35, w0);
  ctx.lineTo(-grow, w0);
  ctx.closePath();
}
