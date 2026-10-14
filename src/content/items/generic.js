// Objetos genéricos: pueden aparecer en cualquier rareza. Sus líneas base escalan
// con el nivel del objeto (piso) y la rareza; la rareza añade afijos aleatorios y,
// en épicos, un encantamiento con disparador.
// stats: rangos a nivel 1. fixedStats: valores que no escalan (PA, PM, alcance…).

export const GENERIC_ITEMS = {
  // Sombreros
  gorroAventurero: { id: 'gorroAventurero', name: 'Gorro de Aventurero', type: 'hat', stats: { vitality: [10, 16], power: [4, 7] } },
  capuchaArcana: { id: 'capuchaArcana', name: 'Capucha Arcana', type: 'hat', stats: { intelligence: [8, 12], heals: [2, 3] } },
  cascoBronce: { id: 'cascoBronce', name: 'Casco de Bronce', type: 'hat', stats: { strength: [8, 12], resEarth: [3, 5] } },
  sombreroPluma: { id: 'sombreroPluma', name: 'Sombrero de Pluma', type: 'hat', stats: { agility: [8, 12], dodge: [3, 5] } },
  // Capas
  capaViajero: { id: 'capaViajero', name: 'Capa de Viajero', type: 'cloak', stats: { vitality: [10, 16], agility: [5, 8] } },
  mantoIgneo: { id: 'mantoIgneo', name: 'Manto Ígneo', type: 'cloak', stats: { intelligence: [8, 12], fireDamage: [1, 2] } },
  capaBosque: { id: 'capaBosque', name: 'Capa del Bosque', type: 'cloak', stats: { chance: [8, 12], resWater: [3, 5] } },
  capaTerrosa: { id: 'capaTerrosa', name: 'Capa Terrosa', type: 'cloak', stats: { strength: [8, 12], earthDamage: [1, 2] } },
  // Amuletos
  amuletoJade: { id: 'amuletoJade', name: 'Amuleto de Jade', type: 'amulet', stats: { vitality: [12, 18], power: [4, 6] } },
  colganteRunico: { id: 'colganteRunico', name: 'Colgante Rúnico', type: 'amulet', stats: { crit: [3, 5], critDamage: [1, 3] } },
  amuletoSabio: { id: 'amuletoSabio', name: 'Amuleto del Sabio', type: 'amulet', stats: { intelligence: [6, 10], heals: [3, 5] } },
  amuletoMarea: { id: 'amuletoMarea', name: 'Amuleto de Marea', type: 'amulet', stats: { chance: [8, 12], waterDamage: [1, 2] } },
  // Anillos (únicos: no se pueden llevar dos iguales)
  anilloHierro: { id: 'anilloHierro', name: 'Anillo de Hierro', type: 'ring', unique: true, stats: { strength: [8, 12] } },
  anilloCoral: { id: 'anilloCoral', name: 'Anillo de Coral', type: 'ring', unique: true, stats: { chance: [8, 12] } },
  anilloAmbar: { id: 'anilloAmbar', name: 'Anillo de Ámbar', type: 'ring', unique: true, stats: { intelligence: [8, 12] } },
  anilloPluma: { id: 'anilloPluma', name: 'Anillo de Pluma', type: 'ring', unique: true, stats: { agility: [8, 12] } },
  anilloVital: { id: 'anilloVital', name: 'Anillo Vital', type: 'ring', unique: true, stats: { vitality: [12, 18] } },
  // Cinturones
  cinturonCuero: { id: 'cinturonCuero', name: 'Cinturón de Cuero', type: 'belt', stats: { vitality: [10, 14], lock: [3, 6] } },
  fajaDuelista: { id: 'fajaDuelista', name: 'Faja del Duelista', type: 'belt', stats: { dodge: [3, 6], crit: [2, 3] } },
  cinturonEnergia: { id: 'cinturonEnergia', name: 'Cinturón de Energía', type: 'belt', stats: { power: [5, 8], initiative: [10, 20] } },
  // Botas
  botasCuero: { id: 'botasCuero', name: 'Botas de Cuero', type: 'boots', stats: { vitality: [8, 12], dodge: [3, 5] } },
  sandaliasVeloces: { id: 'sandaliasVeloces', name: 'Sandalias Veloces', type: 'boots', stats: { agility: [6, 10], initiative: [15, 25] } },
  botasAladas: {
    id: 'botasAladas', name: 'Botas Aladas', type: 'boots', minRarity: 'epic',
    stats: { vitality: [5, 10] }, fixedStats: { mp: 1 },
  },
  // Escudos
  escudoMadera: { id: 'escudoMadera', name: 'Escudo de Madera', type: 'shield', stats: { resNeutral: [4, 6], resEarth: [3, 5] } },
  rodelaIgnea: { id: 'rodelaIgnea', name: 'Rodela Ígnea', type: 'shield', stats: { resFire: [4, 7], intelligence: [4, 7] } },
  broquelEscamas: { id: 'broquelEscamas', name: 'Broquel de Escamas', type: 'shield', stats: { resWater: [4, 7], resAir: [3, 5] } },
  // Trofeos: especialización con contrapartida.
  trofeoCazador: {
    id: 'trofeoCazador', name: 'Trofeo del Cazador', type: 'trophy', desc: 'Para quien golpea desde lejos.',
    stats: { rangedPct: [6, 9] }, fixedStats: { meleePct: -6 },
  },
  trofeoBerserker: {
    id: 'trofeoBerserker', name: 'Trofeo del Berserker', type: 'trophy', desc: 'Para quien vive en el cuerpo a cuerpo.',
    stats: { meleePct: [6, 9] }, fixedStats: { rangedPct: -6 },
  },
  trofeoVigia: {
    id: 'trofeoVigia', name: 'Trofeo del Vigía', type: 'trophy', minRarity: 'rare', desc: 'Ver más lejos cuesta salud.',
    stats: { initiative: [10, 20] }, fixedStats: { range: 1, vitality: -15 },
  },
  trofeoSangre: {
    id: 'trofeoSangre', name: 'Trofeo de Sangre', type: 'trophy', minRarity: 'uncommon',
    stats: { power: [3, 5] }, fixedStats: { lifesteal: 6, damageTakenPct: 6 },
  },
  trofeoAlquimista: { id: 'trofeoAlquimista', name: 'Trofeo del Alquimista', type: 'trophy', stats: { heals: [4, 7] }, fixedStats: { healPct: 5 } },
  trofeoEmpuje: { id: 'trofeoEmpuje', name: 'Trofeo del Ariete', type: 'trophy', stats: { pushDamage: [7, 11] } },
};

