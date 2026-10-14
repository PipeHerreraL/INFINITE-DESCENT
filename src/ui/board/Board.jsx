import { useEffect, useMemo, useRef, useState } from 'react';
import { parseKey, key } from '../../core/grid/geometry.js';
import { ELEMENTS } from '../../content/elements.js';
import { STATUSES } from '../../content/statuses.js';
import { totalShield } from '../../core/combat/state.js';
import UnitSprite from './UnitSprite.jsx';

export const TW = 64;
export const TH = 32;

export function project(x, y) {
  return { px: ((x - y) * TW) / 2, py: ((x + y) * TH) / 2 };
}

const DIAMOND = `0,${-TH / 2} ${TW / 2},0 0,${TH / 2} ${-TW / 2},0`;

const PALETTES = {
  meadow: { a: '#a3d46e', b: '#96ca61', stroke: '#76a744', block: '#6d8f45', side: '#557035' },
  cave: { a: '#a8998a', b: '#9b8d7e', stroke: '#7a6d60', block: '#6b5f53', side: '#544a40' },
  arena: { a: '#dcc492', b: '#cfb685', stroke: '#a88f60', block: '#9c8459', side: '#7d6944' },
  web: { a: '#918eae', b: '#8582a3', stroke: '#65627f', block: '#5f5c7a', side: '#4a4761' },
};


function Decor({ kind, pal }) {
  const block = (
    <g>
      <polygon points={`${-TW / 2},0 0,${TH / 2} 0,${TH / 2 + 8} ${-TW / 2},8`} fill={pal.side} />
      <polygon points={`${TW / 2},0 0,${TH / 2} 0,${TH / 2 + 8} ${TW / 2},8`} fill={pal.block} />
      <polygon points={DIAMOND} fill={pal.block} stroke={pal.side} strokeWidth="1" transform="translate(0 0)" />
    </g>
  );
  switch (kind) {
    case 'tree':
      return (
        <g>
          {block}
          <rect x="-4" y="-26" width="8" height="26" rx="2" fill="#7a4e2a" stroke="#4a2d14" strokeWidth="1.5" />
          <circle cx="-10" cy="-32" r="13" fill="#4f9a3a" stroke="#2f5e22" strokeWidth="2" />
          <circle cx="10" cy="-34" r="13" fill="#5aae43" stroke="#2f5e22" strokeWidth="2" />
          <circle cx="0" cy="-46" r="14" fill="#68bf4d" stroke="#2f5e22" strokeWidth="2" />
          <circle cx="-4" cy="-50" r="4" fill="#9be07a" opacity="0.7" />
        </g>
      );
    case 'bush':
      return (
        <g>
          {block}
          <ellipse cx="0" cy="-8" rx="20" ry="13" fill="#4f9a3a" stroke="#2f5e22" strokeWidth="2" />
          <circle cx="-7" cy="-12" r="3" fill="#e63946" />
          <circle cx="6" cy="-6" r="3" fill="#e63946" />
        </g>
      );
    case 'rock':
      return (
        <g>
          {block}
          <path d="M-20 -2 L-14 -22 L2 -30 L18 -18 L20 -2 Z" fill="#9aa1a8" stroke="#555b61" strokeWidth="2" />
          <path d="M-14 -22 L0 -14 L18 -18 M0 -14 L2 -30" stroke="#6c737a" strokeWidth="1.5" fill="none" />
        </g>
      );
    case 'pillar':
      return (
        <g>
          {block}
          <rect x="-14" y="-62" width="28" height="62" fill="#c9b48a" stroke="#6b5530" strokeWidth="2" />
          <ellipse cx="0" cy="-62" rx="16" ry="7" fill="#e0cda4" stroke="#6b5530" strokeWidth="2" />
          <line x1="-6" y1="-56" x2="-6" y2="-4" stroke="#a8925f" strokeWidth="2" />
          <line x1="6" y1="-56" x2="6" y2="-4" stroke="#a8925f" strokeWidth="2" />
        </g>
      );
    case 'stalagmite':
      return (
        <g>
          {block}
          <path d="M-16 0 L-4 -54 L4 -40 L10 -60 L18 0 Z" fill="#8a7d70" stroke="#4d443b" strokeWidth="2" />
        </g>
      );
    case 'crystal':
      return (
        <g>
          {block}
          <path d="M-14 0 L-10 -30 L-4 0 Z" fill="#9b8cff" stroke="#4b3f9e" strokeWidth="1.5" />
          <path d="M-6 0 L2 -48 L10 0 Z" fill="#b8a9ff" stroke="#4b3f9e" strokeWidth="1.5" />
          <path d="M6 0 L14 -26 L18 0 Z" fill="#8fe3ff" stroke="#2f6b8a" strokeWidth="1.5" />
        </g>
      );
    case 'cocoon':
      return (
        <g>
          {block}
          <ellipse cx="0" cy="-30" rx="12" ry="26" fill="#f1eef8" stroke="#6a6688" strokeWidth="2" />
          <path d="M-12 -40 L12 -30 M-12 -24 L12 -14 M-10 -50 L10 -46" stroke="#a9a5c4" strokeWidth="1.5" />
        </g>
      );
    default:
      return block;
  }
}

