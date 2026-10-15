# INFINITE DESCENT — Documento de diseño

> Roguelike táctico por turnos inspirado en el combate de Dofus y en la estructura
> por expediciones de los roguelikes modernos.

## 0. Nombre e identidad

**Propuesta de nombre:** **Infinite Descent — Crónicas del Abismo Onírico**.

Se elimina "Dofus" del título: es una marca registrada de Ankama, y un juego
independiente no debería depender de ella. El mundo propio es el **Abismo Onírico**,
un sueño colectivo que se hunde bajo el mundo. Cada expedición es un descenso por
sus estratos, guiño a *Sueños Infinitos* sin copiarlo.

Las clases, monstruos, objetos y sets usan **nombres originales**. Cada clase indica
el arquetipo de Dofus en el que se inspira (`archetype`) como referencia de diseño:

| Clase       | Arquetipo | Identidad |
|-------------|-----------|-----------|
| **Furiak**      | Yopuka    | Cuerpo a cuerpo, saltos, acumulación de *Ira*. |
| **Ensalmador**  | Aniripsa  | Curación, *Ensalmo* (la sobrecuración se convierte en escudo), invocación. |
| **Petardista**  | Tymador   | Bombas que se cargan, reacciones en cadena y empujes. |

Todo el arte es geométrico y original (SVG generado en código). Ningún recurso
oficial se usa ni se redistribuye.

## 1. Visión final

Un juego en el que **cada expedición es una build nueva**. El jugador elige una clase,
desciende por estratos generados con semilla y construye el personaje con
equipamiento, sets, reliquias, variantes de hechizo y talentos. El combate conserva
las piezas que hacen único a Dofus: casillas en vista isométrica, PA/PM, alcance,
línea de visión, placaje y huida, empujes con daño por colisión, invocaciones, fase
de colocación y *desafíos* opcionales por combate.

La meta: que al morir el jugador piense *"la próxima vez pruebo bombas de agua con
el set del Minero"*.

## 2. Ciclo principal de una expedición

```
Santuario (meta) ──► Elegir clase + origen ──► Estrato 1 (mapa de nodos)
     ▲                                             │
     │                     ┌───────────────────────┘
     │                     ▼
     │      Elegir nodo: combate · élite · desafío · mercader · forja ·
     │                   cofre · evento · descanso
     │                     │
     │      Combate táctico ──► recompensas (kamas, XP, elegir objeto/reliquia)
     │                     │        └─► subir de nivel: elegir 1 de 3 dones
     │                     ▼
     │      Gestionar equipo (equipar, comparar, desmantelar)
     │                     │
     │            Jefe del estrato ──► Estrato 2 ──► Jefe final
     │                     │
     └── Esencia onírica ◄─┴── Muerte o victoria (resumen + desbloqueos)
```

## 3. Mecánicas diferenciadoras

1. **El equipamiento redefine hechizos y reglas.** El arma es un hechizo más (con su
   alcance, coste y área). Las piezas épicas añaden *encantamientos* con disparadores
   y las legendarias cambian reglas (por ejemplo, la *Capa del Mártir* convierte el
   daño recibido en potencia).
2. **Sets con decisiones reales.** Las bonificaciones de 2, 3 y 4 piezas compiten con
   objetos legendarios y épicos; completar un set no siempre es lo óptimo.
3. **Sinergias por eventos.** Cada objeto, reliquia, talento, estado o modificador de
   piso es una *fuente* con estadísticas y disparadores declarativos (evento +
   condiciones + acciones + límites). Las combinaciones emergen sin código específico.
4. **Elemento dominante.** Algunos efectos (las bombas del Petardista) cambian según
   el elemento predominante del equipo: cambiar de objetos cambia cómo juegas.
5. **Variantes de hechizo** (transformaciones excluyentes) y **runas** de mejora.
6. **Desafíos estilo Dofus** en cada combate (Versátil, Estatua, Zombi…), con
   recompensa extra opcional.
7. **Jefes con telegrafía**: ataques anunciados, fases y debilidades aprendibles
   (Bramador queda aturdido si su carga choca contra un pilar).

## 4. Arquitectura técnica

- **React 19 + Vite + JavaScript moderno.** Sin librerías de estado ni de UI.
- **Núcleo de juego puro (`src/core`)** sin dependencias de React: toda la lógica es
  testeable en Node. El estado es **serializable** (sin funciones ni clases) y el RNG
  guarda su estado dentro de la partida, así que las expediciones son reproducibles
  por semilla y se pueden guardar en cualquier momento.
