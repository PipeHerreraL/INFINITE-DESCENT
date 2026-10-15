// Galería de sprites solo para desarrollo: `npm run dev` y abrir /sprites.html.
// Muestra cada unidad sobre una casilla del tablero, a tamaño de juego y ampliada.
import { createRoot } from 'react-dom/client';
import { MONSTERS } from '../../content/enemies/index.js';
import { CLASSES, CLASS_ORDER } from '../../content/classes/index.js';
import UnitSprite from '../board/UnitSprite.jsx';
import { unitSprite } from '../board/spriteArt.js';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/board.css';

const TW = 64;
const TH = 32;
const DIAMOND = `0,${-TH / 2} ${TW / 2},0 0,${TH / 2} ${-TW / 2},0`;

const entries = [
  ...CLASS_ORDER.map((id) => ({ id, name: CLASSES[id].name, sprite: { shape: CLASSES[id].sprite, color: CLASSES[id].color } })),
  ...Object.values(MONSTERS).map((m) => ({ id: m.id, name: m.name, sprite: m.sprite })),
  ...['earth', 'fire', 'water', 'air', 'neutral'].map((element, i) => ({
    id: `bomba-${element}`,
    name: `Bomba (${element}, carga ${i})`,
    sprite: unitSprite({ kind: 'bomb', element, sprite: { shape: 'bomb' } }),
    charge: i,
  })),
  { id: 'mercader', name: 'Mercader', sprite: { art: 'mercader' } },
];

function Tile({ entry, zoom }) {
  const h = 130;
  return (
    <figure style={{ margin: 0, textAlign: 'center' }}>
      <svg width={110 * zoom} height={h * zoom} viewBox={`-55 ${-h + 24} 110 ${h}`}>
        <polygon points={DIAMOND} fill="#a3d46e" stroke="#76a744" />
        <ellipse cx="0" cy="2" rx="20" ry="9" fill="none" stroke="#e5533d" strokeWidth="3" />
        <ellipse cx="0" cy="2" rx="16" ry="6" fill="rgba(0,0,0,0.25)" />
        <UnitSprite sprite={entry.sprite} charge={entry.charge} />
      </svg>
      <figcaption style={{ fontSize: 12, color: '#fbf4e4' }}>{entry.name}</figcaption>
    </figure>
  );
}

function Gallery() {
  const zoom = Number(new URLSearchParams(location.search).get('zoom') ?? 1.6);
  return (
    <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 8, overflow: 'auto', height: '100%' }}>
      {entries.map((e) => <Tile key={e.id} entry={e} zoom={zoom} />)}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Gallery />);
