import {
  COUNTDOWN_FRAMES, GRAB_BASE, GRAB_PER_PERCENT, KB_DECAY, LAUNCH_SCALE, MAX_PERCENT, RESPAWN_DELAY, SHIELD_DMG_MULT,
  SHIELD_MAX, SUDDEN_DEATH_PERCENT, TUMBLE_KB,
} from './constants';
import type { FighterDef, HitboxDef, HitData, ProjectileSpawn, StageDef } from './defs';
import type { SimEvent } from './events';
import { Fighter, type HitboxInst, type MoveInst } from './fighter';
import { NEUTRAL, type InputFrame } from './input';
import {
  BOMB_FUSE, BOMB_HIT, BOMB_RADIUS, FRUIT_HEAL, ITEM_RADIUS, MAX_ITEMS, SPAWN_INTERVAL, THROWN_HIT,
  type Explosion, type Item, type ItemKind,
} from './items';
import { hitlagFrames, knockback } from './knockback';
import { DEG, clamp, lerp, pointSegDist2, segSegDist2 } from './math';
import { fighterPhysics } from './physics';
import { posePoint } from './pose';
import type { Projectile } from './projectiles';
import { Rng } from './rng';
import { StageRT } from './stage';

export interface PlayerSetup {
  fighter: FighterDef;
  /** 0 = human, 1..9 = CPU level. */
  cpu: number;
  palette?: number;
  /** Character-select slot (player colour). */
  slot?: number;
}

export interface Rules {
  stocks: number;
  /** Minutes; 0 = no limit. */
  time: number;
  /** 0 off, 1 low, 2 medium, 3 high. */
  items: number;
}

export type Phase = 'countdown' | 'play' | 'ended';

export interface MatchOptions {
  stage: StageDef;
  players: PlayerSetup[];
  rules: Rules;
  seed: number;
  /** Skip the 3-2-1 countdown (tests). */
  skipCountdown?: boolean;
}

export class Match {
  frame = 0;
  phase: Phase = 'countdown';
  countdown = COUNTDOWN_FRAMES;
  fighters: Fighter[];
  slots: number[];
  stage: StageRT;
  rules: Rules;
  rng: Rng;
  items: Item[] = [];
  projectiles: Projectile[] = [];
  explosions: Explosion[] = [];
  events: SimEvent[] = [];
  /** Frames left; -1 = no limit. */
  timeLeft: number;
  eliminated: number[] = [];
  placements: number[] = [];
  winner = -1;
  suddenDeath = false;
  sdFrames = 0;
  nextItemAt = 0;
  nextId = 1;
  endFrame = -1;

  constructor(o: MatchOptions) {
    this.stage = new StageRT(o.stage);
    this.rules = { ...o.rules };
    this.rng = new Rng(o.seed);
    this.slots = o.players.map((p, i) => p.slot ?? i);
    this.fighters = o.players.map((p, i) => new Fighter(i, p.fighter, p.palette ?? 0, p.cpu));
    for (const f of this.fighters) f.stocks = Math.max(1, o.rules.stocks);
    this.timeLeft = o.rules.time > 0 ? o.rules.time * 3600 : -1;
    this.placeAtSpawns();
    this.scheduleItem();
    if (o.skipCountdown) {
      this.phase = 'play';
      this.countdown = 0;
    }
  }

  placeAtSpawns(): void {
    const sp = this.stage.def.spawns;
    this.fighters.forEach((f, i) => {
      if (f.eliminated) return;
      const [x, y] = sp[i % sp.length];
      f.x = x;
      f.y = y;
      f.vx = f.vy = f.kbx = f.kby = 0;
      f.grounded = true;
      f.groundId = this.surfaceAt(x, y);
      f.facing = x <= 0 ? 1 : -1;
      f.enter('idle');
    });
  }

  surfaceAt(x: number, y: number): number {
    for (const p of this.stage.plats) if (Math.abs(p.y - y) < 1 && x >= p.x1 && x <= p.x2) return p.id;
    return -1;
  }

  emit(e: SimEvent): void {
    this.events.push(e);
  }

  drainEvents(): SimEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  // ------------------------------------------------------------------ main step

  step(inputs: readonly InputFrame[]): void {
    if (this.phase === 'countdown') {
      if (this.countdown === COUNTDOWN_FRAMES) this.emit({ t: 'countdown', n: 3 });
      this.countdown--;
      if (this.countdown === 120) this.emit({ t: 'countdown', n: 2 });
      if (this.countdown === 60) this.emit({ t: 'countdown', n: 1 });
      if (this.countdown <= 0) {
        this.phase = 'play';
        this.emit({ t: 'go' });
        for (const f of this.fighters) f.input.clearBuffer();
      }
    }
    const live = this.phase === 'play';
    for (let i = 0; i < this.fighters.length; i++) {
      this.fighters[i].input.update(live ? inputs[i] ?? NEUTRAL : NEUTRAL);
    }
    this.stage.update(this.frame);
    for (const f of this.fighters) f.step(this);
    this.bodyPush();
    this.updateItems();
    this.updateProjectiles();
    for (const f of this.fighters) if (f.alive()) f.computeBoxes();
    this.positionHeld();
    this.resolveCombat();
    this.checkBlastZones();
    if (this.phase === 'play') this.updateRules();
    this.frame++;
  }

