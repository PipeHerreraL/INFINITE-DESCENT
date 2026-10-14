import { STATUSES } from '../../content/statuses.js';
import { getStats, addFx, addLog } from './state.js';
import { applyDamage, applyHeal } from './damage.js';
import { executeEffects } from './effects.js';

function maxStacksFor(unit, def) {
  if (def.id === 'ira') return Math.max(1, getStats(unit).rageMax || def.maxStacks || 5);
  return def.maxStacks ?? 1;
}

/**
 * Aplica (o refresca/acumula) un estado. Si el portador es la unidad activa y
 * el estado cambia sus PA/PM, el cambio se refleja de inmediato.
 * duration: número de finales de turno del portador; -1 = todo el combate.
 */
export function applyStatus(combat, target, statusId, { value = 0, duration = 1, stacks = 1, sourceId = null } = {}) {
  if (!target || target.dead) return null;
  const def = STATUSES[statusId];
  if (!def) throw new Error(`Estado desconocido: ${statusId}`);
  const before = combat.activeId === target.id ? getStats(target) : null;
  const max = maxStacksFor(target, def);
  let st = target.statuses.find((s) => s.statusId === statusId);
  if (st) {
    if (def.stack === 'stack') st.stacks = Math.min(max, st.stacks + stacks);
    st.value = Math.max(st.value ?? 0, value);
    st.duration = st.duration === -1 || duration === -1 ? -1 : Math.max(st.duration, duration);
    st.sourceId = sourceId ?? st.sourceId;
  } else {
    st = { statusId, stacks: Math.min(max, stacks), value, duration, sourceId };
    target.statuses.push(st);
  }
  if (before) {
    const after = getStats(target);
    target.ap = Math.max(0, target.ap + (after.ap - before.ap));
    target.mp = Math.max(0, target.mp + (after.mp - before.mp));
  }
  addFx(combat, { type: 'text', unitId: target.id, text: `${def.name}${def.stack === 'stack' ? ` ×${st.stacks}` : ''}`, color: def.color });
  return st;
}

export function removeStatus(combat, unit, statusId) {
  const idx = unit.statuses.findIndex((s) => s.statusId === statusId);
  if (idx >= 0) unit.statuses.splice(idx, 1);
}

/** Consume los estados marcados con `consumeOn` para ese evento. */
export function consumeStatuses(unit, event) {
  unit.statuses = unit.statuses.filter((s) => STATUSES[s.statusId]?.consumeOn !== event);
}

/** Daño y curación periódicos al inicio del turno del portador. */
export function tickStatusesAtTurnStart(combat, unit) {
  for (const st of [...unit.statuses]) {
    if (unit.dead) return;
    const def = STATUSES[st.statusId];
    if (def.dot) {
      const amount = (st.value || 1) * (def.stack === 'stack' ? st.stacks : 1);
      const source = st.sourceId ? combat.units[st.sourceId] : null;
      applyDamage(combat, {
        source: source && !source.dead ? source : null,
        target: unit,
        amount,
        element: def.dot.element,
        kind: 'dot',
        depth: 1,
        applyRes: true,
        label: def.name,
      });
    }
    if (def.hot) {
      applyHeal(combat, { source: unit, target: unit, amount: st.value || 1, depth: 1, kind: 'hot' });
    }
  }
}

/** Fin del turno del portador: se reducen las duraciones y expiran los estados. */
export function decrementStatuses(combat, unit) {
  for (const st of [...unit.statuses]) {
    if (st.duration === -1) continue;
    st.duration -= 1;
    if (st.duration <= 0) {
      const idx = unit.statuses.indexOf(st);
      if (idx >= 0) unit.statuses.splice(idx, 1);
      const def = STATUSES[st.statusId];
      if (def.onExpire && !unit.dead) {
        addLog(combat, `${unit.name}: ${def.name} se completa.`, 'warn');
        executeEffects(combat, def.onExpire, { caster: unit, depth: 1, origin: 'status', targetCell: { x: unit.x, y: unit.y } });
      }
    }
  }
}
