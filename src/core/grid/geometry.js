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

/** Parte de cada lado de la casilla que no cuenta para tapar la visión. */
export const LOS_MARGIN = 0.2;

/** ¿El segmento A→B atraviesa el interior del rectángulo [x0,x1]×[y0,y1]? (Liang–Barsky) */
function segmentCrossesRect(ax, ay, bx, by, x0, y0, x1, y1) {
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dy = by - ay;
  const p = [-dx, dx, -dy, dy];
  const q = [ax - x0, x1 - ax, ay - y0, y1 - ay];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] <= 1e-9) return false;
      continue;
    }
    const r = q[i] / p[i];
    if (p[i] < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
  }
  return t1 - t0 > 1e-9;
}

/**
 * Línea de visión entre los centros de dos casillas. Bloquean los obstáculos,
 * las casillas fuera del tablero y las unidades en casillas intermedias
 * (`isOccupied(x, y)`); los agujeros no bloquean.
 *
 * Cada bloqueo ocupa el centro de su casilla (sin un margen de LOS_MARGIN por
 * lado), así que rozar una esquina o un borde no tapa la visión: se puede
 * disparar en diagonal junto a un obstáculo. Dos bloqueos vecinos (de lado o
 * en diagonal) forman un muro continuo, sin rendijas. Es simétrica.
 */
export function hasLineOfSight(board, from, to, isOccupied) {
  if (from.x === to.x && from.y === to.y) return true;
  const m = LOS_MARGIN;
  const blocks = (x, y) => {
    if ((x === to.x && y === to.y) || (x === from.x && y === from.y)) return false;
    const t = cellType(board, x, y);
    if (t === undefined || t === 'obstacle') return true;
    return isOccupied(x, y);
  };
  const hits = (x0, y0, x1, y1) => segmentCrossesRect(from.x, from.y, to.x, to.y, x0, y0, x1, y1);
  const minX = Math.min(from.x, to.x) - 1;
  const maxX = Math.max(from.x, to.x) + 1;
  const minY = Math.min(from.y, to.y) - 1;
  const maxY = Math.max(from.y, to.y) + 1;
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (!blocks(x, y)) continue;
      // El bloqueo en sí.
      if (hits(x - 0.5 + m, y - 0.5 + m, x + 0.5 - m, y + 0.5 - m)) return false;
      // Puentes con los bloqueos vecinos: derecha, abajo y las dos diagonales.
      if (blocks(x + 1, y) && hits(x + 0.5 - m, y - 0.5 + m, x + 0.5 + m, y + 0.5 - m)) return false;
      if (blocks(x, y + 1) && hits(x - 0.5 + m, y + 0.5 - m, x + 0.5 - m, y + 0.5 + m)) return false;
      if (blocks(x + 1, y + 1) && hits(x + 0.5 - m, y + 0.5 - m, x + 0.5 + m, y + 0.5 + m)) return false;
      if (blocks(x + 1, y - 1) && hits(x + 0.5 - m, y - 0.5 - m, x + 0.5 + m, y - 0.5 + m)) return false;
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
