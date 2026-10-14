// Espacios de equipamiento inspirados en Dofus. `type` es el tipo de objeto aceptado.
export const EQUIP_SLOTS = [
  { id: 'hat', type: 'hat', name: 'Sombrero' },
  { id: 'cloak', type: 'cloak', name: 'Capa' },
  { id: 'amulet', type: 'amulet', name: 'Amuleto' },
  { id: 'ring1', type: 'ring', name: 'Anillo' },
  { id: 'ring2', type: 'ring', name: 'Anillo' },
  { id: 'belt', type: 'belt', name: 'Cinturón' },
  { id: 'boots', type: 'boots', name: 'Botas' },
  { id: 'weapon', type: 'weapon', name: 'Arma' },
  { id: 'shield', type: 'shield', name: 'Escudo' },
  { id: 'trophy1', type: 'trophy', name: 'Trofeo' },
  { id: 'trophy2', type: 'trophy', name: 'Trofeo' },
];

export const ITEM_TYPES = {
  hat: 'Sombrero',
  cloak: 'Capa',
  amulet: 'Amuleto',
  ring: 'Anillo',
  belt: 'Cinturón',
  boots: 'Botas',
  weapon: 'Arma',
  shield: 'Escudo',
  trophy: 'Trofeo',
};

export const WEAPON_TYPES = {
  sword: 'Espada',
  dagger: 'Dagas',
  staff: 'Bastón',
  wand: 'Varita',
  bow: 'Arco',
  hammer: 'Martillo',
  axe: 'Hacha',
};

export const BAG_CAPACITY = 6;

export function slotsForType(type) {
  return EQUIP_SLOTS.filter((s) => s.type === type).map((s) => s.id);
}
