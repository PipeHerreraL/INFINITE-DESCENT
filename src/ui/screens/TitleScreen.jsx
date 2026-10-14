import { useState } from 'react';
import { useGameState, useDispatch } from '../hooks/useGame.jsx';
import { CLASSES } from '../../content/classes/index.js';
import Icon from '../components/Icon.jsx';
import { Modal } from '../components/Common.jsx';
import { Portrait } from '../board/UnitSprite.jsx';

export default function TitleScreen() {
  const { meta, run } = useGameState();
  const dispatch = useDispatch();
  const [confirmReset, setConfirmReset] = useState(false);
  const [help, setHelp] = useState(false);
  const hasRun = run && !run.ended;
  return (
    <div className="title-screen">
      <div className="title-logo">
        <div className="title-diamond" aria-hidden="true">
          <Portrait sprite={{ shape: 'warrior', color: '#d64545' }} size={84} />
          <Portrait sprite={{ shape: 'healer', color: '#e86fb0' }} size={84} />
          <Portrait sprite={{ shape: 'bomber', color: '#f4a259' }} size={84} />
        </div>
        <h1>Infinite Descent</h1>
        <div className="title-sub">Crónicas del Abismo Onírico</div>
        <p className="title-tag">Un roguelike táctico por casillas. Desciende, equípate, descubre sinergias… y vuelve a intentarlo.</p>
      </div>
      <div className="title-menu">
        {hasRun ? (
          <button type="button" className="btn btn-gold btn-lg" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'run' })}>
            <Icon name="map" /> Continuar expedición
            <span className="tiny">({CLASSES[run.classId].name}, piso {run.actIndex * 8 + (run.nodeId ? run.map.nodes[run.nodeId].row + 1 : 1)})</span>
          </button>
        ) : (
          <button type="button" className="btn btn-gold btn-lg" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'classSelect' })}>
            <Icon name="jump" /> Nueva expedición
          </button>
        )}
        <button type="button" className="btn btn-lg" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'sanctuary' })}>
          <Icon name="moon" /> Santuario <span className="tiny">({meta.essence} esencia)</span>
        </button>
        <button type="button" className="btn btn-parchment btn-lg" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'codex' })}>
          <Icon name="book" /> Códice y registros
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setHelp(true)}>
          <Icon name="info" /> Cómo se juega
        </button>
      </div>
      <div className="title-foot">
        <span>Expediciones: {meta.stats.runs} · Victorias: {meta.stats.victories} · Mejor piso: {meta.stats.bestFloor}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(true)}>Borrar progreso</button>
      </div>
      {confirmReset ? (
        <Modal title="¿Borrar todo el progreso?" onClose={() => setConfirmReset(false)}>
          <p>Se perderán la esencia, los desbloqueos, el códice y la expedición en curso. No se puede deshacer.</p>
          <div className="row">
            <button type="button" className="btn btn-danger" onClick={() => { dispatch({ type: 'RESET_META' }); setConfirmReset(false); }}>Borrar</button>
            <button type="button" className="btn btn-parchment" onClick={() => setConfirmReset(false)}>Cancelar</button>
          </div>
        </Modal>
      ) : null}
      {help ? <HelpModal onClose={() => setHelp(false)} /> : null}
    </div>
  );
}

export function HelpModal({ onClose }) {
  return (
    <Modal title="Cómo se juega" onClose={onClose} wide>
      <div className="help-grid">
        <section>
          <h3>La expedición</h3>
          <p>Elige un camino en el mapa del estrato. Cada nodo es un combate, un élite, un desafío, un mercader, una forja, un cofre, un evento o un descanso. Al final de cada estrato espera un jefe. La vida <b>no</b> se recupera del todo entre combates (solo un 20%).</p>
          <p>Si caes, la expedición termina, pero ganas <b>esencia onírica</b> para desbloquear contenido en el Santuario.</p>
        </section>
        <section>
          <h3>El combate</h3>
          <ul>
            <li><b>PA</b> (azul) para lanzar hechizos y <b>PM</b> (verde) para moverte.</li>
            <li>Haz clic en una casilla verde para moverte. Pulsa un hechizo (o 1-9) y luego una casilla azul para lanzarlo.</li>
            <li>Los obstáculos y las unidades bloquean la <b>línea de visión</b>.</li>
            <li>Entrar junto a un enemigo detiene tu movimiento; salir puede costarte PM (<b>placaje</b> contra <b>huida</b>).</li>
            <li>Empujar a alguien contra un obstáculo o una unidad inflige <b>daño de empuje</b>.</li>
            <li>Las zonas rojas marcan ataques anunciados por los jefes: ¡sal de ellas!</li>
            <li><span className="kbd">Espacio</span> termina el turno · <span className="kbd">Esc</span> cancela el hechizo.</li>
          </ul>
        </section>
        <section>
          <h3>El equipo</h3>
          <p>Once espacios: sombrero, capa, amuleto, 2 anillos, cinturón, botas, arma, escudo y 2 trofeos. El arma es un ataque más de tu barra. Las piezas <b>épicas</b> traen encantamientos y las <b>legendarias</b> cambian reglas. Los <b>sets</b> dan bonificaciones con 2, 3 y 4 piezas distintas.</p>
          <p>La bolsa tiene 6 huecos: desmantela lo que no uses para obtener fragmentos de forja.</p>
        </section>
        <section>
          <h3>Sinergias</h3>
          <p>Reliquias, talentos, sets y encantamientos reaccionan a eventos: críticos, muertes, curas, choques, bombas… Combínalos. Al subir de nivel eliges un don: talento, hechizo nuevo, runa o variante de hechizo.</p>
          <p>Cada combate propone un <b>desafío</b> opcional (Versátil, Estatua, Zombi…) con recompensa extra.</p>
        </section>
      </div>
    </Modal>
  );
}
