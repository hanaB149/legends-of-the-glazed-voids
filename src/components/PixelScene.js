import { T } from '../data/rooms.js';

const TILE = 32;

const PALETTES = {
  bridge: {
    floor: '#2a1050', floorAlt: '#351860', wall: '#4B1A8C', wallAccent: '#6B2FAF',
    accent: '#7B3FBF', light: '#00C8FF', warm: '#FFD700', danger: '#FF4444',
    shadow: '#1a0840', metal: '#3a2060',
  },
  glazing_bay: {
    floor: '#1a0850', floorAlt: '#221060', wall: '#3a1870', wallAccent: '#5B2FAF',
    accent: '#8B5FCF', light: '#00C8FF', warm: '#FFD700', danger: '#FF4444',
    shadow: '#100540', metal: '#2a1060',
  },
  maw: {
    floor: '#1a0530', floorAlt: '#220840', wall: '#3a1060', wallAccent: '#5B2FAF',
    accent: '#FF00FF', light: '#00FF88', warm: '#FFAA00', danger: '#FF4444',
    shadow: '#0a0020', metal: '#2a0840',
  },
};

export function renderGame(ctx, w, h, roomData, player, npcs, objects, riftsIntensity, frame, strayWoke, gameEnding) {
  const camX = player.x - w / 2 + TILE / 2;
  const camY = player.y - h / 2 + TILE / 2;

  ctx.fillStyle = '#050010';
  ctx.fillRect(0, 0, w, h);

  const map = roomData.map;
  const rows = map.length;
  const cols = map[0].length;
  const pal = PALETTES[roomData.id] || PALETTES.bridge;

  // Draw floor first
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const tile = map[ty][tx];
      const sx = tx * TILE - camX;
      const sy = ty * TILE - camY;
      if (sx + TILE < -10 || sx > w + 10 || sy + TILE < -10 || sy > h + 10) continue;

      if (tile === T.VOID) {
        ctx.fillStyle = '#050010';
        ctx.fillRect(sx, sy, TILE, TILE);
        continue;
      }

      const isDark = (tx + ty) % 2 === 0;
      ctx.fillStyle = isDark ? pal.floor : pal.floorAlt;
      ctx.fillRect(sx, sy, TILE, TILE);
    }
  }

  // Draw walls and objects (sorted by y for depth)
  const drawItems = [];
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const tile = map[ty][tx];
      if (tile === T.VOID || tile === T.FLOOR) continue;
      const sx = tx * TILE - camX;
      const sy = ty * TILE - camY;
      if (sx + TILE < -10 || sx > w + 10 || sy + TILE < -10 || sy > h + 10) continue;
      drawItems.push({ tile, sx, sy, tx, ty });
    }
  }
  drawItems.sort((a, b) => a.ty - b.ty);

  for (const item of drawItems) {
    drawTileDetail(ctx, item.sx, item.sy, item.tile, item.tx, item.ty, frame, riftsIntensity, strayWoke, pal, roomData);
  }

  // Draw interactive objects
  if (objects) {
    for (const obj of objects) {
      const ox = obj.x - camX;
      const oy = obj.y - camY;
      if (ox + TILE < -10 || ox > w + 10 || oy + TILE < -10 || oy > h + 10) continue;
      drawObject(ctx, ox, oy, obj, frame, pal);
    }
  }

  // Draw NPCs
  if (npcs) {
    for (const npc of npcs) {
      const nx = npc.worldX - camX;
      const ny = npc.worldY - camY;
      if (nx + TILE < -10 || nx > w + 10 || ny + TILE < -10 || ny > h + 10) continue;
      drawNPC(ctx, nx, ny, npc, frame, pal);
    }
  }

  // Draw player
  const px = player.x - camX;
  const py = player.y - camY;
  drawPlayer(ctx, px, py, player, frame, pal);

  // Draw floor labels
  if (roomData.labels) {
    for (const label of roomData.labels) {
      const lx = label.x * TILE + TILE / 2 - camX;
      const ly = label.y * TILE + TILE + 4 - camY;
      if (lx < -50 || lx > w + 50 || ly < -50 || ly > h + 50) continue;
      drawLabel(ctx, lx, ly, label.text, label.color, frame);
    }
  }

  // Scanlines light
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  for (let sy = 0; sy < h; sy += 3) {
    ctx.fillRect(0, sy, w, 1);
  }

  if (!gameEnding) {
    const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawTileDetail(ctx, x, y, tile, tx, ty, frame, rifts, strayWoke, pal, room) {
  switch (tile) {
    case T.WALL:
      ctx.fillStyle = pal.wall;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = pal.wallAccent;
      ctx.fillRect(x, y, TILE, 2);
      ctx.fillRect(x, y + TILE - 2, TILE, 2);
      // Rivet pattern
      ctx.fillStyle = pal.shadow;
      ctx.fillRect(x + 4, y + 4, 2, 2);
      ctx.fillRect(x + TILE - 6, y + 4, 2, 2);
      ctx.fillRect(x + 4, y + TILE - 6, 2, 2);
      ctx.fillRect(x + TILE - 6, y + TILE - 6, 2, 2);
      break;

    case T.CONSOLE:
      ctx.fillStyle = pal.metal;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      // Screen
      ctx.fillStyle = pal.light;
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.05 + tx) * 0.15;
      ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
      ctx.globalAlpha = 1;
      // Buttons
      ctx.fillStyle = pal.danger;
      ctx.fillRect(x + 6, y + 6, 3, 3);
      ctx.fillStyle = pal.warm;
      ctx.fillRect(x + 12, y + 6, 3, 3);
      ctx.fillStyle = pal.light;
      ctx.fillRect(x + 18, y + 6, 3, 3);
      // Label
      ctx.fillStyle = 'rgba(0,200,255,0.15)';
      ctx.font = '4px "Press Start 2P", monospace';
      ctx.fillText('CONSOLE', x + 1, y + TILE - 3);
      break;

    case T.HATCH:
      ctx.fillStyle = '#1a0a3e';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = pal.metal;
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      // Door frame
      ctx.strokeStyle = pal.light;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      // Window
      ctx.fillStyle = pal.light;
      ctx.globalAlpha = 0.4 + Math.sin(frame * 0.04) * 0.2;
      ctx.fillRect(x + 8, y + 6, TILE - 16, TILE - 12);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,200,255,0.08)';
      ctx.fillRect(x + 8, y + 6, TILE - 16, TILE - 12);
      // Handle
      ctx.fillStyle = pal.warm;
      ctx.fillRect(x + TILE - 8, y + TILE / 2 - 4, 4, 8);
      break;

    case T.CORE_POD: {
      const glow = 0.3 + Math.sin(frame * 0.04 + tx * 2) * 0.2;
      ctx.fillStyle = pal.shadow;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = pal.metal;
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      // Core glow
      ctx.fillStyle = pal.light;
      ctx.globalAlpha = glow;
      ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 12);
      ctx.globalAlpha = 1;
      // Inner core
      ctx.fillStyle = '#00C8FF';
      ctx.fillRect(x + 10, y + 10, TILE - 20, TILE - 20);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(x + 13, y + 13, TILE - 26, TILE - 26);
      break;
    }

    case T.RIFT: {
      ctx.fillStyle = '#0D0020';
      ctx.fillRect(x, y, TILE, TILE);
      // Rift glow
      ctx.fillStyle = '#FF00FF';
      ctx.globalAlpha = 0.12 + Math.sin(frame * 0.03 + tx) * 0.06;
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.globalAlpha = 1;
      // Crack lines
      ctx.strokeStyle = '#FF44FF';
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 10 + Math.sin(frame * 0.05 + i) * 6, y + 8 + i * 8);
        ctx.lineTo(x + 20 + Math.cos(frame * 0.04 + i) * 6, y + 20 + i * 4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Border glow
      ctx.strokeStyle = '#FF00FF';
      ctx.globalAlpha = 0.2 + Math.sin(frame * 0.04) * 0.1;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
      ctx.globalAlpha = 1;
      break;
    }

    case T.PORTAL:
      ctx.fillStyle = '#0D0020';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = pal.light;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.03) * 0.2;
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 16, 12, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#00C8FF';
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 16, 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Swirl
      ctx.strokeStyle = '#44DDFF';
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 6 + i * 4, frame * 0.02 + i * 2, frame * 0.02 + i * 2 + 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;

    case T.DOOR:
      ctx.fillStyle = '#1a0a3e';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = pal.metal;
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.strokeStyle = pal.light;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      ctx.fillStyle = pal.light;
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.04) * 0.15;
      ctx.fillRect(x + 12, y + 4, 8, TILE - 8);
      ctx.globalAlpha = 1;
      break;

    case T.PIPE:
      ctx.fillStyle = pal.shadow;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = pal.metal;
      ctx.fillRect(x + 4, y + 2, TILE - 8, TILE - 4);
      ctx.fillStyle = pal.accent;
      for (let px = 6; px < TILE - 4; px += 8) {
        ctx.fillRect(x + px, y + 4, 4, TILE - 8);
      }
      ctx.fillStyle = '#FFAA00';
      ctx.globalAlpha = 0.1;
      ctx.fillRect(x + 4, y + 2, TILE - 8, TILE - 4);
      ctx.globalAlpha = 1;
      break;

    case T.CRATE:
      ctx.fillStyle = '#2D0E52';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      // Cross pattern
      ctx.fillStyle = pal.accent;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x + 8, y, TILE - 16, TILE);
      ctx.fillRect(x, y + 8, TILE, TILE - 16);
      ctx.globalAlpha = 1;
      break;

    case T.PILLAR:
      ctx.fillStyle = pal.metal;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(x + 4, y, TILE - 8, TILE);
      ctx.fillStyle = pal.wall;
      ctx.fillRect(x + 8, y, TILE - 16, TILE);
      // Glow line
      ctx.fillStyle = pal.light;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(x + 14, y + 4, 4, TILE - 8);
      ctx.globalAlpha = 1;
      break;

    case T.SCREEN:
      ctx.fillStyle = pal.shadow;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#0D0020';
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.strokeStyle = pal.light;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      // Screen content
      const screenData = Math.sin(frame * 0.03) > 0 ? pal.light : pal.danger;
      ctx.fillStyle = screenData;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
      ctx.globalAlpha = 1;
      // Text lines
      ctx.fillStyle = pal.light;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x + 6, y + 8, TILE - 16, 2);
      ctx.fillRect(x + 6, y + 14, TILE - 22, 2);
      ctx.fillRect(x + 6, y + 20, TILE - 12, 2);
      ctx.globalAlpha = 1;
      break;

    case T.PANEL:
      ctx.fillStyle = pal.metal;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = pal.shadow;
      ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
      ctx.strokeStyle = pal.light;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
      ctx.fillStyle = pal.light;
      ctx.globalAlpha = 0.05;
      ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
      ctx.globalAlpha = 1;
      break;

    case T.VENT:
      ctx.fillStyle = pal.shadow;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = pal.metal;
      ctx.fillRect(x + 2, y + 4, TILE - 4, TILE - 8);
      for (let vx = 4; vx < TILE - 4; vx += 6) {
        ctx.fillStyle = pal.shadow;
        ctx.fillRect(x + vx, y + 6, 3, TILE - 12);
      }
      break;

    case T.CHAIR:
      ctx.fillStyle = pal.metal;
      ctx.fillRect(x + 6, y + 10, TILE - 12, TILE - 10);
      ctx.fillRect(x + 8, y + 4, TILE - 16, 8);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(x + 10, y + 6, TILE - 20, 4);
      break;

    case T.TABLE:
      ctx.fillStyle = pal.metal;
      ctx.fillRect(x + 2, y + TILE - 6, TILE - 4, 4);
      ctx.fillRect(x + 4, y + TILE / 2, TILE - 8, TILE / 2 - 6);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(x + 4, y + TILE / 2, TILE - 8, 2);
      break;

    case T.WIRES:
      ctx.fillStyle = pal.shadow;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = '#FFAA00';
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.quadraticCurveTo(x + 16, y + 20, x + TILE - 4, y + 12);
      ctx.stroke();
      ctx.strokeStyle = '#00C8FF';
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 8);
      ctx.quadraticCurveTo(x + 20, y + 24, x + TILE - 6, y + 20);
      ctx.stroke();
      ctx.globalAlpha = 1;
      break;

    case T.GLOW_TILE:
      ctx.fillStyle = pal.light;
      ctx.globalAlpha = 0.08 + Math.sin(frame * 0.04 + tx) * 0.04;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.globalAlpha = 1;
      break;

    case T.CRYSTAL:
      ctx.fillStyle = pal.shadow;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#FF00FF';
      ctx.globalAlpha = 0.15 + Math.sin(frame * 0.05 + tx) * 0.08;
      // Crystal shape
      ctx.beginPath();
      ctx.moveTo(x + 16, y + 4);
      ctx.lineTo(x + 8, y + TILE - 8);
      ctx.lineTo(x + 24, y + TILE - 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FF44FF';
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(x + 16, y + 8);
      ctx.lineTo(x + 11, y + TILE - 12);
      ctx.lineTo(x + 21, y + TILE - 12);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      break;

    case T.PEDESTAL:
      ctx.fillStyle = pal.metal;
      ctx.fillRect(x + 4, y + 12, TILE - 8, TILE - 12);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(x + 6, y + 14, TILE - 12, TILE - 16);
      ctx.fillStyle = pal.light;
      ctx.globalAlpha = 0.2 + Math.sin(frame * 0.05) * 0.1;
      ctx.fillRect(x + 10, y + 16, TILE - 20, TILE - 20);
      ctx.globalAlpha = 1;
      break;

    case T.MONITOR:
      ctx.fillStyle = pal.shadow;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#0D0020';
      ctx.fillRect(x + 2, y + 4, TILE - 4, TILE - 8);
      ctx.strokeStyle = pal.light;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 2, y + 4, TILE - 4, TILE - 8);
      ctx.fillStyle = pal.light;
      ctx.globalAlpha = 0.2 + Math.sin(frame * 0.06) * 0.1;
      ctx.fillRect(x + 5, y + 7, TILE - 10, TILE - 14);
      ctx.globalAlpha = 1;
      ctx.fillStyle = pal.metal;
      ctx.fillRect(x + 6, y + TILE - 4, TILE - 12, 3);
      break;

    case T.CABLE:
      ctx.fillStyle = pal.shadow;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = '#FF6600';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 16);
      ctx.quadraticCurveTo(x + 8, y + 8, x + 16, y + 16);
      ctx.quadraticCurveTo(x + 24, y + 24, x + 32, y + 12);
      ctx.stroke();
      ctx.strokeStyle = '#00C8FF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + 18);
      ctx.quadraticCurveTo(x + 8, y + 10, x + 16, y + 18);
      ctx.quadraticCurveTo(x + 24, y + 26, x + 32, y + 14);
      ctx.stroke();
      break;

    case T.LIGHT:
      ctx.fillStyle = pal.shadow;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#FFD700';
      ctx.globalAlpha = 0.4 + Math.sin(frame * 0.07) * 0.15;
      ctx.fillRect(x + 10, y + 4, TILE - 20, TILE - 8);
      ctx.fillStyle = '#FFEE88';
      ctx.globalAlpha = 0.6 + Math.sin(frame * 0.07) * 0.2;
      ctx.fillRect(x + 13, y + 6, TILE - 26, TILE - 12);
      ctx.globalAlpha = 1;
      break;
  }
}

