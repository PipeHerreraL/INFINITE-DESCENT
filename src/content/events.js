// Eventos narrativos. Cada opción tiene coste, requisitos y efectos de expedición
// (ver core/run/runEffects.js). `random` elige un resultado ponderado.
export const EVENTS = {
  altarVariantes: {
    id: 'altarVariantes', name: 'Altar de las Variantes',
    text: 'Un altar de piedra palpita con runas cambiantes. Al tocarlo sientes que uno de tus hechizos podría tomar otra forma… a cambio de sangre.',
    options: [
      {
        label: 'Ofrenda de sangre', desc: 'Pierdes el 12% de tu vida máxima. Transformas un hechizo en una de sus variantes.',
        requires: { spellWithVariants: true }, cost: { hpPct: 12 },
        effects: [{ type: 'spellVariantChoice' }], result: 'Las runas se graban en tu memoria.',
      },
      { label: 'Marcharse', desc: 'No vale la pena.', effects: [], result: 'Das media vuelta.' },
    ],
  },
  herreroFantasma: {
    id: 'herreroFantasma', name: 'El Herrero Fantasma',
    text: 'Un herrero translúcido martillea un yunque que no existe. "Dame algo con lo que trabajar", susurra.',
    options: [
      {
        label: 'Ofrecer tu arma', desc: 'Mejora tu arma +1 gratis.', requires: { equippedWeaponUpgradable: true },
        effects: [{ type: 'upgradeItem', target: 'weapon', levels: 1 }], result: 'Tu arma brilla con un fulgor nuevo.',
      },
      {
        label: 'Pagar con fragmentos', desc: 'Entregas 5 fragmentos: mejora +1 dos piezas equipadas al azar.', cost: { fragments: 5 },
        effects: [{ type: 'upgradeItem', target: 'random', count: 2, levels: 1 }], result: 'Dos de tus piezas resuenan con el martillo.',
      },
      { label: 'Marcharse', desc: '', effects: [], result: 'El martilleo se apaga a tu espalda.' },
    ],
  },
  pozoDeseos: {
    id: 'pozoDeseos', name: 'El Pozo de los Deseos',
    text: 'En el fondo del pozo brillan miles de kamas… y algo más.',
    options: [
      {
        label: 'Lanzar 30 kamas', desc: '50%: una reliquia común. 50%: nada.', cost: { kamas: 30 },
        effects: [{ type: 'random', outcomes: [
          { weight: 1, effects: [{ type: 'relic', tier: 'common' }], text: '¡Algo sube flotando del pozo!' },
          { weight: 1, effects: [], text: 'Las kamas se hunden en silencio.' },
        ] }],
      },
      {
        label: 'Lanzar 90 kamas', desc: 'Una reliquia rara garantizada.', cost: { kamas: 90 },
        effects: [{ type: 'relic', tier: 'rare' }], result: 'El agua se ilumina y te devuelve un regalo.',
      },
      { label: 'Seguir', desc: '', effects: [], result: 'Guardas tus kamas.' },
    ],
  },
  cofreEncadenado: {
    id: 'cofreEncadenado', name: 'El Cofre Encadenado',
    text: 'Un cofre envuelto en cadenas oxidadas. Algo dentro susurra tu nombre.',
    options: [
      {
        label: 'Abrirlo sin más', desc: 'Obtienes un objeto legendario, pero también una maldición.',
        effects: [{ type: 'itemChoice', count: 1, rarity: 'legendary' }, { type: 'curse' }],
        result: 'La tapa cede… y algo se te pega al alma.',
      },
      {
        label: 'Romper las cadenas', desc: 'Pierdes el 15% de tu vida. Obtienes a elegir uno de dos objetos épicos.', cost: { hpPct: 15 },
        effects: [{ type: 'itemChoice', count: 2, rarity: 'epic' }], result: 'Las cadenas saltan y te hieren las manos.',
      },
      { label: 'Ignorarlo', desc: '', effects: [], result: 'Algunos susurros es mejor no escucharlos.' },
    ],
  },
  santuarioElemental: {
    id: 'santuarioElemental', name: 'Santuario Elemental',
    text: 'Cuatro pedestales con cuatro llamas de colores. Solo puedes avivar una.',
    options: [
      { label: 'Llama de Tierra', desc: '+18 Fuerza.', effects: [{ type: 'boon', name: 'Llama de Tierra', stats: { strength: 18 } }] },
      { label: 'Llama de Fuego', desc: '+18 Inteligencia.', effects: [{ type: 'boon', name: 'Llama de Fuego', stats: { intelligence: 18 } }] },
      { label: 'Llama de Agua', desc: '+18 Suerte.', effects: [{ type: 'boon', name: 'Llama de Agua', stats: { chance: 18 } }] },
      { label: 'Llama de Aire', desc: '+18 Agilidad.', effects: [{ type: 'boon', name: 'Llama de Aire', stats: { agility: 18 } }] },
    ],
  },
  pluminHerido: {
    id: 'pluminHerido', name: 'Un Plumín Herido',
    text: 'Un plumín con un ala rota te mira con ojos enormes.',
    options: [
      {
        label: 'Curarlo', desc: 'Pagas 20 kamas en vendas. Quizá te lo agradezca.', cost: { kamas: 20 },
        effects: [{ type: 'relic', tier: 'common' }], result: 'El plumín deja caer algo brillante antes de echar a volar.',
      },
      { label: 'Cenar', desc: 'Recuperas el 25% de tu vida.', effects: [{ type: 'heal', pct: 25 }], result: 'Sabe a pollo onírico.' },
      { label: 'Dejarlo en paz', desc: '', effects: [], result: 'Sigues tu camino.' },
    ],
  },
  bibliotecaOnirica: {
    id: 'bibliotecaOnirica', name: 'La Biblioteca Onírica',
    text: 'Estanterías infinitas flotan en la niebla. Los libros se abren solos a tu paso.',
    options: [
      {
        label: 'Estudiar un hechizo', desc: 'Aprendes un hechizo nuevo de tu clase (a elegir entre dos).',
        requires: { learnableSpells: true }, effects: [{ type: 'learnSpellChoice' }],
      },
      { label: 'Grabar una runa', desc: 'Aplicas una runa a uno de tus hechizos (a elegir entre tres).', effects: [{ type: 'runeChoice' }] },
      {
        label: 'Leer en voz alta', desc: 'Pierdes el 10% de tu vida. +40 XP.', cost: { hpPct: 10 },
        effects: [{ type: 'xp', amount: 40 }], result: 'Las palabras te queman la garganta, pero aprendes mucho.',
      },
    ],
  },
  reflejo: {
    id: 'reflejo', name: 'El Reflejo',
    text: 'Un espejo enorme te devuelve una sonrisa que no es la tuya. Detrás, un guardián espera.',
    options: [
      {
        label: 'Desafiar al guardián', desc: 'Combate de élite con Furia Salvaje. Recompensa: una reliquia rara y botín de élite.',
        effects: [{ type: 'combat', kind: 'elite', modifier: 'furiaSalvaje' }],
      },
      { label: 'Romper el espejo', desc: '+4 fragmentos. Pierdes el 8% de tu vida.', cost: { hpPct: 8 }, effects: [{ type: 'fragments', amount: 4 }], result: 'Los cristales cortan, pero son útiles.' },
      { label: 'Apartar la mirada', desc: '', effects: [], result: 'La sonrisa te sigue mientras te alejas.' },
    ],
  },
  fuenteEnsueno: {
    id: 'fuenteEnsueno', name: 'La Fuente del Ensueño',
    text: 'Agua cristalina que sabe a recuerdos felices.',
    options: [
      {
        label: 'Beber a fondo', desc: 'Curación total, pero en tu próximo combate los enemigos tendrán Escudos de Bruma.',
        effects: [{ type: 'heal', pct: 100 }, { type: 'nextCombatModifier', modifier: 'escudosBruma' }],
        result: 'Te sientes renovado. A lo lejos, la niebla se espesa.',
      },
      { label: 'Un sorbo', desc: 'Recuperas el 30% de tu vida.', effects: [{ type: 'heal', pct: 30 }], result: 'Refrescante.' },
    ],
  },
  buhonero: {
    id: 'buhonero', name: 'El Buhonero Tramposo',
    text: '"¡Cajas misteriosas! ¡Suerte embotellada!", grita un comerciante de sonrisa demasiado amplia.',
    options: [
      {
        label: 'Comprar una caja (45 kamas)', desc: 'Un objeto al azar, de rareza poco común o superior.', cost: { kamas: 45 },
        effects: [{ type: 'itemChoice', count: 1, minRarity: 'uncommon' }],
      },
      {
        label: 'Venderle tu suerte', desc: '+70 kamas y la maldición Cascabel de Pesadilla.', requires: { notHaveRelic: 'cascabelPesadilla' },
        effects: [{ type: 'kamas', amount: 70 }, { type: 'curse', relic: 'cascabelPesadilla' }], result: 'Te sientes algo más pesado… y más rico.',
      },
      { label: 'Ignorarlo', desc: '', effects: [], result: '"¡Tú te lo pierdes!"' },
    ],
  },
  campamento: {
    id: 'campamento', name: 'Campamento Abandonado',
    text: 'Una hoguera aún tibia y unas mochilas abiertas. Quizá sus dueños sigan cerca.',
    options: [
      {
        label: 'Registrar las mochilas', desc: '65%: 25-45 kamas. 35%: una emboscada.',
        effects: [{ type: 'random', outcomes: [
          { weight: 65, effects: [{ type: 'kamas', amount: [25, 45] }], text: 'Encuentras una bolsa de kamas.' },
          { weight: 35, effects: [{ type: 'combat', kind: 'normal' }], text: '¡Los dueños vuelven y no están contentos!' },
        ] }],
      },
      { label: 'Descansar junto al fuego', desc: 'Recuperas el 15% de tu vida.', effects: [{ type: 'heal', pct: 15 }], result: 'Un descanso breve pero reparador.' },
    ],
  },
  setasLuminosas: {
    id: 'setasLuminosas', name: 'Setas Luminosas',
    text: 'Un corro de setas brilla en la oscuridad. Dicen que comerlas abre la mente… o la cierra.',
    options: [
      {
        label: 'Comer una', desc: '50%: +1 nivel de golpe (XP). 50%: pierdes el 15% de tu vida.',
        effects: [{ type: 'random', outcomes: [
          { weight: 1, effects: [{ type: 'xp', amount: 60 }], text: '¡Visiones! Entiendes cosas que antes no entendías.' },
          { weight: 1, effects: [{ type: 'damage', pct: 15 }], text: 'Te retuerces de dolor durante un buen rato.' },
        ] }],
      },
      { label: 'Recolectarlas', desc: '+3 fragmentos.', effects: [{ type: 'fragments', amount: 3 }], result: 'Servirán en la forja.' },
    ],
  },
};
