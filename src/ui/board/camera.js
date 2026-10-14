// Cámara del tablero: qué rectángulo del mundo (unidades del SVG) se muestra.
// Funciones puras para poder probarlas sin navegador.

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3.5;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Vista base (zoom 1): el menor rectángulo con la proporción del contenedor
 * (`aspect` = ancho / alto) que contiene todo el tablero, centrado.
 */
export function baseView(bounds, aspect) {
  let w = bounds.w;
  let h = bounds.h;
  if (!(aspect > 0)) aspect = w / h;
  if (w / h > aspect) h = w / aspect;
  else w = h * aspect;
  return { x: bounds.x + bounds.w / 2 - w / 2, y: bounds.y + bounds.h / 2 - h / 2, w, h };
}

/** Ajusta la cámara a los límites: zoom permitido y sin salirse de la base. */
export function clampCamera(base, cam) {
  const scale = clamp(cam.scale ?? 1, MIN_ZOOM, MAX_ZOOM);
  const w = base.w / scale;
  const h = base.h / scale;
  const cx = clamp(cam.cx ?? base.x + base.w / 2, base.x + w / 2, base.x + base.w - w / 2);
  const cy = clamp(cam.cy ?? base.y + base.h / 2, base.y + h / 2, base.y + base.h - h / 2);
  return { scale, cx, cy };
}

/** Rectángulo visible para una cámara. */
export function viewFor(base, cam) {
  const c = clampCamera(base, cam);
  const w = base.w / c.scale;
  const h = base.h / c.scale;
  return { x: c.cx - w / 2, y: c.cy - h / 2, w, h };
}

/**
 * Zoom por `factor` manteniendo quieto el punto del mundo que está bajo
 * (fx, fy), expresado como fracción del contenedor (0..1).
 */
export function zoomAt(base, cam, factor, fx = 0.5, fy = 0.5) {
  const view = viewFor(base, cam);
  const wx = view.x + fx * view.w;
  const wy = view.y + fy * view.h;
  const scale = clamp(clampCamera(base, cam).scale * factor, MIN_ZOOM, MAX_ZOOM);
  const w = base.w / scale;
  const h = base.h / scale;
  return clampCamera(base, { scale, cx: wx - fx * w + w / 2, cy: wy - fy * h + h / 2 });
}

/** Desplaza la vista arrastrando (dx, dy) píxeles en un contenedor de (cw × ch). */
export function panBy(base, cam, dx, dy, cw, ch) {
  const view = viewFor(base, cam);
  return clampCamera(base, {
    scale: cam.scale,
    cx: view.x + view.w / 2 - (dx * view.w) / cw,
    cy: view.y + view.h / 2 - (dy * view.h) / ch,
  });
}

/**
 * Zoom inicial: el necesario para que una casilla de `tileW` unidades mida al
 * menos `minPx` píxeles en pantalla (sin pasar de `maxAuto`).
 */
export function autoZoom(base, containerW, tileW, minPx = 44, maxAuto = 2.4) {
  if (!(containerW > 0)) return 1;
  const tilePx = (tileW * containerW) / base.w;
  return clamp(minPx / tilePx, MIN_ZOOM, maxAuto);
}

/** ¿Está el punto (x, y) dentro de la vista, dejando un margen relativo? */
export function inView(view, x, y, margin = 0.12) {
  const mx = view.w * margin;
  const my = view.h * margin;
  return x >= view.x + mx && x <= view.x + view.w - mx && y >= view.y + my && y <= view.y + view.h - my;
}