function drawPlayer(ctx, x, y, player, frame, pal) {
  const bobY = player.walking ? Math.abs(Math.sin(frame * 0.15)) * 2 : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x - 8, y + 18, 16, 4);

  // Suit
  ctx.fillStyle = '#2a1060';
  ctx.fillRect(x - 7, y - 8 + bobY, 14, 18);
  ctx.fillStyle = '#3a2070';
  ctx.fillRect(x - 6, y - 6 + bobY, 12, 14);

  // Helmet
  ctx.fillStyle = '#4B1A8C';
  ctx.fillRect(x - 6, y - 18 + bobY, 12, 12);
  ctx.strokeStyle = pal.light;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x - 6, y - 18 + bobY, 12, 12);

  // Visor
  ctx.fillStyle = pal.light;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(x - 4, y - 16 + bobY, 8, 4);
  ctx.globalAlpha = 1;

  // Eyes
  ctx.fillStyle = '#00C8FF';
  ctx.fillRect(x - 4, y - 14 + bobY, 3, 2);
  ctx.fillRect(x + 1, y - 14 + bobY, 3, 2);

  // Blink
  if (frame % 100 < 4) {
    ctx.fillStyle = '#0A0014';
    ctx.fillRect(x - 4, y - 14 + bobY, 3, 1);
    ctx.fillRect(x + 1, y - 14 + bobY, 3, 1);
  }

  // Shoulder pads
  ctx.fillStyle = '#4B1A8C';
  ctx.fillRect(x - 9, y - 6 + bobY, 4, 8);
  ctx.fillRect(x + 5, y - 6 + bobY, 4, 8);

  // Legs
  if (player.walking) {
    const swing = Math.sin(frame * 0.2) * 3;
    ctx.fillStyle = '#1a0840';
    ctx.fillRect(x - 6 + swing, y + 8 + bobY, 5, 7);
    ctx.fillRect(x + 1 - swing, y + 8 + bobY, 5, 7);
  } else {
    ctx.fillStyle = '#1a0840';
    ctx.fillRect(x - 6, y + 8, 5, 7);
    ctx.fillRect(x + 1, y + 8, 5, 7);
  }

  // Boots
  ctx.fillStyle = '#0A0014';
  ctx.fillRect(x - 7, y + 14 + (player.walking ? swing * 0.5 : 0), 7, 3);
  ctx.fillRect(x, y + 14 + (player.walking ? -swing * 0.5 : 0), 7, 3);
}

