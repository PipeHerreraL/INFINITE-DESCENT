import { describe, it, expect } from 'vitest';
import { simulateRun } from '../src/core/sim/autoplayer.js';
import { CLASS_ORDER } from '../src/content/classes/index.js';
import { makeCombat, makeRun, autoplay } from './helpers.js';

// Pruebas de estrés: expediciones completas jugadas por la IA en ambos bandos.
// Detectan bloqueos, bucles infinitos y acciones ilegales generadas por el motor.

describe('simulación de expediciones', () => {
  for (const classId of CLASS_ORDER) {
    it(`${classId}: las expediciones terminan sin errores de reglas`, () => {
      for (const seed of ['ST1', 'ST2', 'ST3']) {
        const r = simulateRun({ classId, seed, maxSteps: 30000 });
        expect(r.ended).toBe(true);
        expect(r.errors).toBe(0);
        expect(r.floor).toBeGreaterThanOrEqual(1);
      }
    }, 60000);
  }

  it('una misma semilla y política dan el mismo resultado', () => {
    const a = simulateRun({ classId: 'petardista', seed: 'DET' });
    const b = simulateRun({ classId: 'petardista', seed: 'DET' });
    expect(a.floor).toBe(b.floor);
    expect(a.stats).toEqual(b.stats);
  }, 30000);

  it('la esencia se acumula en la meta al terminar', () => {
    const r = simulateRun({ classId: 'ensalmador', seed: 'ESS' });
    expect(r.meta.stats.runs).toBe(1);
    expect(r.meta.essence).toBe(r.essence);
    expect(r.essence).toBeGreaterThan(0);
  }, 30000);
});

describe('combates automáticos', () => {
  it('los combates contra cada élite y jefe terminan', async () => {
    for (const id of ['pluminAlfa', 'jabaliAcorazado', 'setaAnciana', 'golemAncestral', 'brujoKobold', 'bramador', 'tejedora']) {
      const c = makeCombat({ run: makeRun('petardista', id), enemies: [{ id, x: 6, y: 2 }] });
      const steps = await autoplay(c);
      expect(['victory', 'defeat']).toContain(c.phase);
      expect(steps).toBeLessThan(4000);
    }
  }, 30000);
});
