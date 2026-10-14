import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameState, useDispatch } from '../hooks/useGame.jsx';
import { STEP_MS } from '../../core/game/store.js';
import { STATUSES } from '../../content/statuses.js';
import { STATS } from '../../content/stats.js';
import { ELEMENTS } from '../../content/elements.js';
import { COMBAT_MODIFIERS } from '../../content/modifiers.js';
import { MONSTERS } from '../../content/enemies/index.js';
import { key } from '../../core/grid/geometry.js';
import { pathFromReach } from '../../core/grid/pathfinding.js';
import { movementMap } from '../../core/combat/movement.js';
import { rangeCells, previewSpell, effectiveRange } from '../../core/combat/spellcast.js';
import { telegraphCells } from '../../core/combat/telegraph.js';
import { unitAt, getStats, totalShield } from '../../core/combat/state.js';
import { bombsOf } from '../../core/combat/bombs.js';
import { describeTrigger } from '../text/describe.js';
import Board from '../board/Board.jsx';
import { Portrait } from '../board/UnitSprite.jsx';
import { Bar, Tip } from '../components/Common.jsx';
import { SpellCard, SpellIcon } from '../components/SpellCard.jsx';
import Icon from '../components/Icon.jsx';

function quickCheck(combat, hero, spell) {
  if (combat.phase !== 'active' || combat.activeId !== hero.id) return 'No es tu turno';
  if (hero.ap < spell.apCost) return `Faltan PA (${spell.apCost})`;
  if ((hero.cooldowns[spell.id] || 0) > 0) return `Enfriamiento ${hero.cooldowns[spell.id]}`;
  if (spell.castsPerTurn > 0 && (hero.casts[spell.id] || 0) >= spell.castsPerTurn) return 'Agotado este turno';
  return null;
}

