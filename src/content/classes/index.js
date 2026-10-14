// Registro de clases. Para añadir una clase basta con crear su archivo de datos
// (definición + hechizos) y registrarla aquí: el motor de combate no cambia.
import { FURIAK, FURIAK_SPELLS } from './furiak.js';
import { ENSALMADOR, ENSALMADOR_SPELLS } from './ensalmador.js';
import { PETARDISTA, PETARDISTA_SPELLS } from './petardista.js';

export const CLASSES = {
  furiak: FURIAK,
  ensalmador: ENSALMADOR,
  petardista: PETARDISTA,
};

export const CLASS_ORDER = ['furiak', 'ensalmador', 'petardista'];

export const CLASS_SPELLS = {
  ...FURIAK_SPELLS,
  ...ENSALMADOR_SPELLS,
  ...PETARDISTA_SPELLS,
};
