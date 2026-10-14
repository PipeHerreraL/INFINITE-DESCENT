import { key, DIRS } from '../grid/geometry.js';
import { reachableCells, pathFromReach } from '../grid/pathfinding.js';
import { assertRule } from '../errors.js';
import { clamp } from '../utils.js';
import { getStats, adjacentEnemies, enemiesOf, occupancySet, canLock, addFx, addLog } from './state.js';
import { fireTriggers } from './triggers.js';
import { challengeEvent } from './challenges.js';

/**
 * Placaje y huida (Dofus): al abandonar una casilla adyacente a enemigos se
 * pierde una fracción de los PM según la relación Huida / Placaje.
 * La agilidad aporta +1 de placaje y huida por cada 10 puntos.
 */
export function tackleLoss(combat, unit) {
  const adj = adjacentEnemies(combat, unit);
  if (!adj.length || unit.mp <= 0) return 0;
  const s = getStats(unit);
  const dodge = (s.dodge || 0) + Math.floor((s.agility || 0) / 10);
  const lock = adj.reduce((acc, e) => {
    const es = getStats(e);
    return acc + (es.lock || 0) + Math.floor((es.agility || 0) / 10);
  }, 0);
  const ratio = clamp((dodge + 2) / (2 * (lock + 2)), 0, 1);
  return Math.floor(unit.mp * (1 - ratio));
}

/**
 * Casillas alcanzables este turno. Las casillas adyacentes a un enemigo son
 * zona de control: se puede entrar en ellas, pero el movimiento termina ahí.
 */
export function movementMap(combat, unit) {
  const loss = tackleLoss(combat, unit);
  const effMp = Math.max(0, unit.mp - loss);
  const occ = occupancySet(combat, unit.id);
  const zoc = new Set();
  for (const e of enemiesOf(combat, unit)) {
    if (!canLock(e)) continue;
    for (const d of DIRS) zoc.add(key(e.x + d.x, e.y + d.y));
  }
  const reach = reachableCells(
    combat.board,
    { x: unit.x, y: unit.y },
    effMp,
    (x, y) => occ.has(key(x, y)),
    (x, y) => zoc.has(key(x, y)),
  );
  return { reach, loss, effMp };
}

export function moveUnit(combat, unit, target) {
  assertRule(!(target.x === unit.x && target.y === unit.y), 'Ya estás en esa casilla.');
  assertRule(unit.mp > 0, 'No te quedan PM.');
  const { reach, loss } = movementMap(combat, unit);
  const path = pathFromReach(reach, target);
  assertRule(path && path.length > 0, 'No puedes llegar a esa casilla.');
  if (loss > 0) {
    unit.mp -= loss;
    addFx(combat, { type: 'text', unitId: unit.id, text: `Placado −${loss} PM`, color: '#e76f51' });
    addLog(combat, `${unit.name} es placado y pierde ${loss} PM.`, 'warn');
  }
  const from = { x: unit.x, y: unit.y };
  unit.mp -= path.length;
  unit.x = target.x;
  unit.y = target.y;
  unit.turnFlags.moved += path.length;
  addFx(combat, { type: 'move', unitId: unit.id, path: [from, ...path] });
  challengeEvent(combat, 'move', { unit });
  fireTriggers(combat, unit.id, 'moveEnd', { depth: 0, moved: path.length });
  return path;
}