- **Contenido como datos (`src/content`)**: clases, hechizos, objetos, sets,
  reliquias, enemigos, jefes, eventos, desafíos y modificadores. Añadir una clase
  supone añadir un archivo de datos y registrarlo.
- **Store central (`src/core/game`)**: `dispatch(action)` → `reducer` clona el estado,
  aplica la acción y valida las reglas. Una acción ilegal lanza `RuleError` y el
  estado no cambia. La UI se suscribe con `useSyncExternalStore`.

```
src/
  core/
    rng.js               RNG determinista con estado serializable
    grid/                tablero, geometría (distancias, LdV, áreas), pathfinding, generación
    effects/             DSL de condiciones y valores para disparadores
    combat/              creación, turnos, acciones, validación de hechizos, efectos,
                         daño, estados, disparadores, bombas, telegrafía, desafíos, IA
    hero/                perfil del héroe (estadísticas derivadas + fuentes), hechizos efectivos
    items/               generación de objetos, estadísticas, equipamiento, sets, textos
    run/                 expedición, mapa, encuentros, recompensas, mercader, forja, eventos
    meta/                progresión permanente y persistencia
    game/                store, reducer y acciones
  content/               datos del juego
  ui/                    pantallas, tablero isométrico SVG, componentes, estilos
tests/                   Vitest: reglas críticas y simulaciones automáticas
scripts/simulate.mjs     simulador de expediciones para equilibrado
```

### Sistema de fuentes y disparadores

Las fuentes provienen de la clase, los talentos, el equipo, los sets, las reliquias,
los dones, los estados y los modificadores de piso. Cada una se describe así:

```js
{ stats: { power: 25 },
  triggers: [{
    event: 'dealDamage',                      // perspectiva del dueño
    conditions: [{ type: 'isCrit' }],
    actions: [{ type: 'damage', target: 'areaAroundTarget', radius: 1,
                element: 'payload', value: { from: 'amount', pct: 35 }, fixed: true }],
    limit: { perTurn: 2 }, chance: 100, priority: 0, maxDepth: 0,
  }] }
```

Eventos: `dealDamage`, `takeDamage`, `beforeDealDamage`, `beforeTakeDamage`,
`kill`, `death`, `allyDeath`, `healDone`, `healReceived`, `castSpell`, `turnStart`,
`turnEnd`, `combatStart`, `causeCollision`, `collided`, `moveEnd`, `bombExplode`.
Las prioridades ordenan la ejecución. Los límites cuentan por turno y por combate.
La prevención de bucles combina tres mecanismos: profundidad de cadena (`maxDepth`),
un tope global de profundidad y un presupuesto de disparos por acción.

## 5. Alcance de la primera versión jugable

1. Selección entre tres clases (con orígenes desbloqueables).
2. Expedición de **2 estratos × 8 pisos** con mapa de nodos ramificado y semilla.
3. Tablero isométrico con colocación, movimiento, placaje, LdV, áreas y empujes.
4. Hechizos con coste, alcance, restricciones, enfriamientos, variantes y runas.
5. IA de enemigos por utilidad (cuerpo a cuerpo, distancia, soporte e invocador)
   y jefes con telegrafía y fases.
6. Victoria, derrota, recompensas y subida de nivel con dones.
7. Equipo con 11 espacios, rarezas, afijos, encantamientos y legendarios.
8. 4 sets con bonificaciones de 2, 3 y 4 piezas.
9. Reliquias con sinergias, inventario limitado, comparación y sustitución.
10. Mercader, forja (mejorar, transmutar, cambiar el elemento, desmantelar),
    eventos, cofres, descanso y salas de desafío.
11. 2 jefes: **Bramador** (estrato 1) y la **Tejedora de Pesadillas** (estrato 2).
12. Progresión permanente: esencia onírica, santuario de desbloqueos, códice,
    estadísticas y niveles de Pesadilla.
13. Persistencia local de la partida en curso y de la meta-progresión.
14. Pruebas de las reglas críticas y un simulador de expediciones.

## 6. Supuestos adoptados

- **Escala propia**, no la de Dofus: los héroes tienen entre 110 y 140 PV y los
  hechizos causan entre 10 y 20 de daño base.
- **La vida persiste entre combates** y se recupera el 20 % de la vida máxima tras
  cada victoria.
- **Zona de control:** al entrar en una casilla adyacente a un enemigo con placaje
  termina el movimiento. Al salir de ella, el **placaje y la huida** de Dofus pueden
  restar PM.
- Por defecto, el daño de los hechizos solo afecta a enemigos y las curas solo a
  aliados.
- Las invocaciones aliadas actúan con IA. Las bombas no tienen turno propio: se
  cargan al empezar el turno de su dueño.
