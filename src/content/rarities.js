// Rarezas: no solo multiplican estadísticas. Las épicas añaden un encantamiento
// (disparador) y las legendarias son objetos únicos que alteran reglas.
export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export const RARITIES = {
  common: { id: 'common', name: 'Común', color: '#cfc6b0', weight: 58, affixes: 0, quality: 1.0, value: 24, salvage: 1 },
  uncommon: { id: 'uncommon', name: 'Poco común', color: '#7ad35f', weight: 27, affixes: 1, quality: 1.08, value: 38, salvage: 2 },
  rare: { id: 'rare', name: 'Raro', color: '#4aa3ff', weight: 11, affixes: 2, quality: 1.16, value: 60, salvage: 3 },
  epic: { id: 'epic', name: 'Épico', color: '#b56cff', weight: 3.4, affixes: 2, enchant: true, quality: 1.25, value: 95, salvage: 5 },
  legendary: { id: 'legendary', name: 'Legendario', color: '#ff9f1c', weight: 0.6, affixes: 1, quality: 1.3, value: 150, salvage: 8 },
};

export function rarityIndex(id) {
  return RARITY_ORDER.indexOf(id);
}
