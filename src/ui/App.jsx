import { Component } from 'react';
import { useGameState, useStore } from './hooks/useGame.jsx';
import { Toast } from './components/Common.jsx';
import TitleScreen from './screens/TitleScreen.jsx';
import ClassSelectScreen from './screens/ClassSelectScreen.jsx';
import SanctuaryScreen from './screens/SanctuaryScreen.jsx';
import CodexScreen from './screens/CodexScreen.jsx';
import RunScreen from './screens/RunScreen.jsx';

/**
 * Límite de errores: si una pantalla falla al dibujarse, se muestra un aviso en
 * lugar de una página en blanco. La partida guardada no se toca.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error de interfaz:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="title-screen">
        <div className="panel" style={{ padding: 20, maxWidth: 520 }}>
          <h2>Algo se ha roto en el sueño</h2>
          <p className="small">Se produjo un error al dibujar esta pantalla. Tu partida está guardada.</p>
          <pre className="tiny muted" style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error?.message ?? this.state.error)}</pre>
          <button type="button" className="btn btn-gold" onClick={() => { this.props.onReset?.(); this.setState({ error: null }); }}>
            Volver al título
          </button>
        </div>
      </div>
    );
  }
}

export default function App() {
  const store = useStore();
  return (
    <ErrorBoundary onReset={() => store.dispatch({ type: 'NAVIGATE', screen: 'title' })}>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const state = useGameState();
  let screen;
  if (state.run && (state.ui.screen === 'run' || state.run.ended)) screen = <RunScreen />;
  else {
    switch (state.ui.screen) {
      case 'classSelect':
        screen = <ClassSelectScreen />;
        break;
      case 'sanctuary':
        screen = <SanctuaryScreen />;
        break;
      case 'codex':
        screen = <CodexScreen />;
        break;
      default:
        screen = <TitleScreen />;
    }
  }
  return (
    <div className="app">
      {screen}
      <Toast error={state.error} />
    </div>
  );
}
