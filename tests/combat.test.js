import { describe, it, expect } from 'vitest';
import { combatAction } from '../src/core/combat/actions.js';
import { castSpell, canCast } from '../src/core/combat/spellcast.js';
import { moveUnit, tackleLoss } from '../src/core/combat/movement.js';
import { computeDamage, applyDamage, applyShield } from '../src/core/combat/damage.js';
import { applyStatus } from '../src/core/combat/statuses.js';
import { endTurn } from '../src/core/combat/turns.js';
import { pushUnit } from '../src/core/combat/effects.js';
import { RuleError } from '../src/core/errors.js';
import { getStats, totalShield } from '../src/core/combat/state.js';
import { makeCombat, makeBoard, hero, enemies, forceTurn, makeRun } from './helpers.js';

describe('PA, PM y validación de acciones', () => {
  it('lanzar un hechizo consume exactamente sus PA', () => {
    const c = makeCombat({ enemies: [{ id: 'larvazul', x: 3, y: 2 }] });
    const h = hero(c);
    const ap = h.ap;
    castSpell(c, h, 'presion', { x: 3, y: 2 });
    expect(h.ap).toBe(ap - 3);
  });

  it('no se puede lanzar sin PA suficientes', () => {
    const c = makeCombat({ enemies: [{ id: 'larvazul', x: 3, y: 2 }] });
    const h = hero(c);
    h.ap = 2;
    expect(() => castSpell(c, h, 'presion', { x: 3, y: 2 })).toThrow(RuleError);
    expect(h.ap).toBe(2);
  });

  it('respeta alcance, objetivo, lanzamientos por turno y enfriamiento', () => {
    const c = makeCombat({ enemies: [{ id: 'larvazul', x: 3, y: 2 }, { id: 'larvazul', x: 7, y: 7 }] });
    const h = hero(c);
    const presion = h.spells.find((s) => s.id === 'presion');
    expect(canCast(c, h, presion, { x: 7, y: 7 }).ok).toBe(false);
    expect(canCast(c, h, presion, { x: 2, y: 3 }).reason).toMatch(/enemigo/);
    h.ap = 99;
    castSpell(c, h, 'presion', { x: 3, y: 2 });
    castSpell(c, h, 'presion', { x: 3, y: 2 });
    expect(() => castSpell(c, h, 'presion', { x: 3, y: 2 })).toThrow(/agotado/);
    castSpell(c, h, 'gritoPoder', { x: 2, y: 2 });
    expect(h.cooldowns.gritoPoder).toBe(4);
    expect(() => castSpell(c, h, 'gritoPoder', { x: 2, y: 2 })).toThrow(/turno/);
  });

  it('la línea de visión impide lanzar', () => {
    const board = makeBoard(10, 10, { obstacles: [[4, 2]] });
    const run = makeRun('ensalmador');
    const c = makeCombat({ run, board, enemies: [{ id: 'plumin', x: 6, y: 2 }] });
    const h = hero(c);
    expect(canCast(c, h, h.spells.find((s) => s.id === 'palabraHiriente'), { x: 6, y: 2 }).reason).toMatch(/visión/);
  });

  it('moverse consume PM y no permite casillas ocupadas ni fuera de alcance', () => {
    const c = makeCombat({ enemies: [{ id: 'larvazul', x: 8, y: 8 }] });
    const h = hero(c);
    expect(h.mp).toBe(3);
    moveUnit(c, h, { x: 4, y: 2 });
    expect(h.mp).toBe(1);
    expect(() => moveUnit(c, h, { x: 4, y: 5 })).toThrow(RuleError);
    expect(h).toMatchObject({ x: 4, y: 2, mp: 1 });
  });

  it('no se puede actuar en el turno de otra unidad', () => {
    const c = makeCombat({ enemies: [{ id: 'larvazul', x: 8, y: 8 }] });
    forceTurn(c, enemies(c)[0].id);
    expect(() => combatAction(c, { type: 'move', x: 2, y: 3 })).toThrow(/turno/);
    expect(() => combatAction(c, { type: 'endTurn' })).toThrow(/turno/);
  });

  it('el placaje resta PM al salir de una casilla adyacente a enemigos', () => {
    const c = makeCombat({ enemies: [{ id: 'jabaliAcorazado', x: 3, y: 2 }] });
    const h = hero(c);
    const loss = tackleLoss(c, h);
    expect(loss).toBeGreaterThan(0);
    moveUnit(c, h, { x: 1, y: 2 });
    expect(h.mp).toBe(3 - loss - 1);
  });
});

