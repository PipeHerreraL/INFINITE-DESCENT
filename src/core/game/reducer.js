import { RuleError, assertRule } from '../errors.js';
import { randomSeed } from '../rng.js';
import { DIFFICULTIES } from '../../content/difficulty.js';
import { createMeta, buyUnlock, recordRun } from '../meta/meta.js';
import { createRun, refreshHero, floorNumber } from '../run/run.js';
import {
  enterNode, finishCombat, leaveRoom, chooseOption, skipChoice, chooseEventOption, chooseRest, openChest,
  victoryChoice, startRelicRoom,
} from '../run/rooms.js';
import { takeRewardItem, skipRewardItem, takeRewardRelic } from '../run/rewards.js';
import { buyItem, buyRelic, buyHeal, buyRune, rerollShop, sellItem } from '../run/shop.js';
import { upgradeItem, transmuteLine, shiftElement } from '../run/forge.js';
import { equipFromBag, unequip, salvage } from '../items/equipment.js';
import { combatAction } from '../combat/actions.js';

// Reducer central. Cada acción trabaja sobre un clon del estado; si una regla
// se incumple se lanza RuleError y el estado original queda intacto.

export function createInitialState(meta = createMeta(), run = null) {
  return { meta, run, ui: { screen: 'title' }, error: null };
}

function requireRun(state) {
  assertRule(state.run && !state.run.ended, 'No hay ninguna expedición en curso.');
  return state.run;
}

function requireNoCombat(run) {
  assertRule(!run.combat, 'No puedes hacer eso durante un combate.');
}

function requireRoom(run, type) {
  assertRule(run.room?.type === type, 'Acción no disponible aquí.');
  return run.room;
}

function onRunEnded(state) {
  if (state.run?.ended && !state.run.ended.recorded) recordRun(state.meta, state.run);
}

