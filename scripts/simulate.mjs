// Simulador de expediciones para equilibrar el juego.
// Uso: npm run sim -- [expediciones por clase] [dificultad]
import { simulateRun } from '../src/core/sim/autoplayer.js';
import { CLASS_ORDER } from '../src/content/classes/index.js';

const runs = Number(process.argv[2] ?? 20);
const difficulty = Number(process.argv[3] ?? 0);

const t0 = Date.now();
const rows = [];
for (const classId of CLASS_ORDER) {
  const results = [];
  const deaths = {};
  const combatStats = { normal: [], elite: [], boss: [], challenge: [] };
  for (let i = 0; i < runs; i++) {
    const r = simulateRun({
      classId,
      seed: `SIM${i}`,
      difficulty,
      onCombat: (c, run) => {
        const hero = c.units[c.heroId];
        const kind = c.encounter.nodeType;
        (combatStats[kind] ??= []).push({ won: c.phase === 'victory', hpLost: 1 - hero.hp / hero.maxHp, rounds: c.round, floor: c.floor });
      },
    });
    results.push(r);
    if (!r.victory) {
      const k = `${r.lastNode}@${r.floor}`;
      deaths[k] = (deaths[k] ?? 0) + 1;
    }
  }
  const wins = results.filter((r) => r.victory).length;
  const avgFloor = results.reduce((a, r) => a + r.floor, 0) / runs;
  const act1 = results.filter((r) => r.floor > 8 || r.victory).length;
  const errors = results.reduce((a, r) => a + r.errors, 0);
  const summarize = (list) => {
    if (!list?.length) return '-';
    const won = list.filter((x) => x.won).length;
    const hp = list.reduce((a, x) => a + x.hpLost, 0) / list.length;
    const rounds = list.reduce((a, x) => a + x.rounds, 0) / list.length;
    return `${list.length} c. · ${Math.round((won / list.length) * 100)}% ganados · −${Math.round(hp * 100)}% vida · ${rounds.toFixed(1)} rondas`;
  };
  rows.push({ classId, wins, act1, avgFloor, errors });
  console.log(`\n=== ${classId} (${runs} expediciones, dificultad ${difficulty}) ===`);
  console.log(`Victorias: ${wins}/${runs} · Superan el estrato I: ${act1}/${runs} · Piso medio: ${avgFloor.toFixed(1)} · Errores de regla: ${errors}`);
  for (const [k, list] of Object.entries(combatStats)) console.log(`  ${k.padEnd(9)} ${summarize(list)}`);
  console.log('  Muertes:', Object.entries(deaths).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}×${v}`).join(', '));
}
console.log(`\nTiempo: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
