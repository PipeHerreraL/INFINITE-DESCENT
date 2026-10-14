import { key, parseKey, DIRS, dist } from './geometry.js';
import { int, next, pick, shuffle } from '../rng.js';

// Genera tableros con forma de mapa de Dofus: en la vista isométrica se ven
// como un rectángulo ancho. Internamente se usan las coordenadas
// s = x + y (fila en pantalla) y d = x − y (columna en pantalla).

const DECOR_BY_STYLE = {
  meadow: ['tree', 'rock', 'bush', 'tree'],
  cave: ['stalagmite', 'crystal', 'rock'],
  arena: ['pillar'],
  web: ['cocoon', 'stalagmite', 'crystal'],
};

function baseShape(D, R) {
  const cells = {};
  const mid = D + R / 2;
  for (let s = D; s <= D + R; s++) {
    for (let d = -D; d <= D; d++) {
      if ((s + d) % 2 !== 0) continue;
      // Esquinas recortadas para una silueta más orgánica.
      if (Math.abs(d) / D + Math.abs(s - mid) / (R / 2) > 1.7) continue;
      const x = (s + d) / 2;
      const y = (s - d) / 2;
      cells[key(x, y)] = 'floor';
    }
  }
  return cells;
}

function sOf(c) {
  return c.x + c.y;
}
function dOf(c) {
  return c.x - c.y;
}

function startZones(cells, D, R) {
  const mid = D + R / 2;
  const player = [];
  const enemy = [];
  for (const k of Object.keys(cells)) {
    if (cells[k] !== 'floor') continue;
    const c = parseKey(k);
    const s = sOf(c);
    const d = dOf(c);
    if (Math.abs(s - mid) > 4) continue;
    if (d >= -6 && d <= -3) player.push(c);
    if (d >= 3 && d <= 6) enemy.push(c);
  }
  return { player, enemy };
}

function connectedFrom(cells, start) {
  const seen = new Set([key(start.x, start.y)]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    for (const d of DIRS) {
      const nk = key(cur.x + d.x, cur.y + d.y);
      if (seen.has(nk) || cells[nk] !== 'floor') continue;
      seen.add(nk);
      queue.push({ x: cur.x + d.x, y: cur.y + d.y });
    }
  }
  return seen;
}

function spaced(rng, candidates, count, minDist) {
  const chosen = [];
  for (const c of shuffle(rng, candidates)) {
    if (chosen.every((o) => dist(o, c) >= minDist)) chosen.push(c);
    if (chosen.length >= count) break;
  }
  return chosen;
}

/**
 * @param rng estado RNG
 * @param opts { D, R, obstacleRate, holeRate, style, layout }
 */
export function generateBoard(rng, opts = {}) {
  const D = opts.D ?? 7;
  const R = opts.R ?? 16;
  const style = opts.style ?? 'meadow';
  const decorPool = DECOR_BY_STYLE[style] ?? DECOR_BY_STYLE.meadow;

  if (opts.layout === 'arena') return arenaBoard(D, R, style);

  for (let attempt = 0; attempt < 30; attempt++) {
    const cells = baseShape(D, R);
    const decor = {};
    const zones = startZones(cells, D, R);
    const protectedKeys = new Set();
    // Se protegen solo los núcleos de las zonas de inicio.
    for (const c of [...zones.player, ...zones.enemy]) {
      if (Math.abs(dOf(c)) >= 4 && Math.abs(dOf(c)) <= 5) protectedKeys.add(key(c.x, c.y));
    }

    const allKeys = Object.keys(cells);
    const total = allKeys.length;
    const obstacleTarget = Math.round(total * (opts.obstacleRate ?? 0.1));
    const holeTarget = Math.round(total * (opts.holeRate ?? 0.03));

    let placed = 0;
    let guard = 0;
    while (placed < obstacleTarget && guard++ < 500) {
      const seed = parseKey(pick(rng, allKeys));
      const clusterSize = int(rng, 1, 3);
      let cur = seed;
      const variant = pick(rng, decorPool);
      for (let i = 0; i < clusterSize && placed < obstacleTarget; i++) {
        const k = key(cur.x, cur.y);
        if (cells[k] === 'floor' && !protectedKeys.has(k)) {
          cells[k] = 'obstacle';
          decor[k] = variant;
          placed++;
        }
        const d = DIRS[Math.floor(next(rng) * 4)];
        cur = { x: cur.x + d.x, y: cur.y + d.y };
      }
    }

    let holes = 0;
    guard = 0;
    while (holes < holeTarget && guard++ < 300) {
      const seed = parseKey(pick(rng, allKeys));
      const k = key(seed.x, seed.y);
      if (cells[k] !== 'floor' || protectedKeys.has(k)) continue;
      // Agujeros solo en la franja central para no cortar zonas de inicio.
      if (Math.abs(dOf(seed)) > 2) continue;
      cells[k] = 'hole';
      holes++;
    }

    const freshZones = startZones(cells, D, R);
    const playerStarts = spaced(rng, freshZones.player, 5, 2);
    const enemyStarts = spaced(rng, freshZones.enemy, 8, 1);
    if (playerStarts.length < 3 || enemyStarts.length < 6) continue;

    const reach = connectedFrom(cells, playerStarts[0]);
    const floorCount = Object.values(cells).filter((t) => t === 'floor').length;
    const allStartsReachable = [...playerStarts, ...enemyStarts].every((c) => reach.has(key(c.x, c.y)));
    if (!allStartsReachable || reach.size < floorCount * 0.88) continue;

    // Las islas inaccesibles se convierten en obstáculos.
    for (const k of Object.keys(cells)) {
      if (cells[k] === 'floor' && !reach.has(k)) {
        cells[k] = 'obstacle';
        decor[k] = pick(rng, decorPool);
      }
    }
    return { cells, decor, D, R, style, playerStarts, enemyStarts };
  }
  // Último recurso: tablero limpio.
  const cells = baseShape(D, R);
  const zones = startZones(cells, D, R);
  return {
    cells,
    decor: {},
    D,
    R,
    style,
    playerStarts: spaced(rng, zones.player, 5, 2),
    enemyStarts: spaced(rng, zones.enemy, 8, 1),
  };
}

/** Arena de jefe: simétrica, con pilares contra los que estrellar cargas. */
function arenaBoard(D, R, style) {
  const cells = baseShape(D, R);
  const decor = {};
  const mid = D + R / 2;
  const pillarSD = [
    [mid - 4, -2], [mid - 4, 2], [mid + 4, -2], [mid + 4, 2],
    [mid, -5], [mid, 5], [mid - 2, 0], [mid + 2, 0],
  ];
  for (const [s0, d] of pillarSD) {
    // Ajuste de paridad: solo existen las casillas con s + d par.
    const s = (s0 + d) % 2 === 0 ? s0 : s0 + 1;
    const x = (s + d) / 2;
    const y = (s - d) / 2;
    const k = key(x, y);
    if (cells[k]) {
      cells[k] = 'obstacle';
      decor[k] = style === 'web' ? 'cocoon' : 'pillar';
    }
  }
  const zones = startZones(cells, D, R);
  const player = zones.player.filter((c) => dOf(c) <= -4);
  const enemy = zones.enemy.filter((c) => dOf(c) >= 3);
  const byCenter = (a, b) => Math.abs(sOf(a) - mid) - Math.abs(sOf(b) - mid);
  return {
    cells,
    decor,
    D,
    R,
    style,
    playerStarts: player.sort(byCenter).slice(0, 5),
    enemyStarts: enemy.sort(byCenter).slice(0, 8),
  };
}
