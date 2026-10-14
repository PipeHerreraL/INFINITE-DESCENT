// Sprites de las unidades. Origen (0, 0) = centro de la casilla en el suelo.
// Si la unidad tiene ilustración (spriteArt.js) se dibuja esa imagen; si no, el
// sprite geométrico de este archivo. Todos miran hacia la cámara.
import { artFor } from './spriteArt.js';

function Eyes({ y = -20, spread = 5, r = 2.6, color = '#1b1b1b', angry = false }) {
  return (
    <g>
      <circle cx={-spread} cy={y} r={r + 1.4} fill="#fff" />
      <circle cx={spread} cy={y} r={r + 1.4} fill="#fff" />
      <circle cx={-spread + 0.6} cy={y + 0.4} r={r} fill={color} />
      <circle cx={spread + 0.6} cy={y + 0.4} r={r} fill={color} />
      {angry ? (
        <g stroke="#1b1b1b" strokeWidth="1.6" strokeLinecap="round">
          <line x1={-spread - 4} y1={y - 5} x2={-spread + 3} y2={y - 3} />
          <line x1={spread + 4} y1={y - 5} x2={spread - 3} y2={y - 3} />
        </g>
      ) : null}
    </g>
  );
}

const OUTLINE = '#2a1a0c';

function Warrior({ color }) {
  return (
    <g>
      <ellipse cx="0" cy="-14" rx="11" ry="13" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <rect x="-9" y="-12" width="18" height="5" rx="2" fill="#7a4a1f" stroke={OUTLINE} strokeWidth="1.5" />
      <circle cx="0" cy="-30" r="10" fill="#f6d2a8" stroke={OUTLINE} strokeWidth="2" />
      <path d="M-11 -32 Q0 -46 11 -32 L9 -29 L-9 -29 Z" fill="#c9c9d6" stroke={OUTLINE} strokeWidth="1.8" />
      <path d="M-10 -36 L-16 -44 L-8 -38 Z M10 -36 L16 -44 L8 -38 Z" fill="#fff4dc" stroke={OUTLINE} strokeWidth="1.5" />
      <Eyes y={-29} spread={4} r={1.8} angry />
      <g transform="rotate(-25 14 -16)">
        <rect x="12" y="-40" width="4" height="26" rx="1" fill="#dfe6ee" stroke={OUTLINE} strokeWidth="1.5" />
        <rect x="8" y="-16" width="12" height="3" rx="1" fill="#b8860b" stroke={OUTLINE} strokeWidth="1.2" />
      </g>
    </g>
  );
}

function Healer({ color }) {
  return (
    <g>
      <path d="M-12 0 Q-12 -22 0 -24 Q12 -22 12 0 Z" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <circle cx="0" cy="-30" r="9.5" fill="#f6d2a8" stroke={OUTLINE} strokeWidth="2" />
      <path d="M-11 -28 Q-12 -44 0 -44 Q12 -44 11 -28 Q6 -36 0 -36 Q-6 -36 -11 -28 Z" fill="#fff" stroke={OUTLINE} strokeWidth="1.8" />
      <Eyes y={-28} spread={3.6} r={1.7} />
      <line x1="-15" y1="2" x2="-15" y2="-38" stroke="#8b5a2b" strokeWidth="3" strokeLinecap="round" />
      <path d="M-15 -46 c-3-3-7 0-4 4l4 4 4-4c3-4-1-7-4-4z" fill="#ff6fae" stroke={OUTLINE} strokeWidth="1.2" />
    </g>
  );
}

function Bomber({ color }) {
  return (
    <g>
      <ellipse cx="0" cy="-13" rx="11" ry="12" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <circle cx="0" cy="-30" r="10" fill="#f6d2a8" stroke={OUTLINE} strokeWidth="2" />
      <path d="M-10 -34 Q0 -46 10 -34 Z" fill="#5c3b1e" stroke={OUTLINE} strokeWidth="1.6" />
      <rect x="-9" y="-33" width="18" height="6" rx="3" fill="#3b3b3b" stroke={OUTLINE} strokeWidth="1.2" />
      <circle cx="-4" cy="-30" r="3" fill="#7fd3ff" stroke={OUTLINE} strokeWidth="1" />
      <circle cx="4" cy="-30" r="3" fill="#7fd3ff" stroke={OUTLINE} strokeWidth="1" />
      <circle cx="14" cy="-10" r="6" fill="#2b2b2b" stroke={OUTLINE} strokeWidth="1.5" />
      <path d="M17 -15 q3 -4 6 -2" stroke="#c8a24a" strokeWidth="1.5" fill="none" />
      <circle cx="23" cy="-17" r="2" fill="#ffd166" />
    </g>
  );
}

