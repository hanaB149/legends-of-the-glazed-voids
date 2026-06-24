import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../engine/store.js';
import { getMoodRead } from '../engine/compliance.js';
import { getRoom } from '../data/rooms.js';
import { Audio } from '../audio/audio.js';
import { renderScene } from './PixelScene.js';

const SUGGESTIONS = {
  bridge: [
    { text: 'Move to the hatch, Captain', icon: '\u{1F3AF}', appeal: 'command' },
    { text: 'You\'re the only one who can do this', icon: '\u{1F31F}', appeal: 'flatter' },
    { text: 'It\'s safe, I\'ve got eyes on everything', icon: '\u{1F6E1}', appeal: 'reassure' },
  ],
  glazing_bay: [
    { text: 'Grab the Glaze Core', icon: '\u{1F3AF}', appeal: 'command' },
    { text: 'There\'s a doughnut in it for you', icon: '\u{1F369}', appeal: 'bribe' },
    { text: 'The cat is asleep. Quietly does it.', icon: '\u{1F92B}', appeal: 'reassure' },
    { text: 'You\'re the Captain. Act like it.', icon: '\u26A1', appeal: 'argue' },
  ],
  maw: [
    { text: 'Seal the rift with a Glaze Core', icon: '\u{1F52E}', appeal: 'command' },
    { text: 'Feed Vermious the Void Cruller', icon: '\u{1FAB1}', appeal: 'command' },
    { text: 'We\'re out of time, just do it!', icon: '\u23F0', appeal: 'argue' },
  ],
};

