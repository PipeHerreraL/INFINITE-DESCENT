import { useEffect, useState } from 'react';
import { useGameState, useDispatch, useHeroProfile } from '../hooks/useGame.jsx';
import { CLASSES } from '../../content/classes/index.js';
import { RELICS } from '../../content/relics.js';
import { currentAct, floorNumber, xpToNext } from '../../core/run/run.js';
import { Bar, Tip, Modal, Currency } from '../components/Common.jsx';
import Icon from '../components/Icon.jsx';
import { Portrait } from '../board/UnitSprite.jsx';
import CharacterSheet from './CharacterSheet.jsx';
import MapView from './MapView.jsx';
import CombatView from './CombatView.jsx';
import { RewardView, ChoiceView, EventView, RestView, ChestView, ActCompleteView, VictoryView, RunEndView } from './RoomViews.jsx';
import ShopView from './ShopView.jsx';
import ForgeView from './ForgeView.jsx';
import { HelpModal } from './TitleScreen.jsx';
import { useCompactUI } from '../hooks/useMedia.js';

export default function RunScreen() {
  const { run, meta } = useGameState();
  const profile = useHeroProfile(run);
  const [sheet, setSheet] = useState(false);
  const [menu, setMenu] = useState(false);
  const compact = useCompactUI();

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.key !== 'c' && e.key !== 'C') return;
      // Solo se alterna la hoja si no hay otro diálogo abierto encima.
      const modal = document.querySelector('[aria-modal="true"]');
      if (modal && !modal.classList.contains('sheet-modal')) return;
      setSheet((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!run) return null;
  let content;
  if (run.ended) content = <RunEndView />;
  else if (run.combat) content = <CombatView onOpenSheet={() => setSheet(true)} onOpenMenu={() => setMenu(true)} />;
  else if (run.room) {
    switch (run.room.type) {
      case 'reward':
        content = <RewardView onOpenSheet={() => setSheet(true)} />;
        break;
      case 'choice':
        content = <ChoiceView />;
        break;
      case 'shop':
        content = <ShopView onOpenSheet={() => setSheet(true)} />;
        break;
      case 'forge':
        content = <ForgeView />;
        break;
      case 'event':
        content = <EventView />;
        break;
      case 'rest':
        content = <RestView />;
        break;
      case 'chest':
        content = <ChestView />;
        break;
      case 'actComplete':
        content = <ActCompleteView />;
        break;
      case 'victory':
        content = <VictoryView />;
        break;
      default:
        content = <MapView />;
    }
  } else content = <MapView />;

  return (
    <div className="run-screen">
      {/* En pantallas pequeñas el combate usa su propia barra superior. */}
      {!run.ended && !(compact && run.combat) ? <RunHud run={run} profile={profile} onSheet={() => setSheet(true)} onMenu={() => setMenu(true)} /> : null}
      <main className="run-main">{content}</main>
      {sheet && !run.ended ? <CharacterSheet onClose={() => setSheet(false)} /> : null}
      {menu ? <RunMenu meta={meta} onClose={() => setMenu(false)} /> : null}
    </div>
  );
}

function RunHud({ run, profile, onSheet, onMenu }) {
  const cls = CLASSES[run.classId];
  const act = currentAct(run);
  const hp = run.combat ? run.combat.units[run.combat.heroId].hp : run.hero.hp;
  return (
    <header className="hud">
      <div className="hud-hero">
        <Portrait sprite={{ shape: cls.sprite, color: cls.color }} size={44} />
        <div className="hud-hero-info">
          <div className="hud-name">{cls.name} <span className="hud-level">Nv. {run.hero.level}</span></div>
          <div className="hud-bars">
            <Bar value={hp} max={profile.maxHp} height={14} />
            <Tip content={`XP ${run.hero.xp}/${xpToNext(run.hero.level)}`}>
              <div className="xp-bar"><div style={{ width: `${(run.hero.xp / xpToNext(run.hero.level)) * 100}%` }} /></div>
            </Tip>
          </div>
        </div>
      </div>
      <div className="hud-currencies">
        <Currency icon="coin" value={run.kamas} label="Kamas: moneda de la expedición (se pierde al terminar)." color="#f5c242" />
        <Currency icon="gem" value={run.fragments} label="Fragmentos de forja: se obtienen al desmantelar objetos." color="#7fd3ff" />
      </div>
      <div className="hud-relics">
        {run.hero.relics.map((id) => (
          <Tip key={id} content={<div><b>{RELICS[id].name}</b><div className="small">{RELICS[id].desc}</div></div>}>
            <span className={`relic-badge ${RELICS[id].tier}`}><Icon name={RELICS[id].icon} size={18} /></span>
          </Tip>
        ))}
      </div>
      <div className="hud-floor">
        <div className="hud-act">{act.name}</div>
        <div className="tiny dim">{act.subtitle} · Piso {floorNumber(run)}</div>
      </div>
      <div className="hud-actions">
        <button type="button" className="btn btn-parchment btn-sm" onClick={onSheet} aria-label="Equipo">
          <Icon name="bag" size={16} /> <span className="hud-btn-label">Equipo</span> <span className="kbd">C</span>
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onMenu} aria-label="Menú">
          <Icon name="gear" size={16} />
        </button>
      </div>
    </header>
  );
}

function RunMenu({ meta, onClose }) {
  const dispatch = useDispatch();
  const [confirm, setConfirm] = useState(false);
  const [help, setHelp] = useState(false);
  return (
    <Modal title="Menú" onClose={onClose}>
      <div className="col">
        <div>
          <div className="panel-title">Velocidad de la IA</div>
          <div className="row wrap">
            {[['slow', 'Lenta'], ['normal', 'Normal'], ['fast', 'Rápida']].map(([v, l]) => (
              <button type="button" key={v} className={`btn btn-sm ${meta.settings.aiSpeed === v ? 'btn-gold' : 'btn-parchment'}`} onClick={() => dispatch({ type: 'SET_SETTING', key: 'aiSpeed', value: v })}>{l}</button>
            ))}
          </div>
        </div>
        <button type="button" className="btn btn-parchment" onClick={() => setHelp(true)}><Icon name="info" /> Cómo se juega</button>
        <button type="button" className="btn btn-parchment" onClick={() => { dispatch({ type: 'NAVIGATE', screen: 'title' }); onClose(); }}>
          Volver al título (se guarda la partida)
        </button>
        {confirm ? (
          <div className="row wrap">
            <span className="small">¿Seguro? Se cuenta como derrota.</span>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => { dispatch({ type: 'ABANDON_RUN' }); onClose(); }}>Abandonar</button>
            <button type="button" className="btn btn-parchment btn-sm" onClick={() => setConfirm(false)}>No</button>
          </div>
        ) : (
          <button type="button" className="btn btn-danger" onClick={() => setConfirm(true)}>Abandonar expedición</button>
        )}
      </div>
      {help ? <HelpModal onClose={() => setHelp(false)} /> : null}
    </Modal>
  );
}
