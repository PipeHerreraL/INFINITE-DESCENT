// Arte ilustrado de las unidades. Las ilustraciones se generaron con la IA de
// imágenes de Canva (diseños originales) y se recortaron con
// scripts/sprites/cut_sheet.py. Las unidades sin ilustración usan el sprite
// vectorial de UnitSprite.jsx.

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
};

// Variantes provisionales: reutilizan una ilustración con otro tamaño o color.
const VARIANTS = {
  setita: { from: 'setaBruja', filter: 'hue-rotate(275deg) saturate(1.2)' },
  golemAncestral: { from: 'golemMusgo', filter: 'saturate(0.25) brightness(0.92) contrast(1.1)' },
  bramador: { from: 'jabaliAcorazado', filter: 'sepia(0.25) saturate(1.5) hue-rotate(-12deg) brightness(0.85)' },
};

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
  return { ...base, url: src, filter: variant?.filter ?? null };
}

export const SPRITE_ART_IDS = [...Object.keys(ART), ...Object.keys(VARIANTS)];
