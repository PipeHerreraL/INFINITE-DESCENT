import { dist, key, areaCells, isFloor, DIRS } from '../../grid/geometry.js';
import { distanceField } from '../../grid/pathfinding.js';
import { unitAt, enemiesOf, alliesOf, adjacentEnemies, totalShield, hasStatus } from '../state.js';
import { movementMap } from '../movement.js';
import { canCast, effectiveRange } from '../spellcast.js';
import { computeDamage, computeHeal } from '../damage.js';
import { bombsOf, explosionEffects, BOMB_AREA } from '../bombs.js';
import { telegraphCells } from '../telegraph.js';
import { STATUSES } from '../../../content/statuses.js';

// IA por utilidad: para cada hechizo, casilla desde la que lanzarlo (alcanzable
// este turno) y objetivo, estima el valor del resultado. Si el mejor plan exige
// moverse, primero se mueve y en el siguiente paso vuelve a decidir.
// Toda acción se valida con las mismas reglas que las del jugador.

const MAX_AI_STEPS = 14;

function priority(unit) {
  if (unit.kind === 'hero') return 1.3;
  if (unit.kind === 'bomb') return 0.05;
  if (unit.tier === 'boss') return 1.2;
  if (unit.kind === 'summon') return 0.75;
  return 1;
}

function targetsFor(combat, unit) {
  const foes = enemiesOf(combat, unit);
  const nonBomb = foes.filter((u) => u.kind !== 'bomb');
  return nonBomb.length ? nonBomb : foes;
}

/** Celdas candidatas a objetivo según el tipo de hechizo. */
function candidateCells(combat, unit, spell, foes, allies) {
  const cells = new Map();
  const add = (c) => cells.set(key(c.x, c.y), { x: c.x, y: c.y });
  switch (spell.target) {
    case 'enemy':
      foes.forEach(add);
      break;
    case 'ally':
      allies.filter((a) => a.kind !== 'bomb').forEach(add);
      break;
    case 'unit':
      foes.forEach(add);
      bombsOf(combat, unit).forEach(add);
      break;
    case 'cell': {
      const size = spell.area?.size ?? 0;
      for (const f of foes) {
        add(f);
        for (const c of areaCells(combat.board, { shape: 'circle', size: Math.min(size, 2) }, f)) add(c);
      }
      if (spell.effects.some((e) => e.type === 'heal')) allies.forEach(add);
      break;
    }
    case 'emptyCell': {
      const isMobility = spell.effects.some((e) => e.type === 'teleport');
      for (const f of foes) {
        const radius = isMobility ? 1 : 2;
        for (const c of areaCells(combat.board, { shape: 'circle', size: radius }, f)) {
          if (isFloor(combat.board, c.x, c.y) && !unitAt(combat, c.x, c.y)) add(c);
        }
      }
      if (!isMobility) {
        for (const d of DIRS) {
          const c = { x: unit.x + d.x, y: unit.y + d.y };
          if (isFloor(combat.board, c.x, c.y) && !unitAt(combat, c.x, c.y)) add(c);
        }
      }
      break;
    }
    case 'ownBomb':
      bombsOf(combat, unit).forEach(add);
      break;
    default:
  }
  return [...cells.values()];
}

function unitAtPlanned(combat, unit, from, c) {
  if (c.x === from.x && c.y === from.y) return unit;
  const u = unitAt(combat, c.x, c.y);
  return u && u.id !== unit.id ? u : null;
}

function affectsUnit(effect, caster, u) {
  const a = effect.affects ?? (effect.type === 'damage' || effect.type === 'push' || effect.type === 'pull' ? 'enemies'
    : effect.type === 'heal' || effect.type === 'shield' ? 'allies'
      : effect.type === 'status' ? (STATUSES[effect.status]?.kind === 'buff' ? 'allies' : 'enemies')
        : effect.type === 'mp' || effect.type === 'ap' ? ((effect.value ?? 0) >= 0 ? 'allies' : 'enemies') : 'all');
  if (a === 'enemies') return u.side !== caster.side;
  if (a === 'allies') return u.side === caster.side;
  return true;
}

function damageValue(combat, unit, target, effect, spell) {
  const lo = computeDamage(combat, { caster: unit, target, effect, spell, mode: 'min' });
  const hi = computeDamage(combat, { caster: unit, target, effect, spell, mode: 'max' });
  return (lo + hi) / 2;
}

function explosionValue(combat, unit, bomb, extraCharge = 0, seen = new Set()) {
  if (seen.has(bomb.id)) return 0;
  seen.add(bomb.id);
  let value = 0;
  const cells = areaCells(combat.board, BOMB_AREA, bomb);
  const effects = explosionEffects(bomb.element, bomb.charge + extraCharge);
  const dmgEffect = effects[0];
  for (const c of cells) {
    const u = unitAt(combat, c.x, c.y);
    if (!u) continue;
    if (u.side !== unit.side) {
      const dmg = damageValue(combat, unit, u, dmgEffect, { tags: ['bomb'], melee: false });
      const eff = Math.min(dmg, u.hp + totalShield(u));
      value += eff * priority(u) + (dmg >= u.hp + totalShield(u) ? 20 : 0);
    } else if (u.kind === 'bomb' && u.ownerId === unit.id && !seen.has(u.id)) {
      value += explosionValue(combat, unit, u, 0, seen);
    }
  }
  return value;
}

