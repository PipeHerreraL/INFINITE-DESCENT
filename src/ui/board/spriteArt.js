// Arte ilustrado de las unidades. Las ilustraciones se generaron con la IA de
// imágenes de Canva (diseños originales) y se recortaron con
// scripts/sprites/cut_sheet.py. Las unidades sin ilustración usan el sprite
// vectorial de UnitSprite.jsx.

import { MONSTERS } from '../../content/enemies/index.js';

const files = import.meta.glob('../../assets/sprites/*.webp', { eager: true, query: '?url', import: 'default' });
const url = (name) => files[`../../assets/sprites/${name}.webp`];

/**
 * h: altura en unidades del tablero (una casilla mide 64 de ancho).
 * lift: cuánto flota sobre el suelo (voladores).
 * filter: filtro CSS para variantes que reutilizan otra ilustración.
 */
const ART = {
  furiak: { h: 62 },
  ensalmador: { h: 62 },
  petardista: { h: 60 },
  setaBruja: { h: 52 },
  setaAnciana: { h: 56 },
  jabalinete: { h: 44 },
  jabaliAcorazado: { h: 52 },
  murcielagoEco: { h: 40, lift: 14 },
  golemMusgo: { h: 60 },
  koboldChispero: { h: 54 },
  brujoKobold: { h: 54 },
  plumin: { h: 38 },
  pluminAlfa: { h: 48 },
  larvazul: { h: 38 },
  bloblin: { h: 36 },
  aranaTejedora: { h: 40 },
  sombraOnirica: { h: 52, lift: 6 },
  golemAncestral: { h: 62 },
  conejoSanador: { h: 40 },
  mercader: { h: 56 },
  bombaTierra: { h: 34 },
  bombaFuego: { h: 34 },
  bombaAgua: { h: 34 },
  bombaAire: { h: 34 },
};

// Variantes provisionales: reutilizan una ilustración con otro color (y altura `h`, si se indica).
const VARIANTS = {
  setita: { from: 'setaBruja', filter: 'hue-rotate(275deg) saturate(1.2)' },
  bloblinMini: { from: 'bloblin', filter: 'brightness(1.12) saturate(0.85)' },
  aranita: { from: 'aranaTejedora', filter: 'saturate(0.5) brightness(1.2)' },
  bramador: { from: 'jabaliAcorazado', filter: 'sepia(0.25) saturate(1.5) hue-rotate(-12deg) brightness(0.85)' },
  tejedora: { from: 'aranaTejedora', h: 54, filter: 'hue-rotate(45deg) saturate(1.4) brightness(0.9)' },
  bombaNeutra: { from: 'bombaTierra', filter: 'grayscale(0.9) brightness(1.05)' },
};

// Cada bomba muestra la ilustración de su elemento.
const BOMB_ART = { earth: 'bombaTierra', fire: 'bombaFuego', water: 'bombaAgua', air: 'bombaAire' };

// Los héroes se identifican por la forma de su clase.
const HERO_ART = { warrior: 'furiak', healer: 'ensalmador', bomber: 'petardista' };

/** Ilustración de un sprite ({ url, h, lift, filter }) o null si no tiene. */
export function artFor(sprite) {
  if (!sprite) return null;
  const id = sprite.art ?? HERO_ART[sprite.shape];
  if (!id) return null;
  const variant = VARIANTS[id];
  const base = ART[variant?.from ?? id];
  const src = url(variant?.from ?? id);
  if (!base || !src) return null;
  return { ...base, h: variant?.h ?? base.h, url: src, filter: variant?.filter ?? null };
}

export const SPRITE_ART_IDS = [...Object.keys(ART), ...Object.keys(VARIANTS)];

/**
 * Sprite con el que se dibuja una unidad de combate. Las bombas eligen la
 * ilustración de su elemento; los monstruos de partidas guardadas antes de
 * que existieran las ilustraciones toman el sprite actual de su definición.
 */
export function unitSprite(u) {
  if (!u) return null;
  if (u.kind === 'bomb') return { ...u.sprite, shape: 'bomb', art: BOMB_ART[u.element] ?? 'bombaNeutra' };
  if (!u.sprite?.art && u.defId && MONSTERS[u.defId]?.sprite) return MONSTERS[u.defId].sprite;
  return u.sprite;
}
