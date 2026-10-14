import { describe, it, expect } from 'vitest';
import { CLASSES } from '../src/content/classes/index.js';
import { ITEMS, SETS, ENCHANTMENTS, EQUIP_SLOTS } from '../src/content/items/index.js';
import { RELICS } from '../src/content/relics.js';
import { MONSTERS } from '../src/content/enemies/index.js';
import { STATUSES } from '../src/content/statuses.js';
import { STATS } from '../src/content/stats.js';
import { ACTS } from '../src/content/acts.js';
import { EVENTS } from '../src/content/events.js';
import { COMBAT_MODIFIERS, ELITE_MODIFIERS, CHALLENGE_MODIFIERS, FLOOR_MODIFIERS } from '../src/content/modifiers.js';
import { UNLOCKS } from '../src/content/unlocks.js';
import { SPELL_RUNES } from '../src/content/spellUpgrades.js';
import { ALL_SPELLS, resolveSpell, weaponSpell } from '../src/core/spells.js';
import { EFFECT_TYPES } from '../src/core/combat/effects.js';
import { CONDITION_TYPES } from '../src/core/effects/conditions.js';
import { createItem } from '../src/core/items/items.js';
import { createRng } from '../src/core/rng.js';

// Valida que todas las referencias del contenido existen: añadir datos con una
// errata falla aquí y no en mitad de una partida.

const EVENTS_KNOWN = new Set([
  'dealDamage', 'takeDamage', 'beforeDealDamage', 'beforeTakeDamage', 'kill', 'death', 'healDone', 'healReceived',
  'castSpell', 'turnStart', 'turnEnd', 'combatStart', 'combatJoin', 'causeCollision', 'collided', 'moveEnd', 'bombExplode',
]);
const TARGETS = new Set([undefined, 'self', 'payloadTarget', 'payloadSource', 'areaAroundTarget', 'nearestEnemy', 'allEnemies', 'allAllies', 'aroundSelf', 'adjacentFree', 'nearEnemies']);
const RUN_EFFECTS = new Set(['heal', 'damage', 'kamas', 'fragments', 'xp', 'relic', 'curse', 'itemChoice', 'upgradeItem', 'boon', 'spellVariantChoice', 'learnSpellChoice', 'runeChoice', 'combat', 'nextCombatModifier', 'random']);
const UNLOCK_IDS = new Set(UNLOCKS.map((u) => u.id));

function checkEffects(effects, where) {
  for (const e of effects ?? []) {
    expect(EFFECT_TYPES, `${where}: efecto ${e.type}`).toContain(e.type);
    expect(TARGETS.has(e.target), `${where}: objetivo ${e.target}`).toBe(true);
    if (e.type === 'status' || e.type === 'removeStatus') expect(STATUSES[e.status], `${where}: estado ${e.status}`).toBeDefined();
    if (e.type === 'summon') expect(MONSTERS[e.monster], `${where}: monstruo ${e.monster}`).toBeDefined();
    if (e.type === 'charge') {
      checkEffects(e.hit, `${where}/carga`);
      for (const st of e.wallStatus ?? []) expect(STATUSES[st.status]).toBeDefined();
    }
  }
}

function checkTriggers(triggers, where) {
  for (const t of triggers ?? []) {
    expect(EVENTS_KNOWN.has(t.event), `${where}: evento ${t.event}`).toBe(true);
    for (const c of t.conditions ?? []) {
      expect(CONDITION_TYPES, `${where}: condición ${c.type}`).toContain(c.type);
      if (c.status) expect(STATUSES[c.status]).toBeDefined();
    }
    checkEffects(t.actions, where);
  }
}

function checkStats(stats, where) {
  for (const k of Object.keys(stats ?? {})) expect(STATS[k], `${where}: estadística ${k}`).toBeDefined();
}

