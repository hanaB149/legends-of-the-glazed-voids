import { useGameStore } from './engine/store.js';
import { TitleScreen } from './components/TitleScreen.jsx';
import { GameView } from './components/GameView.jsx';
import { EndingOverlay } from './components/EndingOverlay.jsx';
import './App.css';

function App() {
  const phase = useGameStore(s => s.phase);
  const gameEnding = useGameStore(s => s.gameEnding);

  return (
    <div className="app-root">
      {phase === 'title' && <TitleScreen />}
      {phase === 'playing' && <GameView />}
      {gameEnding && <EndingOverlay />}
    </div>
  );
}

export default App;
