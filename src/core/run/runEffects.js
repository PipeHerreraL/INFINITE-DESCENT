import { RELICS } from '../../content/relics.js';
import { int, pick, weighted } from '../rng.js';
import { MAX_UPGRADE } from '../items/items.js';
import { healPct, damageHeroPct, addKamas, gainXp, addRelic, refreshHero, floorNumber } from './run.js';
import { itemChoicesFor, itemRewardRoom, pickRelics } from './rewards.js';
import { choiceRoom } from './choices.js';
import { getItemDef } from '../../content/items/index.js';

// DSL de efectos de expedición (eventos, descanso, mercader…).
// Devuelve los textos de resultado; las salas de seguimiento se encolan en run.queue.

export function applyRunEffects(run, effects, out = { texts: [] }) {
  for (const e of effects ?? []) applyRunEffect(run, e, out);
  return out;
}

function upgradeTargets(run, target, count) {
  const equipped = Object.values(run.hero.equipment).filter((i) => i && (i.upgrade ?? 0) < MAX_UPGRADE);
  if (target === 'weapon') {
    const w = run.hero.equipment.weapon;
    return w && w.upgrade < MAX_UPGRADE ? [w] : [];
  }
  const out = [];
  const pool = [...equipped];
  for (let i = 0; i < count && pool.length; i++) {
    const it = pick(run.rng, pool);
    pool.splice(pool.indexOf(it), 1);
    out.push(it);
  }
  return out;
}

export function applyRunEffect(run, e, out) {
  switch (e.type) {
    case 'heal': {
      const h = healPct(run, e.pct);
      out.texts.push(`Recuperas ${h} PV.`);
      break;
    }
    case 'damage': {
      const d = damageHeroPct(run, e.pct);
      out.texts.push(`Pierdes ${d} PV.`);
      break;
    }
    case 'kamas': {
      const amount = Array.isArray(e.amount) ? int(run.rng, e.amount[0], e.amount[1]) : e.amount;
      if (amount >= 0) out.texts.push(`+${addKamas(run, amount)} kamas.`);
      else {
        run.kamas = Math.max(0, run.kamas + amount);
        out.texts.push(`${amount} kamas.`);
      }
      break;
    }
    case 'fragments':
      run.fragments += e.amount;
      out.texts.push(`+${e.amount} fragmentos.`);
      break;
    case 'xp': {
      const levels = gainXp(run, e.amount);
      out.texts.push(`+${e.amount} XP${levels ? ` (¡+${levels} nivel!)` : ''}.`);
      break;
    }
    case 'relic': {
      const [id] = pickRelics(run, [e.tier ?? 'common'], 1);
      if (id && addRelic(run, id)) out.texts.push(`Obtienes la reliquia ${RELICS[id].name}.`);
      else {
        out.texts.push('No queda ninguna reliquia de ese tipo: obtienes 40 kamas.');
        addKamas(run, 40);
      }
      break;
    }
    case 'curse': {
      const owned = new Set(run.hero.relics);
      const curses = Object.values(RELICS).filter((r) => r.tier === 'curse' && !owned.has(r.id)).map((r) => r.id);
      const id = e.relic && !owned.has(e.relic) ? e.relic : pick(run.rng, curses);
      if (id) {
        addRelic(run, id);
        out.texts.push(`Maldición: ${RELICS[id].name}.`);
      }
      break;
    }
    case 'itemChoice': {
      const items = itemChoicesFor(run, {
        floor: floorNumber(run), count: e.count ?? 1, rarity: e.rarity ?? null, min: e.minRarity ?? 'common',
      });
      if (items.length) run.queue.push(itemRewardRoom(run, items, e.title ?? 'Hallazgo'));
      break;
    }
    case 'upgradeItem': {
      const targets = upgradeTargets(run, e.target, e.count ?? 1);
      if (!targets.length) {
        out.texts.push('No tienes nada que mejorar: recibes 3 fragmentos.');
        run.fragments += 3;
      }
      for (const it of targets) {
        it.upgrade = Math.min(MAX_UPGRADE, it.upgrade + (e.levels ?? 1));
        out.texts.push(`${getItemDef(it.baseId).name} sube a +${it.upgrade}.`);
      }
      refreshHero(run);
      break;
    }
    case 'boon':
      run.hero.boons.push({ id: `evt${run.hero.boons.length}`, name: e.name, stats: e.stats });
      refreshHero(run);
      out.texts.push(`${e.name}: bendición obtenida.`);
      break;
    case 'spellVariantChoice':
      run.queue.push(choiceRoom(run, 'spellVariant'));
      break;
    case 'learnSpellChoice':
      run.queue.push(choiceRoom(run, 'learnSpell'));
      break;
    case 'runeChoice':
      run.queue.push(choiceRoom(run, 'rune'));
      break;
    case 'combat':
      run.queue.push({ type: 'combatStart', kind: e.kind ?? 'normal', modifier: e.modifier ?? null });
      break;
    case 'nextCombatModifier':
      run.nextCombatModifier = e.modifier;
      break;
    case 'random': {
      const outcome = weighted(run.rng, e.outcomes, (o) => o.weight ?? 1);
      if (outcome.text) out.texts.push(outcome.text);
      applyRunEffects(run, outcome.effects, out);
      break;
    }
    default:
      throw new Error(`Efecto de expedición desconocido: ${e.type}`);
  }
  return out;
}
