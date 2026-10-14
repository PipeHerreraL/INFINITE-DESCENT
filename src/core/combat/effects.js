import { STATUSES } from '../../content/statuses.js';
import { chance, shuffle } from '../rng.js';
import { resolveValue } from '../effects/values.js';
import { areaCells, direction, isFloor, dist, key } from '../grid/geometry.js';
import { unitAt, enemiesOf, alliesOf, getStats, addFx, addLog, statusFlag } from './state.js';
import { computeDamage, computeHeal, applyDamage, applyHeal, applyShield, killUnit, resolveElement, COLLISION_BASE } from './damage.js';
import { applyStatus, removeStatus } from './statuses.js';
import { fireTriggers } from './triggers.js';
import { createMonsterUnit, registerUnit } from './units.js';
import { placeBombs, explodeBombs, chargeBombs } from './bombs.js';
import { executeCharge } from './telegraph.js';

// ── Selección de objetivos ───────────────────────────────────────────────

const DEFAULT_AFFECTS = { damage: 'enemies', heal: 'allies', shield: 'allies', push: 'enemies', pull: 'enemies' };

function defaultAffects(effect) {
  if (effect.affects) return effect.affects;
  if (effect.type === 'status') return STATUSES[effect.status]?.kind === 'buff' ? 'allies' : 'enemies';
  if (effect.type === 'ap' || effect.type === 'mp') {
    const v = typeof effect.value === 'number' ? effect.value : 1;
    return v >= 0 ? 'allies' : 'enemies';
  }
  return DEFAULT_AFFECTS[effect.type] ?? 'all';
}

function matchesAffects(caster, unit, affects) {
  switch (affects) {
    case 'enemies':
      return unit.side !== caster.side;
    case 'allies':
      return unit.side === caster.side;
    case 'notSelf':
      return unit.id !== caster.id;
    default:
      return true;
  }
}

function payloadUnit(combat, ctx, role) {
  const id = ctx.payload?.[role];
  return id ? combat.units[id] : null;
}

export function selectTargets(combat, effect, ctx) {
  const caster = ctx.caster;
  const affects = defaultAffects(effect);
  switch (effect.target) {
    case 'self':
      return caster.dead ? [] : [caster];
    case 'payloadTarget': {
      const u = payloadUnit(combat, ctx, 'target');
      return u && !u.dead ? [u] : [];
    }
    case 'payloadSource': {
      const u = payloadUnit(combat, ctx, 'source');
      return u && !u.dead ? [u] : [];
    }
    case 'areaAroundTarget': {
      const t = payloadUnit(combat, ctx, 'target');
      const center = t ? { x: t.x, y: t.y } : ctx.payload?.cell ?? ctx.targetCell;
      if (!center) return [];
      const cells = areaCells(combat.board, { shape: 'circle', size: effect.radius ?? 1 }, center);
      return cells
        .filter((c) => !(c.x === center.x && c.y === center.y))
        .map((c) => unitAt(combat, c.x, c.y))
        .filter((u) => u && matchesAffects(caster, u, affects));
    }
    case 'nearestEnemy': {
      const radius = effect.radius ?? 99;
      const candidates = enemiesOf(combat, caster)
        .filter((u) => u.kind !== 'bomb' && dist(u, caster) <= radius)
        .sort((a, b) => dist(a, caster) - dist(b, caster) || a.hp - b.hp);
      return candidates.length ? [candidates[0]] : [];
    }
    case 'allEnemies':
      return enemiesOf(combat, caster).filter((u) => u.kind !== 'bomb');
    case 'allAllies':
      return alliesOf(combat, caster).filter((u) => u.kind !== 'bomb');
    default: {
      const cells = ctx.areaCells ?? (ctx.targetCell ? [ctx.targetCell] : []);
      const out = [];
      for (const c of cells) {
        const u = unitAt(combat, c.x, c.y);
        if (u && matchesAffects(caster, u, affects)) out.push(u);
      }
      return out;
    }
  }
}

