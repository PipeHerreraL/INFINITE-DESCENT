import { describe, it, expect } from 'vitest';
import { baseView, clampCamera, viewFor, zoomAt, panBy, autoZoom, inView, MAX_ZOOM } from '../src/ui/board/camera.js';

const BOUNDS = { x: -300, y: -100, w: 600, h: 400 };

describe('cámara del tablero', () => {
  it('la vista base contiene el tablero con la proporción del contenedor', () => {
    const tall = baseView(BOUNDS, 0.5); // móvil en vertical
    expect(tall.w / tall.h).toBeCloseTo(0.5);
    expect(tall.w).toBeCloseTo(600);
    expect(tall.y).toBeLessThan(BOUNDS.y);
    const wide = baseView(BOUNDS, 3); // móvil en horizontal
    expect(wide.w / wide.h).toBeCloseTo(3);
    expect(wide.h).toBeCloseTo(400);
    // Centrada en el tablero.
    expect(wide.x + wide.w / 2).toBeCloseTo(BOUNDS.x + BOUNDS.w / 2);
  });

  it('el zoom se limita y la vista nunca sale de la base', () => {
    const base = baseView(BOUNDS, 1.5);
    const cam = clampCamera(base, { scale: 99, cx: 10000, cy: -10000 });
    expect(cam.scale).toBe(MAX_ZOOM);
    const v = viewFor(base, cam);
    expect(v.x + v.w).toBeCloseTo(base.x + base.w);
    expect(v.y).toBeCloseTo(base.y);
    expect(clampCamera(base, { scale: 0.2 }).scale).toBe(1);
  });

  it('el zoom mantiene quieto el punto bajo el dedo o el cursor', () => {
    const base = baseView(BOUNDS, 1.5);
    const cam = clampCamera(base, { scale: 1.5, cx: 0, cy: 50 });
    const before = viewFor(base, cam);
    const fx = 0.3;
    const fy = 0.6;
    const world = { x: before.x + fx * before.w, y: before.y + fy * before.h };
    const after = viewFor(base, zoomAt(base, cam, 1.5, fx, fy));
    expect(after.w).toBeCloseTo(before.w / 1.5);
    expect(after.x + fx * after.w).toBeCloseTo(world.x);
    expect(after.y + fy * after.h).toBeCloseTo(world.y);
  });

  it('arrastrar mueve la vista en sentido contrario al dedo', () => {
    const base = baseView(BOUNDS, 1.5);
    const cam = clampCamera(base, { scale: 2, cx: 0, cy: 100 });
    const moved = panBy(base, cam, 100, 0, 600, 400);
    expect(moved.cx).toBeLessThan(cam.cx);
    expect(moved.cy).toBeCloseTo(cam.cy);
    // Sin zoom no hay a dónde desplazarse.
    const flat = clampCamera(base, { scale: 1 });
    expect(panBy(base, flat, 300, 300, 600, 400)).toEqual(flat);
  });

  it('el zoom inicial agranda las casillas pequeñas y deja igual las grandes', () => {
    const base = baseView(BOUNDS, 0.5);
    // 64 unidades de casilla en un contenedor de 300 px: 32 px por casilla.
    expect(autoZoom(base, 300, 64, 44)).toBeCloseTo(44 / 32);
    expect(autoZoom(base, 2000, 64, 44)).toBe(1);
    expect(autoZoom(base, 50, 64, 44, 2.4)).toBe(2.4);
  });

  it('detecta si un punto queda dentro de la vista con margen', () => {
    const view = { x: 0, y: 0, w: 100, h: 100 };
    expect(inView(view, 50, 50)).toBe(true);
    expect(inView(view, 5, 50)).toBe(false);
    expect(inView(view, 150, 50)).toBe(false);
  });
});
