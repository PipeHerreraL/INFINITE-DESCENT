import { EVENTS } from '../../content/events.js';
import { getActConfig, FINAL_ACT_INDEX } from '../../content/acts.js';
import { assertRule } from '../errors.js';
import { fork, pick, int, chance } from '../rng.js';
import { buildHeroProfile } from '../hero/profile.js';
import { createCombat } from '../combat/createCombat.js';
import { getHero } from '../combat/state.js';
import { MAX_UPGRADE } from '../items/items.js';
import { generateActMap, availableNodes } from './mapgen.js';
import { generateEncounter } from './encounters.js';
import { createCombatReward, itemChoicesFor, itemRewardRoom, pickRelics } from './rewards.js';
import { levelUpRoom, applyChoiceOption, variantOptions, newSpellOptions, runeOptions, choiceRoom, relicChoiceRoom } from './choices.js';
import { createShop } from './shop.js';
import { createForge } from './forge.js';
import { applyRunEffects } from './runEffects.js';
import { currentAct, currentNode, floorNumber, healPct, addKamas, discover, logRun, refreshHero, setHeroHp } from './run.js';

export const POST_COMBAT_REGEN_PCT = 20;

// ── Nodos y combates ─────────────────────────────────────────────────────

export function canTravel(run) {
  return !run.room && !run.combat && !run.ended && run.queue.length === 0;
}

export function enterNode(run, nodeId) {
  assertRule(canTravel(run), 'Termina lo que estás haciendo antes de avanzar.');
  assertRule(availableNodes(run.map, run.nodeId).includes(nodeId), 'No puedes viajar a ese nodo.');
  const node = run.map.nodes[nodeId];
  run.nodeId = nodeId;
  run.visited.push(nodeId);
  switch (node.type) {
    case 'combat':
    case 'elite':
    case 'challenge':
    case 'boss':
      startCombat(run, { type: node.type, modifier: node.modifier });
      break;
    case 'shop':
      run.room = createShop(run);
      break;
    case 'forge':
      run.room = createForge();
      break;
    case 'event':
      run.room = createEventRoom(run);
      break;
    case 'rest':
      run.room = { type: 'rest', used: false };
      break;
    case 'chest':
      run.room = { type: 'chest', opened: false };
      break;
    default:
      throw new Error(`Tipo de nodo desconocido: ${node.type}`);
  }
}

export function startCombat(run, { type, modifier = null }) {
  const act = currentAct(run);
  const node = currentNode(run);
  const encounter = generateEncounter(run.rng, act, node?.row ?? 0, type);
  encounter.modifiers = [...new Set([modifier, run.nextCombatModifier].filter(Boolean))];
  encounter.nodeType = type;
  run.nextCombatModifier = null;
  run.combatSeq += 1;
  const profile = buildHeroProfile(run);
  run.combat = createCombat({
    run,
    profile,
    encounter,
    seed: `${run.seed}:combat${run.combatSeq}`,
    floor: floorNumber(run),
    rules: run.rules,
    extraScaling: act.extraScaling ?? 0,
  });
  for (const id of encounter.enemies) discover(run, 'monsters', id);
}

/** Cierra un combate terminado: derrota → fin de la expedición; victoria → recompensa. */
export function finishCombat(run) {
  const combat = run.combat;
  assertRule(combat, 'No hay combate.');
  assertRule(combat.phase === 'victory' || combat.phase === 'defeat', 'El combate aún no ha terminado.');
  const hero = getHero(combat);
  run.stats.kills += combat.stats.kills;
  run.stats.damageDealt += combat.stats.damageDealt;
  const nodeType = combat.encounter.nodeType;
  if (combat.phase === 'defeat') {
    run.hero.hp = 0;
    run.combat = null;
    run.ended = { victory: false, reason: `Caído en el piso ${floorNumber(run)}.`, floor: floorNumber(run) };
    logRun(run, 'Derrota.');
    return;
  }
  setHeroHp(run, hero.hp);
  refreshHero(run);
  healPct(run, POST_COMBAT_REGEN_PCT * (run.rules?.regenMult ?? 1));
  run.stats.combatsWon += 1;
  if (nodeType === 'boss') run.stats.bossesKilled += 1;
  if (nodeType === 'elite') run.stats.elitesKilled += 1;
  const reward = createCombatReward(run, combat, nodeType);
  run.combat = null;
  run.room = reward;
  logRun(run, `Victoria (${nodeType}).`);
}

