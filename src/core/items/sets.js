import { SETS, ITEMS } from '../../content/items/index.js';

/** Número de piezas distintas equipadas de cada set. */
export function countSetPieces(equipment) {
  const seen = {};
  for (const item of Object.values(equipment)) {
    if (!item) continue;
    const setId = ITEMS[item.baseId]?.set;
    if (!setId) continue;
    seen[setId] ??= new Set();
    seen[setId].add(item.baseId);
  }
  const counts = {};
  for (const [setId, bases] of Object.entries(seen)) counts[setId] = bases.size;
  return counts;
}

/** Estado de cada set con al menos una pieza: bonificaciones activas e inactivas. */
export function setStatus(equipment) {
  const counts = countSetPieces(equipment);
  return Object.entries(counts).map(([setId, count]) => {
    const set = SETS[setId];
    const bonuses = Object.entries(set.bonuses).map(([n, b]) => ({
      pieces: Number(n),
      desc: b.desc,
      active: count >= Number(n),
    }));
    return { id: setId, name: set.name, color: set.color, count, total: set.pieces.length, bonuses };
  });
}

/** Fuentes (estadísticas + disparadores) de los bonos de set activos. */
export function setSources(equipment) {
  const counts = countSetPieces(equipment);
  const sources = [];
  for (const [setId, count] of Object.entries(counts)) {
    const set = SETS[setId];
    for (const [n, bonus] of Object.entries(set.bonuses)) {
      if (count < Number(n)) continue;
      sources.push({
        id: `set:${setId}:${n}`,
        kind: 'set',
        name: `${set.name} (${n})`,
        stats: bonus.stats ?? null,
        triggers: bonus.triggers ?? [],
      });
    }
  }
  return sources;
}
