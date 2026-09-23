import type { StageRT } from '../sim/stage';
import type { Camera } from './camera';
import { VIEW_H, VIEW_W } from './camera';
import { INK, rgba } from './color';

/** Deterministic pseudo-random for cosmetic scatter (stable across frames). */
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const skies = new Map<string, HTMLCanvasElement>();

/** Pre-rendered static sky for a theme (cached). */
export function skyCanvas(theme: string): HTMLCanvasElement {
  let c = skies.get(theme);
  if (!c) {
    c = buildSky(theme);
    skies.set(theme, c);
  }
  return c;
}

function buildSky(theme: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = VIEW_W;
  c.height = VIEW_H;
  const g = c.getContext('2d')!;
  if (theme === 'sunset') {
    const grd = g.createLinearGradient(0, 0, 0, VIEW_H);
    grd.addColorStop(0, '#231446');
    grd.addColorStop(0.42, '#7b2f6b');
    grd.addColorStop(0.62, '#e0586a');
    grd.addColorStop(0.72, '#ffae6a');
    grd.addColorStop(0.73, '#3a2a5e');
    grd.addColorStop(1, '#170f2e');
    g.fillStyle = grd;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    const sun = g.createRadialGradient(1180, 700, 10, 1180, 700, 420);
    sun.addColorStop(0, 'rgba(255,240,190,1)');
    sun.addColorStop(0.18, 'rgba(255,196,120,0.95)');
    sun.addColorStop(0.19, 'rgba(255,150,110,0.45)');
    sun.addColorStop(1, 'rgba(255,120,110,0)');
    g.fillStyle = sun;
    g.fillRect(0, 0, VIEW_W, 788);
    for (let i = 0; i < 26; i++) {
      const y = 800 + i * 11;
      const w = 260 - i * 7 + hash(i) * 60;
      g.fillStyle = `rgba(255,200,140,${0.35 - i * 0.012})`;
      g.fillRect(1180 - w / 2 + (hash(i + 9) - 0.5) * 40, y, w, 3);
    }
  } else if (theme === 'space') {
    const grd = g.createLinearGradient(0, 0, 0, VIEW_H);
    grd.addColorStop(0, '#04030c');
    grd.addColorStop(0.6, '#130a2e');
    grd.addColorStop(1, '#241046');
    g.fillStyle = grd;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    for (const [x, y, r, col] of [[420, 300, 520, '#6a2cff'], [1500, 760, 600, '#00c2b8'], [1100, 180, 380, '#ff3d9a']] as const) {
      const n = g.createRadialGradient(x, y, 0, x, y, r);
      n.addColorStop(0, rgba(col, 0.22));
      n.addColorStop(1, rgba(col, 0));
      g.fillStyle = n;
      g.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    for (let i = 0; i < 420; i++) {
      const x = hash(i) * VIEW_W;
      const y = hash(i + 1000) * VIEW_H;
      const s = hash(i + 2000) < 0.93 ? 1.2 : 2.6;
      g.fillStyle = `rgba(255,255,255,${0.35 + hash(i + 3000) * 0.6})`;
      g.fillRect(x, y, s, s);
    }
  } else {
    const grd = g.createLinearGradient(0, 0, 0, VIEW_H);
    grd.addColorStop(0, '#16304f');
    grd.addColorStop(0.45, '#3f5f86');
    grd.addColorStop(0.66, '#f0a47a');
    grd.addColorStop(0.7, '#ffd6a0');
    grd.addColorStop(0.705, '#1d4a5c');
    grd.addColorStop(1, '#0c2230');
    g.fillStyle = grd;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(255,214,160,${0.1 + hash(i) * 0.25})`;
      g.fillRect(hash(i + 50) * VIEW_W, 770 + hash(i + 70) * 300, 40 + hash(i + 90) * 120, 2);
    }
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(255,255,255,${hash(i + 7) * 0.6})`;
      g.fillRect(hash(i + 400) * VIEW_W, hash(i + 500) * 400, 1.6, 1.6);
    }
  }
  return c;
}

