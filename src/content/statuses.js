// Estados alterados. Todo efecto continuo se expresa con datos:
// - stats: modificadores por acumulación ('value' usa el valor de la instancia).
// - dot / hot: daño o curación al inicio del turno del portador.
// - skipTurn, preventPush: reglas.
// - consumeOn: el estado se consume al ocurrir un evento del portador.
// - triggers: disparadores mientras el estado está activo.
// - onExpire: efectos al expirar (con el portador como lanzador).
// stack: 'refresh' (renueva duración y valor máx.), 'stack' (suma acumulaciones).
export const STATUSES = {
  quemadura: {
    id: 'quemadura', name: 'Quemadura', kind: 'debuff', color: '#ef5b3a', icon: 'flame',
    stack: 'stack', maxStacks: 5, dot: { element: 'fire' },
    desc: 'Recibe daño de Fuego al inicio de su turno por cada acumulación.',
  },
  veneno: {
    id: 'veneno', name: 'Veneno', kind: 'debuff', color: '#7bc043', icon: 'drop',
    stack: 'stack', maxStacks: 5, dot: { element: 'water' },
    desc: 'Recibe daño de Agua al inicio de su turno por cada acumulación.',
  },
  vulnerable: {
    id: 'vulnerable', name: 'Vulnerable', kind: 'debuff', color: '#e8a33d', icon: 'crack',
    stack: 'refresh', stats: { damageTakenPct: 'value' },
    desc: 'Recibe más daño.',
  },
  debilitado: {
    id: 'debilitado', name: 'Debilitado', kind: 'debuff', color: '#8f8f8f', icon: 'down',
    stack: 'refresh', stats: { dmgPct: '-value' },
    desc: 'Inflige menos daño.',
  },
  aturdido: {
    id: 'aturdido', name: 'Aturdido', kind: 'debuff', color: '#f4d35e', icon: 'stars',
    stack: 'refresh', skipTurn: true, stats: { damageTakenPct: 20 },
    desc: 'Pierde su próximo turno y recibe un 20% más de daño.',
  },
  enraizado: {
    id: 'enraizado', name: 'Enraizado', kind: 'debuff', color: '#6b8e23', icon: 'root',
    stack: 'refresh', stats: { mp: -99 },
    desc: 'No puede moverse.',
  },
  ralentizado: {
    id: 'ralentizado', name: 'Ralentizado', kind: 'debuff', color: '#5a7bd8', icon: 'boot',
    stack: 'stack', maxStacks: 6, stats: { mp: '-value' },
    desc: 'Pierde PM.',
  },
  agotado: {
    id: 'agotado', name: 'Agotado', kind: 'debuff', color: '#3b6fd1', icon: 'star',
    stack: 'stack', maxStacks: 6, stats: { ap: '-value' },
    desc: 'Pierde PA.',
  },
  acelerado: {
    id: 'acelerado', name: 'Acelerado', kind: 'buff', color: '#58c96a', icon: 'boot',
    stack: 'stack', maxStacks: 3, stats: { mp: 'value' },
    desc: 'Gana PM.',
  },
  energizado: {
    id: 'energizado', name: 'Energizado', kind: 'buff', color: '#4aa3ff', icon: 'star',
    stack: 'stack', maxStacks: 3, stats: { ap: 'value' },
    desc: 'Gana PA.',
  },
  potenciado: {
    id: 'potenciado', name: 'Potenciado', kind: 'buff', color: '#ffb347', icon: 'up',
    stack: 'refresh', stats: { power: 'value' },
    desc: 'Gana Potencia.',
  },
  estimulo: {
    id: 'estimulo', name: 'Estímulo', kind: 'buff', color: '#ffd166', icon: 'up',
    stack: 'refresh', stats: { dmgPct: 'value' },
    desc: 'Inflige más daño.',
  },
  ira: {
    id: 'ira', name: 'Ira', kind: 'buff', color: '#e63946', icon: 'flame',
    stack: 'stack', maxStacks: 5, stats: { dmgPct: 4 },
    desc: '+4% de daño por acumulación. Se pierde si terminas el turno sin infligir daño.',
  },
  impulso: {
    id: 'impulso', name: 'Impulso', kind: 'buff', color: '#ff7f50', icon: 'up',
    stack: 'refresh', stats: { meleePct: 25 }, consumeOn: 'castMelee',
    desc: 'El próximo hechizo cuerpo a cuerpo inflige +25%.',
  },
  concentracion: {
    id: 'concentracion', name: 'Concentración', kind: 'buff', color: '#9b5de5', icon: 'up',
    stack: 'refresh', stats: { dmgPct: 'value' }, consumeOn: 'castDamage',
    desc: 'El próximo hechizo de daño inflige más daño.',
  },
  alcanceExtra: {
    id: 'alcanceExtra', name: 'Visión Onírica', kind: 'buff', color: '#7ad3ff', icon: 'eye',
    stack: 'refresh', stats: { range: 'value' }, consumeOn: 'castSpell',
    desc: 'El próximo hechizo gana alcance.',
  },
  estabilizado: {
    id: 'estabilizado', name: 'Estabilizado', kind: 'buff', color: '#a8a8a8', icon: 'anchor',
    stack: 'refresh', preventPush: true,
    desc: 'No puede ser desplazado.',
  },
  regeneracion: {
    id: 'regeneracion', name: 'Regeneración', kind: 'buff', color: '#7ad35f', icon: 'heart',
    stack: 'refresh', hot: true,
    desc: 'Se cura al inicio de su turno.',
  },
  martirio: {
    id: 'martirio', name: 'Martirio', kind: 'buff', color: '#c1121f', icon: 'flame',
    stack: 'stack', maxStacks: 10, stats: { dmgPct: 4 },
    desc: '+4% de daño por acumulación.',
  },
  furiaAncestral: {
    id: 'furiaAncestral', name: 'Furia Ancestral', kind: 'buff', color: '#d62828', icon: 'flame',
    stack: 'refresh', stats: { mp: 1, dmgPct: 15 },
    desc: '+1 PM y +15% de daño.',
  },
  pesadilla: {
    id: 'pesadilla', name: 'Pesadilla Creciente', kind: 'debuff', color: '#5e2b97', icon: 'eye',
    stack: 'stack', maxStacks: 20, stats: { damageTakenPct: 8 },
    desc: 'El sueño se derrumba: +8% de daño recibido por acumulación.',
  },
  tejida: {
    id: 'tejida', name: 'Envuelto en seda', kind: 'debuff', color: '#d8d8f0', icon: 'web',
    stack: 'refresh', stats: { mp: -2, dodge: -20 },
    desc: '-2 PM y -20 Huida.',
  },
  eclosion: {
    id: 'eclosion', name: 'Eclosión', kind: 'debuff', color: '#e9c46a', icon: 'egg',
    stack: 'refresh',
    onExpire: [{ type: 'summon', monster: 'aranita', count: 2, target: 'adjacentFree' }, { type: 'killSelf' }],
    desc: 'Eclosiona cuando expira: libera dos arañitas.',
  },
  espinas: {
    id: 'espinas', name: 'Espinas', kind: 'buff', color: '#2a9d8f', icon: 'shield',
    stack: 'refresh',
    triggers: [{
      event: 'takeDamage', conditions: [{ type: 'isMeleeHit' }, { type: 'notTriggered' }],
      actions: [{ type: 'damage', target: 'payloadSource', element: 'neutral', fixed: true, value: { from: 'amount', pct: 30 } }],
    }],
    desc: 'Devuelve el 30% del daño cuerpo a cuerpo recibido.',
  },
};
