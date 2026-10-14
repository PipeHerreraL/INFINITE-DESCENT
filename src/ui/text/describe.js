import { ELEMENTS } from '../../content/elements.js';
import { STATUSES } from '../../content/statuses.js';
import { MONSTERS } from '../../content/enemies/index.js';
import { formatStat, STATS } from '../../content/stats.js';

// Descripciones legibles generadas a partir de los datos: el texto siempre
// refleja exactamente lo que hace el motor.

export function elementName(el) {
  if (el === 'dominant') return 'tu elemento dominante';
  return ELEMENTS[el]?.name ?? el;
}

function valueText(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'number') return `${Math.round(v)}`;
  if (Array.isArray(v)) return `${v[0]}–${v[1]}`;
  const from = {
    amount: 'del daño',
    overheal: 'de la sobrecuración',
    rawHeal: 'de la cura',
    ownerMaxHp: 'de tu vida máx.',
    targetMaxHp: 'de la vida máx. del objetivo',
    ownerMissingHp: 'de tu vida perdida',
    apCost: 'del coste en PA',
    chainIndex: 'por eslabón de cadena',
  }[v.from] ?? '';
  let s = v.pct !== undefined ? `${v.pct}% ${from}` : v.mult !== undefined ? `${v.mult} ${from}` : from;
  if (v.flat) s = `${v.flat} + ${s}`;
  if (v.multBy === 'adjacentEnemies') s += ' por enemigo adyacente';
  return s.trim();
}

const AFFECTS = { enemies: '', allies: ' (aliados)', all: ' (todos)', notSelf: '' };

export function describeEffect(e, { damage = null } = {}) {
  const affects = e.affects ? AFFECTS[e.affects] ?? '' : '';
  switch (e.type) {
    case 'damage': {
      const range = damage ? `${damage[0]}–${damage[1]}` : e.value !== undefined ? valueText(e.value) : `${e.min}–${e.max}`;
      let s = `Daño ${elementName(e.element === 'payload' ? 'neutral' : e.element)} ${range}${affects}`;
      if (e.element === 'payload') s = `Daño del mismo elemento: ${range}`;
      if (e.growPerCast) s += ` (+${e.growPerCast} por uso)`;
      if (e.lifesteal) s += ` · roba ${e.lifesteal}%`;
      if (e.target === 'areaAroundTarget') s += ` alrededor del objetivo`;
      if (e.target === 'nearestEnemy') s += ` al enemigo más cercano`;
      return s;
    }
    case 'heal':
      return `Cura ${damage ? `${damage[0]}–${damage[1]}` : e.value !== undefined ? valueText(e.value) : `${e.min}–${e.max}`}${affects}`;
    case 'shield':
      return `Escudo de ${valueText(e.value)}${e.duration ? ` (${e.duration} t.)` : ''}`;
    case 'status': {
      const st = STATUSES[e.status];
      const dur = e.duration === -1 ? 'todo el combate' : `${e.duration ?? 1} t.`;
      const val = e.value ? ` ${valueText(e.value)}` : '';
      return `${st?.name ?? e.status}${val}${e.stacks > 1 ? ` ×${e.stacks}` : ''} (${dur})${affects}`;
    }
    case 'removeStatus':
      return `Elimina ${STATUSES[e.status]?.name ?? e.status}`;
    case 'push':
      return `Empuja ${e.distance ?? 1} casilla${(e.distance ?? 1) > 1 ? 's' : ''}${e.from === 'center' ? ' desde el centro' : ''}${affects}`;
    case 'pull':
      return `Atrae ${e.distance ?? 1} casilla${(e.distance ?? 1) > 1 ? 's' : ''}`;
    case 'teleport':
      return 'Teletransporta al lanzador';
    case 'swap':
      return 'Intercambia posiciones';
    case 'ap': {
      const v = typeof e.value === 'number' ? e.value : valueText(e.value);
      return `${typeof v === 'number' && v > 0 ? '+' : ''}${v} PA`;
    }
    case 'mp': {
      const v = typeof e.value === 'number' ? e.value : valueText(e.value);
      return `${typeof v === 'number' && v > 0 ? '+' : ''}${v} PM`;
    }
    case 'summon':
      return `Invoca: ${MONSTERS[e.monster]?.name ?? e.monster}${e.count > 1 ? ` ×${e.count}` : ''}`;
    case 'placeBomb':
      return `Coloca una bomba${e.extraAdjacent ? ` (+${e.extraAdjacent} adyacente)` : ''}`;
    case 'detonate':
      return `Detona la bomba${e.bonusCharge ? ` con +${e.bonusCharge} de carga` : ''}`;
    case 'chargeBombs':
      return `+${e.value ?? 1} de carga a tus bombas`;
    case 'dashToTarget':
      return 'Carga hasta el objetivo';
    case 'charge':
      return 'Carga en línea recta (anunciada)';
    case 'killSelf':
      return 'Se destruye';
    case 'modifyDamage':
      return `${typeof e.pct === 'number' ? `+${e.pct}%` : 'Bonificación'} de daño`;
    default:
      return e.type;
  }
}