/** Valor estimado de lanzar `spell` desde `from` sobre `cell`. */
export function evaluateCast(combat, unit, spell, from, cell) {
  const area = areaCells(combat.board, spell.area, cell, from);
  const inArea = area.map((c) => unitAtPlanned(combat, unit, from, c)).filter(Boolean);
  const foes = targetsFor(combat, unit);
  const remainingAp = unit.ap - spell.apCost;
  let score = 0;
  for (const effect of spell.effects) {
    switch (effect.type) {
      case 'damage':
        for (const t of inArea) {
          if (!affectsUnit(effect, unit, t) || t.kind === 'bomb') continue;
          const dmg = damageValue(combat, unit, t, effect, spell);
          const pool = t.hp + totalShield(t);
          const eff = Math.min(dmg, pool);
          if (t.side !== unit.side) score += eff * priority(t) + (dmg >= pool ? 22 + t.maxHp * 0.15 : 0);
          else score -= eff * 1.5;
        }
        break;
      case 'heal':
        for (const t of inArea) {
          if (!affectsUnit(effect, unit, t) || t.kind === 'bomb') continue;
          const h = computeHeal(combat, { caster: unit, target: t, effect, mode: 'avg' });
          const missing = t.maxHp - t.hp;
          score += Math.min(h, missing) * (missing / t.maxHp > 0.25 ? 1.3 : 0.6);
          if (unit.defId === 'ensalmador') score += Math.max(0, h - missing) * 0.25;
        }
        break;
      case 'shield':
        for (const t of inArea) if (affectsUnit(effect, unit, t) && t.kind !== 'bomb') score += Math.min(20, t.maxHp * 0.15) * 0.5;
        break;
      case 'status':
        for (const t of inArea) {
          if (!affectsUnit(effect, unit, t) || t.kind === 'bomb') continue;
          const has = hasStatus(t, effect.status);
          if (t.side === unit.side) score += has ? 0 : remainingAp >= 3 ? 8 : 2;
          else score += 4;
        }
        break;
      case 'push':
      case 'pull':
        for (const t of inArea) if (affectsUnit(effect, unit, t) && t.side !== unit.side && t.kind !== 'bomb') score += 2;
        break;
      case 'mp':
      case 'ap':
        for (const t of inArea) if (affectsUnit(effect, unit, t)) score += 3;
        break;
      case 'summon':
        score += 14;
        break;
      case 'placeBomb': {
        const near = foes.filter((f) => dist(f, cell) <= 2).length;
        score += near ? 6 + near * 8 : 1;
        break;
      }
      case 'detonate': {
        const bomb = unitAt(combat, cell.x, cell.y);
        if (bomb) score += explosionValue(combat, unit, bomb, effect.bonusCharge ?? 0);
        break;
      }
      case 'chargeBombs':
        score += bombsOf(combat, unit).length * 5;
        break;
      case 'teleport': {
        const adj = foes.some((f) => dist(f, cell) === 1);
        if (unit.ai?.profile === 'melee' || unit.ai?.preferredRange <= 1) score += adj && remainingAp >= 3 ? 12 : -3;
        else score -= 2;
        break;
      }
      case 'dashToTarget':
        score += 2;
        break;
      default:
    }
  }
  return score;
}

function threatenedCells(combat, unit) {
  const set = new Set();
  for (const f of enemiesOf(combat, unit)) {
    for (const t of f.telegraphs ?? []) for (const c of telegraphCells(combat, f, t)) set.add(key(c.x, c.y));
  }
  return set;
}

function positionScore(combat, unit, cell, threatened) {
  let s = 0;
  if (threatened.has(key(cell.x, cell.y))) s -= 45;
  const profile = unit.ai?.profile;
  if (profile === 'ranged' || profile === 'support' || profile === 'summoner') {
    const adj = adjacentEnemies(combat, unit, cell).length;
    s -= adj * 4;
  }
  return s;
}

