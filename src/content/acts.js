// Estratos (actos) de la expedición. Cada uno define su bioma, sus tablas de
// encuentros, su jefe y el presupuesto de dificultad por fila.

export const NODE_TYPES = {
  combat: { id: 'combat', name: 'Combate', desc: 'Un grupo de monstruos. Recompensa estándar.', color: '#c8553d' },
  elite: { id: 'elite', name: 'Élite', desc: 'Un enemigo de élite con un modificador. Botín raro y una reliquia.', color: '#9d4edd' },
  challenge: { id: 'challenge', name: 'Desafío', desc: 'Combate opcional más duro con un modificador. Recompensa superior y desafío doble.', color: '#e0a100' },
  boss: { id: 'boss', name: 'Jefe', desc: 'El guardián del estrato.', color: '#d00000' },
  shop: { id: 'shop', name: 'Mercader', desc: 'Compra y vende equipo, reliquias y servicios.', color: '#2a9d8f' },
  forge: { id: 'forge', name: 'Forja', desc: 'Mejora, transmuta y desmantela equipo.', color: '#e76f51' },
  chest: { id: 'chest', name: 'Cofre', desc: 'Un tesoro sin vigilancia… casi siempre.', color: '#f4a261' },
  event: { id: 'event', name: 'Evento', desc: 'Algo extraño ocurre en el sueño.', color: '#4361ee' },
  rest: { id: 'rest', name: 'Descanso', desc: 'Recupera fuerzas o medita para mejorar un hechizo.', color: '#52b788' },
};

export const ACTS = [
  {
    id: 'praderas', name: 'Praderas del Ensueño', subtitle: 'Estrato I', style: 'meadow', rows: 8, lanes: 4,
    enemies: [
      { id: 'plumin', minRow: 0, weight: 10 },
      { id: 'larvazul', minRow: 0, weight: 9 },
      { id: 'bloblin', minRow: 1, weight: 8 },
      { id: 'setaBruja', minRow: 1, weight: 7 },
      { id: 'jabalinete', minRow: 2, weight: 7 },
    ],
    elites: ['pluminAlfa', 'jabaliAcorazado', 'setaAnciana'],
    boss: 'bramador',
    budget: { base: 3.0, perRow: 0.5 },
    maxEnemies: 4,
    nodeWeights: { combat: 44, event: 16, elite: 9, shop: 7, forge: 7, chest: 6, rest: 4, challenge: 7 },
  },
  {
    id: 'cavernas', name: 'Cavernas del Eco', subtitle: 'Estrato II', style: 'cave', rows: 8, lanes: 4,
    enemies: [
      { id: 'murcielagoEco', minRow: 0, weight: 9 },
      { id: 'koboldChispero', minRow: 0, weight: 8 },
      { id: 'aranaTejedora', minRow: 0, weight: 8 },
      { id: 'sombraOnirica', minRow: 1, weight: 7 },
      { id: 'golemMusgo', minRow: 1, weight: 6 },
      { id: 'jabalinete', minRow: 0, weight: 3 },
      { id: 'setaBruja', minRow: 0, weight: 3 },
    ],
    elites: ['golemAncestral', 'brujoKobold', 'jabaliAcorazado'],
    boss: 'tejedora',
    budget: { base: 4.2, perRow: 0.55 },
    maxEnemies: 5,
    nodeWeights: { combat: 42, event: 16, elite: 11, shop: 7, forge: 7, chest: 6, rest: 4, challenge: 7 },
  },
];

/**
 * Configuración de un estrato. Más allá del último estrato definido empieza el
 * Descenso Infinito: se reutiliza el último bioma con escalado adicional.
 */
export function getActConfig(index) {
  if (index < ACTS.length) return { ...ACTS[index], index, endless: false };
  const last = ACTS[ACTS.length - 1];
  const depth = index - ACTS.length + 1;
  const bossCycle = ['bramador', 'tejedora'];
  return {
    ...last,
    id: `abismo${depth}`,
    index,
    name: `Abismo Onírico ${depth}`,
    subtitle: `Descenso infinito · ${depth}`,
    style: depth % 2 ? 'web' : 'cave',
    boss: bossCycle[depth % bossCycle.length],
    enemies: [...ACTS[0].enemies, ...last.enemies].map((e) => ({ ...e, minRow: 0 })),
    elites: [...ACTS[0].elites, ...last.elites],
    budget: { base: last.budget.base + depth * 0.8, perRow: last.budget.perRow },
    endless: true,
    extraScaling: depth,
  };
}

export const ROWS_PER_ACT = 8;
export const FINAL_ACT_INDEX = ACTS.length - 1;
