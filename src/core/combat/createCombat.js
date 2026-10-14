import { createRng, fork, shuffle } from '../rng.js';
import { generateBoard } from '../grid/boardgen.js';
import { addLog } from './state.js';
import { createHeroUnit, createMonsterUnit, registerUnit, applyModifiers } from './units.js';
import { pickChallenge } from './challenges.js';
import { TRIGGER_BUDGET } from './triggers.js';

/**
 * Escalado de los enemigos según el piso, la dificultad y el descenso infinito.
 */
export function enemyScaling(floor, rules = {}, extra = 0) {
  return {
    hpMult: (1 + 0.1 * (floor - 1)) * (1 + (rules.enemyHpPct ?? 0) / 100) * (1 + 0.3 * extra),
    eliteHpMult: 1 + (rules.eliteHpPct ?? 0) / 100,
    power: 6 * (floor - 1) + 20 * extra,
    dmgPct: rules.enemyDmgPct ?? 0,
  };
}

/**
 * Crea el estado de un combate.
 * encounter: { kind, enemies: [monsterId], modifiers: [modId], style, challenge? }
 */
export function createCombat({ run, profile, encounter, seed, floor = 1, rules = {}, extraScaling = 0 }) {
  const rng = createRng(seed);
  const boardRng = fork(rng, 'board');
  const board = generateBoard(boardRng, {
    style: encounter.style ?? 'meadow',
    layout: encounter.kind === 'boss' ? 'arena' : undefined,
    obstacleRate: encounter.kind === 'boss' ? 0 : 0.1,
  });
  const combat = {
    id: seed,
    kind: encounter.kind,
    rng,
    board,
    units: {},
    unitOrder: [],
    turnOrder: [],
    turnIndex: -1,
    round: 0,
    turnCounter: 0,
    actionSeq: 0,
    triggerBudget: TRIGGER_BUDGET,
    phase: 'placement',
    activeId: null,
    seq: { unit: 0, fx: 0, log: 0, tele: 0 },
    log: [],
    fx: [],
    heroId: null,
    floor,
    scaling: enemyScaling(floor, rules, extraScaling),
    modifiers: [...(encounter.modifiers ?? [])],
    challenge: null,
    stats: { damageDealt: 0, damageTaken: 0, kills: 0, healing: 0 },
    encounter: { kind: encounter.kind, enemies: [...encounter.enemies], nodeType: encounter.nodeType ?? encounter.kind },
  };

  const hero = createHeroUnit(run, profile);
  const start = board.playerStarts[0];
  hero.x = start.x;
  hero.y = start.y;
  registerUnit(combat, hero);
  applyModifiers(combat, hero);
  combat.heroId = hero.id;

  const cells = shuffle(combat.rng, board.enemyStarts);
  encounter.enemies.forEach((monsterId, i) => {
    const cell = cells[i % cells.length];
    const unit = createMonsterUnit(combat, monsterId, { side: 'enemy' });
    unit.x = cell.x;
    unit.y = cell.y;
    registerUnit(combat, unit);
  });
  // Si hay más enemigos que casillas de inicio, se resuelven solapamientos.
  dedupePositions(combat);

  combat.challenge = pickChallenge(combat, encounter);
  addLog(combat, 'Fase de colocación: elige tu casilla de inicio.', 'info');
  return combat;
}

function dedupePositions(combat) {
  const seen = new Set();
  for (const id of combat.unitOrder) {
    const u = combat.units[id];
    let k = `${u.x},${u.y}`;
    if (!seen.has(k)) {
      seen.add(k);
      continue;
    }
    for (const kk of Object.keys(combat.board.cells)) {
      if (combat.board.cells[kk] !== 'floor' || seen.has(kk)) continue;
      const [x, y] = kk.split(',').map(Number);
      if (x - y < 2) continue;
      u.x = x;
      u.y = y;
      k = kk;
      break;
    }
    seen.add(k);
  }
}
