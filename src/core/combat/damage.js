import { ELEMENTS } from '../../content/elements.js';
import { MONSTERS } from '../../content/enemies/index.js';
import { int } from '../rng.js';
import { clamp } from '../utils.js';
import { resolveValue } from '../effects/values.js';
import { resolveSpell } from '../spells.js';
import { getStats, addFx, addLog, totalShield, unitsList } from './state.js';
import { fireTriggers, collectModifiers } from './triggers.js';
import { executeEffects } from './effects.js';
import { explodeBombs } from './bombs.js';
import { challengeEvent } from './challenges.js';

export const CRIT_MULT = 1.25;
export const COLLISION_BASE = 6;
export const RES_CAP = 60;

function rollRange(combat, min, max, mode) {
  if (mode === 'min') return min;
  if (mode === 'max') return max;
  if (mode === 'avg') return (min + max) / 2;
  return int(combat.rng, min, max);
}

export function resolveElement(effect, caster, payload) {
  if (effect.element === 'payload') return payload?.element ?? 'neutral';
  if (effect.element === 'dominant') return caster?.dominantElement ?? 'fire';
  return effect.element ?? 'neutral';
}

/** Aplica resistencias porcentuales y el multiplicador de daño recibido. */
export function mitigate(amount, target, element, { ignoreRes = false } = {}) {
  const ts = getStats(target);
  let dmg = amount;
  if (!ignoreRes) {
    const resKey = (ELEMENTS[element] ?? ELEMENTS.neutral).res;
    const res = clamp(ts[resKey] || 0, -50, RES_CAP);
    dmg *= 1 - res / 100;
  }
  dmg *= Math.max(0, 1 + (ts.damageTakenPct || 0) / 100);
  return Math.max(0, Math.round(dmg));
}

/**
 * Daño final de un efecto sobre un objetivo (ya mitigado).
 * mode: 'roll' (aplica azar y consume límites), 'min' | 'max' | 'avg' (previsualización).
 * Fórmula inspirada en Dofus:
 *   base × (100 + característica + potencia) / 100 [× crítico] + daños fijos
 *   × (1 + %daño final/cuerpo a cuerpo/distancia/arma/hechizos)
 *   → modificadores de disparadores → resistencias → daño recibido.
 */
export function computeDamage(combat, { caster, target, effect, spell = null, isCrit = false, mode = 'roll', depth = 0, chainIndex = 0, payload = null, kind = 'spell' }) {
  const element = resolveElement(effect, caster, payload);
  const fixed = !!effect.fixed || effect.value !== undefined;
  let dmg;
  if (effect.value !== undefined) {
    dmg = resolveValue(effect.value, { combat, owner: caster, target, payload, preview: mode !== 'roll' });
  } else {
    dmg = rollRange(combat, effect.min, effect.max, mode);
    if (effect.growPerCast && spell) dmg += effect.growPerCast * (caster?.uses?.[spell.id] ?? 0);
  }
  if (!fixed && caster) {
    const s = getStats(caster);
    const el = ELEMENTS[element] ?? ELEMENTS.neutral;
    dmg *= Math.max(0, 100 + (s[el.stat] || 0) + (s.power || 0)) / 100;
    if (isCrit) dmg *= CRIT_MULT;
    dmg += (s.damage || 0) + (s[el.dmg] || 0) + (isCrit ? s.critDamage || 0 : 0);
    let pct = s.dmgPct || 0;
    if (spell) {
      pct += spell.melee ? s.meleePct || 0 : s.rangedPct || 0;
      pct += spell.isWeapon ? s.weaponPct || 0 : s.spellPct || 0;
    }
    dmg *= Math.max(0, 1 + pct / 100);
  }
  const modPayload = { source: caster?.id, target: target.id, element, spell, isCrit, depth, chainIndex, kind, amount: dmg };
  const preview = mode !== 'roll';
  if (caster) {
    const m = collectModifiers(combat, caster.id, 'beforeDealDamage', modPayload, preview);
    dmg = (dmg + m.flat) * Math.max(0, 1 + m.pct / 100);
  }
  const t = collectModifiers(combat, target.id, 'beforeTakeDamage', modPayload, preview);
  dmg = (dmg + t.flat) * Math.max(0, 1 + t.pct / 100);
  return mitigate(dmg, target, element);
}

/** Curación de un efecto (sin aplicar). Escala con Inteligencia, Curas y %Curas. */
export function computeHeal(combat, { caster, target, effect, isCrit = false, mode = 'roll', payload = null }) {
  let base;
  if (effect.value !== undefined) {
    base = resolveValue(effect.value, { combat, owner: caster, target, payload, preview: mode !== 'roll' });
  } else {
    base = rollRange(combat, effect.min, effect.max, mode);
  }
  if (!effect.fixed && caster) {
    const s = getStats(caster);
    if (effect.value === undefined) base = (base * (100 + (s.intelligence || 0))) / 100 + (s.heals || 0);
    if (isCrit) base *= CRIT_MULT;
    base *= Math.max(0, 1 + (s.healPct || 0) / 100);
  }
  return Math.max(0, Math.round(base));
}

/**
 * Aplica daño ya calculado: escudos → vida → robo de vida → muerte → disparadores.
 * kind: spell | trigger | dot | push
 */
