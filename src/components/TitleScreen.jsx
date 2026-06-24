import { useRef, useEffect } from 'react';
import { useGameStore } from '../engine/store.js';
import { Audio } from '../audio/audio.js';

function drawTitleCanvas(ctx, w, h, frame) {
  ctx.fillStyle = '#0A0014';
  ctx.fillRect(0, 0, w, h);

  // Floor tiles
  for (let y = 0; y < h; y += 32) {
    for (let x = 0; x < w; x += 32) {
      const isEven = (x + y) % 64 === 0;
      ctx.fillStyle = isEven ? '#1a0a3e' : '#0D0020';
      ctx.fillRect(x, y, 32, 32);
    }
  }

  // Floating doughnuts
  for (let i = 0; i < 5; i++) {
    const dx = w * 0.1 + i * (w * 0.2) + Math.sin(frame * 0.02 + i) * 20;
    const dy = h * 0.3 + Math.sin(frame * 0.03 + i * 1.5) * 30 + i * 20;
    ctx.fillStyle = '#4B1A8C';
    ctx.fillRect(dx - 12, dy - 12, 24, 24);
    ctx.strokeStyle = '#00C8FF';
    ctx.lineWidth = 1;
    ctx.strokeRect(dx - 12, dy - 12, 24, 24);
    ctx.fillStyle = '#00C8FF';
    ctx.globalAlpha = 0.1 + Math.sin(frame * 0.05 + i) * 0.05;
    ctx.fillRect(dx - 6, dy - 6, 12, 12);
    ctx.globalAlpha = 1;
  }

  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }

  // Vignette
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function TitleScreen() {
  const startGame = useGameStore(s => s.startGame);
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    function loop() {
      frameRef.current++;
      if (ctx) drawTitleCanvas(ctx, canvas.width, canvas.height, frameRef.current);
      animRef.current = requestAnimationFrame(loop);
    }
    loop();
    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleStart = () => {
    Audio.init();
    Audio.startBGM();
    startGame();
  };

  return (
    <div className="title-screen pixel-title">
      <canvas ref={canvasRef} className="title-canvas" />
      <div className="title-content pixel-title-content">
        <div className="title-subtitle pixel-sub">CAPTAIN GLAZE & THE INTERDIMENSIONAL DOUGHNUT CRISIS</div>
        <h1 className="title-main pixel-main">
          LEGENDS<br />OF THE<br /><span className="accent">GLAZED VOIDS</span>
        </h1>
        <p className="title-description pixel-desc">
          A SOCIAL-PUZZLE ADVENTURE WHERE YOU DON'T CONTROL A CHARACTER &mdash; YOU PERSUADE ONE.
        </p>
        <button className="pixel-btn title-btn" onClick={handleStart}>
          BEGIN TRANSMISSION
        </button>
        <div className="title-credits pixel-credits">
          <span>YOU ARE CRULLER, DISEMBODIED OPERATOR OF THE U.S.V. OLD-FASHIONED</span>
          <span>CAPTAIN GLAZE IS VAIN, ANXIOUS, AND DOUGHNUT-OBSESSED</span>
          <span>HE LISTENS TO YOU. HE DOESN'T HAVE TO OBEY.</span>
        </div>
      </div>
    </div>
  );
}
