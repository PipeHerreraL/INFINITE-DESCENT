import { useGameState, useDispatch } from '../hooks/useGame.jsx';
import { NODE_TYPES } from '../../content/acts.js';
import { COMBAT_MODIFIERS } from '../../content/modifiers.js';
import { availableNodes } from '../../core/run/mapgen.js';
import { currentAct } from '../../core/run/run.js';
import { Tip } from '../components/Common.jsx';
import Icon from '../components/Icon.jsx';

const W = 760;
const ROW_H = 78;

export default function MapView() {
  const { run } = useGameState();
  const dispatch = useDispatch();
  const map = run.map;
  const act = currentAct(run);
  const avail = new Set(availableNodes(map, run.nodeId));
  const nodes = Object.values(map.nodes);
  const H = map.rows * ROW_H + 40;
  const pos = (n) => ({
    x: 80 + (n.col / Math.max(1, map.lanes - 1)) * (W - 160),
    y: H - 40 - n.row * ROW_H,
  });
  const visited = new Set(run.visited);

  return (
    <div className="map-view">
      <div className="map-head">
        <h2>{act.name}</h2>
        <div className="dim small">{act.subtitle} · Elige tu camino. Pasa el ratón por un nodo para ver qué contiene.</div>
      </div>
      <div className="map-wrap scroll">
        <svg className="map-svg" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: W }} role="img" aria-label="Mapa del estrato">
          {nodes.flatMap((n) =>
            n.next.map((nid) => {
              const a = pos(n);
              const b = pos(map.nodes[nid]);
              const travelled = visited.has(n.id) && visited.has(nid);
              const open = n.id === run.nodeId && avail.has(nid);
              return (
                <line
                  key={`${n.id}-${nid}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  className={`map-edge ${travelled ? 'travelled' : ''} ${open ? 'open' : ''}`}
                />
              );
            }),
          )}
          {nodes.map((n) => {
            const p = pos(n);
            const t = NODE_TYPES[n.type];
            const isAvail = avail.has(n.id) && !run.room && !run.combat;
            const isCurrent = n.id === run.nodeId;
            const isVisited = visited.has(n.id);
            const r = n.type === 'boss' ? 30 : 22;
            const mod = n.modifier ? COMBAT_MODIFIERS[n.modifier] : null;
            return (
              <Tip
                key={n.id}
                as="g"
                content={
                  <div>
                    <b>{t.name}</b> <span className="tiny">(fila {n.row + 1})</span>
                    <div className="small">{t.desc}</div>
                    {mod ? <div className="small warn-text"><b>{mod.name}:</b> {mod.desc}</div> : null}
                    {isAvail ? <div className="tiny pos">Haz clic para viajar.</div> : null}
                  </div>
                }
              >
                <g
                  className={`map-node ${isAvail ? 'avail' : ''} ${isCurrent ? 'current' : ''} ${isVisited ? 'visited' : ''}`}
                  transform={`translate(${p.x} ${p.y})`}
                  onClick={isAvail ? () => dispatch({ type: 'ENTER_NODE', nodeId: n.id }) : undefined}
                  role={isAvail ? 'button' : undefined}
                  tabIndex={isAvail ? 0 : undefined}
                  aria-label={`${t.name}${isAvail ? ' (disponible)' : ''}`}
                  onKeyDown={isAvail ? (e) => (e.key === 'Enter' ? dispatch({ type: 'ENTER_NODE', nodeId: n.id }) : null) : undefined}
                >
                  {isAvail ? <circle r={r + 7} className="map-node-pulse" /> : null}
                  <circle r={r} fill={t.color} className="map-node-circle" />
                  <g transform={`translate(${-r * 0.55} ${-r * 0.55})`}>
                    <Icon name={n.type} size={r * 1.1} color="#fff" />
                  </g>
                  {mod ? <circle cx={r * 0.75} cy={-r * 0.75} r="7" fill="#ffd166" stroke="#5a3a1e" strokeWidth="2" /> : null}
                  {isCurrent ? <circle r={r + 4} className="map-node-current" /> : null}
                </g>
              </Tip>
            );
          })}
        </svg>
      </div>
      <div className="map-legend">
        {Object.values(NODE_TYPES).map((t) => (
          <span key={t.id} className="legend-item"><span className="legend-dot" style={{ background: t.color }}><Icon name={t.id} size={12} color="#fff" /></span>{t.name}</span>
        ))}
        <span className="legend-item"><span className="legend-dot" style={{ background: '#ffd166' }} />Modificador</span>
      </div>
    </div>
  );
}
