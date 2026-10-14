import { dist, inLine, inBoard, isFloor, hasLineOfSight, areaCells, cellsInRange } from '../grid/geometry.js';
import { RuleError } from '../errors.js';
import { chance } from '../rng.js';
import { getStats, unitAt, addFx, addLog } from './state.js';
import { executeEffects } from './effects.js';
import { consumeStatuses } from './statuses.js';
import { fireTriggers } from './triggers.js';
import { challengeEvent } from './challenges.js';
import { bombsOf, bombLimit } from './bombs.js';
import { createTelegraph } from './telegraph.js';
import { computeDamage, computeHeal } from './damage.js';

const MONSTER_SUMMON_CAP = 4;

export function effectiveRange(unit, spell) {
  const s = getStats(unit);
  const max = Math.max(spell.minRange, spell.maxRange + (spell.rangeMod ? s.range || 0 : 0));
  return { min: spell.minRange, max };
}

function summonsOf(combat, unit) {
  return Object.values(combat.units).filter((u) => !u.dead && u.summonerId === unit.id && u.kind === 'summon').length;
}

const fail = (reason) => ({ ok: false, reason });

/**
 * Valida el lanzamiento de un hechizo. Con `from` se evalúa como si el
 * lanzador estuviera en otra casilla (planificación de la IA).
 */
export function canCast(combat, caster, spell, cell, { from = null, ignoreTurn = false } = {}) {
  if (combat.phase !== 'active') return fail('El combate no está activo.');
  if (caster.dead) return fail('El lanzador está fuera de combate.');
  if (!ignoreTurn && combat.activeId !== caster.id) return fail('No es tu turno.');
  if (caster.ap < spell.apCost) return fail(`Necesitas ${spell.apCost} PA (tienes ${caster.ap}).`);
  const cd = caster.cooldowns[spell.id] || 0;
  if (cd > 0) return fail(`Disponible en ${cd} turno(s).`);
  if (spell.castsPerTurn > 0 && (caster.casts[spell.id] || 0) >= spell.castsPerTurn) {
    return fail('Ya has agotado los lanzamientos de este turno.');
  }
  if (!cell || !inBoard(combat.board, cell.x, cell.y)) return fail('Casilla inválida.');
  const origin = from ?? { x: caster.x, y: caster.y };
  const d = dist(origin, cell);
  const r = effectiveRange(caster, spell);
  if (d < r.min || d > r.max) return fail('Fuera de alcance.');
  if (spell.inLine && !inLine(origin, cell)) return fail('Debe lanzarse en línea recta.');
  const occupied = (x, y) => {
    if (x === origin.x && y === origin.y) return false;
    const u = unitAt(combat, x, y);
    return !!u && u.id !== caster.id;
  };
  if (spell.los && !hasLineOfSight(combat.board, origin, cell, occupied)) return fail('Sin línea de visión.');

  let target;
  if (cell.x === origin.x && cell.y === origin.y) target = caster;
  else {
    target = unitAt(combat, cell.x, cell.y);
    if (target && target.id === caster.id) target = null;
  }
  switch (spell.target) {
    case 'enemy':
      if (!target || target.side === caster.side) return fail('Debe apuntar a un enemigo.');
      break;
    case 'ally':
      if (!target || target.side !== caster.side || target.kind === 'bomb') return fail('Debe apuntar a un aliado.');
      break;
    case 'unit':
      if (!target) return fail('Debe apuntar a una unidad.');
      break;
    case 'emptyCell':
      if (!isFloor(combat.board, cell.x, cell.y) || target) return fail('La casilla debe estar libre.');
      break;
    case 'cell':
      if (!isFloor(combat.board, cell.x, cell.y)) return fail('Casilla no válida.');
      break;
    case 'self':
      if (target !== caster) return fail('Solo puede lanzarse sobre uno mismo.');
      break;
    case 'ownBomb':
      if (!target || target.kind !== 'bomb' || target.ownerId !== caster.id) return fail('Debe apuntar a una de tus bombas.');
      break;
    default:
  }
  if (spell.castsPerTarget > 0 && target) {
    const k = `${spell.id}|${target.id}`;
    if ((caster.castsOnTarget[k] || 0) >= spell.castsPerTarget) return fail('Ya has lanzado este hechizo sobre ese objetivo.');
  }
  for (const e of spell.effects) {
    if (e.type === 'placeBomb' && bombsOf(combat, caster).length >= bombLimit(caster)) {
      return fail(`Máximo de bombas alcanzado (${bombLimit(caster)}).`);
    }
    if (e.type === 'summon') {
      const limit = caster.side === 'player' ? getStats(caster).summons || 1 : MONSTER_SUMMON_CAP;
      if (summonsOf(combat, caster) >= limit) return fail(`Máximo de invocaciones alcanzado (${limit}).`);
    }
  }
  return { ok: true, target };
}

