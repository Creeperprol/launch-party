import { LAUNCH_SCALE } from '../sim/constants';
import type { Fighter } from '../sim/fighter';
import { applyDI, knockback } from '../sim/knockback';
import { neutralInput, type InputFrame } from '../sim/input';
import type { Match } from '../sim/match';
import { DEG, clamp, lerp } from '../sim/math';
import { Rng } from '../sim/rng';
import { moveInfos, type MoveInfo } from './moveInfo';
import { measureRecovery, type Recovery } from './recovery';

type Btn = 'jump' | 'attack' | 'special' | 'shield' | 'grab';

interface Snap {
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: string;
  moveId: string | null;
  moveFrame: number;
  facing: number;
}

interface Skill {
  reaction: number;
  decide: number;
  aggression: number;
  accuracy: number;
  shield: number;
  dodge: number;
  tech: number;
  di: number;
  punish: number;
  edgeguard: number;
  mash: number;
  idleChance: number;
}

function skillFor(level: number): Skill {
  const k = (clamp(level, 1, 9) - 1) / 8;
  return {
    // Human-like: ~0.6 s at level 1 down to ~0.23 s at level 9 (never frame-perfect).
    reaction: Math.round(lerp(36, 14, k)),
    decide: Math.round(lerp(24, 6, k)),
    aggression: lerp(0.35, 0.95, k),
    accuracy: lerp(0.35, 0.97, k),
    shield: level <= 3 ? 0.06 : lerp(0.2, 0.75, k),
    dodge: level >= 6 ? lerp(0.05, 0.3, k) : 0,
    tech: level <= 3 ? 0 : lerp(0.2, 0.9, k),
    di: level >= 7 ? lerp(0.6, 1, (level - 7) / 2) : 0,
    punish: level >= 7 ? lerp(0.5, 0.95, (level - 7) / 2) : level >= 4 ? 0.25 : 0,
    edgeguard: level >= 7 ? lerp(0.35, 0.8, (level - 7) / 2) : 0,
    mash: lerp(0.15, 0.9, k),
    idleChance: level <= 3 ? lerp(0.35, 0.1, (level - 1) / 2) : 0,
  };
}

/**
 * CPU opponent (levels 1–9). It reads the match state but acts only through the
 * same per-frame input struct humans use. All randomness comes from its own seeded RNG.
 */
export class CpuController {
  idx: number;
  level: number;
  sk: Skill;
  rng: Rng;
  private frame = 0;
  private hist: Snap[][] = [];
  private prev: InputFrame = neutralInput();
  /** Held inputs for multi-frame actions. */
  private holdStick: { x: number; y: number; frames: number } | null = null;
  private holdBtn: Partial<Record<Btn, number>> = {};
  private nextDecision = 0;
  private waitUntil = 0;
  private targetIdx = -1;
  private recoverDir: { x: number; y: number } | null = null;
  private ledgeDecideAt = -1;
  private knockdownAt = -1;
  private respawnAt = -1;
  private lastState = '';
  private lastPhase = '';
  private infos: Map<string, MoveInfo> | null = null;
  private rec: Recovery | null = null;

  constructor(idx: number, level: number, seed: number) {
    this.idx = idx;
    this.level = clamp(Math.round(level), 1, 9);
    this.sk = skillFor(this.level);
    this.rng = new Rng(seed ^ 0x5bd1e995);
  }

  update(m: Match): InputFrame {
    this.frame++;
    const me = m.fighters[this.idx];
    if (!this.infos) {
      this.infos = moveInfos(me.def);
      this.rec = measureRecovery(me.def);
    }
    this.record(m);
    // hesitate a moment at GO! instead of acting on the very first frame
    if (m.phase === 'play' && this.lastPhase !== 'play') this.waitUntil = this.frame + this.sk.reaction + this.rng.int(20);
    this.lastPhase = m.phase;
    const out = neutralInput();
    if (m.phase !== 'play' || !me.alive() || me.eliminated) return this.emit(out);
    if (me.state !== this.lastState) this.onStateChange(me);
    this.lastState = me.state;
    this.think(m, me, out);
    return this.emit(out);
  }

