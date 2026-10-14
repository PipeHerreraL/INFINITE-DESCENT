import { describe, it, expect } from 'vitest';
import { castSpell } from '../src/core/combat/spellcast.js';
import { applyDamage, killUnit } from '../src/core/combat/damage.js';
import { applyStatus } from '../src/core/combat/statuses.js';
import { fireTriggers, TRIGGER_BUDGET } from '../src/core/combat/triggers.js';
import { explodeBombs, bombsOf, placeBombs } from '../src/core/combat/bombs.js';
import { hasStatus } from '../src/core/combat/state.js';
import { makeCombat, makeRun, hero, enemies, equip, forceTurn } from './helpers.js';
import { refreshHero } from '../src/core/run/run.js';

function withRelics(classId, relics) {
  const run = makeRun(classId);
  run.hero.relics.push(...relics);
  refreshHero(run);
  return run;
}

describe('disparadores y sinergias', () => {
  it('Ascua Eterna: los críticos explotan alrededor del objetivo', () => {
    const run = withRelics('furiak', ['ascuaEterna']);
    const c = makeCombat({ run, enemies: [{ id: 'larvazul', x: 3, y: 2 }, { id: 'larvazul', x: 4, y: 2 }] });
    const h = hero(c);
    h.baseStats.crit = 100;
    const [a, b] = enemies(c);
    const hpB = b.hp;
    castSpell(c, h, 'presion', { x: 3, y: 2 });
    expect(a.hp).toBeLessThan(a.maxHp);
    // La larva de detrás recibe la explosión aunque no fue el objetivo.
    expect(b.hp).toBeLessThan(hpB);
  });

  it('Colmillo de Jalabestia: +2 PA al matar, solo una vez por turno', () => {
    const run = withRelics('furiak', ['colmilloJalabestia']);
    const c = makeCombat({ run, enemies: [{ id: 'plumin', x: 3, y: 2 }, { id: 'plumin', x: 2, y: 3 }] });
    const h = hero(c);
    const [a, b] = enemies(c);
    a.hp = 1;
    b.hp = 1;
    castSpell(c, h, 'presion', { x: 3, y: 2 });
    expect(h.ap).toBe(6 - 3 + 2);
    castSpell(c, h, 'presion', { x: 2, y: 3 });
    expect(h.ap).toBe(6 - 3 + 2 - 3);
  });

  it('la Ira se gana una vez por acción aunque el hechizo golpee a varios', () => {
    const c = makeCombat({ enemies: [{ id: 'larvazul', x: 3, y: 2 }, { id: 'larvazul', x: 4, y: 2 }] });
    const h = hero(c);
    castSpell(c, h, 'espadaIgnea', { x: 3, y: 2 });
    expect(h.statuses.find((s) => s.statusId === 'ira').stacks).toBe(1);
  });

  it('la Ira se pierde si el turno termina sin infligir daño', () => {
    const c = makeCombat({ enemies: [{ id: 'larvazul', x: 3, y: 2 }] });
    const h = hero(c);
    applyStatus(c, h, 'ira', { stacks: 3, duration: -1 });
    forceTurn(c, h.id);
    fireTriggers(c, h.id, 'turnEnd', { depth: 0 });
    expect(hasStatus(h, 'ira')).toBe(false);
  });

  it('Ensalmo: la sobrecuración se convierte en escudo con tope', () => {
    const run = makeRun('ensalmador');
    const c = makeCombat({ run, enemies: [{ id: 'larvazul', x: 7, y: 7 }] });
    const h = hero(c);
    castSpell(c, h, 'palabraCurativa', { x: 2, y: 2 });
    const shield = h.shields.reduce((a, s) => a + s.value, 0);
    expect(shield).toBeGreaterThan(0);
    expect(shield).toBeLessThanOrEqual(Math.round(h.maxHp * 0.2));
  });

  it('el set del Jabalí Carmesí (3 piezas) quema con golpes de Fuego', () => {
    const run = makeRun('furiak');
    equip(run, 'hat', 'yelmoColmillo', 'rare');
    equip(run, 'cloak', 'capaCerdas', 'rare');
    equip(run, 'amulet', 'amuletoBrasa', 'rare');
    const c = makeCombat({ run, enemies: [{ id: 'golemMusgo', x: 3, y: 2 }] });
    castSpell(c, hero(c), 'espadaIgnea', { x: 3, y: 2 });
    expect(hasStatus(enemies(c)[0], 'quemadura')).toBe(true);
  });

  it('sin la tercera pieza no hay quemadura', () => {
    const run = makeRun('furiak');
    equip(run, 'hat', 'yelmoColmillo', 'rare');
    equip(run, 'cloak', 'capaCerdas', 'rare');
    const c = makeCombat({ run, enemies: [{ id: 'golemMusgo', x: 3, y: 2 }] });
    castSpell(c, hero(c), 'espadaIgnea', { x: 3, y: 2 });
    expect(hasStatus(enemies(c)[0], 'quemadura')).toBe(false);
  });

  it('Bloblín se divide al morir', () => {
    const c = makeCombat({ enemies: [{ id: 'bloblin', x: 5, y: 5 }] });
    const b = enemies(c)[0];
    killUnit(c, b, hero(c), {});
    const minis = enemies(c).filter((u) => u.defId === 'bloblinMini' && !u.dead);
    expect(minis).toHaveLength(2);
    expect(c.turnOrder).toEqual(expect.arrayContaining(minis.map((m) => m.id)));
  });

  it('prevención de bucles: espinas contra espinas termina', () => {
    const run = makeRun('furiak');
    equip(run, 'shield', 'escudoEspinas', 'legendary');
    const c = makeCombat({ run, enemies: [{ id: 'golemAncestral', x: 3, y: 2 }], modifiers: ['espinasOniricas'] });
    const h = hero(c);
    const e = enemies(c)[0];
    const hpH = h.hp;
    castSpell(c, h, 'presion', { x: 3, y: 2 });
    expect(h.hp).toBeLessThan(hpH);
    expect(c.triggerBudget).toBeGreaterThan(0);
    expect(e.hp).toBeLessThan(e.maxHp);
  });

  it('un disparador autorreferente nunca supera el presupuesto', () => {
    const c = makeCombat({ enemies: [{ id: 'golemAncestral', x: 3, y: 2 }] });
    const h = hero(c);
    h.sources.push({
      id: 'loop', kind: 'test', name: 'Bucle',
      triggers: [{ event: 'dealDamage', maxDepth: 99, actions: [{ type: 'damage', target: 'payloadTarget', element: 'neutral', fixed: true, value: 1 }] }],
    });
    c.triggerBudget = TRIGGER_BUDGET;
    applyDamage(c, { source: h, target: enemies(c)[0], amount: 1 });
    // La profundidad máxima corta la cadena mucho antes de agotar el presupuesto.
    expect(c.triggerBudget).toBeGreaterThan(TRIGGER_BUDGET - 10);
  });
});

