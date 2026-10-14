// Elementos inspirados en Dofus: cada uno escala con una característica.
export const ELEMENTS = {
  earth: { id: 'earth', name: 'Tierra', stat: 'strength', res: 'resEarth', dmg: 'earthDamage', color: '#b5793a' },
  fire: { id: 'fire', name: 'Fuego', stat: 'intelligence', res: 'resFire', dmg: 'fireDamage', color: '#ef5b3a' },
  water: { id: 'water', name: 'Agua', stat: 'chance', res: 'resWater', dmg: 'waterDamage', color: '#3d9be9' },
  air: { id: 'air', name: 'Aire', stat: 'agility', res: 'resAir', dmg: 'airDamage', color: '#4fbf62' },
  neutral: { id: 'neutral', name: 'Neutral', stat: 'strength', res: 'resNeutral', dmg: 'neutralDamage', color: '#9aa0a6' },
};

export const ELEMENTAL_IDS = ['earth', 'fire', 'water', 'air'];

export const ELEMENT_BY_STAT = {
  strength: 'earth',
  intelligence: 'fire',
  chance: 'water',
  agility: 'air',
};
