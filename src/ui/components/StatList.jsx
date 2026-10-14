import { STAT_GROUPS, STATS } from '../../content/stats.js';
import { statLine } from '../text/describe.js';
import { Tip } from './Common.jsx';

/** Desglose por fuente de una estadística (para el tooltip). */
function breakdown(sources, key) {
  return sources
    .filter((s) => s.stats && s.stats[key])
    .map((s) => ({ name: s.name, value: s.stats[key] }));
}

export function StatList({ profile, compact = false }) {
  const stats = profile.stats;
  return (
    <div className={`stat-list ${compact ? 'compact' : ''}`}>
      <div className="stat-row big">
        <span>Vida máxima</span>
        <b>{profile.maxHp}</b>
      </div>
      {STAT_GROUPS.map((g) => {
        const rows = g.keys.filter((k) => stats[k] || ['ap', 'mp', 'range'].includes(k));
        if (!rows.length) return null;
        return (
          <div key={g.name} className="stat-group">
            <div className="stat-group-title">{g.name}</div>
            {rows.map((k) => {
              const parts = breakdown(profile.allSources ?? [], k);
              return (
                <Tip
                  key={k}
                  as="div"
                  className="stat-row"
                  content={parts.length ? (
                    <div className="small">
                      <b>{STATS[k]?.label}</b>
                      {parts.map((p, i) => (
                        <div key={i}>{p.name}: {p.value > 0 ? '+' : ''}{Math.round(p.value * 10) / 10}</div>
                      ))}
                    </div>
                  ) : null}
                >
                  <span>{STATS[k]?.label ?? k}</span>
                  <b>
                    {Math.round((stats[k] || 0) * 10) / 10}
                    {STATS[k]?.pct ? '%' : ''}
                  </b>
                </Tip>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export function StatChips({ stats }) {
  return (
    <div className="stat-chips">
      {Object.entries(stats ?? {}).map(([k, v]) => (
        <span key={k} className={`chip ${v < 0 ? 'neg' : ''}`}>{statLine(k, v)}</span>
      ))}
    </div>
  );
}
