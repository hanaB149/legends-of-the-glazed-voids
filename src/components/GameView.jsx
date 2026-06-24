import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../engine/store.js';
import { Audio } from '../audio/audio.js';
import { getRoom } from '../data/rooms.js';
import { renderGame } from './PixelScene.js';

const SUGGESTIONS = {
  bridge: [
    { text: 'Move to the hatch, Captain', hint: 'COMMAND' },
    { text: 'You are the only one who can do this', hint: 'FLATTER' },
    { text: 'It is safe, I have got eyes on everything', hint: 'REASSURE' },
  ],
  glazing_bay: [
    { text: 'Grab the Glaze Core', hint: 'COMMAND' },
    { text: 'There is a doughnut in it for you', hint: 'BRIBE' },
    { text: 'The cat is asleep. Quietly does it.', hint: 'REASSURE' },
  ],
  maw: [
    { text: 'Seal the rift with a Glaze Core', hint: 'COMMAND' },
    { text: 'Feed Vermious the Void Cruller', hint: 'COMMAND' },
    { text: 'We are out of time, just do it!', hint: 'ARGUE' },
  ],
};

// Global key tracking - works regardless of React rendering
const keys = {};

export function GameView() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const [input, setInput] = useState('');
  const [audioStarted, setAudioStarted] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // Subscribe to individual store values
  const gameEnding = useGameStore(s => s.gameEnding);
  const isProcessing = useGameStore(s => s.isProcessing);
  const messages = useGameStore(s => s.messages);
  const gauges = useGameStore(s => s.gauges);
  const inventory = useGameStore(s => s.inventory);
  const ship = useGameStore(s => s.ship);
  const roomId = useGameStore(s => s.roomId);
  const roomCompleted = useGameStore(s => s.roomCompleted);
  const strayWoke = useGameStore(s => s.strayWoke);
  const glazeExpression = useGameStore(s => s.glazeExpression);
  const flashMessage = useGameStore(s => s.flashMessage);
  const interactionMessage = useGameStore(s => s.interactionMessage);
  const waitingForChat = useGameStore(s => s.waitingForChat);

  // Global keyboard listeners - set once, never removed
  useEffect(() => {
    const onKeyDown = (e) => {
      keys[e.code] = true;
    };
    const onKeyUp = (e) => {
      keys[e.code] = false;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // SPACE handler listens as event, not through state
  useEffect(() => {
    const onSpace = (e) => {
      if (e.code !== 'Space') return;
      if (e.target.tagName === 'INPUT') return; // let input handle it
      e.preventDefault();
      const store = useGameStore.getState();
      if (store.waitingForChat) return;
      if (!store.interactionMessage?.includes('[SPACE]')) return;

      if (!audioStarted) { Audio.init(); Audio.startBGM(); setAudioStarted(true); }
      Audio.sfx('blip');
      store.interact();
    };
    const onH = (e) => {
      if (e.code === 'KeyH') setShowLegend(v => !v);
    };
    window.addEventListener('keydown', onSpace);
    window.addEventListener('keydown', onH);
    return () => {
      window.removeEventListener('keydown', onSpace);
      window.removeEventListener('keydown', onH);
    };
  }, [audioStarted]);

  // Movement and render game loop (runs every frame)
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

    let moveTimer = 0;

    const tick = () => {
      frameRef.current++;
      moveTimer++;

      // Handle movement every 3 frames (~20 times/sec)
      if (moveTimer % 2 === 0) {
        const store = useGameStore.getState();
        if (!store.gameEnding && !store.waitingForChat) {
          let dx = 0, dy = 0;
          if (keys['ArrowUp'] || keys['KeyW']) dy = -1;
          if (keys['ArrowDown'] || keys['KeyS']) dy = 1;
          if (keys['ArrowLeft'] || keys['KeyA']) dx = -1;
          if (keys['ArrowRight'] || keys['KeyD']) dx = 1;
          if (dx !== 0 || dy !== 0) {
            store.movePlayer(dx, dy);
          } else if (store.playerWalking) {
            store.stopPlayer();
          }
        }
      }

      // Render
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        const s = useGameStore.getState();
        const rd = getRoom(s.roomId);
        const npcs = [];
        if (rd) {
          if (rd.glazePos) {
            const mm = { terrified: '#FF4466', nervous: '#FFAA44', pleased: '#44FF88', smug: '#44DDFF', frustrated: '#FF8855', suspicious: '#FF8855', triumphant: '#FF66FF', neutral: '#44DDFF' };
            npcs.push({ type: 'glaze', worldX: rd.glazePos.x * 32 + 16, worldY: rd.glazePos.y * 32 + 16, mood: s.glazeExpression || 'neutral', moodColor: mm[s.glazeExpression] || '#44DDFF', seed: 1 });
          }
          if (rd.hasStray && rd.strayPos) npcs.push({ type: 'stray', worldX: rd.strayPos.x * 32 + 16, worldY: rd.strayPos.y * 32 + 16, awake: s.strayWoke, seed: 2 });
          if (rd.wormPos) npcs.push({ type: 'vermious', worldX: rd.wormPos.x * 32 + 16, worldY: rd.wormPos.y * 32 + 16, seed: 3 });
        }
        const objs = [];
        if (rd && rd.requiredAction?.id === 'grab_core' && rd.corePos && !s.roomCompleted) objs.push({ x: rd.corePos.x * 32, y: rd.corePos.y * 32 });
        renderGame(ctx, canvas.width, canvas.height, rd || rd, {
          x: s.playerX, y: s.playerY, dir: s.playerDir, walking: s.playerWalking,
          nearGlaze: s.nearGlaze, nearHatch: s.nearHatch, nearCore: s.nearCore,
          nearRift: s.nearRift, nearWorm: s.nearWorm,
        }, npcs, objs, s.riftsIntensity, frameRef.current, s.strayWoke, s.gameEnding);
      }

      animRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Chat auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Sound effects
  useEffect(() => {
    if (!audioStarted || !flashMessage) return;
    if (flashMessage.includes('CORE') || flashMessage.includes('SEALED') || flashMessage.includes('OPENED') || flashMessage.includes('PORTAL')) Audio.sfx('success');
    else if (flashMessage.includes('OBJECTION') || flashMessage.includes('REFUSED')) Audio.sfx('refuse');
    else if (flashMessage.includes('STRAY')) Audio.sfx('danger');
    else if (flashMessage.includes('DEAL') || flashMessage.includes('COUNTER')) Audio.sfx('bribe');
  }, [flashMessage, audioStarted]);

  useEffect(() => {
    if (!audioStarted || !gameEnding) return;
    Audio.stopBGM();
    if (gameEnding === 'victory') Audio.sfx('victory');
    else if (gameEnding === 'supreme_glaze') Audio.sfx('secret');
    else Audio.sfx('defeat');
  }, [gameEnding, audioStarted]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || gameEnding) return;
    if (!audioStarted) { Audio.init(); Audio.startBGM(); setAudioStarted(true); }
    Audio.sfx('blip');
    useGameStore.getState().processTurn(input.trim());
    setInput('');
  };

  const handleSuggestion = (text) => {
    if (isProcessing || gameEnding) return;
    if (!audioStarted) { Audio.init(); Audio.startBGM(); setAudioStarted(true); }
    Audio.sfx('blip');
    useGameStore.getState().processTurn(text);
  };

  const handleRestart = () => { Audio.stopBGM(); setAudioStarted(false); useGameStore.getState().startGame(); };

  const suggestions = SUGGESTIONS[roomId] || [];
  const roomData = getRoom(roomId);
  const objLabel = roomCompleted
    ? (roomId === 'bridge' ? 'GO TO THE HATCH (NORTH)' : roomId === 'glazing_bay' ? 'ENTER THE DOOR (EAST)' : '')
    : (roomId === 'bridge' ? 'TALK TO GLAZE, GET HIM TO THE HATCH'
      : roomId === 'glazing_bay' ? 'PERSUADE GLAZE TO GRAB A CORE'
      : 'SEAL RIFT, THEN FEED WORM');

  return (
    <div className="game-view">
      <div className="hud-top">
        <div className="hud-left">
          <span className="hud-room">{roomData?.name || ''}</span>
        </div>
        <div className="hud-center">
          <span className="hud-core">CORES: {inventory.glazeCores}</span>
          <span className="hud-cruller">CRULLERS: {inventory.voidCrullers}</span>
          <span className={`hud-hp ${ship.integrity < 30 ? 'low' : ''}`}>HP {Math.round(ship.integrity)}%</span>
        </div>
        <div className="hud-right">
          {roomId === 'glazing_bay' && (
            <span className={`hud-stray ${strayWoke ? 'woke' : ''}`}>
              {strayWoke ? '! STRAY ACTIVE' : '~ STRAY DORMANT'}
            </span>
          )}
          <span className="hud-mood">{glazeExpression.toUpperCase()}</span>
        </div>
      </div>

      <div className="game-canvas-wrap">
        <canvas ref={canvasRef} className="game-canvas" tabIndex={0} />
        <div className="objective-hud">{objLabel}</div>
        {interactionMessage && <div className="interact-hint">{interactionMessage}</div>}
        {flashMessage && <div className="flash-bar"><span>{flashMessage}</span></div>}
        <div className="controls-hint">
          {waitingForChat ? 'TYPE BELOW + ENTER TO SEND' : 'ARROW KEYS OR WASD TO MOVE | SPACE TO INTERACT'}
        </div>

        {/* Directional controls for clicking/tapping */}
        <div className="dpad">
          <button className="dpad-btn dpad-up" onMouseDown={() => { keys['ArrowUp'] = true; }} onMouseUp={() => { keys['ArrowUp'] = false; }} onTouchStart={() => { keys['ArrowUp'] = true; }} onTouchEnd={() => { keys['ArrowUp'] = false; }}>&#9650;</button>
          <button className="dpad-btn dpad-down" onMouseDown={() => { keys['ArrowDown'] = true; }} onMouseUp={() => { keys['ArrowDown'] = false; }} onTouchStart={() => { keys['ArrowDown'] = true; }} onTouchEnd={() => { keys['ArrowDown'] = false; }}>&#9660;</button>
          <button className="dpad-btn dpad-left" onMouseDown={() => { keys['ArrowLeft'] = true; }} onMouseUp={() => { keys['ArrowLeft'] = false; }} onTouchStart={() => { keys['ArrowLeft'] = true; }} onTouchEnd={() => { keys['ArrowLeft'] = false; }}>&#9664;</button>
          <button className="dpad-btn dpad-right" onMouseDown={() => { keys['ArrowRight'] = true; }} onMouseUp={() => { keys['ArrowRight'] = false; }} onTouchStart={() => { keys['ArrowRight'] = true; }} onTouchEnd={() => { keys['ArrowRight'] = false; }}>&#9654;</button>
        </div>

        {showLegend && (
          <div className="legend-overlay">
            <div className="legend-title">HOW TO PLAY</div>
            <div className="legend-row"><span className="legend-key">W/A/S/D</span> <span style={{color:'#FFCC44'}}>or</span> <span className="legend-key">ARROWS</span> MOVE</div>
            <div className="legend-row"><span className="legend-key">SPACE</span> TALK TO GLAZE / USE</div>
            <div className="legend-row"><span className="legend-key">ENTER</span> SEND MESSAGE</div>
            <div className="legend-row"><span className="legend-key">H</span> TOGGLE HELP</div>
            <div className="legend-divider" />
            <div className="legend-row" style={{color:'#44FF88'}}>STEP 1: WALK TO GLAZE (green guy)</div>
            <div className="legend-row" style={{color:'#44FF88'}}>STEP 2: PRESS SPACE NEAR HIM</div>
            <div className="legend-row" style={{color:'#44FF88'}}>STEP 3: TYPE + ENTER</div>
            <div className="legend-divider" />
            <div className="legend-row" style={{color:'#B8A8D8',fontSize:'6px'}}>TRY: COMMAND FLATTER BRIBE REASSURE</div>
          </div>
        )}
      </div>

      <div className="bottom-panel">
        <div className="gauge-strip">
          <div className="gauge-item"><span className="g-label">TRUST</span><div className="g-bar"><div className="g-fill g-trust" style={{width:`${gauges.trust}%`}}/></div><span className="g-val">{gauges.trust}</span></div>
          <div className="gauge-item"><span className="g-label">COMP</span><div className="g-bar"><div className="g-fill g-comp" style={{width:`${gauges.composure}%`}}/></div><span className="g-val">{gauges.composure}</span></div>
          <div className="gauge-item"><span className="g-label">EGO</span><div className="g-bar"><div className="g-fill g-ego" style={{width:`${gauges.ego}%`}}/></div><span className="g-val">{gauges.ego}</span></div>
          <div className="gauge-item"><span className="g-label">HUNGER</span><div className="g-bar"><div className="g-fill g-hunger" style={{width:`${gauges.hunger}%`}}/></div><span className="g-val">{gauges.hunger}</span></div>
          {!gameEnding && !roomCompleted && suggestions.length > 0 && (
            <div className="gauge-quick">
              {suggestions.map((s, i) => (
                <button key={i} className="quick-chip" onClick={() => handleSuggestion(s.text)} disabled={isProcessing}>
                  {s.hint}: {s.text.slice(0, 18)}
                </button>
              ))}
            </div>
          )}
          {roomCompleted && roomId !== 'maw' && <span className="next-tag">MOVE TO EXIT</span>}
        </div>

        <div className="chat-area">
          <div className="chat-msgs" ref={scrollRef}>
            {messages.slice(-5).map((msg, i) => (
              <div key={i} className={`chat-line chat-${msg.role}`}>
                {msg.role === 'player' && <span className="player-pre">{'>'} </span>}
                <span>{msg.text.length > 95 ? msg.text.slice(0, 95) + '...' : msg.text}</span>
              </div>
            ))}
            {isProcessing && <div className="chat-line chat-glaze"><span className="dots"><span/><span/><span/></span></div>}
          </div>
          {!gameEnding ? (
            <form className="chat-form" onSubmit={handleSubmit}>
              <span className="prompt">{'>'}</span>
              <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                placeholder={waitingForChat ? 'TYPE YOUR MESSAGE...' : 'TYPE TO TALK OR USE QUICK CHIPS'}
                disabled={isProcessing} autoFocus />
              <button type="submit" disabled={isProcessing || !input.trim()}>SEND</button>
            </form>
          ) : (
            <div className="game-over-bar"><button className="retro-btn" onClick={handleRestart}>PLAY AGAIN</button></div>
          )}
        </div>
      </div>
    </div>
  );
}
