import { useGameStore } from './engine/store.js';
import { TitleScreen } from './components/TitleScreen.jsx';
import { ChatPanel } from './components/ChatPanel.jsx';
import { StatusPanel } from './components/StatusPanel.jsx';
import './App.css';

function App() {
  const phase = useGameStore(s => s.phase);
  const gameEnding = useGameStore(s => s.gameEnding);

  if (phase === 'title') {
    return <TitleScreen />;
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <span className="game-title">LEGENDS OF THE GLAZED VOIDS</span>
        <span className="game-subtitle">U.S.V. Old-Fashioned</span>
      </div>
      <div className="game-layout">
        <ChatPanel />
        <StatusPanel />
      </div>
      {gameEnding && (
        <div className="ending-overlay">
          {gameEnding === 'victory' && (
            <div className="ending-card victory">
              <h2>🏆 Glazed Victory</h2>
              <p>The portal opens. You and Glaze escape as the U.S.V. Old-Fashioned collapses into the void. He grudgingly admits you "weren't completely useless."</p>
              <button className="restart-btn" onClick={() => useGameStore.getState().startGame()}>Play Again</button>
            </div>
          )}
          {gameEnding === 'hull_lost' && (
            <div className="ending-card loss">
              <h2>💀 Hull Lost</h2>
              <p>The ship's integrity gives out. Interdimensional energy tears through every deck. Glaze's last message fades to static. The Bakery goes silent.</p>
              <button className="restart-btn" onClick={() => useGameStore.getState().startGame()}>Try Again</button>
            </div>
          )}
          {gameEnding === 'mutiny' && (
            <div className="ending-card loss">
              <h2>🏴‍☠️ Mutiny</h2>
              <p>Captain Glaze has had enough. He severs the link, locks the comms, and goes rogue. "I'm the captain now. Find your own ship."</p>
              <button className="restart-btn" onClick={() => useGameStore.getState().startGame()}>Try Again</button>
            </div>
          )}
          {gameEnding === 'supreme_glaze' && (
            <div className="ending-card secret">
              <h2>👑 Supreme Glaze</h2>
              <p>With absolute trust, Captain Glaze merges with Vermious the Glazeworm. He becomes the Worm Lord — a new entity straddling dimensions. Reality trembles.</p>
              <button className="restart-btn" onClick={() => useGameStore.getState().startGame()}>Play Again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
