// ENSALMADOR — Sanador de Palabras (arquetipo: Aniripsa).
// Identidad: desgaste y supervivencia. La sobrecuración se convierte en escudo.

export const ENSALMADOR_SPELLS = {
  palabraCurativa: {
    id: 'palabraCurativa', name: 'Palabra Curativa', icon: 'heart', element: 'fire',
    desc: 'Cura a un aliado o a ti mismo.',
    apCost: 3, minRange: 0, maxRange: 5, rangeMod: true, los: true, target: 'ally', castsPerTurn: 2, crit: 10,
    tags: ['heal'],
    effects: [{ type: 'heal', min: 11, max: 14 }],
    variants: [
      {
        id: 'palabraBendita', name: 'Palabra Bendita', desc: 'Cura a los aliados y daña a los enemigos en un círculo.',
        patch: {
          set: { target: 'cell', area: { shape: 'circle', size: 1 } },
          effects: [
            { type: 'heal', min: 8, max: 10 },
            { type: 'damage', element: 'water', min: 6, max: 8 },
          ],
        },
      },
    ],
  },
  palabraHiriente: {
    id: 'palabraHiriente', name: 'Palabra Hiriente', icon: 'bolt', element: 'fire',
    desc: 'Palabra cargada de fuego.',
    apCost: 3, minRange: 1, maxRange: 6, rangeMod: true, los: true, target: 'enemy', castsPerTurn: 2, crit: 5,
    effects: [{ type: 'damage', element: 'fire', min: 12, max: 15 }],
    variants: [
      {
        id: 'palabraVampirica', name: 'Palabra Vampírica', desc: 'Se vuelve de Agua y te cura el 50% del daño.',
        patch: { set: { element: 'water' }, effects: [{ type: 'damage', element: 'water', min: 10, max: 13, lifesteal: 50 }] },
      },
    ],
  },
  palabraHelada: {
    id: 'palabraHelada', name: 'Palabra Helada', icon: 'snow', element: 'water',
    desc: 'Daña y quita 1 PM al objetivo.',
    apCost: 4, minRange: 2, maxRange: 5, rangeMod: true, los: true, target: 'enemy', castsPerTurn: 1,
    effects: [
      { type: 'damage', element: 'water', min: 15, max: 18 },
      { type: 'mp', value: -1 },
    ],
    variants: [
      {
        id: 'palabraGlacial', name: 'Palabra Glacial', desc: 'Área en cruz, sin robo de PM.',
        patch: { set: { target: 'cell', area: { shape: 'cross', size: 1 } }, effects: [{ type: 'damage', element: 'water', min: 11, max: 13 }] },
      },
    ],
  },
  conejo: {
    id: 'conejo', name: 'Conejito Sanador', icon: 'bunny', element: 'neutral',
    desc: 'Invoca un conejito que cura a tus aliados cada turno.',
    apCost: 3, minRange: 1, maxRange: 2, los: true, target: 'emptyCell', castsPerTurn: 1, cooldown: 4,
    tags: ['summon'],
    effects: [{ type: 'summon', monster: 'conejoSanador' }],
  },
  palabraEstimulante: {
    id: 'palabraEstimulante', name: 'Palabra Estimulante', icon: 'up', element: 'neutral',
    desc: '+20% de daño y +1 PM durante un turno.',
    apCost: 2, minRange: 0, maxRange: 4, los: true, target: 'ally', castsPerTurn: 1, cooldown: 3,
    tags: ['buff'],
    effects: [
      { type: 'status', status: 'estimulo', value: 20, duration: 1 },
      { type: 'mp', value: 1 },
    ],
  },
  palabraProhibida: {
    id: 'palabraProhibida', name: 'Palabra Prohibida', icon: 'burst', element: 'fire',
    desc: 'Explosión de fuego en círculo.',
    apCost: 5, minRange: 1, maxRange: 4, los: true, target: 'cell', castsPerTurn: 1, cooldown: 2,
    area: { shape: 'circle', size: 1 },
    effects: [{ type: 'damage', element: 'fire', min: 15, max: 18 }],
  },
  palabraRevitalizante: {
    id: 'palabraRevitalizante', name: 'Palabra Revitalizante', icon: 'heart', element: 'water',
    desc: 'Cura el 25% de la vida máxima del objetivo.',
    apCost: 4, minRange: 0, maxRange: 3, los: true, target: 'ally', castsPerTurn: 1, cooldown: 4,
    tags: ['heal'],
    effects: [{ type: 'heal', value: { from: 'targetMaxHp', pct: 25 } }],
  },
  palabraAtronadora: {
    id: 'palabraAtronadora', name: 'Palabra Atronadora', icon: 'push', element: 'water',
    desc: 'Empuja 2 casillas al objetivo.',
    apCost: 3, minRange: 1, maxRange: 3, los: true, inLine: true, target: 'enemy', castsPerTurn: 1,
    effects: [
      { type: 'damage', element: 'water', min: 8, max: 10 },
      { type: 'push', distance: 2 },
    ],
  },
  murallaSilencio: {
    id: 'murallaSilencio', name: 'Muralla de Silencio', icon: 'shield', element: 'neutral',
    desc: 'Otorga un escudo de 20 + 10% de la vida máxima durante 2 turnos.',
    apCost: 3, minRange: 0, maxRange: 4, los: true, target: 'ally', castsPerTurn: 1, cooldown: 3,
    tags: ['buff'],
    effects: [{ type: 'shield', value: { from: 'targetMaxHp', pct: 10, flat: 20 }, duration: 2 }],
  },
};