const HANDLERS = {
  // ── Navegación y meta
  NAVIGATE(state, { screen }) {
    state.ui.screen = screen;
  },
  BUY_UNLOCK(state, { id }) {
    buyUnlock(state.meta, id);
  },
  SET_SETTING(state, { key, value }) {
    state.meta.settings[key] = value;
  },
  RESET_META(state) {
    state.meta = createMeta();
    state.run = null;
    state.ui.screen = 'title';
  },
  START_RUN(state, { classId, originId = null, seed = null, difficulty = 0 }) {
    assertRule(!state.run || state.run.ended, 'Ya hay una expedición en curso.');
    assertRule(Number.isInteger(difficulty) && difficulty >= 0, 'Dificultad inválida.');
    assertRule(difficulty <= state.meta.maxDifficulty && difficulty < DIFFICULTIES.length, 'Esa dificultad aún no está desbloqueada.');
    const run = createRun({ classId, originId, seed: seed || randomSeed(), difficulty, unlocks: state.meta.unlocks });
    if (state.meta.unlocks.start_relic) {
      const room = startRelicRoom(run);
      if (room) run.room = room;
    }
    state.run = run;
    state.ui.screen = 'run';
  },
  ABANDON_RUN(state) {
    const run = requireRun(state);
    run.combat = null;
    run.room = null;
    run.ended = { victory: false, reason: 'Expedición abandonada.', floor: floorNumber(run) };
  },
  CLOSE_RUN(state) {
    assertRule(state.run?.ended, 'La expedición sigue en curso.');
    state.run = null;
    state.ui.screen = 'title';
  },

  // ── Mapa y salas
  ENTER_NODE(state, { nodeId }) {
    enterNode(requireRun(state), nodeId);
  },
  LEAVE_ROOM(state) {
    leaveRoom(requireRun(state));
  },
  CHOOSE_OPTION(state, { index }) {
    chooseOption(requireRun(state), index);
  },
  SKIP_CHOICE(state) {
    skipChoice(requireRun(state));
  },
  VICTORY_CHOICE(state, { endless }) {
    victoryChoice(requireRun(state), endless);
  },

  // ── Recompensas
  REWARD_TAKE_ITEM(state, { uid, mode, slot = null }) {
    const run = requireRun(state);
    takeRewardItem(run, requireRoom(run, 'reward'), uid, mode, slot);
  },
  REWARD_SKIP_ITEM(state) {
    const run = requireRun(state);
    skipRewardItem(run, requireRoom(run, 'reward'));
  },
  REWARD_TAKE_RELIC(state, { relicId }) {
    const run = requireRun(state);
    takeRewardRelic(run, requireRoom(run, 'reward'), relicId);
  },

  // ── Inventario
  EQUIP(state, { uid, slot = null }) {
    const run = requireRun(state);
    requireNoCombat(run);
    equipFromBag(run.hero, uid, slot);
    refreshHero(run);
  },
  UNEQUIP(state, { slot }) {
    const run = requireRun(state);
    requireNoCombat(run);
    unequip(run.hero, slot);
    refreshHero(run);
  },
  SALVAGE(state, { uid }) {
    const run = requireRun(state);
    requireNoCombat(run);
    salvage(run, uid);
    refreshHero(run);
  },

  // ── Mercader
  SHOP_BUY_ITEM(state, { index }) {
    const run = requireRun(state);
    buyItem(run, requireRoom(run, 'shop'), index);
  },
  SHOP_BUY_RELIC(state) {
    const run = requireRun(state);
    buyRelic(run, requireRoom(run, 'shop'));
  },
  SHOP_HEAL(state) {
    const run = requireRun(state);
    buyHeal(run, requireRoom(run, 'shop'));
  },
  SHOP_RUNE(state) {
    const run = requireRun(state);
    const shop = requireRoom(run, 'shop');
    buyRune(run, shop);
    // La elección de runa se resuelve antes de volver a la tienda.
    const runeRoom = run.queue.shift();
    run.queue.unshift(shop);
    run.room = runeRoom;
  },
  SHOP_REROLL(state) {
    const run = requireRun(state);
    rerollShop(run, requireRoom(run, 'shop'));
  },
  SHOP_SELL(state, { uid }) {
    const run = requireRun(state);
    requireRoom(run, 'shop');
    sellItem(run, uid);
  },

  // ── Forja
  FORGE_UPGRADE(state, { uid }) {
    const run = requireRun(state);
    upgradeItem(run, requireRoom(run, 'forge'), uid);
  },
  FORGE_TRANSMUTE(state, { uid, line }) {
    const run = requireRun(state);
    transmuteLine(run, requireRoom(run, 'forge'), uid, line);
  },
  FORGE_ELEMENT(state, { uid, element }) {
    const run = requireRun(state);
    shiftElement(run, requireRoom(run, 'forge'), uid, element);
  },

  // ── Eventos, descanso, cofres
  EVENT_CHOOSE(state, { index }) {
    chooseEventOption(requireRun(state), index);
  },
  REST_CHOOSE(state, { option }) {
    chooseRest(requireRun(state), option);
  },
  CHEST_OPEN(state) {
    openChest(requireRun(state));
  },

  // ── Combate
  COMBAT(state, { action }) {
    const run = requireRun(state);
    assertRule(run.combat, 'No hay ningún combate.');
    combatAction(run.combat, action);
  },
  COMBAT_FINISH(state) {
    finishCombat(requireRun(state));
  },
};

export function reduce(state, action) {
  const handler = HANDLERS[action.type];
  if (!handler) throw new Error(`Acción desconocida: ${action.type}`);
  const draft = structuredClone(state);
  try {
    handler(draft, action);
    onRunEnded(draft);
    draft.error = null;
    return draft;
  } catch (err) {
    if (err instanceof RuleError) {
      return { ...state, error: { message: err.message, id: (state.error?.id ?? 0) + 1, at: Date.now() } };
    }
    throw err;
  }
}

export const ACTION_TYPES = Object.keys(HANDLERS);