/** Casillas en alcance con su validez, para resaltar en la interfaz. */
export function rangeCells(combat, caster, spell) {
  const r = effectiveRange(caster, spell);
  const out = [];
  for (const c of cellsInRange(combat.board, caster, r.min, r.max)) {
    if (spell.inLine && !inLine(caster, c)) continue;
    const check = canCast(combat, caster, spell, c, { ignoreTurn: true });
    out.push({ x: c.x, y: c.y, valid: check.ok, reason: check.reason });
  }
  return out;
}

/** Previsualización de daño/curación de un hechizo sobre una casilla. */
export function previewSpell(combat, caster, spell, cell) {
  const cells = areaCells(combat.board, spell.area, cell, caster);
  const results = [];
  for (const c of cells) {
    const u = unitAt(combat, c.x, c.y);
    if (!u) continue;
    const entry = { unitId: u.id, dmgMin: 0, dmgMax: 0, heal: 0 };
    for (const e of spell.effects) {
      const affects = e.affects ?? (e.type === 'damage' ? 'enemies' : e.type === 'heal' ? 'allies' : 'all');
      const ok = affects === 'all' || (affects === 'enemies' ? u.side !== caster.side : u.side === caster.side);
      if (!ok) continue;
      if (e.type === 'damage') {
        entry.dmgMin += computeDamage(combat, { caster, target: u, effect: e, spell, mode: 'min' });
        entry.dmgMax += computeDamage(combat, { caster, target: u, effect: e, spell, mode: 'max' });
      } else if (e.type === 'heal') {
        entry.heal += computeHeal(combat, { caster, target: u, effect: e, mode: 'avg' });
      }
    }
    if (entry.dmgMax || entry.heal) results.push(entry);
  }
  return { cells, results };
}

/** Lanza un hechizo validando todas las reglas. */
export function castSpell(combat, caster, spellId, cell) {
  const spell = caster.spells.find((s) => s.id === spellId);
  if (!spell) throw new RuleError('No conoces ese hechizo.');
  const check = canCast(combat, caster, spell, cell);
  if (!check.ok) throw new RuleError(check.reason);
  const target = check.target;
  const stats = getStats(caster);
  caster.ap -= spell.apCost;
  caster.casts[spell.id] = (caster.casts[spell.id] || 0) + 1;
  if (spell.castsPerTarget > 0 && target) {
    const k = `${spell.id}|${target.id}`;
    caster.castsOnTarget[k] = (caster.castsOnTarget[k] || 0) + 1;
  }
  if (spell.cooldown > 0) caster.cooldowns[spell.id] = spell.cooldown;

  const hasDamage = spell.effects.some((e) => e.type === 'damage');
  const critable = hasDamage || spell.effects.some((e) => e.type === 'heal');
  const isCrit = critable && chance(combat.rng, Math.min(100, (spell.crit || 0) + (stats.crit || 0)));
  const element = spell.element === 'dominant' ? caster.dominantElement : spell.element;

  addFx(combat, { type: 'cast', unitId: caster.id, text: spell.name, x: cell.x, y: cell.y, crit: isCrit });
  addLog(combat, `${caster.name} lanza ${spell.name}${isCrit ? ' — ¡golpe crítico!' : ''}.`, caster.side === 'player' ? 'cast' : 'enemy');
  challengeEvent(combat, 'cast', { unit: caster, spell });

  if (spell.telegraph) {
    createTelegraph(combat, caster, spell, cell);
  } else {
    const cells = areaCells(combat.board, spell.area, cell, caster);
    executeEffects(combat, spell.effects, {
      caster, spell, targetCell: { x: cell.x, y: cell.y }, centerCell: { x: cell.x, y: cell.y }, areaCells: cells, isCrit, depth: 0, origin: 'spell',
    });
  }

  caster.uses[spell.id] = (caster.uses[spell.id] || 0) + 1;
  caster.turnFlags.castCount += 1;
  caster.turnFlags.castIds.push(spell.id);
  if (spell.target !== 'self') consumeStatuses(caster, 'castSpell');
  if (hasDamage) consumeStatuses(caster, 'castDamage');
  if (hasDamage && spell.melee) consumeStatuses(caster, 'castMelee');
  if (hasDamage && element && element !== 'neutral') caster.lastSpellElement = element;
  fireTriggers(combat, caster.id, 'castSpell', { spell, apCost: spell.apCost, cell, depth: 0, kind: 'spell', element });
  return { spell, isCrit };
}