  // ------------------------------------------------------------------ plumbing

  private record(m: Match): void {
    const snaps = m.fighters.map((f) => ({
      x: f.x, y: f.y, vx: f.vx + f.kbx, vy: f.vy + f.kby, state: f.state,
      moveId: f.move && f.state === 'move' ? f.move.id : null, moveFrame: f.move ? f.move.frame : 0, facing: f.facing,
    }));
    this.hist.push(snaps);
    if (this.hist.length > 40) this.hist.shift();
  }

  /** What this CPU "sees" of fighter i: the state from `reaction` frames ago. */
  private seen(i: number): Snap {
    const k = Math.max(0, this.hist.length - 1 - this.sk.reaction);
    return this.hist[k][i];
  }

  private emit(out: InputFrame): InputFrame {
    if (this.holdStick) {
      out.x = this.holdStick.x;
      out.y = this.holdStick.y;
      if (--this.holdStick.frames <= 0) this.holdStick = null;
    }
    for (const b of ['jump', 'attack', 'special', 'shield', 'grab'] as Btn[]) {
      const n = this.holdBtn[b];
      if (n && n > 0) {
        out[b] = true;
        this.holdBtn[b] = n - 1;
      }
    }
    out.digital = false;
    this.prev = { ...out };
    return out;
  }

  /** Request a fresh button press (guarantees a release frame in between). */
  private press(out: InputFrame, b: Btn, hold = 1): boolean {
    if (this.prev[b] && !this.holdBtn[b]) return false;
    out[b] = true;
    if (hold > 1) this.holdBtn[b] = hold - 1;
    return true;
  }

  private onStateChange(me: Fighter): void {
    if (me.state === 'ledge') this.ledgeDecideAt = this.frame + this.sk.reaction + this.rng.int(12);
    if (me.state === 'knockdown') this.knockdownAt = this.frame + 8 + this.rng.int(this.sk.reaction + 10);
    if (me.state === 'respawn') this.respawnAt = this.frame + 30 + this.rng.int(60);
    if (this.lastState === 'respawn' && me.state !== 'respawn') this.waitUntil = this.frame + 10 + this.rng.int(this.sk.reaction);
    if (me.state !== 'move' && me.state !== 'helpless') this.recoverDir = null;
  }

  // ------------------------------------------------------------------ brain

  private think(m: Match, me: Fighter, out: InputFrame): void {
    const st = me.state;
    if (me.hitlag > 0 || me.pendingLaunch) {
      this.doDI(m, me, out);
      return;
    }
    switch (st) {
      case 'grabbed':
        if (this.rng.chance(this.sk.mash)) this.press(out, this.frame % 2 ? 'attack' : 'jump');
        out.x = this.frame % 4 < 2 ? 1 : -1;
        return;
      case 'thrown':
      case 'dead':
      case 'shieldbreak':
      case 'dizzy':
        return;
      case 'respawn':
        if (this.frame >= this.respawnAt) out.x = m.fighters.some((f) => f !== me && f.alive()) ? (this.rng.chance(0.5) ? 0.6 : -0.6) : 0;
        return;
      case 'ledge':
        this.onLedge(m, me, out);
        return;
      case 'knockdown':
        if (this.frame >= this.knockdownAt) {
          const r = this.rng.next();
          const toCenter = me.x < 0 ? 1 : -1;
          if (r < 0.4) this.press(out, 'jump');
          else if (r < 0.75) out.x = toCenter;
          else this.press(out, 'attack');
        }
        return;
      case 'grabhold':
        this.doThrow(m, me, out);
        return;
      case 'hitstun':
      case 'tumble':
        if (me.hitstun > 0) {
          this.maybeTech(m, me, out);
          this.holdTowardStage(m, me, out, true);
          return;
        }
        break;
      default:
        break;
    }
    // recovery takes priority whenever we are off the stage
    if (!me.grounded && this.offstage(m, me)) {
      this.recover(m, me, out);
      return;
    }
    if (st === 'move') {
      this.duringMove(m, me, out);
      return;
    }
    if (st === 'helpless') {
      this.holdTowardStage(m, me, out, false);
      return;
    }
    if (st === 'tumble') {
      this.maybeTech(m, me, out);
    }
    if (this.frame < this.waitUntil) return;
    if (this.frame < this.nextDecision) {
      this.keepMoving(m, me, out);
      return;
    }
    this.nextDecision = this.frame + this.sk.decide + this.rng.int(Math.max(2, this.sk.decide >> 1));
    if (me.grounded) this.groundBrain(m, me, out);
    else this.airBrain(m, me, out);
  }

