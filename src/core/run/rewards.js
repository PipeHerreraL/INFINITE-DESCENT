import { RELICS } from '../../content/relics.js';
import { MONSTERS } from '../../content/enemies/index.js';
import { COMBAT_MODIFIERS } from '../../content/modifiers.js';
import { CHALLENGE_REWARD } from '../../content/challenges.js';
import { int, sample, chance } from '../rng.js';
import { generateItem, generateItemChoices } from '../items/items.js';
import { assertRule } from '../errors.js';
import { equipNew, addToBag } from '../items/equipment.js';
import { salvageValue } from '../items/items.js';
import { addKamas, gainXp, discover, addRelic, refreshHero } from './run.js';

/** Reliquias del pool aún no obtenidas, de los niveles indicados. */
export function pickRelics(run, tiers, count) {
  const candidates = run.pools.relics.filter((id) => tiers.includes(RELICS[id].tier) && !run.hero.relics.includes(id));
  return sample(run.rng, candidates, count);
}

/** Legendarios que el héroe ya posee: no vuelven a salir en el botín. */
export function ownedLegendaries(run) {
  return [...Object.values(run.hero.equipment), ...run.hero.bag]
    .filter((i) => i && i.rarity === 'legendary')
    .map((i) => i.baseId);
}

/** Opciones de objeto para una recompensa. */
export function itemChoicesFor(run, { floor, count = 3, bonus = 0, min = 'common', rarity = null, forceLegendary = false }) {
  const opts = { floor, bonus, min, classId: run.hero.classId };
  const owned = ownedLegendaries(run);
  const items = [];
  if (forceLegendary) {
    const leg = generateItem(run.rng, run.pools.items, run.counters, { ...opts, rarity: 'legendary', exclude: owned });
    if (leg) items.push(leg);
  }
  items.push(
    ...generateItemChoices(run.rng, run.pools.items, run.counters, count - items.length, {
      ...opts,
      rarity: rarity ?? undefined,
      exclude: [...owned, ...items.map((i) => i.baseId)],
    }),
  );
  return items;
}

/**
 * Recompensa de un combate ganado. Las divisas y la XP se aplican aquí, una
 * sola vez; el objeto y la reliquia se eligen después en la sala de recompensa.
 */
export function createCombatReward(run, combat, nodeType) {
  const floor = combat.floor;
  const modBonus = (combat.modifiers ?? []).reduce((acc, m) => acc + (COMBAT_MODIFIERS[m]?.rarityBonus ?? 0), 0);
  const enemyXp = combat.encounter.enemies.reduce((acc, id) => acc + (MONSTERS[id]?.xp ?? 0), 0);
  let kamas;
  let xp = enemyXp * (1 + 0.05 * floor) + 4;
  let fragments = 0;
  let items = [];
  let relics = [];
  let title = 'Victoria';
  switch (nodeType) {
    case 'boss':
      kamas = int(run.rng, 80, 100) + floor * 3;
      xp *= 1.2;
      fragments = 4;
      items = itemChoicesFor(run, { floor, bonus: 1, min: 'rare', forceLegendary: true });
      relics = pickRelics(run, ['boss', 'rare'], 3);
      title = '¡Jefe derrotado!';
      break;
    case 'elite':
      kamas = int(run.rng, 38, 52) + floor * 2;
      fragments = 2;
      items = itemChoicesFor(run, { floor, bonus: 1 + modBonus, min: 'uncommon' });
      relics = pickRelics(run, ['rare', 'common'], 2);
      title = 'Élite derrotado';
      break;
    case 'challenge':
      kamas = Math.round((int(run.rng, 20, 30) + floor * 1.5) * 1.5);
      fragments = 2;
      items = itemChoicesFor(run, { floor, bonus: 1 + modBonus, min: 'uncommon' });
      if (chance(run.rng, 50)) relics = pickRelics(run, ['common'], 1);
      title = 'Desafío superado';
      break;
    default:
      kamas = int(run.rng, 16, 26) + Math.round(floor * 1.5);
      fragments = chance(run.rng, 30) ? 1 : 0;
      items = itemChoicesFor(run, { floor, bonus: modBonus });
  }
  const ch = combat.challenge;
  let essence = 0;
  const challenge = ch ? { name: ch.name, desc: ch.desc, status: ch.status } : null;
  if (ch && ch.status === 'completed') {
    const mult = nodeType === 'challenge' ? 2 : 1;
    kamas += CHALLENGE_REWARD.kamas * mult;
    xp += CHALLENGE_REWARD.xp * mult;
    essence += CHALLENGE_REWARD.essence * mult;
    run.stats.challengesCompleted += 1;
  }
  const reward = {
    type: 'reward',
    source: 'combat',
    title,
    kamas: 0,
    xp: Math.round(xp),
    fragments,
    essence,
    items,
    itemTaken: items.length === 0,
    relics,
    relicTaken: relics.length === 0,
    challenge,
    levelsGained: 0,
  };
  reward.kamas = addKamas(run, kamas);
  run.fragments += fragments;
  reward.levelsGained = gainXp(run, reward.xp);
  run.essenceEarned = (run.essenceEarned ?? 0) + essence;
  return reward;
}

export function itemRewardRoom(run, items, title = 'Botín') {
  return {
    type: 'reward', source: 'event', title, kamas: 0, xp: 0, fragments: 0, essence: 0,
    items, itemTaken: items.length === 0, relics: [], relicTaken: true, challenge: null, levelsGained: 0,
  };
}

/** Toma un objeto de la recompensa: equiparlo, guardarlo o desmantelarlo. */
export function takeRewardItem(run, room, uid, mode, slot = null) {
  assertRule(room.type === 'reward', 'No hay recompensa activa.');
  assertRule(!room.itemTaken, 'Ya has elegido un objeto de esta recompensa.');
  const item = room.items.find((i) => i.uid === uid);
  assertRule(item, 'Objeto no disponible.');
  if (mode === 'equip') equipNew(run.hero, item, slot);
  else if (mode === 'bag') addToBag(run.hero, item);
  else if (mode === 'salvage') run.fragments += salvageValue(item);
  else assertRule(false, 'Modo inválido.');
  room.itemTaken = true;
  room.takenUid = uid;
  room.items = room.items.filter((i) => i.uid === uid);
  if (mode !== 'salvage') {
    run.stats.itemsFound += 1;
    discover(run, 'items', item.baseId);
  }
  refreshHero(run);
}

export function skipRewardItem(run, room) {
  assertRule(room.type === 'reward' && !room.itemTaken, 'No hay objeto que descartar.');
  room.itemTaken = true;
  room.items = [];
  run.fragments += 2;
}

export function takeRewardRelic(run, room, relicId) {
  assertRule(room.type === 'reward', 'No hay recompensa activa.');
  assertRule(!room.relicTaken, 'Ya has elegido una reliquia.');
  assertRule(room.relics.includes(relicId), 'Reliquia no disponible.');
  addRelic(run, relicId);
  room.relicTaken = true;
  room.relics = [relicId];
}