export function spellMeta(spell, range = null) {
  const parts = [];
  parts.push(`${spell.apCost} PA`);
  if (spell.target === 'self') parts.push('Sobre sí mismo');
  else {
    const r = range ?? { min: spell.minRange, max: spell.maxRange };
    parts.push(`Alcance ${r.min === r.max ? r.max : `${r.min}–${r.max}`}${spell.rangeMod ? ' (mod.)' : ''}`);
  }
  if (spell.los && spell.target !== 'self') parts.push('Requiere LdV');
  if (spell.inLine) parts.push('En línea');
  if (spell.castsPerTurn) parts.push(`${spell.castsPerTurn}/turno`);
  if (spell.castsPerTarget) parts.push(`${spell.castsPerTarget}/objetivo`);
  if (spell.cooldown) parts.push(`Enfriamiento ${spell.cooldown}`);
  if (spell.area && spell.area.shape !== 'single') parts.push(`Área: ${areaName(spell.area)}`);
  if (spell.crit) parts.push(`${spell.crit}% crít. base`);
  return parts;
}

export function areaName(area) {
  const n = { circle: 'círculo', cross: 'cruz', line: 'línea', perpLine: 'barra', ring: 'anillo', square: 'cuadrado', single: 'casilla' }[area.shape] ?? area.shape;
  return area.size ? `${n} ${area.size}` : n;
}

const TARGET_NAMES = {
  enemy: 'Enemigo',
  ally: 'Aliado',
  unit: 'Cualquier unidad',
  emptyCell: 'Casilla libre',
  cell: 'Casilla',
  self: 'Uno mismo',
  ownBomb: 'Bomba propia',
};

export function targetName(t) {
  return TARGET_NAMES[t] ?? t;
}

const EVENT_NAMES = {
  dealDamage: 'Al infligir daño',
  takeDamage: 'Al recibir daño',
  beforeDealDamage: 'Tus golpes',
  beforeTakeDamage: 'Golpes recibidos',
  kill: 'Al derrotar a un enemigo',
  death: 'Al morir',
  healDone: 'Al curar',
  healReceived: 'Al ser curado',
  castSpell: 'Al lanzar un hechizo',
  turnStart: 'Al inicio de tu turno',
  turnEnd: 'Al final de tu turno',
  combatStart: 'Al empezar el combate',
  combatJoin: 'Al entrar en combate',
  causeCollision: 'Cuando estrellas a alguien',
  collided: 'Cuando te estrellan',
  moveEnd: 'Al moverte',
  bombExplode: 'Al estallar una bomba',
};

export function describeTrigger(t) {
  if (t.desc) return t.desc;
  const head = EVENT_NAMES[t.event] ?? t.event;
  const body = t.actions.map((a) => describeEffect(a)).join(', ');
  const lim = t.limit?.perTurn ? ` (máx. ${t.limit.perTurn}/turno)` : t.limit?.perCombat ? ` (máx. ${t.limit.perCombat}/combate)` : '';
  const ch = t.chance !== undefined ? `${t.chance}%: ` : '';
  return `${head}: ${ch}${body}${lim}.`;
}

export function statLine(key, value) {
  return formatStat(key, value);
}

export function isNegativeStat(key, value) {
  const inverted = STATS[key]?.inverted;
  return inverted ? value > 0 : value < 0;
}
