import { describe, it, expect } from 'vitest';
import { buildHeroProfile } from '../src/core/hero/profile.js';
import { createItem, itemStats, generateItem, eligibleBases, rollRarity } from '../src/core/items/items.js';
import { equipFromBag, unequip, canEquip, equipNew, addToBag } from '../src/core/items/equipment.js';
import { countSetPieces, setSources } from '../src/core/items/sets.js';
import { refreshHero, buildPools } from '../src/core/run/run.js';
import { createRng } from '../src/core/rng.js';
import { ITEMS } from '../src/content/items/index.js';
import { makeRun } from './helpers.js';

function item(run, baseId, rarity = 'common', ilvl = 1) {
  return createItem(run.rng, baseId, rarity, ilvl, run.counters);
}

describe('estadísticas derivadas', () => {
  it('se recalculan al equipar y retirar objetos', () => {
    const run = makeRun();
    const before = buildHeroProfile(run);
    run.hero.bag.push(item(run, 'anilloVital', 'common', 3));
    equipFromBag(run.hero, run.hero.bag[0].uid, 'ring1');
    refreshHero(run);
    const after = buildHeroProfile(run);
    expect(after.maxHp).toBeGreaterThan(before.maxHp);
    unequip(run.hero, 'ring1');
    refreshHero(run);
    expect(buildHeroProfile(run).maxHp).toBe(before.maxHp);
  });

  it('equipar vitalidad conserva el daño recibido', () => {
    const run = makeRun();
    run.hero.hp -= 30;
    const missing = run.hero.maxHpCache - run.hero.hp;
    run.hero.bag.push(item(run, 'anilloVital', 'rare', 5));
    equipFromBag(run.hero, run.hero.bag[0].uid, 'ring1');
    refreshHero(run);
    expect(run.hero.maxHpCache - run.hero.hp).toBe(missing);
  });

  it('las mejoras de forja aumentan las líneas', () => {
    const run = makeRun();
    const it = item(run, 'gorroAventurero', 'rare', 4);
    const a = itemStats(it);
    it.upgrade = 3;
    const b = itemStats(it);
    expect(b.vitality).toBeGreaterThan(a.vitality);
  });

  it('la transmutación elemental cambia las características ofensivas', () => {
    const run = makeRun();
    const it = item(run, 'mantoIgneo', 'common');
    const fire = itemStats(it);
    it.elementMap = { from: 'fire', to: 'water' };
    const water = itemStats(it);
    expect(water.chance).toBe(fire.intelligence);
    expect(water.waterDamage).toBe(fire.fireDamage);
    expect(water.intelligence).toBeUndefined();
  });

  it('las estadísticas fijas negativas se aplican (trofeos con contrapartida)', () => {
    const run = makeRun();
    run.hero.equipment.trophy1 = item(run, 'trofeoVigia', 'rare');
    const p = buildHeroProfile(run);
    expect(p.stats.range).toBe(1);
    expect(p.allSources.find((s) => s.kind === 'item' && s.slot === 'trophy1').stats.vitality).toBe(-15);
  });
});

describe('reglas de equipamiento', () => {
  it('no se pueden llevar dos anillos únicos iguales', () => {
    const run = makeRun();
    run.hero.equipment.ring1 = item(run, 'anilloHierro');
    const second = item(run, 'anilloHierro');
    expect(canEquip(run.hero, second, 'ring2').ok).toBe(false);
    expect(canEquip(run.hero, item(run, 'anilloCoral'), 'ring2').ok).toBe(true);
  });

  it('respeta el tipo de espacio y las restricciones de clase', () => {
    const run = makeRun('furiak');
    expect(canEquip(run.hero, item(run, 'botasCuero'), 'hat').ok).toBe(false);
    const belt = item(run, 'cinturonPolvora', 'legendary');
    expect(canEquip(run.hero, belt, 'belt').ok).toBe(false);
    const runP = makeRun('petardista');
    expect(canEquip(runP.hero, createItem(runP.rng, 'cinturonPolvora', 'legendary', 1, runP.counters), 'belt').ok).toBe(true);
  });

  it('la bolsa tiene capacidad limitada', () => {
    const run = makeRun();
    for (let i = 0; i < 6; i++) addToBag(run.hero, item(run, 'botasCuero'));
    expect(() => addToBag(run.hero, item(run, 'botasCuero'))).toThrow(/llena/);
    // Sustituir una pieza equipada con la bolsa llena tampoco es posible.
    expect(() => equipNew(run.hero, item(run, 'espadaCorta'), 'weapon')).toThrow(/llena/);
  });

  it('el pool filtra objetos de otras clases y respeta rarezas fijas', () => {
    const pool = buildPools({}).items;
    expect(eligibleBases(pool, 'legendary', { classId: 'furiak' })).not.toContain('cinturonPolvora');
    expect(eligibleBases(pool, 'common', {})).not.toContain('botasAladas');
    expect(eligibleBases(pool, 'epic', {})).toContain('botasAladas');
    // Los objetos bloqueados no están en el pool sin su desbloqueo.
    expect(pool).not.toContain('cascoMinero');
    expect(buildPools({ set_minero: true }).items).toContain('cascoMinero');
  });

  it('la generación de objetos es determinista por semilla', () => {
    const pool = buildPools({}).items;
    const a = generateItem(createRng('S'), pool, { itemSeq: 0 }, { floor: 5 });
    const b = generateItem(createRng('S'), pool, { itemSeq: 0 }, { floor: 5 });
    expect(a).toEqual(b);
    expect(ITEMS[a.baseId]).toBeDefined();
  });

  it('los pisos profundos mejoran la rareza media', () => {
    const score = (floor) => {
      const rng = createRng(`R${floor}`);
      let s = 0;
      for (let i = 0; i < 2000; i++) s += ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(rollRarity(rng, { floor }));
      return s;
    };
    expect(score(16)).toBeGreaterThan(score(1));
  });
});

describe('sets', () => {
  it('las bonificaciones se activan y desactivan por número de piezas', () => {
    const run = makeRun();
    const eq = run.hero.equipment;
    eq.hat = item(run, 'yelmoColmillo', 'rare');
    expect(setSources(eq)).toHaveLength(0);
    eq.cloak = item(run, 'capaCerdas', 'rare');
    expect(setSources(eq).map((s) => s.id)).toEqual(['set:jabaliCarmesi:2']);
    expect(buildHeroProfile(run).stats.power).toBeGreaterThanOrEqual(25);
    eq.amulet = item(run, 'amuletoBrasa', 'rare');
    eq.boots = item(run, 'botasPezuna', 'rare');
    expect(setSources(eq)).toHaveLength(3);
    eq.cloak = null;
    expect(setSources(eq).map((s) => s.id)).toEqual(['set:jabaliCarmesi:2', 'set:jabaliCarmesi:3']);
  });

  it('las piezas repetidas no cuentan dos veces', () => {
    const run = makeRun();
    const eq = run.hero.equipment;
    eq.ring1 = item(run, 'anilloBruma', 'rare');
    eq.ring2 = item(run, 'anilloBruma', 'rare');
    expect(countSetPieces(eq).tejedorBrumas).toBe(1);
  });
});
