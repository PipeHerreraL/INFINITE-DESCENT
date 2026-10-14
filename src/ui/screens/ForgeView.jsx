import { useState } from 'react';
import { useGameState, useDispatch } from '../hooks/useGame.jsx';
import { ELEMENTS, ELEMENTAL_IDS } from '../../content/elements.js';
import { EQUIP_SLOTS } from '../../content/items/index.js';
import { MAX_UPGRADE, salvageValue, itemLines } from '../../core/items/items.js';
import { upgradeCost, TRANSMUTE_COST, ELEMENT_SHIFT_COST, itemOffensiveElement } from '../../core/run/forge.js';
import { locateItem } from '../../core/items/equipment.js';
import { statLine } from '../text/describe.js';
import { ItemCard, ItemIcon } from '../components/ItemCard.jsx';
import Icon from '../components/Icon.jsx';

function costText(c) {
  if (!c) return '';
  if (c.free) return 'gratis';
  return [c.fragments ? `${c.fragments} frag.` : null, c.kamas ? `${c.kamas} kamas` : null].filter(Boolean).join(' + ');
}

function afford(run, c) {
  return !!c && run.fragments >= c.fragments && run.kamas >= c.kamas;
}

export default function ForgeView() {
  const { run } = useGameState();
  const dispatch = useDispatch();
  const forge = run.room;
  const hero = run.hero;
  const [uid, setUid] = useState(null);
  const loc = uid ? locateItem(hero, uid) : null;
  const item = loc?.item ?? null;
  const all = [
    ...EQUIP_SLOTS.map((s) => hero.equipment[s.id]).filter(Boolean),
    ...hero.bag,
  ];
  const up = item ? upgradeCost(run, forge, item) : null;
  const offEl = item ? itemOffensiveElement(item) : null;
  const currentEl = item?.elementMap?.to ?? offEl;

  return (
    <div className="room forge">
      <div className="room-head">
        <Icon name="forge" size={34} color="var(--gold)" />
        <div className="grow">
          <h2>La Forja Onírica</h2>
          <div className="dim small">
            Fragmentos: <b>{run.fragments}</b> · Kamas: <b>{run.kamas}</b>
            {run.unlocks?.forge_mastery && !forge.freeUpgradeUsed ? ' · Tu primera mejora aquí es gratuita.' : ''}
          </div>
        </div>
        <button type="button" className="btn btn-gold" onClick={() => dispatch({ type: 'LEAVE_ROOM' })}>Salir de la forja</button>
      </div>
      <div className="forge-layout">
        <div className="forge-items">
          <div className="panel-title light">Elige una pieza</div>
          <div className="forge-grid">
            {all.map((it) => (
              <ItemIcon key={it.uid} item={it} size={52} selected={it.uid === uid} onClick={() => setUid(it.uid)} />
            ))}
          </div>
          <p className="tiny dim">Mejorar: +12% a todas sus líneas por nivel (máx. +{MAX_UPGRADE}). Transmutar: vuelve a tirar una línea. Elemento: cambia sus características ofensivas a otro elemento para pivotar tu build.</p>
        </div>
        <div className="forge-detail">
          {item ? (
            <>
              <ItemCard item={item} />
              <div className="forge-ops panel">
                <div className="forge-op">
                  <div><b>Mejorar a +{Math.min(MAX_UPGRADE, item.upgrade + 1)}</b><div className="tiny muted">{up ? costText(up) : 'Nivel máximo'}</div></div>
                  <button type="button" className="btn btn-sm" disabled={!up || !afford(run, up)} onClick={() => dispatch({ type: 'FORGE_UPGRADE', uid })}>Mejorar</button>
                </div>
                <div className="forge-op col">
                  <div><b>Transmutar una línea</b> <span className="tiny muted">({costText(TRANSMUTE_COST)})</span></div>
                  {itemLines(item).filter((l) => !l.fixed).map((l) => (
                    <div key={l.index} className="row" style={{ gap: 6 }}>
                      <span className="small grow">{statLine(l.stat, l.value)} {l.base ? <span className="tiny muted">(base)</span> : <span className="tiny muted">(afijo)</span>}</span>
                      <button type="button" className="btn btn-sm btn-parchment" disabled={!afford(run, TRANSMUTE_COST)} onClick={() => dispatch({ type: 'FORGE_TRANSMUTE', uid, line: l.index })}>
                        Transmutar
                      </button>
                    </div>
                  ))}
                </div>
                {offEl ? (
                  <div className="forge-op col">
                    <div><b>Cambiar elemento</b> <span className="tiny muted">({costText(ELEMENT_SHIFT_COST)}) · Ahora: {ELEMENTS[currentEl].name}</span></div>
                    <div className="row wrap" style={{ gap: 6 }}>
                      {ELEMENTAL_IDS.map((el) => (
                        <button key={el} type="button" className="btn btn-sm btn-parchment" style={{ color: ELEMENTS[el].color }} disabled={el === currentEl || !afford(run, ELEMENT_SHIFT_COST)} onClick={() => dispatch({ type: 'FORGE_ELEMENT', uid, element: el })}>
                          {ELEMENTS[el].name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="forge-op">
                  <div><b>Desmantelar</b><div className="tiny muted">+{salvageValue(item)} fragmentos</div></div>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => { dispatch({ type: 'SALVAGE', uid }); setUid(null); }}>Desmantelar</button>
                </div>
              </div>
            </>
          ) : (
            <div className="sheet-empty dim">Selecciona una pieza de tu equipo o de tu bolsa.</div>
          )}
        </div>
      </div>
    </div>
  );
}
