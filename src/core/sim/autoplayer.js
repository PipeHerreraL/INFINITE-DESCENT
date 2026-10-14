// Jugador automático para simulaciones de equilibrio y pruebas de estrés.
// Usa exclusivamente el reducer (mismas reglas que la interfaz) y una política
// sencilla: equipa lo que mejora su puntuación, desmantela el resto, se cura
// cuando lo necesita y usa la IA de combate para su héroe.
import { reduce, createInitialState } from '../game/reducer.js';
import { availableNodes } from '../run/mapgen.js';
import { buildHeroProfile } from '../hero/profile.js';
import { itemStats, itemTriggers } from '../items/items.js';
import { defaultSlotFor, canEquip } from '../items/equipment.js';
import { slotsForType, getItemDef } from '../../content/items/index.js';
import { ELEMENTS } from '../../content/elements.js';
import { EVENTS } from '../../content/events.js';
import { optionAvailability, restOptions } from '../run/rooms.js';
import { price } from '../run/shop.js';
import { upgradeCost } from '../run/forge.js';
import { createRng, next, pick } from '../rng.js';
import { RARITY_ORDER } from '../../content/rarities.js';

const WEIGHTS = {
  vitality: 1, power: 1.3, damage: 5, crit: 3, critDamage: 2, heals: 1.5, healPct: 1,
  resEarth: 1, resFire: 1, resWater: 1, resAir: 1, resNeutral: 1, lock: 0.3, dodge: 0.4, initiative: 0.05,
  pushDamage: 0.6, lifesteal: 3, dmgPct: 4, meleePct: 2, rangedPct: 2, weaponPct: 1.5, spellPct: 2.5,
  ap: 45, mp: 30, range: 8, maxHpPct: 2, damageTakenPct: -3, summons: 10, bombMax: 15, bombStartCharge: 12,
};

export function itemScore(run, item) {
  const profile = buildHeroProfile(run);
  const dom = profile.dominantElement;
  const stats = itemStats(item);
  let s = 0;
  for (const [k, v] of Object.entries(stats)) {
    if (WEIGHTS[k] !== undefined) s += WEIGHTS[k] * v;
    else {
      const el = Object.values(ELEMENTS).find((e) => e.stat === k || e.dmg === k);
      if (el) s += (el.id === dom ? 1.4 : 0.35) * v * (k === el.dmg ? 4 : 1);
    }
  }
  s += itemTriggers(item).length * 18;
  s += RARITY_ORDER.indexOf(item.rarity) * 3;
  if (getItemDef(item.baseId).set) s += 10;
  return s;
}

function bestSlotFor(run, item) {
  const def = getItemDef(item.baseId);
  let best = null;
  for (const slot of slotsForType(def.type)) {
    if (!canEquip(run.hero, item, slot).ok) continue;
    const cur = run.hero.equipment[slot];
    const gain = itemScore(run, item) - (cur ? itemScore(run, cur) : 0);
    if (!best || gain > best.gain) best = { slot, gain };
  }
  return best;
}

