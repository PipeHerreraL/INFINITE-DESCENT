import { weighted, pick } from '../rng.js';
import { MONSTERS } from '../../content/enemies/index.js';

/**
 * Genera el grupo de enemigos de una sala a partir del presupuesto del estrato.
 * type: combat | elite | challenge | boss
 */
export function generateEncounter(rng, act, row, type) {
  if (type === 'boss') return { kind: 'boss', enemies: [act.boss], style: act.boss === 'tejedora' ? 'web' : 'arena' };

  const enemies = [];
  let budget;
  if (type === 'elite') {
    enemies.push(pick(rng, act.elites));
    budget = 1 + row * 0.25;
  } else {
    budget = act.budget.base + row * act.budget.perRow;
    if (type === 'challenge') budget *= 1.35;
  }
  const maxEnemies = act.maxEnemies + (type === 'challenge' ? 1 : 0);
  let guard = 0;
  while (budget > 0.9 && enemies.length < maxEnemies && guard++ < 30) {
    const candidates = act.enemies.filter((e) => (e.minRow ?? 0) <= row && MONSTERS[e.id].cost <= budget + 0.4);
    if (!candidates.length) break;
    const chosen = weighted(rng, candidates, (e) => e.weight ?? 1);
    enemies.push(chosen.id);
    budget -= MONSTERS[chosen.id].cost;
  }
  if (!enemies.length) enemies.push(act.enemies[0].id);
  return { kind: type === 'elite' ? 'elite' : type === 'challenge' ? 'challenge' : 'normal', enemies, style: act.style };
}
