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
