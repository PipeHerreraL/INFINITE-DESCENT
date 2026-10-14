import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createStore } from './core/game/store.js';
import { GameProvider } from './ui/hooks/useGame.jsx';
import App from './ui/App.jsx';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/styles/screens.css';
import './ui/styles/board.css';
import './ui/styles/components.css';
import './ui/styles/mobile.css';

const store = createStore();
// Acceso de depuración desde la consola del navegador.
window.__ID_STORE__ = store;
window.addEventListener('beforeunload', () => store.flush());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameProvider store={store}>
      <App />
    </GameProvider>
  </StrictMode>,
);