describe('validación del contenido', () => {
  it('hechizos: efectos, estados y variantes válidos', () => {
    for (const [id, s] of Object.entries(ALL_SPELLS)) {
      expect(s.id).toBe(id);
      checkEffects(s.effects, `hechizo ${id}`);
      for (const v of s.variants ?? []) {
        const r = resolveSpell(id, { variant: v.id });
        expect(r.variantId).toBe(v.id);
        checkEffects(r.effects, `variante ${v.id}`);
      }
    }
  });

  it('clases: hechizos, talentos, orígenes y armas existen', () => {
    for (const cls of Object.values(CLASSES)) {
      for (const id of [...cls.startingSpells, ...cls.learnableSpells]) expect(ALL_SPELLS[id], `${cls.id}: ${id}`).toBeDefined();
      expect(ITEMS[cls.startingWeapon]?.attack).toBeDefined();
      checkTriggers(cls.passive.triggers, `${cls.id} pasiva`);
      checkStats(cls.baseStats, cls.id);
      for (const t of cls.talents) {
        checkTriggers(t.triggers, `${cls.id}/${t.id}`);
        checkStats(t.stats, `${cls.id}/${t.id}`);
      }
      for (const o of cls.origins) {
        if (o.unlock) expect(UNLOCK_IDS.has(o.unlock), o.unlock).toBe(true);
        if (o.startingWeapon) expect(ITEMS[o.startingWeapon]).toBeDefined();
        for (const [from, to] of Object.entries(o.replaceSpells ?? {})) {
          expect(cls.startingSpells).toContain(from);
          expect(ALL_SPELLS[to]).toBeDefined();
        }
        for (const r of o.startingRelics ?? []) expect(RELICS[r]).toBeDefined();
      }
    }
  });

  it('objetos: tipos, estadísticas, sets, desbloqueos y armas', () => {
    const types = new Set(EQUIP_SLOTS.map((s) => s.type));
    for (const [id, def] of Object.entries(ITEMS)) {
      expect(def.id).toBe(id);
      expect(types.has(def.type), `${id}: tipo ${def.type}`).toBe(true);
      checkStats(def.stats, id);
      checkStats(def.fixedStats, id);
      checkTriggers(def.triggers, id);
      if (def.set) expect(SETS[def.set].pieces).toContain(id);
      if (def.unlock) expect(UNLOCK_IDS.has(def.unlock), def.unlock).toBe(true);
      if (def.type === 'weapon') {
        expect(def.attack, id).toBeDefined();
        const item = createItem(createRng(id), id, def.rarity ?? def.minRarity ?? 'common', 1, { itemSeq: 0 });
        checkEffects(weaponSpell(item, def).effects, `arma ${id}`);
      }
    }
    for (const set of Object.values(SETS)) {
      for (const p of set.pieces) expect(ITEMS[p].set).toBe(set.id);
      for (const b of Object.values(set.bonuses)) {
        checkStats(b.stats, set.id);
        checkTriggers(b.triggers, set.id);
      }
    }
    for (const e of Object.values(ENCHANTMENTS)) {
      checkTriggers(e.triggers, e.id);
      checkStats(e.stats, e.id);
    }
  });

  it('reliquias, estados y modificadores', () => {
    for (const r of Object.values(RELICS)) {
      checkTriggers(r.triggers, r.id);
      checkStats(r.stats, r.id);
      if (r.unlock) expect(UNLOCK_IDS.has(r.unlock)).toBe(true);
    }
    for (const s of Object.values(STATUSES)) {
      checkTriggers(s.triggers, s.id);
      checkEffects(s.onExpire, s.id);
      for (const k of Object.keys(s.stats ?? {})) expect(STATS[k], `${s.id}: ${k}`).toBeDefined();
    }
    for (const m of Object.values(COMBAT_MODIFIERS)) {
      for (const part of [m.all, m.enemies, m.players].filter(Boolean)) {
        checkStats(part.stats, m.id);
        checkTriggers(part.triggers, m.id);
      }
    }
    for (const id of [...ELITE_MODIFIERS, ...CHALLENGE_MODIFIERS, ...FLOOR_MODIFIERS]) expect(COMBAT_MODIFIERS[id]).toBeDefined();
  });

  it('monstruos y estratos', () => {
    for (const m of Object.values(MONSTERS)) {
      for (const s of m.spells) expect(ALL_SPELLS[s], `${m.id}: ${s}`).toBeDefined();
      for (const p of m.passives ?? []) checkTriggers(p.triggers, m.id);
      for (const ph of m.phases ?? []) {
        checkEffects(ph.onEnter, `${m.id} fase`);
        for (const s of [...(ph.addSpells ?? []), ...(ph.telegraphs ?? [])]) expect(ALL_SPELLS[s]).toBeDefined();
      }
      for (const s of m.ai?.telegraphs ?? []) expect(ALL_SPELLS[s].telegraph).toBeDefined();
      checkStats(m.stats, m.id);
    }
    for (const act of ACTS) {
      for (const e of act.enemies) expect(MONSTERS[e.id]?.tier).toBe('normal');
      for (const e of act.elites) expect(MONSTERS[e].tier).toBe('elite');
      expect(MONSTERS[act.boss].tier).toBe('boss');
    }
  });

  it('eventos: efectos de expedición válidos', () => {
    const check = (effects, where) => {
      for (const e of effects ?? []) {
        expect(RUN_EFFECTS.has(e.type), `${where}: ${e.type}`).toBe(true);
        if (e.type === 'random') for (const o of e.outcomes) check(o.effects, where);
        if (e.type === 'curse' && e.relic) expect(RELICS[e.relic].tier).toBe('curse');
        if (e.type === 'nextCombatModifier' || e.modifier) expect(COMBAT_MODIFIERS[e.modifier]).toBeDefined();
        if (e.type === 'boon') checkStats(e.stats, where);
      }
    };
    for (const ev of Object.values(EVENTS)) {
      expect(ev.options.length).toBeGreaterThan(0);
      for (const o of ev.options) check(o.effects, ev.id);
    }
  });

  it('runas: parches sobre campos conocidos', () => {
    const fields = new Set(['apCost', 'maxRange', 'castsPerTurn', 'cooldown', 'crit', 'los', 'rangeMod', 'inLine']);
    for (const r of Object.values(SPELL_RUNES)) {
      for (const k of [...Object.keys(r.patch.add ?? {}), ...Object.keys(r.patch.set ?? {})]) expect(fields.has(k), `${r.id}: ${k}`).toBe(true);
    }
  });
});
