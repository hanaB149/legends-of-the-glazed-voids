import { useGameStore } from '../engine/store.js';

export function TitleScreen() {
  const startGame = useGameStore(s => s.startGame);

  return (
    <div className="title-screen">
      <div className="title-content">
        <div className="title-subtitle">Captain Glaze & the Interdimensional Doughnut Crisis</div>
        <h1 className="title-main">Legends of the<br />Glazed Voids</h1>
        <p className="title-description">
          A social-puzzle adventure where you don't control a character — you persuade one.
          Read the captain, find the lever, and talk him through a collapsing doughnut starship.
        </p>
        <button className="start-btn" onClick={startGame}>
          Begin Transmission
        </button>
        <div className="title-credits">
          <span>You are Cruller, disembodied operator of the U.S.V. Old-Fashioned</span>
          <span>Captain Glaze is vain, anxious, and doughnut-obsessed</span>
          <span>He listens to you. He doesn't have to obey.</span>
        </div>
      </div>
    </div>
  );
}
