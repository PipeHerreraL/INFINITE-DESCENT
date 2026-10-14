// Geometría del tablero. Coordenadas ortogonales (x, y) con vecindad de 4
// direcciones; la vista isométrica gira la cuadrícula 45° como en Dofus.

export const key = (x, y) => `${x},${y}`;
export const parseKey = (k) => {
  const [x, y] = k.split(',').map(Number);
  return { x, y };
};

export const DIRS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function dist(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function sameCell(a, b) {
  return a && b && a.x === b.x && a.y === b.y;
}

export function inLine(a, b) {
  return a.x === b.x || a.y === b.y;
}

export function cellType(board, x, y) {
  return board.cells[key(x, y)];
}

export function inBoard(board, x, y) {
  return board.cells[key(x, y)] !== undefined;
}

export function isFloor(board, x, y) {
  return board.cells[key(x, y)] === 'floor';
}

export function neighbors(board, cell) {
  const out = [];
  for (const d of DIRS) {
    const x = cell.x + d.x;
    const y = cell.y + d.y;
    if (inBoard(board, x, y)) out.push({ x, y });
  }
  return out;
}

/**
 * Dirección de desplazamiento de `from` hacia `to`. Si están en diagonal exacta,
 * la dirección es diagonal (como los empujes en diagonal de Dofus).
 */
export function direction(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return { x: 0, y: 0 };
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax > ay) return { x: Math.sign(dx), y: 0 };
  if (ay > ax) return { x: 0, y: Math.sign(dy) };
  return { x: Math.sign(dx), y: Math.sign(dy) };
}

/**
 * Casillas atravesadas por el segmento entre los centros de `a` y `b`
 * (supercover). Cuando el segmento pasa exactamente por una esquina,
 * se devuelve un grupo `{ corner: [c1, c2] }`: basta que una esté libre.
 * No incluye la casilla inicial; sí la final.
 */
export function lineCells(a, b) {
  const out = [];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const nx = Math.abs(dx);
  const ny = Math.abs(dy);
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  let x = a.x;
  let y = a.y;
  let ix = 0;
  let iy = 0;
  while (ix < nx || iy < ny) {
    const decision = (1 + 2 * ix) * ny - (1 + 2 * iy) * nx;
    if (decision === 0) {
      out.push({ corner: [{ x: x + sx, y }, { x, y: y + sy }] });
      x += sx;
      y += sy;
      ix++;
      iy++;
    } else if (decision < 0) {
      x += sx;
      ix++;
    } else {
      y += sy;
      iy++;
    }
    out.push({ x, y });
  }
  return out;
}

/**
 * Línea de visión: bloquean los obstáculos y las unidades en casillas
 * intermedias. Los agujeros no bloquean la visión.
 * `isOccupied(x, y)` indica si hay una unidad en la casilla.
 */
export function hasLineOfSight(board, from, to, isOccupied) {
  if (from.x === to.x && from.y === to.y) return true;
  const blocks = (c) => {
    if (c.x === to.x && c.y === to.y) return false;
    const t = cellType(board, c.x, c.y);
    if (t === undefined || t === 'obstacle') return true;
    return isOccupied(c.x, c.y);
  };
  for (const entry of lineCells(from, to)) {
    if (entry.corner) {
      if (blocks(entry.corner[0]) && blocks(entry.corner[1])) return false;
    } else if (blocks(entry)) {
      return false;
    }
  }
  return true;
}

/**
 * Casillas de un área de efecto.
 * shape: single | circle | cross | line | perpLine | ring | square
 * `origin` (lanzador) define la orientación de las líneas.
 */
export function areaCells(board, area, center, origin) {
  const shape = area?.shape ?? 'single';
  const size = area?.size ?? 0;
  const cells = [];
  const push = (x, y) => {
    if (inBoard(board, x, y)) cells.push({ x, y });
  };
  switch (shape) {
    case 'single':
      push(center.x, center.y);
      break;
    case 'circle':
      for (let dx = -size; dx <= size; dx++) {
        for (let dy = -size; dy <= size; dy++) {
          if (Math.abs(dx) + Math.abs(dy) <= size) push(center.x + dx, center.y + dy);
        }
      }
      break;
    case 'ring':
      for (let dx = -size; dx <= size; dx++) {
        for (let dy = -size; dy <= size; dy++) {
          if (Math.abs(dx) + Math.abs(dy) === size) push(center.x + dx, center.y + dy);
        }
      }
      break;
    case 'square':
      for (let dx = -size; dx <= size; dx++) {
        for (let dy = -size; dy <= size; dy++) push(center.x + dx, center.y + dy);
      }
      break;
    case 'cross':
      push(center.x, center.y);
      for (let i = 1; i <= size; i++) {
        push(center.x + i, center.y);
        push(center.x - i, center.y);
        push(center.x, center.y + i);
        push(center.x, center.y - i);
      }
      break;
    case 'line': {
      const dir = origin ? direction(origin, center) : { x: 1, y: 0 };
      const d = dir.x === 0 && dir.y === 0 ? { x: 1, y: 0 } : dir;
      for (let i = 0; i <= size; i++) push(center.x + d.x * i, center.y + d.y * i);
      break;
    }
    case 'perpLine': {
      const dir = origin ? direction(origin, center) : { x: 1, y: 0 };
      const perp = dir.x !== 0 && dir.y === 0 ? { x: 0, y: 1 } : { x: 1, y: 0 };
      push(center.x, center.y);
      for (let i = 1; i <= size; i++) {
        push(center.x + perp.x * i, center.y + perp.y * i);
        push(center.x - perp.x * i, center.y - perp.y * i);
      }
      break;
    }
    default:
      push(center.x, center.y);
  }
  return cells;
}

/** Casillas del tablero a distancia [min, max] de `center`. */
export function cellsInRange(board, center, min, max) {
  const out = [];
  for (const k of Object.keys(board.cells)) {
    const c = parseKey(k);
    const d = dist(c, center);
    if (d >= min && d <= max) out.push(c);
  }
  return out;
}
