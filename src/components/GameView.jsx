import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../engine/store.js';
import { getMoodRead } from '../engine/compliance.js';
import { getRoom } from '../data/rooms.js';
import { SceneSvg } from './SceneSvg.jsx';
import { GlazePortrait } from './GlazePortrait.jsx';

const SUGGESTIONS = {
  bridge: [
    { text: 'Move to the hatch, Captain', icon: '🎯', appeal: 'command' },
    { text: 'You\'re the only one who can do this', icon: '🌟', appeal: 'flatter' },
    { text: 'It\'s safe, I\'ve got eyes on the whole corridor', icon: '🛡️', appeal: 'reassure' },
  ],
  glazing_bay: [
    { text: 'Grab the Glaze Core for me', icon: '🎯', appeal: 'command' },
    { text: 'There\'s a doughnut in it for you', icon: '🍩', appeal: 'bribe' },
    { text: 'The cat is asleep. You can do this quietly.', icon: '🤫', appeal: 'reassure' },
    { text: 'You\'re the Captain. Act like it.', icon: '⚡', appeal: 'argue' },
  ],
  maw: [
    { text: 'Seal the rift with a Glaze Core', icon: '🔮', appeal: 'command' },
    { text: 'Feed Vermious the Void Cruller', icon: '🪱', appeal: 'command' },
    { text: 'We\'re almost out of time, just do it!', icon: '⏰', appeal: 'argue' },
  ],
};

export function GameView() {
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
  const scrollRef = useRef(null);

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
    processTurn(input.trim());
    setInput('');
  };

  const handleSuggestion = (text) => {
    if (isProcessing || gameEnding) return;
    processTurn(text);
  };

  const shipBar = Math.max(0, Math.round(ship.integrity / 10));

  return (
    <div className="game-view">
      {/* Top HUD */}
      <div className="hud-bar">
        <div className="hud-left">
          <div className="hud-badge ship-name">U.S.V. Old-Fashioned</div>
          <div className="hud-badge room-badge">{room?.name || 'Unknown'}</div>
        </div>
        <div className="hud-center">
          <span className="hud-title">LEGENDS OF THE GLAZED VOIDS</span>
        </div>
        <div className="hud-right">
          <div className="hud-stat">
            <span className="hud-stat-icon">🍩</span>
            <span className="hud-stat-value">{inventory.glazeCores}</span>
          </div>
          <div className="hud-stat">
            <span className="hud-stat-icon">🥯</span>
            <span className="hud-stat-value">{inventory.voidCrullers}</span>
          </div>
          <div className="hud-stat">
            <div className={`integrity-dot ${ship.integrity > 50 ? 'safe' : ship.integrity > 25 ? 'warning' : 'danger'}`} />
            <span className="hud-stat-value">{Math.round(ship.integrity)}%</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="game-main">
        {/* Scene panel */}
        <div className="scene-panel">
          <SceneSvg room={room} riftsIntensity={riftsIntensity} strayWoke={strayWoke} />

          {/* Flash message overlay */}
          {flashMessage && (
            <div className="flash-overlay">
              <div className="flash-text">{flashMessage}</div>
            </div>
          )}

          {/* Glaze portrait overlay */}
          <div className="portrait-overlay">
            <GlazePortrait expression={glazeExpression} mood={mood} />
            <div className={`mood-label mood-${mood.toLowerCase()}`}>{mood}</div>
          </div>

          {/* Room objective */}
          <div className="objective-bar">
            <span className="objective-icon">🎯</span>
            <span className="objective-text">{room?.objective}</span>
          </div>
        </div>

        {/* Chat panel */}
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-left">
              <span className="comms-dot" />
              <span className="comms-label">COMMS</span>
            </div>
            <span className="callsign">Cruller → Glaze</span>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`message message-${msg.role}`}>
                <div className="message-bubble">
                  {msg.role === 'system' && <div className="message-text system-text">{msg.text}</div>}
                  {msg.role !== 'system' && <div className="message-text">{msg.text}</div>}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="message message-glaze">
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestion chips */}
          {!gameEnding && !roomCompleted && suggestions.length > 0 && (
            <div className="suggestion-strip">
              {suggestions.map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => handleSuggestion(s.text)}
                  disabled={isProcessing}>
                  <span className="suggestion-icon">{s.icon}</span>
                  <span className="suggestion-text">{s.text}</span>
                </button>
              ))}
            </div>
          )}

          {!gameEnding ? (
            <form className="chat-input" onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message to Captain Glaze..."
                disabled={isProcessing}
                autoFocus
              />
              <button type="submit" disabled={isProcessing || !input.trim()}>
                Send
              </button>
            </form>
          ) : (
            <div className="game-over-actions">
              <button className="restart-btn" onClick={startGame}>Play Again</button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom gauge bar */}
      {!gameEnding && (
        <div className="gauge-bar">
          <div className="gauge-item">
            <span className="gauge-label">Trust</span>
            <div className="gauge-track">
              <div className="gauge-fill trust-fill" style={{ width: `${gauges.trust}%` }} />
            </div>
            <span className="gauge-value">{gauges.trust}%</span>
          </div>
          <div className="gauge-item">
            <span className="gauge-label">Composure</span>
            <div className="gauge-track">
              <div className="gauge-fill composure-fill" style={{ width: `${gauges.composure}%` }} />
            </div>
            <span className="gauge-value">{gauges.composure}%</span>
          </div>
          <div className="gauge-item">
            <span className="gauge-label">Ego</span>
            <div className="gauge-track">
              <div className="gauge-fill ego-fill" style={{ width: `${gauges.ego}%` }} />
            </div>
            <span className="gauge-value">{gauges.ego}%</span>
          </div>
          <div className="gauge-item">
            <span className="gauge-label">Hunger</span>
            <div className="gauge-track">
              <div className="gauge-fill hunger-fill" style={{ width: `${gauges.hunger}%` }} />
            </div>
            <span className="gauge-value">{gauges.hunger}%</span>
          </div>
          <div className="gauge-item wide">
            <span className="gauge-label">Ship Integrity</span>
            <div className="gauge-track danger-track">
              <div className="gauge-fill integrity-fill" style={{ width: `${ship.integrity}%` }} />
            </div>
            <span className="gauge-value">{Math.round(ship.integrity)}%</span>
          </div>
          {room?.hasStray && (
            <div className="gauge-item compact">
              <span className={`stray-indicator ${strayWoke ? 'awake' : 'dormant'}`}>
                {strayWoke ? '⚠️ Stray Active' : '💤 Stray Dormant'}
              </span>
            </div>
          )}
          {roomCompleted && room?.nextRoom && (
            <div className="gauge-item compact">
              <span className="next-room-indicator">→ Ready for next room</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
