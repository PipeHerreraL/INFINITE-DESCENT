import { useGameState, useDispatch, useHeroProfile } from '../hooks/useGame.jsx';
import { RELICS } from '../../content/relics.js';
import { EVENTS } from '../../content/events.js';
import { CLASSES } from '../../content/classes/index.js';
import { DIFFICULTIES } from '../../content/difficulty.js';
import { getItemDef, slotsForType, EQUIP_SLOTS, BAG_CAPACITY } from '../../content/items/index.js';
import { SPELL_RUNES } from '../../content/spellUpgrades.js';
import { salvageValue } from '../../core/items/items.js';
import { countSetPieces } from '../../core/items/sets.js';
import { canEquip, defaultSlotFor } from '../../core/items/equipment.js';
import { resolveSpell } from '../../core/spells.js';
import { optionAvailability, restOptions } from '../../core/run/rooms.js';
import { computeEssence } from '../../core/meta/meta.js';
import { ItemCard, ItemIcon } from '../components/ItemCard.jsx';
import { SpellCard, previewCaster } from '../components/SpellCard.jsx';
import { Tip } from '../components/Common.jsx';
import Icon from '../components/Icon.jsx';
import { Portrait } from '../board/UnitSprite.jsx';

function RoomFrame({ title, subtitle, icon, children, footer }) {
  return (
    <div className="room">
      <div className="room-head">
        {icon ? <Icon name={icon} size={30} color="var(--gold)" /> : null}
        <div>
          <h2>{title}</h2>
          {subtitle ? <div className="dim small">{subtitle}</div> : null}
        </div>
      </div>
      <div className="room-body scroll">{children}</div>
      {footer ? <div className="room-foot">{footer}</div> : null}
    </div>
  );
}

// ── Recompensa ─────────────────────────────────────────────────────────