/**
 * Posiciones mostradas de las unidades: animan el recorrido de los
 * movimientos paso a paso y suavizan empujes y desplazamientos. Cada unidad
 * tiene sus propios temporizadores: un cambio nuevo cancela la animación
 * pendiente, de modo que el dibujo nunca se desincroniza del estado.
 */
function useDisplayPositions(combat, stepMs) {
  const [, force] = useState(0);
  const posRef = useRef({});
  const modeRef = useRef({});
  const seenFx = useRef(0);
  const timers = useRef({});

  useEffect(() => {
    const units = combat.units;
    const newFx = combat.fx.filter((f) => f.id > seenFx.current);
    if (combat.fx.length) seenFx.current = Math.max(seenFx.current, combat.fx[combat.fx.length - 1].id);
    let changed = false;
    const clearUnit = (id) => {
      (timers.current[id] ?? []).forEach(clearTimeout);
      timers.current[id] = [];
    };
    for (const u of Object.values(units)) {
      const cur = posRef.current[u.id];
      if (!cur) {
        posRef.current[u.id] = { x: u.x, y: u.y };
        modeRef.current[u.id] = 'instant';
        changed = true;
        continue;
      }
      const fxForUnit = newFx.filter((f) => f.unitId === u.id && ['move', 'slide', 'teleport'].includes(f.type));
      if (cur.x === u.x && cur.y === u.y && !fxForUnit.length) continue;
      clearUnit(u.id);
      const move = fxForUnit.find((f) => f.type === 'move');
      if (move && fxForUnit.length === 1 && move.path.length > 1) {
        const steps = move.path.slice(1);
        steps.forEach((c, i) => {
          timers.current[u.id].push(setTimeout(() => {
            posRef.current[u.id] = { x: c.x, y: c.y };
            modeRef.current[u.id] = 'step';
            force((n) => n + 1);
          }, i * stepMs));
        });
        // Garantiza la posición final del estado al terminar la animación.
        timers.current[u.id].push(setTimeout(() => {
          posRef.current[u.id] = { x: u.x, y: u.y };
          force((n) => n + 1);
        }, steps.length * stepMs + 20));
      } else {
        const tp = fxForUnit.length && fxForUnit.every((f) => f.type === 'teleport');
        modeRef.current[u.id] = tp ? 'instant' : 'slide';
        posRef.current[u.id] = { x: u.x, y: u.y };
        changed = true;
      }
    }
    if (changed) force((n) => n + 1);
  }, [combat, stepMs]);

  useEffect(() => () => Object.values(timers.current).flat().forEach(clearTimeout), []);
  return { pos: posRef.current, mode: modeRef.current };
}

