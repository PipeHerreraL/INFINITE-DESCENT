// Modificadores de combate (salas de élite, desafío y pisos profundos).
// Se aplican como fuentes a las unidades del bando indicado.
export const COMBAT_MODIFIERS = {
  nieblaOnirica: {
    id: 'nieblaOnirica', name: 'Niebla Onírica', desc: 'Todas las unidades: -2 de Alcance.',
    all: { stats: { range: -2 } },
  },
  tierraFertil: {
    id: 'tierraFertil', name: 'Tierra Fértil', desc: 'Todas las curas: +30%.',
    all: { stats: { healPct: 30 } },
  },
  furiaSalvaje: {
    id: 'furiaSalvaje', name: 'Furia Salvaje', desc: 'Enemigos: +20% de daño. El botín mejora.',
    enemies: { stats: { dmgPct: 20 } }, rarityBonus: 1,
  },
  escudosBruma: {
    id: 'escudosBruma', name: 'Escudos de Bruma', desc: 'Los enemigos empiezan con un escudo del 20% de su vida.',
    enemies: { triggers: [{ event: 'combatJoin', actions: [{ type: 'shield', target: 'self', value: { from: 'ownerMaxHp', pct: 20 }, duration: 3 }] }] },
  },
  gravedadIntensa: {
    id: 'gravedadIntensa', name: 'Gravedad Intensa', desc: 'Todas las unidades: +15 Daños de empuje.',
    all: { stats: { pushDamage: 15 } },
  },
  frenesi: {
    id: 'frenesi', name: 'Frenesí', desc: 'Todas las unidades: +1 PM.',
    all: { stats: { mp: 1 } },
  },
  lunaRoja: {
    id: 'lunaRoja', name: 'Luna Roja', desc: 'Todas las unidades: +15% de crítico.',
    all: { stats: { crit: 15 } },
  },
  espinasOniricas: {
    id: 'espinasOniricas', name: 'Espinas Oníricas', desc: 'Los enemigos devuelven el 30% del daño cuerpo a cuerpo.',
    enemies: { triggers: [{ event: 'combatJoin', actions: [{ type: 'status', target: 'self', status: 'espinas', duration: -1 }] }] },
  },
};

export const ELITE_MODIFIERS = ['furiaSalvaje', 'escudosBruma', 'lunaRoja', 'espinasOniricas', 'frenesi'];
export const CHALLENGE_MODIFIERS = ['nieblaOnirica', 'furiaSalvaje', 'escudosBruma', 'gravedadIntensa', 'frenesi', 'espinasOniricas'];
export const FLOOR_MODIFIERS = ['tierraFertil', 'gravedadIntensa', 'lunaRoja', 'nieblaOnirica'];
