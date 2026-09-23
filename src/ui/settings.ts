import type { TouchLayout } from '../input/touchpad';

const KEY = 'launchparty.settings.v1';

export interface SettingsData {
  showFps: boolean;
  /** null = use the default layout. */
  touchLayout: TouchLayout | null;
}

const DEFAULTS: SettingsData = { showFps: false, touchLayout: null };

/** Best-effort load; falls back to defaults on any error (private browsing, corrupt data, etc.). */
export function loadSettings(): SettingsData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<SettingsData>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: SettingsData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore (private browsing / storage disabled)
  }
}
