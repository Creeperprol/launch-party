import type { InputFrame } from '../sim/input';
import { neutralInput } from '../sim/input';
import { mapGamepad, padMenuHeld, type GamepadLike, type MenuPress } from './gamepad';
import { GAME_KEYS, KB1, KB2, Keyboard, type KeyLayout } from './keyboard';

export type DeviceId = 'kb1' | 'kb2' | 'pad0' | 'pad1' | 'pad2' | 'pad3';

export interface MenuEdges extends MenuPress {}

const EMPTY: MenuPress = { up: false, down: false, left: false, right: false, confirm: false, back: false, start: false };

export interface MouseState {
  x: number;
  y: number;
  down: boolean;
  clicked: boolean;
  moved: boolean;
  wheel: number;
}

/** Keyboard layouts, gamepads, and mouse, polled once per 60 Hz tick. */
export class Devices {
  kb = new Keyboard();
  pads: (GamepadLike | null)[] = [null, null, null, null];
  private held = new Map<string, MenuPress>();
  private edges = new Map<string, MenuPress>();
  private repeat = new Map<string, number>();
  mouse: MouseState = { x: -1, y: -1, down: false, clicked: false, moved: false, wheel: 0 };
  globalConfirm = false;
  globalBack = false;
  anyKey = false;
  private canvas: HTMLCanvasElement | null = null;
  toLogical: (cx: number, cy: number) => [number, number] = (x, y) => [x, y];

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    window.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      this.kb.onDown(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.kb.onUp(e.code);
    });
    window.addEventListener('blur', () => this.kb.clear());
    const pos = (e: PointerEvent | MouseEvent) => {
      const [x, y] = this.toLogical(e.clientX, e.clientY);
      this.mouse.x = x;
      this.mouse.y = y;
    };
    canvas.addEventListener('pointermove', (e) => {
      pos(e);
      this.mouse.moved = true;
    });
    canvas.addEventListener('pointerdown', (e) => {
      pos(e);
      this.mouse.down = true;
      this.mouse.clicked = true;
      canvas.focus();
    });
    window.addEventListener('pointerup', () => {
      this.mouse.down = false;
    });
    canvas.addEventListener('wheel', (e) => {
      this.mouse.wheel += Math.sign(e.deltaY);
      e.preventDefault();
    }, { passive: false });
  }

  get canvasEl(): HTMLCanvasElement | null {
    return this.canvas;
  }

  layout(id: DeviceId): KeyLayout | null {
    return id === 'kb1' ? KB1 : id === 'kb2' ? KB2 : null;
  }

  /** Read gamepads and compute menu edges (with auto-repeat on held directions). */
  poll(): void {
    const gps = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < 4; i++) {
      const g = gps[i];
      this.pads[i] = g && g.connected ? (g as unknown as GamepadLike) : null;
    }
    const ids: DeviceId[] = ['kb1', 'kb2', 'pad0', 'pad1', 'pad2', 'pad3'];
    for (const id of ids) {
      const now = this.menuHeld(id);
      const prev = this.held.get(id) ?? EMPTY;
      const e: MenuPress = { ...EMPTY };
      for (const k of Object.keys(EMPTY) as (keyof MenuPress)[]) e[k] = now[k] && !prev[k];
      for (const d of ['up', 'down', 'left', 'right'] as const) {
        const rk = `${id}:${d}`;
        if (now[d]) {
          const n = (this.repeat.get(rk) ?? 0) + 1;
          this.repeat.set(rk, n);
          if (n > 18 && (n - 18) % 6 === 0) e[d] = true;
        } else this.repeat.set(rk, 0);
      }
      this.edges.set(id, e);
      this.held.set(id, now);
    }
    this.globalConfirm = this.kb.pressed('Enter');
    this.globalBack = this.kb.pressed('Escape');
    this.anyKey = this.kb.tapped.size > 0 || this.mouse.clicked || ids.some((id) => {
      const e = this.edges.get(id)!;
      return e.confirm || e.back || e.start;
    });
  }

  private menuHeld(id: DeviceId): MenuPress {
    const L = this.layout(id);
    if (L) {
      const k = this.kb;
      return {
        up: k.held(L.up), down: k.held(L.down), left: k.held(L.left), right: k.held(L.right),
        confirm: k.held(L.attack) || k.held(L.jump), back: k.held(L.special), start: false,
      };
    }
    const p = this.pads[Number(id.slice(3))];
    return p ? padMenuHeld(p) : EMPTY;
  }

  menu(id: DeviceId): MenuPress {
    return this.edges.get(id) ?? EMPTY;
  }

  connected(id: DeviceId): boolean {
    if (id === 'kb1' || id === 'kb2') return true;
    return !!this.pads[Number(id.slice(3))];
  }

  frame(id: DeviceId): InputFrame {
    const L = this.layout(id);
    if (L) return this.kb.frame(L);
    const p = this.pads[Number(id.slice(3))];
    return p ? mapGamepad(p) : neutralInput();
  }

  /** A device pressed a "join" button this tick. */
  joinPressed(id: DeviceId): boolean {
    const L = this.layout(id);
    if (L) return this.kb.pressed(L.attack) || this.kb.pressed(L.jump);
    const e = this.edges.get(id);
    return !!e && (e.confirm || e.start);
  }

  pausePressed(id: DeviceId): boolean {
    if (id === 'kb1' || id === 'kb2') return false;
    return !!this.edges.get(id)?.start;
  }

  endTick(): void {
    this.kb.endTick();
    this.mouse.clicked = false;
    this.mouse.moved = false;
    this.mouse.wheel = 0;
  }
}

export const DEVICE_IDS: readonly DeviceId[] = ['kb1', 'kb2', 'pad0', 'pad1', 'pad2', 'pad3'];

export function deviceLabel(id: DeviceId): string {
  if (id === 'kb1') return 'KEYS 1';
  if (id === 'kb2') return 'KEYS 2';
  return `PAD ${Number(id.slice(3)) + 1}`;
}
