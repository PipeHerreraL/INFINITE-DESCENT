// FURIAK — Guerrero de la Ira (arquetipo: Yopuka).
// Identidad: cuerpo a cuerpo explosivo, movilidad con Salto y acumulación de Ira.

export const FURIAK_SPELLS = {
  presion: {
    id: 'presion', name: 'Presión', icon: 'fist', element: 'earth',
    desc: 'Golpe brutal cuerpo a cuerpo.',
    apCost: 3, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 2, crit: 10,
    tags: ['melee'],
    effects: [{ type: 'damage', element: 'earth', min: 13, max: 16 }],
    variants: [
      {
        id: 'presionSismica', name: 'Presión Sísmica', desc: 'Golpea en cruz alrededor del objetivo.',
        patch: { set: { area: { shape: 'cross', size: 1 }, target: 'cell' }, effects: [{ type: 'damage', element: 'earth', min: 10, max: 12 }] },
      },
      {
        id: 'presionQuebrantadora', name: 'Presión Quebrantadora', desc: 'Deja al objetivo Vulnerable (+15% daño recibido).',
        patch: {
          set: { castsPerTurn: 1 },
          effects: [
            { type: 'damage', element: 'earth', min: 12, max: 14 },
            { type: 'status', status: 'vulnerable', value: 15, duration: 2 },
          ],
        },
      },
    ],
  },
  salto: {
    id: 'salto', name: 'Salto', icon: 'jump', element: 'neutral',
    desc: 'Salta a una casilla libre sin necesitar línea de visión.',
    apCost: 2, minRange: 1, maxRange: 4, los: false, target: 'emptyCell', castsPerTurn: 1, cooldown: 2,
    tags: ['mobility'],
    effects: [{ type: 'teleport' }],
    variants: [
      {
        id: 'saltoAplastante', name: 'Salto Aplastante', desc: 'Al aterrizar daña a los enemigos adyacentes.',
        patch: {
          add: { apCost: 1 },
          appendEffects: [{ type: 'damage', element: 'earth', min: 8, max: 10, target: 'areaAroundTarget', radius: 1 }],
        },
      },
    ],
  },
  espadaIgnea: {
    id: 'espadaIgnea', name: 'Espada Ígnea', icon: 'sword', element: 'fire',
    desc: 'Tajo en línea que alcanza dos casillas.',
    apCost: 4, minRange: 1, maxRange: 3, los: true, inLine: true, target: 'cell', castsPerTurn: 2, crit: 5,
    area: { shape: 'line', size: 1 },
    effects: [{ type: 'damage', element: 'fire', min: 15, max: 18 }],
    variants: [
      {
        id: 'espadaJuicio', name: 'Espada del Juicio', desc: 'Se vuelve de Aire y gana alcance.',
        patch: { add: { maxRange: 2 }, set: { element: 'air' }, effects: [{ type: 'damage', element: 'air', min: 13, max: 16 }] },
      },
      {
        id: 'espadaAbrasadora', name: 'Espada Abrasadora', desc: 'Aplica Quemadura.',
        patch: { appendEffects: [{ type: 'status', status: 'quemadura', value: 3, duration: 2 }] },
      },
    ],
  },
  intimidacion: {
    id: 'intimidacion', name: 'Intimidación', icon: 'push', element: 'earth',
    desc: 'Golpe que empuja 2 casillas. Estrella a los enemigos contra obstáculos.',
    apCost: 2, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 2, castsPerTarget: 1,
    tags: ['melee'],
    effects: [
      { type: 'damage', element: 'earth', min: 6, max: 8 },
      { type: 'push', distance: 2 },
    ],
    variants: [
      {
        id: 'rugido', name: 'Rugido', desc: 'Empuja 1 casilla a todos los enemigos adyacentes.',
        patch: {
          set: { target: 'self', minRange: 0, maxRange: 0, area: { shape: 'circle', size: 1 }, castsPerTarget: 0, castsPerTurn: 1 },
          effects: [
            { type: 'damage', element: 'earth', min: 5, max: 6 },
            { type: 'push', distance: 1 },
          ],
        },
      },
    ],
  },
  gritoPoder: {
    id: 'gritoPoder', name: 'Grito de Poder', icon: 'shout', element: 'neutral',
    desc: 'Gana +40 de Potencia durante 2 turnos.',
    apCost: 2, minRange: 0, maxRange: 0, los: false, target: 'self', castsPerTurn: 1, cooldown: 4,
    tags: ['buff'],
    effects: [{ type: 'status', status: 'potenciado', value: 40, duration: 2 }],
    variants: [
      {
        id: 'gritoGuerra', name: 'Grito de Guerra', desc: '+20% de daño y +1 PM este turno. Enfriamiento 3.',
        patch: {
          set: { cooldown: 3 },
          effects: [
            { type: 'status', status: 'estimulo', value: 20, duration: 1 },
            { type: 'mp', value: 1 },
          ],
        },
      },
    ],
  },
  // Hechizos aprendibles durante la expedición.
  colera: {
    id: 'colera', name: 'Cólera', icon: 'fist', element: 'earth',
    desc: 'Golpe devastador. Cada uso en el combate aumenta su daño en +8.',
    apCost: 5, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1, cooldown: 2, crit: 10,
    tags: ['melee'],
    effects: [{ type: 'damage', element: 'earth', min: 20, max: 24, growPerCast: 8 }],
  },
  torbellino: {
    id: 'torbellino', name: 'Torbellino', icon: 'spin', element: 'fire',
    desc: 'Gira y quema a todos los enemigos adyacentes.',
    apCost: 4, minRange: 0, maxRange: 0, los: false, target: 'self', castsPerTurn: 1, cooldown: 1,
    tags: ['melee'], area: { shape: 'circle', size: 1 },
    effects: [{ type: 'damage', element: 'fire', min: 12, max: 15 }],
  },
  cadena: {
    id: 'cadena', name: 'Cadena de Acero', icon: 'chain', element: 'air',
    desc: 'Atrae al objetivo 3 casillas.',
    apCost: 3, minRange: 2, maxRange: 5, los: true, inLine: true, target: 'enemy', castsPerTurn: 1,
    effects: [
      { type: 'damage', element: 'air', min: 7, max: 9 },
      { type: 'pull', distance: 3 },
    ],
  },
  golpeTelurico: {
    id: 'golpeTelurico', name: 'Golpe Telúrico', icon: 'quake', element: 'earth',
    desc: 'Onda de choque en cruz a distancia.',
    apCost: 4, minRange: 1, maxRange: 4, los: true, target: 'cell', castsPerTurn: 1, cooldown: 1,
    area: { shape: 'cross', size: 1 },
    effects: [{ type: 'damage', element: 'earth', min: 11, max: 13 }],
  },
};

