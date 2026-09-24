/** Simulation tuning constants. All times are in frames at 60 Hz; distances in world units (u). */
export const FPS = 60;

/** Launch speed (u/frame) = knockback × LAUNCH_SCALE. Tuned by tests/calibration.test.ts. */
export const LAUNCH_SCALE = 0.155;
/** Launch speed lost per frame (u/frame²), applied along the launch direction. */
export const KB_DECAY = 0.3;
export const TUMBLE_KB = 80;
export const HITSTUN_MULT = 0.4;
export const MAX_HITLAG = 20;
export const DI_MAX_DEG = 15;

/** Kept only so the (now unreachable) post-shieldbreak dizzy stagger still compiles. */
export const SHIELD_BREAK_DIZZY = 180;

export const BUFFER_FRAMES = 5;
export const JUMPSQUAT = 3;
export const FASTFALL_MULT = 1.6;
export const TECH_WINDOW = 11;

export const LEDGE_INTANGIBLE = 30;
export const LEDGE_MAX_HANG = 300;
export const LEDGE_ACT_DELAY = 6;
export const LEDGE_REGRAB_COOLDOWN = 30;

export const RESPAWN_DELAY = 90;
export const RESPAWN_PLATFORM_TIME = 300;
export const RESPAWN_INVULN = 120;

export const GRAB_BASE = 60;
export const GRAB_PER_PERCENT = 0.5;
export const GRAB_MASH = 3;

export const SUDDEN_DEATH_PERCENT = 300;
export const COUNTDOWN_FRAMES = 180;
export const MAX_PERCENT = 999.9;
