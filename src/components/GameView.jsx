import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../engine/store.js';
import { Audio } from '../audio/audio.js';
import { getRoom } from '../data/rooms.js';
import { renderGame } from './PixelScene.js';

const SUGGESTIONS = {
  bridge: [
    { text: 'Move to the hatch, Captain', icon: '\u{1F3AF}' },
    { text: 'You are the only one who can do this', icon: '\u{1F31F}' },
    { text: 'It is safe, I have got eyes on everything', icon: '\u{1F6E1}' },
  ],
  glazing_bay: [
    { text: 'Grab the Glaze Core', icon: '\u{1F3AF}' },
    { text: 'There is a doughnut in it for you', icon: '\u{1F369}' },
    { text: 'The cat is asleep. Quietly does it.', icon: '\u{1F92B}' },
    { text: 'You are the Captain. Act like it.', icon: '\u26A1' },
  ],
  maw: [
    { text: 'Seal the rift with a Glaze Core', icon: '\u{1F52E}' },
    { text: 'Feed Vermious the Void Cruller', icon: '\u{1FAB1}' },
    { text: 'We are out of time, just do it!', icon: '\u23F0' },
  ],
};

export function GameView() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);
  const scrollRef = useRef(null);
  const keysRef = useRef({});
  const inputRef = useRef(null);

  const store = useGameStore();
  const [input, setInput] = useState('');
  const [audioStarted, setAudioStarted] = useState(false);

  const room = store.roomId;

  // Movement loop
  useEffect(() => {
    if (store.gameEnding) return;

    const interval = setInterval(() => {
      const k = keysRef.current;
      let dx = 0, dy = 0;
      if (k['ArrowUp'] || k['KeyW']) dy = -1;
      if (k['ArrowDown'] || k['KeyS']) dy = 1;
      if (k['ArrowLeft'] || k['KeyA']) dx = -1;
      if (k['ArrowRight'] || k['KeyD']) dx = 1;

      if (dx || dy) {
        useGameStore.getState().movePlayer(dx, dy);
      } else if (store.playerWalking) {
        useGameStore.getState().stopPlayer();
      }
    }, 16);

    return () => clearInterval(interval);
  }, [store.gameEnding, store.playerWalking]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!audioStarted) {
          Audio.init(); Audio.startBGM(); setAudioStarted(true);
        }
        if (store.interactionMessage?.includes('[SPACE]')) {
          Audio.sfx('blip');
          useGameStore.getState().interact();
        }
      }

      if (e.code === 'Enter' && store.interactionMessage?.includes('TYPE')) {
        inputRef.current?.focus();
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [audioStarted, store.interactionMessage]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const p = canvas.parentElement;
      if (p) { canvas.width = p.clientWidth; canvas.height = p.clientHeight; }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      frameRef.current++;
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        const s = useGameStore.getState();
        const rd = getRoom(s.roomId);
        const npcs = buildNPCs(s, rd);
        const objects = buildObjects(s, rd);

        renderGame(ctx, canvas.width, canvas.height, rd, {
          x: s.playerX, y: s.playerY, dir: s.playerDir, walking: s.playerWalking,
        }, npcs, objects, s.riftsIntensity, frameRef.current, s.strayWoke, s.gameEnding);
      }
      animRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []); // Run once

  // Chat scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [store.messages]);

  // Sound effects
  useEffect(() => {
    if (!audioStarted || !store.flashMessage) return;
    if (store.flashMessage.includes('CORE') || store.flashMessage.includes('SEALED') || store.flashMessage.includes('OPENED')) Audio.sfx('success');
    else if (store.flashMessage.includes('OBJECTION') || store.flashMessage.includes('REFUSED')) Audio.sfx('refuse');
    else if (store.flashMessage.includes('STRAY')) Audio.sfx('danger');
    else if (store.flashMessage.includes('COUNTEROFFER') || store.flashMessage.includes('doughnut')) Audio.sfx('bribe');
  }, [store.flashMessage, audioStarted]);

  useEffect(() => {
    if (!audioStarted || !store.gameEnding) return;
    Audio.stopBGM();
    if (store.gameEnding === 'victory') Audio.sfx('victory');
    else if (store.gameEnding === 'supreme_glaze') Audio.sfx('secret');
    else Audio.sfx('defeat');
  }, [store.gameEnding, audioStarted]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || store.isProcessing || store.gameEnding) return;
    if (!audioStarted) { Audio.init(); Audio.startBGM(); setAudioStarted(true); }
    Audio.sfx('blip');
    store.processTurn(input.trim());
    setInput('');
  };

  const handleSuggestion = (text) => {
    if (store.isProcessing || store.gameEnding) return;
    if (!audioStarted) { Audio.init(); Audio.startBGM(); setAudioStarted(true); }
    Audio.sfx('blip');
    store.processTurn(text);
  };

  const handleRestart = () => {
    Audio.stopBGM(); setAudioStarted(false);
    store.startGame();
  };

  const suggestions = SUGGESTIONS[store.roomId] || [];
  const needsChat = store.interactionMessage?.includes('TYPE') || store.nearGlaze;

  return (
    <div className="game-view">
      {/* Top HUD */}
      <div className="hud-top">
        <div className="hud-left">
          <span className="hud-room">{store.roomId === 'bridge' ? 'BRIDGE' : store.roomId === 'glazing_bay' ? 'GLAZING BAY' : 'THE MAW'}</span>
          <span className={`hud-hp ${store.ship.integrity < 30 ? 'low' : ''}`}>HP {Math.round(store.ship.integrity)}%</span>
        </div>
        <div className="hud-center">
          <span className="hud-core">CORE:{store.inventory.glazeCores}</span>
          <span className="hud-cruller">CRUL:{store.inventory.voidCrullers}</span>
        </div>
        <div className="hud-right">
          <span className={`hud-stray ${store.strayWoke ? 'woke' : ''}`}>
            {store.strayWoke ? 'STRAY!' : 'SAFE'}
          </span>
        </div>
      </div>

      {/* Game canvas */}
      <div className="game-canvas-wrap">
        <canvas ref={canvasRef} className="game-canvas" />

        {/* Interaction hint */}
        {store.interactionMessage && (
          <div className="interact-hint">
            <span className="interact-text">{store.interactionMessage}</span>
          </div>
        )}

        {/* Flash */}
        {store.flashMessage && (
          <div className="flash-bar">
            <span>{store.flashMessage}</span>
          </div>
        )}

        {/* Controls hint */}
        <div className="controls-hint">
          WASD MOVE | SPACE INTERACT | TYPE TO TALK
        </div>
      </div>

      {/* Bottom panel */}
      <div className="bottom-panel">
        {/* Gauges */}
        <div className="gauge-strip">
          <div className="gauge-item"><span className="g-label">TRUST</span><div className="g-bar"><div className="g-fill g-trust" style={{width:`${store.gauges.trust}%`}}/></div><span className="g-val">{store.gauges.trust}</span></div>
          <div className="gauge-item"><span className="g-label">COMP</span><div className="g-bar"><div className="g-fill g-comp" style={{width:`${store.gauges.composure}%`}}/></div><span className="g-val">{store.gauges.composure}</span></div>
          <div className="gauge-item"><span className="g-label">EGO</span><div className="g-bar"><div className="g-fill g-ego" style={{width:`${store.gauges.ego}%`}}/></div><span className="g-val">{store.gauges.ego}</span></div>
          <div className="gauge-item"><span className="g-label">HUNGER</span><div className="g-bar"><div className="g-fill g-hunger" style={{width:`${store.gauges.hunger}%`}}/></div><span className="g-val">{store.gauges.hunger}</span></div>
          <div className="gauge-item gauge-mood">
            <span className={`mood-badge mood-${store.glazeExpression}`}>{store.glazeExpression.toUpperCase()}</span>
          </div>
          {!store.gameEnding && !store.roomCompleted && suggestions.length > 0 && (
            <div className="gauge-quick">
              {suggestions.slice(0, 2).map((s, i) => (
                <button key={i} className="quick-chip" onClick={() => handleSuggestion(s.text)} disabled={store.isProcessing}>
                  {s.text.slice(0, 20)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="chat-area">
          <div className="chat-msgs" ref={scrollRef}>
            {store.messages.slice(-6).map((msg, i) => (
              <div key={i} className={`chat-line chat-${msg.role}`}>
                {msg.role === 'player' && <span className="player-pre">{'>'} </span>}
                <span>{msg.text.length > 80 ? msg.text.slice(0, 80) + '...' : msg.text}</span>
              </div>
            ))}
            {store.isProcessing && <div className="chat-line chat-glaze"><span className="dots"><span/><span/><span/></span></div>}
          </div>

          {!store.gameEnding ? (
            <form className="chat-form" onSubmit={handleSubmit}>
              <span className="prompt">{'>'}</span>
              <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                placeholder={needsChat ? 'TYPE YOUR MESSAGE...' : 'TYPE TO TALK...'}
                disabled={store.isProcessing} autoFocus />
              <button type="submit" disabled={store.isProcessing || !input.trim()}>SEND</button>
            </form>
          ) : (
            <div className="game-over-bar">
              <button className="retro-btn" onClick={handleRestart}>PLAY AGAIN</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildNPCs(state, room) {
  const npcs = [];
  if (!room) return npcs;

  // Glaze
  if (room.glazePos) {
    const moodMap = {
      terrified: '#FF4444', nervous: '#FFAA00', pleased: '#44FF88',
      smug: '#00C8FF', frustrated: '#FF8800', suspicious: '#FF8800',
      triumphant: '#FF00FF', neutral: '#00C8FF',
    };
    npcs.push({
      type: 'glaze',
      worldX: room.glazePos.x * 32 + 16,
      worldY: room.glazePos.y * 32 + 16,
      mood: state.glazeExpression || 'neutral',
      moodColor: moodMap[state.glazeExpression] || '#00C8FF',
      seed: 1,
    });
  }

  // Stray
  if (room.hasStray && room.strayPos) {
    npcs.push({
      type: 'stray',
      worldX: room.strayPos.x * 32 + 16,
      worldY: room.strayPos.y * 32 + 16,
      awake: state.strayWoke,
      seed: 2,
    });
  }

  // Vermious
  if (room.wormPos) {
    npcs.push({
      type: 'vermious',
      worldX: room.wormPos.x * 32 + 16,
      worldY: room.wormPos.y * 32 + 16,
      seed: 3,
    });
  }

  return npcs;
}

function buildObjects(state, room) {
  const objs = [];
  if (!room) return objs;
  if (room.requiredAction?.id === 'grab_core' && room.corePos) {
    if (state.roomCompleted) return objs;
    objs.push({ x: room.corePos.x * 32, y: room.corePos.y * 32 });
  }
  return objs;
}
