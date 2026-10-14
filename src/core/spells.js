import { CLASS_SPELLS } from '../content/classes/index.js';
import { MONSTER_SPELLS } from '../content/enemies/spells.js';
import { SPELL_RUNES, MAX_RUNES_PER_SPELL } from '../content/spellUpgrades.js';
import { RARITIES } from '../content/rarities.js';

export const ALL_SPELLS = { ...CLASS_SPELLS, ...MONSTER_SPELLS };

const DEFAULTS = {
  apCost: 3,
  minRange: 1,
  maxRange: 1,
  rangeMod: false,
  los: true,
  inLine: false,
  target: 'enemy',
  castsPerTurn: 0,
  castsPerTarget: 0,
  cooldown: 0,
  initialCooldown: 0,
  area: { shape: 'single', size: 0 },
  crit: 0,
  tags: [],
  effects: [],
};

export function getSpellDef(id) {
  const def = ALL_SPELLS[id];
  if (!def) throw new Error(`Hechizo desconocido: ${id}`);
  return def;
}

function normalize(def) {
  const s = { ...structuredClone(DEFAULTS), ...structuredClone(def) };
  delete s.variants;
  return s;
}

const SCALABLE = new Set(['damage', 'heal', 'shield']);

function scaleEffect(effect, factor) {
  if (!SCALABLE.has(effect.type)) return;
  if (typeof effect.min === 'number') effect.min = Math.round(effect.min * factor);
  if (typeof effect.max === 'number') effect.max = Math.round(effect.max * factor);
  if (typeof effect.value === 'number') effect.value = Math.round(effect.value * factor);
  else if (effect.value && typeof effect.value === 'object') {
    if (typeof effect.value.pct === 'number') effect.value.pct = Math.round(effect.value.pct * factor);
    if (typeof effect.value.flat === 'number') effect.value.flat = Math.round(effect.value.flat * factor);
  }
}

export function applyPatch(spell, patch) {
  if (!patch) return spell;
  if (patch.set) Object.assign(spell, structuredClone(patch.set));
  if (patch.add) {
    for (const [k, v] of Object.entries(patch.add)) spell[k] = (spell[k] || 0) + v;
  }
  if (patch.effects) spell.effects = structuredClone(patch.effects);
  if (patch.appendEffects) spell.effects.push(...structuredClone(patch.appendEffects));
  if (patch.scaleEffects) spell.effects.forEach((e) => scaleEffect(e, patch.scaleEffects));
  spell.apCost = Math.max(0, spell.apCost);
  spell.cooldown = Math.max(0, spell.cooldown);
  spell.maxRange = Math.max(spell.minRange, spell.maxRange);
  return spell;
}

export function isMeleeSpell(spell) {
  if (spell.tags?.includes('melee')) return true;
  if (spell.target === 'self' || spell.target === 'emptyCell' || spell.target === 'ownBomb') return false;
  return spell.maxRange <= 1 && spell.minRange <= 1;
}

/** Hechizo efectivo con variante y runas aplicadas. */
export function resolveSpell(spellId, { variant = null, runes = [] } = {}) {
  const base = getSpellDef(spellId);
  const s = normalize(base);
  s.id = spellId;
  s.baseName = base.name;
  s.variantId = null;
  if (variant) {
    const v = (base.variants ?? []).find((x) => x.id === variant);
    if (v) {
      applyPatch(s, v.patch);
      s.name = v.name;
      s.variantId = v.id;
      s.desc = v.desc;
    }
  }
  for (const runeId of runes) applyPatch(s, SPELL_RUNES[runeId]?.patch);
  s.runes = [...runes];
  s.melee = isMeleeSpell(s);
  return s;
}

export function spellVariants(spellId) {
  return getSpellDef(spellId).variants ?? [];
}

/** ¿Se puede aplicar la runa a este hechizo (ya resuelto)? */
export function runeApplies(spell, runeId) {
  const rune = SPELL_RUNES[runeId];
  if (!rune) return false;
  if ((spell.runes ?? []).includes(runeId)) return false;
  if ((spell.runes ?? []).length >= MAX_RUNES_PER_SPELL) return false;
  const r = rune.requires ?? {};
  if (r.minMaxRange !== undefined && spell.maxRange < r.minMaxRange) return false;
  if (r.minAp !== undefined && spell.apCost < r.minAp) return false;
  if (r.noCooldown && spell.cooldown > 0) return false;
  if (r.minCooldown !== undefined && spell.cooldown < r.minCooldown) return false;
  if (r.los !== undefined && spell.los !== r.los) return false;
  if (r.rangeMod !== undefined && !!spell.rangeMod !== r.rangeMod) return false;
  if (r.inLine !== undefined && !!spell.inLine !== r.inLine) return false;
  if (r.hasEffect && !spell.effects.some((e) => r.hasEffect.includes(e.type))) return false;
  if (spell.castsPerTurn === 0 && runeId === 'runaRepeticion') return false;
  return true;
}

/** Escala del daño de las armas según nivel, rareza y mejora del objeto. */
export function weaponScale(item) {
  const quality = RARITIES[item.rarity]?.quality ?? 1;
  return (1 + 0.05 * (item.ilvl - 1)) * (1 + (quality - 1) * 0.6) * (1 + 0.1 * (item.upgrade ?? 0));
}

/** Construye el ataque de arma como hechizo. */
export function weaponSpell(item, def) {
  const a = def.attack;
  const s = normalize({
    name: `Golpe: ${def.name}`,
    icon: 'weapon',
    element: a.effects.find((e) => e.type === 'damage')?.element ?? 'neutral',
    target: a.area && a.area.shape !== 'single' ? 'cell' : 'enemy',
    los: a.los ?? true,
    ...a,
  });
  const scale = weaponScale(item);
  s.effects.forEach((e) => scaleEffect(e, scale));
  s.id = 'weapon';
  s.isWeapon = true;
  s.weaponType = def.weaponType;
  s.tags = [...(s.tags ?? []), 'weapon'];
  s.runes = [];
  s.melee = isMeleeSpell(s);
  if (s.melee && !s.tags.includes('melee')) s.tags.push('melee');
  return s;
}