export function RewardView({ onOpenSheet }) {
  const { run } = useGameState();
  const dispatch = useDispatch();
  const room = run.room;
  const hero = run.hero;
  const counts = countSetPieces(hero.equipment);
  const bagFull = hero.bag.length >= BAG_CAPACITY;

  return (
    <RoomFrame
      title={room.title}
      icon="chest"
      subtitle="Elige con cuidado: solo puedes quedarte un objeto y una reliquia."
      footer={
        <>
          <button type="button" className="btn btn-parchment" onClick={onOpenSheet}><Icon name="bag" size={16} /> Gestionar equipo</button>
          {!room.itemTaken ? (
            <button type="button" className="btn btn-parchment" onClick={() => dispatch({ type: 'REWARD_SKIP_ITEM' })}>
              Ningún objeto (+2 <Icon name="gem" size={14} />)
            </button>
          ) : null}
          <button type="button" className="btn btn-gold" onClick={() => dispatch({ type: 'LEAVE_ROOM' })}>
            Continuar {!room.itemTaken || !room.relicTaken ? '(dejar el resto)' : ''}
          </button>
        </>
      }
    >
      <div className="reward-currencies">
        {room.kamas ? <span><Icon name="coin" color="#f5c242" /> +{room.kamas} kamas</span> : null}
        {room.xp ? <span><Icon name="xp" color="#9be07a" /> +{room.xp} XP</span> : null}
        {room.fragments ? <span><Icon name="gem" color="#7fd3ff" /> +{room.fragments} fragmentos</span> : null}
        {room.essence ? <span><Icon name="moon" color="#c9b6ff" /> +{room.essence} esencia</span> : null}
        {room.levelsGained ? <span className="pos-light">¡Subes de nivel! Elegirás un don al continuar.</span> : null}
      </div>
      {room.challenge ? (
        <div className={`challenge-result ${room.challenge.status}`}>
          Desafío «{room.challenge.name}»: {room.challenge.status === 'completed' ? 'completado (+kamas, +XP, +esencia)' : 'no completado'}
        </div>
      ) : null}

      {room.items.length ? (
        <>
          <h3 className="section-title">{room.itemTaken ? 'Objeto obtenido' : 'Elige un objeto'}</h3>
          <div className="reward-items">
            {room.items.map((item) => {
              const def = getItemDef(item.baseId);
              const slot = defaultSlotFor(hero, item);
              const equipped = slot ? hero.equipment[slot] : null;
              const slots = slotsForType(def.type);
              const taken = room.itemTaken;
              return (
                <ItemCard
                  key={item.uid}
                  item={item}
                  compare={equipped ?? undefined}
                  setCount={def.set ? counts[def.set] ?? 0 : null}
                  actions={
                    taken ? (
                      <span className="pos">✓ Obtenido</span>
                    ) : (
                      <>
                        {slots.map((s) => {
                          const ok = canEquip(hero, item, s).ok;
                          const occupied = !!hero.equipment[s];
                          return (
                            <button
                              key={s}
                              type="button"
                              className="btn btn-sm"
                              disabled={!ok || (occupied && bagFull)}
                              title={occupied && bagFull ? 'La bolsa está llena para guardar la pieza actual.' : ''}
                              onClick={() => dispatch({ type: 'REWARD_TAKE_ITEM', uid: item.uid, mode: 'equip', slot: s })}
                            >
                              Equipar{slots.length > 1 ? ` (${EQUIP_SLOTS.find((x) => x.id === s).name} ${s.slice(-1)})` : ''}
                            </button>
                          );
                        })}
                        <button type="button" className="btn btn-sm btn-parchment" disabled={bagFull} onClick={() => dispatch({ type: 'REWARD_TAKE_ITEM', uid: item.uid, mode: 'bag' })}>
                          A la bolsa
                        </button>
                        <button type="button" className="btn btn-sm btn-parchment" onClick={() => dispatch({ type: 'REWARD_TAKE_ITEM', uid: item.uid, mode: 'salvage' })}>
                          <Icon name="gem" size={14} /> +{salvageValue(item)}
                        </button>
                      </>
                    )
                  }
                />
              );
            })}
          </div>
        </>
      ) : null}

      {room.relics.length ? (
        <>
          <h3 className="section-title">{room.relicTaken ? 'Reliquia obtenida' : 'Elige una reliquia'}</h3>
          <div className="relic-choices">
            {room.relics.map((id) => (
              <div key={id} className={`relic-card panel ${RELICS[id].tier}`}>
                <Icon name={RELICS[id].icon} size={30} color="#b8860b" />
                <div className="grow">
                  <b>{RELICS[id].name}</b> <span className="tiny muted">({RELICS[id].tier})</span>
                  <div className="small">{RELICS[id].desc}</div>
                </div>
                {room.relicTaken ? (
                  <span className="pos">✓</span>
                ) : (
                  <button type="button" className="btn btn-gold btn-sm" onClick={() => dispatch({ type: 'REWARD_TAKE_RELIC', relicId: id })}>Elegir</button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </RoomFrame>
  );
}

// ── Elecciones (nivel, runas, variantes, hechizos, reliquias) ───────────

const KIND_LABEL = { talent: 'Talento', spell: 'Hechizo nuevo', rune: 'Runa', variant: 'Variante', boon: 'Don', relic: 'Reliquia' };
const KIND_ICON = { talent: 'star', spell: 'book', rune: 'spark', variant: 'swap', boon: 'up', relic: 'gem' };

function optionPreview(run, profile, o) {
  const caster = previewCaster(profile);
  if (o.kind === 'spell') return <SpellCard spell={resolveSpell(o.id)} caster={caster} />;
  if (o.kind === 'rune' || o.kind === 'variant') {
    const entry = run.hero.spells.find((s) => s.id === o.spellId);
    const before = resolveSpell(entry.id, { variant: entry.variant, runes: entry.runes });
    const after = o.kind === 'rune'
      ? resolveSpell(entry.id, { variant: entry.variant, runes: [...entry.runes, o.runeId] })
      : resolveSpell(entry.id, { variant: o.variantId, runes: entry.runes });
    return (
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div><div className="tiny dim">Ahora</div><SpellCard spell={before} caster={caster} compact /></div>
        <div><div className="tiny dim">Después</div><SpellCard spell={after} caster={caster} compact /></div>
      </div>
    );
  }
  return null;
}

export function ChoiceView() {
  const { run } = useGameState();
  const dispatch = useDispatch();
  const profile = useHeroProfile(run);
  const room = run.room;
  return (
    <RoomFrame
      title={room.title}
      subtitle={room.subtitle}
      icon={room.kind === 'levelUp' ? 'xp' : 'spark'}
      footer={room.allowSkip ? <button type="button" className="btn btn-parchment" onClick={() => dispatch({ type: 'SKIP_CHOICE' })}>Omitir</button> : null}
    >
      {room.options.length === 0 ? <p className="dim">No hay opciones disponibles.</p> : null}
      <div className="choice-grid">
        {room.options.map((o, i) => {
          const preview = optionPreview(run, profile, o);
          const card = (
            <button type="button" className={`choice-card panel kind-${o.kind}`} onClick={() => dispatch({ type: 'CHOOSE_OPTION', index: i })}>
              <div className="choice-kind"><Icon name={KIND_ICON[o.kind]} size={16} /> {KIND_LABEL[o.kind]}</div>
              <h3>{o.name}</h3>
              <p className="small">{o.desc}</p>
              {o.kind === 'rune' ? <div className="tiny muted">{SPELL_RUNES[o.runeId].desc}</div> : null}
              {preview ? <div className="tiny muted">Pasa el ratón para ver el detalle.</div> : null}
            </button>
          );
          return preview ? <Tip key={i} content={preview} as="div" wide>{card}</Tip> : <div key={i}>{card}</div>;
        })}
      </div>
    </RoomFrame>
  );
}

// ── Evento ──────────────────────────────────────────────────────────────

export function EventView() {
  const { run } = useGameState();
  const dispatch = useDispatch();
  const room = run.room;
  const event = EVENTS[room.eventId];
  return (
    <RoomFrame
      title={event.name}
      icon="event"
      footer={room.resolved ? <button type="button" className="btn btn-gold" onClick={() => dispatch({ type: 'LEAVE_ROOM' })}>Continuar</button> : null}
    >
      <p className="event-text">{event.text}</p>
      {!room.resolved ? (
        <div className="event-options">
          {event.options.map((o, i) => {
            const av = optionAvailability(run, o);
            return (
              <button type="button" key={i} className="event-option panel" disabled={!av.ok} onClick={() => dispatch({ type: 'EVENT_CHOOSE', index: i })}>
                <b>{o.label}</b>
                {o.desc ? <span className="small">{o.desc}</span> : null}
                {!av.ok ? <span className="tiny neg">{av.reason}</span> : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="event-result panel">
          <b>{event.options[room.chosen].label}</b>
          {room.texts.map((t, i) => <div key={i}>{t}</div>)}
        </div>
      )}
    </RoomFrame>
  );
}

// ── Descanso ────────────────────────────────────────────────────────────

export function RestView() {
  const { run } = useGameState();
  const dispatch = useDispatch();
  const room = run.room;
  const options = restOptions(run);
  return (
    <RoomFrame
      title="Hoguera del Soñador"
      icon="rest"
      subtitle={`Vida: ${run.hero.hp}/${run.hero.maxHpCache}. Solo puedes hacer una cosa aquí.`}
      footer={<button type="button" className="btn btn-gold" onClick={() => dispatch({ type: 'LEAVE_ROOM' })}>{room.used ? 'Continuar' : 'Seguir sin descansar'}</button>}
    >
      {room.used ? <div className="event-result panel">{room.text}</div> : (
        <div className="choice-grid">
          {options.map((o) => (
            <button type="button" key={o.id} className="choice-card panel" disabled={!o.ok} onClick={() => dispatch({ type: 'REST_CHOOSE', option: o.id })}>
              <h3>{o.name}</h3>
              <p className="small">{o.desc}</p>
              {!o.ok ? <span className="tiny neg">No disponible</span> : null}
            </button>
          ))}
        </div>
      )}
    </RoomFrame>
  );
}

// ── Cofre ───────────────────────────────────────────────────────────────

export function ChestView() {
  const dispatch = useDispatch();
  return (
    <RoomFrame title="Un cofre del sueño" icon="chest" subtitle="Brilla tenuemente entre la niebla.">
      <div className="chest-scene">
        <button type="button" className="chest-btn" onClick={() => dispatch({ type: 'CHEST_OPEN' })} aria-label="Abrir el cofre">
          <svg viewBox="0 0 120 90" width="180" aria-hidden="true">
            <rect x="12" y="38" width="96" height="46" rx="6" fill="#8b5a2b" stroke="#3e2712" strokeWidth="4" />
            <path d="M12 40 Q12 10 60 10 Q108 10 108 40 Z" fill="#a0692f" stroke="#3e2712" strokeWidth="4" />
            <rect x="12" y="36" width="96" height="8" fill="#f5c242" stroke="#3e2712" strokeWidth="3" />
            <rect x="52" y="40" width="16" height="20" rx="3" fill="#f5c242" stroke="#3e2712" strokeWidth="3" />
          </svg>
          <span className="btn btn-gold">Abrir</span>
        </button>
      </div>
    </RoomFrame>
  );
}

// ── Transiciones ────────────────────────────────────────────────────────

export function ActCompleteView() {
  const { run } = useGameState();
  const dispatch = useDispatch();
  return (
    <RoomFrame title="¡Estrato superado!" icon="boss">
      <p className="event-text">Has vencido al guardián de {run.room.actName}. El sueño se abre bajo tus pies y te arrastra más hondo: <b>{run.room.nextName}</b>.</p>
      <p className="dim">Al descender recuperas el 40% de tu vida. Los enemigos serán más fuertes.</p>
      <button type="button" className="btn btn-gold btn-lg" onClick={() => dispatch({ type: 'LEAVE_ROOM' })}>Descender</button>
    </RoomFrame>
  );
}

export function VictoryView() {
  const dispatch = useDispatch();
  return (
    <RoomFrame title="¡Has despertado del sueño!" icon="star">
      <p className="event-text">La Tejedora de Pesadillas cae y el Abismo Onírico tiembla. Puedes despertar ahora y cobrar tu victoria… o seguir descendiendo hacia el Descenso Infinito, donde cada estrato es más duro que el anterior.</p>
      <div className="row">
        <button type="button" className="btn btn-gold btn-lg" onClick={() => dispatch({ type: 'VICTORY_CHOICE', endless: false })}>Despertar (victoria)</button>
        <button type="button" className="btn btn-danger btn-lg" onClick={() => dispatch({ type: 'VICTORY_CHOICE', endless: true })}>Seguir descendiendo</button>
      </div>
      <p className="tiny dim">En el Descenso Infinito la victoria ya está asegurada: la esencia de victoria se conserva aunque caigas.</p>
    </RoomFrame>
  );
}

export function RunEndView() {
  const { run } = useGameState();
  const dispatch = useDispatch();
  const ended = run.ended;
  const cls = CLASSES[run.classId];
  const victory = ended.victory || run.reachedVictory;
  const essence = ended.essence ?? computeEssence(run);
  return (
    <div className="run-end">
      <div className={`run-end-card panel ${victory ? 'victory' : 'defeat'}`}>
        <Portrait sprite={{ shape: cls.sprite, color: cls.color }} size={96} />
        <h1>{victory ? '¡Expedición completada!' : 'Fin de la expedición'}</h1>
        <p>{ended.reason}</p>
        <div className="stat-grid">
          <div><b>{ended.floor ?? 0}</b><span>Piso alcanzado</span></div>
          <div><b>{run.hero.level}</b><span>Nivel</span></div>
          <div><b>{run.stats.kills}</b><span>Enemigos</span></div>
          <div><b>{run.stats.elitesKilled}</b><span>Élites</span></div>
          <div><b>{run.stats.bossesKilled}</b><span>Jefes</span></div>
          <div><b>{run.stats.challengesCompleted}</b><span>Desafíos</span></div>
          <div><b>{run.stats.damageDealt}</b><span>Daño total</span></div>
          <div><b>{DIFFICULTIES[run.difficulty]?.name}</b><span>Dificultad</span></div>
        </div>
        <div className="essence-gain"><Icon name="moon" color="#7a5cc4" size={22} /> +{essence} esencia onírica</div>
        {ended.unlockedDifficulty ? <div className="pos">¡Nuevo nivel desbloqueado: {DIFFICULTIES[ended.unlockedDifficulty].name}!</div> : null}
        <div className="build-summary">
          <div className="tiny muted">Tu build en esta expedición:</div>
          <div className="row wrap" style={{ gap: 6, justifyContent: 'center' }}>
            {Object.values(run.hero.equipment).filter(Boolean).map((it) => (
              <Tip key={it.uid} content={<ItemCard item={it} />}><ItemIcon item={it} size={40} /></Tip>
            ))}
            {run.hero.relics.map((id) => (
              <Tip key={id} content={<div><b>{RELICS[id].name}</b><div className="small">{RELICS[id].desc}</div></div>}>
                <span className="relic-badge big"><Icon name={RELICS[id].icon} size={22} /></span>
              </Tip>
            ))}
          </div>
          <div className="tiny muted">Semilla: {run.seed}</div>
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn-gold btn-lg" onClick={() => { dispatch({ type: 'CLOSE_RUN' }); dispatch({ type: 'NAVIGATE', screen: 'classSelect' }); }}>
            Nueva expedición
          </button>
          <button type="button" className="btn btn-parchment btn-lg" onClick={() => dispatch({ type: 'CLOSE_RUN' })}>Volver al título</button>
        </div>
      </div>
    </div>
  );
}
