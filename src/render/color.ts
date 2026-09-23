const cache = new Map<string, [number, number, number]>();

export function rgb(hex: string): [number, number, number] {
  let c = cache.get(hex);
  if (c) return c;
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  cache.set(hex, c);
  return c;
}

const mixCache = new Map<string, string>();

/** Blend two hex colours; t = 0 → a, 1 → b. */
export function mix(a: string, b: string, t: number): string {
  const q = Math.round(t * 20) / 20;
  const key = a + b + q;
  let s = mixCache.get(key);
  if (s) return s;
  const A = rgb(a);
  const B = rgb(b);
  const r = Math.round(A[0] + (B[0] - A[0]) * q);
  const g = Math.round(A[1] + (B[1] - A[1]) * q);
  const bl = Math.round(A[2] + (B[2] - A[2]) * q);
  s = `rgb(${r},${g},${bl})`;
  mixCache.set(key, s);
  return s;
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** Player colours (P1 red, P2 blue, P3 yellow, P4 green). */
export const PLAYER_COLORS = ['#ff3b4f', '#3b8bff', '#ffc83b', '#35d06e'] as const;
export const CPU_GREY = '#9aa0b4';
export const INK = '#15111f';

/** Percent colour ramp: white → yellow → orange → red → dark red. */
export function percentColor(p: number): string {
  if (p < 35) return mix('#ffffff', '#fff27a', p / 35);
  if (p < 80) return mix('#fff27a', '#ffa23a', (p - 35) / 45);
  if (p < 130) return mix('#ffa23a', '#ff3b3b', (p - 80) / 50);
  return mix('#ff3b3b', '#9a0f1f', Math.min(1, (p - 130) / 90));
}
