import { describe, expect, it } from 'vitest';
import { NOVA, inp, makeMatch, place } from './helpers';

function tumbleOntoStage(pressShieldFramesBeforeLanding: number | null): string {
  const m = makeMatch([NOVA, NOVA]);
  const f = m.fighters[0];
  place(m, 1, 300, 0, -1);
  f.x = 0;
  f.y = -260;
  f.grounded = false;
  f.groundId = -1;
  f.enter('tumble');
  f.hitstun = 40;
  f.kby = 6;
  // find how many frames until landing with no input
  let landFrame = -1;
  {
    const m2 = makeMatch([NOVA, NOVA]);
    const g = m2.fighters[0];
    place(m2, 1, 300, 0, -1);
    g.x = 0; g.y = -260; g.grounded = false; g.groundId = -1; g.enter('tumble'); g.hitstun = 40; g.kby = 6;
    for (let i = 0; i < 60; i++) {
      m2.step([inp(), inp()]);
      if (g.grounded) { landFrame = i; break; }
    }
  }
  for (let i = 0; i < 60; i++) {
    const press = pressShieldFramesBeforeLanding !== null && i === landFrame - pressShieldFramesBeforeLanding;
    m.step([inp({ shield: press }), inp()]);
    if (f.grounded) break;
  }
  return f.state === 'move' ? f.move!.id : f.state;
}

describe('tumble landings', () => {
  it('shield pressed within 11 frames before landing techs', () => {
    expect(tumbleOntoStage(3)).toBe('techIn');
    expect(tumbleOntoStage(10)).toBe('techIn');
  });

  it('missing the tech window means a knockdown', () => {
    expect(tumbleOntoStage(null)).toBe('knockdown');
    expect(tumbleOntoStage(20)).toBe('knockdown');
  });
});