  // ------------------------------------------------------------------ targeting

  private target(m: Match, me: Fighter): Fighter | null {
    let best: Fighter | null = null;
    let bs = Infinity;
    for (const f of m.fighters) {
      if (f === me || !f.alive() || f.state === 'respawn') continue;
      let s = Math.hypot(f.x - me.x, (f.y - me.y) * 1.3);
      if (this.level >= 7) s -= f.percent * 1.2;
      if (f.idx === this.targetIdx) s -= 80;
      if (s < bs) {
        bs = s;
        best = f;
      }
    }
    this.targetIdx = best ? best.idx : -1;
    return best;
  }

  private offstage(m: Match, f: Fighter): boolean {
    const M = m.stage.main;
    const margin = 6;
    if (f.x > M.x1 + margin && f.x < M.x2 - margin && f.y <= M.top) return false;
    return true;
  }

  private nearestLedge(m: Match, f: Fighter) {
    const L = m.stage.ledges;
    return Math.abs(f.x - L[0].x) < Math.abs(f.x - L[1].x) ? L[0] : L[1];
  }

  // ------------------------------------------------------------------ ground / air decisions

  private groundBrain(m: Match, me: Fighter, out: InputFrame): void {
    const T = this.target(m, me);
    if (!T) return;
    if (this.sk.idleChance > 0 && this.rng.chance(this.sk.idleChance * 0.25)) {
      this.waitUntil = this.frame + 10 + this.rng.int(40);
      return;
    }
    const seenT = this.seen(T.idx);
    // 1. evade an incoming attack we can see (no blocking stance any more — just dodge)
    if (this.threatened(m, me, T, seenT) && this.rng.chance(this.sk.shield + this.sk.dodge)) {
      const away = Math.sign(me.x - T.x) || (this.rng.chance(0.5) ? 1 : -1);
      out.x = away;
      this.press(out, 'shield');
      return;
    }
    // 2. edge-guard an opponent who is recovering
    if (this.offstage(m, T) && !T.grounded && T.state !== 'respawn' && this.rng.chance(this.sk.edgeguard)) {
      if (this.edgeguard(m, me, T, out)) return;
    }
    // 4. attack if something connects
    const punish = this.vulnerable(seenT) && this.rng.chance(this.sk.punish);
    if (this.rng.chance(this.sk.aggression) || punish) {
      const pick = this.pickGroundAttack(m, me, T);
      if (pick) {
        this.execute(me, T, pick, out);
        return;
      }
    }
    // 5. move toward the target
    this.approach(m, me, T, out);
  }

