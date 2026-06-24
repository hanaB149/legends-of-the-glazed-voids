import { useGameStore } from '../engine/store.js';

export function EndingOverlay() {
  const gameEnding = useGameStore(s => s.gameEnding);
  const startGame = useGameStore(s => s.startGame);

  if (!gameEnding) return null;

  const endings = {
    victory: {
      title: 'Glazed Victory',
      subtitle: 'Reality Saved',
      desc: 'The portal opens. You and Glaze escape as the U.S.V. Old-Fashioned collapses into the void. He grudgingly admits you "weren\'t completely useless."',
      color: '#00C8FF',
      icon: '🏆',
    },
    hull_lost: {
      title: 'Hull Lost',
      subtitle: 'The Rifts Win',
      desc: 'The ship\'s integrity gives out. Interdimensional energy tears through every deck. Glaze\'s last message fades to static. The Bakery goes silent.',
      color: '#FF4444',
      icon: '💀',
    },
    mutiny: {
      title: 'Mutiny',
      subtitle: 'Glaze Breaks',
      desc: 'Captain Glaze has had enough of your voice. He severs the link, locks the comms, and goes rogue. "I\'m the captain now. Find your own ship."',
      color: '#FF8800',
      icon: '🏴',
    },
    supreme_glaze: {
      title: 'Supreme Glaze',
      subtitle: 'The True Ending',
      desc: 'With absolute trust and a final offering, Captain Glaze merges with Vermious the Glazeworm. He becomes the Worm Lord — a new entity straddling dimensions. Reality trembles. The Bakery watches in awe.',
      color: '#FF00FF',
      icon: '👑',
    },
  };

  const end = endings[gameEnding] || endings.victory;

  return (
    <div className="ending-overlay" style={{ '--end-color': end.color }}>
      <div className="ending-content">
        <div className="ending-icon">{end.icon}</div>
        <h2 className="ending-title" style={{ color: end.color }}>{end.title}</h2>
        <div className="ending-subtitle">{end.subtitle}</div>
        <p className="ending-desc">{end.desc}</p>
        <button className="restart-btn" onClick={startGame}>Play Again</button>
      </div>
    </div>
  );
}