export function GameView() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);
  const scrollRef = useRef(null);

  const messages = useGameStore(s => s.messages);
  const isProcessing = useGameStore(s => s.isProcessing);
  const gameEnding = useGameStore(s => s.gameEnding);
  const processTurn = useGameStore(s => s.processTurn);
  const startGame = useGameStore(s => s.startGame);
  const gauges = useGameStore(s => s.gauges);
  const inventory = useGameStore(s => s.inventory);
  const ship = useGameStore(s => s.ship);
  const roomId = useGameStore(s => s.roomId);
  const roomCompleted = useGameStore(s => s.roomCompleted);
  const strayWoke = useGameStore(s => s.strayWoke);
  const glazeExpression = useGameStore(s => s.glazeExpression);
  const flashMessage = useGameStore(s => s.flashMessage);
  const riftsIntensity = useGameStore(s => s.riftsIntensity);

  const [input, setInput] = useState('');
  const [audioStarted, setAudioStarted] = useState(false);

  const mood = getMoodRead(gauges);
  const room = getRoom(roomId);
  const suggestions = SUGGESTIONS[roomId] || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || gameEnding) return;
    if (!audioStarted) {
      Audio.init();
      Audio.startBGM();
      setAudioStarted(true);
    }
    Audio.sfx('blip');
    processTurn(input.trim());
    setInput('');
  };

  const handleSuggestion = (text) => {
    if (isProcessing || gameEnding) return;
    if (!audioStarted) {
      Audio.init();
      Audio.startBGM();
      setAudioStarted(true);
    }
    Audio.sfx('blip');
    processTurn(text);
  };

  const handleStartBGM = useCallback(() => {
    Audio.init();
    Audio.startBGM();
    setAudioStarted(true);
  }, []);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      const p = canvas.parentElement;
      if (p) {
        canvas.width = p.clientWidth;
        canvas.height = p.clientHeight;
      }
    }
    resize();
    window.addEventListener('resize', resize);

    function loop() {
      frameRef.current++;
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        renderScene(ctx, canvas.width, canvas.height, room, riftsIntensity, strayWoke, frameRef.current);
      }
      animRef.current = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [roomId, riftsIntensity, strayWoke, room]);

  // Sound effects for game events
  useEffect(() => {
    if (!audioStarted) return;
    if (flashMessage) {
      if (flashMessage.includes('+1') || flashMessage.includes('sealed') || flashMessage.includes('opened')) {
        Audio.sfx('success');
      } else if (flashMessage.includes('Objection') || flashMessage.includes('Refused')) {
        Audio.sfx('refuse');
      } else if (flashMessage.includes('Stray woke')) {
        Audio.sfx('danger');
      } else if (flashMessage.includes('deal') || flashMessage.includes('doughnut')) {
        Audio.sfx('bribe');
      }
    }
  }, [flashMessage, audioStarted]);

  // Endgame sounds
  useEffect(() => {
    if (!audioStarted || !gameEnding) return;
    Audio.stopBGM();
    if (gameEnding === 'victory') Audio.sfx('victory');
    else if (gameEnding === 'supreme_glaze') Audio.sfx('secret');
    else Audio.sfx('defeat');
  }, [gameEnding, audioStarted]);

  const handleRestart = () => {
    Audio.stopBGM();
    setAudioStarted(false);
    startGame();
  };

  return (
    <div className="game-view" onClick={handleStartBGM}>
      <div className="game-view-inner">
        {/* Canvas scene (third-person view) */}
        <div className="scene-container" style={{ position: 'relative', overflow: 'hidden' }}>
          <canvas ref={canvasRef} className="pixel-canvas" />

          {flashMessage && (
            <div className="pixel-flash">
              <span>{flashMessage}</span>
            </div>
          )}

          {!audioStarted && (
            <div className="click-to-play">
              <span>CLICK TO START</span>
            </div>
          )}
        </div>

        {/* HUD overlay on scene */}
        <div className="pixel-hud">
          <div className="pixel-hud-top">
            <div className="pixel-hud-left">
              <span className="pixel-badge room-badge">&gt; {room?.name || 'UNKNOWN'}</span>
              <span className="pixel-badge obj-badge">{room?.objective?.slice(0, 40) || ''}</span>
            </div>
            <div className="pixel-hud-right">
              <span className="pixel-stat"><span className="pixel-icon">C</span> {inventory.glazeCores}</span>
              <span className="pixel-stat"><span className="pixel-icon">V</span> {inventory.voidCrullers}</span>
              <span className={`pixel-stat ${ship.integrity < 30 ? 'danger-text' : ''}`}>
                HP {Math.round(ship.integrity)}%
              </span>
            </div>
          </div>
        </div>

        {/* Bottom panel: chat + gauges */}
        <div className="pixel-bottom-panel">
          {/* Gauge bar */}
          <div className="pixel-gauges">
            <div className="pixel-gauge">
              <span className="g-label">TRUST</span>
              <div className="g-track"><div className="g-fill g-trust" style={{ width: `${gauges.trust}%` }} /></div>
            </div>
            <div className="pixel-gauge">
              <span className="g-label">COMP</span>
              <div className="g-track"><div className="g-fill g-composure" style={{ width: `${gauges.composure}%` }} /></div>
            </div>
            <div className="pixel-gauge">
              <span className="g-label">EGO</span>
              <div className="g-track"><div className="g-fill g-ego" style={{ width: `${gauges.ego}%` }} /></div>
            </div>
            <div className="pixel-gauge">
              <span className="g-label">HUNGER</span>
              <div className="g-track"><div className="g-fill g-hunger" style={{ width: `${gauges.hunger}%` }} /></div>
            </div>
            <div className="pixel-gauge mood-gauge">
              <span className="g-label">MOOD</span>
              <span className={`mood-indicator mood-${mood.toLowerCase()}`}>{mood}</span>
            </div>
            {room?.hasStray && (
              <div className="pixel-gauge">
                <span className={`stray-tag ${strayWoke ? 'awake' : 'dormant'}`}>
                  {strayWoke ? 'STRAY!' : 'SLEEP'}
                </span>
              </div>
            )}
            {roomCompleted && room?.nextRoom && (
              <div className="pixel-gauge">
                <span className="next-tag">{'>'} NEXT</span>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="pixel-chat">
            <div className="pixel-chat-messages" ref={scrollRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`pixel-msg pixel-msg-${msg.role}`}>
                  {msg.role === 'player' && <>&gt; {msg.text}</>}
                  {msg.role === 'glaze' && <span className="glaze-text">{msg.text}</span>}
                  {msg.role === 'system' && <span className="sys-text">{msg.text}</span>}
                </div>
              ))}
              {isProcessing && (
                <div className="pixel-msg pixel-msg-glaze">
                  <span className="glaze-text typing-dots"><span/><span/><span/></span>
                </div>
              )}
            </div>

            {!gameEnding && !roomCompleted && suggestions.length > 0 && (
              <div className="pixel-suggestions">
                {suggestions.map((s, i) => (
                  <button key={i} className="pixel-chip" onClick={() => handleSuggestion(s.text)} disabled={isProcessing}>
                    {s.icon} {s.text}
                  </button>
                ))}
              </div>
            )}

            {!gameEnding ? (
              <form className="pixel-input-row" onSubmit={handleSubmit}>
                <span className="prompt-symbol">{'>'}</span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="TYPE MESSAGE..."
                  disabled={isProcessing}
                  autoFocus
                />
                <button type="submit" disabled={isProcessing || !input.trim()}>SEND</button>
              </form>
            ) : (
              <div className="pixel-restart">
                <button className="pixel-btn" onClick={handleRestart}>PLAY AGAIN</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