  private airBrain(m: Match, me: Fighter, out: InputFrame): void {
    const T = this.target(m, me);
    if (!T) {
      this.holdTowardStage(m, me, out, false);
      return;
    }
    const pick = this.rng.chance(this.sk.aggression) ? this.pickAerial(me, T) : null;
    if (pick) {
      out.attack = !this.prev.attack;
      const d = pick === 'nair' ? [0, 0] : pick === 'uair' ? [0, 1] : pick === 'dair' ? [0, -1] : pick === 'fair' ? [me.facing * 0.6, 0] : [-me.facing * 0.6, 0];
      out.x = d[0];
      out.y = d[1];
      return;
    }
    // drift toward the target, stay over the stage
    const M = m.stage.main;
    const tx = clamp(T.x, M.x1 + 40, M.x2 - 40);
    out.x = Math.abs(tx - me.x) > 20 ? Math.sign(tx - me.x) : 0;
    if (T.y < me.y - 140 && me.jumpsLeft > 0 && me.vy > -2 && Math.abs(T.x - me.x) < 200 && this.rng.chance(0.4)) this.press(out, 'jump');
  }

  private keepMoving(m: Match, me: Fighter, out: InputFrame): void {
    if (me.grounded && (me.state === 'run' || me.state === 'dash' || me.state === 'walk')) {
      const T = this.target(m, me);
      if (!T) return;
      const dx = T.x - me.x;
      if (Math.abs(dx) > 70) out.x = this.safeDir(m, me, Math.sign(dx));
    } else if (!me.grounded) {
      const T = this.target(m, me);
      if (T) {
        const M = m.stage.main;
        const tx = clamp(T.x, M.x1 + 40, M.x2 - 40);
        out.x = Math.abs(tx - me.x) > 20 ? Math.sign(tx - me.x) * 0.8 : 0;
      }
    }
  }

  /** Never walk off the main stage while grounded near an edge. */
  private safeDir(m: Match, me: Fighter, dir: number): number {
    if (!me.grounded || me.groundId >= 0) return dir;
    const M = m.stage.main;
    if (dir < 0 && me.x - M.x1 < 70) return 0;
    if (dir > 0 && M.x2 - me.x < 70) return 0;
    return dir;
  }

  private approach(m: Match, me: Fighter, T: Fighter, out: InputFrame): void {
    const dx = T.x - me.x;
    const dy = T.y - me.y;
    const adx = Math.abs(dx);
    const M = m.stage.main;
    // target above us on a platform: get under and jump
    if (dy < -110 && T.grounded) {
      if (adx < 110) {
        this.press(out, 'jump', 4);
        return;
      }
      out.x = this.safeDir(m, me, Math.sign(dx));
      return;
    }
    // we are on a platform and they are below: drop down
    if (me.groundId >= 0 && dy > 60) {
      if (adx < 160) {
        this.holdStick = { x: 0, y: -1, frames: 6 };
        return;
      }
      out.x = Math.sign(dx);
      return;
    }
    // ranged poke
    const proj = this.infos!.get('nspecial');
    if (proj?.projectile && adx > 260 && adx < proj.x2 && Math.abs(dy) < 60 && this.level >= 3 && this.rng.chance(0.25)) {
      this.faceToward(me, T, out);
      if (me.facing === Math.sign(dx)) this.press(out, 'special');
      return;
    }
    // stay on stage when they're off it
    const want = this.offstage(m, T) ? clamp(T.x, M.x1 + 90, M.x2 - 90) : T.x;
    const wdx = want - me.x;
    if (Math.abs(wdx) > 55) {
      const dir = this.safeDir(m, me, Math.sign(wdx));
      if (dir !== 0) {
        if (me.state === 'idle' || me.state === 'walk') this.flick(out, dir, 0);
        else out.x = dir;
      }
      // occasional jump-in
      if (adx > 140 && adx < 320 && this.level >= 4 && this.rng.chance(0.08) && Math.abs(dy) < 60) this.press(out, 'jump', 2);
    } else if (me.facing !== Math.sign(dx) && adx > 10) {
      out.x = Math.sign(dx) * 0.5;
    }
  }

