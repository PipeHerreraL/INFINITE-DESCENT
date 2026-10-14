import { EQUIP_SLOTS, BAG_CAPACITY, getItemDef, slotsForType } from '../../content/items/index.js';
import { RuleError, assertRule } from '../errors.js';
import { salvageValue } from './items.js';

export function emptyEquipment() {
  const eq = {};
  for (const s of EQUIP_SLOTS) eq[s.id] = null;
  return eq;
}

export function slotDef(slotId) {
  return EQUIP_SLOTS.find((s) => s.id === slotId);
}

/** Comprueba si un objeto puede ir en un espacio concreto. */
export function canEquip(hero, item, slotId) {
  const def = getItemDef(item.baseId);
  const slot = slotDef(slotId);
  if (!slot) return { ok: false, reason: 'Espacio inválido.' };
  if (slot.type !== def.type) return { ok: false, reason: `Este objeto no va en ${slot.name}.` };
  if (def.requires?.classId && def.requires.classId !== hero.classId) {
    return { ok: false, reason: 'Tu clase no puede usar este objeto.' };
  }
  if (def.requires?.level && hero.level < def.requires.level) {
    return { ok: false, reason: `Requiere nivel ${def.requires.level}.` };
  }
  if (def.unique) {
    for (const otherSlot of slotsForType(def.type)) {
      if (otherSlot === slotId) continue;
      const other = hero.equipment[otherSlot];
      if (other && other.baseId === item.baseId) {
        return { ok: false, reason: 'No puedes llevar dos objetos únicos iguales.' };
      }
    }
  }
  return { ok: true };
}

/** Elige el espacio por defecto: el primero libre de su tipo o el primero. */
export function defaultSlotFor(hero, item) {
  const slots = slotsForType(getItemDef(item.baseId).type);
  const valid = slots.filter((s) => canEquip(hero, item, s).ok);
  return valid.find((s) => !hero.equipment[s]) ?? valid[0] ?? null;
}

export function findInBag(hero, uid) {
  return hero.bag.findIndex((i) => i.uid === uid);
}

/**
 * Equipa un objeto de la bolsa. El objeto que ocupaba el espacio vuelve a la
 * bolsa (el hueco liberado garantiza espacio).
 */
export function equipFromBag(hero, uid, slotId = null) {
  const idx = findInBag(hero, uid);
  assertRule(idx >= 0, 'El objeto no está en la bolsa.');
  const item = hero.bag[idx];
  const target = slotId ?? defaultSlotFor(hero, item);
  assertRule(target, 'No hay un espacio válido para este objeto.');
  const check = canEquip(hero, item, target);
  if (!check.ok) throw new RuleError(check.reason);
  hero.bag.splice(idx, 1);
  const previous = hero.equipment[target];
  hero.equipment[target] = item;
  if (previous) hero.bag.push(previous);
  return { slot: target, previous };
}

/** Equipa un objeto que no está en la bolsa (p. ej., una recompensa). */
export function equipNew(hero, item, slotId = null) {
  const target = slotId ?? defaultSlotFor(hero, item);
  assertRule(target, 'No hay un espacio válido para este objeto.');
  const check = canEquip(hero, item, target);
  if (!check.ok) throw new RuleError(check.reason);
  const previous = hero.equipment[target];
  if (previous) assertRule(hero.bag.length < BAG_CAPACITY, 'La bolsa está llena: desmantela algo antes de sustituir esta pieza.');
  hero.equipment[target] = item;
  if (previous) hero.bag.push(previous);
  return { slot: target, previous };
}

export function unequip(hero, slotId) {
  const item = hero.equipment[slotId];
  assertRule(item, 'No hay nada equipado ahí.');
  assertRule(hero.bag.length < BAG_CAPACITY, 'La bolsa está llena.');
  hero.equipment[slotId] = null;
  hero.bag.push(item);
  return item;
}

export function addToBag(hero, item) {
  assertRule(hero.bag.length < BAG_CAPACITY, 'La bolsa está llena.');
  hero.bag.push(item);
}

/** Localiza un objeto por uid en bolsa o equipo. */
export function locateItem(hero, uid) {
  const bagIdx = findInBag(hero, uid);
  if (bagIdx >= 0) return { where: 'bag', index: bagIdx, item: hero.bag[bagIdx] };
  for (const [slot, item] of Object.entries(hero.equipment)) {
    if (item && item.uid === uid) return { where: 'equipment', slot, item };
  }
  return null;
}

export function removeItem(hero, uid) {
  const loc = locateItem(hero, uid);
  assertRule(loc, 'Objeto no encontrado.');
  if (loc.where === 'bag') hero.bag.splice(loc.index, 1);
  else hero.equipment[loc.slot] = null;
  return loc.item;
}

/** Desmantela un objeto (bolsa o equipo) y devuelve los fragmentos obtenidos. */
export function salvage(run, uid) {
  const item = removeItem(run.hero, uid);
  const frags = salvageValue(item);
  run.fragments += frags;
  return frags;
}