function Bird({ color, accent, crest }) {
  return (
    <g>
      <line x1="-4" y1="0" x2="-3" y2="-7" stroke="#e08a1e" strokeWidth="2" />
      <line x1="4" y1="0" x2="3" y2="-7" stroke="#e08a1e" strokeWidth="2" />
      <circle cx="0" cy="-17" r="13" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <path d="M-13 -18 q-7 2 -4 9 q4 -2 5 -5z M13 -18 q7 2 4 9 q-4 -2 -5 -5z" fill={accent} stroke={OUTLINE} strokeWidth="1.4" />
      {crest ? <path d="M-4 -30 l2 -8 2 6 2 -7 2 9z" fill={accent} stroke={OUTLINE} strokeWidth="1.2" /> : null}
      <Eyes y={-20} spread={4.5} r={2} angry={crest} />
      <path d="M-3 -14 L0 -9 L3 -14 Z" fill="#f08c2e" stroke={OUTLINE} strokeWidth="1.2" />
    </g>
  );
}

function Larva({ color, accent }) {
  return (
    <g>
      <ellipse cx="-9" cy="-6" rx="7" ry="6" fill={accent} stroke={OUTLINE} strokeWidth="1.6" />
      <ellipse cx="-2" cy="-9" rx="8" ry="8" fill={color} stroke={OUTLINE} strokeWidth="1.6" />
      <ellipse cx="7" cy="-14" rx="10" ry="10" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <Eyes y={-16} spread={4} r={1.8} />
      <path d="M3 -24 l-2 -6 M11 -24 l2 -6" stroke={OUTLINE} strokeWidth="1.5" />
    </g>
  );
}

function Mushroom({ color, accent }) {
  return (
    <g>
      <path d="M-7 0 Q-8 -14 -6 -18 L6 -18 Q8 -14 7 0 Z" fill={accent} stroke={OUTLINE} strokeWidth="2" />
      <Eyes y={-9} spread={3.4} r={1.6} />
      <path d="M-17 -18 Q-16 -38 0 -38 Q16 -38 17 -18 Z" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <circle cx="-8" cy="-27" r="3" fill="#fff" opacity="0.9" />
      <circle cx="5" cy="-31" r="2.5" fill="#fff" opacity="0.9" />
      <circle cx="9" cy="-23" r="2" fill="#fff" opacity="0.9" />
    </g>
  );
}

function Boar({ color, accent, armor }) {
  return (
    <g>
      <rect x="-11" y="-6" width="4" height="6" fill={OUTLINE} />
      <rect x="7" y="-6" width="4" height="6" fill={OUTLINE} />
      <ellipse cx="0" cy="-14" rx="16" ry="12" fill={color} stroke={OUTLINE} strokeWidth="2" />
      {armor ? <path d="M-14 -18 Q0 -32 14 -18 L12 -14 Q0 -24 -12 -14 Z" fill={accent} stroke={OUTLINE} strokeWidth="1.5" /> : null}
      <path d="M-12 -24 l-3 -7 6 4z M12 -24 l3 -7 -6 4z" fill={color} stroke={OUTLINE} strokeWidth="1.5" />
      <ellipse cx="0" cy="-10" rx="6" ry="4.5" fill="#e8a598" stroke={OUTLINE} strokeWidth="1.5" />
      <circle cx="-2" cy="-10" r="1" fill={OUTLINE} />
      <circle cx="2" cy="-10" r="1" fill={OUTLINE} />
      <path d="M-6 -8 q-4 -1 -5 -6 M6 -8 q4 -1 5 -6" stroke={armor ? '#fff' : accent} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Eyes y={-19} spread={5} r={1.8} angry />
    </g>
  );
}

function Blob({ color, accent }) {
  return (
    <g>
      <path d="M-15 0 Q-17 -20 0 -24 Q17 -20 15 0 Q8 3 0 0 Q-8 3 -15 0 Z" fill={color} stroke={OUTLINE} strokeWidth="2" opacity="0.95" />
      <ellipse cx="-6" cy="-16" rx="3" ry="4" fill="#fff" opacity="0.6" />
      <Eyes y={-11} spread={4.5} r={1.8} color={accent} />
    </g>
  );
}

