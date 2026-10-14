import { ELEMENTS } from '../../content/elements.js';
import { areaCells, isFloor, DIRS } from '../grid/geometry.js';
import { shuffle } from '../rng.js';
import { livingUnits, unitAt, getStats, addFx, addLog } from './state.js';
import { baseUnit, registerUnit } from './units.js';
import { executeEffects } from './effects.js';
import { fireTriggers } from './triggers.js';

// Bombas del Petardista: unidades estáticas aliadas, sin turno propio.
// Se cargan al inicio del turno de su dueño y explotan al detonarlas o morir.
// Las bombas alcanzadas por una explosión estallan en cadena.

export const BOMB_AREA = { shape: 'circle', size: 2 };
export const BOMB_BASE = [12, 15];
export const BOMB_CHARGE_STEP = 0.25;

export function bombsOf(combat, owner) {
  return livingUnits(combat).filter((u) => u.kind === 'bomb' && u.ownerId === owner.id);
}

export function bombLimit(owner) {
  return Math.max(1, getStats(owner).bombMax || 3);
}

function createBomb(combat, owner, cell) {
  const s = getStats(owner);
  const hp = 16 + 2 * ((owner.level ?? 1) - 1);
  const bomb = baseUnit({
    name: 'Bomba',
    side: owner.side,
    kind: 'bomb',
    defId: 'bomb',
    tier: 'bomb',
    sprite: { shape: 'bomb', color: ELEMENTS[owner.dominantElement]?.color ?? '#333' },
    x: cell.x,
    y: cell.y,
    hp,
    maxHp: hp,
    baseStats: { lock: 0, dodge: 0 },
    ownerId: owner.id,
    element: owner.dominantElement,
    charge: Math.min(s.bombStartCharge || 0, s.bombChargeMax || 3),
    exploded: false,
    ai: { profile: 'static' },
  });
  registerUnit(combat, bomb);
  addFx(combat, { type: 'summon', unitId: bomb.id });
  return bomb;
}

/** Coloca una bomba (y opcionalmente otras en casillas adyacentes libres). */
export function placeBombs(combat, owner, cell, extraAdjacent = 0) {
  const placed = [];
  if (!cell || bombsOf(combat, owner).length >= bombLimit(owner)) return placed;
  if (!isFloor(combat.board, cell.x, cell.y) || unitAt(combat, cell.x, cell.y)) return placed;
  placed.push(createBomb(combat, owner, cell));
  if (extraAdjacent > 0) {
    const free = shuffle(
      combat.rng,
      DIRS.map((d) => ({ x: cell.x + d.x, y: cell.y + d.y })).filter((c) => isFloor(combat.board, c.x, c.y) && !unitAt(combat, c.x, c.y)),
    );
    for (const c of free.slice(0, extraAdjacent)) {
      if (bombsOf(combat, owner).length >= bombLimit(owner)) break;
      placed.push(createBomb(combat, owner, c));
    }
  }
  addLog(combat, `${owner.name} coloca ${placed.length > 1 ? `${placed.length} bombas` : 'una bomba'}.`, 'info');
  return placed;
}

export function chargeBombs(combat, owner, amount = 1) {
  const max = getStats(owner).bombChargeMax || 3;
  for (const b of bombsOf(combat, owner)) {
    if (b.charge < max) {
      b.charge = Math.min(max, b.charge + amount);
      addFx(combat, { type: 'text', unitId: b.id, text: `Carga ${b.charge}`, color: '#ffd166' });
    }
  }
}

/** Efectos de una explosión según elemento y carga. */
export function explosionEffects(element, charge) {
  const mult = 1 + BOMB_CHARGE_STEP * charge;
  const min = Math.round(BOMB_BASE[0] * mult);
  const max = Math.round(BOMB_BASE[1] * mult);
  const effects = [{ type: 'damage', element, min, max }];
  switch (element) {
    case 'fire':
      effects.push({ type: 'status', status: 'quemadura', value: 3, stacks: 1, duration: 2 });
      break;
    case 'earth':
      effects.push({ type: 'push', distance: 1, from: 'center' });
      break;
    case 'water':
      effects.push({ type: 'heal', value: Math.round(((min + max) / 2) * 0.3), fixed: true, affects: 'allies' });
      break;
    case 'air':
      effects.push({ type: 'mp', value: -1 });
      break;
    default:
  }
  return effects;
}

export function explosionSpell(element) {
  return { id: 'explosion', name: 'Explosión', tags: ['bomb', element], melee: false, isWeapon: false, element };
}

/** Explosión en cadena. */
export function explodeBombs(combat, startBombs, { depth = 0, bonusCharge = 0 } = {}) {
  const queue = startBombs.map((b) => ({ bomb: b, chain: 0 }));
  for (const b of startBombs) if (bonusCharge) b.charge += bonusCharge;
  let guard = 0;
  while (queue.length && guard++ < 50) {
    const { bomb, chain } = queue.shift();
    if (bomb.exploded) continue;
    bomb.exploded = true;
    bomb.dead = true;
    bomb.hp = 0;
    const owner = combat.units[bomb.ownerId] ?? bomb;
    const center = { x: bomb.x, y: bomb.y };
    const cells = areaCells(combat.board, BOMB_AREA, center);
    const element = bomb.element ?? 'fire';
    addFx(combat, { type: 'explosion', x: center.x, y: center.y, cells, element, charge: bomb.charge });
    addLog(combat, `¡Explosión${chain ? ` en cadena ×${chain + 1}` : ''}! (carga ${bomb.charge}, ${ELEMENTS[element]?.name ?? element})`, 'bomb');
    executeEffects(combat, explosionEffects(element, bomb.charge), {
      caster: owner,
      spell: explosionSpell(element),
      targetCell: center,
      centerCell: center,
      areaCells: cells,
      depth,
      chainIndex: chain,
      origin: 'bomb',
      isCrit: false,
    });
    if (!owner.dead && owner.id !== bomb.id) fireTriggers(combat, owner.id, 'bombExplode', { depth, chainIndex: chain, cell: center });
    for (const c of cells) {
      const u = unitAt(combat, c.x, c.y);
      if (u && u.kind === 'bomb' && !u.exploded && u.ownerId === bomb.ownerId) queue.push({ bomb: u, chain: chain + 1 });
    }
  }
}
