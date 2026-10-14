import { createRun, refreshHero } from '../src/core/run/run.js';
import { buildHeroProfile } from '../src/core/hero/profile.js';
import { createCombat } from '../src/core/combat/createCombat.js';
import { startCombat, beginTurn } from '../src/core/combat/turns.js';
import { createItem } from '../src/core/items/items.js';
import { key } from '../src/core/grid/geometry.js';

/** Tablero rectangular simple (todo suelo) para pruebas deterministas. */
export function makeBoard(w = 10, h = 10, { obstacles = [], holes = [] } = {}) {
  const cells = {};
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) cells[key(x, y)] = 'floor';
  for (const [x, y] of obstacles) cells[key(x, y)] = 'obstacle';
  for (const [x, y] of holes) cells[key(x, y)] = 'hole';
  return {
    cells,
    decor: {},
    style: 'meadow',
    playerStarts: [{ x: 0, y: 0 }, { x: 0, y: 1 }],
    enemyStarts: [{ x: w - 1, y: h - 1 }],
  };
}

export function makeRun(classId = 'furiak', seed = 'TEST') {
  return createRun({ classId, seed, unlocks: {} });
}

export function equip(run, slot, baseId, rarity = 'common', ilvl = 1) {
  run.hero.equipment[slot] = createItem(run.rng, baseId, rarity, ilvl, run.counters);
  refreshHero(run);
  return run.hero.equipment[slot];
}

/**
 * Combate controlado: posiciones fijas, tablero propio y turno del héroe.
 * enemies: [{ id, x, y }]
 */
export function makeCombat({ run = makeRun(), hero = { x: 2, y: 2 }, enemies = [{ id: 'plumin', x: 5, y: 2 }], board = makeBoard(), modifiers = [] } = {}) {
  const profile = buildHeroProfile(run);
  const combat = createCombat({
    run,
    profile,
    encounter: { kind: 'normal', enemies: enemies.map((e) => e.id), modifiers },
    seed: 'combat-test',
    floor: 1,
  });
  combat.board = board;
  const h = combat.units[combat.heroId];
  h.x = hero.x;
  h.y = hero.y;
  const foes = combat.unitOrder.map((id) => combat.units[id]).filter((u) => u.side === 'enemy');
  foes.forEach((u, i) => {
    u.x = enemies[i].x;
    u.y = enemies[i].y;
  });
  startCombat(combat);
  forceTurn(combat, combat.heroId);
  return combat;
}

/** Fuerza el turno de una unidad (reinicia sus PA/PM como al inicio de turno). */
export function forceTurn(combat, unitId) {
  combat.turnIndex = combat.turnOrder.indexOf(unitId);
  combat.activeId = unitId;
  beginTurn(combat, combat.units[unitId]);
  return combat.units[unitId];
}

export function hero(combat) {
  return combat.units[combat.heroId];
}

export function enemies(combat) {
  return combat.unitOrder.map((id) => combat.units[id]).filter((u) => u.side === 'enemy');
}

/** Juega automáticamente un combate completo (IA en ambos bandos). */
export function autoplay(combat, { maxSteps = 4000 } = {}) {
  // Importación diferida para evitar ciclos en los tests que no la necesitan.
  return import('../src/core/combat/actions.js').then(({ combatAction }) => {
    let steps = 0;
    while ((combat.phase === 'active' || combat.phase === 'placement') && steps++ < maxSteps) {
      if (combat.phase === 'placement') combatAction(combat, { type: 'ready' });
      else if (combat.activeId === combat.heroId) combatAction(combat, { type: 'autoTurn' });
      else combatAction(combat, { type: 'aiStep' });
    }
    return steps;
  });
}
