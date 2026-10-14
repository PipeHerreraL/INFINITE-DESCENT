import { ELEMENTS, ELEMENTAL_IDS } from '../../content/elements.js';
import { getItemDef } from '../../content/items/index.js';
import { assertRule } from '../errors.js';
import { MAX_UPGRADE, rerollLine } from '../items/items.js';
import { locateItem } from '../items/equipment.js';
import { refreshHero } from './run.js';

// Forja: mejorar (+1..+3), transmutar una línea, cambiar el elemento ofensivo
// de una pieza (pivotar la build) y desmantelar. Costes en fragmentos y kamas.

export const UPGRADE_COSTS = [
  { fragments: 3, kamas: 15 },
  { fragments: 5, kamas: 30 },
  { fragments: 8, kamas: 50 },
];
export const TRANSMUTE_COST = { fragments: 4, kamas: 0 };
export const ELEMENT_SHIFT_COST = { fragments: 6, kamas: 25 };

export function createForge() {
  return { type: 'forge', freeUpgradeUsed: false, actions: 0 };
}

function pay(run, cost) {
  assertRule(run.fragments >= cost.fragments, `Necesitas ${cost.fragments} fragmentos.`);
  assertRule(run.kamas >= cost.kamas, `Necesitas ${cost.kamas} kamas.`);
  run.fragments -= cost.fragments;
  run.kamas -= cost.kamas;
}

function findItem(run, uid) {
  const loc = locateItem(run.hero, uid);
  assertRule(loc, 'Objeto no encontrado.');
  return loc.item;
}

export function upgradeCost(run, forge, item) {
  if (item.upgrade >= MAX_UPGRADE) return null;
  if (run.unlocks?.forge_mastery && forge && !forge.freeUpgradeUsed) return { fragments: 0, kamas: 0, free: true };
  return UPGRADE_COSTS[item.upgrade];
}

export function upgradeItem(run, forge, uid) {
  const item = findItem(run, uid);
  assertRule(item.upgrade < MAX_UPGRADE, `Ya está mejorado al máximo (+${MAX_UPGRADE}).`);
  const cost = upgradeCost(run, forge, item);
  pay(run, cost);
  if (cost.free) forge.freeUpgradeUsed = true;
  item.upgrade += 1;
  forge.actions += 1;
  refreshHero(run);
  return item;
}

export function transmuteLine(run, forge, uid, lineIndex) {
  const item = findItem(run, uid);
  assertRule(item.lines[lineIndex], 'Línea inválida.');
  pay(run, TRANSMUTE_COST);
  rerollLine(run.rng, item, lineIndex);
  forge.actions += 1;
  refreshHero(run);
  return item;
}

/** Elemento ofensivo principal de una pieza (por sus líneas originales). */
export function itemOffensiveElement(item) {
  for (const line of item.lines) {
    for (const el of ELEMENTAL_IDS) {
      if (line.stat === ELEMENTS[el].stat || line.stat === ELEMENTS[el].dmg) return el;
    }
  }
  return null;
}

export function shiftElement(run, forge, uid, toElement) {
  const item = findItem(run, uid);
  const from = itemOffensiveElement(item);
  assertRule(from, `${getItemDef(item.baseId).name} no tiene características elementales.`);
  assertRule(ELEMENTAL_IDS.includes(toElement), 'Elemento inválido.');
  const current = item.elementMap?.to ?? from;
  assertRule(current !== toElement, 'La pieza ya es de ese elemento.');
  pay(run, ELEMENT_SHIFT_COST);
  item.elementMap = toElement === from ? null : { from, to: toElement };
  forge.actions += 1;
  refreshHero(run);
  return item;
}
