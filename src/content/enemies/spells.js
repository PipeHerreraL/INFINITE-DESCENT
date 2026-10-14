// Hechizos de monstruos. Usan exactamente el mismo esquema que los de las clases,
// así que el motor de combate y la IA no distinguen entre jugador y enemigo.
export const MONSTER_SPELLS = {
  // ── Estrato 1: Praderas del Ensueño
  picotazo: {
    id: 'picotazo', name: 'Picotazo', icon: 'fang', element: 'air',
    apCost: 3, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'air', min: 5, max: 7 }],
  },
  mordiscoViscoso: {
    id: 'mordiscoViscoso', name: 'Mordisco Viscoso', icon: 'fang', element: 'water',
    apCost: 3, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'water', min: 4, max: 6 }, { type: 'status', status: 'veneno', value: 2, stacks: 1, duration: 2 }],
  },
  esporas: {
    id: 'esporas', name: 'Esporas', icon: 'spore', element: 'air',
    apCost: 3, minRange: 2, maxRange: 5, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'air', min: 5, max: 7 }, { type: 'mp', value: -1 }],
  },
  esporasCurativas: {
    id: 'esporasCurativas', name: 'Esporas Curativas', icon: 'heart', element: 'water',
    apCost: 3, minRange: 0, maxRange: 4, los: true, target: 'ally', castsPerTurn: 1, cooldown: 1,
    tags: ['heal'], effects: [{ type: 'heal', min: 8, max: 10 }],
  },
  embestida: {
    id: 'embestida', name: 'Embestida', icon: 'push', element: 'earth',
    desc: 'Carga en línea hasta el objetivo y lo golpea.',
    apCost: 4, minRange: 2, maxRange: 4, los: true, inLine: true, target: 'enemy', castsPerTurn: 1, cooldown: 2,
    effects: [{ type: 'dashToTarget' }, { type: 'damage', element: 'earth', min: 7, max: 9 }],
  },
  cornada: {
    id: 'cornada', name: 'Cornada', icon: 'fang', element: 'earth',
    apCost: 3, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'earth', min: 5, max: 7 }],
  },
  salpicon: {
    id: 'salpicon', name: 'Salpicón', icon: 'drop', element: 'water',
    apCost: 3, minRange: 1, maxRange: 2, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'water', min: 4, max: 6 }],
  },
  salpiconMini: {
    id: 'salpiconMini', name: 'Salpicón', icon: 'drop', element: 'water',
    apCost: 3, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'water', min: 2, max: 4 }],
  },
  picotazoAlfa: {
    id: 'picotazoAlfa', name: 'Picotazo Alfa', icon: 'fang', element: 'air',
    apCost: 3, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 2,
    effects: [{ type: 'damage', element: 'air', min: 7, max: 9 }],
  },
  graznido: {
    id: 'graznido', name: 'Graznido', icon: 'shout', element: 'neutral',
    desc: 'Los aliados cercanos ganan +20% de daño.',
    apCost: 2, minRange: 0, maxRange: 0, los: false, target: 'self', castsPerTurn: 1, cooldown: 3,
    area: { shape: 'circle', size: 3 },
    effects: [{ type: 'status', status: 'estimulo', value: 20, duration: 2, affects: 'allies' }],
  },
  esporaToxica: {
    id: 'esporaToxica', name: 'Espora Tóxica', icon: 'spore', element: 'air',
    apCost: 4, minRange: 2, maxRange: 6, los: true, target: 'cell', castsPerTurn: 1,
    area: { shape: 'circle', size: 1 },
    effects: [{ type: 'damage', element: 'air', min: 6, max: 8 }, { type: 'status', status: 'veneno', value: 3, stacks: 1, duration: 2 }],
  },
  invocarSetita: {
    id: 'invocarSetita', name: 'Germinar', icon: 'spore', element: 'neutral',
    apCost: 3, minRange: 1, maxRange: 2, los: true, target: 'emptyCell', castsPerTurn: 1, cooldown: 3,
    tags: ['summon'], effects: [{ type: 'summon', monster: 'setita' }],
  },
  picadura: {
    id: 'picadura', name: 'Picadura', icon: 'fang', element: 'water',
    apCost: 3, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'water', min: 4, max: 5 }],
  },
  curaConejo: {
    id: 'curaConejo', name: 'Zanahoria Curativa', icon: 'heart', element: 'water',
    apCost: 3, minRange: 0, maxRange: 4, los: true, target: 'ally', castsPerTurn: 1,
    tags: ['heal'], effects: [{ type: 'heal', min: 8, max: 10 }],
  },
  // ── Estrato 2: Cavernas del Eco
  mordiscoVampiro: {
    id: 'mordiscoVampiro', name: 'Mordisco Vampírico', icon: 'fang', element: 'water',
    apCost: 3, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'water', min: 7, max: 9, lifesteal: 50 }],
  },
  punetazo: {
    id: 'punetazo', name: 'Puñetazo de Musgo', icon: 'fist', element: 'earth',
    apCost: 4, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'earth', min: 10, max: 12 }, { type: 'push', distance: 1 }],
  },
  chispa: {
    id: 'chispa', name: 'Chispa', icon: 'bolt', element: 'fire',
    apCost: 3, minRange: 2, maxRange: 6, los: true, target: 'enemy', castsPerTurn: 2,
    effects: [{ type: 'damage', element: 'fire', min: 7, max: 9 }],
  },
  redPegajosa: {
    id: 'redPegajosa', name: 'Red Pegajosa', icon: 'web', element: 'air',
    apCost: 3, minRange: 1, maxRange: 4, los: true, target: 'enemy', castsPerTurn: 1, cooldown: 1,
    effects: [{ type: 'damage', element: 'air', min: 4, max: 6 }, { type: 'status', status: 'tejida', duration: 1 }],
  },
  mordiscoArana: {
    id: 'mordiscoArana', name: 'Mordisco', icon: 'fang', element: 'earth',
    apCost: 2, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'earth', min: 6, max: 7 }],
  },
  golpeSombrio: {
    id: 'golpeSombrio', name: 'Golpe Sombrío', icon: 'fang', element: 'air',
    apCost: 3, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'air', min: 8, max: 10 }],
  },
  parpadeo: {
    id: 'parpadeo', name: 'Parpadeo', icon: 'jump', element: 'neutral',
    apCost: 2, minRange: 1, maxRange: 3, los: false, target: 'emptyCell', castsPerTurn: 1, cooldown: 2,
    tags: ['mobility'], effects: [{ type: 'teleport' }],
  },
  punetazoTelurico: {
    id: 'punetazoTelurico', name: 'Puñetazo Telúrico', icon: 'quake', element: 'earth',
    apCost: 5, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1,
    area: { shape: 'circle', size: 1 },
    effects: [{ type: 'damage', element: 'earth', min: 12, max: 14 }, { type: 'push', distance: 1, from: 'center' }],
  },
  bolaFuego: {
    id: 'bolaFuego', name: 'Bola de Fuego', icon: 'burst', element: 'fire',
    apCost: 4, minRange: 2, maxRange: 6, los: true, target: 'cell', castsPerTurn: 1,
    area: { shape: 'circle', size: 1 },
    effects: [{ type: 'damage', element: 'fire', min: 9, max: 11 }],
  },
  invocarKobold: {
    id: 'invocarKobold', name: 'Llamar Refuerzos', icon: 'shout', element: 'neutral',
    apCost: 3, minRange: 1, maxRange: 2, los: true, target: 'emptyCell', castsPerTurn: 1, cooldown: 4,
    tags: ['summon'], effects: [{ type: 'summon', monster: 'koboldChispero' }],
  },
  mordiscoAranita: {
    id: 'mordiscoAranita', name: 'Mordisquito', icon: 'fang', element: 'air',
    apCost: 3, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'air', min: 4, max: 6 }],
  },

  // ── Jefe: Bramador
  colmillo: {
    id: 'colmillo', name: 'Colmillo Ancestral', icon: 'fang', element: 'earth',
    apCost: 4, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'earth', min: 12, max: 15 }],
  },
  bramido: {
    id: 'bramido', name: 'Bramido', icon: 'shout', element: 'neutral',
    desc: 'Aturde de miedo: quita 2 PM a los enemigos cercanos.',
    apCost: 2, minRange: 0, maxRange: 0, los: false, target: 'self', castsPerTurn: 1, cooldown: 3,
    area: { shape: 'circle', size: 2 },
    effects: [{ type: 'mp', value: -2 }],
  },
  cargaBramador: {
    id: 'cargaBramador', name: 'Carga Ancestral', icon: 'push', element: 'earth',
    desc: 'Anuncia una carga en línea recta que se ejecuta al inicio de su próximo turno. Si choca contra un obstáculo queda Aturdido.',
    apCost: 0, minRange: 1, maxRange: 20, los: false, target: 'cell', castsPerTurn: 1, cooldown: 2,
    telegraph: { kind: 'charge' },
    effects: [{
      type: 'charge',
      hit: [{ type: 'damage', element: 'earth', min: 16, max: 20 }, { type: 'push', distance: 2 }],
      wallSelfDamage: 25,
      wallStatus: [{ status: 'aturdido', duration: 1 }, { status: 'vulnerable', value: 25, duration: 2 }],
    }],
  },
  temblor: {
    id: 'temblor', name: 'Temblor', icon: 'quake', element: 'earth',
    desc: 'Marca una zona que se derrumba al inicio de su próximo turno.',
    apCost: 0, minRange: 0, maxRange: 20, los: false, target: 'cell', castsPerTurn: 1, cooldown: 2,
    area: { shape: 'circle', size: 2 },
    telegraph: { kind: 'area' },
    effects: [{ type: 'damage', element: 'earth', min: 14, max: 17 }],
  },

  // ── Jefe: Tejedora de Pesadillas
  mordiscoVenenoso: {
    id: 'mordiscoVenenoso', name: 'Mordisco Venenoso', icon: 'fang', element: 'water',
    apCost: 4, minRange: 1, maxRange: 1, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [{ type: 'damage', element: 'water', min: 10, max: 13 }, { type: 'status', status: 'veneno', value: 4, stacks: 1, duration: 3 }],
  },
  hiloSeda: {
    id: 'hiloSeda', name: 'Hilo de Seda', icon: 'chain', element: 'air',
    apCost: 3, minRange: 2, maxRange: 6, los: true, target: 'enemy', castsPerTurn: 1, cooldown: 1,
    effects: [{ type: 'damage', element: 'air', min: 8, max: 10 }, { type: 'pull', distance: 2 }],
  },
  redTejida: {
    id: 'redTejida', name: 'Red Tejida', icon: 'web', element: 'air',
    desc: 'Marca una zona en cruz: al inicio de su próximo turno atrapa y daña a quien siga dentro.',
    apCost: 0, minRange: 0, maxRange: 20, los: false, target: 'cell', castsPerTurn: 1, cooldown: 2,
    area: { shape: 'cross', size: 2 },
    telegraph: { kind: 'area' },
    effects: [{ type: 'damage', element: 'air', min: 11, max: 14 }, { type: 'status', status: 'tejida', duration: 1 }],
  },
  ponerHuevos: {
    id: 'ponerHuevos', name: 'Puesta', icon: 'egg', element: 'neutral',
    desc: 'Pone un saco de huevos que eclosiona en 2 turnos si no se destruye.',
    apCost: 2, minRange: 1, maxRange: 6, los: false, target: 'emptyCell', castsPerTurn: 1, cooldown: 3,
    tags: ['summon'], effects: [{ type: 'summon', monster: 'huevoArana' }],
  },
};
