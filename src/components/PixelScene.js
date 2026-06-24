// Pixel-art third-person room renderer
// Draws rooms as tile-based isometric-like scenes with sprites

const PIXEL_SCALE = 3;
const TILE = 16; // base tile size in pixels (will be scaled)

// Palettes per room
const PAL = {
  bridge: { floor: '#1a0a3e', wall: '#2D0E52', accent: '#4B1A8C', light: '#00C8FF', danger: '#FF4444', warm: '#FFAA00', dark: '#0A0014' },
  glazing_bay: { floor: '#0D0020', wall: '#1a0533', accent: '#6B2FAF', light: '#00C8FF', danger: '#FF4444', warm: '#FFD700', dark: '#0A0014' },
  maw: { floor: '#0A0014', wall: '#1a0a2e', accent: '#FF00FF', light: '#00FF88', danger: '#FF4444', warm: '#FFAA00', dark: '#000000' },
};

// Sprite data (16x16 pixel art)
// Each sprite is a flat array of hex color values, rendered at PIXEL_SCALE
function createSprite(pixels, w = 16, h = 16) {
  return { pixels, w, h };
}

// Simple creature/sprites drawn as pixel arrays
const SPRITES = {};

function px(hex) {
  const c = parseInt(hex.slice(1), 16);
  return ((c >> 16) & 0xff) / 255 * 0.5 + 0.5; // fake intensity for now
}

export function renderScene(ctx, w, h, room, riftsIntensity, strayWoke, frame) {
  const pal = PAL[room?.id] || PAL.bridge;
  const scale = PIXEL_SCALE;

  ctx.fillStyle = pal.dark;
  ctx.fillRect(0, 0, w, h);

  // Floor tiles
  const tileSize = 32;
  for (let y = 0; y < Math.ceil(h / tileSize) + 1; y++) {
    for (let x = 0; x < Math.ceil(w / tileSize) + 1; x++) {
      const isEven = (x + y) % 2 === 0;
      ctx.fillStyle = isEven ? pal.floor : pal.dark;
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  ctx.save();

  if (room?.id === 'bridge') {
    drawBridge(ctx, w, h, pal, riftsIntensity, frame);
  } else if (room?.id === 'glazing_bay') {
    drawGlazingBay(ctx, w, h, pal, strayWoke, frame);
  } else if (room?.id === 'maw') {
    drawMaw(ctx, w, h, pal, riftsIntensity, frame);
  }

  ctx.restore();

  // Rift overlay
  if (riftsIntensity > 10) {
    for (let i = 0; i < Math.floor(riftsIntensity / 15) + 1; i++) {
      const rx = 50 + Math.random() * (w - 100);
      const ry = 30 + Math.random() * (h - 100);
      drawRiftCrack(ctx, rx, ry, riftsIntensity, frame + i);
    }
  }

  // Scanline overlay
  drawScanlines(ctx, w, h, frame);
}

function drawRect(ctx, x, y, w, h, color, borderColor = null) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }
}

function drawPixelSprite(ctx, pixels, x, y, s = 2) {
  const w = Math.sqrt(pixels.length) | 0;
  if (!w) return;
  for (let i = 0; i < pixels.length; i++) {
    const px2 = i % w;
    const py = Math.floor(i / w);
    if (pixels[i]) {
      ctx.fillStyle = pixels[i];
      ctx.fillRect(x + px2 * s, y + py * s, s, s);
    }
  }
}

