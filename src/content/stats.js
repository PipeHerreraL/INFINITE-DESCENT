// Definición de estadísticas. `pct` indica que se muestra como porcentaje.
// `affix` describe cómo aparece como línea aleatoria en objetos (rango a nivel 1).
export const STATS = {
  hp: { label: 'Vida base' },
  vitality: { label: 'Vitalidad', short: 'Vit', affix: { range: [8, 16], weight: 10 } },
  maxHpPct: { label: 'Vida máxima', pct: true },
  ap: { label: 'PA', short: 'PA' },
  mp: { label: 'PM', short: 'PM' },
  range: { label: 'Alcance', short: 'Alc', affix: { range: [1, 1], weight: 1, minRarity: 'epic', fixed: true } },

  strength: { label: 'Fuerza', short: 'Fue', element: 'earth', affix: { range: [6, 12], weight: 9 } },
  intelligence: { label: 'Inteligencia', short: 'Int', element: 'fire', affix: { range: [6, 12], weight: 9 } },
  chance: { label: 'Suerte', short: 'Sue', element: 'water', affix: { range: [6, 12], weight: 9 } },
  agility: { label: 'Agilidad', short: 'Agi', element: 'air', affix: { range: [6, 12], weight: 9 } },
  power: { label: 'Potencia', short: 'Pot', affix: { range: [5, 9], weight: 6 } },

  damage: { label: 'Daños', affix: { range: [1, 2], weight: 4 } },
  earthDamage: { label: 'Daños de Tierra', element: 'earth', affix: { range: [1, 3], weight: 3 } },
  fireDamage: { label: 'Daños de Fuego', element: 'fire', affix: { range: [1, 3], weight: 3 } },
  waterDamage: { label: 'Daños de Agua', element: 'water', affix: { range: [1, 3], weight: 3 } },
  airDamage: { label: 'Daños de Aire', element: 'air', affix: { range: [1, 3], weight: 3 } },
  neutralDamage: { label: 'Daños Neutrales', element: 'neutral' },
  heals: { label: 'Curas', affix: { range: [2, 4], weight: 4 } },
  healPct: { label: 'Curas', pct: true },

  crit: { label: 'Crítico', pct: true, affix: { range: [2, 4], weight: 5 } },
  critDamage: { label: 'Daños críticos', affix: { range: [2, 4], weight: 3 } },

  dmgPct: { label: 'Daño final', pct: true },
  meleePct: { label: 'Daño cuerpo a cuerpo', pct: true, affix: { range: [3, 5], weight: 2, minRarity: 'rare' } },
  rangedPct: { label: 'Daño a distancia', pct: true, affix: { range: [3, 5], weight: 2, minRarity: 'rare' } },
  weaponPct: { label: 'Daño de arma', pct: true, affix: { range: [4, 7], weight: 2, minRarity: 'uncommon' } },
  spellPct: { label: 'Daño de hechizos', pct: true, affix: { range: [3, 5], weight: 2, minRarity: 'rare' } },
  damageTakenPct: { label: 'Daño recibido', pct: true, inverted: true },

  resEarth: { label: 'Res. Tierra', pct: true, element: 'earth', affix: { range: [3, 6], weight: 3 } },
  resFire: { label: 'Res. Fuego', pct: true, element: 'fire', affix: { range: [3, 6], weight: 3 } },
  resWater: { label: 'Res. Agua', pct: true, element: 'water', affix: { range: [3, 6], weight: 3 } },
  resAir: { label: 'Res. Aire', pct: true, element: 'air', affix: { range: [3, 6], weight: 3 } },
  resNeutral: { label: 'Res. Neutral', pct: true, element: 'neutral', affix: { range: [3, 6], weight: 2 } },

  pushDamage: { label: 'Daños de empuje', affix: { range: [3, 6], weight: 3 } },
  pushRes: { label: 'Res. empuje', affix: { range: [2, 5], weight: 1 } },
  lock: { label: 'Placaje', affix: { range: [3, 6], weight: 3 } },
  dodge: { label: 'Huida', affix: { range: [3, 6], weight: 3 } },
  initiative: { label: 'Iniciativa', affix: { range: [10, 25], weight: 2 } },
  summons: { label: 'Invocaciones' },
  lifesteal: { label: 'Robo de vida', pct: true },

  // Estadísticas de clase y de expedición.
  rageMax: { label: 'Ira máxima' },
  overhealShieldPct: { label: 'Tope de Ensalmo', pct: true },
  bombMax: { label: 'Bombas máximas' },
  bombChargeMax: { label: 'Carga máxima de bomba' },
  bombStartCharge: { label: 'Carga inicial de bomba' },
  kamasPct: { label: 'Kamas obtenidos', pct: true },
  shopDiscount: { label: 'Descuento en tiendas', pct: true },
};

/** Orden de presentación en la hoja de personaje. */
export const STAT_GROUPS = [
  { name: 'Principales', keys: ['ap', 'mp', 'range', 'initiative', 'summons'] },
  { name: 'Características', keys: ['strength', 'intelligence', 'chance', 'agility', 'power'] },
  {
    name: 'Daño',
    keys: ['damage', 'earthDamage', 'fireDamage', 'waterDamage', 'airDamage', 'crit', 'critDamage',
      'dmgPct', 'meleePct', 'rangedPct', 'weaponPct', 'spellPct', 'pushDamage', 'heals', 'healPct', 'lifesteal'],
  },
  {
    name: 'Defensa',
    keys: ['resEarth', 'resFire', 'resWater', 'resAir', 'resNeutral', 'damageTakenPct', 'pushRes', 'lock', 'dodge'],
  },
];

export function statLabel(key) {
  return STATS[key]?.label ?? key;
}

export function formatStat(key, value) {
  const def = STATS[key];
  const sign = value > 0 ? '+' : '';
  const v = Math.round(value * 10) / 10;
  if (def?.pct) return `${sign}${v}% ${def.label}`;
  return `${sign}${v} ${def?.label ?? key}`;
}
