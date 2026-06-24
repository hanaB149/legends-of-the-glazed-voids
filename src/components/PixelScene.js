// Pixel-art tile-based third-person adventure engine
// Renders tilemaps, player, NPCs, interactive objects with camera follow

import { T, getTileAt } from '../data/rooms.js';

const TILE = 32;
const COLORS = {
  [T.VOID]: '#000000',
  [T.FLOOR]: null,
  [T.WALL]: null,
  [T.CONSOLE]: '#2D0E52',
  [T.HATCH]: '#1a0a3e',
  [T.CORE_POD]: '#0D0020',
  [T.RIFT]: '#0A0014',
  [T.PORTAL]: '#0A0014',
  [T.WORM]: '#1a0a2e',
  [T.STRAY]: '#0A0014',
  [T.DOOR]: '#1a0a3e',
  [T.PIPE]: '#1a0533',
  [T.CRATE]: '#2D0E52',
};

export function renderGame(ctx, w, h, roomData, player, npcs, objects, riftsIntensity, frame, strayWoke, gameEnding) {
  const camX = player.x - w / 2 + TILE / 2;
  const camY = player.y - h / 2 + TILE / 2;

  ctx.fillStyle = '#0A0014';
  ctx.fillRect(0, 0, w, h);

  const map = roomData.map;
  const rows = map.length;
  const cols = map[0].length;

  // Draw tiles
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const tile = map[ty][tx];
      const sx = tx * TILE - camX;
      const sy = ty * TILE - camY;

      if (sx + TILE < -10 || sx > w + 10 || sy + TILE < -10 || sy > h + 10) continue;

      drawTile(ctx, sx, sy, tile, tx, ty, frame, riftsIntensity, strayWoke, roomData);
    }
  }

  // Draw NPCs
  if (npcs) {
    for (const npc of npcs) {
      const nx = npc.worldX - camX;
      const ny = npc.worldY - camY;
      drawNPC(ctx, nx, ny, npc, frame);
    }
  }

  // Draw interactive objects
  if (objects) {
    for (const obj of objects) {
      const ox = obj.x - camX;
      const oy = obj.y - camY;
      drawObject(ctx, ox, oy, obj, frame);
    }
  }

  // Draw player
  const px = player.x - camX;
  const py = player.y - camY;
  drawPlayer(ctx, px, py, player, frame);

  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  for (let sy2 = 0; sy2 < h; sy2 += 3) {
    ctx.fillRect(0, sy2, w, 1);
  }

  // Vignette
  if (!gameEnding) {
    const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawTile(ctx, x, y, tile, tx, ty, frame, rifts, strayWoke, room) {
  const pal = PALETTES[room.id] || PALETTES.bridge;

  if (tile === T.VOID) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, TILE, TILE);
    return;
  }

  // Floor
  const isDark = (tx + ty) % 2 === 0;
  ctx.fillStyle = isDark ? pal.floor : pal.floorAlt;
  ctx.fillRect(x, y, TILE, TILE);

  // Tile-specific decorations
  switch (tile) {
    case T.WALL:
      ctx.fillStyle = pal.wall;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = pal.wallAccent;
      ctx.fillRect(x, y, TILE, 2);
      ctx.fillRect(x, y + TILE - 2, TILE, 2);
      break;
    case T.CONSOLE:
      ctx.fillStyle = '#2D0E52';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = pal.light;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      // Screen glow
      ctx.fillStyle = pal.light;
      ctx.globalAlpha = 0.2 + Math.sin(frame * 0.05 + tx) * 0.1;
      ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
      ctx.globalAlpha = 1;
      break;
    case T.HATCH:
      ctx.fillStyle = '#1a0a3e';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = pal.light;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = pal.light;
      ctx.globalAlpha = 0.4 + Math.sin(frame * 0.03) * 0.2;
      ctx.fillRect(x + 10, y + 8, 12, 16);
      ctx.globalAlpha = 1;
      break;
    case T.CORE_POD: {
      ctx.fillStyle = '#0D0020';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
      ctx.fillStyle = pal.light;
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.04 + tx) * 0.2;
      ctx.fillRect(x + 8, y + 8, TILE - 16, TILE - 16);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#00C8FF';
      ctx.fillRect(x + 12, y + 12, 8, 8);
      break;
    }
    case T.RIFT: {
      ctx.fillStyle = '#0A0014';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#FF00FF';
      ctx.globalAlpha = 0.08 + Math.sin(frame * 0.03 + tx) * 0.05;
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.globalAlpha = 1;
      // Crack effect
      const intensity = rifts > 30 ? 2 : 1;
      for (let i = 0; i < intensity; i++) {
        ctx.strokeStyle = '#FF00FF';
        ctx.globalAlpha = 0.15;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 8 + Math.random() * 16, y + 8 + Math.random() * 16);
        ctx.lineTo(x + Math.random() * 32, y + Math.random() * 32);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      break;
    }
    case T.PORTAL:
      ctx.fillStyle = '#0A0014';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = pal.light;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4 + Math.sin(frame * 0.03) * 0.2;
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 16, 12, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#00C8FF';
      ctx.globalAlpha = 0.08;
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 16, 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    case T.WORM:
      ctx.fillStyle = '#1a0a2e';
      ctx.fillRect(x, y, TILE, TILE);
      break;
    case T.STRAY:
      ctx.fillStyle = '#0A0014';
      ctx.fillRect(x, y, TILE, TILE);
      break;
    case T.DOOR:
      ctx.fillStyle = '#1a0a3e';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#4B1A8C';
      ctx.fillRect(x + 14, y + 4, 4, 24);
      ctx.strokeStyle = pal.light;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      break;
    case T.PIPE:
      ctx.fillStyle = '#1a0533';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#2D0E52';
      ctx.fillRect(x + 6, y + 2, TILE - 12, TILE - 4);
      ctx.fillStyle = '#4B1A8C';
      ctx.fillRect(x + 4, y + 4, TILE - 8, 3);
      break;
    case T.CRATE:
      ctx.fillStyle = '#2D0E52';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = '#4B1A8C';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = '#4B1A8C';
      ctx.fillRect(x + 8, y, 16, TILE);
      ctx.fillRect(x, y + 8, TILE, 16);
      break;
  }
}

