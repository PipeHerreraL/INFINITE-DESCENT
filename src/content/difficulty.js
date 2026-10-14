// Niveles de Pesadilla (dificultad acumulativa). Se desbloquea el siguiente al
// ganar una expedición en el nivel actual.
export const DIFFICULTIES = [
  { level: 0, name: 'Ensueño', desc: 'La expedición estándar.' },
  { level: 1, name: 'Pesadilla I', desc: 'Los enemigos tienen +12% de vida.', enemyHpPct: 12 },
  { level: 2, name: 'Pesadilla II', desc: 'Los enemigos infligen +10% de daño.', enemyDmgPct: 10 },
  { level: 3, name: 'Pesadilla III', desc: 'La recuperación tras el combate se reduce a la mitad.', regenMult: 0.5 },
  { level: 4, name: 'Pesadilla IV', desc: 'Los jefes y élites tienen +20% de vida.', eliteHpPct: 20 },
  { level: 5, name: 'Pesadilla V', desc: 'Los mercaderes suben sus precios un 25%.', priceMult: 1.25 },
];

/** Combina los efectos de todos los niveles hasta `level`. */
export function difficultyRules(level) {
  const rules = { enemyHpPct: 0, enemyDmgPct: 0, regenMult: 1, eliteHpPct: 0, priceMult: 1 };
  for (const d of DIFFICULTIES) {
    if (d.level > level) break;
    rules.enemyHpPct += d.enemyHpPct ?? 0;
    rules.enemyDmgPct += d.enemyDmgPct ?? 0;
    rules.eliteHpPct += d.eliteHpPct ?? 0;
    if (d.regenMult) rules.regenMult *= d.regenMult;
    if (d.priceMult) rules.priceMult *= d.priceMult;
  }
  return rules;
}