  private flick(out: InputFrame, x: number, y: number): void {
    // a stick flick needs a neutral frame before it
    if (Math.abs(this.prev.x) > 0.3 && Math.sign(this.prev.x) === Math.sign(x) && x !== 0) {
      out.x = x;
      out.y = y;
      return;
    }
    out.x = x;
    out.y = y;
  }

  private faceToward(me: Fighter, T: Fighter, out: InputFrame): void {
    const d = Math.sign(T.x - me.x);
    if (d !== 0 && d !== me.facing) out.x = d * 0.5;
  }

  // ------------------------------------------------------------------ attack choice

  private rel(me: Fighter, T: Fighter, frames: number, facing: number = me.facing): [number, number] {
    const pred = this.level >= 5 ? 1 : 0.4;
    const tx = T.x + (T.vx + T.kbx) * frames * pred;
    const ty = T.y - T.H / 2 + (T.grounded ? 0 : (T.vy + T.kby) * frames * pred * 0.6);
    return [(tx - me.x) * facing, me.y - ty];
  }

  private fits(info: MoveInfo, lx: number, ly: number, T: Fighter, travel = 0): boolean {
    const px = T.W * 0.38;
    const py = T.H * 0.42;
    return lx + px >= info.x1 + travel && lx - px <= info.x2 + travel && ly + py >= info.y1 && ly - py <= info.y2;
  }

  private koWorthy(m: Match, T: Fighter, info: MoveInfo): boolean {
    const h = info.best;
    if (!h || h.fixed !== undefined) return false;
    const p = T.percent + h.dmg;
    const kb = knockback(p, h.dmg, T.def.weight, h.kbg, h.bkb);
    const dir = T.x >= 0 ? 1 : -1;
    const ang = (dir > 0 ? h.angle : 180 - h.angle) * DEG;
    return m.predictKO(T, ang, kb * LAUNCH_SCALE);
  }

  private pickGroundAttack(m: Match, me: Fighter, T: Fighter): MoveInfo | null {
    const infos = this.infos!;
    const running = me.state === 'run' || me.state === 'dash';
    const behind = Math.sign(T.x - me.x) !== me.facing;
    const facing = behind ? -me.facing : me.facing;
    const cands: MoveInfo[] = [];
    const ids = running ? ['dashAttack', 'dashGrab'] : ['jab1', 'ftilt', 'utilt', 'dtilt', 'fsmash', 'usmash', 'dsmash', 'grab', 'sspecial'];
    const M = m.stage.main;
    for (const id of ids) {
      const info = infos.get(id);
      if (!info) continue;
      if (info.grab && (T.grounded === false || !this.rng.chance(0.35))) continue;
      if (info.leavesStage || info.helpless) {
        const endX = me.x + facing * info.fullTravel;
        if (endX < M.x1 + 80 || endX > M.x2 - 80) continue;
      }
      const [lx, ly] = this.rel(me, T, info.startup, facing);
      if (this.fits(info, lx, ly, T, info.travel)) cands.push(info);
    }
    if (!cands.length) return null;
    if (!this.rng.chance(this.sk.accuracy)) return cands[this.rng.int(cands.length)];
    // prefer a KO move when the target is ripe, else the fastest
    if (this.level >= 5) {
      const ko = cands.filter((c) => this.koWorthy(m, T, c));
      if (ko.length) return ko.reduce((a, b) => (a.startup <= b.startup ? a : b));
    }
    const fast = [...cands].sort((a, b) => a.startup - b.startup);
    const pickFrom = fast.slice(0, Math.min(3, fast.length));
    return pickFrom[this.rng.int(pickFrom.length)];
  }

