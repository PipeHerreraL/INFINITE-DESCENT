import { useSyncExternalStore } from 'react';

/** Pantalla estrecha (móvil en vertical) o baja (móvil en horizontal). */
export const COMPACT_QUERY = '(max-width: 720px), (max-height: 520px)';
/** El dispositivo principal es táctil: sin ratón que pueda «pasar por encima». */
export const TOUCH_QUERY = '(hover: none) and (pointer: coarse)';

function subscribeTo(query) {
  return (onChange) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const mql = window.matchMedia(query);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  };
}

const subscribers = {};

export function useMediaQuery(query) {
  subscribers[query] ??= subscribeTo(query);
  return useSyncExternalStore(
    subscribers[query],
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/** Interfaz compacta: paneles plegados y controles grandes. */
export function useCompactUI() {
  return useMediaQuery(COMPACT_QUERY);
}

/** Interfaz táctil: textos de ayuda y gestos para dedos, no para ratón. */
export function useTouchUI() {
  return useMediaQuery(TOUCH_QUERY);
}