/** Screen-space background with parallax layers. */
export function drawBackground(ctx: CanvasRenderingContext2D, st: StageRT, cam: Camera, t: number): void {
  const theme = st.def.theme;
  ctx.drawImage(skyCanvas(theme), 0, 0, VIEW_W, VIEW_H);
  const px = (p: number) => -cam.x * p * 0.35;
  const py = (p: number) => -(cam.y + 250) * p * 0.3;
  if (theme === 'sunset') {
    // distant ruined towers
    ctx.fillStyle = '#3a2152';
    const ox = px(0.25);
    const oy = py(0.2);
    for (let i = 0; i < 9; i++) {
      const x = ((i * 260 + ox) % 2600 + 2600) % 2600 - 340;
      const h = 90 + hash(i) * 150;
      const w = 50 + hash(i + 3) * 60;
      ctx.fillRect(x, 788 - h + oy, w, h);
      ctx.fillRect(x - 14, 788 - h + oy - 10, w + 28, 14);
      if (hash(i + 5) > 0.5) ctx.fillRect(x + w + 20, 788 - h * 0.6 + oy, w * 0.6, h * 0.6);
    }
    ctx.fillStyle = '#2a1840';
    ctx.fillRect(0, 786 + oy, VIEW_W, 6);
    // clouds
    const cx = px(0.5) + t * 0.15;
    for (let i = 0; i < 7; i++) {
      const x = ((i * 420 + cx) % 2900 + 2900) % 2900 - 400;
      const y = 150 + hash(i + 11) * 330 + py(0.4);
      ctx.fillStyle = `rgba(255,170,160,${0.18 + hash(i) * 0.14})`;
      cloud(ctx, x, y, 90 + hash(i + 20) * 90);
    }
  } else if (theme === 'space') {
    // ringed planet
    const x = 1500 + px(0.08);
    const y = 300 + py(0.08);
    const g = ctx.createRadialGradient(x - 60, y - 60, 20, x, y, 190);
    g.addColorStop(0, '#ffb3d9');
    g.addColorStop(1, '#5a1f7a');
    ctx.strokeStyle = 'rgba(255,220,250,0.4)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(x, y, 300, 58, -0.35, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 170, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,250,0.6)';
    ctx.beginPath();
    ctx.ellipse(x, y, 300, 58, -0.35, 0, Math.PI);
    ctx.stroke();
    // drifting debris
    for (let i = 0; i < 14; i++) {
      const dx = ((i * 211 + px(0.3) + t * 0.2) % 2300 + 2300) % 2300 - 200;
      const dy = 200 + hash(i + 40) * 700 + py(0.3);
      ctx.fillStyle = 'rgba(120,110,170,0.35)';
      ctx.beginPath();
      ctx.arc(dx, dy, 4 + hash(i) * 9, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // lighthouse + boats + lantern strings
    const hx = 1650 + px(0.1);
    const hy = 760 + py(0.1);
    ctx.fillStyle = '#20364a';
    ctx.fillRect(hx - 22, hy - 200, 44, 200);
    ctx.fillStyle = '#e9e2cf';
    ctx.fillRect(hx - 22, hy - 150, 44, 22);
    ctx.fillRect(hx - 22, hy - 90, 44, 22);
    ctx.fillStyle = '#ffe9a0';
    ctx.fillRect(hx - 16, hy - 228, 32, 28);
    const beam = (Math.sin(t * 0.02) + 1) / 2;
    ctx.fillStyle = `rgba(255,236,170,${0.18 + beam * 0.15})`;
    ctx.beginPath();
    ctx.moveTo(hx, hy - 214);
    ctx.lineTo(hx - 900 * (1 - beam) - 200, hy - 330);
    ctx.lineTo(hx - 900 * (1 - beam) - 200, hy - 120);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const bx = ((i * 380 + px(0.2) + t * 0.1) % 2200 + 2200) % 2200 - 150;
      const by = 790 + hash(i) * 30 + py(0.2);
      ctx.fillStyle = '#1b2f3f';
      ctx.beginPath();
      ctx.moveTo(bx - 50, by);
      ctx.lineTo(bx + 50, by);
      ctx.lineTo(bx + 36, by + 16);
      ctx.lineTo(bx - 36, by + 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(bx - 2, by - 60, 4, 60);
      ctx.fillStyle = 'rgba(240,230,210,0.8)';
      ctx.beginPath();
      ctx.moveTo(bx + 2, by - 58);
      ctx.lineTo(bx + 34, by - 10);
      ctx.lineTo(bx + 2, by - 10);
      ctx.closePath();
      ctx.fill();
    }
    const lx = px(0.55);
    const ly = py(0.45);
    for (let row = 0; row < 2; row++) {
      ctx.strokeStyle = 'rgba(30,40,60,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = -200; x <= VIEW_W + 200; x += 20) {
        const y = 120 + row * 90 + Math.sin((x + lx) / 180) * 40 + ly;
        if (x === -200) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (let x = -200; x <= VIEW_W + 200; x += 90) {
        const xx = x + ((lx % 90) + 90) % 90;
        const y = 120 + row * 90 + Math.sin((xx - ((lx % 90) + 90) % 90 + lx) / 180) * 40 + ly + 10;
        const glow = 0.6 + Math.sin(t * 0.05 + x) * 0.2;
        ctx.fillStyle = `rgba(255,190,90,${0.25 * glow})`;
        ctx.beginPath();
        ctx.arc(xx, y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = row ? '#ff9a5a' : '#ffd36a';
        ctx.beginPath();
        ctx.arc(xx, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, s, s * 0.32, 0, 0, Math.PI * 2);
  ctx.ellipse(x + s * 0.5, y - s * 0.15, s * 0.55, s * 0.3, 0, 0, Math.PI * 2);
  ctx.ellipse(x - s * 0.45, y - s * 0.08, s * 0.5, s * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** World-space stage geometry. */
export function drawStage(ctx: CanvasRenderingContext2D, st: StageRT, t: number): void {
  const M = st.main;
  const w = M.x2 - M.x1;
  const h = M.bottom - M.top;
  ctx.lineJoin = 'round';
  if (st.def.theme === 'sunset') {
    // underside glow + hanging vines (decor stays inside the block)
    ctx.fillStyle = INK;
    roundRect(ctx, M.x1 - 5, M.top - 5, w + 10, h + 10, 30);
    ctx.fill();
    const g = ctx.createLinearGradient(0, M.top, 0, M.bottom);
    g.addColorStop(0, '#d8c3a8');
    g.addColorStop(0.2, '#b99f86');
    g.addColorStop(1, '#6d5570');
    ctx.fillStyle = g;
    roundRect(ctx, M.x1, M.top, w, h, 26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,70,0.35)';
    ctx.lineWidth = 3;
    for (let row = 0; row < 4; row++) {
      const y = M.top + 40 + row * 44;
      ctx.beginPath();
      ctx.moveTo(M.x1 + 16, y);
      ctx.lineTo(M.x2 - 16, y);
      ctx.stroke();
      for (let x = M.x1 + (row % 2 ? 50 : 90); x < M.x2 - 20; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 44);
        ctx.stroke();
      }
    }
    // gold crown trim
    ctx.fillStyle = '#f2c65a';
    ctx.fillRect(M.x1 + 6, M.top, w - 12, 12);
    ctx.fillStyle = '#b8862a';
    ctx.fillRect(M.x1 + 6, M.top + 12, w - 12, 5);
    for (let x = M.x1 + 60; x < M.x2 - 40; x += 110) {
      ctx.fillStyle = '#f2c65a';
      ctx.beginPath();
      ctx.moveTo(x - 14, M.top + 17);
      ctx.lineTo(x, M.top + 38);
      ctx.lineTo(x + 14, M.top + 17);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = '#4f8a5a';
    ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) {
      const x = M.x1 + 50 + i * ((w - 100) / 8);
      const len = 20 + hash(i) * 50;
      ctx.beginPath();
      ctx.moveTo(x, M.bottom - 6);
      ctx.quadraticCurveTo(x + Math.sin(t * 0.03 + i) * 6, M.bottom - 6 + len * 0.6, x, M.bottom - 6 + len * 0.3);
      ctx.stroke();
    }
    for (const p of st.plats) platformSlab(ctx, p.x1, p.x2, p.y, '#cdb89e', '#f2c65a', t);
  } else if (st.def.theme === 'space') {
    ctx.fillStyle = INK;
    roundRect(ctx, M.x1 - 5, M.top - 5, w + 10, h + 10, 14);
    ctx.fill();
    const g = ctx.createLinearGradient(0, M.top, 0, M.bottom);
    g.addColorStop(0, '#3a3f66');
    g.addColorStop(1, '#161a30');
    ctx.fillStyle = g;
    roundRect(ctx, M.x1, M.top, w, h, 10);
    ctx.fill();
    const pulse = 0.65 + Math.sin(t * 0.05) * 0.2;
    ctx.strokeStyle = `rgba(80,240,255,${pulse})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(M.x1 + 10, M.top + 4);
    ctx.lineTo(M.x2 - 10, M.top + 4);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(80,240,255,0.35)';
    for (let i = 1; i < 6; i++) {
      const x = M.x1 + (w * i) / 6;
      ctx.beginPath();
      ctx.moveTo(x, M.top + 20);
      ctx.lineTo(x, M.bottom - 20);
      ctx.stroke();
    }
    const u = ctx.createRadialGradient(0, M.bottom, 10, 0, M.bottom, 420);
    u.addColorStop(0, 'rgba(80,240,255,0.35)');
    u.addColorStop(1, 'rgba(80,240,255,0)');
    ctx.fillStyle = u;
    ctx.fillRect(M.x1, M.bottom, w, 420);
  } else {
    // stone pier with a plank deck
    ctx.fillStyle = INK;
    roundRect(ctx, M.x1 - 5, M.top - 5, w + 10, h + 10, 18);
    ctx.fill();
    const g = ctx.createLinearGradient(0, M.top, 0, M.bottom);
    g.addColorStop(0, '#6f8190');
    g.addColorStop(1, '#2d3a48');
    ctx.fillStyle = g;
    roundRect(ctx, M.x1, M.top, w, h, 14);
    ctx.fill();
    ctx.fillStyle = '#9a6a44';
    ctx.fillRect(M.x1, M.top, w, 22);
    ctx.strokeStyle = '#5a3a24';
    ctx.lineWidth = 2;
    for (let x = M.x1 + 40; x < M.x2; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, M.top);
      ctx.lineTo(x, M.top + 22);
      ctx.stroke();
    }
    ctx.fillStyle = '#5a3a24';
    for (let x = M.x1 + 60; x < M.x2 - 30; x += 180) ctx.fillRect(x - 10, M.top + 22, 20, h - 30);
    ctx.fillStyle = 'rgba(255,200,120,0.12)';
    ctx.fillRect(M.x1, M.bottom - 40, w, 40);
    for (const p of st.plats) raft(ctx, p.x1, p.x2, p.y, t);
  }
}

function platformSlab(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, fill: string, trim: string, t: number): void {
  const w = x2 - x1;
  ctx.fillStyle = INK;
  roundRect(ctx, x1 - 4, y - 4, w + 8, 26, 10);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, x1, y, w, 18, 8);
  ctx.fill();
  ctx.fillStyle = trim;
  ctx.fillRect(x1 + 6, y, w - 12, 5);
  const glow = 0.55 + Math.sin(t * 0.06 + x1) * 0.3;
  ctx.fillStyle = `rgba(255,220,120,${glow})`;
  ctx.beginPath();
  ctx.arc((x1 + x2) / 2, y + 11, 4, 0, Math.PI * 2);
  ctx.fill();
}

function raft(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, t: number): void {
  const w = x2 - x1;
  ctx.fillStyle = INK;
  roundRect(ctx, x1 - 4, y - 4, w + 8, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#b07a4c';
  roundRect(ctx, x1, y, w, 22, 8);
  ctx.fill();
  ctx.strokeStyle = '#7a4e2c';
  ctx.lineWidth = 2;
  for (let x = x1 + 26; x < x2; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x, y + 20);
    ctx.stroke();
  }
  const cx = x2 - 22;
  ctx.fillStyle = INK;
  ctx.fillRect(cx - 3, y - 56, 6, 56);
  ctx.fillStyle = '#ffcf6a';
  ctx.beginPath();
  ctx.arc(cx, y - 60, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,200,100,${0.25 + Math.sin(t * 0.08) * 0.08})`;
  ctx.beginPath();
  ctx.arc(cx, y - 60, 26, 0, Math.PI * 2);
  ctx.fill();
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
