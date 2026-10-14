import { reduce, createInitialState } from './reducer.js';
import { loadMeta, loadRun, saveState, defaultStorage } from '../meta/persistence.js';

// Store central: estado inmutable por acción, suscripción para React,
// guardado automático y «director» de la IA, que reproduce los turnos enemigos
// paso a paso con pausas para que el jugador pueda seguirlos.

const AI_DELAYS = { slow: 900, normal: 520, fast: 220 };
/** Duración de cada paso de la animación de movimiento (compartida con el tablero). */
export const STEP_MS = { slow: 140, normal: 110, fast: 70 };

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
    // Espera a que termine la animación del último movimiento de esta acción.
    const move = combat?.fx?.findLast((f) => f.type === 'move' && f.act === combat.actionSeq);
    if (move) delay += (move.path.length - 1) * (STEP_MS[speed] ?? 110);
    return delay;
  }

  function scheduleAi() {
    if (!autoAi || aiTimer) return;
    // La IA se pausa mientras el jugador no está en la pantalla de la expedición.
    if (state.ui.screen !== 'run') return;
    const combat = state.run?.combat;
    if (!combat || combat.phase !== 'active') return;
    if (combat.activeId === combat.heroId) return;
    aiTimer = setTimeout(() => {
      aiTimer = null;
      const c = state.run?.combat;
      if (state.ui.screen === 'run' && c && c.phase === 'active' && c.activeId !== c.heroId) dispatch({ type: 'COMBAT', action: { type: 'aiStep' } });
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
