# Infinite Descent — Crónicas del Abismo Onírico

Roguelike táctico por turnos inspirado en el combate de **Dofus** (casillas, PA/PM,
alcance, línea de visión, placaje, empujes) y en la estructura por expediciones de los
roguelikes modernos. Cada expedición es una *build* distinta: equipo con rarezas y
encantamientos, sets, reliquias, variantes de hechizo, runas y talentos que se
combinan mediante un sistema de disparadores.

> Proyecto de fans e independiente. No usa recursos oficiales de Ankama: el arte es
> SVG geométrico original y todos los nombres de clases, monstruos y objetos son
> propios. Cada clase indica en qué arquetipo de Dofus se inspira.

## Jugar en línea

La versión publicada está en **https://pipeherreral.github.io/INFINITE-DESCENT/**
y se juega igual en el ordenador y en el móvil (en vertical o en horizontal). Desde
el navegador del móvil se puede añadir a la pantalla de inicio como una app.

### Publicación en GitHub Pages

El workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) instala
dependencias, pasa las pruebas y compila en cada push. Si el push es a la rama por
defecto del repositorio (o se lanza a mano desde la pestaña *Actions*), publica
`dist/` en GitHub Pages.

Solo hay que activarlo una vez: en **Settings → Pages → Build and deployment**, elegir
**Source: GitHub Actions**. Después cada push a la rama por defecto actualiza la web.
La compilación usa rutas relativas (`base: './'`), así que funciona bajo
`/<repositorio>/` sin configurar nada más.

## Cómo ejecutarlo

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm run build      # compilación de producción en dist/
npm run preview    # sirve la compilación
npm test           # 99 pruebas de reglas, contenido, cámara y simulaciones (Vitest)
npm run sim -- 20  # simulador de equilibrio: 20 expediciones por clase
```

La partida y la progresión permanente se guardan solas en `localStorage`.

## Qué incluye esta versión

| Sistema | Estado |
|---|---|
| 3 clases jugables (Furiak, Ensalmador, Petardista) con pasiva, 5 hechizos iniciales, 4 aprendibles, 6 talentos y 2 orígenes | ✅ |
| Tablero isométrico con LdV, obstáculos, agujeros, placaje/huida, zona de control y fase de colocación | ✅ |
| Hechizos con coste, alcance (modificable o no), en línea, LdV, áreas, lanzamientos por turno/objetivo, enfriamiento y críticos | ✅ |
| Empujes con daño de colisión, atracciones, saltos, intercambios, invocaciones y bombas en cadena | ✅ |
| Estados (quemadura, veneno, aturdido, vulnerable…), escudos y robo de vida | ✅ |
| IA de enemigos por utilidad (cuerpo a cuerpo, distancia, soporte, invocador) | ✅ |
| 2 jefes con ataques anunciados, fases y debilidades aprendibles | ✅ |
| Equipo en 11 espacios, 5 rarezas, afijos, encantamientos épicos, 12 legendarios y armas como hechizo | ✅ |
| 4 sets con bonificaciones de 2, 3 y 4 piezas | ✅ |
| 20 reliquias (incluidas maldiciones) con sinergias | ✅ |
| Inventario limitado, comparación, sustitución, venta y desmantelado | ✅ |
| Mapa de 2 estratos × 8 pisos generado con semilla, y Descenso Infinito opcional | ✅ |
| Mercader, forja (mejorar, transmutar, cambiar elemento), 12 eventos, cofres, descanso y salas de desafío | ✅ |
| Desafíos de combate al estilo Dofus (Versátil, Estatua, Zombi…) | ✅ |
| Subida de nivel con dones: talento, hechizo, runa, variante o estadística | ✅ |
| Meta-progresión: esencia, 11 desbloqueos, 6 niveles de Pesadilla, códice y estadísticas | ✅ |
| Persistencia local versionada (meta y expedición por separado) | ✅ |

## Controles

### Ratón y teclado

- **Clic** en una casilla verde para moverte.
- **1-9** o clic en la barra para elegir un hechizo; luego, clic en una casilla azul.
- **Esc** o clic derecho cancela el hechizo seleccionado.
- **Espacio** termina el turno.
- **C** abre la hoja de equipo y estadísticas.
- Pasa el ratón sobre unidades, hechizos, objetos y nodos para ver todos los detalles.
- **Rueda** para acercar o alejar el tablero; arrastra para moverlo.

### Pantalla táctil

- **Toca** una casilla para previsualizar el camino, el área o el daño, y **vuelve a
  tocarla** para confirmar. Así no se mueve ni se lanza nada por un toque impreciso.
- **Arrastra** el tablero para moverlo y **pellízcalo** para hacer zoom (también hay
  botones +, − y ◎ para centrar en la unidad activa).
- **Mantén pulsado** un hechizo, un objeto, una reliquia o un nodo del mapa para ver
  su ficha; un toque corto sigue ejecutando la acción.
- **Toca** a una unidad para ver su ficha. El registro, el equipo y el menú están en
  la barra superior del combate.

## Arquitectura

```
src/
  core/        Lógica pura, sin React y serializable (testeable en Node)
    grid/        geometría, LdV, áreas, pathfinding, generación de tableros
    combat/      turnos, acciones, hechizos, efectos, daño, estados,
                 disparadores, bombas, telegrafía, desafíos, IA
    effects/     DSL de condiciones y valores de los disparadores
    hero/        perfil derivado del héroe (estadísticas + fuentes)
    items/       generación, estadísticas, equipamiento y sets
    run/         expedición, mapa, encuentros, recompensas, salas, economía
    meta/        progresión permanente y persistencia
    game/        reducer central y store (con director de turnos de la IA)
    sim/         jugador automático para simulaciones
  content/     Datos del juego: clases, hechizos, objetos, sets, reliquias,
               monstruos, jefes, estratos, eventos, desafíos, modificadores
  ui/          React: pantallas, tablero SVG (con cámara: zoom y desplazamiento),
               componentes, estilos (mobile.css para móvil y táctil)