  private execute(me: Fighter, T: Fighter, info: MoveInfo, out: InputFrame): void {
    const dir = Math.sign(T.x - me.x) || me.facing;
    switch (info.id) {
      case 'jab1':
        if (dir !== me.facing) {
          out.x = dir * 0.5;
          return;
        }
        this.press(out, 'attack');
        return;
      case 'ftilt':
        out.x = dir * 0.6;
        this.press(out, 'attack');
        return;
      case 'utilt':
        out.y = 0.65;
        this.press(out, 'attack');
        return;
      case 'dtilt':
        if (dir !== me.facing) {
          out.x = dir * 0.5;
          return;
        }
        out.y = -0.6;
        this.press(out, 'attack');
        return;
      case 'fsmash':
        out.cx = dir;
        return;
      case 'usmash':
        out.cy = 1;
        return;
      case 'dsmash':
        out.cy = -1;
        return;
      case 'grab':
      case 'dashGrab':
        if (dir !== me.facing) {
          out.x = dir * 0.5;
          return;
        }
        this.press(out, 'grab');
        return;
      case 'dashAttack':
        out.x = dir;
        this.press(out, 'attack');
        return;
      case 'sspecial':
        out.x = dir;
        this.press(out, 'special');
        return;
      default:
        this.press(out, 'attack');
    }
  }

  private pickAerial(me: Fighter, T: Fighter): 'nair' | 'fair' | 'bair' | 'uair' | 'dair' | null {
    const infos = this.infos!;
    const opts: ('nair' | 'fair' | 'bair' | 'uair' | 'dair')[] = [];
    for (const id of ['nair', 'fair', 'bair', 'uair', 'dair'] as const) {
      const info = infos.get(id);
      if (!info) continue;
      const [lx, ly] = this.rel(me, T, info.startup);
      if (this.fits(info, lx, ly, T)) opts.push(id);
    }
    if (!opts.length) return null;
    return opts[this.rng.int(opts.length)];
  }

  private duringMove(m: Match, me: Fighter, out: InputFrame): void {
    const mv = me.move!;
    // jab chains
    if (mv.def.next && mv.frame >= mv.def.next.from && this.rng.chance(0.6)) {
      const T = this.target(m, me);
      if (T && Math.abs(T.x - me.x) < 110) this.press(out, mv.def.next.btn);
    }
    // aerial drift toward the stage when airborne and near an edge
    if (!me.grounded) {
      const M = m.stage.main;
      if (me.x < M.x1 + 60) out.x = 1;
      else if (me.x > M.x2 - 60) out.x = -1;
    }
    // Zip's launch direction
    if (mv.id === 'uspecial' && me.def.id === 'zip' && this.recoverDir) {
      out.x = this.recoverDir.x;
      out.y = this.recoverDir.y;
    }
  }

  private threatened(m: Match, me: Fighter, T: Fighter, s: Snap): boolean {
    if (s.state !== 'move' || !s.moveId) return false;
    const info = moveInfos(T.def).get(s.moveId);
    if (!info || info.projectile) return false;
    if (s.moveFrame > info.activeEnd) return false;
    const lx = (me.x - s.x) * s.facing;
    const ly = s.y - (me.y - me.H / 2);
    const pad = 30;
    void m;
    return lx >= info.x1 - pad && lx <= info.x2 + pad && ly >= info.y1 - pad - me.H / 2 && ly <= info.y2 + pad + me.H / 2;
  }

  private vulnerable(s: Snap): boolean {
    if (s.state === 'land' || s.state === 'dizzy' || s.state === 'knockdown') return true;
    if (s.state === 'move' && s.moveId) return false;
    return false;
  }

  // ------------------------------------------------------------------ edge-guarding