export const FURIAK = {
  id: 'furiak',
  name: 'Furiak',
  title: 'Guerrero de la Ira',
  archetype: 'Yopuka',
  color: '#d64545',
  sprite: 'warrior',
  desc: 'Se lanza al cuerpo a cuerpo, salta sobre el campo y acumula Ira con cada golpe. Recompensa la agresividad y el posicionamiento.',
  playstyle: ['Daño directo', 'Cuerpo a cuerpo', 'Empujes'],
  baseStats: {
    hp: 135, ap: 6, mp: 3, range: 0, strength: 20, intelligence: 10,
    crit: 5, lock: 15, dodge: 12, initiative: 110, summons: 1, rageMax: 5,
  },
  hpPerLevel: 8,
  preferredElements: ['earth', 'fire', 'air', 'water'],
  passive: {
    id: 'pasivaIra', name: 'Ira',
    desc: 'Cada hechizo que inflige daño otorga 1 Ira (+4% de daño, máx. 5). Pierdes la Ira si terminas el turno sin infligir daño.',
    triggers: [
      {
        event: 'dealDamage', conditions: [{ type: 'isSpell' }, { type: 'notTriggered' }],
        actions: [{ type: 'status', target: 'self', status: 'ira', stacks: 1, duration: -1 }],
        limit: { perAction: 1 }, silent: true,
      },
      {
        event: 'turnEnd', conditions: [{ type: 'noDamageThisTurn' }],
        actions: [{ type: 'removeStatus', target: 'self', status: 'ira' }], silent: true,
      },
    ],
  },
  startingSpells: ['presion', 'salto', 'espadaIgnea', 'intimidacion', 'gritoPoder'],
  learnableSpells: ['colera', 'torbellino', 'cadena', 'golpeTelurico'],
  weaponAffinity: { sword: 15, hammer: 15 },
  startingWeapon: 'espadaCorta',
  talents: [
    {
      id: 'sedSangre', name: 'Sed de Sangre', desc: 'Al matar a un enemigo, te curas el 10% de tu vida máxima.',
      triggers: [{ event: 'kill', actions: [{ type: 'heal', target: 'self', value: { from: 'ownerMaxHp', pct: 10 }, fixed: true }] }],
    },
    {
      id: 'talentoImpulso', name: 'Impulso', desc: 'Tras usar Salto, tu próximo hechizo cuerpo a cuerpo inflige +25%.',
      triggers: [{
        event: 'castSpell', conditions: [{ type: 'spellId', ids: ['salto'] }],
        actions: [{ type: 'status', target: 'self', status: 'impulso', duration: 1 }],
      }],
    },
    {
      id: 'pielHierro', name: 'Piel de Hierro', desc: '+8% a todas las resistencias y +10 Placaje, pero -1 Alcance.',
      stats: { resEarth: 8, resFire: 8, resWater: 8, resAir: 8, resNeutral: 8, lock: 10, range: -1 },
    },
    {
      id: 'furiaDesatada', name: 'Furia Desatada', desc: 'Ira máxima +3. Empiezas cada combate con 2 de Ira.',
      stats: { rageMax: 3 },
      triggers: [{ event: 'combatStart', actions: [{ type: 'status', target: 'self', status: 'ira', stacks: 2, duration: -1 }] }],
    },
    {
      id: 'golpeSismico', name: 'Golpe Sísmico', desc: 'Tus hechizos cuerpo a cuerpo empujan 1 casilla al objetivo.',
      triggers: [{
        event: 'dealDamage', conditions: [{ type: 'isMeleeSpell' }, { type: 'notTriggered' }],
        actions: [{ type: 'push', target: 'payloadTarget', distance: 1 }],
      }],
    },
    {
      id: 'impetu', name: 'Ímpetu', desc: 'Al matar a un enemigo, ganas +1 PM (máx. 2 por turno).',
      triggers: [{ event: 'kill', actions: [{ type: 'mp', target: 'self', value: 1 }], limit: { perTurn: 2 } }],
    },
  ],
  origins: [
    { id: 'veterano', name: 'Veterano', desc: 'Espada corta y el kit clásico.' },
    {
      id: 'duelista', name: 'Duelista', desc: 'Empieza con Dagas del Duelista (+críticos) y Cadena de Acero en lugar de Grito de Poder.',
      unlock: 'origin_furiak_duelista',
      startingWeapon: 'dagasDuelista',
      replaceSpells: { gritoPoder: 'cadena' },
    },
  ],
};
