import { CLASSES } from '../../content/classes/index.js';
import { MONSTERS } from '../../content/enemies/index.js';
import { COMBAT_MODIFIERS } from '../../content/modifiers.js';
import { resolveSpell } from '../spells.js';
import { addStats } from '../utils.js';

function freshTurnFlags(unit) {
  return { dealtDamage: false, moved: 0, castCount: 0, castIds: [], startCell: { x: unit?.x ?? 0, y: unit?.y ?? 0 }, aiSteps: 0 };
}

export function baseUnit(fields) {
  const unit = {
    id: null,
    name: '?',
    side: 'enemy',
    kind: 'monster',
    defId: null,
    tier: 'normal',
    sprite: null,
    x: 0,
    y: 0,
    hp: 1,
    maxHp: 1,
    shields: [],
    ap: 0,
    mp: 0,
    baseStats: {},
    statuses: [],
    spells: [],
    cooldowns: {},
    casts: {},
    castsOnTarget: {},
    uses: {},
    sources: [],
    triggerCounters: {},
    telegraphs: [],
    teleCycle: 0,
    phaseIndex: 0,
    summonerId: null,
    ownerId: null,
    dead: false,
    lastSpellElement: null,
    dominantElement: 'neutral',
    ai: { profile: 'melee' },
    level: 1,
    ...fields,
  };
  unit.turnFlags = freshTurnFlags(unit);
  for (const s of unit.spells) if (s.initialCooldown) unit.cooldowns[s.id] = s.initialCooldown;
  return unit;
}

export function resetTurnFlags(unit) {
  unit.turnFlags = freshTurnFlags(unit);
}

export function registerUnit(combat, unit) {
  if (!unit.id) {
    combat.seq.unit += 1;
    unit.id = `u${combat.seq.unit}`;
  }
  combat.units[unit.id] = unit;
  combat.unitOrder.push(unit.id);
  return unit;
}

const HERO_PREFERRED_RANGE = { furiak: 1, ensalmador: 3, petardista: 3 };

export function createHeroUnit(run, profile) {
  const cls = CLASSES[run.hero.classId];
  return baseUnit({
    id: 'hero',
    name: cls.name,
    side: 'player',
    kind: 'hero',
    defId: cls.id,
    tier: 'hero',
    sprite: { shape: cls.sprite, color: cls.color },
    hp: Math.max(1, Math.min(run.hero.hp, profile.maxHp)),
    maxHp: profile.maxHp,
    baseStats: { ...profile.stats },
    spells: profile.spells.map((s) => structuredClone(s)),
    sources: structuredClone(profile.sources),
    dominantElement: profile.dominantElement,
    level: run.hero.level,
    ai: { profile: HERO_PREFERRED_RANGE[cls.id] > 1 ? 'ranged' : 'melee', preferredRange: HERO_PREFERRED_RANGE[cls.id] ?? 2 },
  });
}

/**
 * Crea un monstruo o invocación con el escalado del combate.
 * scaling: { hpMult, eliteHpMult, power, dmgPct }
 */
export function createMonsterUnit(combat, monsterId, { side = 'enemy', summoner = null } = {}) {
  const def = MONSTERS[monsterId];
  if (!def) throw new Error(`Monstruo desconocido: ${monsterId}`);
  const sc = combat.scaling;
  const baseStats = { ...def.stats };
  let hp = def.stats.hp;
  if (side === 'enemy') {
    hp = def.stats.hp * sc.hpMult * (def.tier === 'elite' || def.tier === 'boss' ? sc.eliteHpMult : 1);
    baseStats.power = (baseStats.power || 0) + sc.power;
    baseStats.dmgPct = (baseStats.dmgPct || 0) + sc.dmgPct;
  } else if (def.scaleWithSummoner && summoner) {
    hp += (def.scaleWithSummoner.hpPerLevel ?? 0) * ((summoner.level ?? 1) - 1);
    baseStats.intelligence = (baseStats.intelligence || 0) + Math.round((summoner.baseStats.intelligence || 0) * 0.5);
  }
  hp = Math.max(1, Math.round(hp));
  const sources = (def.passives ?? []).map((p, i) => ({ id: `passive:${def.id}:${i}`, kind: 'passive', name: p.name, triggers: p.triggers ?? [] }));
  const unit = baseUnit({
    name: def.name,
    side,
    kind: def.tier === 'summon' ? 'summon' : 'monster',
    defId: def.id,
    tier: def.tier,
    sprite: def.sprite,
    hp,
    maxHp: hp,
    baseStats,
    spells: def.spells.map((id) => resolveSpell(id)),
    sources,
    ai: { ...def.ai },
    summonerId: summoner ? summoner.id : null,
    xp: def.xp ?? 0,
    level: summoner?.level ?? 1,
  });
  applyModifiers(combat, unit);
  return unit;
}

/** Aplica los modificadores de combate activos a una unidad según su bando. */
export function applyModifiers(combat, unit) {
  for (const modId of combat.modifiers ?? []) {
    const mod = COMBAT_MODIFIERS[modId];
    if (!mod) continue;
    const parts = [mod.all, unit.side === 'enemy' ? mod.enemies : mod.players].filter(Boolean);
    for (const part of parts) {
      if (part.stats) addStats(unit.baseStats, part.stats);
      if (part.triggers?.length) unit.sources.push({ id: `mod:${modId}`, kind: 'modifier', name: mod.name, triggers: part.triggers });
    }
  }
}