/** Efectos flotantes (números de daño, textos, explosiones). */
function useFloaters(combat) {
  const [items, setItems] = useState([]);
  const seen = useRef(null);
  useEffect(() => {
    const fx = combat.fx;
    if (seen.current === null) {
      // No se reproducen los efectos anteriores al montaje.
      seen.current = fx.length ? fx[fx.length - 1].id : 0;
      return;
    }
    const fresh = fx.filter((f) => f.id > seen.current);
    if (!fresh.length) return;
    seen.current = fresh[fresh.length - 1].id;
    const now = Date.now();
    const STACKED = new Set(['damage', 'heal', 'shield', 'text', 'proc', 'cast']);
    setItems((prev) => {
      const alive = prev.filter((p) => now - p.born < 1600);
      // Los textos de una misma unidad se apilan en filas para no solaparse.
      const rows = {};
      for (const p of alive) if (p.unitId && STACKED.has(p.type)) rows[p.unitId] = Math.max(rows[p.unitId] ?? 0, p.row + 1);
      const added = fresh
        .filter((f) => ['damage', 'heal', 'shield', 'text', 'proc', 'cast', 'explosion', 'impact', 'death', 'summon'].includes(f.type))
        .map((f, i) => {
          let row = 0;
          if (f.unitId && STACKED.has(f.type)) {
            row = (rows[f.unitId] ?? 0) % 4;
            rows[f.unitId] = (rows[f.unitId] ?? 0) + 1;
          }
          return { ...f, born: now, delay: i * 60, row };
        });
      return added.length ? [...alive, ...added] : prev;
    });
    const t = setTimeout(() => setItems((prev) => prev.filter((p) => Date.now() - p.born < 1600)), 1700);
    return () => clearTimeout(t);
  }, [combat.fx]);
  return items;
}

