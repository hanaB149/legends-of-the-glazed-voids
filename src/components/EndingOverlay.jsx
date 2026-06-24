import { useGameStore } from '../engine/store.js';
import { Audio } from '../audio/audio.js';

export function EndingOverlay() {
  const gameEnding = useGameStore(s => s.gameEnding);
  const startGame = useGameStore(s => s.startGame);

  if (!gameEnding) return null;

  const endings = {
    victory: {
      title: 'GLAZED VICTORY',
      subtitle: 'REALITY SAVED',
      desc: 'THE PORTAL OPENS. YOU AND GLAZE ESCAPE AS THE U.S.V. OLD-FASHIONED COLLAPSES INTO THE VOID. HE GRUDGINGLY ADMITS YOU "WEREN\'T COMPLETELY USELESS."',
      color: '#00C8FF',
      icon: 'W',
    },
    hull_lost: {
      title: 'HULL LOST',
      subtitle: 'THE RIFTS WIN',
      desc: 'THE SHIP\'S INTEGRITY GIVES OUT. INTERDIMENSIONAL ENERGY TEARS THROUGH EVERY DECK. THE BAKERY GOES SILENT.',
      color: '#FF4444',
      icon: 'X',
    },
    mutiny: {
      title: 'MUTINY',
      subtitle: 'GLAZE BREAKS',
      desc: 'CAPTAIN GLAZE SEVERS THE LINK. "I\'M THE CAPTAIN NOW. FIND YOUR OWN SHIP." THE COMMS DIE.',
      color: '#FF8800',
      icon: '!',
    },
    supreme_glaze: {
      title: 'SUPREME GLAZE',
      subtitle: 'THE TRUE ENDING',
      desc: 'WITH ABSOLUTE TRUST, GLAZE MERGES WITH VERMIOUS THE GLAZEWORM. HE BECOMES THE WORM LORD. REALITY TREMBLES.',
      color: '#FF00FF',
      icon: '*',
    },
  };

  const end = endings[gameEnding] || endings.victory;

  const handleRestart = () => {
    Audio.stopBGM();
    startGame();
  };

  return (
    <div className="ending-overlay pixel-ending" style={{ '--end-color': end.color }}>
      <div className="ending-content pixel-ending-content">
        <div className="ending-icon" style={{ color: end.color }}>{end.icon}</div>
        <h2 className="ending-title" style={{ color: end.color }}>{end.title}</h2>
        <div className="ending-subtitle">{end.subtitle}</div>
        <p className="ending-desc">{end.desc}</p>
        <button className="pixel-btn" onClick={handleRestart}>PLAY AGAIN</button>
      </div>
    </div>
  );
}
