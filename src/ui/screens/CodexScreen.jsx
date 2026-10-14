import { useState } from 'react';
import { useGameState, useDispatch } from '../hooks/useGame.jsx';
import { ITEMS, SETS, getItemDef } from '../../content/items/index.js';
import { RELICS } from '../../content/relics.js';
import { MONSTERS } from '../../content/enemies/index.js';
import { CLASSES } from '../../content/classes/index.js';
import { RARITIES } from '../../content/rarities.js';
import { DIFFICULTIES } from '../../content/difficulty.js';
import { resolveSpell } from '../../core/spells.js';
import { createItem } from '../../core/items/items.js';
import { createRng } from '../../core/rng.js';
import { ItemCard } from '../components/ItemCard.jsx';
import { SpellCard } from '../components/SpellCard.jsx';
import { Tip } from '../components/Common.jsx';
import { Portrait } from '../board/UnitSprite.jsx';
import Icon from '../components/Icon.jsx';

function sampleItem(id) {
  const def = getItemDef(id);
  return createItem(createRng(id), id, def.rarity ?? def.minRarity ?? 'common', 1, { itemSeq: 0 });
}

export default function CodexScreen() {
  const { meta } = useGameState();
  const dispatch = useDispatch();
  const [tab, setTab] = useState('records');
  const items = Object.values(ITEMS);
  const relics = Object.values(RELICS);
  const monsters = Object.values(MONSTERS).filter((m) => m.tier !== 'summon' || m.id === 'huevoArana');
  return (
    <div className="codex">
      <header className="screen-head">
        <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'title' })}>← Volver</button>
        <h1>Códice</h1>
        <div className="tabs">
          {[['records', 'Registros'], ['items', `Objetos ${meta.codex.items.length}/${items.length}`], ['relics', `Reliquias ${meta.codex.relics.length}/${relics.length}`], ['monsters', `Bestiario ${meta.codex.monsters.length}/${monsters.length}`]].map(([id, label]) => (
            <button type="button" key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
      </header>
      <div className="codex-body scroll">
        {tab === 'records' ? (
          <div className="records">
            <div className="panel records-stats">
              <h2>Estadísticas</h2>
              <div className="stat-grid">
                <div><b>{meta.stats.runs}</b><span>Expediciones</span></div>
                <div><b>{meta.stats.victories}</b><span>Victorias</span></div>
                <div><b>{meta.stats.bestFloor}</b><span>Mejor piso</span></div>
                <div><b>{meta.stats.totalKills}</b><span>Enemigos derrotados</span></div>
                <div><b>{meta.stats.bossesKilled}</b><span>Jefes derrotados</span></div>
                <div><b>{meta.stats.challenges}</b><span>Desafíos cumplidos</span></div>
                <div><b>{meta.totalEssence}</b><span>Esencia total</span></div>
                <div><b>{DIFFICULTIES[meta.maxDifficulty]?.name}</b><span>Pesadilla máxima</span></div>
              </div>
            </div>
            <div className="panel records-history">
              <h2>Últimas expediciones</h2>
              {meta.history.length === 0 ? <p className="muted">Aún no has completado ninguna expedición.</p> : null}
              {meta.history.map((h, i) => (
                <div key={i} className="history-row">
                  <Portrait sprite={{ shape: CLASSES[h.classId].sprite, color: CLASSES[h.classId].color }} size={34} />
                  <span className={h.victory ? 'pos' : 'neg'}>{h.victory ? 'Victoria' : 'Derrota'}</span>
                  <span>{CLASSES[h.classId].name} nv. {h.level}</span>
                  <span>Piso {h.floor}</span>
                  <span>{DIFFICULTIES[h.difficulty]?.name}</span>
                  <span className="muted tiny">Semilla {h.seed}</span>
                  <span><Icon name="moon" size={14} /> {h.essence}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {tab === 'items' ? (
          <div className="codex-grid">
            {Object.values(SETS).map((set) => (
              <div key={set.id} className="codex-set panel">
                <b style={{ color: set.color }}>{set.name}</b>
                {Object.entries(set.bonuses).map(([n, b]) => <div key={n} className="tiny">{n}: {b.desc}</div>)}
              </div>
            ))}
            {items.map((def) => {
              const known = meta.codex.items.includes(def.id);
              const r = def.rarity ?? def.minRarity ?? 'common';
              return (
                <Tip key={def.id} content={known ? <ItemCard item={sampleItem(def.id)} /> : 'Sin descubrir'}>
                  <div className={`codex-entry ${known ? '' : 'unknown'}`} style={{ '--rc': RARITIES[r].color }}>
                    {known ? def.name : '???'}
                  </div>
                </Tip>
              );
            })}
          </div>
        ) : null}
        {tab === 'relics' ? (
          <div className="codex-grid">
            {relics.map((r) => {
              const known = meta.codex.relics.includes(r.id);
              return (
                <div key={r.id} className={`codex-relic panel ${known ? '' : 'unknown'}`}>
                  <Icon name={r.icon} size={22} color={r.tier === 'curse' ? '#9d0208' : '#b8860b'} />
                  <div>
                    <b>{known ? r.name : '???'}</b>
                    <div className="tiny">{known ? r.desc : 'Sin descubrir'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        {tab === 'monsters' ? (
          <div className="codex-grid monsters">
            {monsters.map((m) => {
              const known = meta.codex.monsters.includes(m.id);
              return (
                <div key={m.id} className={`codex-monster panel ${known ? '' : 'unknown'}`}>
                  <Portrait sprite={m.sprite} size={64} />
                  <div className="grow">
                    <b>{known ? m.name : '???'}</b> <span className="tiny muted">{m.family} · {m.tier}</span>
                    {known ? (
                      <>
                        <div className="tiny">{m.desc}</div>
                        <div className="tiny muted">Vida base {m.stats.hp} · PA {m.stats.ap} · PM {m.stats.mp}</div>
                        <div className="row wrap" style={{ gap: 4 }}>
                          {m.spells.map((id) => (
                            <Tip key={id} content={<SpellCard spell={resolveSpell(id)} />}>
                              <span className="chip">{resolveSpell(id).name}</span>
                            </Tip>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
