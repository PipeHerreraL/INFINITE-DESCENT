// Dones de estadísticas que pueden aparecer al subir de nivel.
export const STAT_BOONS = [
  { id: 'fortaleza', name: 'Fortaleza', desc: '+25 Vitalidad.', stats: { vitality: 25 } },
  { id: 'impetu', name: 'Ímpetu', desc: '+15 Potencia.', stats: { power: 15 } },
  { id: 'precision', name: 'Precisión', desc: '+5% Crítico y +3 Daños críticos.', stats: { crit: 5, critDamage: 3 } },
  { id: 'templanza', name: 'Templanza', desc: '+5% a todas las resistencias.', stats: { resEarth: 5, resFire: 5, resWater: 5, resAir: 5, resNeutral: 5 } },
  { id: 'afinidad', name: 'Afinidad', desc: '+20 a la característica de tu elemento dominante.', dominant: 20 },
  { id: 'escurridizo', name: 'Escurridizo', desc: '+15 Huida y +20 Iniciativa.', stats: { dodge: 15, initiative: 20 } },
  { id: 'manosSanadoras', name: 'Manos Sanadoras', desc: '+6 Curas.', stats: { heals: 6 } },
  { id: 'contundencia', name: 'Contundencia', desc: '+12 Daños de empuje y +10 Placaje.', stats: { pushDamage: 12, lock: 10 } },
];

export const LEVEL_XP = (level) => 20 + 16 * (level - 1);
export const MAX_SPELLS = 8;
