import { getStats, livingUnits, getHero, addLog, addFx, statusFlag } from './state.js';
import { resetTurnFlags } from './units.js';
import { tickStatusesAtTurnStart, decrementStatuses, applyStatus } from './statuses.js';
import { fireTriggers } from './triggers.js';
import { resolveTelegraphs } from './telegraph.js';
import { chargeBombs, bombsOf } from './bombs.js';
import { challengeEvent, finalizeChallenge } from './challenges.js';

// Gestión de turnos. Orden por iniciativa; las invocaciones actúan justo
// después de su invocador; las bombas no tienen turno.

export const NIGHTMARE_ROUND = 15;
export const HARD_ROUND_LIMIT = 60;

export function computeTurnOrder(combat) {
  const order = livingUnits(combat).filter((u) => u.kind !== 'bomb');
  order.sort((a, b) => {
    const ia = getStats(a).initiative || 0;
    const ib = getStats(b).initiative || 0;
    if (ib !== ia) return ib - ia;
    if (a.side !== b.side) return a.side === 'player' ? -1 : 1;
    return combat.unitOrder.indexOf(a.id) - combat.unitOrder.indexOf(b.id);
  });
  return order.map((u) => u.id);
}

export function startCombat(combat) {
  combat.phase = 'active';
  combat.turnOrder = computeTurnOrder(combat);
  combat.turnIndex = -1;
  combat.round = 0;
  addLog(combat, '¡Comienza el combate!', 'good');
  for (const u of livingUnits(combat)) {
    u.turnFlags.startCell = { x: u.x, y: u.y };
    fireTriggers(combat, u.id, 'combatJoin', { depth: 0 });
    fireTriggers(combat, u.id, 'combatStart', { depth: 0 });
  }
  advance(combat);
}

function startRound(combat) {
  combat.round += 1;
  addLog(combat, `— Ronda ${combat.round} —`, 'round');
  if (combat.round > NIGHTMARE_ROUND) {
    if (combat.round === NIGHTMARE_ROUND + 1) {
      addFx(combat, { type: 'banner', text: 'El sueño se derrumba', warn: true });
      addLog(combat, 'El sueño se derrumba: todos reciben cada vez más daño.', 'warn');
    }
    for (const u of livingUnits(combat)) {
      if (u.kind !== 'bomb') applyStatus(combat, u, 'pesadilla', { stacks: 1, duration: -1 });
    }
  }
  challengeEvent(combat, 'roundStart', {});
}

/** Inicio de turno. Devuelve 'act' si la unidad puede actuar o 'skip'. */
export function beginTurn(combat, unit) {
  combat.turnCounter += 1;
  resetTurnFlags(unit);
  unit.casts = {};
  unit.castsOnTarget = {};
  for (const k of Object.keys(unit.cooldowns)) {
    if (unit.cooldowns[k] > 0) unit.cooldowns[k] -= 1;
  }
  unit.shields = unit.shields
    .map((s) => (s.turns === -1 ? s : { ...s, turns: s.turns - 1 }))
    .filter((s) => s.turns === -1 || s.turns > 0);
  const s = getStats(unit);
  unit.ap = Math.max(0, s.ap || 0);
  unit.mp = Math.max(0, s.mp || 0);

  if (bombsOf(combat, unit).length) chargeBombs(combat, unit, 1);
  if (unit.telegraphs.length) resolveTelegraphs(combat, unit);
  if (unit.dead) return 'skip';
  tickStatusesAtTurnStart(combat, unit);
  if (unit.dead) return 'skip';
  fireTriggers(combat, unit.id, 'turnStart', { depth: 0 });
  challengeEvent(combat, 'turnStart', { unit });
  if (unit.dead) return 'skip';
  if (statusFlag(unit, 'skipTurn')) {
    addLog(combat, `${unit.name} está aturdido y pierde el turno.`, 'warn');
    addFx(combat, { type: 'text', unitId: unit.id, text: 'Aturdido', color: '#f4d35e' });
    return 'skip';
  }
  if (unit.ai?.profile === 'static' && unit.id !== combat.heroId) return 'skip';
  return 'act';
}

export function finishTurn(combat, unit) {
  if (!unit.dead) {
    fireTriggers(combat, unit.id, 'turnEnd', { depth: 0 });
    challengeEvent(combat, 'turnEnd', { unit });
  }
  if (!unit.dead) decrementStatuses(combat, unit);
}

/** Comprueba victoria/derrota. Devuelve true si el combate ha terminado. */
export function checkEnd(combat) {
  if (combat.phase === 'victory' || combat.phase === 'defeat') return true;
  if (combat.phase !== 'active') return false;
  const hero = getHero(combat);
  if (!hero || hero.dead) {
    combat.phase = 'defeat';
    combat.activeId = null;
    addLog(combat, 'Has caído en el sueño…', 'hurt');
    return true;
  }
  const enemiesAlive = livingUnits(combat).some((u) => u.side === 'enemy');
  if (!enemiesAlive) {
    combat.phase = 'victory';
    combat.activeId = null;
    finalizeChallenge(combat);
    addLog(combat, '¡Victoria!', 'good');
    return true;
  }
  if (combat.round > HARD_ROUND_LIMIT) {
    combat.phase = 'defeat';
    combat.activeId = null;
    addLog(combat, 'El sueño te ha consumido.', 'hurt');
    return true;
  }
  return false;
}

/** Pasa al siguiente turno, saltando muertos y aturdidos. */
export function advance(combat) {
  for (let guard = 0; guard < 400; guard++) {
    if (checkEnd(combat)) return;
    let idx = combat.turnIndex + 1;
    if (idx >= combat.turnOrder.length) idx = 0;
    if (idx === 0) startRound(combat);
    combat.turnIndex = idx;
    const unit = combat.units[combat.turnOrder[idx]];
    if (!unit || unit.dead) continue;
    combat.activeId = unit.id;
    const r = beginTurn(combat, unit);
    if (checkEnd(combat)) return;
    if (r === 'act') return;
    finishTurn(combat, unit);
  }
}

export function endTurn(combat) {
  const unit = combat.units[combat.activeId];
  if (unit) finishTurn(combat, unit);
  advance(combat);
}