// ── Flujo de salas ───────────────────────────────────────────────────────

/** Sale de la sala actual y pasa a la siguiente sala pendiente o al mapa. */
export function leaveRoom(run) {
  const room = run.room;
  assertRule(room, 'No hay ninguna sala activa.');
  if (room.type === 'choice') assertRule(room.allowSkip, 'Debes elegir una opción.');
  if (room.type === 'event') assertRule(room.resolved, 'Elige una opción primero.');
  if (room.type === 'victory') assertRule(false, 'Decide si terminar o seguir descendiendo.');
  if (room.type === 'actComplete') {
    run.room = null;
    nextAct(run);
    return;
  }
  run.room = null;
  advanceRoom(run);
}

export function advanceRoom(run) {
  if (run.queue.length) {
    const next = run.queue.shift();
    if (next.type === 'combatStart') startCombat(run, { type: next.kind, modifier: next.modifier });
    else run.room = next;
    return;
  }
  if (run.pendingLevelUps > 0) {
    run.room = levelUpRoom(run);
    return;
  }
  completeNode(run);
}

function completeNode(run) {
  const node = currentNode(run);
  if (!node || node.completed) return;
  node.completed = true;
  run.stats.floorsCleared += 1;
  if (node.type === 'boss') {
    if (run.actIndex >= FINAL_ACT_INDEX && !run.endless) {
      run.room = { type: 'victory' };
    } else {
      run.room = { type: 'actComplete', actName: currentAct(run).name, nextName: getActConfig(run.actIndex + 1).name };
    }
  }
}

export function nextAct(run) {
  run.actIndex += 1;
  const act = getActConfig(run.actIndex);
  run.map = generateActMap(fork(run.rng, `map${run.actIndex}`), act, { eliteWeightMult: run.difficulty >= 2 ? 1.4 : 1 });
  run.nodeId = null;
  healPct(run, 40);
  logRun(run, `Entra en ${act.name}.`);
}

export function victoryChoice(run, endless) {
  assertRule(run.room?.type === 'victory', 'No hay ninguna decisión pendiente.');
  run.room = null;
  if (endless) {
    run.endless = true;
    run.reachedVictory = true;
    nextAct(run);
  } else {
    run.ended = { victory: true, reason: 'Has completado la expedición.', floor: floorNumber(run) };
  }
}

// ── Elecciones ───────────────────────────────────────────────────────────

export function chooseOption(run, index) {
  const room = run.room;
  assertRule(room?.type === 'choice', 'No hay ninguna elección activa.');
  const option = room.options[index];
  assertRule(option, 'Opción inválida.');
  applyChoiceOption(run, option);
  if (room.kind === 'levelUp') run.pendingLevelUps = Math.max(0, run.pendingLevelUps - 1);
  run.room = null;
  advanceRoom(run);
}

export function skipChoice(run) {
  const room = run.room;
  assertRule(room?.type === 'choice' && room.allowSkip, 'No puedes omitir esta elección.');
  run.room = null;
  advanceRoom(run);
}

// ── Eventos ──────────────────────────────────────────────────────────────

export function createEventRoom(run) {
  run.seenEvents ??= [];
  const all = Object.keys(EVENTS);
  let pool = all.filter((id) => !run.seenEvents.includes(id));
  if (!pool.length) pool = all;
  const eventId = pick(run.rng, pool);
  run.seenEvents.push(eventId);
  return { type: 'event', eventId, resolved: false, chosen: null, texts: [] };
}

export function optionAvailability(run, option) {
  const r = option.requires ?? {};
  const c = option.cost ?? {};
  if (r.spellWithVariants && !variantOptions(run).length) return { ok: false, reason: 'Ningún hechizo puede transformarse.' };
  if (r.learnableSpells && !newSpellOptions(run).length) return { ok: false, reason: 'No quedan hechizos por aprender.' };
  if (r.notHaveRelic && run.hero.relics.includes(r.notHaveRelic)) return { ok: false, reason: 'Ya cargas con esa maldición.' };
  if (r.equippedWeaponUpgradable) {
    const w = run.hero.equipment.weapon;
    if (!w || w.upgrade >= MAX_UPGRADE) return { ok: false, reason: 'Tu arma no se puede mejorar.' };
  }
  if (c.kamas && run.kamas < c.kamas) return { ok: false, reason: `Necesitas ${c.kamas} kamas.` };
  if (c.fragments && run.fragments < c.fragments) return { ok: false, reason: `Necesitas ${c.fragments} fragmentos.` };
  if (c.hpPct && run.hero.hp <= Math.round((run.hero.maxHpCache * c.hpPct) / 100)) return { ok: false, reason: 'No tienes vida suficiente.' };
  return { ok: true };
}

