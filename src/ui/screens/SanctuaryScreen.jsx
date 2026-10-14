import { useGameState, useDispatch } from '../hooks/useGame.jsx';
import { UNLOCKS, ESSENCE_REWARDS } from '../../content/unlocks.js';
import { DIFFICULTIES } from '../../content/difficulty.js';
import Icon from '../components/Icon.jsx';

export default function SanctuaryScreen() {
  const { meta } = useGameState();
  const dispatch = useDispatch();
  const categories = [...new Set(UNLOCKS.map((u) => u.category))];
  return (
    <div className="sanctuary">
      <header className="screen-head">
        <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'title' })}>← Volver</button>
        <h1>Santuario del Sueño</h1>
        <div className="essence-badge"><Icon name="moon" color="#c9b6ff" size={22} /> {meta.essence} esencia</div>
      </header>
      <div className="sanctuary-body">
        <p className="dim center">
          La esencia onírica se conserva aunque caigas. Desbloquea nuevas opciones, nunca poder bruto.
          Ganas {ESSENCE_REWARDS.perFloor} por piso, {ESSENCE_REWARDS.perElite} por élite, {ESSENCE_REWARDS.perBoss} por jefe,
          extra por desafíos y {ESSENCE_REWARDS.victory} por victoria (+10% por nivel de Pesadilla).
        </p>
        {categories.map((cat) => (
          <section key={cat}>
            <h2 className="section-title">{cat}</h2>
            <div className="unlock-grid">
              {UNLOCKS.filter((u) => u.category === cat).map((u) => {
                const owned = !!meta.unlocks[u.id];
                const affordable = meta.essence >= u.cost;
                return (
                  <div key={u.id} className={`unlock-card panel ${owned ? 'owned' : ''}`}>
                    <h3>{u.name}</h3>
                    <p className="small">{u.desc}</p>
                    {owned ? (
                      <div className="pos small"><Icon name="star" size={14} /> Desbloqueado</div>
                    ) : (
                      <button type="button" className="btn btn-gold btn-sm" disabled={!affordable} onClick={() => dispatch({ type: 'BUY_UNLOCK', id: u.id })}>
                        <Icon name="moon" size={14} /> {u.cost}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        <section>
          <h2 className="section-title">Niveles de Pesadilla</h2>
          <div className="unlock-grid">
            {DIFFICULTIES.map((d) => (
              <div key={d.level} className={`unlock-card panel ${d.level <= meta.maxDifficulty ? 'owned' : 'locked'}`}>
                <h3>{d.name}</h3>
                <p className="small">{d.desc}</p>
                <div className="tiny muted">{d.level <= meta.maxDifficulty ? 'Disponible' : 'Gana en el nivel anterior para desbloquearlo'}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