  physics(f: Fighter): void {
    fighterPhysics(f, this);
  }

  bodyPush(): void {
    const F = this.fighters;
    for (let i = 0; i < F.length; i++) {
      const a = F[i];
      if (!a.grounded || !a.alive() || a.grabbing || a.grabbedBy) continue;
      for (let j = i + 1; j < F.length; j++) {
        const b = F[j];
        if (!b.grounded || !b.alive() || b.grabbing || b.grabbedBy || b.groundId !== a.groundId) continue;
        const dx = b.x - a.x;
        const min = (a.W + b.W) * 0.32;
        if (Math.abs(dx) >= min) continue;
        const dir = dx === 0 ? (a.idx < b.idx ? 1 : -1) : Math.sign(dx);
        const [x1, x2] = this.stage.surfaceRange(a.groundId);
        a.x = clamp(a.x - dir * 1.4, x1, x2);
        b.x = clamp(b.x + dir * 1.4, x1, x2);
      }
    }
  }

  // ------------------------------------------------------------------ rules / KOs

  updateRules(): void {
    if (this.timeLeft > 0) {
      this.timeLeft--;
      if (this.timeLeft === 0) {
        this.timeout();
        return;
      }
    }
    if (this.suddenDeath) {
      this.sdFrames++;
      if (this.sdFrames > 3600) {
        const B = this.stage.blast;
        const M = this.stage.main;
        B.left = Math.min(M.x1 - 60, B.left + 2.5);
        B.right = Math.max(M.x2 + 60, B.right - 2.5);
        B.top = Math.min(M.top - 250, B.top + 2.5);
      }
    }
    if (this.rules.items > 0 && this.frame >= this.nextItemAt) {
      if (this.items.filter((i) => i.state !== 'dead').length < MAX_ITEMS) this.spawnItem();
      this.scheduleItem();
    }
  }

  scheduleItem(): void {
    const iv = SPAWN_INTERVAL[clamp(this.rules.items, 0, 3)];
    this.nextItemAt = this.frame + (iv[1] > 0 ? Math.floor(this.rng.range(iv[0], iv[1])) : 1e9);
  }

  checkBlastZones(): void {
    const B = this.stage.blast;
    for (const f of this.fighters) {
      if (!f.alive() || f.state === 'respawn') continue;
      const cy = f.y - f.H / 2;
      const star = f.state === 'tumble' || f.state === 'hitstun';
      if (f.x < B.left || f.x > B.right || cy > B.bottom || (cy < B.top && star)) this.ko(f);
    }
  }

  ko(f: Fighter): void {
    const B = this.stage.blast;
    const x = clamp(f.x, B.left, B.right);
    const y = clamp(f.y - f.H / 2, B.top, B.bottom);
    const ang = Math.atan2(-200 - y, 0 - x);
    f.stocks--;
    f.stats.falls++;
    const credit = f.lastHitBy >= 0 && f.lastHitBy !== f.idx ? f.lastHitBy : -1;
    if (credit >= 0) this.fighters[credit].stats.kos++;
    else f.stats.sds++;
    this.emit({ t: 'ko', x, y, victim: f.idx, angle: ang, credit });
    if (f.grabbing) this.releaseGrab(f);
    if (f.grabbedBy) this.releaseGrab(f.grabbedBy);
    if (f.state === 'ledge') f.leaveLedge();
    if (f.item) {
      f.item.state = 'dead';
      f.item.holder = null;
      f.item = null;
    }
    f.enter('dead');
    f.hitlag = 0;
    f.hitstun = 0;
    f.pendingLaunch = null;
    f.vx = f.vy = f.kbx = f.kby = 0;
    f.respawnTimer = RESPAWN_DELAY;
    f.lastHitBy = -1;
    if (f.stocks <= 0) {
      f.eliminated = true;
      this.eliminated.push(f.idx);
    }
    this.checkGameEnd();
  }

  respawn(f: Fighter): void {
    const [x, y] = this.stage.def.respawn;
    f.x = x;
    f.y = y;
    f.vx = f.vy = f.kbx = f.kby = 0;
    f.grounded = false;
    f.groundId = -1;
    f.percent = this.suddenDeath ? SUDDEN_DEATH_PERCENT : 0;
    f.shieldHP = SHIELD_MAX;
    f.jumpsLeft = f.def.jumps;
    f.airdodgeUsed = false;
    f.sideBUsed = false;
    f.fastFalling = false;
    f.tumble = false;
    f.facing = 1;
    f.input.clearBuffer();
    f.enter('respawn');
    this.emit({ t: 'respawn', who: f.idx });
  }

