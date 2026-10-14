import { UNLOCKS, ESSENCE_REWARDS } from '../../content/unlocks.js';
import { DIFFICULTIES } from '../../content/difficulty.js';
import { CLASS_ORDER } from '../../content/classes/index.js';
import { assertRule } from '../errors.js';

// Progresión permanente. Separada por completo del estado de la expedición:
// solo se modifica al terminar una expedición o al comprar desbloqueos.

export const META_VERSION = 1;

export function createMeta() {
  const byClass = {};
  for (const id of CLASS_ORDER) byClass[id] = { runs: 0, victories: 0, bestFloor: 0 };
  return {
    version: META_VERSION,
    essence: 0,
    totalEssence: 0,
    unlocks: {},
    maxDifficulty: 0,
    stats: { runs: 0, victories: 0, deaths: 0, bestFloor: 0, totalKills: 0, bossesKilled: 0, challenges: 0, byClass },
    codex: { items: [], relics: [], monsters: [] },
    history: [],
    settings: { aiSpeed: 'normal' },
  };
}

export function buyUnlock(meta, unlockId) {
  const def = UNLOCKS.find((u) => u.id === unlockId);
  assertRule(def, 'Desbloqueo desconocido.');
  assertRule(!meta.unlocks[unlockId], 'Ya lo tienes desbloqueado.');
  assertRule(meta.essence >= def.cost, `Necesitas ${def.cost} de esencia onírica.`);
  meta.essence -= def.cost;
  meta.unlocks[unlockId] = true;
}

/** Esencia ganada en una expedición (también al morir: el tiempo nunca se pierde del todo). */
export function computeEssence(run) {
  const s = run.stats;
  let e = s.floorsCleared * ESSENCE_REWARDS.perFloor
    + s.elitesKilled * ESSENCE_REWARDS.perElite
    + s.bossesKilled * ESSENCE_REWARDS.perBoss
    + (run.essenceEarned ?? 0);
  if (run.ended?.victory || run.reachedVictory) e += ESSENCE_REWARDS.victory;
  e = Math.round(e * (1 + 0.1 * run.difficulty));
  return e;
}

function merge(list, ids) {
  for (const id of ids) if (!list.includes(id)) list.push(id);
}

/** Registra el final de una expedición en la meta (una sola vez por expedición). */
export function recordRun(meta, run) {
  if (run.ended?.recorded) return run.ended.essence;
  const essence = computeEssence(run);
  const victory = !!(run.ended?.victory || run.reachedVictory);
  const floor = run.ended?.floor ?? 0;
  meta.essence += essence;
  meta.totalEssence += essence;
  meta.stats.runs += 1;
  if (victory) meta.stats.victories += 1;
  else meta.stats.deaths += 1;
  meta.stats.bestFloor = Math.max(meta.stats.bestFloor, floor);
  meta.stats.totalKills += run.stats.kills;
  meta.stats.bossesKilled += run.stats.bossesKilled;
  meta.stats.challenges += run.stats.challengesCompleted;
  const c = meta.stats.byClass[run.classId] ?? (meta.stats.byClass[run.classId] = { runs: 0, victories: 0, bestFloor: 0 });
  c.runs += 1;
  if (victory) c.victories += 1;
  c.bestFloor = Math.max(c.bestFloor, floor);
  merge(meta.codex.items, run.discovered.items);
  merge(meta.codex.relics, run.discovered.relics);
  merge(meta.codex.monsters, run.discovered.monsters);
  let unlockedDifficulty = null;
  if (victory && run.difficulty >= meta.maxDifficulty && meta.maxDifficulty < DIFFICULTIES.length - 1) {
    meta.maxDifficulty = run.difficulty + 1;
    unlockedDifficulty = meta.maxDifficulty;
  }
  meta.history.unshift({
    classId: run.classId,
    seed: run.seed,
    victory,
    floor,
    level: run.hero.level,
    essence,
    difficulty: run.difficulty,
    kills: run.stats.kills,
  });
  meta.history = meta.history.slice(0, 12);
  run.ended = { ...run.ended, recorded: true, essence, unlockedDifficulty };
  return essence;
}
