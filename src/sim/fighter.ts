import {
  FASTFALL_MULT, JUMPSQUAT, LAUNCH_SCALE, LEDGE_ACT_DELAY, LEDGE_INTANGIBLE, LEDGE_MAX_HANG, LEDGE_REGRAB_COOLDOWN,
  RESPAWN_INVULN, RESPAWN_PLATFORM_TIME, SHIELD_BREAK_DIZZY, TECH_WINDOW, TUMBLE_KB,
} from './constants';
import type { FighterDef, MoveDef } from './defs';
import { InputState } from './input';
import { applyDI, hitstunFrames } from './knockback';
import { approach, clamp } from './math';
import type { Match } from './match';
import { blankPose, blankResolved, posePoint, poseTargets, resolvePose, type PoseCtx, type Resolved } from './pose';
import type { LedgeRT } from './stage';

export type State =
  | 'idle' | 'walk' | 'dash' | 'run' | 'runbrake' | 'runturn' | 'crouch' | 'jumpsquat' | 'air' | 'land'
  | 'move' | 'shieldbreak' | 'dizzy'
  | 'hitstun' | 'tumble' | 'knockdown' | 'ledge' | 'helpless'
  | 'grabhold' | 'grabbed' | 'thrown' | 'grabrelease'
  | 'dead' | 'respawn';

export interface MoveInst {
  def: MoveDef;
  id: string;
  frame: number;
  charge: number;
  charging: boolean;
  chargeDone: boolean;
  /** hit group -> victim indices already hit */
  hitGroups: Map<number, number[]>;
  vars: Record<string, number>;
  prevHB: ({ x: number; y: number } | null)[];
  airStart: boolean;
}

export interface Cap {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  r: number;
}

export interface HitboxInst {
  owner: Fighter;
  i: number;
  def: MoveDef['hitboxes'][number];
  x: number;
  y: number;
  px: number;
  py: number;
  r: number;
}

export interface Stats {
  kos: number;
  falls: number;
  sds: number;
  dealt: number;
  taken: number;
}

export type Dir5 = 'n' | 'f' | 'b' | 'u' | 'd';

function cap(): Cap {
  return { ax: 0, ay: 0, bx: 0, by: 0, r: 0 };
}

export class Fighter {
  idx: number;
  def: FighterDef;
  palette: number;
  /** 0 = human, 1..9 = CPU level. */
  cpu: number;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  kbx = 0;
  kby = 0;
  facing: 1 | -1 = 1;
  grounded = true;
  groundId = -1;
  state: State = 'idle';
  sf = 0;
  move: MoveInst | null = null;
  percent = 0;
  stocks = 3;
  jumpsLeft: number;
  airdodgeUsed = false;
  sideBUsed = false;
  fastFalling = false;
  noGrav = false;
  hitlag = 0;
  hitstun = 0;
  tumble = false;
  launchKb = 0;
  pendingLaunch: { speed: number; angle: number } | null = null;
  intangible = 0;
  landLag = 0;
  helplessLag = 20;
  ledgeRef: LedgeRT | null = null;
  ledgeFrames = 0;
  ledgeCooldown = 0;
  ledgeIntUsed = false;
  ledgeNeutral = false;
  grabbing: Fighter | null = null;
  grabbedBy: Fighter | null = null;
  grabEscape = 0;
  lastHitBy = -1;
  platIgnore = -1;
  platIgnoreTimer = 0;
  dropArmed = false;
  respawnTimer = 0;
  eliminated = false;
  djFrames = 999;
  /** Frames since this fighter last got hit (render shake / HUD). */
  hurtFlash = 0;
  input = new InputState();
  stats: Stats = { kos: 0, falls: 0, sds: 0, dealt: 0, taken: 0 };

  poseT = blankPose();
  pose: Resolved = blankResolved();
  hurt: Cap[] = [cap(), cap(), cap(), cap(), cap(), cap()];
  hits: HitboxInst[] = [];
  shieldX = 0;
  shieldY = 0;
  shieldR = 0;
  wasHit = false;

  constructor(idx: number, def: FighterDef, palette: number, cpu: number) {
    this.idx = idx;
    this.def = def;
    this.palette = palette;
    this.cpu = cpu;
    this.jumpsLeft = def.jumps;
  }

  // ---------------------------------------------------------------- queries

  get W(): number {
    return this.def.width;
  }

  get H(): number {
    return this.def.height;
  }

  /** Centre of the body in world space. */
  get cx(): number {
    return this.x;
  }

  get cy(): number {
    return this.y - this.def.height * 0.5;
  }

  alive(): boolean {
    return this.state !== 'dead' && !this.eliminated;
  }

  inHitstun(): boolean {
    return (this.state === 'hitstun' || this.state === 'tumble') && (this.hitstun > 0 || this.hitlag > 0 || this.pendingLaunch !== null);
  }

  intangibleNow(): boolean {
    if (this.intangible > 0 || this.state === 'respawn' || this.state === 'dead') return true;
    const mv = this.move;
    if (mv && this.state === 'move') {
      if (mv.vars.int1 !== undefined) {
        if (mv.frame >= mv.vars.int0 && mv.frame <= mv.vars.int1) return true;
      }
      const w = mv.def.intangible;
      if (w) for (const [a, b] of w) if (mv.frame >= a && mv.frame <= b) return true;
    }
    return false;
  }