  checkGameEnd(): void {
    if (this.phase === 'ended') return;
    const alive = this.fighters.filter((f) => !f.eliminated);
    if (alive.length > 1) return;
    if (alive.length === 1) {
      this.finish(alive[0].idx);
      return;
    }
    // Everyone left went out on the same frame: sudden death between them.
    const tied = this.eliminated.filter((i) => this.fighters[i].stats.falls > 0).slice(-2);
    for (const i of tied) this.eliminated.splice(this.eliminated.indexOf(i), 1);
    this.startSuddenDeath(tied.map((i) => this.fighters[i]));
  }

  finish(winner: number): void {
    this.phase = 'ended';
    this.winner = winner;
    this.endFrame = this.frame;
    const rest = [...this.eliminated].reverse().filter((i) => i !== winner);
    this.placements = [winner, ...rest];
    for (const f of this.fighters) if (!this.placements.includes(f.idx)) this.placements.push(f.idx);
    this.emit({ t: 'game' });
  }

  timeout(): void {
    this.emit({ t: 'time' });
    const alive = this.fighters.filter((f) => !f.eliminated);
    alive.sort((a, b) => b.stocks - a.stocks || a.percent - b.percent);
    const best = alive[0].stocks;
    const top = alive.filter((f) => f.stocks === best);
    if (top.length === 1) {
      const order = [...alive.map((f) => f.idx), ...[...this.eliminated].reverse()];
      this.phase = 'ended';
      this.winner = order[0];
      this.endFrame = this.frame;
      this.placements = order;
      this.emit({ t: 'game' });
      return;
    }
    const out = alive.filter((f) => f.stocks !== best);
    for (const f of out.reverse()) {
      f.eliminated = true;
      this.eliminated.push(f.idx);
    }
    this.startSuddenDeath(top);
  }

  startSuddenDeath(tied: Fighter[]): void {
    this.suddenDeath = true;
    this.sdFrames = 0;
    this.timeLeft = -1;
    for (const f of this.fighters) {
      if (!tied.includes(f)) {
        if (!f.eliminated) {
          f.eliminated = true;
          this.eliminated.push(f.idx);
        }
        f.enter('dead');
        continue;
      }
      f.eliminated = false;
      f.stocks = 1;
      f.percent = SUDDEN_DEATH_PERCENT;
      f.hitlag = 0;
      f.hitstun = 0;
      f.pendingLaunch = null;
      f.intangible = 0;
      if (f.item) {
        f.item.state = 'dead';
        f.item = null;
      }
      f.grabbing = null;
      f.grabbedBy = null;
      if (f.state === 'ledge') f.leaveLedge();
    }
    this.items = [];
    this.projectiles = [];
    this.explosions = [];
    this.stage.blast = { ...this.stage.def.blast };
    this.placeAtSpawns();
    for (const f of this.fighters) if (!tied.includes(f)) f.enter('dead');
    this.phase = 'countdown';
    this.countdown = COUNTDOWN_FRAMES;
    this.emit({ t: 'suddendeath' });
  }

  // ------------------------------------------------------------------ combat

  resolveCombat(): void {
    const F = this.fighters;
    const pend: { a: Fighter; v: Fighter; hb: HitboxInst; kind: 'hit' | 'shield' | 'counter' }[] = [];
    for (const a of F) {
      if (!a.alive() || a.hitlag > 0 || a.hits.length === 0 || !a.move) continue;
      const mv = a.move;
      for (const v of F) {
        if (v === a || !v.canBeHit() || a.grabbing === v) continue;
        for (const hb of a.hits) {
          const got = mv.hitGroups.get(hb.def.g);
          if (got && got.includes(v.idx)) continue;
          if (v.counterActive() && capHitsHurt(hb.px, hb.py, hb.x, hb.y, hb.r, v)) {
            pend.push({ a, v, hb, kind: 'counter' });
            break;
          }
          if (v.shielding() && capCircle(hb.px, hb.py, hb.x, hb.y, hb.r, v.shieldX, v.shieldY, v.shieldR)) {
            pend.push({ a, v, hb, kind: 'shield' });
            break;
          }
          if (capHitsHurt(hb.px, hb.py, hb.x, hb.y, hb.r, v)) {
            pend.push({ a, v, hb, kind: 'hit' });
            break;
          }
        }
      }
    }
    const grabs: { a: Fighter; v: Fighter }[] = [];
    for (const a of F) {
      const mv = a.move;
      if (!mv || a.state !== 'move' || !mv.def.grab || a.hitlag > 0 || a.grabbing) continue;
      const g = mv.def.grab;
      if (mv.frame < g.from || mv.frame > g.to) continue;
      const lp = g.pos ? { x: g.pos[0], y: g.pos[1] } : posePoint(a.pose, g.at ?? 'handF');
      const gx = a.x + lp.x * a.facing;
      const gy = a.y - lp.y;
      for (const v of F) {
        if (v === a || !v.canBeHit() || v.state === 'ledge' || v.grabbedBy || v.grabbing) continue;
        if (capHitsHurt(gx, gy, gx, gy, g.r, v)) {
          grabs.push({ a, v });
          break;
        }
      }
    }
    for (const p of pend) {
      const mv = p.a.move!;
      const g = p.hb.def.g;
      const list = mv.hitGroups.get(g);
      if (list) list.push(p.v.idx);
      else mv.hitGroups.set(g, [p.v.idx]);
    }
    for (const p of pend) {
      const mv = p.a.move;
      if (!mv) continue;
      const eff = effectiveHit(p.hb.def, mv);
      if (p.kind === 'counter') {
        if (p.v.counterActive()) this.applyCounter(p.a, p.v, eff.dmg, p.a.x);
      } else if (p.kind === 'shield') {
        this.applyShield(p.a, p.v, eff, false, p.a.x);
      } else {
        const rad = !!p.hb.def.radial;
        this.applyHit(p.a, p.v, eff, rad ? p.hb.x : p.a.cx, rad ? p.hb.y : p.a.cy, p.a.facing, p.a.idx, false, (p.hb.x + p.v.cx) / 2, (p.hb.y + p.v.cy) / 2);
      }
    }
    for (const g of grabs) {
      if (g.a.wasHit || g.v.wasHit || g.a.state !== 'move' || !g.v.canBeHit() || g.v.grabbedBy) continue;
      this.catchGrab(g.a, g.v, g.a.move?.def.grab?.command);
    }
    this.resolveProjectiles();
    this.resolveExplosions();
    this.resolveThrownItems();
  }

