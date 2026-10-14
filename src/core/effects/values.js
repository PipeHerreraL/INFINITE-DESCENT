import { int } from '../rng.js';
import { adjacentEnemies } from '../combat/state.js';

/**
 * Resuelve un valor declarativo de efecto.
 * - número: valor fijo
 * - [min, max]: aleatorio (o media en modo previsualización)
 * - { from, pct, mult, flat, multBy, max }: valor derivado del contexto
 *   from: amount | overheal | rawHeal | ownerMaxHp | targetMaxHp | payloadTargetMaxHp | ownerMissingHp | apCost | chainIndex
 */
export function resolveValue(v, ctx) {
  if (v === undefined || v === null) return 0;
  if (typeof v === 'number') return v;
  if (Array.isArray(v)) {
    if (ctx.preview || !ctx.combat) return (v[0] + v[1]) / 2;
    return int(ctx.combat.rng, v[0], v[1]);
  }
  const p = ctx.payload ?? {};
  let base = 0;
  switch (v.from) {
    case 'amount':
      base = p.amount ?? 0;
      break;
    case 'overheal':
      base = p.overheal ?? 0;
      break;
    case 'rawHeal':
      base = p.rawHeal ?? 0;
      break;
    case 'ownerMaxHp':
      base = ctx.owner?.maxHp ?? 0;
      break;
    case 'targetMaxHp':
      base = ctx.target?.maxHp ?? 0;
      break;
    case 'payloadTargetMaxHp':
      // Unidad objetivo del evento que activó el disparador (p. ej., el enemigo que murió).
      base = (p.target && ctx.combat?.units[p.target]?.maxHp) ?? 0;
      break;
    case 'ownerMissingHp':
      base = ctx.owner ? ctx.owner.maxHp - ctx.owner.hp : 0;
      break;
    case 'apCost':
      base = p.apCost ?? 0;
      break;
    case 'chainIndex':
      base = p.chainIndex ?? 0;
      break;
    default:
      base = 0;
  }
  let out = base;
  if (typeof v.pct === 'number') out = (base * v.pct) / 100;
  if (typeof v.mult === 'number') out = base * v.mult;
  if (typeof v.flat === 'number') out += v.flat;
  if (v.multBy === 'adjacentEnemies' && ctx.owner && ctx.combat) {
    out *= adjacentEnemies(ctx.combat, ctx.owner).length;
  }
  if (typeof v.max === 'number') out = Math.min(out, v.max);
  return out;
}
