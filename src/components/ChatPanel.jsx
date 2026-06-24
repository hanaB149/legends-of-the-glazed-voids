import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../engine/store.js';

export function ChatPanel() {
  const messages = useGameStore(s => s.messages);
  const isProcessing = useGameStore(s => s.isProcessing);
  const gameEnding = useGameStore(s => s.gameEnding);
  const processTurn = useGameStore(s => s.processTurn);
  const startGame = useGameStore(s => s.startGame);

  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

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

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span className="comms-label">COMMS LOG</span>
        <span className="callsign">Cruller {'\u2194'} Captain Glaze</span>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`message message-${msg.role}`}>
            <div className="message-sender">
              {msg.role === 'player' && 'Cruller \u2192'}
              {msg.role === 'glaze' && 'Glaze \u2192'}
              {msg.role === 'system' && 'SYSTEM \u2192'}
            </div>
            <div className="message-text">{msg.text}</div>
          </div>
        ))}
        {isProcessing && (
          <div className="message message-glaze">
            <div className="message-sender">Glaze \u2192</div>
            <div className="message-text typing-indicator">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
      </div>

      {!gameEnding ? (
        <form className="chat-input" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message to Glaze..."
            disabled={isProcessing}
            autoFocus
          />
          <button type="submit" disabled={isProcessing || !input.trim()}>
            Send
          </button>
        </form>
      ) : (
        <div className="game-over-actions">
          <button className="restart-btn" onClick={startGame}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