  private edgeguard(m: Match, me: Fighter, T: Fighter, out: InputFrame): boolean {
    const L = this.nearestLedge(m, T);
    const standX = L.x - L.dir * 70;
    const dx = standX - me.x;
    if (Math.abs(dx) > 30) {
      out.x = Math.sign(dx);
      return true;
    }
    // face the ledge
    if (me.facing !== L.dir) {
      out.x = L.dir * 0.5;
      return true;
    }
    const infos = this.infos!;
    for (const id of ['dsmash', 'fsmash', 'dtilt', 'ftilt']) {
      const info = infos.get(id);
      if (!info) continue;
      const [lx, ly] = this.rel(me, T, info.startup);
      if (this.fits(info, lx, ly, T)) {
        this.execute(me, T, info, out);
        return true;
      }
    }
    // high levels jump out for an aerial when it is safe
    if (this.level >= 8 && me.jumpsLeft > 0 && T.y < L.y + 20 && Math.abs(T.x - L.x) < 170 && this.rng.chance(0.25)) {
      this.press(out, 'jump', 3);
      out.x = L.dir * 0.8;
      return true;
    }
    return true;
  }

  // ------------------------------------------------------------------ recovery

  private holdTowardStage(m: Match, me: Fighter, out: InputFrame, inHitstun: boolean): void {
    if (inHitstun) return;
    const M = m.stage.main;
    if (me.x < M.x1 + 20) out.x = 1;
    else if (me.x > M.x2 - 20) out.x = -1;
  }

  private recover(m: Match, me: Fighter, out: InputFrame): void {
    if (me.state === 'move' && me.move?.id === 'uspecial' && me.def.id === 'zip' && this.recoverDir) {
      out.x = this.recoverDir.x;
      out.y = this.recoverDir.y;
      return;
    }
    const M = m.stage.main;
    const rec = this.rec!;
    const L = this.nearestLedge(m, me);
    const side = L.dir;
    const toward = -side;
    const W2 = me.W / 2;
    const horiz = (me.x - L.x) * side;
    const below = me.y - L.y;
    const under = me.x > M.x1 - W2 * 0.6 && me.x < M.x2 + W2 * 0.6 && me.y - me.H > M.top - 4;
    const vyT = me.vy + me.kby;
    if (under) {
      out.x = side;
    } else if (horiz > W2 + 8 || below < 0) {
      out.x = toward;
    } else {
      out.x = toward * 0.25;
    }
    const canAct = me.state === 'air' || (me.state === 'tumble' && me.hitstun === 0);
    if (!canAct) return;
    // Above ledge height and close enough to drift onto the stage: just drift.
    if (below < -12 && !under) {
      const g = me.def.gravity;
      const fall = -below;
      const t = (-vyT + Math.sqrt(Math.max(0, vyT * vyT + 2 * g * fall))) / g;
      const reach = t * me.def.airSpeed * 0.85 + (me.jumpsLeft > 0 ? 60 : 0);
      if (reach > horiz + W2 + 10) {
        if (me.jumpsLeft > 0 && horiz > reach * 0.7 && vyT > 2) this.press(out, 'jump');
        return;
      }
    }
    const lateUB = this.level <= 2 ? 0.8 : 0.95;
    // up special when it will reach, or as a last resort
    const reachY = rec.ubRise * lateUB;
    const reachX = me.def.id === 'zip' ? rec.ubDiag * 0.85 : rec.ubDrift + 40;
    const dist = Math.hypot(horiz, below);
    const needUB = me.jumpsLeft === 0 || below > rec.djRise * 0.9 || horiz > 260;
    if (needUB && !under && vyT > -2) {
      const inReach = me.def.id === 'zip' ? dist < reachX && below > -120 : below < reachY && horiz < reachX && below > -30;
      const desperate = below > rec.ubRise * 0.62 || (me.jumpsLeft === 0 && below > 40);
      if (desperate && !inReach && me.jumpsLeft > 0) {
        this.press(out, 'jump');
        return;
      }
      if (inReach || desperate) {
        if (me.def.id === 'zip') {
          // aim just above the ledge on the stage side; never aim downward
          const tx = L.x - side * 30;
          const ty = L.y - 50;
          let ang = Math.atan2(me.y - ty, tx - me.x);
          if (Math.sin(ang) < 0) ang = Math.cos(ang) >= 0 ? 0 : Math.PI;
          const snap = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
          this.recoverDir = { x: Math.cos(snap), y: Math.sin(snap) };
        }
        out.y = 1;
        out.x = 0;
        this.press(out, 'special');
        return;
      }
    }
    // midair jump when falling near/below ledge height or far out
    if (me.jumpsLeft > 0 && vyT > -1 && (below > -60 || horiz > 380)) {
      this.press(out, 'jump');
      return;
    }
    // horizontal special to cover distance (not for moves that leave us helpless unless close)
    const sideInfo = this.infos!.get('sspecial');
    if (horiz > 330 && below < 40 && sideInfo && !sideInfo.helpless && sideInfo.fullTravel > 120 && !me.sideBUsed && me.def.id !== 'grott') {
      out.x = toward;
      this.press(out, 'special');
    }
  }