  applyHit(
    a: Fighter | null, v: Fighter, h: HitData, sx: number, sy: number, facing: number, owner: number,
    projectile: boolean, fxX = v.cx, fxY = v.cy,
  ): void {
    const d = h.dmg;
    v.wasHit = true;
    const hl = hitlagFrames(d, h.hitlag ?? 1);
    const armor = v.armorThreshold();
    if (armor > 0 && d < armor) {
      v.percent = Math.min(MAX_PERCENT, v.percent + d);
      this.credit(owner, v, d);
      v.hitlag = Math.max(v.hitlag, hl);
      if (a && !projectile) a.hitlag = Math.max(a.hitlag, hl);
      v.hurtFlash = 8;
      this.emit({ t: 'hit', x: fxX, y: fxY, dmg: d, kb: 0, attacker: owner, victim: v.idx, sfx: 'blunt', blocked: true });
      return;
    }
    v.percent = Math.min(MAX_PERCENT, v.percent + d);
    this.credit(owner, v, d);
    let kb = h.fixed !== undefined ? h.fixed : knockback(v.percent, d, v.def.weight, h.kbg, h.bkb);
    let ang: number;
    if (h.radial) {
      ang = Math.atan2(sy - v.cy, v.cx - sx) / DEG;
    } else {
      const dir = h.away ? (v.x >= sx ? 1 : -1) : facing;
      ang = dir > 0 ? h.angle : 180 - h.angle;
    }
    ang = ((ang % 360) + 360) % 360;
    if (v.grounded && Math.sin(ang * DEG) < -0.2 && kb > 25) {
      ang = 360 - ang;
      kb *= 0.8;
    }
    if (a && !projectile) a.hitlag = Math.max(a.hitlag, hl);
    v.hurtFlash = 12;
    if (owner >= 0 && owner !== v.idx) v.lastHitBy = owner;
    if (kb <= 0.01) {
      v.hitlag = Math.max(v.hitlag, Math.min(hl, 2));
    } else {
      v.enterHitstun(kb, ang * DEG, hl, this);
      this.checkFinalHit(v);
    }
    this.emit({ t: 'hit', x: fxX, y: fxY, dmg: d, kb, attacker: owner, victim: v.idx, sfx: h.sfx ?? 'punch', blocked: false });
  }

  credit(owner: number, v: Fighter, d: number): void {
    if (owner >= 0 && owner !== v.idx) this.fighters[owner].stats.dealt += d;
    v.stats.taken += d;
  }

  applyShield(a: Fighter | null, v: Fighter, h: HitData, projectile: boolean, sx: number): void {
    v.shieldHP -= h.dmg * SHIELD_DMG_MULT + (h.shieldDmg ?? 0);
    const hl = Math.floor(hitlagFrames(h.dmg, h.hitlag ?? 1) * 0.67);
    v.hitlag = Math.max(v.hitlag, hl);
    if (a && !projectile) a.hitlag = Math.max(a.hitlag, hl);
    v.wasHit = true;
    this.emit({ t: 'hit', x: v.shieldX, y: v.shieldY, dmg: h.dmg, kb: 0, attacker: a ? a.idx : -1, victim: v.idx, sfx: h.sfx ?? 'punch', blocked: true });
    if (v.shieldHP <= 0) {
      this.shieldBreak(v);
      return;
    }
    v.enter('shieldstun');
    v.shieldStun = Math.floor(h.dmg * 0.6 + 3);
    const dir = v.x >= sx ? 1 : -1;
    v.vx = dir * Math.min(1.5 + h.dmg * 0.45, 10);
    if (a && !projectile && a.grounded && Math.abs(a.x - v.x) < (a.W + v.W) * 0.75) {
      a.vx = -dir * Math.min(1 + h.dmg * 0.25, 6);
    }
  }