export const ENSALMADOR = {
  id: 'ensalmador',
  name: 'Ensalmador',
  title: 'Sanador de Palabras',
  archetype: 'Aniripsa',
  color: '#e86fb0',
  sprite: 'healer',
  desc: 'Pronuncia palabras que curan o hieren. Cada cura sobrante se convierte en escudo: gana los combates por desgaste.',
  playstyle: ['Curación', 'Soporte', 'Supervivencia'],
  baseStats: {
    hp: 110, ap: 6, mp: 3, range: 0, intelligence: 20, chance: 10,
    crit: 5, lock: 8, dodge: 14, initiative: 90, summons: 1, overhealShieldPct: 20,
  },
  hpPerLevel: 7,
  preferredElements: ['fire', 'water', 'air', 'earth'],
  passive: {
    id: 'pasivaEnsalmo', name: 'Ensalmo',
    desc: 'La curación que excede la vida máxima se convierte en escudo (hasta el 20% de la vida máxima del objetivo).',
    triggers: [
      {
        event: 'healDone', conditions: [{ type: 'overheal' }],
        actions: [{ type: 'shield', target: 'payloadTarget', value: { from: 'overheal', pct: 100 }, capPctStat: 'overhealShieldPct', duration: 2 }],
        silent: true,
      },
    ],
  },
  startingSpells: ['palabraCurativa', 'palabraHiriente', 'palabraHelada', 'conejo', 'palabraEstimulante'],
  learnableSpells: ['palabraProhibida', 'palabraRevitalizante', 'palabraAtronadora', 'murallaSilencio'],
  weaponAffinity: { staff: 15, wand: 15 },
  startingWeapon: 'bastonNovicio',
  talents: [
    {
      id: 'canticoMordaz', name: 'Cántico Mordaz', desc: 'Al curar, el enemigo más cercano (a 4 casillas o menos) recibe el 40% como daño de Fuego.',
      triggers: [{
        event: 'healDone', conditions: [{ type: 'notTriggered' }],
        actions: [{ type: 'damage', target: 'nearestEnemy', radius: 4, element: 'fire', fixed: true, value: { from: 'rawHeal', pct: 40 } }],
      }],
    },
    {
      id: 'resiliencia', name: 'Resiliencia', desc: '+15% de curas y +1 invocación.',
      stats: { healPct: 15, summons: 1 },
    },
    {
      id: 'auraProtectora', name: 'Aura Protectora', desc: 'Al inicio de tu turno ganas un escudo del 6% de tu vida máxima.',
      triggers: [{ event: 'turnStart', actions: [{ type: 'shield', target: 'self', value: { from: 'ownerMaxHp', pct: 6 }, duration: 1 }] }],
    },
    {
      id: 'dobleVerbo', name: 'Doble Verbo', desc: 'Tu primer hechizo de curación de cada turno te devuelve 1 PA.',
      triggers: [{
        event: 'castSpell', conditions: [{ type: 'spellTag', tag: 'heal' }],
        actions: [{ type: 'ap', target: 'self', value: 1 }], limit: { perTurn: 1 },
      }],
    },
    {
      id: 'ensalmoSuperior', name: 'Ensalmo Superior', desc: 'El tope de escudo de Ensalmo sube al 40%.',
      stats: { overhealShieldPct: 20 },
    },
    {
      id: 'lecturaAlma', name: 'Lectura del Alma', desc: '+6% de crítico. Tus golpes críticos te curan 6 PV.',
      stats: { crit: 6 },
      triggers: [{ event: 'dealDamage', conditions: [{ type: 'isCrit' }], actions: [{ type: 'heal', target: 'self', value: 6, fixed: true }] }],
    },
  ],
  origins: [
    { id: 'novicio', name: 'Novicio', desc: 'Bastón de novicio y el kit clásico.' },
    {
      id: 'penitente', name: 'Penitente', desc: 'Empieza con Palabra Atronadora en lugar de Palabra Estimulante y con la reliquia Corazón de Larva.',
      unlock: 'origin_ensalmador_penitente',
      replaceSpells: { palabraEstimulante: 'palabraAtronadora' },
      startingRelics: ['corazonLarva'],
    },
  ],
};