tests/         Vitest
public/        Iconos y manifiesto web (instalable en el móvil)
.github/       Workflow de compilación, pruebas y publicación en GitHub Pages
scripts/       simulate.mjs
docs/          DISENO.md (visión, decisiones y pendientes)
```

Principios:

- **El estado es serializable.** El RNG guarda su estado dentro de la partida, así
  que las expediciones se reproducen con la misma semilla y se pueden guardar en
  cualquier momento, incluso a mitad de combate.
- **Las acciones ilegales no cambian nada.** El reducer trabaja sobre un clon. Si
  una regla se incumple, se lanza `RuleError`, el estado original queda intacto y el
  motivo se muestra al jugador.
- **El contenido son datos.** Las sinergias se declaran como *fuentes* con
  estadísticas y disparadores (evento + condiciones + acciones + límites). No hay
  código específico para cada combinación.
- **La IA usa las mismas reglas que el jugador.** Toda decisión pasa por `canCast` y
  `movementMap`.

### Añadir contenido

- **Clase:** crea `src/content/classes/<clase>.js` con su definición y sus hechizos y
  regístrala en `src/content/classes/index.js`. Si necesita un sprite nuevo,
  añádelo en `src/ui/board/UnitSprite.jsx`.
- **Objeto, set o reliquia:** añade una entrada en `src/content/items/*.js` o en
  `src/content/relics.js`.
- **Monstruo o jefe:** añade sus hechizos en `src/content/enemies/spells.js` y la
  criatura en `monsters.js` (fases y telegrafías incluidas), y referénciala en
  `src/content/acts.js`.
- `tests/content.test.js` valida todas las referencias, así que una errata en los
  datos falla en `npm test`.

## Documentación

Ver [`docs/DISENO.md`](docs/DISENO.md): visión, ciclo de juego, mecánicas
diferenciadoras, decisiones técnicas, equilibrio y lo que queda pendiente.
