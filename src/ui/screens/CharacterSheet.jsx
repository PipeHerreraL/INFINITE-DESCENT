import { useState } from 'react';
import { useGameState, useDispatch, useHeroProfile } from '../hooks/useGame.jsx';
import { EQUIP_SLOTS, BAG_CAPACITY, getItemDef, slotsForType } from '../../content/items/index.js';
import { CLASSES } from '../../content/classes/index.js';
import { RELICS } from '../../content/relics.js';
import { salvageValue } from '../../core/items/items.js';
import { countSetPieces } from '../../core/items/sets.js';
import { defaultSlotFor, canEquip } from '../../core/items/equipment.js';
import { sellPrice } from '../../core/run/shop.js';
import { Modal, Tip } from '../components/Common.jsx';
import { ItemIcon, ItemCard } from '../components/ItemCard.jsx';
import { SpellCard, SpellIcon, previewCaster } from '../components/SpellCard.jsx';
import { StatList } from '../components/StatList.jsx';
import Icon from '../components/Icon.jsx';

const DOLL_LAYOUT = [
  ['hat', 'amulet', 'cloak'],
  ['ring1', 'belt', 'ring2'],
  ['weapon', 'boots', 'shield'],
  ['trophy1', null, 'trophy2'],
];

export default function CharacterSheet({ onClose }) {
  const { run } = useGameState();
  const dispatch = useDispatch();
  const profile = useHeroProfile(run);
  const [selected, setSelected] = useState(null); // { where, slot?, uid }
  const inCombat = !!run.combat;
  const inShop = run.room?.type === 'shop';
  const hero = run.hero;
  const cls = CLASSES[hero.classId];
  const counts = countSetPieces(hero.equipment);
  const caster = previewCaster(profile);

  let selItem = null;
  if (selected?.where === 'equipment') selItem = hero.equipment[selected.slot];
  if (selected?.where === 'bag') selItem = hero.bag.find((i) => i.uid === selected.uid) ?? null;

  const act = (action) => {
    dispatch(action);
    setSelected(null);
  };

  let actions = null;
  if (selItem && !inCombat) {
    const def = getItemDef(selItem.baseId);
    if (selected.where === 'bag') {
      const slots = slotsForType(def.type);
      actions = (
        <>
          {slots.length > 1 ? (
            slots.map((s) => (
              <button key={s} type="button" className="btn btn-sm" disabled={!canEquip(hero, selItem, s).ok} onClick={() => act({ type: 'EQUIP', uid: selItem.uid, slot: s })}>
                Equipar ({EQUIP_SLOTS.find((x) => x.id === s).name} {s.slice(-1)})
              </button>
            ))
          ) : (
            <button type="button" className="btn btn-sm" disabled={!defaultSlotFor(hero, selItem)} onClick={() => act({ type: 'EQUIP', uid: selItem.uid })}>Equipar</button>
          )}
          <button type="button" className="btn btn-sm btn-parchment" onClick={() => act({ type: 'SALVAGE', uid: selItem.uid })}>
            <Icon name="gem" size={14} /> Desmantelar (+{salvageValue(selItem)})
          </button>
          {inShop ? (
            <button type="button" className="btn btn-sm btn-gold" onClick={() => act({ type: 'SHOP_SELL', uid: selItem.uid })}>
              <Icon name="coin" size={14} /> Vender ({sellPrice(selItem)})
            </button>
          ) : null}
        </>
      );
    } else {
      actions = (
        <>
          <button type="button" className="btn btn-sm btn-parchment" disabled={hero.bag.length >= BAG_CAPACITY} onClick={() => act({ type: 'UNEQUIP', slot: selected.slot })}>Quitar</button>
          <button type="button" className="btn btn-sm btn-parchment" onClick={() => act({ type: 'SALVAGE', uid: selItem.uid })}>
            <Icon name="gem" size={14} /> Desmantelar (+{salvageValue(selItem)})
          </button>
          {inShop ? (
            <button type="button" className="btn btn-sm btn-gold" onClick={() => act({ type: 'SHOP_SELL', uid: selItem.uid })}>
              <Icon name="coin" size={14} /> Vender ({sellPrice(selItem)})
            </button>
          ) : null}
        </>
      );
    }
  }

  let compare = null;
  if (selItem && selected.where === 'bag') {
    const slot = defaultSlotFor(hero, selItem);
    const equipped = slot ? hero.equipment[slot] : null;
    compare = equipped ?? undefined;
  }

  return (
    <Modal title={`${cls.name} — Equipo y estadísticas`} onClose={onClose} wide className="sheet-modal">
      {inCombat ? <div className="sheet-note"><Icon name="info" size={14} /> Durante el combate el equipo no se puede cambiar.</div> : null}
      <div className="sheet">
        <div className="sheet-col">
          <div className="panel-title">Equipado</div>
          <div className="doll">
            {DOLL_LAYOUT.flat().map((slot, i) => {
              if (!slot) return <div key={`x${i}`} className="doll-center"><Icon name={cls.sprite === 'warrior' ? 'sword' : cls.sprite === 'healer' ? 'heart' : 'bomb'} size={34} color="rgba(107,68,35,0.3)" /></div>;
              const item = hero.equipment[slot];
              const def = EQUIP_SLOTS.find((s) => s.id === slot);
              return (
                <div key={slot} className="doll-slot">
                  <ItemIcon
                    item={item}
                    size={54}
                    empty={def.type}
                    title={def.name}
                    selected={selected?.slot === slot}
                    onClick={item ? () => setSelected({ where: 'equipment', slot, uid: item.uid }) : undefined}
                  />
                  <span className="tiny muted">{def.name}</span>
                </div>
              );
            })}
          </div>
          <div className="panel-title">Bolsa ({hero.bag.length}/{BAG_CAPACITY})</div>
          <div className="bag">
            {Array.from({ length: BAG_CAPACITY }).map((_, i) => {
              const item = hero.bag[i];
              return (
                <ItemIcon
                  key={item?.uid ?? `e${i}`}
                  item={item}
                  size={50}
                  selected={item && selected?.uid === item.uid}
                  onClick={item ? () => setSelected({ where: 'bag', uid: item.uid }) : undefined}
                />
              );
            })}
          </div>
          <div className="small muted">Kamas: {run.kamas} · Fragmentos: {run.fragments}</div>
        </div>
        <div className="sheet-col sheet-detail">
          {selItem ? (
            <ItemCard item={selItem} compare={compare} actions={actions} setCount={getItemDef(selItem.baseId).set ? counts[getItemDef(selItem.baseId).set] ?? 0 : null} />
          ) : (
            <div className="sheet-empty muted">Selecciona un objeto para ver sus detalles, compararlo y gestionarlo.</div>
          )}
          {profile.sets.length ? (
            <div className="sheet-block">
              <div className="panel-title">Sets</div>
              {profile.sets.map((s) => (
                <div key={s.id} className="set-status" style={{ '--sc': s.color }}>
                  <b>{s.name}</b> <span className="tiny">({s.count}/{s.total})</span>
                  {s.bonuses.map((b) => (
                    <div key={b.pieces} className={`tiny ${b.active ? 'set-on' : 'set-off'}`}>{b.pieces}: {b.desc}</div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
          <div className="sheet-block">
            <div className="panel-title">Pasiva y talentos</div>
            <div className="small"><b>{cls.passive.name}:</b> {cls.passive.desc}</div>
            {hero.talents.map((t) => {
              const def = cls.talents.find((x) => x.id === t);
              return <div key={t} className="small"><b>{def.name}:</b> {def.desc}</div>;
            })}
            {hero.boons.map((b) => (
              <div key={b.id} className="tiny muted">Don: {b.name}</div>
            ))}
          </div>
          <div className="sheet-block">
            <div className="panel-title">Reliquias</div>
            {hero.relics.length === 0 ? <div className="tiny muted">Ninguna todavía.</div> : null}
            {hero.relics.map((id) => (
              <div key={id} className="small relic-line"><Icon name={RELICS[id].icon} size={16} /> <b>{RELICS[id].name}:</b> {RELICS[id].desc}</div>
            ))}
          </div>
        </div>
        <div className="sheet-col">
          <div className="panel-title">Hechizos</div>
          <div className="sheet-spells">
            {profile.spells.map((s) => (
              <Tip key={s.id} content={<SpellCard spell={s} caster={caster} />} as="div" className="sheet-spell">
                <SpellIcon spell={s} caster={caster} size={34} />
                <span className="small">{s.name}{s.runes?.length ? <span className="rune-text"> ✦{s.runes.length}</span> : null}</span>
              </Tip>
            ))}
          </div>
          <div className="panel-title">Estadísticas</div>
          <StatList profile={profile} />
        </div>
      </div>
    </Modal>
  );
}
