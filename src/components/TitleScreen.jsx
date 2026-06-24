import { useGameStore } from '../engine/store.js';

export function TitleScreen() {
  const startGame = useGameStore(s => s.startGame);

  return (
    <div className="title-screen">
      <div className="title-bg">
        <div className="title-particles">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 3}px`,
              height: `${1 + Math.random() * 3}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
            }} />
          ))}
        </div>
        <div className="title-donut-ring">
          <div className="donut" />
        </div>
      </div>
      <div className="title-content">
        <div className="title-subtitle">Captain Glaze & the Interdimensional Doughnut Crisis</div>
        <h1 className="title-main">
          <span className="title-line">Legends of the</span>
          <span className="title-line accent">Glazed Voids</span>
        </h1>
        <p className="title-description">
          A social-puzzle adventure where you don't control a character — you persuade one.
          Read the captain, find the lever, and talk him through a collapsing doughnut starship
          in about five minutes flat.
        </p>
        <button className="start-btn" onClick={startGame}>
          <span className="btn-text">Begin Transmission</span>
          <span className="btn-arrow">→</span>
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