function drawNPC(ctx, x, y, npc, frame, pal) {
  const bobY = Math.sin(frame * 0.06 + npc.seed) * 1.5;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x - 9, y + 16, 18, 4);

  if (npc.type === 'glaze') {
    // Body
    ctx.fillStyle = '#1a0a3e';
    ctx.fillRect(x - 8, y - 10 + bobY, 16, 22);
    ctx.fillStyle = '#2D0E52';
    ctx.fillRect(x - 7, y - 8 + bobY, 14, 18);

    // Shoulder pads (captain's epaulettes)
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - 10, y - 6 + bobY, 3, 6);
    ctx.fillRect(x + 7, y - 6 + bobY, 3, 6);

    // Head
    ctx.fillStyle = '#2D0E52';
    ctx.fillRect(x - 6, y - 19 + bobY, 12, 11);
    ctx.strokeStyle = '#4B1A8C';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x - 6, y - 19 + bobY, 12, 11);

    // Captain's hat
    ctx.fillStyle = '#0A0014';
    ctx.fillRect(x - 8, y - 26 + bobY, 16, 8);
    ctx.fillRect(x - 4, y - 30 + bobY, 8, 5);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - 2, y - 28 + bobY, 4, 3);

    // Eyes
    ctx.fillStyle = npc.moodColor || '#00C8FF';
    if (npc.mood === 'terrified') {
      ctx.fillRect(x - 5, y - 16 + bobY, 3, 4);
      ctx.fillRect(x + 2, y - 16 + bobY, 3, 4);
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(x - 5, y - 18 + bobY, 3, 1);
      ctx.fillRect(x + 2, y - 18 + bobY, 3, 1);
    } else if (npc.mood === 'nervous') {
      ctx.fillRect(x - 5, y - 17 + bobY, 3, 3);
      ctx.fillRect(x + 2, y - 17 + bobY, 3, 3);
    } else if (npc.mood === 'smug') {
      ctx.fillRect(x - 5, y - 18 + bobY, 3, 2);
      ctx.fillRect(x + 2, y - 18 + bobY, 3, 2);
      ctx.fillStyle = '#6B2FAF';
      ctx.fillRect(x - 2, y - 15 + bobY, 4, 1);
    } else {
      ctx.fillRect(x - 5, y - 17 + bobY, 3, 3);
      ctx.fillRect(x + 2, y - 17 + bobY, 3, 3);
      if (frame % 120 < 4) {
        ctx.fillStyle = '#0A0014';
        ctx.fillRect(x - 5, y - 17 + bobY, 3, 1);
        ctx.fillRect(x + 2, y - 17 + bobY, 3, 1);
      }
    }

    // Mouth
    if (npc.mood === 'pleased' || npc.mood === 'triumphant') {
      ctx.fillStyle = '#6B2FAF';
      ctx.fillRect(x - 3, y - 13 + bobY, 6, 2);
    } else if (npc.mood === 'terrified') {
      ctx.fillStyle = '#0A0014';
      ctx.fillRect(x - 4, y - 13 + bobY, 8, 3);
    } else {
      ctx.fillStyle = '#4B1A8C';
      ctx.fillRect(x - 3, y - 13 + bobY, 6, 1);
    }

    // NPC name tag
    drawLabel(ctx, x, y + 22, 'GLAZE', '#44FF88', frame);
  }

  else if (npc.type === 'stray') {
    ctx.fillStyle = npc.awake ? '#2D0E52' : '#1a0840';
    ctx.fillRect(x - 9, y - 8 + bobY, 18, 14);
    ctx.fillStyle = npc.awake ? '#3a1a6e' : '#2a1050';
    ctx.fillRect(x - 7, y - 14 + bobY, 14, 10);

    // Ears
    ctx.fillRect(x - 9, y - 18 + bobY, 6, 8);
    ctx.fillRect(x + 3, y - 18 + bobY, 6, 8);

    // Eyes
    if (npc.awake) {
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(x - 6, y - 11 + bobY, 4, 4);
      ctx.fillRect(x + 2, y - 11 + bobY, 4, 4);
      ctx.fillStyle = 'white';
      ctx.fillRect(x - 5, y - 10 + bobY, 1, 1);
      ctx.fillRect(x + 3, y - 10 + bobY, 1, 1);
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(x - 5, y - 6 + bobY, 3, 2);
      ctx.fillRect(x + 2, y - 6 + bobY, 3, 2);
    } else {
      ctx.fillStyle = '#0A0014';
      ctx.fillRect(x - 6, y - 10 + bobY, 4, 1);
      ctx.fillRect(x + 2, y - 10 + bobY, 4, 1);
      ctx.fillStyle = '#00C8FF';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.fillText('Zzz', x + 16, y - 4 + bobY);
    }

    // Tail
    ctx.strokeStyle = npc.awake ? '#3a1a6e' : '#2a1050';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 9, y - 4 + bobY);
    ctx.quadraticCurveTo(x + 18, y - 12 + bobY, x + 14, y - 4 + bobY);
    ctx.stroke();
  }

  else if (npc.type === 'vermious') {
    // Body segments
    for (let i = 5; i >= 0; i--) {
      const segX = x - i * 10 + Math.sin(frame * 0.025 + i * 0.7 + npc.seed) * 4;
      const segY = y + Math.sin(frame * 0.03 + i * 0.5 + npc.seed) * 3;
      ctx.fillStyle = i === 0 ? '#5B2FAF' : '#3a1a6e';
      ctx.fillRect(segX - 6, segY - 7 + bobY, 12, 14);
      ctx.strokeStyle = '#7B4FCF';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(segX - 6, segY - 7 + bobY, 12, 14);
      // Segment detail
      ctx.fillStyle = '#4B1A8C';
      ctx.fillRect(segX - 4, segY - 5 + bobY, 8, 2);
    }
    // Head
    const headX = x + Math.sin(frame * 0.025 + npc.seed) * 4;
    const headY = y + Math.sin(frame * 0.03 + npc.seed) * 3;
    ctx.fillStyle = '#5B2FAF';
    ctx.fillRect(headX - 8, headY - 10 + bobY, 16, 18);
    ctx.strokeStyle = '#8B6FDF';
    ctx.lineWidth = 1;
    ctx.strokeRect(headX - 8, headY - 10 + bobY, 16, 18);
    // Eyes
    ctx.fillStyle = '#00FF88';
    ctx.globalAlpha = 0.6 + Math.sin(frame * 0.06) * 0.3;
    ctx.fillRect(headX - 6, headY - 6 + bobY, 5, 5);
    ctx.fillRect(headX + 1, headY - 6 + bobY, 5, 5);
    ctx.globalAlpha = 1;
    // Pupils
    ctx.fillStyle = '#000000';
    ctx.fillRect(headX - 5, headY - 5 + bobY, 3, 3);
    ctx.fillRect(headX + 2, headY - 5 + bobY, 3, 3);
    // Mouth
    ctx.fillStyle = '#2a1050';
    ctx.fillRect(headX - 4, headY + 2 + bobY, 8, 3);
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(headX - 3, headY + 3 + bobY, 2, 1);
    ctx.fillRect(headX + 1, headY + 3 + bobY, 2, 1);

    drawLabel(ctx, headX - 14, headY + 24 + bobY, 'VERMIOUS', '#00FF88', frame);
  }
}

function drawObject(ctx, x, y, obj, frame, pal) {
  const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7;
  ctx.fillStyle = pal.light;
  ctx.globalAlpha = 0.08 * pulse;
  ctx.beginPath();
  ctx.arc(x + 16, y + 16, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Sparkle
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.2 + Math.sin(frame * 0.08) * 0.15;
  ctx.fillRect(x + 8, y + 8, 3, 3);
  ctx.fillRect(x + 20, y + 12, 2, 2);
  ctx.fillRect(x + 12, y + 22, 3, 3);
  ctx.globalAlpha = 1;
}

function drawLabel(ctx, x, y, text, color, frame) {
  ctx.fillStyle = 'rgba(5,0,16,0.7)';
  const tw = text.length * 5;
  ctx.fillRect(x - tw / 2 - 2, y - 1, tw + 4, 8);

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7 + Math.sin(frame * 0.04) * 0.15;
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y + 6);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}