describe('daño, escudos y resistencias', () => {
  it('escala con la característica del elemento y respeta resistencias', () => {
    const c = makeCombat({ enemies: [{ id: 'plumin', x: 3, y: 2 }] });
    const h = hero(c);
    const e = enemies(c)[0];
    const effect = { type: 'damage', element: 'earth', min: 10, max: 10 };
    const base = computeDamage(c, { caster: h, target: e, effect, mode: 'min' });
    h.baseStats.strength += 100;
    const boosted = computeDamage(c, { caster: h, target: e, effect, mode: 'min' });
    expect(boosted).toBeGreaterThan(base);
    e.baseStats.resEarth = 50;
    const resisted = computeDamage(c, { caster: h, target: e, effect, mode: 'min' });
    expect(resisted).toBeLessThan(boosted);
    expect(Math.abs(resisted - boosted * 0.5)).toBeLessThanOrEqual(1);
  });

  it('los escudos absorben el daño antes que la vida', () => {
    const c = makeCombat({ enemies: [{ id: 'larvazul', x: 3, y: 2 }] });
    const e = enemies(c)[0];
    applyShield(c, e, 10, 2);
    const hp = e.hp;
    applyDamage(c, { source: hero(c), target: e, amount: 14 });
    expect(totalShield(e)).toBe(0);
    expect(e.hp).toBe(hp - 4);
  });

  it('empujar contra un obstáculo inflige daño de colisión', () => {
    const board = makeBoard(10, 10, { obstacles: [[5, 2]] });
    const c = makeCombat({ board, enemies: [{ id: 'larvazul', x: 3, y: 2 }] });
    const e = enemies(c)[0];
    const hp = e.hp;
    pushUnit(c, e, { x: 1, y: 0 }, 3, hero(c));
    expect(e.x).toBe(4);
    expect(e.hp).toBeLessThan(hp);
  });

  it('las unidades estabilizadas no se desplazan', () => {
    const c = makeCombat({ enemies: [{ id: 'golemMusgo', x: 3, y: 2 }] });
    const e = enemies(c)[0];
    expect(e.statuses.some((s) => s.statusId === 'estabilizado')).toBe(true);
    pushUnit(c, e, { x: 1, y: 0 }, 2, hero(c));
    expect(e.x).toBe(3);
  });
});

describe('estados y turnos', () => {
  it('la quemadura daña al inicio del turno y expira', () => {
    const c = makeCombat({ enemies: [{ id: 'larvazul', x: 6, y: 6 }] });
    const e = enemies(c)[0];
    applyStatus(c, e, 'quemadura', { value: 3, duration: 2, sourceId: c.heroId });
    const hp = e.hp;
    forceTurn(c, e.id);
    expect(e.hp).toBeLessThan(hp);
    endTurn(c);
    expect(e.statuses.find((s) => s.statusId === 'quemadura').duration).toBe(1);
  });

  it('una unidad aturdida pierde su turno', () => {
    const c = makeCombat({ enemies: [{ id: 'larvazul', x: 6, y: 6 }] });
    const e = enemies(c)[0];
    applyStatus(c, e, 'aturdido', { duration: 1 });
    // Al terminar el turno del héroe, la larva queda aturdida y el turno vuelve al héroe.
    endTurn(c);
    expect(c.activeId).toBe(c.heroId);
    expect(e.statuses.some((s) => s.statusId === 'aturdido')).toBe(false);
  });

  it('quitar PM a un enemigo se aplica en su siguiente turno', () => {
    const run = makeRun('ensalmador');
    const c = makeCombat({ run, enemies: [{ id: 'jabaliAcorazado', x: 5, y: 2 }] });
    const e = enemies(c)[0];
    castSpell(c, hero(c), 'palabraHelada', { x: 5, y: 2 });
    expect(e.dead).toBe(false);
    forceTurn(c, e.id);
    expect(e.mp).toBe(getStats(e).mp);
    expect(e.mp).toBe(2);
  });
});

describe('victoria y derrota', () => {
  it('la victoria cierra el combate y bloquea más acciones', () => {
    const c = makeCombat({ enemies: [{ id: 'plumin', x: 3, y: 2 }] });
    const e = enemies(c)[0];
    e.hp = 1;
    combatAction(c, { type: 'cast', spellId: 'presion', x: 3, y: 2 });
    expect(c.phase).toBe('victory');
    expect(() => combatAction(c, { type: 'endTurn' })).toThrow(RuleError);
  });

  it('la derrota cierra el combate', () => {
    const c = makeCombat({ enemies: [{ id: 'plumin', x: 3, y: 2 }] });
    const h = hero(c);
    h.hp = 1;
    combatAction(c, { type: 'endTurn' });
    for (let i = 0; i < 30 && c.phase === 'active'; i++) combatAction(c, { type: 'aiStep' });
    expect(h.dead).toBe(true);
    expect(c.phase).toBe('defeat');
    expect(() => combatAction(c, { type: 'move', x: 2, y: 3 })).toThrow(RuleError);
  });
});
