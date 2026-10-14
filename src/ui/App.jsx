import { useGameState } from './hooks/useGame.jsx';
import { Toast } from './components/Common.jsx';
import TitleScreen from './screens/TitleScreen.jsx';
import ClassSelectScreen from './screens/ClassSelectScreen.jsx';
import SanctuaryScreen from './screens/SanctuaryScreen.jsx';
import CodexScreen from './screens/CodexScreen.jsx';
import RunScreen from './screens/RunScreen.jsx';

export default function App() {
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
