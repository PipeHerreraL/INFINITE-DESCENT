// Runas de hechizo: mejoras genéricas aplicables a cualquier hechizo que cumpla
// los requisitos. Máximo 2 runas por hechizo y cada runa solo una vez.
// patch: set (reemplaza), add (suma numérica), scaleEffects (multiplica daño/cura base).
export const MAX_RUNES_PER_SPELL = 2;

export const SPELL_RUNES = {
  runaAlcance: {
    id: 'runaAlcance', name: 'Runa de Alcance', desc: '+1 de alcance máximo.',
    requires: { minMaxRange: 2 }, patch: { add: { maxRange: 1 } },
  },
  runaEficiencia: {
    id: 'runaEficiencia', name: 'Runa de Eficiencia', desc: '-1 PA de coste.',
    requires: { minAp: 3 }, patch: { add: { apCost: -1 } },
  },
  runaPoder: {
    id: 'runaPoder', name: 'Runa de Poder', desc: '+20% de daño y curación base.',
    requires: { hasEffect: ['damage', 'heal', 'shield'] }, patch: { scaleEffects: 1.2 },
  },
  runaRepeticion: {
    id: 'runaRepeticion', name: 'Runa de Repetición', desc: '+1 lanzamiento por turno.',
    requires: { noCooldown: true }, patch: { add: { castsPerTurn: 1 } },
  },
  runaFantasmal: {
    id: 'runaFantasmal', name: 'Runa Fantasmal', desc: 'Ya no necesita línea de visión.',
    requires: { los: true, minMaxRange: 2 }, patch: { set: { los: false } },
  },
  runaPremura: {
    id: 'runaPremura', name: 'Runa de Premura', desc: '-1 turno de enfriamiento.',
    requires: { minCooldown: 2 }, patch: { add: { cooldown: -1 } },
  },
  runaAfilada: {
    id: 'runaAfilada', name: 'Runa Afilada', desc: '+15% de probabilidad de crítico.',
    requires: { hasEffect: ['damage', 'heal'] }, patch: { add: { crit: 15 } },
  },
  runaAmplitud: {
    id: 'runaAmplitud', name: 'Runa de Amplitud', desc: 'El alcance pasa a ser modificable por la estadística de Alcance.',
    requires: { minMaxRange: 2, rangeMod: false }, patch: { set: { rangeMod: true } },
  },
  runaLiberadora: {
    id: 'runaLiberadora', name: 'Runa Liberadora', desc: 'Ya no necesita lanzarse en línea.',
    requires: { inLine: true }, patch: { set: { inLine: false } },
  },
};