  private onLedge(m: Match, me: Fighter, out: InputFrame): void {
    if (this.frame < this.ledgeDecideAt || me.ledgeFrames < 8) return;
    const L = me.ledgeRef;
    if (!L) return;
    const toward = -L.dir;
    const T = this.target(m, me);
    const near = T && Math.abs(T.x - L.x) < 160 && T.grounded;
    const r = this.rng.next();
    if (near && this.level >= 5) {
      if (r < 0.4) this.press(out, 'shield');
      else if (r < 0.7) this.press(out, 'jump');
      else this.press(out, 'attack');
    } else if (r < 0.7) {
      out.x = toward;
    } else if (r < 0.85) {
      this.press(out, 'jump');
    } else {
      this.press(out, 'shield');
    }
    this.ledgeDecideAt = this.frame + 6;
  }

  // ------------------------------------------------------------------ being hit

  private doDI(m: Match, me: Fighter, out: InputFrame): void {
    const pl = me.pendingLaunch;
    if (!pl || !this.rng.chance(this.sk.di)) return;
    let bestScore = -Infinity;
    let best: [number, number] = [0, 0];
    for (let i = 0; i < 9; i++) {
      const sx = i === 8 ? 0 : Math.cos((i * Math.PI) / 4);
      const sy = i === 8 ? 0 : Math.sin((i * Math.PI) / 4);
      const ang = i === 8 ? pl.angle : applyDI(pl.angle, sx, sy);
      const score = m.launchMargin(me, ang, pl.speed);
      if (score > bestScore + 0.5) {
        bestScore = score;
        best = [sx, sy];
      }
    }
    out.x = best[0];
    out.y = best[1];
  }

  private maybeTech(m: Match, me: Fighter, out: InputFrame): void {
    if (me.grounded || this.sk.tech <= 0) return;
    const vyT = me.vy + me.kby;
    if (vyT <= 0) return;
    let ground = m.stage.main.top;
    if (me.x < m.stage.main.x1 || me.x > m.stage.main.x2) ground = Infinity;
    for (const p of m.stage.plats) if (me.x >= p.x1 && me.x <= p.x2 && p.y >= me.y - 2 && p.y < ground) ground = p.y;
    const framesToLand = (ground - me.y) / Math.max(1, vyT);
    if (framesToLand > 0 && framesToLand < 5 && this.rng.chance(this.sk.tech)) {
      this.press(out, 'shield');
    }
  }

  private doThrow(m: Match, me: Fighter, out: InputFrame): void {
    if (me.sf < 3 + this.rng.int(6)) {
      if (this.rng.chance(0.25)) this.press(out, 'attack');
      return;
    }
    const M = m.stage.main;
    const nearLeft = me.x - M.x1 < M.x2 - me.x;
    const edgeDir = nearLeft ? -1 : 1;
    const r = this.rng.next();
    if (this.level <= 3) {
      out.x = r < 0.5 ? me.facing : -me.facing;
      return;
    }
    if (r < 0.2) out.y = 1;
    else if (r < 0.3) out.y = -1;
    else out.x = edgeDir;
  }
}