function drawPlayer(ctx, x, y, player, frame) {
  const walkCycle = player.walking ? Math.sin(frame * 0.2) * 2 : 0;
  const bobY = player.walking ? Math.abs(Math.sin(frame * 0.15)) * 2 : 0;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x - 8, y + 16, 16, 4);

  const dir = player.dir || 0;

  // Body
  ctx.fillStyle = '#1a0a3e';
  ctx.fillRect(x - 6, y - 8 + bobY, 12, 18);

  // Head
  ctx.fillStyle = '#2D0E52';
  ctx.fillRect(x - 5, y - 16 + bobY, 10, 10);

  // Hair / helmet
  ctx.fillStyle = '#0A0014';
  ctx.fillRect(x - 6, y - 20 + bobY, 12, 5);

  // Eyes (face direction)
  ctx.fillStyle = '#00C8FF';
  if (dir === 0) { // down
    ctx.fillRect(x - 4, y - 12 + bobY, 3, 3);
    ctx.fillRect(x + 1, y - 12 + bobY, 3, 3);
  } else if (dir === 1) { // up
    ctx.fillRect(x - 4, y - 14 + bobY, 3, 2);
    ctx.fillRect(x + 1, y - 14 + bobY, 3, 2);
  } else { // side
    ctx.fillRect(x - 3, y - 13 + bobY, 2, 3);
    ctx.fillRect(x + 1, y - 13 + bobY, 2, 3);
  }

  // Walk animation legs
  if (player.walking) {
    ctx.fillStyle = '#0A0014';
    ctx.fillRect(x - 5 + walkCycle, y + 8 + bobY, 4, 6);
    ctx.fillRect(x + 1 - walkCycle, y + 8 + bobY, 4, 6);
  } else {
    ctx.fillStyle = '#0A0014';
    ctx.fillRect(x - 5, y + 8, 4, 6);
    ctx.fillRect(x + 1, y + 8, 4, 6);
  }
}

