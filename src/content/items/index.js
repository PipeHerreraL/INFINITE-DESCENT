import { GENERIC_ITEMS, WEAPONS } from './generic.js';
import { SET_ITEMS, SETS } from './sets.js';
import { LEGENDARY_ITEMS } from './legendaries.js';
import { ENCHANTMENTS } from './enchantments.js';

export { SETS, ENCHANTMENTS };
export * from './slots.js';

export const ITEMS = {
  ...GENERIC_ITEMS,
  ...WEAPONS,
  ...SET_ITEMS,
  ...LEGENDARY_ITEMS,
};

export function getItemDef(id) {
  const def = ITEMS[id];
  if (!def) throw new Error(`Objeto desconocido: ${id}`);
  return def;
}
