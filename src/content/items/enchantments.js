// Encantamientos: los objetos épicos reciben uno al azar. Añaden un disparador
// que cambia cómo se juega la pieza.
export const ENCHANTMENTS = {
  encEscudoInicial: {
    id: 'encEscudoInicial', name: 'Égida', desc: 'Empiezas cada combate con un escudo del 12% de tu vida máxima.',
    triggers: [{ event: 'combatStart', actions: [{ type: 'shield', target: 'self', value: { from: 'ownerMaxHp', pct: 12 }, duration: 2 }] }],
  },
  encCriticoCura: {
    id: 'encCriticoCura', name: 'Vitalidad Crítica', desc: 'Tus críticos te curan 5 PV (máx. 2 por turno).',
    triggers: [{ event: 'dealDamage', conditions: [{ type: 'isCrit' }], actions: [{ type: 'heal', target: 'self', value: 5, fixed: true }], limit: { perTurn: 2 } }],
  },
  encMuerteMovimiento: {
    id: 'encMuerteMovimiento', name: 'Persecución', desc: 'Al matar a un enemigo: +1 PM (1 vez por turno).',
    triggers: [{ event: 'kill', actions: [{ type: 'mp', target: 'self', value: 1 }], limit: { perTurn: 1 } }],
  },
  encPrimerGolpe: {
    id: 'encPrimerGolpe', name: 'Iniciativa Feroz', desc: 'Tu primer hechizo de cada turno inflige +15%.',
    triggers: [{ event: 'beforeDealDamage', conditions: [{ type: 'firstCastThisTurn' }, { type: 'isSpell' }], actions: [{ type: 'modifyDamage', pct: 15 }] }],
  },
  encVenganza: {
    id: 'encVenganza', name: 'Venganza', desc: 'Al recibir daño: +10% de daño hasta tu próximo turno.',
    triggers: [{
      event: 'takeDamage', conditions: [{ type: 'notTriggered' }],
      actions: [{ type: 'status', target: 'self', status: 'estimulo', value: 10, duration: 1 }], limit: { perTurn: 1 },
    }],
  },
  encDrenaje: { id: 'encDrenaje', name: 'Drenaje', desc: '+5% de robo de vida.', stats: { lifesteal: 5 } },
  encCongelante: {
    id: 'encCongelante', name: 'Escarcha', desc: 'Tus golpes de Agua tienen un 30% de probabilidad de quitar 1 PM.',
    triggers: [{ event: 'dealDamage', chance: 30, conditions: [{ type: 'element', in: ['water'] }, { type: 'notTriggered' }], actions: [{ type: 'mp', target: 'payloadTarget', value: -1 }] }],
  },
  encChispa: {
    id: 'encChispa', name: 'Chispa', desc: 'Tus golpes de Fuego tienen un 30% de probabilidad de aplicar Quemadura.',
    triggers: [{
      event: 'dealDamage', chance: 30, conditions: [{ type: 'element', in: ['fire'] }, { type: 'notTriggered' }],
      actions: [{ type: 'status', target: 'payloadTarget', status: 'quemadura', value: 3, stacks: 1, duration: 2 }],
    }],
  },
  encRafaga: {
    id: 'encRafaga', name: 'Ráfaga', desc: 'Tus golpes de Aire tienen un 30% de probabilidad de empujar 1 casilla.',
    triggers: [{ event: 'dealDamage', chance: 30, conditions: [{ type: 'element', in: ['air'] }, { type: 'notTriggered' }], actions: [{ type: 'push', target: 'payloadTarget', distance: 1 }] }],
  },
  encSismo: {
    id: 'encSismo', name: 'Sismo', desc: 'Tus golpes de Tierra tienen un 30% de probabilidad de dejar Vulnerable (+10%).',
    triggers: [{
      event: 'dealDamage', chance: 30, conditions: [{ type: 'element', in: ['earth'] }, { type: 'notTriggered' }],
      actions: [{ type: 'status', target: 'payloadTarget', status: 'vulnerable', value: 10, duration: 1 }],
    }],
  },
  encImpacto: {
    id: 'encImpacto', name: 'Impacto', desc: 'Las colisiones que provocas infligen 8 de daño adicional.',
    triggers: [{ event: 'causeCollision', conditions: [{ type: 'notTriggered' }], actions: [{ type: 'damage', target: 'payloadTarget', element: 'neutral', fixed: true, value: 8 }] }],
  },
};