  applyCounter(a: Fighter | null, v: Fighter, dmg: number, srcX: number): void {
    const c = v.move?.def.counter;
    if (!c) return;
    v.move!.vars.countered = 1;
    v.facing = srcX >= v.x ? 1 : -1;
    v.startMove(c.next, this);
    v.move!.vars.counterDmg = Math.max(c.min, dmg * c.mult);
    v.intangible = Math.max(v.intangible, 24);
    v.wasHit = true;
    if (a) a.hitlag = Math.max(a.hitlag, 16);
    this.emit({ t: 'counter', x: v.cx, y: v.cy, who: v.idx });
  }

  shieldBreak(f: Fighter): void {
    f.shieldHP = 0;
    f.move = null;
    f.enter('shieldbreak');
    f.grounded = false;
    f.groundId = -1;
    f.vy = -13;
    f.vx = 0;
    f.kbx = 0;
    f.kby = 0;
    f.shieldStun = 0;
    this.emit({ t: 'shieldbreak', x: f.cx, y: f.cy, who: f.idx });
  }

  checkFinalHit(v: Fighter): void {
    if (this.phase !== 'play' || v.stocks > 1) return;
    const others = this.fighters.filter((f) => f !== v && !f.eliminated).length;
    if (others !== 1) return;
    if (v.pendingLaunch && this.predictKO(v, v.pendingLaunch.angle, v.pendingLaunch.speed)) {
      this.emit({ t: 'finalhit', x: v.cx, y: v.cy, victim: v.idx });
    }
  }

  /** Ballistic prediction (no DI, no drift): would this launch cross a blast zone? */
  predictKO(v: Fighter, angle: number, speed: number): boolean {
    const B = this.stage.blast;
    const M = this.stage.main;
    let x = v.x;
    let y = v.y - v.H / 2;
    let kx = Math.cos(angle) * speed;
    let ky = -Math.sin(angle) * speed;
    let vy = 0;
    const tumble = speed / LAUNCH_SCALE > TUMBLE_KB;
    for (let t = 0; t < 360; t++) {
      vy = Math.min(v.def.fallSpeed, vy + v.def.gravity);
      const mag = Math.hypot(kx, ky);
      const nm = Math.max(0, mag - KB_DECAY);
      if (mag > 0) {
        kx *= nm / mag;
        ky *= nm / mag;
      }
      const py = y;
      x += kx;
      y += ky + vy;
      if (x < B.left || x > B.right || y > B.bottom || (y < B.top && tumble)) return true;
      const feet = y + v.H / 2;
      const pfeet = py + v.H / 2;
      if (pfeet <= M.top && feet >= M.top && x >= M.x1 && x <= M.x2) return false;
      if (nm === 0 && y > M.top + 400) return true;
    }
    return false;
  }

  // ------------------------------------------------------------------ grabs

  catchGrab(a: Fighter, v: Fighter, command?: string): void {
    a.grabbing = v;
    v.grabbedBy = a;
    if (v.state === 'ledge') v.leaveLedge();
    v.move = null;
    v.hitstun = 0;
    v.pendingLaunch = null;
    v.kbx = v.kby = v.vx = v.vy = 0;
    if (v.item) this.dropItem(v);
    v.facing = a.facing === 1 ? -1 : 1;
    v.grabEscape = GRAB_BASE + v.percent * GRAB_PER_PERCENT;
    if (command) {
      v.enter('thrown');
      a.startMove(command, this);
    } else {
      v.enter('grabbed');
      a.move = null;
      a.enter('grabhold');
      a.vx = 0;
    }
    this.emit({ t: 'grab', x: v.cx, y: v.cy, who: a.idx });
  }

  positionHeld(): void {
    for (const a of this.fighters) {
      const v = a.grabbing;
      if (!v) continue;
      if (v.grabbedBy !== a || (v.state !== 'grabbed' && v.state !== 'thrown')) {
        a.grabbing = null;
        if (v.grabbedBy === a) v.grabbedBy = null;
        continue;
      }
      const hx = a.x + a.pose.hdF.x * a.facing;
      const hy = a.y - a.pose.hdF.y;
      if (v.state === 'grabbed') {
        v.x = hx + a.facing * v.W * 0.3;
        v.y = a.grounded ? a.y : hy + v.H * 0.5;
        v.grounded = a.grounded;
        v.groundId = a.groundId;
      } else {
        v.x = hx;
        v.y = hy + v.H * 0.45;
        v.grounded = false;
        v.groundId = -1;
      }
    }
  }

  releaseGrab(a: Fighter): void {
    const v = a.grabbing;
    a.grabbing = null;
    if (v) {
      v.grabbedBy = null;
      if (v.state === 'grabbed' || v.state === 'thrown') {
        v.enter(v.grounded ? 'grabrelease' : 'air');
        v.vx = a.facing * 5;
      }
    }
    if (a.state === 'grabhold' || (a.state === 'move' && a.move?.def.throwDef)) {
      a.enter(a.grounded ? 'grabrelease' : 'air');
      a.vx = -a.facing * 4;
    }
  }

