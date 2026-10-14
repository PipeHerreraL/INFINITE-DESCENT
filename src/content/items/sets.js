// Sets de equipamiento. Las piezas tienen rareza fija; las bonificaciones se
// activan por número de piezas distintas equipadas.

export const SET_ITEMS = {
  // ── Set del Jabalí Carmesí (Fuerza/Inteligencia, agresivo)
  yelmoColmillo: { id: 'yelmoColmillo', name: 'Yelmo Colmilludo', type: 'hat', set: 'jabaliCarmesi', rarity: 'rare', stats: { strength: [8, 12], power: [4, 6] } },
  capaCerdas: { id: 'capaCerdas', name: 'Capa de Cerdas', type: 'cloak', set: 'jabaliCarmesi', rarity: 'rare', stats: { intelligence: [8, 12], fireDamage: [1, 2] } },
  amuletoBrasa: { id: 'amuletoBrasa', name: 'Amuleto de Brasa', type: 'amulet', set: 'jabaliCarmesi', rarity: 'rare', stats: { vitality: [12, 16], intelligence: [6, 9] } },
  botasPezuna: { id: 'botasPezuna', name: 'Botas de Pezuña', type: 'boots', set: 'jabaliCarmesi', rarity: 'rare', stats: { strength: [6, 9], lock: [4, 6] } },

  // ── Set del Tejedor de Brumas (Suerte/Agilidad, movilidad)
  capuchaBruma: { id: 'capuchaBruma', name: 'Capucha de Bruma', type: 'hat', set: 'tejedorBrumas', rarity: 'rare', stats: { chance: [8, 12], heals: [2, 3] } },
  capaBruma: { id: 'capaBruma', name: 'Capa de Bruma', type: 'cloak', set: 'tejedorBrumas', rarity: 'rare', stats: { agility: [8, 12], dodge: [3, 5] } },
  anilloBruma: { id: 'anilloBruma', name: 'Anillo de Bruma', type: 'ring', unique: true, set: 'tejedorBrumas', rarity: 'rare', stats: { chance: [6, 9], vitality: [8, 12] } },
  fajaBruma: { id: 'fajaBruma', name: 'Faja de Bruma', type: 'belt', set: 'tejedorBrumas', rarity: 'rare', stats: { agility: [6, 9], initiative: [10, 20] } },

  // ── Set del Minero Pólvora (empujes y colisiones)
  cascoMinero: { id: 'cascoMinero', name: 'Casco de Minero', type: 'hat', set: 'mineroPolvora', rarity: 'rare', unlock: 'set_minero', stats: { strength: [8, 12], pushDamage: [3, 5] } },
  cinturonMechas: { id: 'cinturonMechas', name: 'Cinturón de Mechas', type: 'belt', set: 'mineroPolvora', rarity: 'rare', unlock: 'set_minero', stats: { intelligence: [6, 10], power: [4, 6] } },
  botasReforzadas: { id: 'botasReforzadas', name: 'Botas Reforzadas', type: 'boots', set: 'mineroPolvora', rarity: 'rare', unlock: 'set_minero', stats: { vitality: [10, 14], pushRes: [3, 5] } },
  escudoVagoneta: { id: 'escudoVagoneta', name: 'Escudo de Vagoneta', type: 'shield', set: 'mineroPolvora', rarity: 'rare', unlock: 'set_minero', stats: { resEarth: [4, 6], resFire: [4, 6] } },

  // ── Set del Centinela de Piedra (aguante; solo en el segundo estrato)
  yelmoCentinela: { id: 'yelmoCentinela', name: 'Yelmo del Centinela', type: 'hat', set: 'centinelaPiedra', rarity: 'epic', minFloor: 7, stats: { vitality: [15, 20], resEarth: [4, 6] } },
  capaCentinela: { id: 'capaCentinela', name: 'Capa del Centinela', type: 'cloak', set: 'centinelaPiedra', rarity: 'epic', minFloor: 7, stats: { strength: [8, 12], resNeutral: [4, 6] } },
  amuletoCentinela: { id: 'amuletoCentinela', name: 'Amuleto del Centinela', type: 'amulet', set: 'centinelaPiedra', rarity: 'epic', minFloor: 7, stats: { vitality: [15, 20], lock: [5, 8] } },
  paveCentinela: { id: 'paveCentinela', name: 'Pavés del Centinela', type: 'shield', set: 'centinelaPiedra', rarity: 'epic', minFloor: 7, stats: { resFire: [5, 7], resWater: [5, 7] } },
};

