// PETARDISTA — Maestro de la Pólvora (arquetipo: Tymador).
// Identidad: prepara el tablero con bombas que se cargan cada turno y provoca
// reacciones en cadena. El elemento de las bombas depende del equipo.

export const PETARDISTA_SPELLS = {
  bomba: {
    id: 'bomba', name: 'Bomba', icon: 'bomb', element: 'dominant',
    desc: 'Coloca una bomba (máx. 3). Se carga al inicio de cada uno de tus turnos y adopta tu elemento dominante.',
    apCost: 2, minRange: 1, maxRange: 4, rangeMod: true, los: true, target: 'emptyCell', castsPerTurn: 2,
    tags: ['bomb', 'summon'],
    effects: [{ type: 'placeBomb' }],
    variants: [
      {
        id: 'bombaRacimo', name: 'Bomba de Racimo', desc: 'Coloca además una segunda bomba en una casilla adyacente libre. Cuesta 1 PA más y solo se lanza una vez por turno.',
        patch: { add: { apCost: 1 }, set: { castsPerTurn: 1 }, effects: [{ type: 'placeBomb', extraAdjacent: 1 }] },
      },
    ],
  },
  detonador: {
    id: 'detonador', name: 'Detonador', icon: 'spark', element: 'dominant',
    desc: 'Hace estallar una de tus bombas. Las bombas atrapadas en la explosión estallan en cadena.',
    apCost: 2, minRange: 0, maxRange: 8, los: false, target: 'ownBomb', castsPerTurn: 2,
    tags: ['bomb'],
    effects: [{ type: 'detonate' }],
    variants: [
      {
        id: 'sobrecarga', name: 'Sobrecarga', desc: 'La bomba gana +2 de carga antes de estallar. Cuesta 3 PA.',
        patch: { add: { apCost: 1 }, effects: [{ type: 'detonate', bonusCharge: 2 }] },
      },
    ],
  },
  mechaArdiente: {
    id: 'mechaArdiente', name: 'Mecha Ardiente', icon: 'bolt', element: 'fire',
    desc: 'Proyectil incendiario a distancia.',
    apCost: 3, minRange: 2, maxRange: 6, rangeMod: true, los: true, target: 'enemy', castsPerTurn: 2,
    effects: [{ type: 'damage', element: 'fire', min: 11, max: 14 }],
    variants: [
      {
        id: 'mechaRebotante', name: 'Mecha Rebotante', desc: 'Se vuelve de Aire y golpea en cruz.',
        patch: { set: { element: 'air', target: 'cell', area: { shape: 'cross', size: 1 } }, effects: [{ type: 'damage', element: 'air', min: 8, max: 10 }] },
      },
    ],
  },
  patadaPolvora: {
    id: 'patadaPolvora', name: 'Patada de Pólvora', icon: 'push', element: 'earth',
    desc: 'Empuja 2 casillas. Si el objetivo choca contra una bomba, la bomba recibe el impacto.',
    apCost: 2, minRange: 1, maxRange: 1, los: true, target: 'unit', castsPerTurn: 2,
    tags: ['melee'],
    effects: [
      { type: 'damage', element: 'earth', min: 5, max: 7 },
      { type: 'push', distance: 2, affects: 'all' },
    ],
    variants: [
      {
        id: 'patadaLarga', name: 'Patada Larga', desc: 'Empuja 4 casillas con menos daño.',
        patch: { effects: [{ type: 'damage', element: 'earth', min: 3, max: 4 }, { type: 'push', distance: 4, affects: 'all' }] },
      },
    ],
  },
  intercambio: {
    id: 'intercambio', name: 'Intercambio Explosivo', icon: 'swap', element: 'neutral',
    desc: 'Intercambia tu posición con una de tus bombas.',
    apCost: 1, minRange: 1, maxRange: 6, los: false, target: 'ownBomb', castsPerTurn: 1, cooldown: 2,
    tags: ['mobility'],
    effects: [{ type: 'swap' }],
  },
  granTraca: {
    id: 'granTraca', name: 'Gran Traca', icon: 'burst', element: 'neutral',
    desc: 'Todas tus bombas ganan +1 de carga.',
    apCost: 3, minRange: 0, maxRange: 0, los: false, target: 'self', castsPerTurn: 1, cooldown: 3,
    tags: ['bomb'],
    effects: [{ type: 'chargeBombs', value: 1 }],
  },
  cohete: {
    id: 'cohete', name: 'Cohete', icon: 'rocket', element: 'fire',
    desc: 'Disparo de largo alcance en línea.',
    apCost: 4, minRange: 3, maxRange: 8, los: true, inLine: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'fire', min: 15, max: 19 }],
  },
  minaRetroceso: {
    id: 'minaRetroceso', name: 'Mina de Retroceso', icon: 'quake', element: 'air',
    desc: 'Explosión en cruz que aleja a los enemigos del centro.',
    apCost: 3, minRange: 1, maxRange: 5, los: true, target: 'cell', castsPerTurn: 1, cooldown: 1,
    area: { shape: 'cross', size: 1 },
    effects: [
      { type: 'damage', element: 'air', min: 7, max: 9 },
      { type: 'push', distance: 1, from: 'center' },
    ],
  },
  ondaChoque: {
    id: 'ondaChoque', name: 'Onda de Choque', icon: 'spin', element: 'earth',
    desc: 'Aleja 1 casilla a los enemigos a 2 casillas de ti.',
    apCost: 3, minRange: 0, maxRange: 0, los: false, target: 'self', castsPerTurn: 1, cooldown: 2,
    area: { shape: 'circle', size: 2 },
    effects: [
      { type: 'damage', element: 'earth', min: 6, max: 8 },
      { type: 'push', distance: 1 },
    ],
  },
};