  releaseThrow(a: Fighter, hit: HitData): void {
    const v = a.grabbing;
    if (!v) return;
    a.grabbing = null;
    v.grabbedBy = null;
    v.grounded = false;
    v.groundId = -1;
    if (a.grounded) v.y = Math.min(v.y, a.y - 1);
    v.enter('air');
    this.applyHit(a, v, hit, a.cx, a.cy, a.facing, a.idx, false);
  }

  pummel(a: Fighter, dmg: number): void {
    const v = a.grabbing;
    if (!v) return;
    v.percent = Math.min(MAX_PERCENT, v.percent + dmg);
    this.credit(a.idx, v, dmg);
    v.hitlag = 3;
    a.hitlag = 3;
    v.hurtFlash = 8;
    this.emit({ t: 'hit', x: v.cx, y: v.cy, dmg, kb: 0, attacker: a.idx, victim: v.idx, sfx: 'punch', blocked: false });
  }

  // ------------------------------------------------------------------ projectiles

  spawnProjectile(f: Fighter, s: ProjectileSpawn): void {
    const lp = s.pos ? { x: s.pos[0], y: s.pos[1] } : posePoint(f.pose, s.at ?? 'handF');
    const x = f.x + lp.x * f.facing;
    const y = f.y - lp.y;
    this.projectiles.push({
      id: this.nextId++, kind: s.kind, owner: f.idx, x, y, px: x, py: y,
      vx: s.vx * f.facing, vy: s.vy, gravity: s.gravity ?? 0, maxFall: s.maxFall ?? 12, bounce: s.bounce ?? 0,
      life: s.life, maxLife: s.life, r: s.r, hit: s.hit, reflectable: s.reflectable !== false, dead: false, age: 0,
    });
    this.emit({ t: 'shoot', x, y, kind: s.kind, who: f.idx });
  }

  updateProjectiles(): void {
    const M = this.stage.main;
    const B = this.stage.blast;
    for (const p of this.projectiles) {
      if (p.dead) continue;
      p.px = p.x;
      p.py = p.y;
      p.age++;
      if (--p.life <= 0) {
        p.dead = true;
        continue;
      }
      p.vy = Math.min(p.maxFall, p.vy + p.gravity);
      p.x += p.vx;
      p.y += p.vy;
      if (p.x > M.x1 && p.x < M.x2 && p.y > M.top - p.r * 0.5 && p.y < M.bottom) {
        if (p.bounce > 0 && p.py <= M.top - p.r * 0.5 + 1 && p.vy > 0) {
          p.y = M.top - p.r * 0.5;
          p.vy = -p.bounce;
        } else p.dead = true;
      }
      if (p.bounce > 0 && p.vy > 0) {
        for (const pl of this.stage.plats) {
          const py = p.py + p.r * 0.5;
          const ny = p.y + p.r * 0.5;
          if (py <= pl.y && ny >= pl.y && p.x >= pl.x1 && p.x <= pl.x2) {
            p.y = pl.y - p.r * 0.5;
            p.vy = -p.bounce;
          }
        }
      }
      if (p.x < B.left || p.x > B.right || p.y > B.bottom || p.y < B.top) p.dead = true;
    }
    if (this.projectiles.some((p) => p.dead)) this.projectiles = this.projectiles.filter((p) => !p.dead);
  }

  resolveProjectiles(): void {
    for (const p of this.projectiles) {
      if (p.dead) continue;
      for (const v of this.fighters) {
        if (v.idx === p.owner || !v.alive()) continue;
        const rf = v.reflectActive();
        if (rf && p.reflectable) {
          const cx = v.shieldX;
          const cy = v.shieldY;
          if (pointSegDist2(cx, cy, p.px, p.py, p.x, p.y) <= (rf.r + p.r) ** 2) {
            p.vx = -p.vx * 1.25;
            p.vy = -Math.abs(p.vy) * 0.4;
            p.owner = v.idx;
            p.hit = { ...p.hit, dmg: Math.round(p.hit.dmg * 1.5 * 10) / 10 };
            p.life = p.maxLife;
            p.x += p.vx;
            this.emit({ t: 'reflect', x: p.x, y: p.y, who: v.idx });
            break;
          }
        }
        if (!v.canBeHit()) continue;
        if (v.counterActive() && capHitsHurt(p.px, p.py, p.x, p.y, p.r, v)) {
          this.applyCounter(null, v, p.hit.dmg, p.x);
          p.dead = true;
          break;
        }
        if (v.shielding() && capCircle(p.px, p.py, p.x, p.y, p.r, v.shieldX, v.shieldY, v.shieldR)) {
          this.applyShield(null, v, p.hit, true, p.x);
          p.dead = true;
          break;
        }
        if (capHitsHurt(p.px, p.py, p.x, p.y, p.r, v)) {
          this.applyHit(null, v, p.hit, p.x - Math.sign(p.vx || 1) * 20, p.y, Math.sign(p.vx) || 1, p.owner, true, p.x, p.y);
          p.dead = true;
          break;
        }
      }
    }
    if (this.projectiles.some((p) => p.dead)) this.projectiles = this.projectiles.filter((p) => !p.dead);
  }

  // ------------------------------------------------------------------ items

