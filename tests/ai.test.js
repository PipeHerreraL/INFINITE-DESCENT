import { describe, it, expect } from 'vitest';
import { makeBoard, makeCombat, forceTurn, hero, enemies } from './helpers.js';
import { runAiStep } from '../src/core/combat/actions.js';
import { hasLineOfSight, dist } from '../src/core/grid/geometry.js';

const none = () => false;

/** Juega un turno completo de la IA para `unit`. */
function playTurn(combat, unit) {
  forceTurn(combat, unit.id);
  for (let i = 0; i < 20 && combat.phase === 'active' && combat.activeId === unit.id; i++) runAiStep(combat);
}

describe('línea de visión en diagonal', () => {
  it('rozar la esquina de un obstáculo no tapa la visión', () => {
    const board = makeBoard(12, 12, { obstacles: [[6, 5]] });
    // Diagonal exacta junto al obstáculo.
    expect(hasLineOfSight(board, { x: 5, y: 5 }, { x: 8, y: 8 }, none)).toBe(true);
    expect(hasLineOfSight(board, { x: 5, y: 5 }, { x: 8, y: 2 }, none)).toBe(true);
    // Casi diagonal: la línea solo roza la esquina.
    expect(hasLineOfSight(board, { x: 5, y: 5 }, { x: 11, y: 0 }, none)).toBe(true);
    // Justo detrás sí está tapado.
    expect(hasLineOfSight(board, { x: 5, y: 5 }, { x: 8, y: 5 }, none)).toBe(false);
  });

  it('dos bloqueos en diagonal o de lado forman un muro sin rendijas', () => {
    const diagonal = makeBoard(12, 12, { obstacles: [[6, 5], [5, 6]] });
    expect(hasLineOfSight(diagonal, { x: 5, y: 5 }, { x: 8, y: 8 }, none)).toBe(false);
    const wall = makeBoard(12, 12, { obstacles: [[6, 4], [6, 5]] });
    expect(hasLineOfSight(wall, { x: 5, y: 5 }, { x: 9, y: 4 }, none)).toBe(false);
    expect(hasLineOfSight(wall, { x: 5, y: 5 }, { x: 7, y: 3 }, none)).toBe(false);
  });

  it('una unidad al lado no tapa media zona del mapa', () => {
    const board = makeBoard(12, 12);
    const unitAt = (x, y) => x === 6 && y === 5;
    let visible = 0;
    for (let x = 6; x < 12; x++) for (let y = 0; y < 12; y++) if (hasLineOfSight(board, { x: 5, y: 5 }, { x, y }, unitAt)) visible++;
    // Antes solo quedaban 5 casillas visibles a ese lado; ahora la sombra es un cono estrecho.
    expect(visible).toBeGreaterThan(40);
  });
});

describe('IA: se acerca por el camino, no en línea recta', () => {
  it('un enemigo a distancia rodea un muro para conseguir línea de visión y atacar', () => {
    const wall = Array.from({ length: 8 }, (_, y) => [5, y]);
    const combat = makeCombat({
      board: makeBoard(12, 12, { obstacles: wall }),
      hero: { x: 2, y: 3 },
      enemies: [{ id: 'koboldChispero', x: 8, y: 3 }],
    });
    const kobold = enemies(combat)[0];
    const h = hero(combat);
    const start = h.hp;
    for (let t = 0; t < 4 && h.hp === start; t++) playTurn(combat, kobold);
    expect(h.hp).toBeLessThan(start);
  });

  it('un enemigo cuerpo a cuerpo rodea los agujeros hasta llegar al héroe', () => {
    const holes = Array.from({ length: 9 }, (_, y) => [5, y]);
    const combat = makeCombat({
      board: makeBoard(12, 12, { holes }),
      hero: { x: 2, y: 4 },
      enemies: [{ id: 'plumin', x: 8, y: 4 }],
    });
    const plumin = enemies(combat)[0];
    const h = hero(combat);
    for (let t = 0; t < 8 && dist(plumin, h) > 1; t++) playTurn(combat, plumin);
    expect(dist(plumin, h)).toBe(1);
  });

  it('no se queda atascado si otro monstruo tapa el pasillo', () => {
    // Pasillo de una casilla de ancho (y = 4) entre dos muros, con un aliado parado dentro.
    const obstacles = [];
    for (let x = 4; x <= 7; x++) for (const y of [0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11]) obstacles.push([x, y]);
    const combat = makeCombat({
      board: makeBoard(12, 12, { obstacles }),
      hero: { x: 1, y: 4 },
      enemies: [{ id: 'huevoArana', x: 5, y: 4 }, { id: 'plumin', x: 10, y: 8 }],
    });
    const plumin = enemies(combat).find((u) => u.defId === 'plumin');
    const before = dist(plumin, { x: 8, y: 4 });
    playTurn(combat, plumin);
    // Avanza hacia la entrada del pasillo aunque el saco de huevos lo bloquee.
    expect(dist(plumin, { x: 8, y: 4 })).toBeLessThan(before);
  });
});