function damageKind(ctx) {
  return ctx.origin === 'trigger' || ctx.origin === 'status' || ctx.origin === 'phase' ? 'trigger' : 'spell';
}

// ── Movimiento forzado ───────────────────────────────────────────────────

/** Empuja a `target` en `dir`. Chocar contra algo inflige daño de empuje. */
export function pushUnit(combat, target, dir, distance, source, depth = 0) {
  if (!target || target.dead || distance <= 0 || (dir.x === 0 && dir.y === 0)) return 0;
  if (statusFlag(target, 'preventPush')) {
    addFx(combat, { type: 'text', unitId: target.id, text: 'Inamovible' });
    return 0;
  }
  const from = { x: target.x, y: target.y };
  let moved = 0;
  for (let i = 0; i < distance; i++) {
    const nx = target.x + dir.x;
    const ny = target.y + dir.y;
    const blocker = unitAt(combat, nx, ny);
    if (!isFloor(combat.board, nx, ny) || blocker) {
      if (moved) addFx(combat, { type: 'slide', unitId: target.id, from, to: { x: target.x, y: target.y } });
      collide(combat, target, blocker, distance - i, source, depth, { x: nx, y: ny });
      return moved;
    }
    target.x = nx;
    target.y = ny;
    moved++;
  }
  if (moved) addFx(combat, { type: 'slide', unitId: target.id, from, to: { x: target.x, y: target.y } });
  return moved;
}

function collide(combat, target, blocker, remaining, source, depth, cell) {
  const ss = source && !source.dead ? getStats(source) : {};
  const ts = getStats(target);
  const per = Math.max(0, COLLISION_BASE + (ss.pushDamage || 0) - (ts.pushRes || 0));
  const dmg = per * remaining;
  addLog(combat, `${target.name} se estrella${blocker ? ` contra ${blocker.name}` : ''}.`, 'push');
  addFx(combat, { type: 'impact', x: cell.x, y: cell.y });
  if (dmg > 0) applyDamage(combat, { source, target, amount: dmg, element: 'neutral', kind: 'push', depth });
  if (blocker && !blocker.dead && dmg > 0) {
    applyDamage(combat, { source, target: blocker, amount: Math.round(dmg / 2), element: 'neutral', kind: 'push', depth });
  }
  const payload = { source: source?.id ?? null, target: target.id, amount: dmg, blocker: blocker?.id ?? null, remaining, depth, cell };
  if (source && !source.dead) fireTriggers(combat, source.id, 'causeCollision', payload);
  fireTriggers(combat, target.id, 'collided', payload);
}

/** Atrae a `target` hacia `toward` hasta `distance` casillas (sin daño de choque). */
export function pullUnit(combat, target, toward, distance) {
  if (!target || target.dead || statusFlag(target, 'preventPush')) return 0;
  const from = { x: target.x, y: target.y };
  let moved = 0;
  for (let i = 0; i < distance; i++) {
    if (dist(target, toward) <= 1) break;
    const dir = direction(target, toward);
    let next = { x: target.x + dir.x, y: target.y + dir.y };
    // En diagonal exacta, el último paso se hace por un eje para quedar adyacente.
    if (next.x === toward.x && next.y === toward.y) {
      next = [{ x: target.x + dir.x, y: target.y }, { x: target.x, y: target.y + dir.y }]
        .find((c) => isFloor(combat.board, c.x, c.y) && !unitAt(combat, c.x, c.y));
      if (!next) break;
    }
    if (!isFloor(combat.board, next.x, next.y) || unitAt(combat, next.x, next.y)) break;
    target.x = next.x;
    target.y = next.y;
    moved++;
  }
  if (moved) addFx(combat, { type: 'slide', unitId: target.id, from, to: { x: target.x, y: target.y } });
  return moved;
}

