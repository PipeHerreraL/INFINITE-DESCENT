import { getItemDef, SETS, ITEM_TYPES, WEAPON_TYPES, ENCHANTMENTS } from '../../content/items/index.js';
import { RARITIES } from '../../content/rarities.js';
import { CLASSES } from '../../content/classes/index.js';
import { itemLines, itemStats } from '../../core/items/items.js';
import { weaponSpell } from '../../core/spells.js';
import { describeEffect, describeTrigger, statLine, isNegativeStat, spellMeta } from '../text/describe.js';
import Icon from './Icon.jsx';

const SLOT_ICON = { hat: 'hat', cloak: 'cloak', amulet: 'amulet', ring: 'ring', belt: 'belt', boots: 'boots', weapon: 'weapon', shield: 'shield', trophy: 'trophy' };

export function ItemIcon({ item, size = 40, empty = null, onClick, selected = false, title }) {
  if (!item) {
    return (
      <div className="item-icon empty" style={{ width: size, height: size }} title={title}>
        {empty ? <Icon name={SLOT_ICON[empty] ?? 'bag'} size={size * 0.55} color="rgba(107,68,35,0.35)" /> : null}
      </div>
    );
  }
  const def = getItemDef(item.baseId);
  const color = RARITIES[item.rarity].color;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`item-icon r-${item.rarity} ${selected ? 'selected' : ''}`}
      style={{ width: size, height: size, '--rc': color }}
      onClick={onClick}
      title={title}
    >
      <Icon name={SLOT_ICON[def.type] ?? 'bag'} size={size * 0.58} color={color} />
      {item.upgrade ? <span className="item-up">+{item.upgrade}</span> : null}
      {def.set ? <span className="item-set-dot" style={{ background: SETS[def.set].color }} /> : null}
    </Tag>
  );
}

function diffStats(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = [];
  for (const k of keys) {
    const d = (a[k] || 0) - (b[k] || 0);
    if (d !== 0) out.push([k, d]);
  }
  return out;
}

/** Tarjeta completa de un objeto. `compare` muestra la diferencia con otra pieza. */
export function ItemCard({ item, compare = null, actions = null, footer = null, setCount = null }) {
  const def = getItemDef(item.baseId);
  const rarity = RARITIES[item.rarity];
  const lines = itemLines(item);
  const weapon = def.attack ? weaponSpell(item, def) : null;
  const diffs = compare !== undefined && compare !== null ? diffStats(itemStats(item), itemStats(compare)) : null;
  const set = def.set ? SETS[def.set] : null;
  return (
    <div className={`item-card r-${item.rarity}`} style={{ '--rc': rarity.color }}>
      <div className="item-card-head">
        <ItemIcon item={item} size={44} />
        <div className="grow">
          <div className="item-name" style={{ color: rarity.text ?? rarity.color }}>
            {def.name}
            {item.upgrade ? <span className="item-upgrade"> +{item.upgrade}</span> : null}
          </div>
          <div className="tiny muted">
            {rarity.name} · {def.weaponType ? WEAPON_TYPES[def.weaponType] : ITEM_TYPES[def.type]} · Nv. {item.ilvl}
            {def.unique ? ' · Único' : ''}
          </div>
        </div>
      </div>
      {def.desc ? <div className="item-flavor">{def.desc}</div> : null}
      {weapon ? (
        <div className="item-attack">
          <b>Ataque:</b> {spellMeta(weapon).slice(0, 3).join(' · ')}
          <div>{weapon.effects.map((e, i) => <div key={i}>{describeEffect(e)}</div>)}</div>
        </div>
      ) : null}
      <ul className="item-lines">
        {lines.map((l, i) => (
          <li key={i} className={isNegativeStat(l.stat, l.value) ? 'neg' : l.base || l.fixed ? '' : 'affix'}>
            {statLine(l.stat, l.value)}
            {item.elementMap && l.base ? '' : ''}
          </li>
        ))}
      </ul>
      {(def.triggers ?? []).map((t, i) => (
        <div key={i} className="item-trigger">
          <Icon name="spark" size={14} /> {describeTrigger(t)}
        </div>
      ))}
      {item.enchant ? (
        <div className="item-enchant">
          <Icon name="star" size={14} /> <b>{ENCHANTMENTS[item.enchant].name}:</b> {ENCHANTMENTS[item.enchant].desc}
        </div>
      ) : null}
      {item.elementMap ? <div className="tiny item-enchant">Transmutado: {item.elementMap.from} → {item.elementMap.to}</div> : null}
      {set ? (
        <div className="item-setinfo" style={{ '--sc': set.color }}>
          <b>{set.name}</b>
          {setCount !== null ? <span> ({setCount}/{set.pieces.length})</span> : null}
          {Object.entries(set.bonuses).map(([n, b]) => (
            <div key={n} className={setCount !== null && setCount >= Number(n) ? 'set-on' : 'set-off'}>
              {n} piezas: {b.desc}
            </div>
          ))}
        </div>
      ) : null}
      {def.requires?.classId ? <div className="tiny neg">Solo {CLASSES[def.requires.classId].name}</div> : null}
      {diffs ? (
        <div className="item-diff">
          <div className="tiny muted">Comparado con lo equipado:</div>
          {diffs.length ? (
            diffs.map(([k, d]) => (
              <span key={k} className={isNegativeStat(k, d) ? 'neg' : 'pos'}>
                {statLine(k, d)}
              </span>
            ))
          ) : (
            <span className="muted">Mismas estadísticas</span>
          )}
        </div>
      ) : null}
      {footer}
      {actions ? <div className="item-actions">{actions}</div> : null}
    </div>
  );
}
