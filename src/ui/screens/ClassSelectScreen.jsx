import { useState, useMemo } from 'react';
import { useGameState, useDispatch } from '../hooks/useGame.jsx';
import { CLASSES, CLASS_ORDER } from '../../content/classes/index.js';
import { ITEMS } from '../../content/items/index.js';
import { DIFFICULTIES } from '../../content/difficulty.js';
import { resolveSpell } from '../../core/spells.js';
import { createRun } from '../../core/run/run.js';
import { buildHeroProfile } from '../../core/hero/profile.js';
import { Portrait } from '../board/UnitSprite.jsx';
import { SpellIcon, SpellCard, previewCaster } from '../components/SpellCard.jsx';
import { Tip } from '../components/Common.jsx';
import Icon from '../components/Icon.jsx';

export default function ClassSelectScreen() {
  const { meta } = useGameState();
  const dispatch = useDispatch();
  const [classId, setClassId] = useState('furiak');
  const [originId, setOriginId] = useState(null);
  const [difficulty, setDifficulty] = useState(meta.maxDifficulty > 0 ? meta.maxDifficulty : 0);
  const [seed, setSeed] = useState('');
  const cls = CLASSES[classId];
  const origin = cls.origins.find((o) => o.id === originId) ?? cls.origins[0];

  // Vista previa del personaje inicial real (mismas reglas que la expedición).
  const preview = useMemo(() => {
    const run = createRun({ classId, originId: origin.id, seed: 'preview', unlocks: meta.unlocks });
    return { run, profile: buildHeroProfile(run) };
  }, [classId, origin.id, meta.unlocks]);
  const caster = previewCaster(preview.profile);

  const start = () => dispatch({ type: 'START_RUN', classId, originId: origin.id, difficulty, seed: seed.trim() || null });

  return (
    <div className="classselect">
      <header className="screen-head">
        <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'title' })}>← Volver</button>
        <h1>Elige tu clase</h1>
        <div />
      </header>
      <div className="class-cards">
        {CLASS_ORDER.map((id) => {
          const c = CLASSES[id];
          const st = meta.stats.byClass[id];
          return (
            <button
              type="button"
              key={id}
              className={`class-card panel ${id === classId ? 'selected' : ''}`}
              style={{ '--cc': c.color }}
              onClick={() => { setClassId(id); setOriginId(null); }}
            >
              <div className="class-portrait"><Portrait sprite={{ shape: c.sprite, color: c.color }} size={110} /></div>
              <h2>{c.name}</h2>
              <div className="class-title">{c.title}</div>
              <div className="tiny muted">Arquetipo: {c.archetype}</div>
              <div className="class-tags">{c.playstyle.map((p) => <span key={p} className="chip">{p}</span>)}</div>
              <div className="tiny muted">Expediciones: {st?.runs ?? 0} · Victorias: {st?.victories ?? 0}</div>
            </button>
          );
        })}
      </div>
      <div className="class-detail panel">
        <div className="class-detail-main">
          <h2>{cls.name} <span className="muted small">— {cls.title}</span></h2>
          <p>{cls.desc}</p>
          <div className="class-stats">
            <span><Icon name="heart" color="var(--hp)" /> {preview.profile.maxHp} PV</span>
            <span><Icon name="star" color="var(--ap)" /> {preview.profile.stats.ap} PA</span>
            <span><Icon name="boot" color="var(--mp)" /> {preview.profile.stats.mp} PM</span>
            <span>Arma: {ITEMS[origin.startingWeapon ?? cls.startingWeapon].name}</span>
          </div>
          <div className="passive-box">
            <b>Pasiva — {cls.passive.name}:</b> {cls.passive.desc}
          </div>
          <div className="small"><b>Hechizos iniciales</b> (pasa el ratón para ver detalles):</div>
          <div className="row wrap">
            {preview.run.hero.spells.map((s) => {
              const spell = resolveSpell(s.id);
              return (
                <Tip key={s.id} content={<SpellCard spell={spell} caster={caster} />}>
                  <SpellIcon spell={spell} caster={caster} size={46} />
                </Tip>
              );
            })}
            {preview.profile.weapon ? (
              <Tip content={<SpellCard spell={preview.profile.weapon} caster={caster} />}>
                <SpellIcon spell={preview.profile.weapon} caster={caster} size={46} />
              </Tip>
            ) : null}
          </div>
          <div className="small muted">
            Aprendibles en la expedición: {cls.learnableSpells.map((id) => resolveSpell(id).name).join(', ')}.
          </div>
        </div>
        <div className="class-detail-side">
          <div className="panel-title">Origen</div>
          {cls.origins.map((o) => {
            const locked = o.unlock && !meta.unlocks[o.unlock];
            return (
              <button
                type="button"
                key={o.id}
                disabled={locked}
                className={`origin-btn ${o.id === origin.id ? 'selected' : ''}`}
                onClick={() => setOriginId(o.id)}
              >
                <b>{o.name}</b> {locked ? <span className="tiny">(bloqueado en el Santuario)</span> : null}
                <div className="tiny">{o.desc}</div>
              </button>
            );
          })}
          <div className="panel-title" style={{ marginTop: 12 }}>Dificultad</div>
          <select className="select" value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
            {DIFFICULTIES.filter((d) => d.level <= meta.maxDifficulty).map((d) => (
              <option key={d.level} value={d.level}>{d.name}</option>
            ))}
          </select>
          <div className="tiny muted">{DIFFICULTIES[difficulty]?.desc} {meta.maxDifficulty < DIFFICULTIES.length - 1 ? 'Gana una expedición para desbloquear la siguiente Pesadilla.' : ''}</div>
          <div className="panel-title" style={{ marginTop: 12 }}>Semilla (opcional)</div>
          <input className="input" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="Aleatoria" maxLength={24} />
          <div className="tiny muted">La misma semilla genera la misma expedición.</div>
          <button type="button" className="btn btn-gold btn-lg start-btn" onClick={start}>
            Descender <Icon name="down" />
          </button>
        </div>
      </div>
    </div>
  );
}
