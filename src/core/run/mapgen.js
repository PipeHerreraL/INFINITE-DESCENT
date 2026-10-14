import { int, pick, weighted, chance, shuffle } from '../rng.js';
import { ELITE_MODIFIERS, CHALLENGE_MODIFIERS, FLOOR_MODIFIERS } from '../../content/modifiers.js';

// Mapa de un estrato: filas de nodos conectados (estilo «elige tu camino»).
// La última fila es el jefe; la penúltima, descanso. Se garantiza un mercader
// a mitad de camino y una forja en algún punto del estrato.

const NO_REPEAT = new Set(['shop', 'forge', 'rest', 'elite', 'challenge', 'chest']);

export function generateActMap(rng, act, { eliteWeightMult = 1 } = {}) {
  const rows = act.rows;
  const lanes = act.lanes ?? 4;
  const nodes = {};
  const id = (r, c) => `${act.index}-${r}-${c}`;
  const pathCount = 4;
  const startCols = shuffle(rng, [...Array(lanes).keys()]);

  for (let p = 0; p < pathCount; p++) {
    // Los dos primeros caminos empiezan en carriles distintos para garantizar elección.
    let col = p < 2 ? startCols[p] : int(rng, 0, lanes - 1);
    let prev = null;
    for (let r = 0; r < rows - 1; r++) {
      const nid = id(r, col);
      nodes[nid] ??= { id: nid, row: r, col, type: null, next: [], modifier: null };
      if (prev && !nodes[prev].next.includes(nid)) nodes[prev].next.push(nid);
      prev = nid;
      col = Math.max(0, Math.min(lanes - 1, col + int(rng, -1, 1)));
    }
  }

  const bossId = `${act.index}-${rows - 1}-boss`;
  nodes[bossId] = { id: bossId, row: rows - 1, col: (lanes - 1) / 2, type: 'boss', next: [], modifier: null };
  for (const n of Object.values(nodes)) if (n.row === rows - 2) n.next = [bossId];

  const byRow = (r) => Object.values(nodes).filter((n) => n.row === r).sort((a, b) => a.col - b.col);
  const parents = (nid) => Object.values(nodes).filter((n) => n.next.includes(nid));

  const weights = { ...act.nodeWeights };
  weights.elite = (weights.elite ?? 0) * eliteWeightMult;

  for (let r = 0; r < rows - 1; r++) {
    const rowNodes = byRow(r);
    for (const n of rowNodes) {
      if (r === 0) n.type = 'combat';
      else if (r === rows - 2) n.type = 'rest';
      else {
        const forbidden = new Set();
        if (r < 2) {
          forbidden.add('elite');
          forbidden.add('challenge');
        }
        if (r === rows - 3) forbidden.add('rest');
        for (const p of parents(n.id)) if (NO_REPEAT.has(p.type)) forbidden.add(p.type);
        const options = Object.entries(weights).filter(([t]) => !forbidden.has(t) && t !== 'boss');
        n.type = weighted(rng, options, ([, w]) => w)[0];
      }
    }
    // Mercader garantizado a mitad del estrato.
    if (r === Math.floor((rows - 1) / 2) && !rowNodes.some((n) => n.type === 'shop')) {
      pick(rng, rowNodes).type = 'shop';
    }
  }
  // Forja garantizada en algún nodo intermedio.
  if (!Object.values(nodes).some((n) => n.type === 'forge')) {
    const candidates = Object.values(nodes).filter((n) => n.row >= 2 && n.row <= rows - 3 && n.type === 'combat');
    if (candidates.length) pick(rng, candidates).type = 'forge';
  }

  for (const n of Object.values(nodes)) {
    if (n.type === 'elite') n.modifier = pick(rng, ELITE_MODIFIERS);
    else if (n.type === 'challenge') n.modifier = pick(rng, CHALLENGE_MODIFIERS);
    else if (n.type === 'combat' && (act.index >= 1 || n.row >= 4) && chance(rng, 22)) n.modifier = pick(rng, FLOOR_MODIFIERS);
  }

  const startIds = byRow(0).map((n) => n.id);
  return { act: act.index, rows, lanes, nodes, startIds, bossId };
}

/** Nodos a los que se puede viajar desde la posición actual. */
export function availableNodes(map, currentId) {
  if (!currentId) return map.startIds;
  return map.nodes[currentId]?.next ?? [];
}
