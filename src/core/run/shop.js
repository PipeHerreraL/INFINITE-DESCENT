import { RELICS } from '../../content/relics.js';
import { BAG_CAPACITY } from '../../content/items/index.js';
import { assertRule } from '../errors.js';
import { generateItemChoices, itemValue } from '../items/items.js';
import { removeItem } from '../items/equipment.js';
import { buildHeroProfile } from '../hero/profile.js';
import { pickRelics, ownedLegendaries } from './rewards.js';
import { choiceRoom, runeOptions } from './choices.js';
import { healPct, floorNumber, refreshHero, discover, addRelic } from './run.js';

// Mercader: toda transacción comprueba fondos y espacio y actualiza el estado.

export const SELL_RATIO = 0.35;
const RELIC_PRICE = { common: 95, rare: 140, boss: 190 };

export function priceFactor(run) {
  const discount = buildHeroProfile(run).stats.shopDiscount || 0;
  return (run.rules?.priceMult ?? 1) * Math.max(0.3, 1 - discount / 100);
}

export function price(run, base) {
  return Math.max(1, Math.round(base * priceFactor(run)));
}

export function createShop(run) {
  const floor = floorNumber(run);
  const count = 4 + (run.unlocks?.merchant_eye ? 1 : 0);
  const items = generateItemChoices(run.rng, run.pools.items, run.counters, count, { floor, classId: run.hero.classId, exclude: ownedLegendaries(run) }).map((item) => ({
    item,
    price: Math.round(itemValue(item) * 1.15),
    sold: false,
  }));
  const [relicId] = pickRelics(run, ['common', 'rare'], 1);
  return {
    type: 'shop',
    items,
    relic: relicId ? { id: relicId, price: RELIC_PRICE[RELICS[relicId].tier] ?? 120, sold: false } : null,
    healPrice: 30,
    healUsed: false,
    runePrice: 55,
    runeUsed: false,
    rerollPrice: 20,
  };
}

export function buyItem(run, shop, index) {
  const entry = shop.items[index];
  assertRule(entry && !entry.sold, 'Ese objeto ya no está a la venta.');
  const cost = price(run, entry.price);
  assertRule(run.kamas >= cost, `No tienes suficientes kamas (${cost}).`);
  assertRule(run.hero.bag.length < BAG_CAPACITY, 'La bolsa está llena.');
  run.kamas -= cost;
  entry.sold = true;
  run.hero.bag.push(entry.item);
  run.stats.itemsFound += 1;
  discover(run, 'items', entry.item.baseId);
  return entry.item;
}

export function buyRelic(run, shop) {
  assertRule(shop.relic && !shop.relic.sold, 'No hay reliquia a la venta.');
  const cost = price(run, shop.relic.price);
  assertRule(run.kamas >= cost, `No tienes suficientes kamas (${cost}).`);
  run.kamas -= cost;
  shop.relic.sold = true;
  addRelic(run, shop.relic.id);
}

export function buyHeal(run, shop) {
  assertRule(!shop.healUsed, 'Ya has comprado curación aquí.');
  assertRule(run.hero.hp < run.hero.maxHpCache, 'Ya tienes la vida al máximo.');
  const cost = price(run, shop.healPrice);
  assertRule(run.kamas >= cost, `No tienes suficientes kamas (${cost}).`);
  run.kamas -= cost;
  shop.healUsed = true;
  healPct(run, 35);
}

export function buyRune(run, shop) {
  assertRule(!shop.runeUsed, 'El grabador ya ha trabajado para ti.');
  assertRule(runeOptions(run).length > 0, 'Ninguno de tus hechizos admite más runas.');
  const cost = price(run, shop.runePrice);
  assertRule(run.kamas >= cost, `No tienes suficientes kamas (${cost}).`);
  run.kamas -= cost;
  shop.runeUsed = true;
  run.queue.unshift(choiceRoom(run, 'rune'));
}

export function rerollShop(run, shop) {
  const cost = price(run, shop.rerollPrice);
  assertRule(run.kamas >= cost, `No tienes suficientes kamas (${cost}).`);
  run.kamas -= cost;
  const fresh = createShop(run);
  shop.items = fresh.items;
  shop.rerollPrice += 10;
}

export function sellPrice(item) {
  return Math.max(1, Math.round(itemValue(item) * SELL_RATIO));
}

export function sellItem(run, uid) {
  const item = removeItem(run.hero, uid);
  const gain = sellPrice(item);
  run.kamas += gain;
  refreshHero(run);
  return gain;
}
