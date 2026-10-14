import { CLASSES } from '../../content/classes/index.js';
import { RELICS } from '../../content/relics.js';
import { getItemDef } from '../../content/items/index.js';
import { ELEMENTAL_IDS, ELEMENTS } from '../../content/elements.js';
import { addStats } from '../utils.js';
import { itemStats, itemTriggers, itemEnchantStats } from '../items/items.js';
import { setSources, setStatus } from '../items/sets.js';
import { resolveSpell, weaponSpell } from '../spells.js';

/**
 * Perfil derivado del héroe: estadísticas totales, fuentes de modificadores
 * (con sus disparadores), hechizos efectivos y estado de sets.
 * Es una función pura del estado de la expedición: equipar o retirar un objeto
 * recalcula todo automáticamente.
 */
export function buildHeroProfile(run) {
  const hero = run.hero;
  const cls = CLASSES[hero.classId];
  const sources = [];

  sources.push({
    id: `class:${cls.id}`,
    kind: 'class',
    name: cls.passive.name,
    stats: { ...cls.baseStats, hp: cls.baseStats.hp + cls.hpPerLevel * (hero.level - 1) },
    triggers: cls.passive.triggers ?? [],
  });

  for (const talentId of hero.talents) {
    const t = cls.talents.find((x) => x.id === talentId);
    if (t) sources.push({ id: `talent:${t.id}`, kind: 'talent', name: t.name, stats: t.stats ?? null, triggers: t.triggers ?? [] });
  }

  for (const boon of hero.boons) {
    sources.push({ id: `boon:${boon.id}`, kind: 'boon', name: boon.name, stats: boon.stats ?? null, triggers: boon.triggers ?? [] });
  }

  let weapon = null;
  for (const [slot, item] of Object.entries(hero.equipment)) {
    if (!item) continue;
    const def = getItemDef(item.baseId);
    const stats = itemStats(item);
    addStats(stats, itemEnchantStats(item));
    sources.push({ id: `item:${item.uid}`, kind: 'item', slot, name: def.name, stats, triggers: itemTriggers(item) });
    if (def.type === 'weapon' && def.attack) {
      weapon = weaponSpell(item, def);
      const affinity = cls.weaponAffinity?.[def.weaponType];
      if (affinity) {
        sources.push({ id: 'affinity', kind: 'class', name: 'Afinidad de arma', stats: { weaponPct: affinity }, triggers: [] });
      }
    }
  }

  sources.push(...setSources(hero.equipment));

  for (const relicId of hero.relics) {
    const r = RELICS[relicId];
    if (r) sources.push({ id: `relic:${relicId}`, kind: 'relic', name: r.name, stats: r.stats ?? null, triggers: r.triggers ?? [] });
  }

  const stats = {};
  for (const s of sources) addStats(stats, s.stats);

  const maxHp = Math.max(1, Math.round((stats.hp + (stats.vitality || 0)) * (1 + (stats.maxHpPct || 0) / 100)));

  const spells = hero.spells.map((s) => resolveSpell(s.id, { variant: s.variant, runes: s.runes }));
  if (weapon) spells.push(weapon);

  return {
    stats,
    maxHp,
    sources: sources.filter((s) => s.triggers && s.triggers.length).map((s) => ({ id: s.id, kind: s.kind, name: s.name, triggers: s.triggers })),
    allSources: sources,
    spells,
    weapon,
    sets: setStatus(hero.equipment),
    dominantElement: dominantElement(stats, cls.preferredElements),
  };
}

/** Elemento con la característica más alta (desempate según la clase). */
export function dominantElement(stats, preferred = ELEMENTAL_IDS) {
  let best = preferred[0] ?? 'fire';
  let bestValue = -Infinity;
  for (const el of preferred) {
    const v = (stats[ELEMENTS[el].stat] || 0) + (stats[ELEMENTS[el].dmg] || 0) * 5;
    if (v > bestValue) {
      best = el;
      bestValue = v;
    }
  }
  return best;
}
