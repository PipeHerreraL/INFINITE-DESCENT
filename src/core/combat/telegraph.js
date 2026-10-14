import { areaCells, cellType, inBoard } from '../grid/geometry.js';
import { resolveSpell } from '../spells.js';
import { unitAt, addFx, addLog } from './state.js';
import { executeEffects } from './effects.js';
import { applyDamage } from './damage.js';
import { applyStatus } from './statuses.js';

// Ataques telegrafiados: se anuncian al final del turno del lanzador y se
// resuelven al inicio de su siguiente turno. Dan al jugador la oportunidad de
// anticiparse (apartarse de la línea, usar pilares…).

export function chargeDirection(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return { x: 1, y: 0 };
  if (Math.abs(dx) >= Math.abs(dy)) return { x: Math.sign(dx), y: 0 };
  return { x: 0, y: Math.sign(dy) };
}

/** Recorrido de una carga desde la posición actual de la unidad. */
export function chargeLine(combat, unit, dir) {
  const cells = [];
  let cur = { x: unit.x, y: unit.y };
  for (let i = 0; i < 40; i++) {
    const n = { x: cur.x + dir.x, y: cur.y + dir.y };
    if (!inBoard(combat.board, n.x, n.y)) return { cells, stop: 'edge' };
    const t = cellType(combat.board, n.x, n.y);
    if (t !== 'floor') return { cells, stop: t === 'obstacle' ? 'wall' : 'edge', at: n };
    const other = unitAt(combat, n.x, n.y);
    if (other && other.id !== unit.id) return { cells: [...cells, n], stop: 'unit', unitId: other.id };
    cells.push(n);
    cur = n;
  }
  return { cells, stop: 'edge' };
}

/** Casillas amenazadas por un telegrafiado (para la interfaz y la IA del héroe). */
export function telegraphCells(combat, unit, t) {
  if (t.kind === 'charge') return chargeLine(combat, unit, t.dir).cells;
  return t.cells;
}

export function createTelegraph(combat, caster, spell, cell) {
  combat.seq.tele = (combat.seq.tele ?? 0) + 1;
  const t = { id: combat.seq.tele, spellId: spell.id, name: spell.name, kind: spell.telegraph.kind, round: combat.round };
  if (t.kind === 'charge') {
    t.dir = chargeDirection(caster, cell);
  } else {
    t.center = { x: cell.x, y: cell.y };
    t.cells = areaCells(combat.board, spell.area, cell, caster);
  }
  caster.telegraphs.push(t);
  addLog(combat, `⚠ ${caster.name} prepara ${spell.name}.`, 'boss');
  addFx(combat, { type: 'banner', unitId: caster.id, text: spell.name, warn: true });
  return t;
}

export function resolveTelegraphs(combat, unit) {
  const list = unit.telegraphs;
  unit.telegraphs = [];
  for (const t of list) {
    if (unit.dead) return;
    const spell = unit.spells.find((s) => s.id === t.spellId) ?? resolveSpell(t.spellId);
    addLog(combat, `${unit.name} desata ${spell.name}.`, 'boss');
    if (t.kind === 'charge') {
      executeCharge(combat, unit, spell, t.dir);
    } else {
      executeEffects(combat, spell.effects, {
        caster: unit, spell, targetCell: t.center, centerCell: t.center, areaCells: t.cells, depth: 0, origin: 'telegraph',
      });
      addFx(combat, { type: 'explosion', x: t.center.x, y: t.center.y, cells: t.cells, element: spell.element });
    }
  }
}

/** Carga en línea recta: golpea a la primera unidad o se estrella contra un obstáculo. */
export function executeCharge(combat, unit, spell, dir) {
  const eff = spell.effects.find((e) => e.type === 'charge');
  const line = chargeLine(combat, unit, dir);
  const from = { x: unit.x, y: unit.y };
  const free = line.stop === 'unit' ? line.cells.slice(0, -1) : line.cells;
  if (free.length) {
    const last = free[free.length - 1];
    unit.x = last.x;
    unit.y = last.y;
    addFx(combat, { type: 'slide', unitId: unit.id, from, to: { ...last } });
  }
  if (line.stop === 'unit') {
    const victim = combat.units[line.unitId];
    if (victim && victim.side !== unit.side) {
      const cell = { x: victim.x, y: victim.y };
      executeEffects(combat, eff.hit, { caster: unit, spell, targetCell: cell, centerCell: cell, areaCells: [cell], depth: 0, origin: 'telegraph' });
    }
  } else if (line.stop === 'wall') {
    addLog(combat, `¡${unit.name} se estrella contra el obstáculo!`, 'boss');
    addFx(combat, { type: 'impact', x: line.at.x, y: line.at.y });
    if (eff.wallSelfDamage) {
      applyDamage(combat, { source: null, target: unit, amount: eff.wallSelfDamage, element: 'neutral', kind: 'push', depth: 1, label: 'El impacto' });
    }
    for (const st of eff.wallStatus ?? []) {
      applyStatus(combat, unit, st.status, { value: st.value ?? 0, duration: st.duration ?? 1, sourceId: unit.id });
    }
  }
}
