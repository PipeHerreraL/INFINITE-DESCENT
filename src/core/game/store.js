import { reduce, createInitialState } from './reducer.js';
import { loadMeta, loadRun, saveState, defaultStorage } from '../meta/persistence.js';

// Store central: estado inmutable por acción, suscripción para React,
// guardado automático y «director» de la IA, que reproduce los turnos enemigos
// paso a paso con pausas para que el jugador pueda seguirlos.

const AI_DELAYS = { slow: 900, normal: 520, fast: 220 };
const STEP_MS = { slow: 140, normal: 110, fast: 60 };

export function createStore({ storage = defaultStorage(), autoAi = true } = {}) {
  let state = createInitialState(loadMeta(storage), loadRun(storage));
  if (state.run && !state.run.ended) state.ui.screen = 'run';
  const listeners = new Set();
  let saveTimer = null;
  let aiTimer = null;

  const getState = () => state;

  function scheduleSave() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      saveState(storage, state);
    }, 200);
  }

  function aiDelay() {
    const speed = state.meta.settings.aiSpeed ?? 'normal';
    const combat = state.run?.combat;
    let delay = AI_DELAYS[speed] ?? 520;
    const last = combat?.fx?.[combat.fx.length - 1];
    if (last?.type === 'move') delay += (last.path.length - 1) * (STEP_MS[speed] ?? 110);
    return delay;
  }

  function scheduleAi() {
    if (!autoAi || aiTimer) return;
    const combat = state.run?.combat;
    if (!combat || combat.phase !== 'active') return;
    if (combat.activeId === combat.heroId) return;
    aiTimer = setTimeout(() => {
      aiTimer = null;
      const c = state.run?.combat;
      if (c && c.phase === 'active' && c.activeId !== c.heroId) dispatch({ type: 'COMBAT', action: { type: 'aiStep' } });
    }, aiDelay());
  }

  function dispatch(action) {
    const next = reduce(state, action);
    if (next !== state) {
      state = next;
      listeners.forEach((l) => l());
      scheduleSave();
      scheduleAi();
    }
    return state;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  // Reanuda la IA si se carga una partida guardada en mitad de un turno enemigo.
  scheduleAi();

  return { getState, dispatch, subscribe, flush: () => saveState(storage, state) };
}