  canBeHit(): boolean {
    if (!this.alive()) return false;
    if (this.state === 'grabbed' || this.state === 'thrown') return false;
    return !this.intangibleNow();
  }

  counterActive(): MoveDef['counter'] | null {
    const mv = this.move;
    if (!mv || this.state !== 'move' || !mv.def.counter || mv.vars.countered) return null;
    const c = mv.def.counter;
    return mv.frame >= c.from && mv.frame <= c.to ? c : null;
  }

  reflectActive(): MoveDef['reflect'] | null {
    const mv = this.move;
    if (!mv || this.state !== 'move' || !mv.def.reflect) return null;
    const r = mv.def.reflect;
    return mv.frame >= r.from && mv.frame <= r.to ? r : null;
  }

  armorThreshold(): number {
    const mv = this.move;
    if (!mv || this.state !== 'move' || !mv.def.armor) return 0;
    const a = mv.def.armor;
    return mv.frame >= a.from && mv.frame <= a.to ? a.threshold : 0;
  }

  /** Stick direction relative to facing. */
  stickDir(x = this.input.cur.x, y = this.input.cur.y): Dir5 {
    if (Math.hypot(x, y) < 0.3) return 'n';
    if (Math.abs(y) > Math.abs(x)) return y > 0 ? 'u' : 'd';
    return x * this.facing > 0 ? 'f' : 'b';
  }

  edgeStops(): boolean {
    switch (this.state) {
      case 'idle':
      case 'walk':
      case 'dash':
      case 'run':
      case 'runbrake':
      case 'runturn':
      case 'hitstun':
      case 'tumble':
      case 'jumpsquat':
        return false;
      case 'move':
        return this.move ? this.move.def.edgeStop !== false : true;
      default:
        return true;
    }
  }

  // ---------------------------------------------------------------- transitions

  enter(s: State): void {
    this.state = s;
    this.sf = 0;
    if (s !== 'move') this.move = null;
  }

  startMove(id: string, m: Match): boolean {
    const d = this.def.moves[id];
    if (!d) return false;
    if (d.airOnce && !this.grounded) {
      if (this.sideBUsed) return false;
      this.sideBUsed = true;
    }
    this.move = {
      def: d,
      id,
      frame: 0,
      charge: 0,
      charging: false,
      chargeDone: !d.charge,
      hitGroups: new Map(),
      vars: {},
      prevHB: [],
      airStart: !this.grounded,
    };
    this.state = 'move';
    this.sf = 0;
    d.hooks?.start?.(this, m);
    return true;
  }

  endMove(m: Match): void {
    const mv = this.move;
    if (!mv) return;
    const d = mv.def;
    d.hooks?.end?.(this, m);
    if (this.move !== mv) return;
    if (d.id === 'pummel' && this.grabbing) {
      this.move = null;
      this.state = 'grabhold';
      this.sf = 0;
      return;
    }
    if (mv.vars.endFlip) this.facing = this.facing === 1 ? -1 : 1;
    this.move = null;
    if (!this.grounded) {
      if (d.helpless) {
        this.helplessLag = d.helplessLag ?? 20;
        this.enter('helpless');
      } else this.enter('air');
    } else {
      this.enter(this.input.cur.y < -0.6 ? 'crouch' : 'idle');
    }
  }

  land(m: Match, surface: number): void {
    const wasState = this.state;
    this.grounded = true;
    this.groundId = surface;
    this.vy = 0;
    this.kby = 0;
    this.fastFalling = false;
    this.jumpsLeft = this.def.jumps;
    this.airdodgeUsed = false;
    this.sideBUsed = false;
    this.ledgeIntUsed = false;
    this.djFrames = 999;
    this.platIgnoreTimer = 0;
    switch (wasState) {
      case 'air':
        this.enterLand(4);
        break;
      case 'helpless':
        this.enterLand(this.helplessLag);
        break;
      case 'shieldbreak':
        this.enter('dizzy');
        this.vx = 0;
        break;
      case 'move': {
        const mv = this.move!;
        const d = mv.def;
        if (d.onLand === 'keep') break;
        if (d.onLand === 'hook' && d.hooks?.land?.(this, m)) break;
        if (d.air || mv.airStart || d.onLand === 'lag' || d.helpless) {
          const lag = mv.vars.landLag ?? d.landingLag ?? (d.helpless ? d.helplessLag ?? 20 : 6);
          this.move = null;
          this.enterLand(lag);
        }
        break;
      }
      case 'tumble': {
        this.kbx *= 0.3;
        const ago = this.input.pressedAgo('shield');
        if (ago < TECH_WINDOW && this.hitlag === 0) {
          const x = this.input.cur.x;
          const id = Math.abs(x) < 0.5 ? 'techIn' : x * this.facing > 0 ? 'techRollF' : 'techRollB';
          this.kbx = 0;
          this.vx = 0;
          this.hitstun = 0;
          this.startMove(id, m);
          m.emit({ t: 'tech', x: this.x, y: this.y, who: this.idx });
        } else {
          this.hitstun = 0;
          this.kbx = 0;
          this.vx = 0;
          this.enter('knockdown');
          m.emit({ t: 'land', x: this.x, y: this.y, who: this.idx, hard: true });
        }
        return;
      }
      default:
        break;
    }
    if (wasState !== 'hitstun' && wasState !== 'move') m.emit({ t: 'land', x: this.x, y: this.y, who: this.idx, hard: false });
  }