export function applyDamage(combat, opts) {
  const { source = null, target, element = 'neutral', spell = null, isCrit = false, kind = 'spell', depth = 0, chainIndex = 0, cell = null, lifesteal = 0 } = opts;
  if (!target || target.dead) return 0;
  let amount = opts.applyRes ? mitigate(opts.amount, target, element) : Math.max(0, Math.round(opts.amount));
  if (amount <= 0) {
    addFx(combat, { type: 'damage', unitId: target.id, value: 0, element });
    return 0;
  }
  let absorbed = 0;
  let remaining = amount;
  for (const sh of target.shields) {
    if (remaining <= 0) break;
    const take = Math.min(sh.value, remaining);
    sh.value -= take;
    remaining -= take;
    absorbed += take;
  }
  target.shields = target.shields.filter((s) => s.value > 0);
  const hpLoss = Math.min(target.hp, remaining);
  target.hp -= hpLoss;
  const total = absorbed + hpLoss;

  addFx(combat, { type: 'damage', unitId: target.id, value: total, absorbed, element, crit: isCrit });
  const srcName = source ? source.name : opts.label ?? 'El sueño';
  addLog(combat, `${srcName} → ${target.name}: ${total} de daño${absorbed ? ` (${absorbed} absorbido)` : ''}${isCrit ? ' ¡crítico!' : '.'}`, target.side === 'player' ? 'hurt' : 'hit');

  if (source && source.side === 'player' && target.side === 'enemy') combat.stats.damageDealt += total;
  if (target.id === combat.heroId) combat.stats.damageTaken += total;
  if (source && source.id !== target.id) source.turnFlags.dealtDamage = true;

  const payload = {
    source: source?.id ?? null,
    target: target.id,
    amount: total,
    hpLoss,
    absorbed,
    element,
    spell,
    isCrit,
    kind,
    depth,
    chainIndex,
    cell: cell ?? { x: target.x, y: target.y },
  };

  const ls = lifesteal + (source && kind === 'spell' ? getStats(source).lifesteal || 0 : 0);
  if (source && !source.dead && ls > 0) {
    applyHeal(combat, { source, target: source, amount: (total * ls) / 100, depth: depth + 1, kind: 'lifesteal' });
  }

  challengeEvent(combat, 'damage', payload);
  if (target.hp <= 0) killUnit(combat, target, source, payload);
  if (source) fireTriggers(combat, source.id, 'dealDamage', payload);
  fireTriggers(combat, target.id, 'takeDamage', payload);
  if (!target.dead) checkPhases(combat, target);
  return total;
}

export function applyHeal(combat, { source = null, target, amount, depth = 0, kind = 'spell', spell = null }) {
  if (!target || target.dead) return 0;
  const raw = Math.max(0, Math.round(amount));
  const effective = Math.min(raw, target.maxHp - target.hp);
  const overheal = raw - effective;
  target.hp += effective;
  if (raw > 0) addFx(combat, { type: 'heal', unitId: target.id, value: effective, overheal });
  if (source && source.side === 'player') combat.stats.healing += effective;
  const payload = { source: source?.id ?? null, target: target.id, amount: effective, overheal, rawHeal: raw, depth, kind, spell };
  if (source) fireTriggers(combat, source.id, 'healDone', payload);
  fireTriggers(combat, target.id, 'healReceived', payload);
  return effective;
}

/** Añade un escudo. `capPct` limita el escudo total a un % de la vida máxima. */
export function applyShield(combat, target, value, duration = 1, { capPct } = {}) {
  if (!target || target.dead) return 0;
  let v = Math.round(value);
  if (capPct !== undefined) v = Math.min(v, Math.max(0, Math.round((target.maxHp * capPct) / 100) - totalShield(target)));
  if (v <= 0) return 0;
  target.shields.push({ value: v, turns: duration });
  addFx(combat, { type: 'shield', unitId: target.id, value: v });
  return v;
}

export function killUnit(combat, unit, killer = null, payload = {}) {
  if (unit.dead) return;
  unit.dead = true;
  unit.hp = 0;
  unit.shields = [];
  addFx(combat, { type: 'death', unitId: unit.id });
  if (unit.kind !== 'bomb') addLog(combat, `${unit.name} ha caído.`, unit.side === 'player' ? 'hurt' : 'kill');
  if (unit.side === 'enemy' && killer && killer.side === 'player') combat.stats.kills += 1;
  challengeEvent(combat, 'kill', { unit, killer });

  // Las invocaciones mueren con su invocador.
  for (const other of unitsList(combat)) {
    if (!other.dead && other.summonerId === unit.id) killUnit(combat, other, null, { depth: (payload.depth ?? 0) + 1 });
  }
  if (unit.kind === 'bomb' && !unit.exploded) {
    explodeBombs(combat, [unit], { depth: payload.depth ?? 0 });
  }
  const p = { ...payload, target: unit.id, source: killer?.id ?? null };
  fireTriggers(combat, unit.id, 'death', p);
  if (killer && !killer.dead && killer.id !== unit.id) fireTriggers(combat, killer.id, 'kill', p);
}

/** Cambios de fase de los jefes según su vida restante. */
export function checkPhases(combat, unit) {
  const def = MONSTERS[unit.defId];
  if (!def?.phases) return;
  while (unit.phaseIndex < def.phases.length) {
    const phase = def.phases[unit.phaseIndex];
    if ((unit.hp / unit.maxHp) * 100 >= phase.hpBelowPct) break;
    unit.phaseIndex += 1;
    addLog(combat, phase.log ?? `${unit.name} cambia de fase.`, 'boss');
    addFx(combat, { type: 'banner', unitId: unit.id, text: phase.name });
    for (const id of phase.addSpells ?? []) {
      if (!unit.spells.some((s) => s.id === id)) unit.spells.push(resolveSpell(id));
    }
    if (phase.telegraphs) unit.ai = { ...unit.ai, telegraphs: phase.telegraphs };
    executeEffects(combat, phase.onEnter, { caster: unit, depth: 1, origin: 'phase', targetCell: { x: unit.x, y: unit.y } });
  }
}
