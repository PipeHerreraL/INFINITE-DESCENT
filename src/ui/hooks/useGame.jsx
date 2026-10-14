import { createContext, useContext, useSyncExternalStore, useMemo } from 'react';
import { buildHeroProfile } from '../../core/hero/profile.js';

const GameContext = createContext(null);

export function GameProvider({ store, children }) {
  return <GameContext.Provider value={store}>{children}</GameContext.Provider>;
}

export function useStore() {
  return useContext(GameContext);
}

/** Estado completo del juego (inmutable por acción). */
export function useGameState() {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

export function useDispatch() {
  return useStore().dispatch;
}

/** Perfil derivado del héroe (estadísticas, fuentes, hechizos), memorizado por expedición. */
export function useHeroProfile(run) {
  return useMemo(() => (run ? buildHeroProfile(run) : null), [run]);
}
