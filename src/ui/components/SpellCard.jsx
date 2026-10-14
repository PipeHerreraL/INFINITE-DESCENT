import { ELEMENTS } from '../../content/elements.js';
import { SPELL_RUNES } from '../../content/spellUpgrades.js';
import { getSpellDef } from '../../core/spells.js';
import { computeDamage, computeHeal } from '../../core/combat/damage.js';
import { describeEffect, spellMeta, targetName } from '../text/describe.js';
import Icon from './Icon.jsx';

const DUMMY_TARGET = { id: '__dummy', baseStats: {}, statuses: [], maxHp: 100, hp: 100 };

/** Calcula el rango de daño/curación real con las estadísticas del lanzador. */
export function effectRange(caster, spell, effect, combat = null) {
  const stub = combat ?? { units: {}, rng: { s: 1 } };
  if (effect.type === 'damage' && effect.value === undefined) {
    return [
      computeDamage(stub, { caster, target: DUMMY_TARGET, effect, spell, mode: 'min' }),
      computeDamage(stub, { caster, target: DUMMY_TARGET, effect, spell, mode: 'max' }),
    ];
  }
  if (effect.type === 'heal' && effect.value === undefined) {
    return [
      computeHeal(stub, { caster, target: DUMMY_TARGET, effect, mode: 'min' }),
      computeHeal(stub, { caster, target: DUMMY_TARGET, effect, mode: 'max' }),
    ];
  }
  return null;
}

/** Unidad ficticia a partir del perfil, para previsualizar fuera de combate. */
export function previewCaster(profile) {
  return {
    id: '__preview',
    baseStats: profile.stats,
    statuses: [],
    uses: {},
    dominantElement: profile.dominantElement,
    sources: [],
    maxHp: profile.maxHp,
    hp: profile.maxHp,
  };
}

export function spellColor(spell, caster) {
  const el = spell.element === 'dominant' ? caster?.dominantElement : spell.element;
  return ELEMENTS[el]?.color ?? '#9aa0a6';
}

export function SpellIcon({ spell, caster, size = 40 }) {
  return (
    <div className="spell-icon" style={{ width: size, height: size, '--sc': spellColor(spell, caster) }}>
      <Icon name={spell.icon ?? 'star'} size={size * 0.56} color="#fff" />
    </div>
  );
}

export function SpellCard({ spell, caster, combat = null, range = null, cooldown = 0, compact = false, blocked = null }) {
  const meta = spellMeta(spell, range);
  const def = spell.isWeapon ? null : getSpellDef(spell.id);
  return (
    <div className="spell-card">
      <div className="row" style={{ gap: 8 }}>
        <SpellIcon spell={spell} caster={caster} size={36} />
        <div className="grow">
          <div className="spell-name">{spell.name}</div>
          <div className="tiny muted">{targetName(spell.target)}</div>
        </div>
      </div>
      <div className="spell-meta">{meta.join(' · ')}</div>
      {spell.desc && !compact ? <div className="spell-desc">{spell.desc}</div> : null}
      <ul className="spell-effects">
        {spell.effects.map((e, i) => (
          <li key={i}>{describeEffect(e, { damage: caster ? effectRange(caster, spell, e, combat) : null })}</li>
        ))}
      </ul>
      {spell.telegraph ? <div className="tiny warn-text">Ataque anunciado: se ejecuta al inicio de su próximo turno.</div> : null}
      {spell.variantId ? <div className="tiny variant-text">Variante: {spell.name} (base: {def?.name})</div> : null}
      {spell.runes?.length ? <div className="tiny rune-text">Runas: {spell.runes.map((r) => SPELL_RUNES[r]?.name).join(', ')}</div> : null}
      {cooldown > 0 ? <div className="tiny warn-text">Disponible en {cooldown} turno(s).</div> : null}
      {blocked && !cooldown ? <div className="tiny warn-text">No disponible: {blocked}.</div> : null}
    </div>
  );
}
