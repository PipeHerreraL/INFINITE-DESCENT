import { CLASSES } from '../../content/classes/index.js';
import { SPELL_RUNES } from '../../content/spellUpgrades.js';
import { STAT_BOONS, MAX_SPELLS } from '../../content/boons.js';
import { RELICS } from '../../content/relics.js';
import { ELEMENTS } from '../../content/elements.js';
import { sample, weighted, shuffle } from '../rng.js';
import { assertRule } from '../errors.js';
import { resolveSpell, runeApplies, spellVariants, getSpellDef } from '../spells.js';
import { buildHeroProfile } from '../hero/profile.js';
import { refreshHero, addRelic } from './run.js';

// Opciones de elección: subir de nivel, aprender hechizos, runas, variantes y reliquias.

export function talentOptions(run) {
  const cls = CLASSES[run.hero.classId];
  return cls.talents
    .filter((t) => !run.hero.talents.includes(t.id))
    .map((t) => ({ kind: 'talent', id: t.id, name: t.name, desc: t.desc }));
}

export function newSpellOptions(run) {
  const cls = CLASSES[run.hero.classId];
  if (run.hero.spells.length >= MAX_SPELLS) return [];
  const known = new Set(run.hero.spells.map((s) => s.id));
  return cls.learnableSpells
    .filter((id) => !known.has(id))
    .map((id) => {
      const def = getSpellDef(id);
      return { kind: 'spell', id, name: def.name, desc: def.desc ?? '' };
    });
}

export function runeOptions(run) {
  const out = [];
  for (const entry of run.hero.spells) {
    const spell = resolveSpell(entry.id, { variant: entry.variant, runes: entry.runes });
    for (const runeId of Object.keys(SPELL_RUNES)) {
      if (runeApplies(spell, runeId)) {
        const rune = SPELL_RUNES[runeId];
        out.push({ kind: 'rune', spellId: entry.id, runeId, name: `${spell.name}: ${rune.name}`, desc: rune.desc });
      }
    }
  }
  return out;
}

export function variantOptions(run) {
  const out = [];
  for (const entry of run.hero.spells) {
    if (entry.variant) continue;
    for (const v of spellVariants(entry.id)) {
      out.push({ kind: 'variant', spellId: entry.id, variantId: v.id, name: `${getSpellDef(entry.id).name} → ${v.name}`, desc: v.desc });
    }
  }
  return out;
}

export function boonOptions(run) {
  return STAT_BOONS.map((b) => {
    let desc = b.desc;
    if (b.dominant) {
      const el = buildHeroProfile(run).dominantElement;
      desc = `+${b.dominant} ${statNameForElement(el)} (tu elemento dominante).`;
    }
    return { kind: 'boon', boonId: b.id, name: b.name, desc };
  });
}

function statNameForElement(el) {
  return { earth: 'Fuerza', fire: 'Inteligencia', water: 'Suerte', air: 'Agilidad' }[el] ?? 'Potencia';
}

/** Tres opciones de tipos distintos para una subida de nivel. */
export function levelUpRoom(run) {
  const pools = [
    { kind: 'talent', weight: 3, options: talentOptions(run) },
    { kind: 'spell', weight: 2.5, options: newSpellOptions(run) },
    { kind: 'rune', weight: 2, options: runeOptions(run) },
    { kind: 'variant', weight: 1.5, options: variantOptions(run) },
    { kind: 'boon', weight: 1.5, options: boonOptions(run) },
  ].filter((p) => p.options.length);
  const chosen = [];
  const usedKinds = new Set();
  for (let i = 0; i < 3; i++) {
    let candidates = pools.filter((p) => !usedKinds.has(p.kind));
    if (!candidates.length) candidates = pools;
    const pool = weighted(run.rng, candidates, (p) => p.weight);
    if (!pool) break;
    const remaining = pool.options.filter((o) => !chosen.some((c) => JSON.stringify(c) === JSON.stringify(o)));
    if (!remaining.length) {
      usedKinds.add(pool.kind);
      i--;
      if (usedKinds.size >= pools.length) break;
      continue;
    }
    chosen.push(sample(run.rng, remaining, 1)[0]);
    usedKinds.add(pool.kind);
  }
  return {
    type: 'choice',
    kind: 'levelUp',
    title: `¡Nivel ${run.hero.level - run.pendingLevelUps + 1}!`,
    subtitle: 'Elige un don para esta expedición.',
    options: chosen,
    allowSkip: false,
  };
}