  enterLand(lag: number): void {
    this.landLag = Math.max(1, lag);
    this.enter('land');
  }

  leaveGround(m: Match): void {
    this.grounded = false;
    this.groundId = -1;
    switch (this.state) {
      case 'idle':
      case 'walk':
      case 'dash':
      case 'run':
      case 'runbrake':
      case 'runturn':
      case 'crouch':
      case 'land':
      case 'dizzy':
      case 'grabrelease':
      case 'jumpsquat':
      case 'knockdown':
        this.enter('air');
        break;
      case 'grabhold':
        m.releaseGrab(this);
        this.enter('air');
        break;
      case 'move':
        if (this.move && this.move.def.edgeStop !== false) this.endMove(m);
        break;
      default:
        break;
    }
  }

  /** Called by physics when pushed out of a wall. */
  onWall(): void {
    if (this.state === 'tumble' && Math.abs(this.kbx) > 6) this.kbx = -this.kbx * 0.4;
    else this.kbx = 0;
    this.vx = 0;
  }

  onCeiling(): void {
    this.vy = Math.max(0, this.vy);
    this.kby = this.state === 'tumble' ? Math.abs(this.kby) * 0.4 : 0;
  }

  // ---------------------------------------------------------------- helpers

  traction(k = 1): void {
    this.vx = approach(this.vx, 0, this.def.traction * k);
  }

  airDrift(k: number): void {
    const I = this.input.cur;
    const d = this.def;
    if (Math.abs(I.x) > 0.2) {
      const max = d.airSpeed * Math.max(1, k);
      const target = I.x * max;
      if (Math.abs(this.vx) > max && Math.sign(this.vx) === Math.sign(target)) this.vx = approach(this.vx, target, d.airFriction);
      else this.vx = approach(this.vx, target, d.airAccel * k);
    } else {
      this.vx = approach(this.vx, 0, d.airFriction);
    }
    this.checkFastFall();
  }

  checkFastFall(): void {
    if (!this.fastFalling && this.vy >= -1.5 && this.input.flickY(3) === -1) {
      this.input.consumeFlickY();
      this.fastFalling = true;
      this.vy = this.def.fallSpeed * FASTFALL_MULT;
    }
  }

  turnTo(dirX: number): void {
    if (dirX > 0) this.facing = 1;
    else if (dirX < 0) this.facing = -1;
  }

  // ---------------------------------------------------------------- actions

  smashInput(): Dir5 | null {
    const I = this.input;
    if (I.cPressed()) {
      I.consumeC();
      if (I.cY !== 0) return I.cY > 0 ? 'u' : 'd';
      return I.cX * this.facing > 0 ? 'f' : 'b';
    }
    if (I.pressed('smash')) {
      I.consume('smash');
      const d = this.stickDir();
      return d === 'n' ? 'f' : d;
    }
    if (!I.cur.digital && I.pressed('attack', 3)) {
      const fx = I.flickX(4);
      const fy = I.flickY(4);
      if (fy !== 0 && Math.abs(I.cur.y) >= 0.7) {
        I.consume('attack');
        I.consumeFlickY();
        return fy > 0 ? 'u' : 'd';
      }
      if (fx !== 0 && Math.abs(I.cur.x) >= 0.7) {
        I.consume('attack');
        I.consumeFlickX();
        return fx * this.facing > 0 ? 'f' : 'b';
      }
    }
    return null;
  }

  startSmash(d: Dir5, m: Match): void {
    if (d === 'b') {
      this.facing = this.facing === 1 ? -1 : 1;
      d = 'f';
    }
    this.startMove(d === 'u' ? 'usmash' : d === 'd' ? 'dsmash' : 'fsmash', m);
  }

  doSpecial(m: Match): boolean {
    const I = this.input;
    const d = this.stickDir();
    I.consume('special');
    if (d === 'f' || d === 'b') {
      if (d === 'b') this.facing = this.facing === 1 ? -1 : 1;
      return this.startMove('sspecial', m);
    }
    return this.startMove(d === 'u' ? 'uspecial' : d === 'd' ? 'dspecial' : 'nspecial', m);
  }

  doAerial(d: Dir5, m: Match): boolean {
    const id = d === 'n' ? 'nair' : d === 'f' ? 'fair' : d === 'b' ? 'bair' : d === 'u' ? 'uair' : 'dair';
    return this.startMove(id, m);
  }

  /** Tap-to-evade: a direction rolls, neutral spot-dodges. No blocking stance. */
  tryDodge(m: Match): boolean {
    const I = this.input;
    if (!I.pressed('shield')) return false;
    I.consume('shield');
    if (Math.abs(I.cur.x) >= 0.5) {
      const dir = Math.sign(I.cur.x);
      return this.startMove(dir === this.facing ? 'rollF' : 'rollB', m);
    }
    return this.startMove('spotdodge', m);
  }

