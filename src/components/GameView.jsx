import { useState, useRef, useEffect, useCallback } from 'react';
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
  const [showLegend, setShowLegend] = useState(true);

  // Auto-focus input whenever waitingForChat becomes true
  useEffect(() => {
    if (store.waitingForChat && inputRef.current) {
      inputRef.current.focus();
    }
  }, [store.waitingForChat]);

  // Movement loop (only when not chatting)
  useEffect(() => {
    if (store.gameEnding) return;
    const interval = setInterval(() => {
      if (store.waitingForChat) return;
      const k = keysRef.current;
      let dx = 0, dy = 0;
      if (k['ArrowUp'] || k['KeyW']) dy = -1;
      if (k['ArrowDown'] || k['KeyS']) dy = 1;
      if (k['ArrowLeft'] || k['KeyA']) dx = -1;
      if (k['ArrowRight'] || k['KeyD']) dx = 1;
      if (dx || dy) useGameStore.getState().movePlayer(dx, dy);
      else if (store.playerWalking) useGameStore.getState().stopPlayer();
    }, 16);
    return () => clearInterval(interval);
  }, [store.gameEnding, store.playerWalking, store.waitingForChat]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true;
      if (e.code === 'KeyH') { setShowLegend(v => !v); return; }
      if (e.code === 'Space') {
        e.preventDefault();
        if (!audioStarted) { Audio.init(); Audio.startBGM(); setAudioStarted(true); }
        if (store.interactionMessage?.includes('[SPACE]')) {
          Audio.sfx('blip');
          useGameStore.getState().interact();
        }
      }
    };
    const handleKeyUp = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [audioStarted, store.interactionMessage]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { const p = canvas.parentElement; if (p) { canvas.width = p.clientWidth; canvas.height = p.clientHeight; } };
    resize(); window.addEventListener('resize', resize);
    const loop = () => {
      frameRef.current++;
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        const s = useGameStore.getState();
        const rd = getRoom(s.roomId);
        const npcs = [];
        if (rd) {
          if (rd.glazePos) {
            const mm = { terrified: '#FF4444', nervous: '#FFAA00', pleased: '#44FF88', smug: '#00C8FF', frustrated: '#FF8800', suspicious: '#FF8800', triumphant: '#FF00FF', neutral: '#00C8FF' };
            npcs.push({ type: 'glaze', worldX: rd.glazePos.x * 32 + 16, worldY: rd.glazePos.y * 32 + 16, mood: s.glazeExpression || 'neutral', moodColor: mm[s.glazeExpression] || '#00C8FF', seed: 1 });
          }
          if (rd.hasStray && rd.strayPos) npcs.push({ type: 'stray', worldX: rd.strayPos.x * 32 + 16, worldY: rd.strayPos.y * 32 + 16, awake: s.strayWoke, seed: 2 });
          if (rd.wormPos) npcs.push({ type: 'vermious', worldX: rd.wormPos.x * 32 + 16, worldY: rd.wormPos.y * 32 + 16, seed: 3 });
        }
        const objs = [];
        if (rd && rd.requiredAction?.id === 'grab_core' && rd.corePos && !s.roomCompleted) objs.push({ x: rd.corePos.x * 32, y: rd.corePos.y * 32 });
        renderGame(ctx, canvas.width, canvas.height, rd || rd, {
          x: s.playerX, y: s.playerY, dir: s.playerDir, walking: s.playerWalking,
          nearGlaze: s.nearGlaze, nearHatch: s.nearHatch, nearCore: s.nearCore,
          nearRift: s.nearRift, nearWorm: s.nearWorm, nearDoor: s.nearDoor,
          waitingForChat: s.waitingForChat,
        }, npcs, objs, s.riftsIntensity, frameRef.current, s.strayWoke, s.gameEnding);
      }
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener('resize', resize); if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [store.messages]);
  useEffect(() => {
    if (!audioStarted || !store.flashMessage) return;
    if (store.flashMessage.includes('CORE') || store.flashMessage.includes('SEALED') || store.flashMessage.includes('OPENED') || store.flashMessage.includes('PORTAL')) Audio.sfx('success');
    else if (store.flashMessage.includes('OBJECTION') || store.flashMessage.includes('REFUSED')) Audio.sfx('refuse');
    else if (store.flashMessage.includes('STRAY')) Audio.sfx('danger');
    else if (store.flashMessage.includes('DEAL') || store.flashMessage.includes('COUNTER')) Audio.sfx('bribe');
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
    Audio.sfx('blip'); store.processTurn(input.trim()); setInput('');
  };
  const handleSuggestion = (text) => {
    if (store.isProcessing || store.gameEnding) return;
    if (!audioStarted) { Audio.init(); Audio.startBGM(); setAudioStarted(true); }
    Audio.sfx('blip'); store.processTurn(text);
  };
  const handleRestart = () => { Audio.stopBGM(); setAudioStarted(false); store.startGame(); };

  const suggestions = SUGGESTIONS[store.roomId] || [];
  const roomData = getRoom(store.roomId);
  const objLabel = store.roomCompleted
    ? (store.roomId === 'bridge' ? 'GO TO THE HATCH (NORTH)' : store.roomId === 'glazing_bay' ? 'ENTER THE DOOR (EAST)' : '')
    : (store.roomId === 'bridge' ? 'TALK TO GLAZE, GET HIM TO THE HATCH'
      : store.roomId === 'glazing_bay' ? 'PERSUADE GLAZE TO GRAB A CORE'
      : 'SEAL RIFT, THEN FEED WORM');

  return (
    <div className="game-view">
      <div className="hud-top">
        <div className="hud-left">
          <span className="hud-room">{roomData?.name || ''}</span>
        </div>
        <div className="hud-center">
          <span className="hud-core">CORES: {store.inventory.glazeCores}</span>
          <span className="hud-cruller">CRULLERS: {store.inventory.voidCrullers}</span>
          <span className={`hud-hp ${store.ship.integrity < 30 ? 'low' : ''}`}>HP {Math.round(store.ship.integrity)}%</span>
        </div>
        <div className="hud-right">
          {store.roomId === 'glazing_bay' && (
            <span className={`hud-stray ${store.strayWoke ? 'woke' : ''}`}>
              {store.strayWoke ? '! STRAY ACTIVE' : '~ STRAY DORMANT'}
            </span>
          )}
          <span className="hud-mood">{store.glazeExpression.toUpperCase()}</span>
        </div>
      </div>

      <div className="game-canvas-wrap">
        <canvas ref={canvasRef} className="game-canvas" />

        {/* Always show objective */}
        <div className="objective-hud">{objLabel}</div>

        {store.interactionMessage && (
          <div className="interact-hint">{store.interactionMessage}</div>
        )}
        {store.flashMessage && (
          <div className="flash-bar"><span>{store.flashMessage}</span></div>
        )}
        <div className="controls-hint">
          {store.waitingForChat ? 'TYPE BELOW + ENTER TO SEND' : 'WASD=MOVE SPACE=INTERACT H=HELP'}
        </div>

        {showLegend && (
          <div className="legend-overlay">
            <div className="legend-title">HOW TO PLAY</div>
            <div className="legend-row"><span className="legend-key">W/A/S/D</span> MOVE</div>
            <div className="legend-row"><span className="legend-key">SPACE</span> INTERACT</div>
            <div className="legend-row"><span className="legend-key">ENTER</span> SEND MESSAGE</div>
            <div className="legend-row"><span className="legend-key">H</span> TOGGLE HELP</div>
            <div className="legend-divider" />
            <div className="legend-row"><span className="legend-g">GLAZE</span> = TALK TO HIM</div>
            <div className="legend-row">WALK UP TO HIM AND PRESS SPACE</div>
            <div className="legend-row">THEN TYPE YOUR MESSAGE</div>
            <div className="legend-small">TRY: COMMAND / FLATTER / BRIBE / REASSURE</div>
          </div>
        )}
      </div>

      <div className="bottom-panel">
        <div className="gauge-strip">
          <div className="gauge-item"><span className="g-label">TRUST</span><div className="g-bar"><div className="g-fill g-trust" style={{width:`${store.gauges.trust}%`}}/></div><span className="g-val">{store.gauges.trust}</span></div>
          <div className="gauge-item"><span className="g-label">COMP</span><div className="g-bar"><div className="g-fill g-comp" style={{width:`${store.gauges.composure}%`}}/></div><span className="g-val">{store.gauges.composure}</span></div>
          <div className="gauge-item"><span className="g-label">EGO</span><div className="g-bar"><div className="g-fill g-ego" style={{width:`${store.gauges.ego}%`}}/></div><span className="g-val">{store.gauges.ego}</span></div>
          <div className="gauge-item"><span className="g-label">HUNGER</span><div className="g-bar"><div className="g-fill g-hunger" style={{width:`${store.gauges.hunger}%`}}/></div><span className="g-val">{store.gauges.hunger}</span></div>
          {!store.gameEnding && !store.roomCompleted && suggestions.length > 0 && (
            <div className="gauge-quick">
              {suggestions.map((s, i) => (
                <button key={i} className="quick-chip" onClick={() => handleSuggestion(s.text)} disabled={store.isProcessing}>
                  {s.hint}: {s.text.slice(0, 18)}
                </button>
              ))}
            </div>
          )}
          {store.roomCompleted && store.roomId !== 'maw' && <span className="next-tag">! MOVE TO EXIT</span>}
        </div>

        <div className="chat-area">
          <div className="chat-msgs" ref={scrollRef}>
            {store.messages.slice(-5).map((msg, i) => (
              <div key={i} className={`chat-line chat-${msg.role}`}>
                {msg.role === 'player' && <span className="player-pre">{'>'} </span>}
                <span>{msg.text.length > 95 ? msg.text.slice(0, 95) + '...' : msg.text}</span>
              </div>
            ))}
            {store.isProcessing && <div className="chat-line chat-glaze"><span className="dots"><span/><span/><span/></span></div>}
          </div>
          {!store.gameEnding ? (
            <form className="chat-form" onSubmit={handleSubmit}>
              <span className="prompt">{'>'}</span>
              <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                placeholder={store.waitingForChat ? 'TYPE YOUR MESSAGE...' : 'TYPE TO TALK (OR USE BUTTONS ABOVE)'}
                disabled={store.isProcessing} autoFocus />
              <button type="submit" disabled={store.isProcessing || !input.trim()}>SEND</button>
            </form>
          ) : (
            <div className="game-over-bar"><button className="retro-btn" onClick={handleRestart}>PLAY AGAIN</button></div>
          )}
        </div>
      </div>
    </div>
  );
}