function drawNPC(ctx, x, y, npc, frame) {
  const bobY = Math.sin(frame * 0.06 + npc.seed) * 1.5;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x - 8, y + 14, 16, 4);

  if (npc.type === 'glaze') {
    // Body
    ctx.fillStyle = '#1a0a3e';
    ctx.fillRect(x - 7, y - 10 + bobY, 14, 20);
    // Head
    ctx.fillStyle = '#2D0E52';
    ctx.fillRect(x - 5, y - 18 + bobY, 10, 10);
    // Hat
    ctx.fillStyle = '#0A0014';
    ctx.fillRect(x - 7, y - 24 + bobY, 14, 6);
    ctx.fillRect(x - 3, y - 28 + bobY, 6, 4);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - 1, y - 26 + bobY, 2, 2);
    // Eyes based on mood
    const moodColor = npc.moodColor || '#00C8FF';
    ctx.fillStyle = moodColor;
    if (npc.mood === 'terrified') {
      ctx.fillRect(x - 4, y - 15 + bobY, 3, 4);
      ctx.fillRect(x + 1, y - 15 + bobY, 3, 4);
    } else if (npc.mood === 'nervous') {
      ctx.fillRect(x - 4, y - 16 + bobY, 3, 3);
      ctx.fillRect(x + 1, y - 16 + bobY, 3, 3);
    } else if (npc.mood === 'smug') {
      ctx.fillRect(x - 4, y - 16 + bobY, 3, 2);
      ctx.fillRect(x + 1, y - 16 + bobY, 3, 2);
    } else {
      ctx.fillRect(x - 4, y - 16 + bobY, 3, 3);
      ctx.fillRect(x + 1, y - 16 + bobY, 3, 3);
      // Blink
      if (frame % 120 < 4) {
        ctx.fillStyle = '#0A0014';
        ctx.fillRect(x - 4, y - 16 + bobY, 3, 1);
        ctx.fillRect(x + 1, y - 16 + bobY, 3, 1);
      }
    }
    // Name tag
    ctx.fillStyle = '#00C8FF';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('GLAZE', x - 18, y + 30);
  } else if (npc.type === 'stray') {
    // Cat body
    ctx.fillStyle = npc.awake ? '#2D0E52' : '#1a0533';
    ctx.fillRect(x - 8, y - 6 + bobY, 16, 12);
    // Head
    ctx.fillRect(x - 6, y - 12 + bobY, 12, 8);
    // Ears
    ctx.fillRect(x - 8, y - 16 + bobY, 5, 6);
    ctx.fillRect(x + 3, y - 16 + bobY, 5, 6);
    if (npc.awake) {
      // Angry eyes
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(x - 5, y - 9 + bobY, 3, 3);
      ctx.fillRect(x + 2, y - 9 + bobY, 3, 3);
      ctx.fillStyle = 'white';
      ctx.fillRect(x - 4, y - 8 + bobY, 1, 1);
      ctx.fillRect(x + 3, y - 8 + bobY, 1, 1);
      ctx.fillStyle = '#FF4444';
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.fillText('!', x + 12, y - 6 + bobY);
    } else {
      // Sleeping eyes
      ctx.fillStyle = '#0A0014';
      ctx.fillRect(x - 5, y - 8 + bobY, 3, 1);
      ctx.fillRect(x + 2, y - 8 + bobY, 3, 1);
      ctx.fillStyle = '#00C8FF';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.fillText('Zzz', x + 14, y - 2 + bobY);
    }
  } else if (npc.type === 'vermious') {
    // Worm body segments
    for (let i = 5; i >= 0; i--) {
      const segX = x - i * 8 + Math.sin(frame * 0.02 + i * 0.7 + npc.seed) * 3;
      const segY = y + Math.sin(frame * 0.03 + i * 0.5 + npc.seed) * 2;
      ctx.fillStyle = i === 0 ? '#4B1A8C' : '#2D0E52';
      ctx.fillRect(segX - 5, segY - 6 + bobY, 10, 12);
      ctx.strokeStyle = '#6B2FAF';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(segX - 5, segY - 6 + bobY, 10, 12);
    }
    // Head
    ctx.fillStyle = '#4B1A8C';
    ctx.fillRect(x - 7, y - 9 + bobY, 14, 16);
    ctx.strokeStyle = '#6B2FAF';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 7, y - 9 + bobY, 14, 16);
    // Eyes
    ctx.fillStyle = '#00FF88';
    ctx.globalAlpha = 0.6 + Math.sin(frame * 0.05) * 0.3;
    ctx.fillRect(x - 5, y - 5 + bobY, 4, 4);
    ctx.fillRect(x + 1, y - 5 + bobY, 4, 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#00FF88';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('VERM', x - 18, y + 24);
  }
}

function drawObject(ctx, x, y, obj, frame) {
  // Interaction indicators
  const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7;
  ctx.fillStyle = '#00C8FF';
  ctx.globalAlpha = 0.15 * pulse;
  ctx.beginPath();
  ctx.arc(x + 16, y + 16, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

const PALETTES = {
  bridge: { floor: '#1a0a3e', floorAlt: '#150834', wall: '#2D0E52', wallAccent: '#3a1a6e', accent: '#4B1A8C', light: '#00C8FF', danger: '#FF4444' },
  glazing_bay: { floor: '#0D0020', floorAlt: '#0a001a', wall: '#1a0533', wallAccent: '#2D0E52', accent: '#6B2FAF', light: '#00C8FF', danger: '#FF4444' },
  maw: { floor: '#0A0014', floorAlt: '#080010', wall: '#1a0a2e', wallAccent: '#2D0E52', accent: '#FF00FF', light: '#00FF88', danger: '#FF4444' },
};
