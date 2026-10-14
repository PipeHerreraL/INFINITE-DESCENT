// Error de reglas del juego: una acción ilegal. El reducer lo captura y deja el
// estado intacto, mostrando el mensaje al jugador.
export class RuleError extends Error {
  constructor(message, code = 'rule') {
    super(message);
    this.name = 'RuleError';
    this.code = code;
  }
}

export function assertRule(condition, message, code) {
  if (!condition) throw new RuleError(message, code);
}