function Bat({ color, accent }) {
  return (
    <g transform="translate(0 -8)">
      <path d="M-6 -14 Q-20 -24 -26 -12 Q-20 -14 -18 -8 Q-14 -12 -10 -6 Z M6 -14 Q20 -24 26 -12 Q20 -14 18 -8 Q14 -12 10 -6 Z" fill={color} stroke={OUTLINE} strokeWidth="1.6" />
      <circle cx="0" cy="-12" r="9" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <path d="M-6 -19 l-2 -6 4 3z M6 -19 l2 -6 -4 3z" fill={color} stroke={OUTLINE} strokeWidth="1.2" />
      <Eyes y={-13} spread={3.4} r={1.6} color={accent} />
    </g>
  );
}

function Golem({ color, accent }) {
  return (
    <g>
      <rect x="-15" y="-30" width="30" height="28" rx="5" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <rect x="-19" y="-24" width="7" height="16" rx="3" fill={color} stroke={OUTLINE} strokeWidth="1.8" />
      <rect x="12" y="-24" width="7" height="16" rx="3" fill={color} stroke={OUTLINE} strokeWidth="1.8" />
      <path d="M-12 -30 q4 -6 8 0 q4 -6 8 0 q4 -6 8 0" fill={accent} stroke={OUTLINE} strokeWidth="1.2" />
      <rect x="-8" y="-22" width="16" height="5" rx="2" fill="#1b1b1b" />
      <circle cx="-4" cy="-19.5" r="1.6" fill={accent} />
      <circle cx="4" cy="-19.5" r="1.6" fill={accent} />
    </g>
  );
}

function Kobold({ color, accent }) {
  return (
    <g>
      <path d="M-9 0 Q-11 -16 0 -18 Q11 -16 9 0 Z" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="2" cy="-26" rx="10" ry="8" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <path d="M8 -26 l8 2 -8 3z" fill={color} stroke={OUTLINE} strokeWidth="1.4" />
      <path d="M-8 -31 L0 -44 L8 -31 Z" fill={accent} stroke={OUTLINE} strokeWidth="1.6" />
      <Eyes y={-27} spread={3.5} r={1.6} angry />
    </g>
  );
}

function Spider({ color, accent }) {
  const legs = [-1, 1].flatMap((s) => [0, 1, 2].map((i) => (
    <path key={`${s}${i}`} d={`M${s * 6} ${-12 + i * 3} q${s * 10} ${-10 + i * 4} ${s * 16} ${4 + i * 3}`} stroke={OUTLINE} strokeWidth="2.2" fill="none" />
  )));
  return (
    <g>
      {legs}
      <ellipse cx="0" cy="-14" rx="11" ry="10" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <path d="M-5 -16 l5 -5 5 5 -5 5z" fill={accent} opacity="0.9" />
      <circle cx="0" cy="-24" r="6.5" fill={color} stroke={OUTLINE} strokeWidth="1.8" />
      <circle cx="-2.5" cy="-25" r="1.6" fill={accent} />
      <circle cx="2.5" cy="-25" r="1.6" fill={accent} />
      <circle cx="-1" cy="-28" r="1" fill={accent} />
      <circle cx="1" cy="-28" r="1" fill={accent} />
    </g>
  );
}

function Shade({ color, accent }) {
  return (
    <g>
      <path d="M-12 0 Q-14 -34 0 -36 Q14 -34 12 0 Q8 -5 4 0 Q0 -5 -4 0 Q-8 -5 -12 0 Z" fill={color} stroke={OUTLINE} strokeWidth="2" opacity="0.92" />
      <ellipse cx="-4" cy="-24" rx="2.5" ry="3.5" fill={accent} />
      <ellipse cx="4" cy="-24" rx="2.5" ry="3.5" fill={accent} />
    </g>
  );
}

function Bunny({ color, accent }) {
  return (
    <g>
      <ellipse cx="0" cy="-9" rx="10" ry="9" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="-4" cy="-26" rx="3" ry="9" fill={color} stroke={OUTLINE} strokeWidth="1.6" />
      <ellipse cx="4" cy="-26" rx="3" ry="9" fill={color} stroke={OUTLINE} strokeWidth="1.6" />
      <ellipse cx="-4" cy="-26" rx="1.3" ry="6" fill={accent} />
      <ellipse cx="4" cy="-26" rx="1.3" ry="6" fill={accent} />
      <Eyes y={-11} spread={3.5} r={1.5} />
      <circle cx="0" cy="-7" r="1.4" fill={accent} />
    </g>
  );
}

