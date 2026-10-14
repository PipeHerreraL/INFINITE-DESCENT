import { CLASSES } from '../../content/classes/index.js';
import { ITEMS } from '../../content/items/index.js';
import { RELICS } from '../../content/relics.js';
import { getActConfig, ROWS_PER_ACT } from '../../content/acts.js';
import { difficultyRules } from '../../content/difficulty.js';
import { LEVEL_XP } from '../../content/boons.js';
import { createRng, fork } from '../rng.js';
import { createItem } from '../items/items.js';
import { emptyEquipment } from '../items/equipment.js';
import { buildHeroProfile } from '../hero/profile.js';
import { generateActMap } from './mapgen.js';

export const RUN_VERSION = 1;
export const START_KAMAS = 30;

/** Pools de botín de la expedición, filtrados por los desbloqueos permanentes. */
export function buildPools(unlocks = {}) {
  const items = Object.values(ITEMS)
    .filter((d) => !d.unlock || unlocks[d.unlock])
    .map((d) => d.id);
  const relics = Object.values(RELICS)
    .filter((r) => r.tier !== 'curse' && (!r.unlock || unlocks[r.unlock]))
    .map((r) => r.id);
  return { items, relics };
}

/**
 * Crea una expedición nueva. Todo el estado temporal parte de cero: solo se
 * leen los desbloqueos permanentes (`unlocks`).
 */
export function createRun({ classId, originId = null, seed, difficulty = 0, unlocks = {} }) {
  const cls = CLASSES[classId];
  if (!cls) throw new Error(`Clase desconocida: ${classId}`);
  const origin = cls.origins.find((o) => o.id === originId && (!o.unlock || unlocks[o.unlock])) ?? cls.origins[0];
  const rng = createRng(`${seed}:run`);
  const counters = { itemSeq: 0 };
  const rules = difficultyRules(difficulty);

  const spells = cls.startingSpells.map((id) => ({ id: origin.replaceSpells?.[id] ?? id, variant: null, runes: [] }));
  const equipment = emptyEquipment();
  const weaponId = origin.startingWeapon ?? cls.startingWeapon;
  const weaponDef = ITEMS[weaponId];
  equipment.weapon = createItem(rng, weaponId, weaponDef.minRarity ?? 'common', 1, counters);

  const act = getActConfig(0);
  const run = {
    version: RUN_VERSION,
    seed: String(seed),
    classId,
    originId: origin.id,
    difficulty,
    rules,
    rng,
    counters,
    actIndex: 0,
    map: generateActMap(fork(rng, 'map0'), act, { eliteWeightMult: difficulty >= 2 ? 1.4 : 1 }),
    nodeId: null,
    visited: [],
    hero: {
      classId,
      level: 1,
      xp: 0,
      hp: 1,
      maxHpCache: 0,
      spells,
      talents: [],
      boons: structuredClone(origin.boons ?? []),
      equipment,
      bag: [],
      relics: [...(origin.startingRelics ?? [])],
    },
    kamas: START_KAMAS + (unlocks.start_kamas ? 40 : 0),
    fragments: 0,
    pools: buildPools(unlocks),
    unlocks: { ...unlocks },
    room: null,
    queue: [],
    pendingLevelUps: 0,
    nextCombatModifier: null,
    combatSeq: 0,
    stats: {
      kills: 0, floorsCleared: 0, elitesKilled: 0, bossesKilled: 0, challengesCompleted: 0,
      damageDealt: 0, combatsWon: 0, kamasEarned: 0, itemsFound: 0, relicsFound: 0,
    },
    discovered: { items: [weaponId], relics: [...(origin.startingRelics ?? [])], monsters: [] },
    history: [],
    ended: null,
  };
  const profile = buildHeroProfile(run);
  run.hero.hp = profile.maxHp;
  run.hero.maxHpCache = profile.maxHp;
  return run;
}

/** Recalcula la vida máxima conservando el daño recibido. */
export function refreshHero(run) {
  const profile = buildHeroProfile(run);
  const delta = profile.maxHp - (run.hero.maxHpCache || profile.maxHp);
  run.hero.hp = Math.max(1, Math.min(profile.maxHp, run.hero.hp + delta));
  run.hero.maxHpCache = profile.maxHp;
  return profile;
}

export function currentAct(run) {
  return getActConfig(run.actIndex);
}

export function currentNode(run) {
  return run.nodeId ? run.map.nodes[run.nodeId] : null;
}

/** Número de piso global (1..N) del nodo actual o del siguiente. */
export function floorNumber(run, node = currentNode(run)) {
  const row = node ? node.row : 0;
  return run.actIndex * ROWS_PER_ACT + row + 1;
}

export function healHero(run, amount) {
  const max = run.hero.maxHpCache;
  const before = run.hero.hp;
  run.hero.hp = Math.min(max, Math.round(run.hero.hp + amount));
  return run.hero.hp - before;
}

export function healPct(run, pct) {
  return healHero(run, (run.hero.maxHpCache * pct) / 100);
}

export function damageHeroPct(run, pct) {
  const amount = Math.round((run.hero.maxHpCache * pct) / 100);
  run.hero.hp = Math.max(1, run.hero.hp - amount);
  return amount;
}

export function xpToNext(level) {
  return LEVEL_XP(level);
}

/** Añade XP y acumula subidas de nivel pendientes (se eligen al volver al mapa). */
export function gainXp(run, amount) {
  run.hero.xp += Math.round(amount);
  let levels = 0;
  while (run.hero.xp >= xpToNext(run.hero.level)) {
    run.hero.xp -= xpToNext(run.hero.level);
    run.hero.level += 1;
    run.pendingLevelUps += 1;
    levels++;
  }
  if (levels) refreshHero(run);
  return levels;
}

export function addKamas(run, amount) {
  const pct = buildHeroProfile(run).stats.kamasPct || 0;
  const gained = Math.round(amount * (1 + pct / 100));
  run.kamas += gained;
  run.stats.kamasEarned += gained;
  return gained;
}

export function discover(run, kind, id) {
  const list = run.discovered[kind];
  if (list && !list.includes(id)) list.push(id);
}

export function addRelic(run, relicId) {
  if (run.hero.relics.includes(relicId)) return false;
  run.hero.relics.push(relicId);
  run.stats.relicsFound += 1;
  discover(run, 'relics', relicId);
  refreshHero(run);
  return true;
}

export function logRun(run, text) {
  run.history.push({ floor: floorNumber(run), text });
  if (run.history.length > 60) run.history.shift();
}
