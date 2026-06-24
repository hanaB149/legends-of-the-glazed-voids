import { useGameStore } from '../engine/store.js';
import { getMoodRead } from '../engine/compliance.js';
import { getRoom } from '../data/rooms.js';

export function StatusPanel() {
  const gauges = useGameStore(s => s.gauges);
  const inventory = useGameStore(s => s.inventory);
  const ship = useGameStore(s => s.ship);
  const roomId = useGameStore(s => s.roomId);
  const roomCompleted = useGameStore(s => s.roomCompleted);
  const strayWoke = useGameStore(s => s.strayWoke);
  const gameEnding = useGameStore(s => s.gameEnding);

  const mood = getMoodRead(gauges);
  const room = getRoom(roomId);
  const shipBar = Math.round(ship.integrity / 10);

  return (
    <div className="status-panel">
      <div className="scene-display">
        <div className="room-name">{room?.name || 'Unknown'}</div>
        <div className={`glaze-avatar mood-${mood.toLowerCase()}`}>
          <div className="avatar-inner">
            {mood === 'Terrified' && '😱'}
            {mood === 'Nervous' && '😰'}
            {mood === 'Preening' && '😏'}
            {mood === 'Suspicious' && '🤨'}
            {mood === 'Cooperative' && '😊'}
            {mood === 'Hangry' && '😤'}
            {mood === 'Sulking' && '😒'}
            {!['Terrified','Nervous','Preening','Suspicious','Cooperative','Hangry','Sulking'].includes(mood) && '😐'}
          </div>
        </div>
      </div>

      {!gameEnding && (
        <>
          <div className="panel-section">
            <div className="panel-label">Glaze Read</div>
            <div className={`mood-badge ${mood.toLowerCase()}`}>{mood}</div>
          </div>

          <div className="panel-section">
            <div className="panel-label">Trust</div>
            <div className="bar-container">
              <div className="bar-fill trust-bar" style={{ width: `${gauges.trust}%` }} />
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">Composure</div>
            <div className="bar-container">
              <div className="bar-fill composure-bar" style={{ width: `${gauges.composure}%` }} />
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">Resources</div>
            <div className="resource-row">
              <span className="resource-item">🍩 Glaze Cores: {inventory.glazeCores}</span>
              <span className="resource-item">🥯 Void Crullers: {inventory.voidCrullers}</span>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">Ship Integrity</div>
            <div className="bar-container danger-bar-bg">
              <div className="bar-fill integrity-bar" style={{ width: `${ship.integrity}%` }} />
            </div>
          </div>

          {(room?.hasStray) && (
            <div className="panel-section">
              <div className="panel-label">Chrome Stray</div>
              <div className={strayWoke ? 'stray-status awake' : 'stray-status dormant'}>
                {strayWoke ? '⚠️ AWAKE' : '💤 DORMANT'}
              </div>
            </div>
          )}

          {roomCompleted && room?.nextRoom && (
            <div className="panel-section ready-flash">
              ✓ Ready to move to next room
            </div>
          )}
        </>
      )}

      {gameEnding && (
        <div className="ending-message-container">
          {gameEnding === 'victory' && <div className="ending-message victory-ending">🏆 Glazed Victory!</div>}
          {gameEnding === 'hull_lost' && <div className="ending-message loss-ending">💀 Hull Lost</div>}
          {gameEnding === 'mutiny' && <div className="ending-message loss-ending">🏴‍☠️ Mutiny</div>}
          {gameEnding === 'supreme_glaze' && <div className="ending-message secret-ending">👑 Supreme Glaze</div>}
        </div>
      )}
    </div>
  );
}
