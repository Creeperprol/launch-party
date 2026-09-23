import type { App, Scene } from '../app';
import { KB1, KB2, keyLabel } from '../input/keyboard';
import { INK, PLAYER_COLORS, mix } from '../render/color';
import type { Flow } from './flow';
import { menuIn } from './menuInput';
import { backdrop, font, header, hints, hoverRing, inRect, keycap, label, slab, type Rect } from './widgets';

const ROWS: [string, (k: typeof KB1) => string[], string[]][] = [
  ['MOVE', (k) => [keyLabel(k.up), keyLabel(k.left), keyLabel(k.down), keyLabel(k.right)], ['Left stick', 'D-pad']],
  ['JUMP', (k) => [keyLabel(k.jump)], ['X / Y  (left & top face)']],
  ['ATTACK', (k) => [keyLabel(k.attack)], ['A  (bottom face)']],
  ['SPECIAL', (k) => [keyLabel(k.special)], ['B  (right face)']],
  ['SHIELD', (k) => [keyLabel(k.shield)], ['Triggers  (LT / RT)']],
  ['GRAB', (k) => [keyLabel(k.grab)], ['Bumpers  (LB / RB)']],
  ['SMASH', (k) => [keyLabel(k.smash)], ['Right stick', 'or flick + A']],
  ['PAUSE', () => ['Esc'], ['Start']],
];

const TIPS = [
  'Tilt attacks: attack + direction.  Smash attacks: smash + direction (hold to charge) — on a pad, flick the stick + attack or use the right stick.',
  'Specials: special + neutral / side / up / down.  Up special recovers — then you fall helpless until you land or grab a ledge.',
  'Shield + left/right rolls, shield + down spot-dodges, shield in the air air-dodges.  Shield just before landing in tumble to tech.',
  'Grab (or shield + attack) → attack to pummel, direction to throw.  On a ledge: toward/up climbs, jump, shield rolls, attack attacks.',
  'Knock foes past the blast zones to take a stock. Higher damage % means bigger launches.   Global: ` debug overlay · M mute.',
];

export class ControlsScene implements Scene {
  name = 'controls';
  t = 0;
  private flow: Flow;
  back: Rect = { x: 1590, y: 800, w: 290, h: 80 };
  hoverBack = false;

  constructor(flow: Flow) {
    this.flow = flow;
  }

  update(app: App): void {
    this.t++;
    const inp = menuIn(app);
    const m = app.devices.mouse;
    this.hoverBack = inRect(this.back, m.x, m.y);
    if (inp.back || inp.confirm || (m.clicked && this.hoverBack)) {
      app.sfx.menuBack();
      this.flow.menu();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    backdrop(ctx, this.t, '#1b2248');
    header(ctx, 'CONTROLS', 'Two players can share one keyboard. Gamepads use the standard layout.');
    const cols: { title: string; color: string; x: number; kb?: typeof KB1 }[] = [
      { title: 'KEYS 1', color: PLAYER_COLORS[0], x: 60, kb: KB1 },
      { title: 'KEYS 2', color: PLAYER_COLORS[1], x: 660, kb: KB2 },
      { title: 'GAMEPAD', color: PLAYER_COLORS[2], x: 1260 },
    ];
    for (const c of cols) {
      slab(ctx, { x: c.x, y: 170, w: 580, h: 560 }, mix(c.color, INK, 0.72), { skew: 0.04, shadow: 10 });
      slab(ctx, { x: c.x + 20, y: 150, w: 260, h: 56 }, c.color, { skew: 0.25, shadow: 6, outline: 5 });
      label(ctx, c.title, c.x + 44, 194, 40, { stroke: 8 });
      ROWS.forEach(([name, kb, pad], i) => {
        const y = 236 + i * 60;
        label(ctx, name, c.x + 30, y + 34, 26, { face: 'ui', weight: 800, color: 'rgba(255,255,255,0.85)' });
        let x = c.x + 180;
        if (c.kb) {
          for (const k of kb(c.kb)) x += keycap(ctx, k, x, y + 4, 42) + 8;
        } else {
          ctx.font = font(22, 'ui', 700);
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.fillText(pad.join('  ·  '), x, y + 34);
        }
      });
    }
    slab(ctx, { x: 60, y: 760, w: 1440, h: 250 }, 'rgba(20,16,40,0.9)', { skew: 0.02, shadow: 8 });
    label(ctx, 'HOW TO FIGHT', 90, 806, 34, { stroke: 8, color: '#ffe066' });
    ctx.font = font(20, 'ui', 600);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'left';
    TIPS.forEach((tip, i) => ctx.fillText(tip, 92, 846 + i * 32));
    slab(ctx, this.back, this.hoverBack ? '#ffe066' : '#3b3566', { shadow: 6 });
    label(ctx, 'BACK', this.back.x + this.back.w / 2 + 6, this.back.y + 56, 44, { align: 'center', color: this.hoverBack ? INK : '#fff' });
    if (this.hoverBack) hoverRing(ctx, this.back);
    hints(ctx, [[['Esc', 'G', ';'], 'back'], [['M'], 'mute'], [['`'], 'debug overlay']]);
  }
}
