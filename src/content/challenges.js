// Desafíos de combate (inspirados en los desafíos de Dofus). Son opcionales: si
// se cumplen, dan kamas, XP y esencia extra. La lógica vive en core/combat/challenges.js.
export const CHALLENGES = {
  versatil: { id: 'versatil', name: 'Versátil', desc: 'No lances el mismo hechizo dos veces en un mismo turno.' },
  estatua: { id: 'estatua', name: 'Estatua', desc: 'Termina cada turno en la casilla en la que lo empezaste.' },
  zombi: { id: 'zombi', name: 'Zombi', desc: 'Usa como máximo 1 PM por turno.' },
  celeridad: { id: 'celeridad', name: 'Celeridad', desc: 'Gana el combate antes de que empiece el turno {n}.' },
  intocable: { id: 'intocable', name: 'Intocable', desc: 'No bajes nunca del 50% de tu vida.' },
  elegido: { id: 'elegido', name: 'Elegido', desc: 'Derrota primero a {target}.' },
  purista: { id: 'purista', name: 'Purista', desc: 'Inflige daño con hechizos de un único elemento.' },
  anacoreta: { id: 'anacoreta', name: 'Anacoreta', desc: 'No termines ningún turno junto a un enemigo.' },
};

export const CHALLENGE_REWARD = { kamas: 15, xp: 6, essence: 1 };