  groundActions(m: Match): boolean {
    const I = this.input;
    const dashing = this.state === 'dash' || this.state === 'run';
    if (I.pressed('jump')) {
      I.consume('jump');
      this.enter('jumpsquat');
      return true;
    }
    if (I.pressed('grab')) {
      I.consume('grab');
      return this.startMove(dashing ? 'dashGrab' : 'grab', m);
    }
    if (this.tryDodge(m)) return true;
    if (I.pressed('special')) return this.doSpecial(m);
    const sm = this.smashInput();
    if (sm) {
      if (this.state === 'run') {
        this.startMove('dashAttack', m);
        return true;
      }
      this.startSmash(sm, m);
      return true;
    }
    if (I.pressed('attack')) {
      I.consume('attack');
      if (dashing) return this.startMove('dashAttack', m);
      const d = this.state === 'crouch' ? 'd' : this.stickDir();
      if (d === 'u') return this.startMove('utilt', m);
      if (d === 'd') return this.startMove('dtilt', m);
      if (d === 'f' || d === 'b') {
        if (d === 'b') this.facing = this.facing === 1 ? -1 : 1;
        return this.startMove('ftilt', m);
      }
      return this.startMove('jab1', m);
    }
    return false;
  }

  airActions(m: Match): boolean {
    const I = this.input;
    if (I.pressed('jump') && this.jumpsLeft > 0) {
      I.consume('jump');
      this.doubleJump(m);
      return true;
    }
    if (I.pressed('shield') && !this.airdodgeUsed) {
      I.consume('shield');
      this.airdodgeUsed = true;
      return this.startMove('airdodge', m);
    }
    if (I.pressed('special')) return this.doSpecial(m);
    if (I.cPressed()) {
      I.consumeC();
      const d = I.cY !== 0 ? (I.cY > 0 ? 'u' : 'd') : I.cX * this.facing > 0 ? 'f' : 'b';
      return this.doAerial(d, m);
    }
    if (I.pressed('smash')) {
      I.consume('smash');
      const d = this.stickDir();
      return this.doAerial(d === 'n' ? 'f' : d, m);
    }
    if (I.pressed('attack')) {
      I.consume('attack');
      return this.doAerial(this.stickDir(), m);
    }
    return false;
  }

  doubleJump(m: Match): void {
    this.jumpsLeft--;
    this.vy = -this.def.doubleJumpV;
    this.vx = this.input.cur.x * this.def.airSpeed;
    this.fastFalling = false;
    this.djFrames = 0;
    this.enter('air');
    m.emit({ t: 'jump', x: this.x, y: this.y, who: this.idx, air: true });
  }

  // ---------------------------------------------------------------- per-frame

  step(m: Match): void {
    if (this.state === 'dead') {
      if (!this.eliminated && this.stocks > 0 && --this.respawnTimer <= 0) m.respawn(this);
      return;
    }
    this.wasHit = false;
    if (this.hurtFlash > 0) this.hurtFlash--;
    if (this.hitlag > 0) {
      this.hitlag--;
      if (this.hitlag === 0 && this.pendingLaunch) this.launch();
      return;
    }
    this.noGrav = false;
    if (this.intangible > 0) this.intangible--;
    if (this.ledgeCooldown > 0) this.ledgeCooldown--;
    if (this.platIgnoreTimer > 0) this.platIgnoreTimer--;
    if (this.djFrames < 999) this.djFrames++;
    this.update(m);
    m.physics(this);
    // KO credit only lasts until the fighter is back on solid ground and actionable.
    if (this.grounded && this.lastHitBy >= 0 && this.state !== 'hitstun' && this.state !== 'tumble' &&
      this.state !== 'grabbed' && this.state !== 'thrown') {
      this.lastHitBy = -1;
    }
  }

  launch(): void {
    const pl = this.pendingLaunch!;
    this.pendingLaunch = null;
    let ang = pl.angle;
    const I = this.input.cur;
    if (Math.hypot(I.x, I.y) > 0.25) ang = applyDI(ang, I.x, I.y);
    this.kbx = Math.cos(ang) * pl.speed;
    this.kby = -Math.sin(ang) * pl.speed;
    this.vx = 0;
    this.vy = 0;
    if (this.grounded && (this.tumble || -this.kby > Math.max(2.5, pl.speed * 0.5))) {
      this.grounded = false;
      this.groundId = -1;
    }
    if (this.grounded) this.kby = 0;
  }

  /** Called by combat when a hit connects. */
  enterHitstun(kb: number, angle: number, hitlag: number, m: Match): void {
    if (this.state === 'ledge') this.leaveLedge();
    if (this.grabbing) m.releaseGrab(this);
    this.move = null;
    this.hitlag = hitlag;
    this.hitstun = hitstunFrames(kb);
    this.pendingLaunch = { speed: kb * LAUNCH_SCALE, angle };
    this.tumble = kb > TUMBLE_KB;
    this.launchKb = kb;
    this.state = this.tumble ? 'tumble' : 'hitstun';
    this.sf = 0;
    this.vx = 0;
    this.vy = 0;
    this.kbx = 0;
    this.kby = 0;
    this.fastFalling = false;
    this.jumpsLeft = this.def.jumps;
    this.airdodgeUsed = false;
    this.sideBUsed = false;
    this.ledgeIntUsed = false;
  }

