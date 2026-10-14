import { STATUSES } from '../../content/statuses.js';
import { checkConditions } from '../effects/conditions.js';
import { resolveValue } from '../effects/values.js';
import { chance } from '../rng.js';
import { addFx } from './state.js';
import { executeEffects } from './effects.js';

// Sistema de disparadores. Cada unidad tiene fuentes (clase, talentos, objetos,
// sets, reliquias, modificadores, pasivas de monstruo) y estados con disparadores.
// Prevención de bucles:
//  1) profundidad: los efectos de un disparador emiten eventos con depth + 1;
//     cada disparador tiene maxDepth (por defecto 1) y hay un tope global.
//  2) presupuesto: cada acción de nivel superior tiene un número máximo de disparos.
//  3) límites por turno, por combate y por acción.

export const MAX_DEPTH = 3;
export const TRIGGER_BUDGET = 250;

function collectTriggers(owner) {
  const out = [];
  for (const src of owner.sources ?? []) {
    (src.triggers ?? []).forEach((t, i) => out.push({ trigger: t, source: src, key: `${src.id}#${i}` }));
  }
  for (const st of owner.statuses) {
    const def = STATUSES[st.statusId];
    (def?.triggers ?? []).forEach((t, i) => out.push({ trigger: t, source: { id: `status:${def.id}`, name: def.name }, key: `status:${def.id}#${i}` }));
  }
  return out;
}

function limitsAllow(combat, owner, key, limit) {
  if (!limit) return true;
  const c = owner.triggerCounters[key];
  if (!c) return true;
  if (limit.perTurn !== undefined && c.turnId === combat.turnCounter && c.turnCount >= limit.perTurn) return false;
  if (limit.perCombat !== undefined && c.combatCount >= limit.perCombat) return false;
  if (limit.perAction !== undefined && c.actionId === combat.actionSeq && c.actionCount >= limit.perAction) return false;
  return true;
}

function bumpLimits(combat, owner, key) {
  const c = owner.triggerCounters[key] ?? { turnId: -1, turnCount: 0, combatCount: 0, actionId: -1, actionCount: 0 };
  if (c.turnId !== combat.turnCounter) {
    c.turnId = combat.turnCounter;
    c.turnCount = 0;
  }
  if (c.actionId !== combat.actionSeq) {
    c.actionId = combat.actionSeq;
    c.actionCount = 0;
  }
  c.turnCount++;
  c.combatCount++;
  c.actionCount++;
  owner.triggerCounters[key] = c;
}

/** Dispara los efectos de los disparadores de `ownerId` para `event`. */
export function fireTriggers(combat, ownerId, event, payload = {}) {
  const owner = combat.units[ownerId];
  if (!owner) return;
  if (owner.dead && event !== 'death') return;
  const depth = payload.depth ?? 0;
  if (depth > MAX_DEPTH) return;
  const entries = collectTriggers(owner)
    .filter((e) => e.trigger.event === event)
    .sort((a, b) => (b.trigger.priority ?? 0) - (a.trigger.priority ?? 0));
  for (const { trigger, source, key } of entries) {
    if (combat.triggerBudget <= 0) return;
    if (owner.dead && event !== 'death') return;
    if ((trigger.maxDepth ?? 1) < depth) continue;
    const ctx = { combat, owner, payload };
    if (!checkConditions(trigger.conditions, ctx)) continue;
    if (!limitsAllow(combat, owner, key, trigger.limit)) continue;
    if (trigger.chance !== undefined && !chance(combat.rng, trigger.chance)) continue;
    bumpLimits(combat, owner, key);
    combat.triggerBudget -= 1;
    if (!trigger.silent) addFx(combat, { type: 'proc', unitId: owner.id, text: source.name });
    executeEffects(combat, trigger.actions, {
      caster: owner,
      depth: depth + 1,
      payload,
      origin: 'trigger',
      sourceName: source.name,
    });
  }
}

/**
 * Disparadores modificadores (beforeDealDamage / beforeTakeDamage / beforeHeal):
 * no ejecutan efectos, devuelven ajustes { pct, flat }. En modo previsualización
 * se ignoran los que dependen del azar y no se consumen límites.
 */
export function collectModifiers(combat, ownerId, event, payload, preview = false) {
  const out = { pct: 0, flat: 0 };
  const owner = combat.units[ownerId];
  if (!owner || owner.dead) return out;
  const depth = payload.depth ?? 0;
  for (const { trigger, key } of collectTriggers(owner)) {
    if (trigger.event !== event) continue;
    if ((trigger.maxDepth ?? 1) < depth) continue;
    const ctx = { combat, owner, payload, preview };
    if (!checkConditions(trigger.conditions, ctx)) continue;
    if (!limitsAllow(combat, owner, key, trigger.limit)) continue;
    if (trigger.chance !== undefined) {
      if (preview) continue;
      if (!chance(combat.rng, trigger.chance)) continue;
    }
    if (!preview && trigger.limit) bumpLimits(combat, owner, key);
    for (const action of trigger.actions) {
      if (action.type !== 'modifyDamage') continue;
      out.pct += resolveValue(action.pct ?? 0, ctx);
      out.flat += resolveValue(action.flat ?? 0, ctx);
    }
  }
  return out;
}