function changeResource(combat, unit, res, value) {
  if (!unit || unit.dead || !value) return;
  const label = res === 'ap' ? 'PA' : 'PM';
  if (combat.activeId === unit.id) {
    unit[res] = Math.max(0, unit[res] + value);
    addFx(combat, { type: 'text', unitId: unit.id, text: `${value > 0 ? '+' : ''}${value} ${label}`, color: res === 'ap' ? '#4aa3ff' : '#58c96a' });
    return;
  }
  const statusId = res === 'ap' ? (value > 0 ? 'energizado' : 'agotado') : value > 0 ? 'acelerado' : 'ralentizado';
  applyStatus(combat, unit, statusId, { value: 1, stacks: Math.abs(value), duration: 1 });
}

// ── Invocaciones ─────────────────────────────────────────────────────────

function freeCellsAround(combat, center, radius = 1) {
  const out = [];
  for (let r = 1; r <= radius; r++) {
    for (const c of areaCells(combat.board, { shape: 'ring', size: r }, center)) {
      if (isFloor(combat.board, c.x, c.y) && !unitAt(combat, c.x, c.y)) out.push(c);
    }
  }
  return out;
}

function summonCells(combat, effect, ctx) {
  const count = effect.count ?? 1;
  const caster = ctx.caster;
  switch (effect.target) {
    case 'aroundSelf':
    case 'adjacentFree':
      return shuffle(combat.rng, freeCellsAround(combat, caster, 1))
        .concat(shuffle(combat.rng, freeCellsAround(combat, caster, 2).filter((c) => dist(c, caster) === 2)))
        .slice(0, count);
    case 'nearEnemies': {
      const cells = new Map();
      for (const e of enemiesOf(combat, caster)) {
        if (e.kind === 'bomb') continue;
        for (const c of freeCellsAround(combat, e, 2)) cells.set(key(c.x, c.y), c);
      }
      return shuffle(combat.rng, [...cells.values()]).slice(0, count);
    }
    default:
      return ctx.targetCell ? [ctx.targetCell] : [];
  }
}

/** Inserta la invocación en el orden de turnos justo después de su invocador. */
function insertInTurnOrder(combat, unit, after) {
  if (combat.phase !== 'active' || unit.kind === 'bomb') return;
  let pos = after ? combat.turnOrder.indexOf(after.id) : -1;
  if (pos < 0) {
    combat.turnOrder.push(unit.id);
    return;
  }
  pos += 1;
  while (pos < combat.turnOrder.length && combat.units[combat.turnOrder[pos]]?.summonerId === after.id) pos++;
  combat.turnOrder.splice(pos, 0, unit.id);
  if (pos <= combat.turnIndex) combat.turnIndex += 1;
}

/**
 * Crea una unidad invocada. `bindTo` es el invocador al que queda ligada
 * (muere con él); sin `bindTo` la unidad es independiente.
 */
export function spawnMonster(combat, monsterId, cell, caster, { bindTo = null } = {}) {
  const unit = createMonsterUnit(combat, monsterId, { side: caster.side, summoner: bindTo ?? caster });
  unit.summonerId = bindTo ? bindTo.id : null;
  unit.x = cell.x;
  unit.y = cell.y;
  unit.turnFlags.startCell = { x: cell.x, y: cell.y };
  registerUnit(combat, unit);
  insertInTurnOrder(combat, unit, bindTo ?? caster);
  addFx(combat, { type: 'summon', unitId: unit.id });
  addLog(combat, `${caster.name} invoca a ${unit.name}.`, 'info');
  fireTriggers(combat, unit.id, 'combatJoin', { depth: 1 });
  return unit;
}

// ── Ejecutores ───────────────────────────────────────────────────────────

