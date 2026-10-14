// Iconos SVG originales (viewBox 24×24). Formas simples, legibles a tamaño pequeño.
const P = {
  flame: 'M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 3 2 4 1-2 1-5 1-8z',
  drop: 'M12 2s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13z',
  heart: 'M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z',
  shield: 'M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z',
  star: 'M12 2l3 6.5 7 .8-5.2 4.7 1.5 7L12 17.4 5.7 21l1.5-7L2 9.3l7-.8z',
  boot: 'M7 2h6v9l6 3c1.5.8 2 2 2 3.5V20H3v-4l4-2z',
  up: 'M12 3l8 9h-5v9H9v-9H4z',
  down: 'M12 21l-8-9h5V3h6v9h5z',
  crack: 'M4 3h16v18H4zM12 3l-2 6 4 3-3 4 2 5',
  stars: 'M6 3l1.5 3 3 .5-2.2 2 .6 3L6 10l-2.9 1.5.6-3L1.5 6.5l3-.5zM17 9l1.5 3 3 .5-2.2 2 .6 3-2.9-1.5-2.9 1.5.6-3-2.2-2 3-.5z',
  root: 'M12 2v10M12 12c-3 2-6 2-8 6M12 12c3 2 6 2 8 6M12 12v10',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  anchor: 'M12 2a3 3 0 0 1 1 5.8V20a7 7 0 0 0 6-6h-2l3-3 3 3h-2a9 9 0 0 1-18 0H1l3-3 3 3H5a7 7 0 0 0 6 6V7.8A3 3 0 0 1 12 2z',
  web: 'M12 2v20M2 12h20M5 5l14 14M19 5L5 19M12 6l4 2 2 4-2 4-4 2-4-2-2-4 2-4z',
  egg: 'M12 2c4 0 7 7 7 12a7 7 0 0 1-14 0c0-5 3-12 7-12z',
  fist: 'M6 9h12a2 2 0 0 1 2 2v4a6 6 0 0 1-6 6h-3a5 5 0 0 1-5-5zM6 9V6a2 2 0 0 1 4 0v3M10 9V5a2 2 0 0 1 4 0v4M14 9V6a2 2 0 0 1 4 0v3',
  jump: 'M4 20h4M16 20h4M6 20c2-14 10-14 12 0M14 4l4 3-4 3',
  sword: 'M20 2l2 2-12 12-3-1-1-3zM7 15l-4 4 2 2 4-4M5 13l6 6',
  push: 'M3 12h12M11 6l6 6-6 6M19 4v16',
  shout: 'M3 9h4l6-5v16l-6-5H3zM16 8c1.5 1 1.5 7 0 8M19 5c3 3 3 11 0 14',
  spin: 'M12 3a9 9 0 1 1-9 9M3 3v6h6',
  chain: 'M9 15l6-6M7 11l-2 2a4 4 0 0 0 6 6l2-2M17 13l2-2a4 4 0 0 0-6-6l-2 2',
  quake: 'M2 18l4-6 3 4 4-8 3 5 2-3 4 8z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  snow: 'M12 2v20M3.5 7l17 10M3.5 17l17-10M9 4l3 2 3-2M9 20l3-2 3 2',
  bunny: 'M8 10V3a2 2 0 0 1 4 0v6a2 2 0 0 1 4 0v4a7 7 0 1 1-8-3z',
  burst: 'M12 2l2 6 6-3-3 6 6 2-6 2 3 6-6-3-2 6-2-6-6 3 3-6-6-2 6-2-3-6 6 3z',
  bomb: 'M10 8a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM14 9l3-3M17 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z',
  spark: 'M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4',
  swap: 'M4 8h14l-4-4M20 16H6l4 4',
  rocket: 'M14 3c4 0 7 3 7 7l-7 7-7-7c0-4 3-7 7-7zM7 10l-4 4 3 1 1 3 4-4M15 9a1.5 1.5 0 1 0 0 .1',
  fang: 'M4 4h16l-3 5-2-2-3 13-3-13-2 2z',
  spore: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM5 14a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM19 14a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
  weapon: 'M14 2l8 8-3 1-6-6zM12 6l6 6-9 9H3v-6z',
  cup: 'M5 3h14l-2 8a5 5 0 0 1-10 0zM12 16v4M8 21h8',
  battery: 'M3 7h16v10H3zM19 10h2v4h-2M9 8l-2 5h4l-2 5',
  clock: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM12 6v6l4 3',
  mirror: 'M12 2c4 0 7 3.5 7 8s-3 8-7 8-7-3.5-7-8 3-8 7-8zM12 18v4M8 22h8',
  feather: 'M20 4C12 4 6 10 6 18l-2 3M6 18c6 0 12-6 14-14M9 13h5M11 10h5',
  compass: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM15.5 8.5l-2 5-5 2 2-5z',
  dice: 'M4 4h16v16H4zM8 8h.1M16 8h.1M12 12h.1M8 16h.1M16 16h.1',
  coin: 'M12 3c5 0 9 2 9 4.5v9C21 19 17 21 12 21s-9-2-9-4.5v-9C3 5 7 3 12 3zM3 7.5C3 10 7 12 12 12s9-2 9-4.5',
  seed: 'M12 3c5 3 7 8 4 13-2 3-6 3-8 0-3-5-1-10 4-13zM12 9v12',
  bell: 'M12 2a2 2 0 0 1 2 2c3 1 5 4 5 8v4l2 2H3l2-2v-4c0-4 2-7 5-8a2 2 0 0 1 2-2zM10 20a2 2 0 0 0 4 0',
  gem: 'M7 3h10l5 6-10 12L2 9zM2 9h20M9.5 3L12 9l2.5-6M12 9v12',
  moon: 'M20 15A9 9 0 1 1 9 4a7 7 0 0 0 11 11z',
  xp: 'M12 2l2.5 7H22l-6 4.5 2.3 7.5-6.3-4.6L5.7 21 8 13.5 2 9h7.5z',
  // Espacios de equipo
  hat: 'M3 18h18M6 18c0-6 2-12 6-12s6 6 6 12M8 10h8',
  cloak: 'M8 3h8l1 4 4 14H3L7 7zM12 3v18',
  amulet: 'M6 2c0 6 3 9 6 10 3-1 6-4 6-10M12 12a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
  ring: 'M12 7a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM9 3h6l-3 4z',
  belt: 'M2 9h20v6H2zM9 8h6v8H9zM11 11h2v2h-2',
  boots: 'M6 2h6v10l7 3c1.5.6 2 2 2 3.5V21H3v-5l3-2z',
  trophy: 'M7 3h10v5a5 5 0 0 1-10 0zM7 5H3c0 4 2 5 4 5M17 5h4c0 4-2 5-4 5M12 13v4M8 21h8l-1-4H9z',
  // Nodos del mapa
  combat: 'M4 4l9 9M20 4l-9 9M4 20l4-4M20 20l-4-4M7 15l2 2M17 15l-2 2',
  elite: 'M12 2c5 0 8 3.5 8 8 0 3-1.5 5-4 6v4H8v-4c-2.5-1-4-3-4-6 0-4.5 3-8 8-8zM9 11h.1M15 11h.1M10 20v-3M14 20v-3',
  challenge: 'M12 2l3 6 6 1-4.5 4 1 6.5L12 16l-5.5 3.5 1-6.5L3 9l6-1zM12 7v5',
  boss: 'M3 18l2-11 5 5 2-8 2 8 5-5 2 11zM3 21h18',
  shop: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2',
  forge: 'M3 9h14c0 3 2 4 4 4v2H8l-1 3h8v3H5v-3l2-3C5 15 3 13 3 9zM17 5l3-3',
  chest: 'M3 9a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v11H3zM3 12h18M11 11h2v3h-2z',
  event: 'M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.4-1.5 2.4V15M12 19h.1M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z',
  rest: 'M4 21h16M6 21l6-7 6 7M12 14c-2-2-1-5 1-7 0 2 3 3 2 6',
  map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
  bag: 'M6 7h12l2 14H4zM9 7a3 3 0 0 1 6 0',
  close: 'M5 5l14 14M19 5L5 19',
  gear: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  info: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM12 10v7M12 7h.1',
  hourglass: 'M6 2h12M6 22h12M7 2c0 6 10 6 10 10S7 16 7 22M17 2c0 6-10 6-10 10s10 4 10 10',
  book: 'M4 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H4zM20 4h-6M20 4v15h-6',
  skull: 'M12 3c5 0 8 3 8 7.5 0 2.5-1.2 4.4-3 5.5v3H7v-3c-1.8-1.1-3-3-3-5.5C4 6 7 3 12 3zM9 11h.1M15 11h.1',
};

const FILLED = new Set([
  'flame', 'drop', 'heart', 'shield', 'star', 'boot', 'up', 'down', 'egg', 'bunny', 'burst', 'bolt', 'fang', 'spore',
  'xp', 'moon', 'coin', 'quake', 'bell', 'seed', 'stars', 'boots', 'boss', 'challenge', 'skull', 'elite', 'cup',
]);

export default function Icon({ name, size = 18, color = 'currentColor', className = '', title, filled }) {
  const d = P[name] ?? P.star;
  const isFilled = filled ?? FILLED.has(name);
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFilled ? color : 'none'}
      stroke={color}
      strokeWidth={isFilled ? 1.2 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path d={d} />
    </svg>
  );
}

export const ICON_NAMES = Object.keys(P);