function bestCast(combat, unit) {
  const { reach } = movementMap(combat, unit);
  const foes = targetsFor(combat, unit);
  const allies = alliesOf(combat, unit);
  const threatened = threatenedCells(combat, unit);
  const fromCells = [...reach.values()];
  let best = null;
  for (const spell of unit.spells) {
    if (spell.telegraph) continue;
    if (spell.apCost > unit.ap) continue;
    if ((unit.cooldowns[spell.id] || 0) > 0) continue;
    if (spell.castsPerTurn > 0 && (unit.casts[spell.id] || 0) >= spell.castsPerTurn) continue;
    const range = effectiveRange(unit, spell);
    const targets = spell.target === 'self' ? null : candidateCells(combat, unit, spell, foes, allies);
    for (const from of fromCells) {
      const cellsToTry = targets ?? [from];
      for (const cell of cellsToTry) {
        const d = dist(from, cell);
        if (d < range.min || d > range.max) continue;
        if (!canCast(combat, unit, spell, cell, { from }).ok) continue;
        const value = evaluateCast(combat, unit, spell, from, cell);
        if (value <= 0.5) continue;
        const score = value - from.dist * 0.3 + positionScore(combat, unit, from, threatened);
        if (!best || score > best.score) best = { spell, from, cell, score };
      }
    }
  }
  return best;
}

function bestMove(combat, unit) {
  const { reach } = movementMap(combat, unit);
  if (reach.size <= 1) return null;
  const foes = targetsFor(combat, unit);
  if (!foes.length) return null;
  const threatened = threatenedCells(combat, unit);
  const blocked = (x, y) => {
    const u = unitAt(combat, x, y);
    return !!u && u.id !== unit.id;
  };
  const profile = unit.ai?.profile ?? 'melee';
  const pref = unit.ai?.preferredRange ?? (profile === 'melee' || profile === 'boss' ? 1 : 4);
  const fields = foes.map((f) => {
    const field = distanceField(combat.board, f, (x, y) => blocked(x, y) && !(x === f.x && y === f.y));
    return { f, field };
  });
  const allies = alliesOf(combat, unit).filter((a) => a.id !== unit.id && a.kind !== 'bomb');

  const scoreCell = (c) => {
    let s = positionScore(combat, unit, c, threatened);
    if (unit.ai?.healer) {
      const hurt = allies.filter((a) => a.hp < a.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] ?? allies[0];
      if (hurt) s -= Math.abs(dist(c, hurt) - 2) * 3;
      const nearestFoe = Math.min(...foes.map((f) => dist(c, f)));
      if (nearestFoe <= 2) s -= (3 - nearestFoe) * 6;
      return s - c.dist * 0.1;
    }
    let minPath = Infinity;
    let minManhattan = Infinity;
    for (const { f, field } of fields) {
      const pd = field.get(key(c.x, c.y));
      const w = f.kind === 'hero' ? 0 : 1;
      if (pd !== undefined) minPath = Math.min(minPath, pd + w);
      minManhattan = Math.min(minManhattan, dist(c, f));
    }
    if (minPath === Infinity) minPath = minManhattan + 6;
    if (pref <= 1) s -= minPath * 10;
    else s -= Math.abs(minManhattan - pref) * 6 + (minManhattan < pref ? 4 : 0);
    return s - c.dist * 0.1;
  };

  const current = reach.get(key(unit.x, unit.y));
  const currentScore = scoreCell(current);
  let best = null;
  for (const c of reach.values()) {
    if (c.dist === 0) continue;
    const s = scoreCell(c);
    if (!best || s > best.s) best = { c, s };
  }
  if (!best || best.s <= currentScore + 0.5) return null;
  return best.c;
}

function telegraphPlan(combat, unit) {
  const list = unit.ai?.telegraphs;
  if (!list?.length || unit.telegraphs.length) return null;
  const foes = targetsFor(combat, unit);
  if (!foes.length) return null;
  const target = foes.slice().sort((a, b) => priority(b) - priority(a) || dist(unit, a) - dist(unit, b))[0];
  for (let i = 0; i < list.length; i++) {
    const idx = (unit.teleCycle + i) % list.length;
    const spell = unit.spells.find((s) => s.id === list[idx]);
    if (!spell) continue;
    const check = canCast(combat, unit, spell, target);
    if (!check.ok) continue;
    unit.teleCycle = idx + 1;
    return { spellId: spell.id, x: target.x, y: target.y };
  }
  return null;
}

/** Decide la siguiente acción de la unidad activa. */
export function decideAction(combat, unitId) {
  const unit = combat.units[unitId];
  if (!unit || unit.dead) return { type: 'endTurn' };
  unit.turnFlags.aiSteps = (unit.turnFlags.aiSteps || 0) + 1;
  if (unit.ai?.profile === 'static') return { type: 'endTurn' };
  if (unit.turnFlags.aiSteps > MAX_AI_STEPS) return { type: 'endTurn' };

  const plan = bestCast(combat, unit);
  if (plan) {
    if (plan.from.x !== unit.x || plan.from.y !== unit.y) return { type: 'move', x: plan.from.x, y: plan.from.y };
    return { type: 'cast', spellId: plan.spell.id, x: plan.cell.x, y: plan.cell.y };
  }
  const move = unit.mp > 0 ? bestMove(combat, unit) : null;
  if (move) return { type: 'move', x: move.x, y: move.y };
  const tele = telegraphPlan(combat, unit);
  if (tele) return { type: 'cast', ...tele };
  return { type: 'endTurn' };
}