const EXECUTORS = {
  damage(combat, effect, ctx, targets) {
    const kind = damageKind(ctx);
    for (const t of targets) {
      if (t.dead) continue;
      const amount = computeDamage(combat, {
        caster: ctx.caster, target: t, effect, spell: ctx.spell, isCrit: ctx.isCrit,
        depth: ctx.depth, chainIndex: ctx.chainIndex ?? 0, payload: ctx.payload, kind,
      });
      applyDamage(combat, {
        source: ctx.caster, target: t, amount, element: resolveElement(effect, ctx.caster, ctx.payload),
        spell: ctx.spell, isCrit: ctx.isCrit, kind, depth: ctx.depth, chainIndex: ctx.chainIndex ?? 0,
        cell: ctx.centerCell ?? null, lifesteal: effect.lifesteal ?? 0,
      });
    }
  },
  heal(combat, effect, ctx, targets) {
    for (const t of targets) {
      if (t.dead || t.kind === 'bomb') continue;
      const amount = computeHeal(combat, { caster: ctx.caster, target: t, effect, isCrit: ctx.isCrit, payload: ctx.payload });
      applyHeal(combat, { source: ctx.caster, target: t, amount, depth: ctx.depth, kind: damageKind(ctx), spell: ctx.spell });
    }
  },
  shield(combat, effect, ctx, targets) {
    const casterStats = getStats(ctx.caster);
    for (const t of targets) {
      if (t.dead) continue;
      let v = resolveValue(effect.value, { combat, owner: ctx.caster, target: t, payload: ctx.payload });
      if (ctx.origin === 'spell' && !effect.fixed) v *= 1 + (casterStats.healPct || 0) / 100;
      const capPct = effect.capPctStat ? casterStats[effect.capPctStat] || 0 : undefined;
      applyShield(combat, t, v, effect.duration ?? 1, { capPct });
    }
  },
  status(combat, effect, ctx, targets) {
    for (const t of targets) {
      applyStatus(combat, t, effect.status, {
        value: resolveValue(effect.value ?? 0, { combat, owner: ctx.caster, target: t, payload: ctx.payload }),
        duration: effect.duration ?? 1,
        stacks: effect.stacks ?? 1,
        sourceId: ctx.caster.id,
      });
    }
  },
  removeStatus(combat, effect, ctx, targets) {
    for (const t of targets) removeStatus(combat, t, effect.status);
  },
  push(combat, effect, ctx, targets) {
    for (const t of targets) {
      if (t.dead) continue;
      let origin = ctx.caster;
      if (effect.from === 'center' && ctx.centerCell) origin = ctx.centerCell;
      if (effect.from === 'payloadCell' && ctx.payload?.cell) origin = ctx.payload.cell;
      const dir = direction(origin, t);
      pushUnit(combat, t, dir, effect.distance ?? 1, ctx.caster, ctx.depth);
    }
  },
  pull(combat, effect, ctx, targets) {
    for (const t of targets) pullUnit(combat, t, ctx.caster, effect.distance ?? 1);
  },
  teleport(combat, effect, ctx) {
    const c = ctx.targetCell;
    const caster = ctx.caster;
    if (!c || caster.dead || !isFloor(combat.board, c.x, c.y) || unitAt(combat, c.x, c.y)) return;
    const from = { x: caster.x, y: caster.y };
    caster.x = c.x;
    caster.y = c.y;
    addFx(combat, { type: 'teleport', unitId: caster.id, from, to: { ...c } });
  },
  swap(combat, effect, ctx) {
    const c = ctx.targetCell;
    const caster = ctx.caster;
    const other = c ? unitAt(combat, c.x, c.y) : null;
    if (!other || other.id === caster.id || caster.dead) return;
    const from = { x: caster.x, y: caster.y };
    caster.x = other.x;
    caster.y = other.y;
    other.x = from.x;
    other.y = from.y;
    addFx(combat, { type: 'teleport', unitId: caster.id, from, to: { x: caster.x, y: caster.y } });
    addFx(combat, { type: 'teleport', unitId: other.id, from: { x: caster.x, y: caster.y }, to: from });
  },
  ap(combat, effect, ctx, targets) {
    for (const t of targets) changeResource(combat, t, 'ap', Math.round(resolveValue(effect.value, { combat, owner: ctx.caster, target: t, payload: ctx.payload })));
  },
  mp(combat, effect, ctx, targets) {
    for (const t of targets) changeResource(combat, t, 'mp', Math.round(resolveValue(effect.value, { combat, owner: ctx.caster, target: t, payload: ctx.payload })));
  },
  summon(combat, effect, ctx) {
    const cells = summonCells(combat, effect, ctx);
    // Los huevos que eclosionan ligan sus crías al invocador original.
    let bindTo = ctx.origin === 'spell' || ctx.origin === 'phase' ? ctx.caster : null;
    if (ctx.origin === 'status' && ctx.caster.summonerId) {
      const owner = combat.units[ctx.caster.summonerId];
      bindTo = owner && !owner.dead ? owner : null;
    }
    for (const c of cells) spawnMonster(combat, effect.monster, c, ctx.caster, { bindTo });
  },
  placeBomb(combat, effect, ctx) {
    placeBombs(combat, ctx.caster, ctx.targetCell, effect.extraAdjacent ?? 0);
  },
  detonate(combat, effect, ctx) {
    const bomb = ctx.targetCell ? unitAt(combat, ctx.targetCell.x, ctx.targetCell.y) : null;
    if (!bomb || bomb.kind !== 'bomb') return;
    explodeBombs(combat, [bomb], { depth: ctx.depth, bonusCharge: effect.bonusCharge ?? 0 });
  },
  chargeBombs(combat, effect, ctx) {
    chargeBombs(combat, ctx.caster, effect.value ?? 1);
  },
  dashToTarget(combat, effect, ctx) {
    const caster = ctx.caster;
    const t = ctx.targetCell ? unitAt(combat, ctx.targetCell.x, ctx.targetCell.y) : null;
    if (!t || caster.dead) return;
    const dir = direction(caster, t);
    const from = { x: caster.x, y: caster.y };
    let guard = 0;
    while (dist(caster, t) > 1 && guard++ < 20) {
      const nx = caster.x + dir.x;
      const ny = caster.y + dir.y;
      if (!isFloor(combat.board, nx, ny) || unitAt(combat, nx, ny)) break;
      caster.x = nx;
      caster.y = ny;
    }
    if (caster.x !== from.x || caster.y !== from.y) addFx(combat, { type: 'slide', unitId: caster.id, from, to: { x: caster.x, y: caster.y } });
  },
  charge(combat, effect, ctx) {
    executeCharge(combat, ctx.caster, ctx.spell, ctx.dir ?? { x: 1, y: 0 });
  },
  killSelf(combat, effect, ctx) {
    if (!ctx.caster.dead) killUnit(combat, ctx.caster, null, { depth: ctx.depth });
  },
  modifyDamage() {
    // Solo tiene sentido en disparadores modificadores (ver collectModifiers).
  },
};

const NEEDS_TARGETS = new Set(['damage', 'heal', 'shield', 'status', 'removeStatus', 'push', 'pull', 'ap', 'mp']);

/**
 * Ejecuta una lista de efectos.
 * ctx: { caster, spell, targetCell, centerCell, areaCells, isCrit, depth, payload, origin, chainIndex }
 */
export function executeEffects(combat, effects, ctx) {
  if (!effects?.length) return;
  for (const effect of effects) {
    const exec = EXECUTORS[effect.type];
    if (!exec) throw new Error(`Efecto desconocido: ${effect.type}`);
    if (effect.chance !== undefined && !chance(combat.rng, effect.chance)) continue;
    const targets = NEEDS_TARGETS.has(effect.type) ? selectTargets(combat, effect, ctx) : [];
    exec(combat, effect, ctx, targets);
  }
}

export const EFFECT_TYPES = Object.keys(EXECUTORS);