export default function Board({
  combat,
  highlights,
  hoverCell,
  onHover,
  onCellClick,
  onCellContext,
  previews = [],
  inspectId = null,
  stepMs = 110,
}) {
  const board = combat.board;
  const pal = PALETTES[board.style] ?? PALETTES.meadow;
  const { pos, mode } = useDisplayPositions(combat, stepMs);
  const floaters = useFloaters(combat);

  const cells = useMemo(() => Object.entries(board.cells).map(([k, t]) => ({ k, t, ...parseKey(k) })), [board]);
  const bounds = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const c of cells) {
      const { px, py } = project(c.x, c.y);
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
    return { x: minX - TW / 2 - 8, y: minY - TH / 2 - 80, w: maxX - minX + TW + 16, h: maxY - minY + TH + 100 };
  }, [cells]);

  const units = Object.values(combat.units).filter((u) => !u.dead);
  const deadRecently = new Set(combat.fx.filter((f) => f.type === 'death').map((f) => f.unitId));

  // Objetos con profundidad: obstáculos y unidades ordenados por (x + y).
  const objects = [];
  for (const c of cells) {
    if (c.t === 'obstacle') objects.push({ kind: 'obstacle', depth: c.x + c.y, sub: c.x, c });
  }
  for (const u of units) {
    const p = pos[u.id] ?? u;
    objects.push({ kind: 'unit', depth: p.x + p.y + 0.01, sub: p.x, u, p });
  }
  objects.sort((a, b) => a.depth - b.depth || a.sub - b.sub);

  // Un obstáculo que tapa a una unidad situada detrás se vuelve translúcido.
  const occluding = (c) => units.some((u) => {
    const p = pos[u.id] ?? u;
    const ahead = c.x + c.y - (p.x + p.y);
    return ahead >= 1 && ahead <= 3 && Math.abs(c.x - c.y - (p.x - p.y)) <= 1;
  });

  const hl = highlights ?? {};
  const previewByUnit = Object.fromEntries(previews.map((p) => [p.unitId, p]));

  return (
    <svg
      className="board-svg"
      style={{ '--step-ms': `${stepMs}ms` }}
      viewBox={`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`}
      onMouseLeave={() => onHover?.(null)}
      onContextMenu={(e) => {
        e.preventDefault();
        onCellContext?.();
      }}
      role="grid"
      aria-label="Tablero de combate"
    >
      <defs>
        <pattern id="tele-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="rgba(229,83,61,0.35)" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,60,40,0.85)" strokeWidth="3" />
        </pattern>
        <radialGradient id="hole-grad">
          <stop offset="0%" stopColor="#05030c" />
          <stop offset="100%" stopColor="#1d1533" />
        </radialGradient>
      </defs>

      {/* Suelo */}
      <g className="board-floor">
        {cells.map((c) => {
          const { px, py } = project(c.x, c.y);
          if (c.t === 'hole') {
            return (
              <g key={c.k} transform={`translate(${px} ${py})`}>
                <polygon points={DIAMOND} fill="url(#hole-grad)" stroke="#0b0716" strokeWidth="1.5" />
              </g>
            );
          }
          const fill = (c.x + c.y) % 4 < 2 ? pal.a : pal.b;
          const h = hl.classes?.[c.k];
          return (
            <g key={c.k} transform={`translate(${px} ${py})`}>
              <polygon points={DIAMOND} fill={c.t === 'obstacle' ? pal.block : fill} stroke={pal.stroke} strokeWidth="1" />
              {h ? <polygon points={DIAMOND} className={`cell-hl ${h}`} /> : null}
              {hl.telegraph?.has(c.k) ? <polygon points={DIAMOND} fill="url(#tele-hatch)" className="cell-tele" /> : null}
              {hoverCell && hoverCell.x === c.x && hoverCell.y === c.y ? <polygon points={DIAMOND} className="cell-hover" /> : null}
            </g>
          );
        })}
      </g>

      {/* Camino previsto */}
      {hl.path?.length ? (
        <g className="path-dots" pointerEvents="none">
          {hl.path.map((c, i) => {
            const { px, py } = project(c.x, c.y);
            return <circle key={i} cx={px} cy={py} r={i === hl.path.length - 1 ? 6 : 4} className="path-dot" />;
          })}
        </g>
      ) : null}

      {/* Obstáculos y unidades */}
      <g className="board-objects">
        {objects.map((o) => {
          if (o.kind === 'obstacle') {
            const { px, py } = project(o.c.x, o.c.y);
            return (
              <g key={`o${o.c.k}`} transform={`translate(${px} ${py})`} pointerEvents="none" className={occluding(o.c) ? 'obstacle see-through' : 'obstacle'}>
                <Decor kind={board.decor?.[o.c.k]} pal={pal} />
              </g>
            );
          }
          const u = o.u;
          const { px, py } = project(o.p.x, o.p.y);
          const active = combat.activeId === u.id;
          const shield = totalShield(u);
          const pv = previewByUnit[u.id];
          const isBomb = u.kind === 'bomb';
          return (
            <g
              key={u.id}
              className={`unit ${u.side} ${active ? 'active' : ''} ${inspectId === u.id ? 'inspected' : ''} ${hoverCell && hoverCell.x === u.x && hoverCell.y === u.y ? 'hovered' : ''} mode-${mode[u.id] ?? 'instant'}`}
              style={{ transform: `translate(${px}px, ${py}px)` }}
              pointerEvents="none"
            >
              <ellipse cx="0" cy="2" rx="20" ry="9" className="unit-ring" />
              <ellipse cx="0" cy="2" rx="16" ry="6" fill="rgba(0,0,0,0.25)" />
              <g className={deadRecently.has(u.id) ? 'unit-sprite dying' : 'unit-sprite'}>
                <UnitSprite sprite={isBomb ? { ...u.sprite, color: ELEMENTS[u.element]?.color ?? '#333' } : u.sprite} charge={u.charge} />
              </g>
              {!isBomb ? (
                <g transform={`translate(0 ${u.sprite?.boss ? -82 : u.sprite?.big ? -66 : u.sprite?.small ? -40 : -54})`}>
                  <rect x="-19" y="-3" width="38" height="6" rx="2" fill="#1b1028" stroke="#000" strokeWidth="0.8" />
                  <rect x="-18" y="-2" width={Math.max(0, (36 * u.hp) / u.maxHp)} height="4" rx="1.5" fill={u.side === 'player' ? '#5fd35a' : '#ef4b3c'} />
                  {shield > 0 ? <rect x="-18" y="-2" width={Math.min(36, (36 * shield) / u.maxHp)} height="1.6" fill="#9ad1ff" /> : null}
                  <g transform="translate(-18 -8)">
                    {u.statuses.slice(0, 6).map((s, i) => (
                      <circle key={s.statusId} cx={i * 7 + 3} cy="0" r="2.8" fill={STATUSES[s.statusId]?.color ?? '#fff'} stroke="#000" strokeWidth="0.6" />
                    ))}
                  </g>
                  {u.telegraphs?.length ? (
                    <text x="0" y="-14" textAnchor="middle" className="tele-mark">!</text>
                  ) : null}
                </g>
              ) : (
                <text x="0" y="-26" textAnchor="middle" className="bomb-charge">{u.charge}</text>
              )}
              {pv ? (
                <text x="0" y={u.sprite?.boss ? -96 : -70} textAnchor="middle" className={`preview-label ${pv.heal && !pv.dmgMax ? 'heal' : ''}`}>
                  {pv.dmgMax ? `−${pv.dmgMin}–${pv.dmgMax}` : `+${Math.round(pv.heal)}`}
                </text>
              ) : null}
            </g>
          );
        })}
      </g>

      {/* Capa de interacción: siempre por encima, para poder apuntar a cualquier casilla. */}
      <g className="board-hit">
        {cells.map((c) => {
          if (c.t !== 'floor') return null;
          const { px, py } = project(c.x, c.y);
          return (
            <polygon
              key={c.k}
              points={DIAMOND}
              transform={`translate(${px} ${py})`}
              className="cell-hit"
              onMouseEnter={() => onHover?.({ x: c.x, y: c.y })}
              onClick={() => onCellClick?.({ x: c.x, y: c.y })}
            />
          );
        })}
      </g>

      {/* Efectos */}
      <g className="board-fx" pointerEvents="none">
        {floaters.map((f) => {
          const u = f.unitId ? combat.units[f.unitId] : null;
          const at = u ? pos[u.id] ?? u : { x: f.x, y: f.y };
          if (at?.x === undefined) return null;
          const { px, py } = project(at.x, at.y);
          const style = { animationDelay: `${f.delay}ms` };
          const lift = (f.row ?? 0) * 15;
          switch (f.type) {
            case 'damage':
              return (
                <text key={f.id} x={px} y={py - 58 - lift} textAnchor="middle" className={`float dmg ${f.crit ? 'crit' : ''}`} style={{ ...style, fill: f.value === 0 ? '#ccc' : '#ff5a47', stroke: '#2a0a05' }}>
                  {f.value === 0 ? '0' : `−${f.value}`}
                </text>
              );
            case 'heal':
              return <text key={f.id} x={px} y={py - 58 - lift} textAnchor="middle" className="float heal" style={style}>+{f.value}</text>;
            case 'shield':
              return <text key={f.id} x={px} y={py - 46 - lift} textAnchor="middle" className="float shield" style={style}>⛨ {f.value}</text>;
            case 'text':
              return <text key={f.id} x={px} y={py - 40 - lift} textAnchor="middle" className="float txt" style={{ ...style, fill: f.color ?? '#fff' }}>{f.text}</text>;
            case 'proc':
              return <text key={f.id} x={px} y={py - 74 - lift} textAnchor="middle" className="float proc" style={style}>✦ {f.text}</text>;
            case 'cast':
              return <text key={f.id} x={px} y={py - 86 - lift} textAnchor="middle" className={`float cast ${f.crit ? 'crit' : ''}`} style={style}>{f.text}{f.crit ? ' ¡crítico!' : ''}</text>;
            case 'impact':
              return <circle key={f.id} cx={px} cy={py} r="10" className="fx-impact" />;
            case 'summon':
              return <circle key={f.id} cx={px} cy={py - 14} r="16" className="fx-summon" />;
            case 'death':
              return <circle key={f.id} cx={px} cy={py - 18} r="18" className="fx-death" />;
            case 'explosion':
              return (
                <g key={f.id} className="fx-explosion" style={{ '--ec': ELEMENTS[f.element]?.color ?? '#ff9f1c' }}>
                  {(f.cells ?? []).map((c) => {
                    const q = project(c.x, c.y);
                    return <polygon key={key(c.x, c.y)} points={DIAMOND} transform={`translate(${q.px} ${q.py})`} />;
                  })}
                </g>
              );
            default:
              return null;
          }
        })}
      </g>
    </svg>
  );
}