export const SETS = {
  jabaliCarmesi: {
    id: 'jabaliCarmesi', name: 'Set del Jabalí Carmesí', color: '#d62828',
    pieces: ['yelmoColmillo', 'capaCerdas', 'amuletoBrasa', 'botasPezuna'],
    bonuses: {
      2: { desc: '+25 Potencia.', stats: { power: 25 } },
      3: {
        desc: 'Tus golpes de Fuego aplican 1 acumulación de Quemadura.',
        triggers: [{
          event: 'dealDamage', conditions: [{ type: 'element', in: ['fire'] }, { type: 'notTriggered' }],
          actions: [{ type: 'status', target: 'payloadTarget', status: 'quemadura', value: 3, stacks: 1, duration: 2 }],
        }],
      },
      4: {
        desc: 'Los enemigos que mueren mientras arden explotan: daño de Fuego del 30% de su vida máxima a su alrededor.',
        triggers: [{
          event: 'kill', conditions: [{ type: 'targetHasStatus', status: 'quemadura' }],
          actions: [{ type: 'damage', target: 'areaAroundTarget', radius: 1, element: 'fire', fixed: true, value: { from: 'payloadTargetMaxHp', pct: 30 } }],
        }],
      },
    },
  },
  tejedorBrumas: {
    id: 'tejedorBrumas', name: 'Set del Tejedor de Brumas', color: '#5fa8d3',
    pieces: ['capuchaBruma', 'capaBruma', 'anilloBruma', 'fajaBruma'],
    bonuses: {
      2: { desc: '+15 Suerte y +15 Agilidad.', stats: { chance: 15, agility: 15 } },
      3: {
        desc: 'Tras moverte 2 casillas o más en un turno, tu siguiente hechizo inflige +20%.',
        triggers: [{
          event: 'moveEnd', conditions: [{ type: 'movedThisTurnAtLeast', value: 2 }],
          actions: [{ type: 'status', target: 'self', status: 'concentracion', value: 20, duration: 1 }],
          limit: { perTurn: 1 },
        }],
      },
      4: {
        desc: 'Si empiezas tu turno sin enemigos adyacentes, ganas +1 PA.',
        triggers: [{
          event: 'turnStart', conditions: [{ type: 'adjacentEnemiesAtMost', value: 0 }],
          actions: [{ type: 'ap', target: 'self', value: 1 }],
        }],
      },
    },
  },
  mineroPolvora: {
    id: 'mineroPolvora', name: 'Set del Minero Pólvora', color: '#8d6e63',
    pieces: ['cascoMinero', 'cinturonMechas', 'botasReforzadas', 'escudoVagoneta'],
    bonuses: {
      2: { desc: '+15 Daños de empuje.', stats: { pushDamage: 15 } },
      3: {
        desc: 'Los enemigos que estrellas pierden 1 PM.',
        triggers: [{ event: 'causeCollision', actions: [{ type: 'mp', target: 'payloadTarget', value: -1 }] }],
      },
      4: {
        desc: 'Cada choque provoca una onda de Tierra igual al daño de colisión alrededor del objetivo.',
        triggers: [{
          event: 'causeCollision', conditions: [{ type: 'notTriggered' }],
          actions: [{ type: 'damage', target: 'areaAroundTarget', radius: 1, element: 'earth', fixed: true, value: { from: 'amount', pct: 100 } }],
          limit: { perTurn: 4 },
        }],
      },
    },
  },
  centinelaPiedra: {
    id: 'centinelaPiedra', name: 'Set del Centinela de Piedra', color: '#6c757d',
    pieces: ['yelmoCentinela', 'capaCentinela', 'amuletoCentinela', 'paveCentinela'],
    bonuses: {
      2: { desc: '+6% a todas las resistencias.', stats: { resEarth: 6, resFire: 6, resWater: 6, resAir: 6, resNeutral: 6 } },
      3: {
        desc: 'Quien te golpea cuerpo a cuerpo pierde 1 PM.',
        triggers: [{ event: 'takeDamage', conditions: [{ type: 'isMeleeHit' }], actions: [{ type: 'mp', target: 'payloadSource', value: -1 }] }],
      },
      4: {
        desc: '+30 Placaje. Al inicio del turno ganas un escudo del 5% de tu vida por enemigo adyacente.',
        stats: { lock: 30 },
        triggers: [{
          event: 'turnStart', conditions: [{ type: 'adjacentEnemiesAtLeast', value: 1 }],
          actions: [{ type: 'shield', target: 'self', value: { from: 'ownerMaxHp', pct: 5, multBy: 'adjacentEnemies' }, duration: 1 }],
        }],
      },
    },
  },
};
