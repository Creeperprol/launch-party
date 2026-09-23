import type { InputFrame } from '../sim/input';

export interface KeyLayout {
  id: 'kb1' | 'kb2';
  name: string;
  up: string;
  down: string;
  left: string;
  right: string;
  jump: string;
  attack: string;
  special: string;
  shield: string;
  grab: string;
  smash: string;
}

/** Two non-overlapping shared-keyboard layouts that need no numpad. */
export const KB1: KeyLayout = {
  id: 'kb1', name: 'Keyboard 1',
  up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD',
  jump: 'Space', attack: 'KeyF', special: 'KeyG', shield: 'ShiftLeft', grab: 'KeyT', smash: 'KeyV',
};

export const KB2: KeyLayout = {
  id: 'kb2', name: 'Keyboard 2',
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
  jump: 'ShiftRight', attack: 'Quote', special: 'Semicolon', shield: 'KeyL', grab: 'KeyK', smash: 'BracketLeft',
};

export const LAYOUTS: readonly KeyLayout[] = [KB1, KB2];

/** Human-readable key names for the Controls screen. */
export function keyLabel(code: string): string {
  const map: Record<string, string> = {
    Space: 'Space', ShiftLeft: 'Left Shift', ShiftRight: 'Right Shift', Quote: "'", Semicolon: ';',
    BracketLeft: '[', BracketRight: ']', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    Enter: 'Enter', Escape: 'Esc', Backquote: '`', Slash: '/', Period: '.', Comma: ',',
  };
  if (map[code]) return map[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}

/** Keys the game owns (prevent page scrolling / browser find). */
export const GAME_KEYS: ReadonlySet<string> = new Set([
  ...LAYOUTS.flatMap((l) => [l.up, l.down, l.left, l.right, l.jump, l.attack, l.special, l.shield, l.grab, l.smash]),
  'Enter', 'Escape', 'Backquote', 'KeyM', 'KeyP', 'Tab',
]);

/** Tracks key state with tap capture (a press+release between ticks still counts for one tick). */
export class Keyboard {
  down = new Set<string>();
  tapped = new Set<string>();
  /** Press order counters for last-input-wins on opposite directions. */
  order = new Map<string, number>();
  private seq = 0;

  onDown(code: string): void {
    if (!this.down.has(code)) {
      this.order.set(code, ++this.seq);
      this.tapped.add(code);
    }
    this.down.add(code);
  }

  onUp(code: string): void {
    this.down.delete(code);
  }

  clear(): void {
    this.down.clear();
    this.tapped.clear();
  }

  /** Held this tick (includes quick taps). */
  held(code: string): boolean {
    return this.down.has(code) || this.tapped.has(code);
  }

  /** Newly pressed since the last tick. */
  pressed(code: string): boolean {
    return this.tapped.has(code);
  }

  endTick(): void {
    this.tapped.clear();
  }

  axis(neg: string, pos: string): number {
    const n = this.held(neg);
    const p = this.held(pos);
    if (n && p) return (this.order.get(pos) ?? 0) > (this.order.get(neg) ?? 0) ? 1 : -1;
    return p ? 1 : n ? -1 : 0;
  }

  frame(l: KeyLayout): InputFrame {
    return {
      x: this.axis(l.left, l.right),
      y: this.axis(l.down, l.up),
      cx: 0,
      cy: 0,
      jump: this.held(l.jump),
      attack: this.held(l.attack),
      special: this.held(l.special),
      shield: this.held(l.shield),
      grab: this.held(l.grab),
      smash: this.held(l.smash),
      digital: true,
    };
  }

  anyLayoutKey(l: KeyLayout): boolean {
    return [l.jump, l.attack, l.special, l.shield, l.grab, l.smash].some((k) => this.pressed(k));
  }
}