export function chooseEventOption(run, index) {
  const room = run.room;
  assertRule(room?.type === 'event' && !room.resolved, 'No hay ningún evento pendiente.');
  const event = EVENTS[room.eventId];
  const option = event.options[index];
  assertRule(option, 'Opción inválida.');
  const avail = optionAvailability(run, option);
  assertRule(avail.ok, avail.reason);
  const c = option.cost ?? {};
  const texts = [];
  if (c.kamas) {
    run.kamas -= c.kamas;
    texts.push(`-${c.kamas} kamas.`);
  }
  if (c.fragments) {
    run.fragments -= c.fragments;
    texts.push(`-${c.fragments} fragmentos.`);
  }
  if (c.hpPct) {
    const amount = Math.round((run.hero.maxHpCache * c.hpPct) / 100);
    run.hero.hp = Math.max(1, run.hero.hp - amount);
    texts.push(`-${amount} PV.`);
  }
  if (option.result) texts.push(option.result);
  const out = applyRunEffects(run, option.effects, { texts });
  room.resolved = true;
  room.chosen = index;
  room.texts = out.texts;
  logRun(run, `${event.name}: ${option.label}.`);
}

// ── Descanso ─────────────────────────────────────────────────────────────

export const REST_HEAL_PCT = 30;

export function restOptions(run) {
  const heal = REST_HEAL_PCT + (run.unlocks?.rest_plus ? 10 : 0);
  const w = run.hero.equipment.weapon;
  return [
    { id: 'heal', name: 'Descansar', desc: `Recuperas el ${heal}% de tu vida máxima.`, ok: run.hero.hp < run.hero.maxHpCache },
    { id: 'meditate', name: 'Meditar', desc: 'Graba una runa en uno de tus hechizos (a elegir entre tres).', ok: runeOptions(run).length > 0 },
    { id: 'sharpen', name: 'Afilar el arma', desc: 'Tu arma sube +1 de mejora.', ok: !!w && w.upgrade < MAX_UPGRADE },
  ];
}

export function chooseRest(run, optionId) {
  const room = run.room;
  assertRule(room?.type === 'rest' && !room.used, 'Ya has descansado aquí.');
  const option = restOptions(run).find((o) => o.id === optionId);
  assertRule(option && option.ok, 'Esa opción no está disponible.');
  room.used = true;
  if (optionId === 'heal') {
    const h = healPct(run, REST_HEAL_PCT + (run.unlocks?.rest_plus ? 10 : 0));
    room.text = `Recuperas ${h} PV.`;
  } else if (optionId === 'meditate') {
    run.queue.unshift(choiceRoom(run, 'rune'));
    room.text = 'Te concentras en tus hechizos…';
  } else if (optionId === 'sharpen') {
    run.hero.equipment.weapon.upgrade += 1;
    refreshHero(run);
    room.text = 'Tu arma brilla, afilada.';
  }
}

// ── Cofres ───────────────────────────────────────────────────────────────

export function openChest(run) {
  const room = run.room;
  assertRule(room?.type === 'chest' && !room.opened, 'No hay ningún cofre que abrir.');
  room.opened = true;
  const floor = floorNumber(run);
  const items = itemChoicesFor(run, { floor, count: 3, min: 'uncommon' });
  const reward = itemRewardRoom(run, items, 'Cofre del Sueño');
  reward.source = 'chest';
  reward.kamas = addKamas(run, int(run.rng, 18, 32) + floor);
  if (chance(run.rng, 30)) {
    const relics = pickRelics(run, ['common'], 2);
    if (relics.length) {
      reward.relics = relics;
      reward.relicTaken = false;
    }
  }
  run.room = reward;
}

export function startRelicRoom(run) {
  const relics = pickRelics(run, ['common'], 2);
  return relics.length ? relicChoiceRoom(run, relics, 'Reliquia de partida') : null;
}