  spawnItem(): void {
    const r = this.rng.next();
    const kind: ItemKind = r < 0.2 ? 'bat' : r < 0.45 ? 'blade' : r < 0.75 ? 'bomb' : 'fruit';
    const M = this.stage.main;
    const x = this.rng.range(M.x1 + 80, M.x2 - 80);
    const y = M.top - 700;
    this.items.push({
      id: this.nextId++, kind, x, y, vx: 0, vy: 0, state: 'fall', holder: null, owner: -1, groundFrames: 0,
      fuse: -1, spin: 0, r: ITEM_RADIUS[kind], hitVictims: [],
    });
    this.emit({ t: 'item', x, y, kind, action: 'spawn' });
  }

  updateItems(): void {
    const M = this.stage.main;
    const B = this.stage.blast;
    for (const it of this.items) {
      if (it.state === 'dead') continue;
      if (it.state === 'held') {
        const h = it.holder;
        if (!h || !h.alive() || h.item !== it) {
          it.state = 'fall';
          it.holder = null;
        } else {
          it.x = h.x + h.pose.hdF.x * h.facing;
          it.y = h.y - h.pose.hdF.y;
        }
        continue;
      }
      if (it.state === 'ground') {
        it.groundFrames++;
        if (it.kind === 'bomb' && it.fuse > 0 && --it.fuse === 0) {
          this.explode(it.x, it.y - it.r, it.owner);
          it.state = 'dead';
          continue;
        }
        if (it.groundFrames > 900) it.state = 'dead';
        const pl = this.stage.plats.find((p) => Math.abs(p.y - it.y) < 1 && it.x >= p.x1 - 1 && it.x <= p.x2 + 1);
        if (pl) it.x += pl.vx;
        else if (Math.abs(it.y - M.top) > 1 || it.x < M.x1 || it.x > M.x2) it.state = 'fall';
        continue;
      }
      // fall / thrown
      it.groundFrames++;
      if (it.state === 'thrown' && it.groundFrames > 45) it.state = 'fall';
      it.vy = Math.min(14, it.vy + (it.state === 'thrown' ? 0.35 : 0.6));
      const py = it.y;
      it.x += it.vx;
      it.y += it.vy;
      it.spin += it.vx * 0.02 + 0.05;
      if (it.x + it.r > M.x1 && it.x - it.r < M.x2 && it.y > M.top + 1 && it.y - it.r * 2 < M.bottom) {
        if (py <= M.top + 1 && it.vy >= 0 && it.x >= M.x1 && it.x <= M.x2) {
          this.settleItem(it, M.top);
        } else {
          it.vx = -it.vx * 0.4;
          it.x = it.x < (M.x1 + M.x2) / 2 ? M.x1 - it.r : M.x2 + it.r;
        }
      }
      if ((it.state as Item['state']) !== 'ground' && it.vy > 0) {
        for (const pl of this.stage.plats) {
          if (py <= pl.y && it.y >= pl.y && it.x >= pl.x1 && it.x <= pl.x2) {
            this.settleItem(it, pl.y);
            break;
          }
        }
      }
      if (it.x < B.left || it.x > B.right || it.y > B.bottom) it.state = 'dead';
    }
    if (this.items.some((i) => i.state === 'dead')) this.items = this.items.filter((i) => i.state !== 'dead');
  }

  settleItem(it: Item, y: number): void {
    if (it.state === 'thrown' && it.kind === 'bomb') {
      this.explode(it.x, y - it.r, it.owner);
      it.state = 'dead';
      return;
    }
    it.y = y;
    it.vx = 0;
    it.vy = 0;
    it.state = 'ground';
    it.groundFrames = 0;
    if (it.kind === 'bomb') it.fuse = BOMB_FUSE;
  }

  explode(x: number, y: number, owner: number): void {
    this.explosions.push({ x, y, r: BOMB_RADIUS, frames: 6, owner, hit: BOMB_HIT, victims: [] });
    this.emit({ t: 'explode', x, y, r: BOMB_RADIUS });
  }

  resolveExplosions(): void {
    for (const e of this.explosions) {
      for (const v of this.fighters) {
        if (e.victims.includes(v.idx) || !v.canBeHit()) continue;
        if (v.shielding() && Math.hypot(v.shieldX - e.x, v.shieldY - e.y) < v.shieldR + e.r) {
          e.victims.push(v.idx);
          this.applyShield(null, v, e.hit, true, e.x);
          continue;
        }
        if (capHitsHurt(e.x, e.y, e.x, e.y, e.r, v)) {
          e.victims.push(v.idx);
          this.applyHit(null, v, e.hit, e.x, e.y, 1, e.owner, true);
        }
      }
      e.frames--;
    }
    if (this.explosions.some((e) => e.frames <= 0)) this.explosions = this.explosions.filter((e) => e.frames > 0);
  }

