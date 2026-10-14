import { describe, it, expect } from 'vitest';
import { reduce, createInitialState } from '../src/core/game/reducer.js';
import { generateActMap, availableNodes } from '../src/core/run/mapgen.js';
import { getActConfig } from '../src/content/acts.js';
import { createRng } from '../src/core/rng.js';
import { createShop } from '../src/core/run/shop.js';
import { createForge, upgradeItem } from '../src/core/run/forge.js';
import { createCombatReward } from '../src/core/run/rewards.js';
import { gainXp } from '../src/core/run/run.js';
import { makeRun, makeCombat } from './helpers.js';
import { combatAction } from '../src/core/combat/actions.js';

function started(classId = 'furiak', seed = 'RUN1') {
  return reduce(createInitialState(), { type: 'START_RUN', classId, seed });
}

describe('mapa de la expedición', () => {
  it('es reproducible por semilla', () => {
    const a = generateActMap(createRng('M'), getActConfig(0));
    const b = generateActMap(createRng('M'), getActConfig(0));
    expect(a).toEqual(b);
  });

  it('todas las rutas llevan al jefe y la penúltima fila es descanso', () => {
    for (const seed of ['A', 'B', 'C', 'D', 'E']) {
      const map = generateActMap(createRng(seed), getActConfig(0));
      const boss = map.nodes[map.bossId];
      expect(boss.type).toBe('boss');
      for (const n of Object.values(map.nodes)) {
        if (n.type === 'boss') continue;
        expect(n.next.length).toBeGreaterThan(0);
        if (n.row === map.rows - 2) expect(n.type).toBe('rest');
        if (n.row === 0) expect(n.type).toBe('combat');
      }
      // Desde el inicio se alcanza el jefe.
      const seen = new Set();
      const stack = [...map.startIds];
      while (stack.length) {
        const id = stack.pop();
        if (seen.has(id)) continue;
        seen.add(id);
        stack.push(...map.nodes[id].next);
      }
      expect(seen.has(map.bossId)).toBe(true);
      expect(Object.values(map.nodes).some((n) => n.type === 'shop')).toBe(true);
      expect(map.startIds.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('solo se puede viajar a nodos conectados', () => {
    let s = started();
    const far = Object.values(s.run.map.nodes).find((n) => n.row === 3);
    const next = reduce(s, { type: 'ENTER_NODE', nodeId: far.id });
    expect(next.error.message).toMatch(/No puedes viajar/);
    expect(next.run).toBe(s.run);
    s = reduce(s, { type: 'ENTER_NODE', nodeId: availableNodes(s.run.map, null)[0] });
    expect(s.run.combat).not.toBeNull();
  });
});

describe('recompensas', () => {
  it('las divisas se aplican una sola vez y el objeto solo se elige una vez', () => {
    const run = makeRun();
    const c = makeCombat({ run, enemies: [{ id: 'plumin', x: 3, y: 2 }] });
    c.units[c.unitOrder[1]].hp = 1;
    combatAction(c, { type: 'cast', spellId: 'presion', x: 3, y: 2 });
    expect(c.phase).toBe('victory');
    const kamas = run.kamas;
    run.combat = c;
    let state = { ...createInitialState(), run };
    state = reduce(state, { type: 'COMBAT_FINISH' });
    const room = state.run.room;
    expect(room.type).toBe('reward');
    expect(state.run.kamas).toBe(kamas + room.kamas);
    // Volver a cerrar el combate no da más recompensas.
    const again = reduce(state, { type: 'COMBAT_FINISH' });
    expect(again.error).toBeTruthy();
    expect(again.run.kamas).toBe(state.run.kamas);
    const uid = room.items[0].uid;
    state = reduce(state, { type: 'REWARD_TAKE_ITEM', uid, mode: 'bag' });
    expect(state.run.hero.bag.map((i) => i.uid)).toContain(uid);
    const twice = reduce(state, { type: 'REWARD_TAKE_ITEM', uid: room.items[1]?.uid ?? uid, mode: 'bag' });
    expect(twice.error.message).toMatch(/Ya has elegido/);
    expect(twice.run.hero.bag).toHaveLength(1);
  });

  it('la XP acumulada genera subidas de nivel con elección', () => {
    let state = started();
    const run = structuredClone(state.run);
    gainXp(run, 200);
    expect(run.pendingLevelUps).toBeGreaterThan(1);
    run.room = { type: 'reward', items: [], itemTaken: true, relics: [], relicTaken: true, kamas: 0, xp: 0 };
    state = { ...state, run };
    state = reduce(state, { type: 'LEAVE_ROOM' });
    expect(state.run.room.type).toBe('choice');
    expect(state.run.room.kind).toBe('levelUp');
    expect(state.run.room.options.length).toBe(3);
    const pending = state.run.pendingLevelUps;
    state = reduce(state, { type: 'CHOOSE_OPTION', index: 0 });
    expect(state.run.pendingLevelUps).toBe(pending - 1);
    const skip = reduce(state, { type: 'SKIP_CHOICE' });
    expect(skip.error.message).toMatch(/No puedes omitir/);
  });

  it('una recompensa de jefe incluye un legendario y reliquias', () => {
    const run = makeRun();
    const c = makeCombat({ run, enemies: [{ id: 'plumin', x: 3, y: 2 }] });
    c.floor = 8;
    const reward = createCombatReward(run, c, 'boss');
    expect(reward.items.some((i) => i.rarity === 'legendary')).toBe(true);
    expect(reward.relics.length).toBeGreaterThan(0);
  });
});

describe('mercader y forja', () => {
  it('no se puede comprar sin kamas suficientes y no se compra dos veces', () => {
    let state = started();
    const run = structuredClone(state.run);
    run.room = createShop(run);
    run.kamas = 0;
    state = { ...state, run };
    const fail = reduce(state, { type: 'SHOP_BUY_ITEM', index: 0 });
    expect(fail.error.message).toMatch(/kamas/);
    expect(fail.run).toBe(state.run);
    const rich = structuredClone(state.run);
    rich.kamas = 1000;
    state = { ...state, run: rich };
    state = reduce(state, { type: 'SHOP_BUY_ITEM', index: 0 });
    expect(state.run.kamas).toBeLessThan(1000);
    expect(state.run.hero.bag).toHaveLength(1);
    const again = reduce(state, { type: 'SHOP_BUY_ITEM', index: 0 });
    expect(again.error.message).toMatch(/ya no está/);
  });

  it('vender da kamas y elimina el objeto', () => {
    let state = started();
    const run = structuredClone(state.run);
    run.room = createShop(run);
    state = { ...state, run };
    const uid = state.run.hero.equipment.weapon.uid;
    const k = state.run.kamas;
    state = reduce(state, { type: 'SHOP_SELL', uid });
    expect(state.run.kamas).toBeGreaterThan(k);
    expect(state.run.hero.equipment.weapon).toBeNull();
  });

  it('la forja cobra y respeta el máximo de mejora', () => {
    const run = makeRun();
    const forge = createForge();
    const w = run.hero.equipment.weapon;
    run.fragments = 100;
    run.kamas = 1000;
    upgradeItem(run, forge, w.uid);
    upgradeItem(run, forge, w.uid);
    upgradeItem(run, forge, w.uid);
    expect(w.upgrade).toBe(3);
    expect(run.fragments).toBe(100 - 3 - 5 - 8);
    expect(() => upgradeItem(run, forge, w.uid)).toThrow(/máximo/);
    run.fragments = 0;
    const other = makeRun();
    expect(() => upgradeItem(other, createForge(), other.hero.equipment.weapon.uid)).toThrow(/fragmentos/);
  });
});

describe('expediciones nuevas', () => {
  it('reiniciar no conserva mejoras temporales', () => {
    let state = started('furiak', 'X');
    const run = structuredClone(state.run);
    run.kamas = 999;
    run.hero.relics.push('ascuaEterna');
    run.hero.talents.push('sedSangre');
    run.hero.level = 7;
    run.hero.spells[0].runes.push('runaPoder');
    state = { ...state, run };
    state = reduce(state, { type: 'ABANDON_RUN' });
    expect(state.run.ended).toBeTruthy();
    state = reduce(state, { type: 'CLOSE_RUN' });
    state = reduce(state, { type: 'START_RUN', classId: 'furiak', seed: 'X' });
    expect(state.run.kamas).toBe(30);
    expect(state.run.hero.relics).toEqual([]);
    expect(state.run.hero.talents).toEqual([]);
    expect(state.run.hero.level).toBe(1);
    expect(state.run.hero.spells[0].runes).toEqual([]);
    // La esencia (permanente) sí se conserva.
    expect(state.meta.stats.runs).toBe(1);
  });

  it('la misma semilla produce la misma expedición', () => {
    const a = started('ensalmador', 'SAME');
    const b = started('ensalmador', 'SAME');
    expect(a.run.map).toEqual(b.run.map);
    expect(a.run.hero).toEqual(b.run.hero);
  });

  it('no se puede iniciar con una dificultad bloqueada', () => {
    const s = reduce(createInitialState(), { type: 'START_RUN', classId: 'furiak', seed: 'D', difficulty: 3 });
    expect(s.error.message).toMatch(/dificultad/);
    expect(s.run).toBeNull();
  });
});

describe('regresiones de la revisión', () => {
  it('quitarse y ponerse equipo no cura', async () => {
    const { createItem } = await import('../src/core/items/items.js');
    const { refreshHero } = await import('../src/core/run/run.js');
    let state = started();
    const run = structuredClone(state.run);
    run.hero.equipment.ring1 = createItem(run.rng, 'anilloVital', 'rare', 8, run.counters);
    run.hero.equipment.ring2 = createItem(run.rng, 'anilloBruma', 'rare', 8, run.counters);
    refreshHero(run);
    run.hero.hp = 5;
    state = { ...state, run };
    state = reduce(state, { type: 'UNEQUIP', slot: 'ring1' });
    state = reduce(state, { type: 'UNEQUIP', slot: 'ring2' });
    expect(state.run.hero.hp).toBe(1);
    const [a, b] = state.run.hero.bag;
    state = reduce(state, { type: 'EQUIP', uid: a.uid, slot: 'ring1' });
    state = reduce(state, { type: 'EQUIP', uid: b.uid, slot: 'ring2' });
    expect(state.run.hero.hp).toBe(5);
  });

  it('el mismo modificador no se aplica dos veces', async () => {
    const { startCombat } = await import('../src/core/run/rooms.js');
    const run = makeRun();
    run.nodeId = run.map.startIds[0];
    run.nextCombatModifier = 'escudosBruma';
    startCombat(run, { type: 'elite', modifier: 'escudosBruma' });
    expect(run.combat.modifiers).toEqual(['escudosBruma']);
  });

  it('la forja no conserva un elemento obsoleto tras transmutar', async () => {
    const { createItem } = await import('../src/core/items/items.js');
    const { shiftElement, transmuteLine, createForge, itemOffensiveElement } = await import('../src/core/run/forge.js');
    const run = makeRun();
    run.fragments = 1000;
    run.kamas = 1000;
    // Pieza sin líneas elementales base y con un afijo de Fuerza.
    const it = createItem(run.rng, 'colganteRunico', 'uncommon', 1, run.counters);
    it.lines = it.lines.filter((l) => l.base);
    it.lines.push({ stat: 'strength', roll: 0.5, base: false });
    run.hero.bag.push(it);
    const forge = createForge();
    shiftElement(run, forge, it.uid, 'fire');
    expect(it.elementMap).toEqual({ from: 'earth', to: 'fire' });
    const idx = it.lines.findIndex((l) => !l.base);
    let guard = 0;
    while (itemOffensiveElement(it) === 'earth' && guard++ < 100) transmuteLine(run, forge, it.uid, idx);
    expect(itemOffensiveElement(it)).not.toBe('earth');
    expect(it.elementMap).toBeNull();
  });

  it('dos Trofeos del Coloso no pueden llevarse a la vez', async () => {
    const { createItem } = await import('../src/core/items/items.js');
    const { canEquip } = await import('../src/core/items/equipment.js');
    const run = makeRun();
    run.hero.equipment.trophy1 = createItem(run.rng, 'trofeoColoso', 'legendary', 1, run.counters);
    expect(canEquip(run.hero, createItem(run.rng, 'trofeoColoso', 'legendary', 1, run.counters), 'trophy2').ok).toBe(false);
  });

  it('rechaza dificultades no enteras o negativas', () => {
    expect(reduce(createInitialState(), { type: 'START_RUN', classId: 'furiak', seed: 'D', difficulty: -1 }).error).toBeTruthy();
    expect(reduce(createInitialState(), { type: 'START_RUN', classId: 'furiak', seed: 'D', difficulty: '0' }).error).toBeTruthy();
  });
});