  update(m: Match): void {
    this.sf++;
    const I = this.input;
    const d = this.def;
    switch (this.state) {
      case 'idle': {
        if (this.groundActions(m)) break;
        const fx = I.flickX();
        if (fx !== 0 || (I.cur.digital && Math.abs(I.cur.x) >= 0.5)) {
          if (fx !== 0) I.consumeFlickX();
          this.startDash(fx !== 0 ? fx : Math.sign(I.cur.x), m);
          break;
        }
        if (I.cur.y < -0.6) {
          this.dropArmed = I.flickY() === -1 || I.cur.digital;
          this.enter('crouch');
          break;
        }
        if (Math.abs(I.cur.x) >= 0.25) {
          this.turnTo(I.cur.x);
          this.enter('walk');
          break;
        }
        this.traction();
        break;
      }
      case 'walk': {
        if (this.groundActions(m)) break;
        const fx = I.flickX();
        if (fx !== 0) {
          I.consumeFlickX();
          this.startDash(fx, m);
          break;
        }
        if (I.cur.y < -0.6) {
          this.enter('crouch');
          break;
        }
        if (Math.abs(I.cur.x) < 0.25) {
          this.enter('idle');
          this.traction();
          break;
        }
        this.turnTo(I.cur.x);
        this.vx = approach(this.vx, I.cur.x * d.walkSpeed, 0.8);
        break;
      }
      case 'dash': {
        if (this.groundActions(m)) break;
        const fx = I.flickX();
        if (fx !== 0 && fx !== this.facing && this.sf > 1) {
          I.consumeFlickX();
          this.startDash(fx, m);
          break;
        }
        this.vx = this.facing * d.dashSpeed;
        if (this.sf >= d.dashFrames) {
          if (I.cur.x * this.facing > 0.5) this.enter('run');
          else {
            this.enter('idle');
          }
        }
        break;
      }
      case 'run': {
        if (this.groundActions(m)) break;
        if (I.cur.x * this.facing < -0.3) {
          this.enter('runturn');
          break;
        }
        if (Math.abs(I.cur.x) < 0.3) {
          this.enter('runbrake');
          break;
        }
        if (I.cur.y < -0.7) {
          this.enter('crouch');
          break;
        }
        this.vx = approach(this.vx, this.facing * d.runSpeed, 1.2);
        break;
      }
      case 'runbrake': {
        if (I.pressed('jump')) {
          I.consume('jump');
          this.enter('jumpsquat');
          break;
        }
        if (this.tryDodge(m)) break;
        this.traction(1.2);
        if (this.sf >= 12 || Math.abs(this.vx) < 0.5) this.enter('idle');
        break;
      }
      case 'runturn': {
        if (I.pressed('jump')) {
          I.consume('jump');
          if (this.sf < 6) this.facing = this.facing === 1 ? -1 : 1;
          this.enter('jumpsquat');
          break;
        }
        if (this.sf < 6) this.traction(1.6);
        if (this.sf === 6) this.facing = this.facing === 1 ? -1 : 1;
        if (this.sf > 6) this.vx = approach(this.vx, this.facing * d.runSpeed, 1.2);
        if (this.sf >= 12) this.enter(I.cur.x * this.facing > 0.5 ? 'run' : 'idle');
        break;
      }
      case 'crouch': {
        if (this.groundActions(m)) break;
        if (I.cur.y > -0.5) {
          this.enter('idle');
          break;
        }
        if (I.flickY() === -1) this.dropArmed = true;
        if (this.groundId >= 0 && this.dropArmed && this.sf >= 3 && I.cur.y < -0.6) {
          this.dropThrough(m);
          break;
        }
        this.traction();
        break;
      }
      case 'jumpsquat': {
        if (I.pressed('special') && this.stickDir() === 'u') {
          this.doSpecial(m);
          break;
        }
        const sm = this.smashInput();
        if (sm === 'u') {
          this.startSmash('u', m);
          break;
        }
        this.traction(0.5);
        if (this.sf >= JUMPSQUAT) {
          const full = I.held('jump');
          this.grounded = false;
          this.groundId = -1;
          this.vy = -(full ? d.jumpV : d.shortHopV);
          const maxH = d.airSpeed * 1.15;
          this.vx = clamp(this.vx * 0.85 + I.cur.x * d.airSpeed * 0.35, -maxH, maxH);
          this.enter('air');
          m.emit({ t: 'jump', x: this.x, y: this.y, who: this.idx, air: false });
        }
        break;
      }
      case 'air': {
        if (this.airActions(m)) break;
        this.airDrift(1);
        break;
      }
      case 'land': {
        this.traction();
        if (this.sf >= this.landLag) {
          this.enter('idle');
          this.groundActions(m);
        }
        break;
      }
      case 'move':
        this.updateMove(m);
        break;
      case 'shieldbreak': {
        this.vx = approach(this.vx, 0, 0.1);
        break;
      }
      case 'dizzy': {
        this.traction();
        if (this.sf >= SHIELD_BREAK_DIZZY) {
          this.enter('idle');
        }
        break;
      }
      case 'hitstun':
      case 'tumble': {
        if (this.hitstun > 0) {
          this.hitstun--;
          if (this.grounded) this.traction();
          else this.vx = approach(this.vx, 0, d.airFriction);
          if (this.hitstun === 0 && this.state === 'hitstun') this.enter(this.grounded ? 'idle' : 'air');
          break;
        }
        if (this.grounded) {
          this.enter('idle');
          break;
        }
        if (this.airActions(m)) break;
        this.airDrift(1);
        break;
      }
      case 'knockdown': {
        this.traction();
        if (this.sf < 12) break;
        if (I.pressed('attack') || I.pressed('special')) {
          I.consume('attack');
          I.consume('special');
          this.startMove('getupAttack', m);
        } else if (Math.abs(I.cur.x) > 0.5) {
          this.startMove(I.cur.x * this.facing > 0 ? 'getupRollF' : 'getupRollB', m);
        } else if (I.pressed('jump') || I.pressed('shield') || I.cur.y > 0.5 || this.sf >= 60) {
          I.consume('jump');
          I.consume('shield');
          this.startMove('getupStand', m);
        }
        break;
      }
      case 'ledge':
        this.updateLedge(m);
        break;
      case 'helpless': {
        this.airDrift(0.6);
        break;
      }
      case 'grabhold':
        this.updateGrabHold(m);
        break;
      case 'grabbed':
      case 'thrown':
        break;
      case 'grabrelease': {
        this.traction(0.5);
        if (this.sf >= 16) this.enter(this.grounded ? 'idle' : 'air');
        break;
      }
      case 'respawn': {
        const sp = m.stage.def.respawn;
        this.x = sp[0];
        this.y = sp[1];
        this.vx = 0;
        this.vy = 0;
        const moved = Math.abs(I.cur.x) > 0.5 || Math.abs(I.cur.y) > 0.5 || I.pressed('jump') || I.pressed('attack') ||
          I.pressed('special') || I.pressed('shield') || I.pressed('grab');
        if (this.sf >= RESPAWN_PLATFORM_TIME || (this.sf > 30 && moved)) {
          this.intangible = RESPAWN_INVULN;
          this.enter('air');
          if (I.pressed('jump') && this.jumpsLeft > 0) {
            I.consume('jump');
            this.doubleJump(m);
          }
        }
        break;
      }
      case 'dead':
        break;
    }
  }

