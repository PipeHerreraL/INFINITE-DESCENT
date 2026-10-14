import { describe, it, expect } from 'vitest';
import { dist, lineCells, hasLineOfSight, areaCells, direction, key } from '../src/core/grid/geometry.js';
import { reachableCells, pathFromReach } from '../src/core/grid/pathfinding.js';
import { generateBoard } from '../src/core/grid/boardgen.js';
import { createRng } from '../src/core/rng.js';
import { makeBoard } from './helpers.js';

describe('geometría', () => {
  it('distancia Manhattan', () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
  });

  it('dirección de empuje: eje dominante y diagonal exacta', () => {
    expect(direction({ x: 0, y: 0 }, { x: 3, y: 1 })).toEqual({ x: 1, y: 0 });
    expect(direction({ x: 0, y: 0 }, { x: -1, y: -4 })).toEqual({ x: 0, y: -1 });
    expect(direction({ x: 0, y: 0 }, { x: 2, y: 2 })).toEqual({ x: 1, y: 1 });
  });

  it('lineCells recorre las casillas y termina en el destino', () => {
    const cells = lineCells({ x: 0, y: 0 }, { x: 3, y: 0 });
    expect(cells.at(-1)).toEqual({ x: 3, y: 0 });
    expect(cells).toHaveLength(3);
  });

  it('la línea de visión se bloquea con obstáculos y unidades, no con agujeros', () => {
    const board = makeBoard(8, 8, { obstacles: [[2, 0]], holes: [[2, 2]] });
    const none = () => false;
    expect(hasLineOfSight(board, { x: 0, y: 0 }, { x: 4, y: 0 }, none)).toBe(false);
    expect(hasLineOfSight(board, { x: 0, y: 2 }, { x: 4, y: 2 }, none)).toBe(true);
    const unitAt22 = (x, y) => x === 1 && y === 3;
    expect(hasLineOfSight(board, { x: 0, y: 3 }, { x: 4, y: 3 }, unitAt22)).toBe(false);
    // La casilla objetivo ocupada no bloquea.
    expect(hasLineOfSight(board, { x: 0, y: 3 }, { x: 1, y: 3 }, unitAt22)).toBe(true);
  });

  it('la línea de visión es simétrica', () => {
    const board = makeBoard(10, 10, { obstacles: [[3, 2], [5, 5], [2, 6]] });
    const none = () => false;
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const a = hasLineOfSight(board, { x: 0, y: 0 }, { x, y }, none);
        const b = hasLineOfSight(board, { x, y }, { x: 0, y: 0 }, none);
        expect(a).toBe(b);
      }
    }
  });

  it('áreas: círculo, cruz y línea orientada', () => {
    const board = makeBoard(10, 10);
    expect(areaCells(board, { shape: 'circle', size: 1 }, { x: 5, y: 5 })).toHaveLength(5);
    expect(areaCells(board, { shape: 'circle', size: 2 }, { x: 5, y: 5 })).toHaveLength(13);
    expect(areaCells(board, { shape: 'cross', size: 2 }, { x: 5, y: 5 })).toHaveLength(9);
    const line = areaCells(board, { shape: 'line', size: 1 }, { x: 5, y: 5 }, { x: 3, y: 5 });
    expect(line).toEqual([{ x: 5, y: 5 }, { x: 6, y: 5 }]);
    // Las casillas fuera del tablero se descartan.
    expect(areaCells(board, { shape: 'circle', size: 1 }, { x: 0, y: 0 })).toHaveLength(3);
  });
});

describe('pathfinding', () => {
  it('respeta PM, unidades y obstáculos', () => {
    const board = makeBoard(6, 6, { obstacles: [[1, 0]] });
    const blocked = (x, y) => x === 0 && y === 1;
    const reach = reachableCells(board, { x: 0, y: 0 }, 3, blocked, null);
    expect(reach.has(key(1, 0))).toBe(false);
    expect(reach.has(key(0, 1))).toBe(false);
    // Encerrado entre obstáculo y unidad: solo su propia casilla.
    expect(reach.size).toBe(1);
  });

  it('la zona de control detiene el movimiento', () => {
    const board = makeBoard(8, 8);
    const zoc = new Set([key(2, 0)]);
    const reach = reachableCells(board, { x: 0, y: 0 }, 5, () => false, (x, y) => zoc.has(key(x, y)));
    expect(reach.has(key(2, 0))).toBe(true);
    // No se atraviesa la casilla de control: (3,0) solo se alcanza rodeando.
    const path = pathFromReach(reach, { x: 3, y: 0 });
    expect(path.some((c) => c.x === 2 && c.y === 0)).toBe(false);
  });
});

describe('generación de tableros', () => {
  it('es reproducible por semilla y conectada', () => {
    const a = generateBoard(createRng('X1'));
    const b = generateBoard(createRng('X1'));
    expect(a).toEqual(b);
    expect(a.playerStarts.length).toBeGreaterThanOrEqual(3);
    expect(a.enemyStarts.length).toBeGreaterThanOrEqual(6);
    for (const c of [...a.playerStarts, ...a.enemyStarts]) expect(a.cells[key(c.x, c.y)]).toBe('floor');
  });

  it('la arena del jefe tiene pilares', () => {
    const arena = generateBoard(createRng('A'), { layout: 'arena' });
    expect(Object.values(arena.cells).filter((t) => t === 'obstacle').length).toBeGreaterThanOrEqual(6);
  });
});