describe('bombas del Petardista', () => {
  it('se cargan al inicio del turno del dueño y explotan en cadena', () => {
    const run = makeRun('petardista');
    const c = makeCombat({ run, enemies: [{ id: 'golemAncestral', x: 6, y: 2 }] });
    const h = hero(c);
    placeBombs(c, h, { x: 4, y: 2 });
    placeBombs(c, h, { x: 5, y: 3 });
    expect(bombsOf(c, h)).toHaveLength(2);
    forceTurn(c, h.id);
    expect(bombsOf(c, h).every((b) => b.charge === 1)).toBe(true);
    const e = enemies(c)[0];
    const hp = e.hp + e.shields.reduce((a, s) => a + s.value, 0);
    explodeBombs(c, [bombsOf(c, h)[0]]);
    expect(bombsOf(c, h)).toHaveLength(0);
    expect(e.hp + e.shields.reduce((a, s) => a + s.value, 0)).toBeLessThan(hp);
    const explosions = c.fx.filter((f) => f.type === 'explosion');
    expect(explosions).toHaveLength(2);
  });

  it('el elemento de la bomba depende del equipo', () => {
    const run = makeRun('petardista');
    equip(run, 'ring1', 'anilloCoral', 'rare', 8);
    equip(run, 'ring2', 'anilloBruma', 'rare', 8);
    equip(run, 'cloak', 'capaBosque', 'rare', 8);
    const c = makeCombat({ run, enemies: [{ id: 'larvazul', x: 6, y: 2 }] });
    const h = hero(c);
    expect(h.dominantElement).toBe('water');
    const [bomb] = placeBombs(c, h, { x: 4, y: 2 });
    expect(bomb.element).toBe('water');
  });

  it('respeta el máximo de bombas', () => {
    const run = makeRun('petardista');
    const c = makeCombat({ run, enemies: [{ id: 'larvazul', x: 8, y: 8 }] });
    const h = hero(c);
    h.ap = 99;
    castSpell(c, h, 'bomba', { x: 3, y: 2 });
    castSpell(c, h, 'bomba', { x: 2, y: 4 });
    forceTurn(c, h.id);
    castSpell(c, h, 'bomba', { x: 1, y: 2 });
    expect(() => castSpell(c, h, 'bomba', { x: 2, y: 0 })).toThrow(/Máximo de bombas/);
  });
});