export const PETARDISTA = {
  id: 'petardista',
  name: 'Petardista',
  title: 'Maestro de la Pólvora',
  archetype: 'Tymador',
  color: '#f4a259',
  sprite: 'bomber',
  desc: 'Siembra el tablero de bombas que se cargan turno a turno y las hace estallar en cadena. Su equipo decide el elemento de las explosiones.',
  playstyle: ['Control del tablero', 'Daño preparado', 'Combos'],
  baseStats: {
    hp: 115, ap: 6, mp: 3, range: 0, intelligence: 15, strength: 10, agility: 5,
    crit: 5, lock: 10, dodge: 15, initiative: 100, summons: 1,
    bombMax: 3, bombChargeMax: 3, bombStartCharge: 0,
  },
  hpPerLevel: 7,
  preferredElements: ['fire', 'earth', 'air', 'water'],
  passive: {
    id: 'pasivaPolvora', name: 'Pólvora Elemental',
    desc: 'Tus bombas adoptan tu elemento dominante (Fuerza, Inteligencia, Suerte o Agilidad). Fuego: queman. Tierra: empujan. Agua: curan a los aliados. Aire: quitan PM.',
  },
  startingSpells: ['bomba', 'detonador', 'mechaArdiente', 'patadaPolvora', 'intercambio'],
  learnableSpells: ['granTraca', 'cohete', 'minaRetroceso', 'ondaChoque'],
  weaponAffinity: { dagger: 15, bow: 15 },
  startingWeapon: 'dagasMecha',
  talents: [
    { id: 'mechaLarga', name: 'Mecha Larga', desc: 'La carga máxima de tus bombas sube en 2.', stats: { bombChargeMax: 2 } },
    {
      id: 'polvoraDensa', name: 'Pólvora Densa', desc: 'Tus explosiones infligen +20% de daño.',
      triggers: [{ event: 'beforeDealDamage', conditions: [{ type: 'spellTag', tag: 'bomb' }], actions: [{ type: 'modifyDamage', pct: 20 }] }],
    },
    {
      id: 'reaccionCadena', name: 'Reacción en Cadena', desc: 'Cada explosión encadenada inflige +15% más que la anterior.',
      triggers: [{
        event: 'beforeDealDamage', conditions: [{ type: 'spellTag', tag: 'bomb' }],
        actions: [{ type: 'modifyDamage', pct: { from: 'chainIndex', mult: 15 } }],
      }],
    },
    { id: 'ingeniero', name: 'Ingeniero', desc: '+1 bomba máxima y las bombas nacen con 1 de carga.', stats: { bombMax: 1, bombStartCharge: 1 } },
    {
      id: 'retrocesoExplosivo', name: 'Retroceso Explosivo', desc: 'Tus explosiones alejan 1 casilla a los enemigos alcanzados.',
      triggers: [{
        event: 'dealDamage', conditions: [{ type: 'spellTag', tag: 'bomb' }],
        actions: [{ type: 'push', target: 'payloadTarget', distance: 1, from: 'payloadCell' }],
      }],
    },
    {
      id: 'sabotaje', name: 'Sabotaje', desc: 'Tus explosiones quitan 1 PM a los enemigos alcanzados.',
      triggers: [{
        event: 'dealDamage', conditions: [{ type: 'spellTag', tag: 'bomb' }],
        actions: [{ type: 'mp', target: 'payloadTarget', value: -1 }],
      }],
    },
  ],
  origins: [
    { id: 'aprendiz', name: 'Aprendiz', desc: 'Dagas de mecha y el kit clásico.' },
    {
      id: 'artificiero', name: 'Artificiero', desc: 'Empieza con Gran Traca en lugar de Intercambio Explosivo y con +1 de carga inicial en las bombas.',
      unlock: 'origin_petardista_artificiero',
      replaceSpells: { intercambio: 'granTraca' },
      boons: [{ id: 'artificiero', name: 'Artificiero', stats: { bombStartCharge: 1 } }],
    },
  ],
};
