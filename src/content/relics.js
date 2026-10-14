// Reliquias: pasivas permanentes durante la expedición (sin límite de espacios).
// Tier: common (cofres y mercader), rare (élites) y boss (jefes). Las maldiciones
// (curse) aparecen en eventos y combinan ventaja y desventaja.
export const RELICS = {
  ascuaEterna: {
    id: 'ascuaEterna', name: 'Ascua Eterna', tier: 'rare', icon: 'flame',
    desc: 'Tus golpes críticos provocan una explosión de su mismo elemento: 35% del daño a los enemigos alrededor del objetivo.',
    triggers: [{
      event: 'dealDamage', conditions: [{ type: 'isCrit' }, { type: 'notTriggered' }],
      actions: [{ type: 'damage', target: 'areaAroundTarget', radius: 1, element: 'payload', fixed: true, value: { from: 'amount', pct: 35 } }],
    }],
  },
  colmilloJalabestia: {
    id: 'colmilloJalabestia', name: 'Colmillo de Jalabestia', tier: 'rare', icon: 'fang',
    desc: 'Derrotar a un enemigo te devuelve 2 PA (1 vez por turno).',
    triggers: [{ event: 'kill', actions: [{ type: 'ap', target: 'self', value: 2 }], limit: { perTurn: 1 } }],
  },
  arieteRoble: {
    id: 'arieteRoble', name: 'Ariete de Roble', tier: 'common', icon: 'push',
    desc: '+10 Daños de empuje. Los enemigos que chocan quedan Vulnerables (+15%) durante 1 turno.',
    stats: { pushDamage: 10 },
    triggers: [{ event: 'causeCollision', actions: [{ type: 'status', target: 'payloadTarget', status: 'vulnerable', value: 15, duration: 1 }] }],
  },
  calizInvertido: {
    id: 'calizInvertido', name: 'Cáliz Invertido', tier: 'rare', icon: 'cup',
    desc: 'Al curar, los enemigos adyacentes al objetivo curado reciben el 50% de la cura como daño de Agua.',
    triggers: [{
      event: 'healDone', conditions: [{ type: 'notTriggered' }],
      actions: [{ type: 'damage', target: 'areaAroundTarget', radius: 1, element: 'water', fixed: true, value: { from: 'rawHeal', pct: 50 } }],
    }],
  },
  bateriaArcana: {
    id: 'bateriaArcana', name: 'Batería Arcana', tier: 'common', icon: 'battery',
    desc: 'Lanzar un hechizo de 4 PA o más te da un escudo del 8% de tu vida máxima.',
    triggers: [{
      event: 'castSpell', conditions: [{ type: 'apCostAtLeast', value: 4 }],
      actions: [{ type: 'shield', target: 'self', value: { from: 'ownerMaxHp', pct: 8 }, duration: 1 }],
    }],
  },
  relojAgrietado: {
    id: 'relojAgrietado', name: 'Reloj Agrietado', tier: 'boss', icon: 'clock',
    desc: '+1 PA, pero -15% de vida máxima.',
    stats: { ap: 1, maxHpPct: -15 },
  },
  espejoBruma: {
    id: 'espejoBruma', name: 'Espejo de Bruma', tier: 'common', icon: 'mirror',
    desc: 'La primera vez que bajas del 30% de vida en un combate, ganas un escudo del 25% de tu vida máxima.',
    triggers: [{
      event: 'takeDamage', conditions: [{ type: 'ownerHpBelow', pct: 30 }],
      actions: [{ type: 'shield', target: 'self', value: { from: 'ownerMaxHp', pct: 25 }, duration: 2 }],
      limit: { perCombat: 1 },
    }],
  },
  plumaViento: {
    id: 'plumaViento', name: 'Pluma del Viento', tier: 'boss', icon: 'feather',
    desc: '+1 PM.',
    stats: { mp: 1 },
  },
  corazonLarva: {
    id: 'corazonLarva', name: 'Corazón de Larva', tier: 'common', icon: 'heart',
    desc: 'Al inicio de tu turno te curas el 4% de tu vida máxima.',
    triggers: [{ event: 'turnStart', actions: [{ type: 'heal', target: 'self', value: { from: 'ownerMaxHp', pct: 4 }, fixed: true }] }],
  },
  brujulaRota: {
    id: 'brujulaRota', name: 'Brújula Rota', tier: 'common', icon: 'compass',
    desc: '+2 de Alcance, pero -10% de daño final.',
    stats: { range: 2, dmgPct: -10 },
  },
  dadoTrucado: {
    id: 'dadoTrucado', name: 'Dado Trucado', tier: 'common', icon: 'dice',
    desc: '+8% de crítico y +6 de daños críticos.',
    stats: { crit: 8, critDamage: 6 },
  },
  talismanGloton: {
    id: 'talismanGloton', name: 'Talismán del Glotón', tier: 'common', icon: 'fang',
    desc: 'Derrotar a un enemigo te cura el 8% de tu vida máxima.',
    triggers: [{ event: 'kill', actions: [{ type: 'heal', target: 'self', value: { from: 'ownerMaxHp', pct: 8 }, fixed: true }] }],
  },
  sacoKamas: {
    id: 'sacoKamas', name: 'Saco de Kamas Sin Fondo', tier: 'common', icon: 'coin',
    desc: '+30% de kamas obtenidos.',
    stats: { kamasPct: 30 },
  },
  lupaTasador: {
    id: 'lupaTasador', name: 'Lupa del Tasador', tier: 'common', icon: 'eye',
    desc: 'Los precios de los mercaderes bajan un 20%.',
    stats: { shopDiscount: 20 },
  },
  dienteDragoncerdo: {
    id: 'dienteDragoncerdo', name: 'Diente de Dragoncerdo', tier: 'rare', icon: 'fang',
    desc: 'Tu primer hechizo de cada turno inflige +25%.',
    triggers: [{ event: 'beforeDealDamage', conditions: [{ type: 'firstCastThisTurn' }, { type: 'isSpell' }], actions: [{ type: 'modifyDamage', pct: 25 }] }],
  },
  semillaReactiva: {
    id: 'semillaReactiva', name: 'Semilla Reactiva', tier: 'rare', icon: 'seed',
    desc: 'Cuando un enemigo te golpea cuerpo a cuerpo, lo empujas 1 casilla (máx. 2 por turno).',
    unlock: 'relics_pack1',
    triggers: [{
      event: 'takeDamage', conditions: [{ type: 'isMeleeHit' }, { type: 'notTriggered' }],
      actions: [{ type: 'push', target: 'payloadSource', distance: 1 }], limit: { perTurn: 2 },
    }],
  },
  ojoTormenta: {
    id: 'ojoTormenta', name: 'Ojo de la Tormenta', tier: 'rare', icon: 'eye',
    desc: 'Al inicio de tu turno, el enemigo más cercano a 5 casillas o menos recibe 8 de daño de Aire.',
    unlock: 'relics_pack1',
    triggers: [{ event: 'turnStart', actions: [{ type: 'damage', target: 'nearestEnemy', radius: 5, element: 'air', fixed: true, value: 8 }] }],
  },
  huevoDormido: {
    id: 'huevoDormido', name: 'Huevo Dormido', tier: 'boss', icon: 'egg',
    desc: 'Tus hechizos de curación y escudo son un 30% más potentes. Empiezas cada combate con Regeneración (6 por turno, 3 turnos).',
    unlock: 'relics_pack1',
    stats: { healPct: 30 },
    triggers: [{ event: 'combatStart', actions: [{ type: 'status', target: 'self', status: 'regeneracion', value: 6, duration: 3 }] }],
  },
  // Maldiciones: solo en eventos.
  cascabelPesadilla: {
    id: 'cascabelPesadilla', name: 'Cascabel de Pesadilla', tier: 'curse', icon: 'bell',
    desc: 'Maldición: recibes un 12% más de daño, pero infliges un 18% más.',
    stats: { damageTakenPct: 12, dmgPct: 18 },
  },
  cadenaPlomo: {
    id: 'cadenaPlomo', name: 'Cadena de Plomo', tier: 'curse', icon: 'chain',
    desc: 'Maldición: -1 PM, pero +25 Potencia y no puedes ser desplazado.',
    stats: { mp: -1, power: 25 },
    triggers: [{ event: 'combatStart', actions: [{ type: 'status', target: 'self', status: 'estabilizado', duration: -1 }] }],
  },
};
