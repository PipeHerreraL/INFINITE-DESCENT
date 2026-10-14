import { MONSTERS } from './monsters.js';
import { MONSTER_SPELLS } from './spells.js';

export { MONSTERS, MONSTER_SPELLS };

export function getMonster(id) {
  const m = MONSTERS[id];
  if (!m) throw new Error(`Monstruo desconocido: ${id}`);
  return m;
}
