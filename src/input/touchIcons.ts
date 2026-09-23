import { star } from '../render/fx';

export type GlyphKind = 'jump' | 'attack' | 'special' | 'shield' | 'smash';

/** Face-button colours: each action reads by colour and shape, not text. */
export const GLYPH_COLOR: Record<GlyphKind, string> = {
  jump: '#3bb8ff',
  attack: '#ff4d5e',
  special: '#ffc83b',
  smash: '#ff8a3b',
  shield: '#9a6bff',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws a glyph of half-size s centred at (x, y) in `fg`; `bg` cuts detail lines into filled shapes. */
export function drawGlyph(ctx: CanvasRenderingContext2D, kind: GlyphKind, x: number, y: number, s: number, fg: string, bg: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fg;
  ctx.strokeStyle = fg;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);
  switch (kind) {
    case 'jump': {
      ctx.lineWidth = s * 0.34;
      for (const dy of [-0.35, 0.45]) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.85, (dy + 0.45) * s);
        ctx.lineTo(0, (dy - 0.4) * s);
        ctx.lineTo(s * 0.85, (dy + 0.45) * s);
        ctx.stroke();
      }
      break;
    }
    case 'attack': {
      roundRect(ctx, -s * 0.85, -s * 0.72, s * 1.6, s * 1.3, s * 0.32);
      ctx.fill();
      ctx.strokeStyle = bg;
      ctx.lineWidth = s * 0.13;
      for (const fx of [-0.45, -0.05, 0.35]) {
        ctx.beginPath();
        ctx.moveTo(fx * s, -s * 0.7);
        ctx.lineTo(fx * s, -s * 0.2);
        ctx.stroke();
      }
      roundRect(ctx, -s * 1.0, -s * 0.05, s * 1.15, s * 0.5, s * 0.25);
      ctx.fillStyle = fg;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = fg;
      roundRect(ctx, -s * 0.55, s * 0.5, s * 1.1, s * 0.42, s * 0.12);
      ctx.fill();
      break;
    }
    case 'special': {
      star(ctx, -s * 0.12, s * 0.1, s * 1.05, s * 0.3, 0, 4);
      star(ctx, s * 0.72, -s * 0.72, s * 0.38, s * 0.12, 0, 4);
      break;
    }
    case 'smash': {
      star(ctx, 0, 0, s * 1.1, s * 0.58, 0.2, 8);
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'shield': {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.55, -s * 0.72, s * 0.9, -s * 0.78);
      ctx.lineTo(s * 0.9, -s * 0.05);
      ctx.quadraticCurveTo(s * 0.82, s * 0.72, 0, s * 1.05);
      ctx.quadraticCurveTo(-s * 0.82, s * 0.72, -s * 0.9, -s * 0.05);
      ctx.lineTo(-s * 0.9, -s * 0.78);
      ctx.quadraticCurveTo(-s * 0.55, -s * 0.72, 0, -s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = bg;
      ctx.lineWidth = s * 0.14;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.62);
      ctx.lineTo(0, s * 0.7);
      ctx.moveTo(-s * 0.55, -s * 0.12);
      ctx.lineTo(s * 0.55, -s * 0.12);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

export function drawPauseGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, fg: string): void {
  ctx.fillStyle = fg;
  roundRect(ctx, x - s * 0.7, y - s, s * 0.5, s * 2, s * 0.18);
  ctx.fill();
  roundRect(ctx, x + s * 0.2, y - s, s * 0.5, s * 2, s * 0.18);
  ctx.fill();
}
