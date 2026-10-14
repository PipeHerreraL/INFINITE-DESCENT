import { hasStatus, adjacentEnemies } from '../combat/state.js';

/**
 * Evalúa las condiciones declarativas de un disparador.
 * ctx: { combat, owner, payload }
 * payload: { source, target, amount, element, spell, kind, isCrit, depth, apCost,
 *            overheal, rawHeal, cell, chainIndex }
 */
const CONDITIONS = {
  isCrit: (c, ctx) => !!ctx.payload.isCrit,
  isSpell: (c, ctx) => ctx.payload.kind === 'spell' && !!ctx.payload.spell,
  isWeapon: (c, ctx) => !!ctx.payload.spell?.isWeapon,
  isMeleeSpell: (c, ctx) => ctx.payload.kind === 'spell' && !!ctx.payload.spell?.melee,
  isMeleeHit: (c, ctx) => ctx.payload.kind === 'spell' && !!ctx.payload.spell?.melee,
  notTriggered: (c, ctx) => (ctx.payload.depth ?? 0) === 0,
  element: (c, ctx) => c.in.includes(ctx.payload.element),
  spellTag: (c, ctx) => !!ctx.payload.spell?.tags?.includes(c.tag),
  spellId: (c, ctx) => c.ids.includes(ctx.payload.spell?.id),
  apCostAtLeast: (c, ctx) => (ctx.payload.apCost ?? 0) >= c.value,
  ownerHpBelow: (c, ctx) => ctx.owner.hp / ctx.owner.maxHp < c.pct / 100,
  ownerHpAbove: (c, ctx) => ctx.owner.hp / ctx.owner.maxHp > c.pct / 100,
  targetHpBelow: (c, ctx) => {
    const t = ctx.combat.units[ctx.payload.target];
    return !!t && t.hp / t.maxHp < c.pct / 100;
  },
  targetHasStatus: (c, ctx) => {
    const t = ctx.combat.units[ctx.payload.target];
    return !!t && hasStatus(t, c.status);
  },
  ownerHasStatus: (c, ctx) => hasStatus(ctx.owner, c.status),
  overheal: (c, ctx) => (ctx.payload.overheal ?? 0) > 0,
  movedThisTurnAtLeast: (c, ctx) => (ctx.owner.turnFlags?.moved ?? 0) >= c.value,
  adjacentEnemiesAtLeast: (c, ctx) => adjacentEnemies(ctx.combat, ctx.owner).length >= c.value,
  adjacentEnemiesAtMost: (c, ctx) => adjacentEnemies(ctx.combat, ctx.owner).length <= c.value,
  firstCastThisTurn: (c, ctx) => (ctx.owner.turnFlags?.castCount ?? 0) === 0,
  noDamageThisTurn: (c, ctx) => !ctx.owner.turnFlags?.dealtDamage,
  elementChanged: (c, ctx) => !!ctx.owner.lastSpellElement && ctx.payload.element !== ctx.owner.lastSpellElement,
  targetIsEnemy: (c, ctx) => {
    const t = ctx.combat.units[ctx.payload.target];
    return !!t && t.side !== ctx.owner.side;
  },
  targetIsAlly: (c, ctx) => {
    const t = ctx.combat.units[ctx.payload.target];
    return !!t && t.side === ctx.owner.side;
  },
  not: (c, ctx) => !checkCondition(c.cond, ctx),
};

export function checkCondition(cond, ctx) {
  const fn = CONDITIONS[cond.type];
  if (!fn) throw new Error(`Condición desconocida: ${cond.type}`);
  return fn(cond, ctx);
}

export function checkConditions(conditions, ctx) {
  if (!conditions || !conditions.length) return true;
  return conditions.every((c) => checkCondition(c, ctx));
}

export const CONDITION_TYPES = Object.keys(CONDITIONS);
