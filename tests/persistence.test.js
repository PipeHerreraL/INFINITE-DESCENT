import { describe, it, expect } from 'vitest';
import { reduce, createInitialState } from '../src/core/game/reducer.js';
import { saveState, loadMeta, loadRun, memoryStorage, RUN_KEY, META_KEY } from '../src/core/meta/persistence.js';
import { createMeta, recordRun, buyUnlock } from '../src/core/meta/meta.js';
import { createStore } from '../src/core/game/store.js';
import { availableNodes } from '../src/core/run/mapgen.js';

describe('persistencia', () => {
  it('guarda y recupera una expedición en mitad de un combate', () => {
    const storage = memoryStorage();
    let s = reduce(createInitialState(), { type: 'START_RUN', classId: 'petardista', seed: 'P1' });
    s = reduce(s, { type: 'ENTER_NODE', nodeId: availableNodes(s.run.map, null)[0] });
    s = reduce(s, { type: 'COMBAT', action: { type: 'ready' } });
    saveState(storage, s);
    const run = loadRun(storage);
    expect(run).toEqual(JSON.parse(JSON.stringify(s.run)));
    expect(run.combat.phase).toBe('active');
    // La partida restaurada sigue siendo jugable.
    let restored = { ...createInitialState(loadMeta(storage), run), ui: { screen: 'run' } };
    if (run.combat.activeId === run.combat.heroId) restored = reduce(restored, { type: 'COMBAT', action: { type: 'endTurn' } });
    else restored = reduce(restored, { type: 'COMBAT', action: { type: 'aiStep' } });
    expect(restored.error).toBeNull();
  });

  it('una partida corrupta no rompe la meta-progresión', () => {
    const storage = memoryStorage();
    const meta = createMeta();
    meta.essence = 42;
    storage.setItem(META_KEY, JSON.stringify(meta));
    storage.setItem(RUN_KEY, '{ no es json');
    expect(loadRun(storage)).toBeNull();
    expect(loadMeta(storage).essence).toBe(42);
  });

  it('la meta antigua se migra con valores por defecto', () => {
    const storage = memoryStorage();
    storage.setItem(META_KEY, JSON.stringify({ essence: 7, unlocks: { start_kamas: true } }));
    const meta = loadMeta(storage);
    expect(meta.essence).toBe(7);
    expect(meta.unlocks.start_kamas).toBe(true);
    expect(meta.stats.byClass.furiak).toBeDefined();
    expect(meta.settings.aiSpeed).toBe('normal');
  });

  it('el final de una expedición se registra una sola vez', () => {
    let s = reduce(createInitialState(), { type: 'START_RUN', classId: 'furiak', seed: 'E1' });
    s = reduce(s, { type: 'ABANDON_RUN' });
    const essence = s.meta.essence;
    expect(s.meta.stats.runs).toBe(1);
    const again = recordRun(s.meta, s.run);
    expect(again).toBe(s.run.ended.essence);
    expect(s.meta.stats.runs).toBe(1);
    expect(s.meta.essence).toBe(essence);
  });

  it('los desbloqueos cuestan esencia y no se compran dos veces', () => {
    const meta = createMeta();
    expect(() => buyUnlock(meta, 'start_kamas')).toThrow(/esencia/);
    meta.essence = 100;
    buyUnlock(meta, 'start_kamas');
    expect(meta.essence).toBe(85);
    expect(() => buyUnlock(meta, 'start_kamas')).toThrow(/Ya/);
    const s = reduce(createInitialState(meta), { type: 'START_RUN', classId: 'furiak', seed: 'K' });
    expect(s.run.kamas).toBe(70);
  });

  it('el store guarda automáticamente y restaura al recrearse', async () => {
    const storage = memoryStorage();
    const store = createStore({ storage, autoAi: false });
    store.dispatch({ type: 'START_RUN', classId: 'ensalmador', seed: 'ST' });
    store.flush();
    const store2 = createStore({ storage, autoAi: false });
    expect(store2.getState().run.seed).toBe('ST');
    expect(store2.getState().ui.screen).toBe('run');
  });
});
