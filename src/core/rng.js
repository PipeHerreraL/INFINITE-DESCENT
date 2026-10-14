// RNG determinista (mulberry32) con estado serializable.
// El estado vive dentro del estado del juego ({ s: uint32 }) para que las
// expediciones sean reproducibles por semilla y se puedan guardar en cualquier punto.

export function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) return seed >>> 0;
  const str = String(seed);
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function createRng(seed) {
  return { s: hashSeed(seed) };
}

/** Devuelve un float en [0, 1) y avanza el estado. */
export function next(rng) {
  rng.s = (rng.s + 0x6d2b79f5) >>> 0;
  let t = rng.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Entero en [min, max] (ambos incluidos). */
export function int(rng, min, max) {
  if (max < min) [min, max] = [max, min];
  return min + Math.floor(next(rng) * (max - min + 1));
}

export function chance(rng, pct) {
  if (pct >= 100) return true;
  if (pct <= 0) return false;
  return next(rng) * 100 < pct;
}

export function pick(rng, arr) {
  if (!arr.length) return undefined;
  return arr[Math.floor(next(rng) * arr.length)];
}

/** Elige un elemento según pesos. `getWeight` recibe el elemento. */
export function weighted(rng, arr, getWeight = (x) => x.weight) {
  let total = 0;
  for (const item of arr) total += Math.max(0, getWeight(item));
  if (total <= 0) return undefined;
  let roll = next(rng) * total;
  for (const item of arr) {
    roll -= Math.max(0, getWeight(item));
    if (roll < 0) return item;
  }
  return arr[arr.length - 1];
}

export function shuffle(rng, arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next(rng) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Toma `n` elementos distintos al azar. */
export function sample(rng, arr, n) {
  return shuffle(rng, arr).slice(0, n);
}

/** Crea un RNG hijo independiente, derivado del actual y una etiqueta. */
export function fork(rng, label = '') {
  const base = Math.floor(next(rng) * 4294967296);
  return createRng(`${base}:${label}`);
}

export function randomSeed() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
