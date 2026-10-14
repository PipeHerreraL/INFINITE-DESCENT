import { ITEMS, getItemDef, ENCHANTMENTS } from '../../content/items/index.js';
import { RARITIES, RARITY_ORDER, rarityIndex } from '../../content/rarities.js';
import { STATS } from '../../content/stats.js';
import { ELEMENTS } from '../../content/elements.js';
import { next, weighted, pick } from '../rng.js';
import { addStats } from '../utils.js';

// ── Escalado ─────────────────────────────────────────────────────────────

export function levelScale(ilvl) {
  return 1 + 0.08 * (ilvl - 1);
}

export const UPGRADE_STEP = 0.12;
export const MAX_UPGRADE = 3;

function lineRange(item, line) {
  if (line.base) return getItemDef(item.baseId).stats?.[line.stat] ?? [0, 0];
  return STATS[line.stat]?.affix?.range ?? [0, 0];
}

/** Valor efectivo de una línea de estadística de una instancia. */
export function lineValue(item, line) {
  const [min, max] = lineRange(item, line);
  const raw = min + (max - min) * line.roll;
  if (STATS[line.stat]?.affix?.fixed && !line.base) return Math.round(raw);
  const quality = RARITIES[item.rarity]?.quality ?? 1;
  const v = raw * levelScale(item.ilvl) * quality * (1 + UPGRADE_STEP * (item.upgrade ?? 0));
  return Math.max(1, Math.round(v));
}

/** Aplica la transmutación elemental a una clave de estadística ofensiva. */
export function mapStatKey(item, stat) {
  const map = item.elementMap;
  if (!map) return stat;
  const from = ELEMENTS[map.from];
  const to = ELEMENTS[map.to];
  if (!from || !to) return stat;
  if (stat === from.stat) return to.stat;
  if (stat === from.dmg) return to.dmg;
  return stat;
}

/** Estadísticas totales de una instancia (líneas + fijas). */
export function itemStats(item) {
  const def = getItemDef(item.baseId);
  const stats = {};
  for (const line of item.lines) {
    const key = mapStatKey(item, line.stat);
    stats[key] = (stats[key] || 0) + lineValue(item, line);
  }
  addStats(stats, def.fixedStats);
  return stats;
}

/** Líneas detalladas para mostrar en la interfaz. */
export function itemLines(item) {
  const def = getItemDef(item.baseId);
  const out = item.lines.map((line, index) => ({
    index,
    stat: mapStatKey(item, line.stat),
    value: lineValue(item, line),
    base: line.base,
  }));
  for (const [stat, value] of Object.entries(def.fixedStats ?? {})) out.push({ stat, value, fixed: true });
  return out;
}

export function itemTriggers(item) {
  const def = getItemDef(item.baseId);
  const triggers = [...(def.triggers ?? [])];
  if (item.enchant) triggers.push(...(ENCHANTMENTS[item.enchant]?.triggers ?? []));
  return triggers;
}

export function itemEnchantStats(item) {
  return item.enchant ? ENCHANTMENTS[item.enchant]?.stats ?? null : null;
}

export function itemValue(item) {
  const base = RARITIES[item.rarity]?.value ?? 20;
  return Math.round(base * (1 + 0.06 * (item.ilvl - 1)) * (1 + 0.25 * (item.upgrade ?? 0)));
}

export function salvageValue(item) {
  return (RARITIES[item.rarity]?.salvage ?? 1) + (item.upgrade ?? 0);
}

// ── Generación ───────────────────────────────────────────────────────────

/** Rareza aleatoria: los pisos profundos desplazan los pesos hacia arriba. */
export function rollRarity(rng, { floor = 1, bonus = 0, min = 'common', max = 'legendary', luck = 1 } = {}) {
  const depth = floor - 1;
  const entries = RARITY_ORDER.map((id, i) => {
    let w = RARITIES[id].weight;
    if (i >= 2) w *= 1 + depth * 0.08 * luck;
    if (i >= 3) w *= 1 + depth * 0.06 * luck;
    return { id, w };
  });
  let idx = rarityIndex(weighted(rng, entries, (e) => e.w).id);
  idx = Math.min(idx + bonus, RARITY_ORDER.length - 1);
  idx = Math.max(idx, rarityIndex(min));
  idx = Math.min(idx, rarityIndex(max));
  return RARITY_ORDER[idx];
}