export function createAutoPlayer(seed) {
  const rng = createRng(`auto:${seed}`);

  function decideRoom(state) {
    const run = state.run;
    const room = run.room;
    switch (room.type) {
      case 'reward': {
        if (!room.itemTaken) {
          let best = null;
          for (const item of room.items) {
            const s = bestSlotFor(run, item);
            if (s && s.gain > 0 && (!best || s.gain > best.gain)) best = { ...s, item };
          }
          if (best) {
            const bagFull = run.hero.bag.length >= 6;
            if (!(run.hero.equipment[best.slot] && bagFull)) return { type: 'REWARD_TAKE_ITEM', uid: best.item.uid, mode: 'equip', slot: best.slot };
          }
          return { type: 'REWARD_TAKE_ITEM', uid: room.items[0].uid, mode: 'salvage' };
        }
        if (!room.relicTaken && room.relics.length) return { type: 'REWARD_TAKE_RELIC', relicId: room.relics[0] };
        if (run.hero.bag.length) return { type: 'SALVAGE', uid: run.hero.bag[0].uid };
        return { type: 'LEAVE_ROOM' };
      }
      case 'choice':
        if (!room.options.length) return { type: 'SKIP_CHOICE' };
        return { type: 'CHOOSE_OPTION', index: Math.floor(next(rng) * room.options.length) };
      case 'event': {
        if (room.resolved) return { type: 'LEAVE_ROOM' };
        const ev = EVENTS[room.eventId];
        const ok = ev.options.map((o, i) => ({ o, i })).filter(({ o }) => optionAvailability(run, o).ok);
        return { type: 'EVENT_CHOOSE', index: pick(rng, ok).i };
      }
      case 'rest': {
        if (room.used) return { type: 'LEAVE_ROOM' };
        const opts = restOptions(run).filter((o) => o.ok);
        const hpRatio = run.hero.hp / run.hero.maxHpCache;
        const heal = opts.find((o) => o.id === 'heal');
        if (heal && hpRatio < 0.75) return { type: 'REST_CHOOSE', option: 'heal' };
        const other = opts.find((o) => o.id !== 'heal') ?? heal;
        return other ? { type: 'REST_CHOOSE', option: other.id } : { type: 'LEAVE_ROOM' };
      }
      case 'chest':
        return { type: 'CHEST_OPEN' };
      case 'shop': {
        if (!room.healUsed && run.hero.hp / run.hero.maxHpCache < 0.6 && run.kamas >= price(run, room.healPrice)) return { type: 'SHOP_HEAL' };
        for (let i = 0; i < room.items.length; i++) {
          const e = room.items[i];
          if (e.sold || run.kamas < price(run, e.price) || run.hero.bag.length >= 6) continue;
          const s = bestSlotFor(run, e.item);
          if (s && s.gain > 8) return { type: 'SHOP_BUY_ITEM', index: i };
        }
        for (const it of run.hero.bag) {
          const s = bestSlotFor(run, it);
          if (s && s.gain > 0) return { type: 'EQUIP', uid: it.uid, slot: s.slot };
          return { type: 'SHOP_SELL', uid: it.uid };
        }
        if (room.relic && !room.relic.sold && run.kamas >= price(run, room.relic.price) + 40) return { type: 'SHOP_BUY_RELIC' };
        return { type: 'LEAVE_ROOM' };
      }
      case 'forge': {
        const items = Object.values(run.hero.equipment).filter(Boolean).sort((a, b) => (b === run.hero.equipment.weapon) - (a === run.hero.equipment.weapon));
        for (const it of items) {
          const cost = upgradeCost(run, room, it);
          if (cost && run.fragments >= cost.fragments && run.kamas >= cost.kamas + 30) return { type: 'FORGE_UPGRADE', uid: it.uid };
        }
        return { type: 'LEAVE_ROOM' };
      }
      case 'victory':
        return { type: 'VICTORY_CHOICE', endless: false };
      default:
        return { type: 'LEAVE_ROOM' };
    }
  }

  function decideNode(state) {
    const run = state.run;
    const avail = availableNodes(run.map, run.nodeId).map((id) => run.map.nodes[id]);
    const hpRatio = run.hero.hp / run.hero.maxHpCache;
    const pref = (n) => {
      let s = next(rng) * 2;
      if (hpRatio < 0.5 && (n.type === 'rest' || n.type === 'shop' || n.type === 'event' || n.type === 'chest')) s += 4;
      if (hpRatio > 0.8 && (n.type === 'elite' || n.type === 'challenge')) s += 1;
      if (hpRatio < 0.6 && (n.type === 'elite' || n.type === 'challenge')) s -= 4;
      return s;
    };
    return avail.sort((a, b) => pref(b) - pref(a))[0];
  }

  /** Siguiente acción para el estado dado (o null si la expedición terminó). */
  function decide(state) {
    const run = state.run;
    if (!run || run.ended) return null;
    if (run.combat) {
      const c = run.combat;
      if (c.phase === 'placement') return { type: 'COMBAT', action: { type: 'ready' } };
      if (c.phase === 'victory' || c.phase === 'defeat') return { type: 'COMBAT_FINISH' };
      if (c.activeId === c.heroId) return { type: 'COMBAT', action: { type: 'autoTurn' } };
      return { type: 'COMBAT', action: { type: 'aiStep' } };
    }
    if (run.room) return decideRoom(state);
    const node = decideNode(state);
    return node ? { type: 'ENTER_NODE', nodeId: node.id } : null;
  }

  return { decide };
}

/** Simula una expedición completa. Devuelve un resumen. */
export function simulateRun({ classId, seed, difficulty = 0, maxSteps = 20000, meta = undefined, onCombat = null }) {
  let state = createInitialState(meta);
  if (meta) state.meta.maxDifficulty = Math.max(state.meta.maxDifficulty, difficulty);
  state = reduce(state, { type: 'START_RUN', classId, seed, difficulty });
  const player = createAutoPlayer(seed);
  let steps = 0;
  let errors = 0;
  let lastCombat = null;
  while (steps++ < maxSteps) {
    const action = player.decide(state);
    if (!action) break;
    if (state.run?.combat) lastCombat = state.run.combat;
    if (action.type === 'COMBAT_FINISH' && onCombat) onCombat(state.run.combat, state.run);
    const nextState = reduce(state, action);
    if (nextState.error && nextState.error !== state.error) {
      errors++;
      // Una acción rechazada no debe bloquear la simulación: se sale de la sala.
      const fallback = reduce(nextState, { type: 'LEAVE_ROOM' });
      state = fallback.error ? reduce(fallback, { type: 'SKIP_CHOICE' }) : fallback;
      if (errors > 200) break;
      continue;
    }
    state = nextState;
  }
  const run = state.run;
  return {
    classId,
    seed,
    victory: !!run.ended?.victory,
    floor: run.ended?.floor ?? 0,
    level: run.hero.level,
    steps,
    errors,
    ended: !!run.ended,
    stats: run.stats,
    essence: run.ended?.essence ?? 0,
    lastEnemies: lastCombat?.encounter?.enemies ?? [],
    lastNode: lastCombat?.encounter?.nodeType ?? null,
    meta: state.meta,
  };
}