export function choiceRoom(run, kind) {
  switch (kind) {
    case 'learnSpell':
      return { type: 'choice', kind, title: 'Biblioteca Onírica', subtitle: 'Aprende un hechizo nuevo.', options: sample(run.rng, newSpellOptions(run), 2), allowSkip: true };
    case 'rune':
      return { type: 'choice', kind, title: 'Grabado de runas', subtitle: 'Mejora uno de tus hechizos.', options: diverse(run, runeOptions(run), 3), allowSkip: true };
    case 'spellVariant':
      return { type: 'choice', kind, title: 'Altar de las Variantes', subtitle: 'Transforma un hechizo para el resto de la expedición.', options: diverse(run, variantOptions(run), 3), allowSkip: true };
    default:
      throw new Error(`Elección desconocida: ${kind}`);
  }
}

/** Prefiere opciones de hechizos distintos. */
function diverse(run, options, count) {
  const out = [];
  const seen = new Set();
  for (const o of shuffle(run.rng, options)) {
    if (seen.has(o.spellId)) continue;
    seen.add(o.spellId);
    out.push(o);
    if (out.length >= count) break;
  }
  return out;
}

export function relicChoiceRoom(run, relicIds, title = 'Elige una reliquia') {
  return {
    type: 'choice',
    kind: 'relic',
    title,
    subtitle: 'Las reliquias duran toda la expedición.',
    options: relicIds.map((id) => ({ kind: 'relic', relicId: id, name: RELICS[id].name, desc: RELICS[id].desc })),
    allowSkip: true,
  };
}

/** Aplica la opción elegida al héroe. */
export function applyChoiceOption(run, option) {
  const hero = run.hero;
  switch (option.kind) {
    case 'talent':
      assertRule(!hero.talents.includes(option.id), 'Ya tienes ese talento.');
      hero.talents.push(option.id);
      break;
    case 'spell':
      assertRule(!hero.spells.some((s) => s.id === option.id), 'Ya conoces ese hechizo.');
      assertRule(hero.spells.length < MAX_SPELLS, 'No puedes aprender más hechizos.');
      hero.spells.push({ id: option.id, variant: null, runes: [] });
      break;
    case 'rune': {
      const entry = hero.spells.find((s) => s.id === option.spellId);
      assertRule(entry, 'Hechizo no encontrado.');
      const spell = resolveSpell(entry.id, { variant: entry.variant, runes: entry.runes });
      assertRule(runeApplies(spell, option.runeId), 'Esa runa ya no se puede aplicar.');
      entry.runes.push(option.runeId);
      break;
    }
    case 'variant': {
      const entry = hero.spells.find((s) => s.id === option.spellId);
      assertRule(entry && !entry.variant, 'Ese hechizo ya está transformado.');
      entry.variant = option.variantId;
      // Las runas incompatibles con la variante se descartan.
      const spell = resolveSpell(entry.id, { variant: entry.variant, runes: [] });
      entry.runes = entry.runes.filter((r) => runeApplies(spell, r));
      break;
    }
    case 'boon': {
      const boon = STAT_BOONS.find((b) => b.id === option.boonId);
      assertRule(boon, 'Don desconocido.');
      let stats = boon.stats;
      if (boon.dominant) {
        const el = buildHeroProfile(run).dominantElement;
        stats = { [ELEMENTS[el].stat]: boon.dominant };
      }
      hero.boons.push({ id: `${boon.id}${hero.boons.length}`, name: boon.name, stats });
      break;
    }
    case 'relic':
      addRelic(run, option.relicId);
      break;
    default:
      throw new Error(`Opción desconocida: ${option.kind}`);
  }
  refreshHero(run);
}