function drawGlaze(ctx, x, y, expression, frame) {
  const bobY = Math.sin(frame * 0.08) * 2;

  // Body
  drawRect(ctx, x - 8, y - 12 + bobY, 16, 22, '#1a0a3e', '#4B1A8C');

  // Head
  drawRect(ctx, x - 6, y - 20 + bobY, 12, 10, '#2D0E52', '#4B1A8C');

  // Hat
  drawRect(ctx, x - 8, y - 26 + bobY, 16, 6, '#0A0014', '#4B1A8C');
  drawRect(ctx, x - 4, y - 30 + bobY, 8, 4, '#0A0014', '#4B1A8C');
  drawRect(ctx, x - 2, y - 28 + bobY, 4, 2, '#FFD700'); // gold badge

  // Eyes based on expression
  const eyeY = y - 17 + bobY;
  const eyeOffset = frame % 60 < 3 ? 1 : 0; // blink
  if (expression === 'terrified' || expression === 'nervous') {
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(x - 4, eyeY, 2 + eyeOffset, 2);
    ctx.fillRect(x + 2, eyeY, 2 + eyeOffset, 2);
  } else if (expression === 'smug' || expression === 'suspicious') {
    ctx.fillStyle = '#00C8FF';
    ctx.fillRect(x - 4, eyeY + 1, 2, 1);
    ctx.fillRect(x + 2, eyeY, 2, 1);
  } else if (expression === 'pleased' || expression === 'triumphant') {
    ctx.fillStyle = '#44FF88';
    ctx.fillRect(x - 4, eyeY - 1, 2, 1);
    ctx.fillRect(x + 2, eyeY - 1, 2, 1);
  } else {
    ctx.fillStyle = '#00C8FF';
    ctx.fillRect(x - 4, eyeY, 2, 2);
    ctx.fillRect(x + 2, eyeY, 2, 2);
  }

  // Mouth
  if (expression === 'terrified') {
    ctx.fillStyle = '#4B1A8C';
    ctx.fillRect(x - 2, y - 13 + bobY, 4, 2);
  } else if (expression === 'pleased' || expression === 'triumphant') {
    ctx.fillStyle = '#6B2FAF';
    ctx.fillRect(x - 2, y - 13 + bobY, 4, 1);
  } else if (expression === 'smug') {
    ctx.fillStyle = '#6B2FAF';
    ctx.fillRect(x - 1, y - 13 + bobY, 3, 1);
  } else {
    ctx.fillStyle = '#6B2FAF';
    ctx.fillRect(x - 2, y - 13 + bobY, 4, 1);
  }
}

function drawBridge(ctx, w, h, pal, rifts, frame) {
  // Back wall with console
  const wallH = h * 0.4;
  drawRect(ctx, 0, 0, w, wallH, pal.wall);

  // Console desk
  drawRect(ctx, w * 0.05, wallH - 20, w * 0.9, 40, pal.accent, pal.light);

  // Screens on wall
  for (let i = 0; i < 4; i++) {
    const sx = w * 0.1 + i * (w * 0.23);
    drawRect(ctx, sx, 10, w * 0.18, wallH * 0.4, '#0A0014', pal.light);
    // Screen content
    ctx.fillStyle = i % 2 === 0 ? pal.light : pal.danger;
    ctx.globalAlpha = 0.3 + Math.sin(frame * 0.05 + i) * 0.15;
    ctx.fillRect(sx + 4, 14, w * 0.18 - 8, wallH * 0.4 - 8);
    ctx.globalAlpha = 1;
  }

  // Glaze standing at helm
  drawGlaze(ctx, w * 0.3, h * 0.6, 'nervous', frame);

  // Hatch (right side)
  const hatchX = w * 0.85, hatchY = h * 0.25;
  drawRect(ctx, hatchX, hatchY, 40, 80, '#2D0E52', pal.light);
  drawRect(ctx, hatchX + 2, hatchY + 2, 36, 76, '#1a0a3e');
  ctx.fillStyle = pal.light;
  ctx.globalAlpha = 0.5 + Math.sin(frame * 0.03) * 0.3;
  ctx.fillRect(hatchX + 15, hatchY + 30, 10, 20);
  ctx.globalAlpha = 1;

  // Hatch label
  ctx.fillStyle = pal.light;
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.fillText('HATCH', hatchX - 5, hatchY + 100);

  // Warning text
  ctx.fillStyle = pal.danger;
  ctx.globalAlpha = 0.5 + Math.sin(frame * 0.1) * 0.3;
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText('WARNING: RIFTS', w * 0.05 + 5, wallH + 55);
  ctx.fillText('DETECTED', w * 0.05 + 15, wallH + 65);
  ctx.globalAlpha = 1;
}

