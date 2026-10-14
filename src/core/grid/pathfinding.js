import { DIRS, key, isFloor } from './geometry.js';

/**
 * BFS de movimiento.
 * - `blocked(x, y)`: casilla ocupada (no se puede atravesar ni terminar en ella).
 * - `stopCell(x, y)`: casilla de zona de control: se puede entrar pero no seguir.
 * Devuelve Map<key, { x, y, dist, prev }> con las casillas alcanzables
 * (incluida la de origen con dist 0).
 */
export function reachableCells(board, start, maxSteps, blocked, stopCell) {
  const result = new Map();
  const startKey = key(start.x, start.y);
  result.set(startKey, { x: start.x, y: start.y, dist: 0, prev: null });
  if (maxSteps <= 0) return result;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const curKey = key(cur.x, cur.y);
    const curNode = result.get(curKey);
    if (curNode.dist >= maxSteps) continue;
    if (curKey !== startKey && stopCell && stopCell(cur.x, cur.y)) continue;
    for (const d of DIRS) {
      const nx = cur.x + d.x;
      const ny = cur.y + d.y;
      const nk = key(nx, ny);
      if (result.has(nk)) continue;
      if (!isFloor(board, nx, ny)) continue;
      if (blocked(nx, ny)) continue;
      result.set(nk, { x: nx, y: ny, dist: curNode.dist + 1, prev: curKey });
      queue.push({ x: nx, y: ny });
    }
  }
  return result;
}

/** Reconstruye el camino (sin la casilla de origen) hasta `target`. */
export function pathFromReach(reach, target) {
  const k = key(target.x, target.y);
  if (!reach.has(k)) return null;
  const path = [];
  let node = reach.get(k);
  while (node && node.prev !== null) {
    path.push({ x: node.x, y: node.y });
    node = reach.get(node.prev);
  }
  return path.reverse();
}

/**
 * Distancia de camino real (ignorando PM) desde `start` a todas las casillas,
 * útil para la IA. Las unidades bloquean salvo las indicadas como objetivo.
 */
export function distanceField(board, start, blocked) {
  const out = new Map();
  out.set(key(start.x, start.y), 0);
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const cd = out.get(key(cur.x, cur.y));
    for (const d of DIRS) {
      const nx = cur.x + d.x;
      const ny = cur.y + d.y;
      const nk = key(nx, ny);
      if (out.has(nk)) continue;
      if (!isFloor(board, nx, ny)) continue;
      if (blocked(nx, ny)) continue;
      out.set(nk, cd + 1);
      queue.push({ x: nx, y: ny });
    }
  }
  return out;
}
