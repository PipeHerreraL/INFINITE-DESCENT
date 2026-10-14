import { STATUSES } from '../../content/statuses.js';
import { key, DIRS } from '../grid/geometry.js';

export const FX_LIMIT = 80;
export const LOG_LIMIT = 120;

export function unitsList(combat) {
  return combat.unitOrder.map((id) => combat.units[id]);
}

export function livingUnits(combat) {
  return unitsList(combat).filter((u) => !u.dead);
}

export function unitAt(combat, x, y) {
  for (const id of combat.unitOrder) {
    const u = combat.units[id];
    if (!u.dead && u.x === x && u.y === y) return u;
  }
  return null;
}

export function occupancySet(combat, exceptId = null) {
  const set = new Set();
  for (const u of livingUnits(combat)) if (u.id !== exceptId) set.add(key(u.x, u.y));
  return set;
}

export function isEnemy(a, b) {
  return a.side !== b.side;
}

export function enemiesOf(combat, unit) {
  return livingUnits(combat).filter((u) => u.side !== unit.side);
}

export function alliesOf(combat, unit) {
  return livingUnits(combat).filter((u) => u.side === unit.side);
}

export function getHero(combat) {
  return combat.units[combat.heroId];
}

/** Puede placar: unidad viva, no bomba y no estática. */
export function canLock(u) {
  return !u.dead && u.kind !== 'bomb' && u.ai?.profile !== 'static';
}

export function adjacentEnemies(combat, unit, cell = unit) {
  const out = [];
  for (const d of DIRS) {
    const other = unitAt(combat, cell.x + d.x, cell.y + d.y);
    if (other && other.side !== unit.side && canLock(other)) out.push(other);
  }
  return out;
}

/** Estadísticas actuales: base + estados. */
export function getStats(unit) {
  const s = { ...unit.baseStats };
  for (const st of unit.statuses) {
    const def = STATUSES[st.statusId];
    if (!def?.stats) continue;
    const mult = def.stack === 'stack' ? st.stacks : 1;
    for (const [k, v] of Object.entries(def.stats)) {
      let val = v;
      if (v === 'value') val = st.value ?? 0;
      else if (v === '-value') val = -(st.value ?? 0);
      s[k] = (s[k] || 0) + val * mult;
    }
  }
  return s;
}

export function hasStatus(unit, statusId) {
  return unit.statuses.some((s) => s.statusId === statusId);
}

export function statusFlag(unit, flag) {
  return unit.statuses.some((s) => STATUSES[s.statusId]?.[flag]);
}

export function totalShield(unit) {
  return unit.shields.reduce((a, s) => a + s.value, 0);
}

export function addLog(combat, text, kind = 'info') {
  combat.seq.log += 1;
  combat.log.push({ id: combat.seq.log, text, kind, round: combat.round });
  if (combat.log.length > LOG_LIMIT) combat.log.splice(0, combat.log.length - LOG_LIMIT);
}

export function addFx(combat, fx) {
  combat.seq.fx += 1;
  combat.fx.push({ id: combat.seq.fx, act: combat.actionSeq, ...fx });
  if (combat.fx.length > FX_LIMIT) combat.fx.splice(0, combat.fx.length - FX_LIMIT);
}

export function activeUnit(combat) {
  return combat.activeId ? combat.units[combat.activeId] : null;
}

export function isPlayerControlled(combat, unit) {
  return unit && unit.id === combat.heroId;
}
