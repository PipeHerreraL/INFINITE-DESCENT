import { createMeta, META_VERSION } from './meta.js';
import { RUN_VERSION } from '../run/run.js';

// Persistencia local. La meta y la expedición se guardan por separado para que
// una partida corrupta nunca borre la progresión permanente.

export const META_KEY = 'infinite-descent/meta';
export const RUN_KEY = 'infinite-descent/run';

export function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

export function defaultStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const probe = '__id_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    }
  } catch {
    // Almacenamiento bloqueado (modo privado, etc.): se usa memoria.
  }
  return memoryStorage();
}

function migrateMeta(raw) {
  const base = createMeta();
  if (!raw || typeof raw !== 'object') return base;
  // Fusión defensiva: los campos nuevos toman su valor por defecto.
  return {
    ...base,
    ...raw,
    version: META_VERSION,
    stats: { ...base.stats, ...raw.stats, byClass: { ...base.stats.byClass, ...(raw.stats?.byClass ?? {}) } },
    codex: { ...base.codex, ...raw.codex },
    settings: { ...base.settings, ...raw.settings },
    unlocks: { ...(raw.unlocks ?? {}) },
  };
}

export function loadMeta(storage) {
  try {
    const raw = storage.getItem(META_KEY);
    return migrateMeta(raw ? JSON.parse(raw) : null);
  } catch {
    return createMeta();
  }
}

export function loadRun(storage) {
  try {
    const raw = storage.getItem(RUN_KEY);
    if (!raw) return null;
    const run = JSON.parse(raw);
    if (!run || run.version !== RUN_VERSION || !run.hero || !run.map) return null;
    return run;
  } catch {
    return null;
  }
}

export function saveState(storage, state) {
  try {
    storage.setItem(META_KEY, JSON.stringify(state.meta));
    if (state.run) storage.setItem(RUN_KEY, JSON.stringify(state.run));
    else storage.removeItem(RUN_KEY);
    return true;
  } catch {
    return false;
  }
}

export function clearAll(storage) {
  storage.removeItem(META_KEY);
  storage.removeItem(RUN_KEY);
}
