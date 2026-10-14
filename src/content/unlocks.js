// Desbloqueos permanentes del Santuario. Amplían opciones; no inflan el poder.
export const UNLOCKS = [
  { id: 'start_kamas', category: 'Inicio', name: 'Bolsa de Viaje', desc: 'Empiezas cada expedición con +40 kamas.', cost: 15 },
  { id: 'set_minero', category: 'Botín', name: 'Set del Minero Pólvora', desc: 'Añade al botín las 4 piezas del set del Minero (empujes y colisiones).', cost: 20 },
  { id: 'origin_furiak_duelista', category: 'Orígenes', name: 'Furiak: Duelista', desc: 'Nuevo origen: dagas críticas y Cadena de Acero.', cost: 25 },
  { id: 'origin_ensalmador_penitente', category: 'Orígenes', name: 'Ensalmador: Penitente', desc: 'Nuevo origen: Palabra Atronadora y Corazón de Larva.', cost: 25 },
  { id: 'origin_petardista_artificiero', category: 'Orígenes', name: 'Petardista: Artificiero', desc: 'Nuevo origen: Gran Traca y bombas con carga inicial.', cost: 25 },
  { id: 'merchant_eye', category: 'Expedición', name: 'Ojo del Mercader', desc: 'Los mercaderes ofrecen 1 objeto más.', cost: 25 },
  { id: 'rest_plus', category: 'Expedición', name: 'Saco de Dormir', desc: 'Descansar cura un 10% adicional.', cost: 15 },
  { id: 'relics_pack1', category: 'Botín', name: 'Reliquias del Eco', desc: 'Añade Semilla Reactiva, Ojo de la Tormenta y Huevo Dormido.', cost: 35 },
  { id: 'start_relic', category: 'Inicio', name: 'Reliquia de Partida', desc: 'Al empezar eliges 1 de 2 reliquias comunes.', cost: 40 },
  { id: 'forge_mastery', category: 'Expedición', name: 'Maestría de Forja', desc: 'La primera mejora en cada forja es gratuita.', cost: 30 },
  { id: 'legendaries_pack', category: 'Botín', name: 'Leyendas Olvidadas', desc: 'Añade la Corona Prismática y el Báculo del Alba al botín.', cost: 45 },
];

export const ESSENCE_REWARDS = {
  perFloor: 2,
  perElite: 4,
  perBoss: 12,
  perChallenge: 1,
  victory: 15,
};