export default function CombatView({ onOpenSheet }) {
  const { run, meta } = useGameState();
  const dispatch = useDispatch();
  const combat = run.combat;
  const stepMs = STEP_MS[meta.settings.aiSpeed] ?? 110;
  const [notice, setNotice] = useState(null);
  const flash = (text) => {
    setNotice({ text, at: Date.now() });
  };
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 1800);
    return () => clearTimeout(t);
  }, [notice]);
  const hero = combat.units[combat.heroId];
  const [spellId, setSpellId] = useState(null);
  const [hover, setHover] = useState(null);
  const [inspectId, setInspectId] = useState(null);
  const [showLog, setShowLog] = useState(true);
  const isHeroTurn = combat.phase === 'active' && combat.activeId === hero.id;
  const spell = spellId ? hero.spells.find((s) => s.id === spellId) : null;

  // Si deja de ser posible lanzar el hechizo seleccionado, se deselecciona.
  useEffect(() => {
    if (spell && quickCheck(combat, hero, spell)) setSpellId(null);
  }, [combat, hero, spell]);

  const cast = (sid, cell) => {
    dispatch({ type: 'COMBAT', action: { type: 'cast', spellId: sid, x: cell.x, y: cell.y } });
    setSpellId(null);
  };

  // ── Atajos de teclado
  const stateRef = useRef();
  stateRef.current = { isHeroTurn, hero, combat, spellId };
  useEffect(() => {
    const onKey = (e) => {
      const s = stateRef.current;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      // Con un diálogo abierto, los atajos de combate no actúan por detrás.
      if (document.querySelector('[aria-modal="true"]')) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.key === 'Escape') setSpellId(null);
      else if ((e.key === ' ' || e.key === 'Enter') && s.combat.phase === 'placement') {
        e.preventDefault();
        dispatch({ type: 'COMBAT', action: { type: 'ready' } });
      } else if (e.key === ' ' && s.isHeroTurn) {
        e.preventDefault();
        dispatch({ type: 'COMBAT', action: { type: 'endTurn' } });
        setSpellId(null);
      } else if (/^[1-9]$/.test(e.key) && s.isHeroTurn) {
        const sp = s.hero.spells[Number(e.key) - 1];
        if (!sp) return;
        const why = quickCheck(s.combat, s.hero, sp);
        if (why) flash(`${sp.name}: ${why}`);
        else setSpellId((cur) => (cur === sp.id ? null : sp.id));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  // ── Resaltados
  const telegraph = useMemo(() => {
    const set = new Set();
    for (const u of Object.values(combat.units)) {
      if (u.dead) continue;
      for (const t of u.telegraphs ?? []) for (const c of telegraphCells(combat, u, t)) set.add(key(c.x, c.y));
    }
    return set;
  }, [combat]);

  const moveInfo = useMemo(() => (isHeroTurn && !spell ? movementMap(combat, hero) : null), [combat, hero, isHeroTurn, spell]);
  const range = useMemo(() => (isHeroTurn && spell ? rangeCells(combat, hero, spell) : null), [combat, hero, isHeroTurn, spell]);
  const rangeMap = useMemo(() => (range ? new Map(range.map((c) => [key(c.x, c.y), c])) : null), [range]);

  const highlights = { classes: {}, telegraph, path: null };
  let previews = [];
  let hint = null;
  if (combat.phase === 'placement') {
    for (const c of combat.board.playerStarts) highlights.classes[key(c.x, c.y)] = 'start';
    for (const c of combat.board.enemyStarts) {
      const u = unitAt(combat, c.x, c.y);
      if (u) highlights.classes[key(c.x, c.y)] = 'start-enemy';
    }
  } else if (moveInfo) {
    for (const [k, c] of moveInfo.reach) if (c.dist > 0) highlights.classes[k] = 'reach';
    if (hover) {
      const p = pathFromReach(moveInfo.reach, hover);
      if (p && p.length) {
        highlights.path = p;
        hint = `Mover: ${p.length} PM${moveInfo.loss ? ` (+${moveInfo.loss} PM perdidos por placaje)` : ''}`;
      }
    }
    if (moveInfo.loss > 0 && !hint) hint = `¡Placado! Salir de aquí cuesta ${moveInfo.loss} PM.`;
  } else if (rangeMap) {
    for (const [k, c] of rangeMap) highlights.classes[k] = c.valid ? 'range' : 'range-off';
    if (hover) {
      const rc = rangeMap.get(key(hover.x, hover.y));
      if (rc?.valid) {
        const pv = previewSpell(combat, hero, spell, hover);
        for (const c of pv.cells) highlights.classes[key(c.x, c.y)] = 'area';
        previews = pv.results;
      } else if (rc) hint = rc.reason;
      else hint = 'Fuera de alcance.';
    }
  }

  const onCellClick = (c) => {
    if (combat.phase === 'placement') {
      if (combat.board.playerStarts.some((s) => s.x === c.x && s.y === c.y)) dispatch({ type: 'COMBAT', action: { type: 'place', x: c.x, y: c.y } });
      return;
    }
    const u = unitAt(combat, c.x, c.y);
    if (spell && isHeroTurn) {
      cast(spell.id, c);
      return;
    }
    if (u) {
      setInspectId(u.id === inspectId ? null : u.id);
      return;
    }
    if (isHeroTurn && moveInfo?.reach.has(key(c.x, c.y))) dispatch({ type: 'COMBAT', action: { type: 'move', x: c.x, y: c.y } });
  };

  const hoverUnit = hover ? unitAt(combat, hover.x, hover.y) : null;
  const shownUnit = hoverUnit ?? (inspectId ? combat.units[inspectId] : null) ?? (combat.activeId ? combat.units[combat.activeId] : hero);

  const banner = useBanner(combat);

  return (
    <div className="combat-view">
      <div className="combat-top">
        <Timeline combat={combat} onInspect={setInspectId} />
        <div className="combat-top-right">
          {combat.challenge ? <ChallengeBadge challenge={combat.challenge} /> : null}
          {combat.modifiers.map((m) => (
            <Tip key={m} content={COMBAT_MODIFIERS[m].desc} className="mod-badge"><Icon name="star" size={14} /> {COMBAT_MODIFIERS[m].name}</Tip>
          ))}
          <div className="round-badge">Ronda {Math.max(1, combat.round)}</div>
        </div>
      </div>

      <div className="combat-center">
        <div className="board-wrap">
          <Board
            combat={combat}
            highlights={highlights}
            hoverCell={hover}
            onHover={setHover}
            onCellClick={onCellClick}
            onCellContext={() => setSpellId(null)}
            previews={previews}
            inspectId={inspectId}
            stepMs={stepMs}
          />
          {banner ? <div className={`combat-banner ${banner.warn ? 'warn' : ''}`} key={banner.id}>{banner.text}</div> : null}
          {notice ? <div className="board-hint notice" key={notice.at}>{notice.text}</div> : hint ? <div className="board-hint">{hint}</div> : null}
          {combat.phase === 'placement' ? (
            <div className="placement-bar">
              <b>Fase de colocación:</b> elige una casilla azul. Revisa a los enemigos y el desafío, y pulsa «¡Listo!» (o Espacio).
            </div>
          ) : null}
          {combat.phase === 'victory' || combat.phase === 'defeat' ? <EndOverlay combat={combat} /> : null}
        </div>
        <aside className="combat-side">
          <UnitPanel unit={shownUnit} combat={combat} />
          <div className="log-panel panel-dark">
            <button type="button" className="log-head" onClick={() => setShowLog((v) => !v)}>
              Registro {showLog ? '▾' : '▸'}
            </button>
            {showLog ? <CombatLog log={combat.log} /> : null}
          </div>
        </aside>
      </div>

      <div className="combat-bottom">
        <div className="hero-status">
          <div className="hero-hp">
            <Icon name="heart" color="var(--hp)" />
            <Bar value={hero.hp} max={hero.maxHp} extra={totalShield(hero)} height={16} />
          </div>
          <div className="apmp">
            <Tip content="Puntos de Acción: se gastan al lanzar hechizos." className="orb ap"><b>{hero.ap}</b><span>PA</span></Tip>
            <Tip content="Puntos de Movimiento: cada casilla cuesta 1 PM." className="orb mp"><b>{hero.mp}</b><span>PM</span></Tip>
          </div>
        </div>
        <div className="spellbar">
          {hero.spells.map((s, i) => {
            const why = quickCheck(combat, hero, s);
            const cd = hero.cooldowns[s.id] || 0;
            return (
              <Tip key={s.id} content={<SpellCard spell={s} caster={hero} combat={combat} range={effectiveRange(hero, s)} cooldown={cd} blocked={combat.phase === 'active' && isHeroTurn ? why : null} />}>
                <button
                  type="button"
                  className={`spell-btn ${spellId === s.id ? 'selected' : ''} ${why ? 'off' : ''}`}
                  onClick={() => (why ? flash(`${s.name}: ${why}`) : setSpellId(spellId === s.id ? null : s.id))}
                  aria-label={`${s.name}${why ? ` (${why})` : ''}`}
                  aria-pressed={spellId === s.id}
                >
                  <SpellIcon spell={s} caster={hero} size={48} />
                  <span className="spell-cost">{s.apCost}</span>
                  <span className="spell-key">{i + 1}</span>
                  {cd > 0 ? <span className="spell-cd">{cd}</span> : null}
                  {s.id === 'bomba' ? <span className="spell-count">{bombsOf(combat, hero).length}/{getStats(hero).bombMax}</span> : null}
                </button>
              </Tip>
            );
          })}
        </div>
        <div className="turn-actions">
          <button type="button" className="btn btn-parchment btn-sm" onClick={onOpenSheet}><Icon name="bag" size={14} /> Equipo</button>
          {combat.phase === 'placement' ? (
            <button type="button" className="btn btn-gold end-turn" onClick={() => dispatch({ type: 'COMBAT', action: { type: 'ready' } })}>
              ¡Listo! <span className="kbd">Espacio</span>
            </button>
          ) : null}
          {combat.phase === 'active' ? (
            isHeroTurn ? (
              <button type="button" className="btn btn-gold end-turn" onClick={() => { dispatch({ type: 'COMBAT', action: { type: 'endTurn' } }); setSpellId(null); }}>
                Terminar turno <span className="kbd">Espacio</span>
              </button>
            ) : (
              <div className="waiting"><Icon name="hourglass" size={16} /> Turno de {combat.units[combat.activeId]?.name}…</div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

function useBanner(combat) {
  const [banner, setBanner] = useState(null);
  const seen = useRef(null);
  useEffect(() => {
    const fx = combat.fx;
    if (seen.current === null) {
      seen.current = fx.length ? fx[fx.length - 1].id : 0;
      return undefined;
    }
    const b = [...fx].reverse().find((f) => f.type === 'banner' && f.id > seen.current);
    if (fx.length) seen.current = fx[fx.length - 1].id;
    if (!b) return undefined;
    setBanner(b);
    const t = setTimeout(() => setBanner(null), 1800);
    return () => clearTimeout(t);
  }, [combat.fx]);
  return banner;
}

function Timeline({ combat, onInspect }) {
  const order = combat.phase === 'placement'
    ? Object.values(combat.units).filter((u) => u.kind !== 'bomb')
    : combat.turnOrder.map((id) => combat.units[id]).filter((u) => u && !u.dead);
  return (
    <div className="timeline">
      {order.map((u) => (
        <Tip key={u.id} content={`${u.name} — ${u.hp}/${u.maxHp} PV`}>
          <button type="button" className={`tl-unit ${u.side} ${combat.activeId === u.id ? 'active' : ''}`} onClick={() => onInspect(u.id)}>
            <Portrait sprite={u.sprite} size={38} />
            <div className="tl-hp"><div style={{ width: `${(u.hp / u.maxHp) * 100}%` }} /></div>
          </button>
        </Tip>
      ))}
    </div>
  );
}

function ChallengeBadge({ challenge }) {
  const label = { active: 'En curso', failed: 'Fallido', completed: 'Completado' }[challenge.status];
  return (
    <Tip content={<div><b>Desafío: {challenge.name}</b><div className="small">{challenge.desc}</div><div className="tiny">Recompensa: kamas, XP y esencia extra.</div></div>} className={`challenge-badge ${challenge.status}`}>
      <Icon name="challenge" size={16} /> {challenge.name} · {label}
    </Tip>
  );
}

function UnitPanel({ unit, combat }) {
  if (!unit) return null;
  const stats = getStats(unit);
  const isBomb = unit.kind === 'bomb';
  const def = MONSTERS[unit.defId];
  const resists = ['resEarth', 'resFire', 'resWater', 'resAir', 'resNeutral'].filter((k) => stats[k]);
  const isActive = combat.activeId === unit.id;
  return (
    <div className="unit-panel panel-dark">
      <div className="row" style={{ gap: 8 }}>
        <Portrait sprite={unit.sprite} size={52} charge={unit.charge} />
        <div className="grow">
          <div className={`unit-name ${unit.side}`}>{unit.name}</div>
          <div className="tiny dim">
            {isBomb ? `Bomba de ${ELEMENTS[unit.element]?.name} · Carga ${unit.charge}` : `${unit.side === 'player' ? 'Aliado' : 'Enemigo'}${def?.family ? ` · ${def.family}` : ''}`}
          </div>
        </div>
      </div>
      <Bar value={unit.hp} max={unit.maxHp} extra={totalShield(unit)} height={13} />
      {!isBomb ? (
        <div className="unit-res tiny">
          <span><b className="ap-text">{isActive ? unit.ap : stats.ap}</b> PA</span>
          <span><b className="mp-text">{isActive ? unit.mp : stats.mp}</b> PM</span>
          <span>Placaje {stats.lock || 0}</span>
          <span>Huida {stats.dodge || 0}</span>
          {resists.map((k) => (
            <span key={k} className={`el-${STATS[k].element}`}>{STATS[k].label.replace('Res. ', '')} {stats[k]}%</span>
          ))}
        </div>
      ) : null}
      {unit.statuses.length ? (
        <div className="unit-statuses">
          {unit.statuses.map((s) => {
            const d = STATUSES[s.statusId];
            return (
              <Tip key={s.statusId} content={<div><b>{d.name}</b>{d.stack === 'stack' ? ` ×${s.stacks}` : ''}<div className="small">{d.desc}</div><div className="tiny">{s.duration === -1 ? 'Todo el combate' : `${s.duration} turno(s)`}</div></div>}>
                <span className="status-chip" style={{ '--stc': d.color }}>{d.name}{d.stack === 'stack' ? ` ${s.stacks}` : ''}{s.value && !d.dot ? ` (${s.value})` : ''}</span>
              </Tip>
            );
          })}
        </div>
      ) : null}
      {unit.telegraphs?.length ? (
        <div className="tele-info">
          <Icon name="info" size={14} /> Prepara: {unit.telegraphs.map((t) => t.name).join(', ')} (zona roja).
        </div>
      ) : null}
      {unit.side === 'enemy' && unit.spells.length ? (
        <div className="unit-spells">
          {unit.spells.map((s) => (
            <Tip key={s.id} content={<SpellCard spell={s} caster={unit} combat={combat} cooldown={unit.cooldowns[s.id] || 0} />}>
              <span className="chip">{s.name}</span>
            </Tip>
          ))}
        </div>
      ) : null}
      {(unit.sources ?? []).filter((s) => s.kind === 'passive' || s.kind === 'modifier').map((s) => (
        <div key={s.id} className="tiny dim">✦ {s.name}: {s.triggers.map(describeTrigger).join(' ')}</div>
      ))}
      {def?.tier === 'boss' ? <div className="tiny boss-tip">{def.desc}</div> : null}
    </div>
  );
}

function CombatLog({ log }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [log]);
  return (
    <div className="log scroll" ref={ref}>
      {log.slice(-60).map((l) => (
        <div key={l.id} className={`log-line ${l.kind}`}>{l.text}</div>
      ))}
    </div>
  );
}

function EndOverlay({ combat }) {
  const dispatch = useDispatch();
  const victory = combat.phase === 'victory';
  const ch = combat.challenge;
  return (
    <div className="end-overlay">
      <div className={`end-card panel ${victory ? 'victory' : 'defeat'}`}>
        <h1>{victory ? '¡Victoria!' : 'Derrota'}</h1>
        <p>{victory ? 'Los enemigos se desvanecen en la niebla del sueño.' : 'Tu conciencia se disuelve en el abismo…'}</p>
        <div className="small">
          Daño infligido: <b>{combat.stats.damageDealt}</b> · Enemigos derrotados: <b>{combat.stats.kills}</b> · Rondas: <b>{combat.round}</b>
        </div>
        {ch ? (
          <div className={`small challenge-result ${ch.status}`}>
            Desafío «{ch.name}»: {ch.status === 'completed' ? '¡completado!' : ch.status === 'failed' ? 'fallido' : 'no completado'}
          </div>
        ) : null}
        <button type="button" className="btn btn-gold btn-lg" autoFocus onClick={() => dispatch({ type: 'COMBAT_FINISH' })}>
          {victory ? 'Recoger botín' : 'Ver resumen'}
        </button>
      </div>
    </div>
  );
}