- Por defecto, la duración de un estado se descuenta al final del turno de quien lo
  sufre. Los beneficios que alguien se aplica a sí mismo no se descuentan en el turno
  en que se lanzan.

## 7. Estado de la primera versión

Los 17 puntos del alcance mínimo están implementados y conectados en la interfaz:

| # | Requisito | Dónde |
|---|-----------|-------|
| 1 | Selección entre tres clases | `ClassSelectScreen`, `content/classes` |
| 2 | Inicio de expedición | `core/run/run.js` (`createRun`) |
| 3 | Tablero táctico | `core/grid`, `ui/board/Board.jsx` |
| 4 | Movimiento y hechizos | `core/combat/movement.js`, `spellcast.js` |
| 5 | Enemigos con IA | `core/combat/ai/ai.js` |
| 6 | Victoria y derrota | `core/combat/turns.js` (`checkEnd`) |
| 7 | Recompensas | `core/run/rewards.js`, `RewardView` |
| 8 | Equipo con estadísticas y efectos | `core/items`, `content/items` |
| 9 | Sets (4) | `content/items/sets.js`, `core/items/sets.js` |
| 10 | Reliquias con sinergias (20) | `content/relics.js` |
| 11 | Inventario y sustitución | `core/items/equipment.js`, `CharacterSheet` |
| 12 | Mercader y forja | `core/run/shop.js`, `forge.js` |
| 13 | Varios pisos | `core/run/mapgen.js` (2 × 8 + Descenso Infinito) |
| 14 | Jefe con mecánica especial | Bramador (carga anunciada + pilares) y Tejedora (redes + huevos) |
| 15 | Final de expedición | `VictoryView`, `RunEndView` |
| 16 | Persistencia de desbloqueos | `core/meta/persistence.js` |
| 17 | Interfaz coherente | `ui/` |

### Validación

- `npm test`: 99 pruebas. Cubren PA y PM, validaciones de hechizos, línea de
  visión, placaje, daño y resistencias, escudos, colisiones, estados, turnos,
  victoria y derrota, sinergias, prevención de bucles, bombas, recálculo de
  estadísticas, activación de sets, restricciones de equipo, recompensas aplicadas
  una sola vez, compras sin fondos, forja, mapa reproducible, persistencia, reinicio
  sin mejoras temporales, validación de todo el contenido y la cámara del tablero
  (zoom, desplazamiento y límites).
- `npm run sim`: un jugador automático juega expediciones completas con las mismas
  reglas que la interfaz. Sirve para detectar bloqueos y medir el equilibrio.

### Equilibrio inicial (simulador, 20 expediciones por clase, dificultad 0)

| Clase | Gana al jefe del estrato I | Supera el estrato I | Victorias totales |
|---|---|---|---|
| Furiak | 27 % | 4/20 | 2/20 |
| Ensalmador | 54 % | 11/20 | 4/20 |
| Petardista | 30 % | 6/20 | 1/20 |

El jugador automático no aprovecha a propósito el pilar contra Bramador, se cura
mal y elige dones al azar. Por eso estas cifras son una **cota inferior**: un
jugador humano debería superarlas con claridad. Los combates normales se ganan casi
siempre (pierden en torno al 20 % de la vida) y el riesgo se concentra en élites y
jefes. El equilibrio necesita sesiones de juego reales.

## 8. Pendiente y limitaciones conocidas

No se ha sustituido nada por funcionalidad falsa. Lo que falta, documentado:

- **Contenido:** 3 clases, 2 estratos con jefe y unos 50 objetos. La arquitectura
  admite más sin tocar el motor.
- **Invocaciones controladas por el jugador:** en Dofus el jugador las controla; aquí
  las maneja la IA para simplificar la interfaz.
- **Placaje simplificado:** solo resta PM (en Dofus también resta PA).
- **Trampas y glifos persistentes en casillas:** no existen como sistema propio. Los
  ataques anunciados cubren parte de ese papel.
- **Consumibles en combate:** no hay pociones usables durante el combate; la
  curación se compra en el mercader.
- **Audio:** sin música ni efectos de sonido.
- **Arte:** los héroes, 16 monstruos, las bombas (una por elemento) y el mercader
  tienen ilustración propia (IA de imágenes de Canva, recortada con
  `scripts/sprites/cut_sheet.py`). Setita, Bloblín pequeño, Arañita, Bramador y la
  Tejedora reutilizan una ilustración con otro color o tamaño de forma provisional:
  los dos jefes merecen arte propio. Solo el saco de huevos sigue en SVG.