  startDash(dir: number, m: Match): void {
    this.turnTo(dir);
    this.vx = this.facing * this.def.dashSpeed;
    this.enter('dash');
    m.emit({ t: 'dash', x: this.x, y: this.y, who: this.idx, dir: this.facing });
  }

  dropThrough(m: Match): void {
    this.platIgnore = this.groundId;
    this.platIgnoreTimer = 12;
    this.grounded = false;
    this.groundId = -1;
    this.y += 2;
    this.vy = 1;
    this.enter('air');
    void m;
  }

  updateMove(m: Match): void {
    const mv = this.move!;
    const d = mv.def;
    const I = this.input;
    if (d.charge && !mv.chargeDone && mv.frame === d.charge.frame) {
      const max = d.charge.max ?? 60;
      const held = d.charge.btn === 'special'
        ? I.held('special')
        : I.held('attack') || I.held('smash') || I.cHeld();
      if (held && mv.charge < max) {
        mv.charge++;
        mv.charging = true;
        if (this.grounded) this.traction();
        else this.airDrift(0.5);
        return;
      }
      mv.chargeDone = true;
      mv.charging = false;
    }
    mv.frame++;
    const F = mv.frame;
    let motion: NonNullable<MoveDef['motion']>[number] | undefined;
    if (d.motion) for (const md of d.motion) if (F >= md.from && F <= md.to) motion = md;
    if (motion) {
      if (motion.vx !== undefined) this.vx = motion.vx * this.facing;
      if (motion.vy !== undefined) this.vy = motion.vy;
      if (motion.damp !== undefined) {
        this.vx *= motion.damp;
        this.vy *= motion.damp;
      }
      if (motion.noGrav) this.noGrav = true;
    }
    const drift = motion?.drift ?? (d.air ? 1 : 0.5);
    if (!this.grounded) {
      if (motion?.vx === undefined && drift > 0) this.airDrift(drift);
      else if (d.air) this.checkFastFall();
    } else if (motion?.vx === undefined) {
      this.traction();
    }
    if (d.projectiles) for (const p of d.projectiles) if (p.frame === F) m.spawnProjectile(this, p);
    if (d.throwDef && F === d.throwDef.release && this.grabbing) m.releaseThrow(this, d.throwDef.hit);
    if (d.pummel && F === d.pummel.frame && this.grabbing) m.pummel(this, d.pummel.dmg);
    if (d.hooks?.frame) {
      d.hooks.frame(this, m);
      if (this.move !== mv) return;
    }
    if (d.next && F >= d.next.from && F <= d.next.to && I.pressed(d.next.btn)) {
      I.consume(d.next.btn);
      this.startMove(d.next.id, m);
      return;
    }
    if (d.jumpCancel && F >= d.jumpCancel[0] && F <= d.jumpCancel[1] && I.pressed('jump')) {
      if (this.grounded) {
        I.consume('jump');
        this.move = null;
        this.enter('jumpsquat');
        return;
      }
      if (this.jumpsLeft > 0) {
        I.consume('jump');
        this.doubleJump(m);
        return;
      }
    }
    if (d.iasa !== undefined && F >= d.iasa) {
      if (this.grounded ? this.groundActions(m) : this.airActions(m)) return;
    }
    if (F >= d.total) this.endMove(m);
  }