function drawGlazingBay(ctx, w, h, pal, strayWoke, frame) {
  const wallH = h * 0.35;
  drawRect(ctx, 0, 0, w, wallH, pal.wall);

  // Glaze Core pods
  for (let i = 0; i < 4; i++) {
    const cx = w * 0.08 + i * (w * 0.24);
    const cy = wallH + 30;
    // Pod base
    drawRect(ctx, cx, cy, 30, 30, '#0A0014', pal.accent);
    // Core glow
    ctx.fillStyle = pal.light;
    ctx.globalAlpha = 0.4 + Math.sin(frame * 0.05 + i * 1.5) * 0.3;
    ctx.fillRect(cx + 5, cy + 5, 20, 20);
    ctx.globalAlpha = 1;
    // Core inner
    ctx.fillStyle = '#00C8FF';
    ctx.fillRect(cx + 9, cy + 9, 12, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(cx + 12, cy + 12, 6, 6);
  }

  // Glaze standing near cores
  drawGlaze(ctx, w * 0.7, h * 0.58, strayWoke ? 'terrified' : 'nervous', frame);

  // Stray cat
  const strayX = w * 0.75, strayY = h * 0.45;
  if (strayWoke) {
    // Angry cat eyes
    ctx.fillStyle = pal.danger;
    ctx.globalAlpha = 0.5 + Math.sin(frame * 0.2) * 0.3;
    ctx.fillRect(strayX, strayY, 16, 12);
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(strayX + 2, strayY + 2, 5, 5);
    ctx.fillRect(strayX + 9, strayY + 2, 5, 5);
    ctx.fillStyle = 'white';
    ctx.fillRect(strayX + 3, strayY + 3, 3, 3);
    ctx.fillRect(strayX + 10, strayY + 3, 3, 3);
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.danger;
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('STRAY!', strayX - 5, strayY + 35);
  } else {
    // Sleeping cat
    ctx.fillStyle = '#4B1A8C';
    ctx.fillRect(strayX, strayY, 16, 10);
    ctx.fillStyle = '#2D0E52';
    ctx.fillRect(strayX + 2, strayY + 2, 12, 6);
    ctx.fillStyle = '#00C8FF';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('Zzz', strayX + 18, strayY + 8);
    ctx.fillStyle = pal.textDim || '#8870A0';
    ctx.fillText('DORMANT', strayX - 5, strayY + 30);
  }
}

function drawMaw(ctx, w, h, pal, rifts, frame) {
  // Giant rift in background
  const riftCX = w * 0.5, riftCY = h * 0.3;
  ctx.fillStyle = '#1a0a2e';
  ctx.beginPath();
  ctx.ellipse(riftCX, riftCY, w * 0.3, h * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rift glow
  ctx.fillStyle = '#FF00FF';
  ctx.globalAlpha = 0.08 + Math.sin(frame * 0.02) * 0.04;
  ctx.beginPath();
  ctx.ellipse(riftCX, riftCY, w * 0.25, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Rift center
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(riftCX, riftCY, w * 0.1, h * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FF00FF';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5 + Math.sin(frame * 0.05) * 0.3;
  ctx.beginPath();
  ctx.ellipse(riftCX, riftCY, w * 0.12, h * 0.17, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Vermious the Glazeworm (bottom left)
  const vx = w * 0.15, vy = h * 0.55;
  // Body segments
  for (let i = 6; i >= 0; i--) {
    const segX = vx + i * 12 + Math.sin(frame * 0.03 + i * 0.5) * 5;
    const segY = vy + Math.sin(frame * 0.04 + i * 0.7) * 3;
    ctx.fillStyle = i === 0 ? '#4B1A8C' : '#2D0E52';
    ctx.fillRect(segX - 6, segY - 8, 12, 15);
    ctx.strokeStyle = '#6B2FAF';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(segX - 6, segY - 8, 12, 15);
  }
  // Head
  const headX = vx + Math.sin(frame * 0.03) * 5;
  const headY = vy + Math.sin(frame * 0.04) * 3;
  ctx.fillStyle = '#4B1A8C';
  ctx.fillRect(headX - 8, headY - 10, 16, 18);
  ctx.strokeStyle = '#6B2FAF';
  ctx.lineWidth = 1;
  ctx.strokeRect(headX - 8, headY - 10, 16, 18);
  // Eyes
  ctx.fillStyle = '#00FF88';
  ctx.globalAlpha = 0.6 + Math.sin(frame * 0.06) * 0.3;
  ctx.fillRect(headX - 5, headY - 6, 4, 4);
  ctx.fillRect(headX + 1, headY - 6, 4, 4);
  ctx.globalAlpha = 1;

  // Portal (right side)
  const px2 = w * 0.8, py2 = h * 0.2;
  ctx.fillStyle = '#0A0014';
  ctx.strokeStyle = pal.light;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5 + Math.sin(frame * 0.03) * 0.2;
  ctx.beginPath();
  ctx.ellipse(px2, py2, 30, 55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#00C8FF';
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  ctx.ellipse(px2, py2, 25, 50, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#00C8FF';
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText('PORTAL', px2 - 18, py2 + 75);

  // Glaze near worm
  drawGlaze(ctx, w * 0.35, h * 0.52, 'terrified', frame);
}

function drawRiftCrack(ctx, x, y, intensity, seed) {
  ctx.strokeStyle = '#FF00FF';
  ctx.globalAlpha = 0.15 + Math.random() * 0.15;
  ctx.lineWidth = 1 + Math.random() * 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i < 3 + (intensity / 20); i++) {
    ctx.lineTo(x + (Math.random() - 0.5) * 40, y + Math.random() * 30);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawScanlines(ctx, w, h, frame) {
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }

  // CRT vignette
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}