// Armas: cada una define su propio ataque (un hechizo más en la barra).
export const WEAPONS = {
  espadaCorta: {
    id: 'espadaCorta', name: 'Espada Corta', type: 'weapon', weaponType: 'sword', stats: { strength: [4, 7] },
    attack: { apCost: 4, minRange: 1, maxRange: 1, castsPerTurn: 1, crit: 10, effects: [{ type: 'damage', element: 'earth', min: 13, max: 17 }] },
  },
  dagasMecha: {
    id: 'dagasMecha', name: 'Dagas de Mecha', type: 'weapon', weaponType: 'dagger', stats: { agility: [4, 7] },
    attack: { apCost: 3, minRange: 1, maxRange: 1, castsPerTurn: 2, crit: 15, effects: [{ type: 'damage', element: 'air', min: 8, max: 10 }] },
  },
  dagasDuelista: {
    id: 'dagasDuelista', name: 'Dagas del Duelista', type: 'weapon', weaponType: 'dagger', minRarity: 'uncommon', stats: { crit: [3, 5] },
    attack: { apCost: 3, minRange: 1, maxRange: 1, castsPerTurn: 2, crit: 25, effects: [{ type: 'damage', element: 'air', min: 9, max: 11 }] },
  },
  bastonNovicio: {
    id: 'bastonNovicio', name: 'Bastón de Novicio', type: 'weapon', weaponType: 'staff', stats: { intelligence: [4, 7] },
    attack: {
      apCost: 4, minRange: 1, maxRange: 1, castsPerTurn: 1, crit: 5, area: { shape: 'perpLine', size: 1 },
      effects: [{ type: 'damage', element: 'fire', min: 9, max: 11 }],
    },
  },
  varitaCoral: {
    id: 'varitaCoral', name: 'Varita de Coral', type: 'weapon', weaponType: 'wand', stats: { chance: [4, 7] },
    attack: { apCost: 3, minRange: 1, maxRange: 4, los: true, castsPerTurn: 1, crit: 5, effects: [{ type: 'damage', element: 'water', min: 8, max: 10 }] },
  },
  arcoCorto: {
    id: 'arcoCorto', name: 'Arco Corto', type: 'weapon', weaponType: 'bow', stats: { agility: [4, 7] },
    attack: { apCost: 4, minRange: 2, maxRange: 6, los: true, castsPerTurn: 1, crit: 10, effects: [{ type: 'damage', element: 'air', min: 11, max: 14 }] },
  },
  martilloGuerra: {
    id: 'martilloGuerra', name: 'Martillo de Guerra', type: 'weapon', weaponType: 'hammer', stats: { strength: [5, 8] },
    attack: {
      apCost: 5, minRange: 1, maxRange: 1, castsPerTurn: 1, crit: 5, area: { shape: 'circle', size: 1 },
      effects: [{ type: 'damage', element: 'earth', min: 12, max: 15 }],
    },
  },
  hachaLenador: {
    id: 'hachaLenador', name: 'Hacha de Leñador', type: 'weapon', weaponType: 'axe', stats: { strength: [3, 5], intelligence: [3, 5] },
    attack: {
      apCost: 4, minRange: 1, maxRange: 1, castsPerTurn: 1, crit: 5, area: { shape: 'perpLine', size: 1 },
      effects: [{ type: 'damage', element: 'earth', min: 7, max: 9 }, { type: 'damage', element: 'fire', min: 5, max: 6 }],
    },
  },
};