  updateLedge(m: Match): void {
    const L = this.ledgeRef;
    if (!L) {
      this.enter('air');
      return;
    }
    this.ledgeFrames++;
    this.x = L.x + L.dir * (this.W / 2 + 2);
    this.y = L.y + this.H * 0.72;
    this.vx = this.vy = this.kbx = this.kby = 0;
    const I = this.input;
    if (Math.abs(I.cur.x) < 0.3 && Math.abs(I.cur.y) < 0.3) this.ledgeNeutral = true;
    if (this.ledgeFrames > LEDGE_MAX_HANG) {
      this.leaveLedge();
      this.enter('air');
      this.ledgeCooldown = 60;
      return;
    }
    if (this.ledgeFrames < LEDGE_ACT_DELAY) return;
    const toward = -L.dir;
    if (I.pressed('jump')) {
      I.consume('jump');
      this.leaveLedge();
      this.x = L.x + L.dir * (this.W / 2 - 6);
      this.y = L.y - 6;
      this.vy = -this.def.jumpV * 1.05;
      this.vx = toward * 2.5;
      this.enter('air');
      m.emit({ t: 'jump', x: this.x, y: this.y, who: this.idx, air: false });
      return;
    }
    if (I.pressed('shield')) {
      I.consume('shield');
      this.ledgeMove('ledgeRoll', m);
      return;
    }
    if (I.pressed('attack') || I.pressed('special')) {
      I.consume('attack');
      I.consume('special');
      this.ledgeMove('ledgeAttack', m);
      return;
    }
    if (!this.ledgeNeutral) return;
    if (I.cur.y > 0.5 || I.cur.x * toward > 0.5) {
      this.ledgeMove('ledgeClimb', m);
      return;
    }
    if (I.cur.y < -0.5 || I.cur.x * toward < -0.5) {
      this.leaveLedge();
      this.ledgeCooldown = LEDGE_REGRAB_COOLDOWN;
      this.vy = 0;
      this.enter('air');
    }
  }

  ledgeMove(id: string, m: Match): void {
    const L = this.ledgeRef!;
    this.leaveLedge();
    this.x = L.x - L.dir * (this.W / 2 + 4);
    this.y = L.y;
    this.grounded = true;
    this.groundId = -1;
    this.facing = L.dir > 0 ? -1 : 1;
    this.startMove(id, m);
  }

  grabLedge(L: LedgeRT, m: Match): void {
    if (L.occupant >= 0 && L.occupant !== this.idx) {
      const o = m.fighters[L.occupant];
      if (o.state === 'ledge') o.popOffLedge();
    }
    L.occupant = this.idx;
    this.ledgeRef = L;
    if (this.move) this.move = null;
    this.enter('ledge');
    this.ledgeFrames = 0;
    this.ledgeNeutral = Math.abs(this.input.cur.x) < 0.3 && Math.abs(this.input.cur.y) < 0.3;
    this.x = L.x + L.dir * (this.W / 2 + 2);
    this.y = L.y + this.H * 0.72;
    this.facing = L.dir > 0 ? -1 : 1;
    this.vx = this.vy = this.kbx = this.kby = 0;
    this.grounded = false;
    this.groundId = -1;
    this.jumpsLeft = this.def.jumps;
    this.airdodgeUsed = false;
    this.sideBUsed = false;
    this.fastFalling = false;
    this.djFrames = 999;
    this.hitstun = 0;
    if (!this.ledgeIntUsed) {
      this.intangible = Math.max(this.intangible, LEDGE_INTANGIBLE);
      this.ledgeIntUsed = true;
    }
    this.lastHitBy = -1;
    m.emit({ t: 'ledge', x: L.x, y: L.y, who: this.idx });
  }

  leaveLedge(): void {
    if (this.ledgeRef && this.ledgeRef.occupant === this.idx) this.ledgeRef.occupant = -1;
    this.ledgeRef = null;
  }

  popOffLedge(): void {
    const L = this.ledgeRef;
    this.leaveLedge();
    this.enter('air');
    this.vx = (L ? L.dir : 1) * 3;
    this.vy = -7;
    this.ledgeCooldown = LEDGE_REGRAB_COOLDOWN;
  }