  resolveThrownItems(): void {
    for (const it of this.items) {
      if (it.state !== 'thrown') continue;
      for (const v of this.fighters) {
        if (v.idx === it.owner || !v.canBeHit() || it.hitVictims.includes(v.idx)) continue;
        const shield = v.shielding() && Math.hypot(v.shieldX - it.x, v.shieldY - it.y) < v.shieldR + it.r;
        if (!shield && !capHitsHurt(it.x, it.y, it.x, it.y, it.r, v)) continue;
        it.hitVictims.push(v.idx);
        if (it.kind === 'bomb') {
          this.explode(it.x, it.y, it.owner);
          it.state = 'dead';
          break;
        }
        if (shield) this.applyShield(null, v, THROWN_HIT, true, it.x);
        else this.applyHit(null, v, THROWN_HIT, it.x - Math.sign(it.vx || 1) * 20, it.y, Math.sign(it.vx) || 1, it.owner, true, it.x, it.y);
        it.state = 'fall';
        it.vx *= -0.3;
        it.vy = -6;
        break;
      }
    }
  }

  tryPickup(f: Fighter): boolean {
    if (f.item || !f.grounded) return false;
    let best: Item | null = null;
    let bd = Infinity;
    for (const it of this.items) {
      if (it.state !== 'ground' && it.state !== 'fall') continue;
      const dx = Math.abs(it.x - f.x);
      const dy = Math.abs(it.y - f.y);
      if (dx < f.W / 2 + it.r + 14 && dy < 44 && dx < bd) {
        best = it;
        bd = dx;
      }
    }
    if (!best) return false;
    if (best.kind === 'fruit') {
      f.percent = Math.max(0, f.percent - FRUIT_HEAL);
      best.state = 'dead';
      this.emit({ t: 'item', x: best.x, y: best.y, kind: 'fruit', action: 'heal' });
      return true;
    }
    f.item = best;
    best.state = 'held';
    best.holder = f;
    best.owner = f.idx;
    best.fuse = -1;
    this.emit({ t: 'item', x: best.x, y: best.y, kind: best.kind, action: 'pickup' });
    return true;
  }

  dropItem(f: Fighter): void {
    const it = f.item;
    if (!it) return;
    f.item = null;
    it.holder = null;
    it.state = 'fall';
    it.vx = 0;
    it.vy = -2;
    it.groundFrames = 0;
  }

  throwItem(f: Fighter, dir: 'f' | 'b' | 'u' | 'd'): void {
    const it = f.item;
    if (!it) return;
    f.item = null;
    it.holder = null;
    it.owner = f.idx;
    it.hitVictims = [];
    it.groundFrames = 0;
    if (dir === 'd' && f.grounded) {
      it.state = 'fall';
      it.vx = 0;
      it.vy = 0;
      return;
    }
    it.state = 'thrown';
    if (dir === 'f') {
      it.vx = 17 * f.facing;
      it.vy = -3;
    } else if (dir === 'b') {
      it.vx = -17 * f.facing;
      it.vy = -3;
    } else if (dir === 'u') {
      it.vx = f.vx * 0.3;
      it.vy = -19;
    } else {
      it.vx = 0;
      it.vy = 16;
    }
    this.emit({ t: 'item', x: it.x, y: it.y, kind: it.kind, action: 'throw' });
  }
}

// ------------------------------------------------------------------ geometry helpers

/** Does a swept circle (capsule a→b, radius r) touch any hurt capsule of the fighter? */
export function capHitsHurt(ax: number, ay: number, bx: number, by: number, r: number, v: Fighter): boolean {
  for (const c of v.hurt) {
    const rr = r + c.r;
    if (segSegDist2(ax, ay, bx, by, c.ax, c.ay, c.bx, c.by) <= rr * rr) return true;
  }
  return false;
}

export function capCircle(ax: number, ay: number, bx: number, by: number, r: number, cx: number, cy: number, cr: number): boolean {
  const rr = r + cr;
  return pointSegDist2(cx, cy, ax, ay, bx, by) <= rr * rr;
}

/** Hitbox data after smash charge, charged-special scaling, and counter damage. */
export function effectiveHit(h: HitboxDef, mv: MoveInst): HitData {
  const max = mv.def.charge?.max ?? 60;
  const c = mv.def.charge ? clamp(mv.charge / max, 0, 1) : 0;
  let dmg = h.dmg;
  let bkb = h.bkb;
  let kbg = h.kbg;
  let shieldDmg = h.shieldDmg;
  if (h.charge) {
    if (h.charge.dmg) dmg = lerp(h.charge.dmg[0], h.charge.dmg[1], c);
    if (h.charge.bkb) bkb = lerp(h.charge.bkb[0], h.charge.bkb[1], c);
    if (h.charge.kbg) kbg = lerp(h.charge.kbg[0], h.charge.kbg[1], c);
    if (h.charge.shieldDmg) shieldDmg = lerp(h.charge.shieldDmg[0], h.charge.shieldDmg[1], c);
  } else if (mv.def.charge?.smash) {
    dmg *= 1 + 0.4 * c;
  }
  if (h.dmgVar && mv.vars[h.dmgVar] !== undefined) dmg = mv.vars[h.dmgVar];
  dmg = Math.round(dmg * 10) / 10;
  return { ...h, dmg, bkb, kbg, shieldDmg };
}

