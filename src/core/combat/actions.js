import { assertRule, RuleError } from '../errors.js';
import { unitAt, getHero } from './state.js';
import { moveUnit } from './movement.js';
import { castSpell } from './spellcast.js';
import { startCombat, endTurn, checkEnd } from './turns.js';
import { TRIGGER_BUDGET } from './triggers.js';
import { decideAction } from './ai/ai.js';

// Punto de entrada de las acciones de combate (puras sobre un borrador del estado).

function requireHeroTurn(combat) {
  assertRule(combat.phase === 'active', 'El combate no está activo.');
  assertRule(combat.activeId === combat.heroId, 'No es tu turno.');
}

/** Ejecuta la siguiente decisión de la IA para la unidad activa (no controlada). */
export function runAiStep(combat, { controlHero = false } = {}) {
  const unit = combat.units[combat.activeId];
  if (!unit) return null;
  const decision = decideAction(combat, unit.id);
  try {
    if (decision.type === 'move') moveUnit(combat, unit, decision);
    else if (decision.type === 'cast') castSpell(combat, unit, decision.spellId, decision);
    else {
      endTurn(combat);
      return decision;
    }
  } catch (err) {
    if (!(err instanceof RuleError)) throw err;
    // Una decisión inválida nunca debe bloquear el combate: se termina el turno.
    endTurn(combat);
    return { type: 'endTurn', error: err.message };
  }
  // Si la unidad murió durante su propia acción (p. ej., por espinas), su turno termina.
  if (!checkEnd(combat) && unit.dead && combat.activeId === unit.id && !controlHero) endTurn(combat);
  return decision;
}

export function combatAction(combat, action) {
  combat.triggerBudget = TRIGGER_BUDGET;
  combat.actionSeq += 1;
  switch (action.type) {
    case 'place': {
      assertRule(combat.phase === 'placement', 'La colocación ya ha terminado.');
      const ok = combat.board.playerStarts.some((c) => c.x === action.x && c.y === action.y);
      assertRule(ok, 'Solo puedes colocarte en las casillas de inicio.');
      const other = unitAt(combat, action.x, action.y);
      assertRule(!other || other.id === combat.heroId, 'Esa casilla está ocupada.');
      const hero = getHero(combat);
      hero.x = action.x;
      hero.y = action.y;
      return;
    }
    case 'ready':
      assertRule(combat.phase === 'placement', 'El combate ya ha empezado.');
      startCombat(combat);
      return;
    case 'move': {
      requireHeroTurn(combat);
      moveUnit(combat, getHero(combat), { x: action.x, y: action.y });
      checkEnd(combat);
      return;
    }
    case 'cast': {
      requireHeroTurn(combat);
      castSpell(combat, getHero(combat), action.spellId, { x: action.x, y: action.y });
      checkEnd(combat);
      return;
    }
    case 'autoTurn': {
      // Turno automático del héroe (simulaciones y pruebas).
      requireHeroTurn(combat);
      for (let i = 0; i < 20 && combat.phase === 'active' && combat.activeId === combat.heroId; i++) {
        // Cada paso cuenta como una acción propia (límites perAction y presupuesto).
        if (i > 0) {
          combat.actionSeq += 1;
          combat.triggerBudget = TRIGGER_BUDGET;
        }
        runAiStep(combat, { controlHero: true });
      }
      checkEnd(combat);
      return;
    }
    case 'endTurn':
      requireHeroTurn(combat);
      endTurn(combat);
      return;
    case 'aiStep': {
      assertRule(combat.phase === 'active', 'El combate no está activo.');
      const controlled = combat.activeId === combat.heroId;
      assertRule(!controlled || action.autoHero, 'Es tu turno.');
      runAiStep(combat, { controlHero: controlled });
      checkEnd(combat);
      return;
    }
    default:
      throw new RuleError(`Acción de combate desconocida: ${action.type}`);
  }
}