describe('regresiones de la revisión de combate', () => {
  it('la explosión del set Carmesí (4) usa la vida máxima del enemigo que muere', () => {
    const run = makeRun('furiak');
    equip(run, 'hat', 'yelmoColmillo', 'rare');
    equip(run, 'cloak', 'capaCerdas', 'rare');
    equip(run, 'amulet', 'amuletoBrasa', 'rare');
    equip(run, 'boots', 'botasPezuna', 'rare');
    const c = makeCombat({ run, enemies: [{ id: 'plumin', x: 3, y: 2 }, { id: 'golemAncestral', x: 4, y: 2 }] });
    const [plumin, golem] = enemies(c);
    applyStatus(c, plumin, 'quemadura', { value: 3, duration: 2, sourceId: c.heroId });
    const before = golem.hp + golem.shields.reduce((a, s) => a + s.value, 0);
    killUnit(c, plumin, hero(c), {});
    const lost = before - (golem.hp + golem.shields.reduce((a, s) => a + s.value, 0));
    // 30% de la vida máxima del Plumín (no la del Gólem), antes de resistencias.
    expect(lost).toBeLessThanOrEqual(Math.ceil(plumin.maxHp * 0.3));
    expect(lost).toBeGreaterThan(0);
  });

  it('un Bloblín se divide aunque muera en una cadena profunda', () => {
    const c = makeCombat({ enemies: [{ id: 'bloblin', x: 5, y: 5 }] });
    const b = enemies(c)[0];
    killUnit(c, b, hero(c), { depth: 3 });
    expect(enemies(c).filter((u) => u.defId === 'bloblinMini' && !u.dead)).toHaveLength(2);
  });

  it('Atraer nunca lleva al objetivo más allá del lanzador', async () => {
    const { pullUnit } = await import('../src/core/combat/effects.js');
    const c = makeCombat({ enemies: [{ id: 'larvazul', x: 4, y: 3 }] });
    const e = enemies(c)[0];
    pullUnit(c, e, hero(c), 5);
    expect(Math.abs(e.x - 2) + Math.abs(e.y - 2)).toBe(1);
  });

  it('el tope de invocaciones de monstruos cuenta refuerzos de nivel normal', async () => {
    const { canCast } = await import('../src/core/combat/spellcast.js');
    const { spawnMonster } = await import('../src/core/combat/effects.js');
    const c = makeCombat({ enemies: [{ id: 'brujoKobold', x: 7, y: 7 }] });
    const brujo = enemies(c)[0];
    for (const [x, y] of [[6, 7], [7, 6], [5, 7], [7, 5]]) spawnMonster(c, 'koboldChispero', { x, y }, brujo, { bindTo: brujo });
    forceTurn(c, brujo.id);
    const spell = brujo.spells.find((s) => s.id === 'invocarKobold');
    expect(canCast(c, brujo, spell, { x: 8, y: 7 }).reason).toMatch(/Máximo de invocaciones/);
  });

  it('en el turno automático cada hechizo cuenta como una acción (Ira)', async () => {
    const { combatAction } = await import('../src/core/combat/actions.js');
    const c = makeCombat({ enemies: [{ id: 'golemAncestral', x: 3, y: 2 }] });
    combatAction(c, { type: 'autoTurn' });
    const h = hero(c);
    const casts = c.log.filter((l) => l.text.startsWith('Furiak lanza')).length;
    const ira = h.statuses.find((s) => s.statusId === 'ira')?.stacks ?? 0;
    if (casts >= 2) expect(ira).toBeGreaterThanOrEqual(2);
  });
});