  canGrabLedgeNow(): boolean {
    if (this.grounded || this.ledgeCooldown > 0 || this.hitlag > 0) return false;
    if (this.input.cur.y < -0.5) return false;
    const vyT = this.vy + this.kby;
    switch (this.state) {
      case 'air':
        return vyT >= 0;
      case 'helpless':
        return true;
      case 'tumble':
        return this.hitstun === 0 && vyT >= 0;
      case 'move': {
        const mv = this.move!;
        return mv.def.ledgeFrom !== undefined && mv.frame >= mv.def.ledgeFrom;
      }
      default:
        return false;
    }
  }

  updateGrabHold(m: Match): void {
    const v = this.grabbing;
    this.traction();
    if (!v || v.state !== 'grabbed') {
      this.grabbing = null;
      this.enter('idle');
      return;
    }
    v.grabEscape -= 1 + v.input.mash * 3;
    if (v.grabEscape <= 0) {
      m.releaseGrab(this);
      return;
    }
    const I = this.input;
    if (I.pressed('attack')) {
      I.consume('attack');
      this.startMove('pummel', m);
      return;
    }
    let dir: Dir5 = 'n';
    if (I.cPressed()) {
      I.consumeC();
      dir = I.cY !== 0 ? (I.cY > 0 ? 'u' : 'd') : I.cX * this.facing > 0 ? 'f' : 'b';
    } else if (this.sf > 4) {
      dir = this.stickDir();
    }
    if (dir !== 'n') {
      const id = dir === 'f' ? 'fthrow' : dir === 'b' ? 'bthrow' : dir === 'u' ? 'uthrow' : 'dthrow';
      v.enter('thrown');
      this.startMove(id, m);
    }
  }

  /** Blade length for pose resolution. */
  weaponLen(): number {
    return this.def.rig.weapon ? this.def.rig.weapon.len : 0;
  }

  /** World position of a pose point. */
  worldPoint(lx: number, ly: number): { x: number; y: number } {
    return { x: this.x + lx * this.facing, y: this.y - ly };
  }

  poseCtx(): PoseCtx {
    return {
      state: this.state,
      sf: this.sf,
      t: this.input.frame,
      grounded: this.grounded,
      fwd: this.vx * this.facing,
      vy: this.vy + this.kby,
      move: this.move && this.state === 'move' ? { def: this.move.def, frame: this.move.frame, vars: this.move.vars } : null,
      dj: this.djFrames,
      width: this.W,
      height: this.H,
    };
  }

  /** Recompute pose, hurtboxes, and active hitboxes. */
  computeBoxes(): void {
    poseTargets(this.def.rig, this.poseCtx(), this.poseT);
    resolvePose(this.def.rig, this.poseT, this.pose, this.weaponLen());
    const P = this.pose;
    const r = this.def.rig;
    const f = this.facing;
    const X = this.x;
    const Y = this.y;
    const setCap = (c: Cap, ax: number, ay: number, bx: number, by: number, rad: number) => {
      c.ax = X + ax * f;
      c.ay = Y - ay;
      c.bx = X + bx * f;
      c.by = Y - by;
      c.r = rad;
    };
    setCap(this.hurt[0], P.hip.x, P.hip.y, P.neck.x, P.neck.y, r.bodyR);
    setCap(this.hurt[1], P.head.x, P.head.y, P.head.x, P.head.y, r.headR);
    setCap(this.hurt[2], P.shF.x, P.shF.y, P.hdF.x, P.hdF.y, r.limbR + 1.5);
    setCap(this.hurt[3], P.shB.x, P.shB.y, P.hdB.x, P.hdB.y, r.limbR + 1.5);
    setCap(this.hurt[4], P.hipF.x, P.hipF.y, P.ftF.x, P.ftF.y, r.limbR * 1.35);
    setCap(this.hurt[5], P.hipB.x, P.hipB.y, P.ftB.x, P.ftB.y, r.limbR * 1.35);
    // Body-centre point/radius, used by reflect moves (the old shield stance is gone).
    this.shieldX = X + P.center.x * f;
    this.shieldY = Y - P.center.y;
    this.shieldR = Math.max(this.W, this.H) * 0.62;
    this.hits.length = 0;
    const mv = this.move;
    if (!mv || this.state !== 'move') return;
    const hbs = mv.def.hitboxes;
    for (let i = 0; i < hbs.length; i++) {
      const h = hbs[i];
      if (mv.frame < h.from || mv.frame > h.to || (mv.charging && mv.frame === mv.def.charge?.frame)) {
        mv.prevHB[i] = null;
        continue;
      }
      let lx: number;
      let ly: number;
      if (h.pos) {
        lx = h.pos[0];
        ly = h.pos[1];
      } else {
        const pt = posePoint(P, h.at ?? 'center', h.t ?? 1);
        lx = pt.x;
        ly = pt.y;
      }
      if (h.off) {
        lx += h.off[0];
        ly += h.off[1];
      }
      const wx = X + lx * f;
      const wy = Y - ly;
      const prev = mv.prevHB[i];
      this.hits.push({ owner: this, i, def: h, x: wx, y: wy, px: prev ? prev.x : wx, py: prev ? prev.y : wy, r: h.r });
      mv.prevHB[i] = { x: wx, y: wy };
    }
  }
}