/** Bases elegibles para una rareza dada dentro de un pool. */
export function eligibleBases(pool, rarity, { floor = 1, classId = null, type = null } = {}) {
  const ri = rarityIndex(rarity);
  return pool.filter((id) => {
    const def = ITEMS[id];
    if (!def) return false;
    if (type && def.type !== type) return false;
    if (def.minFloor && floor < def.minFloor) return false;
    if (def.requires?.classId && classId && def.requires.classId !== classId) return false;
    if (def.rarity) return def.rarity === rarity;
    if (rarity === 'legendary') return false;
    return ri >= rarityIndex(def.minRarity ?? 'common');
  });
}

function rollAffixes(rng, item, count) {
  const taken = new Set(item.lines.map((l) => l.stat));
  for (let i = 0; i < count; i++) {
    const candidates = Object.entries(STATS)
      .filter(([k, d]) => d.affix && !taken.has(k))
      .filter(([, d]) => rarityIndex(item.rarity) >= rarityIndex(d.affix.minRarity ?? 'common'))
      .map(([k, d]) => ({ k, w: d.affix.weight }));
    const chosen = weighted(rng, candidates, (c) => c.w);
    if (!chosen) break;
    taken.add(chosen.k);
    item.lines.push({ stat: chosen.k, roll: next(rng), base: false });
  }
}

export function nextItemUid(counter) {
  counter.itemSeq = (counter.itemSeq ?? 0) + 1;
  return `it${counter.itemSeq}`;
}

/** Crea una instancia concreta de un objeto base. */
export function createItem(rng, baseId, rarity, ilvl, counter) {
  const def = getItemDef(baseId);
  const r = def.rarity ?? rarity;
  const item = {
    uid: nextItemUid(counter),
    baseId,
    rarity: r,
    ilvl: Math.max(1, ilvl),
    upgrade: 0,
    lines: Object.keys(def.stats ?? {}).map((stat) => ({ stat, roll: next(rng), base: true })),
    enchant: null,
    elementMap: null,
  };
  // Los objetos de set y legendarios tienen afijos según su rareza fija.
  rollAffixes(rng, item, RARITIES[r].affixes);
  if (RARITIES[r].enchant && !def.triggers) item.enchant = pick(rng, Object.keys(ENCHANTMENTS));
  return item;
}

/**
 * Genera un objeto aleatorio del pool.
 * opts: { floor, bonus, min, rarity, classId, type, exclude }
 */
export function generateItem(rng, pool, counter, opts = {}) {
  const floor = opts.floor ?? 1;
  let rarity = opts.rarity ?? rollRarity(rng, { floor, bonus: opts.bonus ?? 0, min: opts.min ?? 'common' });
  const exclude = new Set(opts.exclude ?? []);
  const usable = pool.filter((id) => !exclude.has(id));
  // Si no hay bases para esa rareza, se baja de rareza hasta encontrar una.
  for (let idx = rarityIndex(rarity); idx >= 0; idx--) {
    const r = RARITY_ORDER[idx];
    const bases = eligibleBases(usable, r, { floor, classId: opts.classId, type: opts.type });
    if (bases.length) {
      return createItem(rng, pick(rng, bases), r, floor, counter);
    }
  }
  return null;
}

/** Varias opciones distintas (sin repetir base). */
export function generateItemChoices(rng, pool, counter, count, opts = {}) {
  const out = [];
  const exclude = [...(opts.exclude ?? [])];
  for (let i = 0; i < count; i++) {
    const item = generateItem(rng, pool, counter, { ...opts, exclude });
    if (!item) break;
    exclude.push(item.baseId);
    out.push(item);
  }
  return out;
}

export function rerollLine(rng, item, lineIndex) {
  const line = item.lines[lineIndex];
  if (!line) return false;
  if (line.base) {
    line.roll = next(rng);
    return true;
  }
  const taken = new Set(item.lines.filter((_, i) => i !== lineIndex).map((l) => l.stat));
  const candidates = Object.entries(STATS)
    .filter(([k, d]) => d.affix && !taken.has(k))
    .filter(([, d]) => rarityIndex(item.rarity) >= rarityIndex(d.affix.minRarity ?? 'common'))
    .map(([k, d]) => ({ k, w: d.affix.weight }));
  const chosen = weighted(rng, candidates, (c) => c.w);
  item.lines[lineIndex] = { stat: chosen.k, roll: next(rng), base: false };
  return true;
}
