import { CHALLENGES } from '../../content/challenges.js';
import { pick } from '../rng.js';
import { getHero, livingUnits, adjacentEnemies, addLog, addFx } from './state.js';

// Lógica de los desafíos de combate (ver content/challenges.js).

export function pickChallenge(combat, encounter) {
  const enemies = livingUnits(combat).filter((u) => u.side === 'enemy' && u.tier !== 'summon');
  const pool = ['versatil', 'estatua', 'zombi', 'celeridad', 'intocable', 'purista', 'anacoreta'];
  if (enemies.length >= 2) pool.push('elegido');
  const id = encounter.challenge ?? pick(combat.rng, pool);
  const def = CHALLENGES[id];
  const ch = { id, name: def.name, desc: def.desc, status: 'active', data: {} };
  if (id === 'celeridad') {
    ch.data.n = encounter.kind === 'boss' ? 10 : 3 + enemies.length;
    ch.desc = def.desc.replace('{n}', ch.data.n);
  }
  if (id === 'elegido') {
    const t = pick(combat.rng, enemies);
    ch.data.targetId = t.id;
    ch.desc = def.desc.replace('{target}', t.name);
  }
  if (id === 'purista') ch.data.elements = [];
  return ch;
}

function fail(combat, ch, why) {
  ch.status = 'failed';
  addLog(combat, `Desafío «${ch.name}» fallido: ${why}`, 'warn');
  addFx(combat, { type: 'banner', text: `Desafío fallido: ${ch.name}`, warn: true });
}

export function challengeEvent(combat, event, data) {
  const ch = combat.challenge;
  if (!ch || ch.status !== 'active' || combat.phase !== 'active') return;
  const hero = getHero(combat);
  if (!hero) return;
  switch (ch.id) {
    case 'versatil':
      if (event === 'cast' && data.unit.id === hero.id && data.unit.turnFlags.castIds.includes(data.spell.id)) {
        fail(combat, ch, `repetiste ${data.spell.name}.`);
      }
      break;
    case 'estatua':
      if (event === 'turnEnd' && data.unit.id === hero.id) {
        const s = hero.turnFlags.startCell;
        if (hero.x !== s.x || hero.y !== s.y) fail(combat, ch, 'terminaste el turno en otra casilla.');
      }
      break;
    case 'zombi':
      if (event === 'move' && data.unit.id === hero.id && hero.turnFlags.moved > 1) fail(combat, ch, 'usaste más de 1 PM.');
      break;
    case 'celeridad':
      if (event === 'roundStart' && combat.round >= ch.data.n) fail(combat, ch, 'el combate se alargó demasiado.');
      break;
    case 'intocable':
      if (event === 'damage' && data.target === hero.id && hero.hp < hero.maxHp * 0.5) fail(combat, ch, 'bajaste del 50% de vida.');
      break;
    case 'elegido':
      if (event === 'kill' && data.unit.side === 'enemy' && data.unit.tier !== 'summon') {
        if (data.unit.id === ch.data.targetId) ch.data.done = true;
        else if (!ch.data.done) fail(combat, ch, `${data.unit.name} cayó antes que el elegido.`);
      }
      break;
    case 'purista':
      if (event === 'damage' && data.source === hero.id && data.kind === 'spell' && data.element !== 'neutral') {
        if (!ch.data.elements.includes(data.element)) ch.data.elements.push(data.element);
        if (ch.data.elements.length > 1) fail(combat, ch, 'usaste más de un elemento.');
      }
      break;
    case 'anacoreta':
      if (event === 'turnEnd' && data.unit.id === hero.id && adjacentEnemies(combat, hero).length) {
        fail(combat, ch, 'terminaste el turno junto a un enemigo.');
      }
      break;
    default:
  }
}

export function finalizeChallenge(combat) {
  const ch = combat.challenge;
  if (ch && ch.status === 'active') {
    ch.status = 'completed';
    addLog(combat, `¡Desafío «${ch.name}» completado!`, 'good');
  }
}