function Egg({ color, accent }) {
  return (
    <g>
      <path d="M0 -30 C9 -30 13 -14 12 -7 A12 9 0 0 1 -12 -7 C-13 -14 -9 -30 0 -30 Z" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <circle cx="-4" cy="-18" r="2.5" fill={accent} />
      <circle cx="5" cy="-12" r="3" fill={accent} />
      <circle cx="2" cy="-24" r="1.8" fill={accent} />
    </g>
  );
}

function BombSprite({ color, charge = 0 }) {
  return (
    <g>
      <circle cx="0" cy="-11" r="11" fill="#2b2b2b" stroke={color} strokeWidth="3" />
      <ellipse cx="-4" cy="-15" rx="3" ry="2" fill="#fff" opacity="0.4" />
      <path d="M5 -20 q4 -6 9 -4" stroke="#c8a24a" strokeWidth="2" fill="none" />
      <circle cx="14" cy="-24" r="2.6" fill="#ffd166" className="fuse-spark" />
      <g>
        {[0, 1, 2, 3, 4].slice(0, Math.max(0, Math.min(5, charge))).map((i) => (
          <circle key={i} cx={-8 + i * 4} cy="2" r="1.8" fill="#ffd166" stroke={OUTLINE} strokeWidth="0.6" />
        ))}
      </g>
    </g>
  );
}

const SHAPES = {
  warrior: Warrior,
  healer: Healer,
  bomber: Bomber,
  bird: Bird,
  larva: Larva,
  mushroom: Mushroom,
  boar: Boar,
  blob: Blob,
  bat: Bat,
  golem: Golem,
  kobold: Kobold,
  spider: Spider,
  shade: Shade,
  bunny: Bunny,
  egg: Egg,
  bomb: BombSprite,
};

function spriteScale(sprite) {
  return sprite?.boss ? 1.55 : sprite?.big ? 1.25 : sprite?.small ? 0.72 : 1;
}

/** Altura de la parte superior del sprite (y negativa), para la barra de vida y los textos. */
export function spriteTop(sprite) {
  const scale = spriteScale(sprite);
  const art = sprite?.shape === 'bomb' ? null : artFor(sprite);
  if (art) return -((art.h + (art.lift ?? 0)) * scale + 2);
  return sprite?.boss ? -82 : sprite?.big ? -66 : sprite?.small ? -40 : -54;
}

/**
 * Ilustración anclada por los pies al centro de la casilla. `maxW` limita el
 * ancho (relativo a la altura): las más anchas se encogen para caber.
 */
function ArtSprite({ art, maxW }) {
  const h = art.h;
  const w = h * maxW;
  return (
    <image
      href={art.url}
      x={-w / 2}
      y={-h + 4 - (art.lift ?? 0)}
      width={w}
      height={h}
      preserveAspectRatio="xMidYMax meet"
      style={art.filter ? { filter: art.filter } : undefined}
    />
  );
}

export default function UnitSprite({ sprite, charge, maxW = 2 }) {
  const scale = spriteScale(sprite);
  const art = sprite?.shape === 'bomb' ? null : artFor(sprite);
  if (art) {
    return (
      <g transform={`scale(${scale})`}>
        <ArtSprite art={art} maxW={maxW} />
      </g>
    );
  }
  const Shape = SHAPES[sprite?.shape] ?? Blob;
  return (
    <g transform={`scale(${scale})`}>
      <Shape color={sprite?.color ?? '#999'} accent={sprite?.accent ?? '#555'} crest={sprite?.crest} armor={sprite?.armor} charge={charge} />
    </g>
  );
}

/** Retrato pequeño para listas (línea de turnos, cartas). */
export function Portrait({ sprite, size = 40, charge }) {
  const scale = spriteScale(sprite);
  const art = sprite?.shape === 'bomb' ? null : artFor(sprite);
  if (art) {
    // Encuadre cuadrado: la ilustración completa, de los pies a la cabeza.
    const h = (art.h + (art.lift ?? 0)) * scale;
    return (
      <svg width={size} height={size} viewBox={`${-h / 2 - 1} ${-h + 2} ${h + 2} ${h + 4}`} aria-hidden="true">
        <UnitSprite sprite={sprite} charge={charge} maxW={1} />
      </svg>
    );
  }
  const h = 52 * scale;
  return (
    <svg width={size} height={size} viewBox={`-28 ${-h - 2} 56 ${h + 8}`} aria-hidden="true">
      <UnitSprite sprite={sprite} charge={charge} />
    </svg>
  );
}