- **Móvil:** la interfaz se adapta a móvil en vertical y en horizontal y a pantallas
  táctiles (ver sección 9). No hay modo sin conexión (no se usa *service worker*):
  la primera carga necesita red.
- **Idioma:** los textos del contenido están en español y dentro de los datos; falta
  una capa de localización.
- **IA:** evalúa la mejor acción inmediata sin anticipar turnos futuros. Los jefes
  usan telegrafía y fases, no planificación profunda.
- **Semillas y desbloqueos:** la misma semilla reproduce la misma expedición solo con
  los mismos desbloqueos. Algunos desbloqueos (reliquia de partida, Ojo del
  Mercader, objetos añadidos al botín) consumen números aleatorios del mismo flujo.
  Para compartir semillas entre jugadores habría que separar esos flujos.

## 9. Móvil y publicación

- **Detección:** `src/ui/hooks/useMedia.js` define dos consultas. *Compacta*
  (`max-width: 720px` o `max-height: 520px`) cambia la disposición. *Táctil*
  (`hover: none` y `pointer: coarse`) cambia los textos de ayuda y oculta los atajos
  de teclado. Los estilos están en `src/ui/styles/mobile.css`, con las mismas
  consultas.
- **Tablero:** la cámara (`src/ui/board/camera.js`, funciones puras con pruebas)
  ajusta el `viewBox` del SVG a la proporción del contenedor. Admite zoom con
  pellizco, rueda o botones y desplazamiento arrastrando. El zoom inicial hace que
  una casilla mida al menos 44 px, y la cámara va hacia la unidad que empieza turno
  si queda fuera de la vista.
- **Confirmación en dos toques:** sin ratón no hay «pasar por encima». El primer
  toque previsualiza (camino, área, daño) y el segundo, sobre la misma casilla,
  ejecuta. Arrastrar o pellizcar nunca cuenta como toque. Los clics del ratón siguen
  ejecutando a la primera.
- **Información:** el componente `Tip` muestra con el ratón el tooltip de siempre.
  En táctil, mantener pulsado abre una ficha inferior sin disparar la acción, y un
  toque corto sobre algo que no es un botón también la abre.
- **Disposición compacta:**
  - En combate desaparece el HUD de la expedición: la barra superior lleva la línea
    de turnos, el desafío, la ronda y los botones de registro, equipo y menú.
  - La ficha de unidad se abre sobre el tablero al tocarla.
  - En vertical, la barra inferior junta vida, PA/PM y fin de turno, y los hechizos
    van en una fila desplazable. En horizontal, los controles pasan a una columna a
    la derecha.
  - La hoja de personaje usa pestañas y los diálogos se abren como hojas inferiores.
  - La selección de clase deja fijo el botón «Descender».
- **Avisos:** los errores de reglas salen arriba y no capturan toques, así que nunca
  tapan los botones. Si la interfaz ya sabe que una casilla no es válida, el motivo
  aparece en la pista del tablero, sin pasar por el aviso de error.
- **Publicación:** `.github/workflows/deploy.yml` compila, prueba y publica en
  GitHub Pages en cada push a la rama por defecto. `public/manifest.webmanifest` y
  los iconos permiten instalar el juego en la pantalla de inicio. Las rutas son
  relativas, así que funciona bajo `/<repositorio>/`.

## 10. Línea de visión e IA de movimiento

- **Línea de visión** (`hasLineOfSight` en `src/core/grid/geometry.js`): se traza
  entre los centros de las casillas. Cada bloqueo (obstáculo, unidad o borde del
  tablero) ocupa el centro de su casilla, sin un margen de `LOS_MARGIN` (20 %) por
  lado. Rozar una esquina o un borde no tapa: se puede disparar en diagonal junto a
  un obstáculo, y una unidad al lado proyecta un cono de sombra estrecho y no media
  zona del mapa. Dos bloqueos vecinos, de lado o en diagonal, forman un muro sin
  rendijas. La regla es simétrica y los agujeros no bloquean.
- **Movimiento de la IA** (`bestMove` en `src/core/combat/ai/ai.js`): cuando no
  puede lanzar nada este turno, cada enemigo calcula sus *posiciones de ataque*:
  casillas libres desde las que alcanzaría a un enemigo con alguno de sus hechizos,
  respetando el alcance, la línea recta y la línea de visión. Avanza por el camino
  más corto hacia la más cercana con una búsqueda desde todas a la vez, así que
  rodea paredes y agujeros. Si otros monstruos tapan el paso, usa el camino del
  terreno. Los de distancia, ya en posición, prefieren su alcance cómodo.

