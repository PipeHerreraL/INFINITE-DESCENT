// Monstruos, invocaciones y jefes. Todo es original (inspirado en familias
// clásicas de Dofus: aves, larvas, setas, jabalíes, gelatinas…).
// ai.profile: melee | ranged | support | summoner | static | boss
// cost: peso para el presupuesto de encuentros.

export const MONSTERS = {
  // ── Praderas del Ensueño
  plumin: {
    id: 'plumin', name: 'Plumín', family: 'Aves', tier: 'normal', cost: 1, xp: 4,
    sprite: { shape: 'bird', color: '#f7d046', accent: '#f08c2e' },
    desc: 'Pajarillo nervioso. Rápido, frágil y muy molesto.',
    stats: { hp: 22, ap: 4, mp: 4, lock: 6, dodge: 18, initiative: 130, resAir: 10 },
    spells: ['picotazo'], ai: { profile: 'melee' },
  },
  larvazul: {
    id: 'larvazul', name: 'Larvazul', family: 'Larvas', tier: 'normal', cost: 1.5, xp: 5,
    sprite: { shape: 'larva', color: '#5aa9e6', accent: '#2c6e9b' },
    desc: 'Lenta y resistente. Su mordisco envenena.',
    stats: { hp: 34, ap: 4, mp: 2, lock: 12, dodge: 5, initiative: 60, resWater: 15, resEarth: 5 },
    spells: ['mordiscoViscoso'], ai: { profile: 'melee' },
  },
  setaBruja: {
    id: 'setaBruja', name: 'Seta Bruja', family: 'Setas', tier: 'normal', cost: 1.5, xp: 5,
    sprite: { shape: 'mushroom', color: '#c0392b', accent: '#f5e6c8' },
    desc: 'Mantiene la distancia, frena con esporas y cura a sus aliados.',
    stats: { hp: 26, ap: 6, mp: 2, lock: 4, dodge: 8, initiative: 80, resEarth: 10, resAir: 5 },
    spells: ['esporas', 'esporasCurativas'], ai: { profile: 'support', preferredRange: 4 },
  },
  jabalinete: {
    id: 'jabalinete', name: 'Jabalinete', family: 'Jabalíes', tier: 'normal', cost: 2, xp: 6,
    sprite: { shape: 'boar', color: '#8d5a3b', accent: '#e9d8a6' },
    desc: 'Embiste en línea recta. No te quedes alineado.',
    stats: { hp: 34, ap: 7, mp: 3, lock: 15, dodge: 8, initiative: 95, resEarth: 10, resNeutral: 10 },
    spells: ['embestida', 'cornada'], ai: { profile: 'melee' },
  },
  bloblin: {
    id: 'bloblin', name: 'Bloblín', family: 'Gelatinas', tier: 'normal', cost: 1.5, xp: 5,
    sprite: { shape: 'blob', color: '#7bd389', accent: '#3a7d44' },
    desc: 'Al morir se divide en dos bloblines pequeños.',
    stats: { hp: 28, ap: 4, mp: 3, lock: 8, dodge: 8, initiative: 70, resWater: 10, resFire: -10 },
    spells: ['salpicon'], ai: { profile: 'melee' },
    passives: [{
      name: 'División', desc: 'Al morir se divide en dos bloblines pequeños.',
      triggers: [{ event: 'death', actions: [{ type: 'summon', monster: 'bloblinMini', count: 2, target: 'aroundSelf' }] }],
    }],
  },
  pluminAlfa: {
    id: 'pluminAlfa', name: 'Plumín Alfa', family: 'Aves', tier: 'elite', cost: 4, xp: 14,
    sprite: { shape: 'bird', color: '#ff9f1c', accent: '#d62828', crest: true },
    desc: 'Líder de bandada. Su graznido enardece a los suyos.',
    stats: { hp: 58, ap: 6, mp: 5, lock: 12, dodge: 25, initiative: 150, resAir: 15 },
    spells: ['picotazoAlfa', 'graznido'], ai: { profile: 'melee' },
  },
  jabaliAcorazado: {
    id: 'jabaliAcorazado', name: 'Jabalí Acorazado', family: 'Jabalíes', tier: 'elite', cost: 4, xp: 15,
    sprite: { shape: 'boar', color: '#5c4033', accent: '#b0b0b0', armor: true },
    desc: 'Se cubre de corteza al inicio de cada turno.',
    stats: { hp: 82, ap: 7, mp: 3, lock: 25, dodge: 5, initiative: 85, resEarth: 15, resNeutral: 15 },
    spells: ['embestida', 'cornada'], ai: { profile: 'melee' },
    passives: [{
      name: 'Corteza', desc: 'Al inicio de su turno gana un escudo del 10% de su vida máxima.',
      triggers: [{ event: 'turnStart', actions: [{ type: 'shield', target: 'self', value: { from: 'ownerMaxHp', pct: 10 }, duration: 1 }] }],
    }],
  },
  setaAnciana: {
    id: 'setaAnciana', name: 'Seta Anciana', family: 'Setas', tier: 'elite', cost: 4, xp: 15,
    sprite: { shape: 'mushroom', color: '#6a4c93', accent: '#f1e3f3', big: true },
    desc: 'Envenena el aire y hace germinar setitas.',
    stats: { hp: 64, ap: 7, mp: 1, lock: 10, dodge: 5, initiative: 70, resEarth: 15, resWater: 10 },
    spells: ['esporaToxica', 'invocarSetita'], ai: { profile: 'summoner', preferredRange: 4 },
  },

  // ── Cavernas del Eco
  murcielagoEco: {
    id: 'murcielagoEco', name: 'Murciélago del Eco', family: 'Murciélagos', tier: 'normal', cost: 1.5, xp: 7,
    sprite: { shape: 'bat', color: '#4a4e69', accent: '#c9184a' },
    desc: 'Se cura con cada mordisco.',
    stats: { hp: 30, ap: 5, mp: 5, lock: 8, dodge: 25, initiative: 140, resAir: 15 },
    spells: ['mordiscoVampiro'], ai: { profile: 'melee' },
  },
  golemMusgo: {
    id: 'golemMusgo', name: 'Gólem de Musgo', family: 'Gólems', tier: 'normal', cost: 2.5, xp: 9,
    sprite: { shape: 'golem', color: '#6a994e', accent: '#a7c957' },
    desc: 'Lento e inamovible. Golpea fuerte y aparta.',
    stats: { hp: 62, ap: 5, mp: 2, lock: 30, dodge: 0, initiative: 40, resEarth: 20, resNeutral: 15, pushRes: 20 },
    spells: ['punetazo'], ai: { profile: 'melee' },
    passives: [{
      name: 'Inamovible', desc: 'No puede ser desplazado.',
      triggers: [{ event: 'combatJoin', actions: [{ type: 'status', target: 'self', status: 'estabilizado', duration: -1 }] }],
    }],
  },
  koboldChispero: {
    id: 'koboldChispero', name: 'Kobold Chispero', family: 'Kobolds', tier: 'normal', cost: 2, xp: 8,
    sprite: { shape: 'kobold', color: '#e76f51', accent: '#f4a261' },
    desc: 'Lanza chispas desde lejos y huye del cuerpo a cuerpo.',
    stats: { hp: 30, ap: 6, mp: 3, lock: 5, dodge: 15, initiative: 100, resFire: 15 },
    spells: ['chispa'], ai: { profile: 'ranged', preferredRange: 4 },
  },
  aranaTejedora: {
    id: 'aranaTejedora', name: 'Arácnida Tejedora', family: 'Arácnidos', tier: 'normal', cost: 2, xp: 8,
    sprite: { shape: 'spider', color: '#3d405b', accent: '#e07a5f' },
    desc: 'Enreda a sus presas para que no escapen.',
    stats: { hp: 34, ap: 5, mp: 3, lock: 18, dodge: 12, initiative: 110, resAir: 10, resEarth: 10 },
    spells: ['redPegajosa', 'mordiscoArana'], ai: { profile: 'ranged', preferredRange: 2 },
  },
  sombraOnirica: {
    id: 'sombraOnirica', name: 'Sombra Onírica', family: 'Sombras', tier: 'normal', cost: 1.5, xp: 7,
    sprite: { shape: 'shade', color: '#5e548e', accent: '#e0b1cb' },
    desc: 'Parpadea por el tablero. Difícil de placar.',
    stats: { hp: 26, ap: 6, mp: 4, lock: 6, dodge: 40, initiative: 125, resNeutral: 20 },
    spells: ['golpeSombrio', 'parpadeo'], ai: { profile: 'melee' },
  },
  golemAncestral: {
    id: 'golemAncestral', name: 'Gólem Ancestral', family: 'Gólems', tier: 'elite', cost: 5, xp: 22,
    sprite: { shape: 'golem', color: '#495057', accent: '#ffd166', big: true },
    desc: 'Una montaña que camina. Se acoraza y aplasta en área.',
    stats: { hp: 140, ap: 6, mp: 2, lock: 35, dodge: 0, initiative: 50, resEarth: 25, resNeutral: 20, resFire: 10, pushRes: 30 },
    spells: ['punetazoTelurico'], ai: { profile: 'melee' },
    passives: [
      {
        name: 'Inamovible', desc: 'No puede ser desplazado.',
        triggers: [{ event: 'combatJoin', actions: [{ type: 'status', target: 'self', status: 'estabilizado', duration: -1 }] }],
      },
      {
        name: 'Coraza', desc: 'Al inicio de su turno gana un escudo del 8% de su vida máxima.',
        triggers: [{ event: 'turnStart', actions: [{ type: 'shield', target: 'self', value: { from: 'ownerMaxHp', pct: 8 }, duration: 1 }] }],
      },
    ],
  },
  brujoKobold: {
    id: 'brujoKobold', name: 'Brujo Kobold', family: 'Kobolds', tier: 'elite', cost: 5, xp: 22,
    sprite: { shape: 'kobold', color: '#9d0208', accent: '#ffba08', big: true },
    desc: 'Bombardea con fuego y llama refuerzos.',
    stats: { hp: 78, ap: 8, mp: 3, lock: 10, dodge: 15, initiative: 105, resFire: 20, resWater: -10 },
    spells: ['bolaFuego', 'invocarKobold'], ai: { profile: 'summoner', preferredRange: 4 },
  },

  // ── Invocaciones
  conejoSanador: {
    id: 'conejoSanador', name: 'Conejito Sanador', family: 'Invocaciones', tier: 'summon', xp: 0,
    sprite: { shape: 'bunny', color: '#ffffff', accent: '#ffafcc' },
    desc: 'Cura a los aliados heridos.',
    stats: { hp: 30, ap: 4, mp: 3, lock: 0, dodge: 20, initiative: 50 },
    spells: ['curaConejo'], ai: { profile: 'support', preferredRange: 3, healer: true },
    scaleWithSummoner: { hpPerLevel: 4 },
  },
  setita: {
    id: 'setita', name: 'Setita', family: 'Setas', tier: 'summon', xp: 1,
    sprite: { shape: 'mushroom', color: '#9b5de5', accent: '#f1e3f3', small: true },
    stats: { hp: 16, ap: 4, mp: 3, lock: 4, dodge: 5, initiative: 40 },
    spells: ['picadura'], ai: { profile: 'melee' },
  },
  bloblinMini: {
    id: 'bloblinMini', name: 'Bloblín pequeño', family: 'Gelatinas', tier: 'summon', xp: 1,
    sprite: { shape: 'blob', color: '#a7e8b0', accent: '#3a7d44', small: true },
    stats: { hp: 10, ap: 3, mp: 3, lock: 2, dodge: 5, initiative: 60 },
    spells: ['salpiconMini'], ai: { profile: 'melee' },
  },
  aranita: {
    id: 'aranita', name: 'Arañita', family: 'Arácnidos', tier: 'summon', xp: 1,
    sprite: { shape: 'spider', color: '#6d6875', accent: '#e5989b', small: true },
    stats: { hp: 14, ap: 4, mp: 4, lock: 6, dodge: 10, initiative: 90 },
    spells: ['mordiscoAranita'], ai: { profile: 'melee' },
  },
  huevoArana: {
    id: 'huevoArana', name: 'Saco de Huevos', family: 'Arácnidos', tier: 'summon', xp: 1,
    sprite: { shape: 'egg', color: '#f1faee', accent: '#e9c46a' },
    desc: 'Eclosiona al final de su segundo turno. ¡Destrúyelo antes!',
    stats: { hp: 24, ap: 0, mp: 0, lock: 0, dodge: 0, initiative: 1, resNeutral: 0 },
    spells: [], ai: { profile: 'static' },
    passives: [{
      name: 'Incubación', desc: 'Eclosiona en 2 turnos.',
      triggers: [{ event: 'combatJoin', actions: [{ type: 'status', target: 'self', status: 'eclosion', duration: 2 }] }],
    }],
  },

  // ── Jefes
  bramador: {
    id: 'bramador', name: 'Bramador, el Jabalí Ancestral', family: 'Jabalíes', tier: 'boss', xp: 60,
    sprite: { shape: 'boar', color: '#6b2d1a', accent: '#ffd166', big: true, boss: true },
    desc: 'Anuncia sus cargas con una línea roja. Si se estrella contra un pilar queda aturdido y vulnerable. Por debajo del 50% de vida entra en furia, llama a una cría y hace temblar el suelo.',
    stats: { hp: 230, ap: 6, mp: 3, lock: 30, dodge: 10, initiative: 80, resEarth: 15, resNeutral: 15, resFire: 5, pushRes: 25 },
    spells: ['colmillo', 'bramido', 'cargaBramador'],
    ai: { profile: 'boss', telegraphs: ['cargaBramador'] },
    phases: [{
      hpBelowPct: 50, name: 'Furia Ancestral',
      log: '¡Bramador entra en Furia Ancestral y llama a una cría!',
      onEnter: [
        { type: 'status', target: 'self', status: 'furiaAncestral', duration: -1 },
        { type: 'summon', monster: 'jabalinete', count: 1, target: 'aroundSelf' },
      ],
      addSpells: ['temblor'],
      telegraphs: ['cargaBramador', 'temblor'],
    }],
  },
  tejedora: {
    id: 'tejedora', name: 'La Tejedora de Pesadillas', family: 'Arácnidos', tier: 'boss', xp: 90,
    sprite: { shape: 'spider', color: '#22223b', accent: '#c77dff', big: true, boss: true },
    desc: 'Teje redes anunciadas que atrapan a quien se quede dentro y pone sacos de huevos que eclosionan en 2 turnos. Destrúyelos o te verás rodeado. Al 50% entra en Pesadilla.',
    stats: { hp: 250, ap: 8, mp: 3, lock: 25, dodge: 20, initiative: 120, resAir: 20, resWater: 15, resEarth: 10, pushRes: 20 },
    spells: ['mordiscoVenenoso', 'hiloSeda', 'ponerHuevos', 'redTejida'],
    ai: { profile: 'boss', telegraphs: ['redTejida'], preferredRange: 2 },
    phases: [{
      hpBelowPct: 50, name: 'Pesadilla',
      log: '¡La Tejedora entra en Pesadilla! El tablero se llena de huevos.',
      onEnter: [
        { type: 'status', target: 'self', status: 'furiaAncestral', duration: -1 },
        { type: 'summon', monster: 'huevoArana', count: 3, target: 'nearEnemies' },
      ],
    }],
  },
};
