import { useGameState, useDispatch } from '../hooks/useGame.jsx';
import { RELICS } from '../../content/relics.js';
import { BAG_CAPACITY, getItemDef } from '../../content/items/index.js';
import { price, sellPrice } from '../../core/run/shop.js';
import { runeOptions } from '../../core/run/choices.js';
import { countSetPieces } from '../../core/items/sets.js';
import { defaultSlotFor } from '../../core/items/equipment.js';
import { ItemCard, ItemIcon } from '../components/ItemCard.jsx';
import { Tip } from '../components/Common.jsx';
import Icon from '../components/Icon.jsx';
import { Portrait } from '../board/UnitSprite.jsx';

export default function ShopView({ onOpenSheet }) {
  const { run } = useGameState();
  const dispatch = useDispatch();
  const shop = run.room;
  const hero = run.hero;
  const bagFull = hero.bag.length >= BAG_CAPACITY;
  const counts = countSetPieces(hero.equipment);

  return (
    <div className="room shop">
      <div className="room-head">
        <Portrait sprite={{ shape: 'kobold', color: '#2a9d8f', accent: '#f4a261' }} size={64} />
        <div className="grow">
          <h2>El Mercader Errante</h2>
          <div className="dim small">«Todo lo que ves, a un precio justo… para mí». Tienes <b className="gold-text">{run.kamas}</b> kamas.</div>
        </div>
        <button type="button" className="btn btn-parchment" onClick={onOpenSheet}><Icon name="bag" size={16} /> Equipo</button>
        <button type="button" className="btn btn-gold" onClick={() => dispatch({ type: 'LEAVE_ROOM' })}>Salir de la tienda</button>
      </div>
      <div className="room-body scroll">
        <h3 className="section-title">Equipo a la venta {bagFull ? <span className="tiny neg">(bolsa llena)</span> : null}</h3>
        <div className="reward-items">
          {shop.items.map((entry, i) => {
            const cost = price(run, entry.price);
            const slot = defaultSlotFor(hero, entry.item);
            const def = getItemDef(entry.item.baseId);
            return (
              <ItemCard
                key={entry.item.uid}
                item={entry.item}
                compare={slot ? hero.equipment[slot] ?? undefined : undefined}
                setCount={def.set ? counts[def.set] ?? 0 : null}
                actions={
                  entry.sold ? (
                    <span className="muted">Vendido</span>
                  ) : (
                    <button type="button" className="btn btn-gold btn-sm" disabled={run.kamas < cost || bagFull} onClick={() => dispatch({ type: 'SHOP_BUY_ITEM', index: i })}>
                      <Icon name="coin" size={14} /> Comprar ({cost})
                    </button>
                  )
                }
              />
            );
          })}
        </div>
        <div className="shop-row">
          {shop.relic ? (
            <div className="relic-card panel">
              <Icon name={RELICS[shop.relic.id].icon} size={30} color="#b8860b" />
              <div className="grow">
                <b>{RELICS[shop.relic.id].name}</b>
                <div className="small">{RELICS[shop.relic.id].desc}</div>
              </div>
              {shop.relic.sold ? <span className="muted">Vendida</span> : (
                <button type="button" className="btn btn-gold btn-sm" disabled={run.kamas < price(run, shop.relic.price)} onClick={() => dispatch({ type: 'SHOP_BUY_RELIC' })}>
                  <Icon name="coin" size={14} /> {price(run, shop.relic.price)}
                </button>
              )}
            </div>
          ) : null}
          <div className="service panel">
            <b>Pócima de ensueño</b>
            <div className="small">Recupera el 35% de tu vida ({run.hero.hp}/{run.hero.maxHpCache}).</div>
            <button type="button" className="btn btn-sm" disabled={shop.healUsed || run.kamas < price(run, shop.healPrice) || run.hero.hp >= run.hero.maxHpCache} onClick={() => dispatch({ type: 'SHOP_HEAL' })}>
              {shop.healUsed ? 'Agotada' : <><Icon name="coin" size={14} /> {price(run, shop.healPrice)}</>}
            </button>
          </div>
          <div className="service panel">
            <b>Grabado de runa</b>
            <div className="small">Elige una runa para uno de tus hechizos.</div>
            <button type="button" className="btn btn-sm" disabled={shop.runeUsed || run.kamas < price(run, shop.runePrice) || !runeOptions(run).length} onClick={() => dispatch({ type: 'SHOP_RUNE' })}>
              {shop.runeUsed ? 'Hecho' : <><Icon name="coin" size={14} /> {price(run, shop.runePrice)}</>}
            </button>
          </div>
          <div className="service panel">
            <b>Renovar existencias</b>
            <div className="small">El mercader saca otros objetos.</div>
            <button type="button" className="btn btn-sm btn-parchment" disabled={run.kamas < price(run, shop.rerollPrice)} onClick={() => dispatch({ type: 'SHOP_REROLL' })}>
              <Icon name="coin" size={14} /> {price(run, shop.rerollPrice)}
            </button>
          </div>
        </div>
        <h3 className="section-title">Vender (bolsa)</h3>
        <div className="sell-row">
          {hero.bag.length === 0 ? <span className="dim small">Tu bolsa está vacía. También puedes vender piezas equipadas desde la hoja de equipo.</span> : null}
          {hero.bag.map((item) => (
            <Tip key={item.uid} content={<ItemCard item={item} />} className="sell-item">
              <ItemIcon item={item} size={44} />
              <button type="button" className="btn btn-sm btn-gold" onClick={() => dispatch({ type: 'SHOP_SELL', uid: item.uid })}>
                +{sellPrice(item)}
              </button>
            </Tip>
          ))}
        </div>
      </div>
    </div>
  );
}
