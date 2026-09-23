import type { App } from '../app';
import { DEVICE_IDS, type DeviceId } from '../input/devices';

export interface MenuIn {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  confirm: boolean;
  back: boolean;
  start: boolean;
  /** Device that produced the confirm (if any). */
  by: DeviceId | null;
}

/** OR together menu edges from every device plus Enter / Escape. */
export function menuIn(app: App, only?: readonly DeviceId[]): MenuIn {
  const d = app.devices;
  const out: MenuIn = { up: false, down: false, left: false, right: false, confirm: d.globalConfirm, back: d.globalBack, start: d.globalConfirm, by: null };
  for (const id of only ?? DEVICE_IDS) {
    if (!d.connected(id)) continue;
    const e = d.menu(id);
    out.up ||= e.up;
    out.down ||= e.down;
    out.left ||= e.left;
    out.right ||= e.right;
    if (e.confirm || e.start) {
      out.confirm = true;
      out.by ??= id;
    }
    out.back ||= e.back;
    out.start ||= e.start;
  }
  return out;
}
