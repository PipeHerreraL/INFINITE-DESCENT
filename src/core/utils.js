export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const sum = (arr, fn = (x) => x) => arr.reduce((acc, x) => acc + fn(x), 0);

export function deepClone(value) {
  return structuredClone(value);
}

export function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Suma un diccionario de estadísticas en otro (mutando `target`). */
export function addStats(target, add, mult = 1) {
  if (!add) return target;
  for (const [k, v] of Object.entries(add)) {
    if (typeof v !== 'number') continue;
    target[k] = (target[k] || 0) + v * mult;
  }
  return target;
}

export function uid(prefix, counterHolder) {
  counterHolder.seq = (counterHolder.seq || 0) + 1;
  return `${prefix}${counterHolder.seq}`;
}

export function signed(n) {
  return n > 0 ? `+${n}` : `${n}`;
}

export function round(n, digits = 0) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
