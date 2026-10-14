// Legendarios: objetos únicos que cambian reglas o abren estrategias.
export const LEGENDARY_ITEMS = {
  martilloTerremoto: {
    id: 'martilloTerremoto', name: 'Martillo del Terremoto', type: 'weapon', weaponType: 'hammer', rarity: 'legendary',
    desc: 'Cada golpe aleja a todos del punto de impacto.',
    stats: { strength: [12, 16], pushDamage: [8, 10] },
    attack: {
      apCost: 5, minRange: 1, maxRange: 1, castsPerTurn: 1, crit: 5, area: { shape: 'circle', size: 1 },
      effects: [{ type: 'damage', element: 'earth', min: 15, max: 18 }, { type: 'push', distance: 1, from: 'center' }],
    },
  },
  dagaSombria: {
    id: 'dagaSombria', name: 'Daga Sombría', type: 'weapon', weaponType: 'dagger', rarity: 'legendary',
    desc: 'Los críticos con esta daga devuelven 1 PA.',
    stats: { agility: [10, 14], crit: [4, 6] },
    attack: { apCost: 3, minRange: 1, maxRange: 1, castsPerTurn: 2, crit: 30, effects: [{ type: 'damage', element: 'air', min: 10, max: 12 }] },
    triggers: [{
      event: 'dealDamage', conditions: [{ type: 'isCrit' }, { type: 'isWeapon' }],
      actions: [{ type: 'ap', target: 'self', value: 1 }], limit: { perTurn: 1 },
      desc: 'Crítico con arma: +1 PA (1 vez por turno).',
    }],
  },
  baculoAlba: {
    id: 'baculoAlba', name: 'Báculo del Alba', type: 'weapon', weaponType: 'staff', rarity: 'legendary', unlock: 'legendaries_pack',
    desc: 'Golpea en T y te cura con el daño infligido.',
    stats: { chance: [10, 14], heals: [3, 5] },
    attack: {
      apCost: 4, minRange: 1, maxRange: 3, los: true, castsPerTurn: 1, crit: 10, area: { shape: 'perpLine', size: 1 },
      effects: [{ type: 'damage', element: 'water', min: 10, max: 12, lifesteal: 35 }],
    },
  },
  capaMartir: {
    id: 'capaMartir', name: 'Capa del Mártir', type: 'cloak', rarity: 'legendary',
    desc: 'El dolor se vuelve fuerza. Convierte una desventaja en ventaja.',
    stats: { vitality: [20, 30] }, fixedStats: { mp: -1 },
    triggers: [{
      event: 'takeDamage', actions: [{ type: 'status', target: 'self', status: 'martirio', stacks: 1, duration: -1 }],
      limit: { perTurn: 3 }, desc: 'Al recibir daño: +4% de daño durante el combate (máx. 10 acumulaciones).',
    }],
  },
  botasViajero: {
    id: 'botasViajero', name: 'Botas del Viajero Onírico', type: 'boots', rarity: 'legendary',
    desc: 'Quien camina en sueños ve más lejos.',
    stats: { agility: [8, 12] }, fixedStats: { mp: 1 },
    triggers: [{
      event: 'moveEnd', conditions: [{ type: 'movedThisTurnAtLeast', value: 2 }],
      actions: [{ type: 'status', target: 'self', status: 'alcanceExtra', value: 2, duration: 1 }],
      limit: { perTurn: 1 }, desc: 'Tras moverte 2 casillas o más: tu siguiente hechizo gana +2 de alcance.',
    }],
  },
  amuletoDesesperado: {
    id: 'amuletoDesesperado', name: 'Amuleto del Desesperado', type: 'amulet', rarity: 'legendary',
    desc: 'Cuanto más cerca del final, más rápido late el corazón.',
    stats: { vitality: [15, 20] },
    triggers: [{
      event: 'turnStart', conditions: [{ type: 'ownerHpBelow', pct: 40 }],
      actions: [{ type: 'ap', target: 'self', value: 2 }],
      desc: 'Al inicio del turno, si tienes menos del 40% de vida: +2 PA.',
    }],
  },
  anilloOuroboros: {
    id: 'anilloOuroboros', name: 'Anillo de Ouroboros', type: 'ring', unique: true, rarity: 'legendary',
    desc: 'Lo que das vuelve a ti… a cambio de parte de ti.',
    stats: { power: [6, 10] }, fixedStats: { lifesteal: 12, maxHpPct: -10 },
  },
  sombreroBufon: {
    id: 'sombreroBufon', name: 'Sombrero del Bufón', type: 'hat', rarity: 'legendary',
    desc: 'A veces el truco sale gratis.',
    stats: { chance: [10, 14], agility: [6, 8] },
    triggers: [{
      event: 'castSpell', chance: 20, actions: [{ type: 'ap', target: 'self', value: { from: 'apCost', pct: 100 } }],
      limit: { perTurn: 2 }, desc: '20% de probabilidad de recuperar los PA del hechizo lanzado (máx. 2 por turno).',
    }],
  },
  escudoEspinas: {
    id: 'escudoEspinas', name: 'Escudo de Espinas', type: 'shield', rarity: 'legendary',
    desc: 'Tocarlo duele.',
    stats: { resNeutral: [6, 8], resEarth: [6, 8] },
    triggers: [{
      event: 'takeDamage', conditions: [{ type: 'isMeleeHit' }, { type: 'notTriggered' }],
      actions: [{ type: 'damage', target: 'payloadSource', element: 'neutral', fixed: true, value: { from: 'amount', pct: 30 } }],
      desc: 'Devuelve el 30% del daño cuerpo a cuerpo recibido.',
    }],
  },
  cinturonPolvora: {
    id: 'cinturonPolvora', name: 'Cinturón de Pólvora', type: 'belt', rarity: 'legendary', requires: { classId: 'petardista' },
    desc: 'Más bombas, más cargadas.',
    stats: { intelligence: [8, 12] }, fixedStats: { bombMax: 1, bombStartCharge: 1 },
  },
  trofeoColoso: {
    id: 'trofeoColoso', name: 'Trofeo del Coloso', type: 'trophy', unique: true, rarity: 'legendary',
    desc: 'Inamovible.',
    stats: { vitality: [40, 50] }, fixedStats: { mp: -1, resEarth: 10, resFire: 10, resWater: 10, resAir: 10, resNeutral: 10, pushRes: 10 },
  },
  coronaPrismatica: {
    id: 'coronaPrismatica', name: 'Corona Prismática', type: 'hat', rarity: 'legendary', unlock: 'legendaries_pack',
    desc: 'Premia alternar elementos.',
    stats: { power: [10, 14] }, fixedStats: { range: 1 },
    triggers: [{
      event: 'beforeDealDamage', conditions: [{ type: 'isSpell' }, { type: 'elementChanged' }, { type: 'notTriggered' }],
      actions: [{ type: 'modifyDamage', pct: 20 }],
      desc: 'Tus hechizos de un elemento distinto al del anterior infligen +20%.',
    }],
  },
};
