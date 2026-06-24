let ctx = null;
let masterGain = null;
let analyser = null;
let bgmInterval = null;
let isPlayingBgm = false;
let bgmVolume = 0.08;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.15;
    masterGain.connect(ctx.destination);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    masterGain.connect(analyser);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playNote(freq, duration, type = 'square', gain = 0.1) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

function playNoise(duration, gain = 0.05) {
  const c = getCtx();
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * duration), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.connect(g);
  g.connect(masterGain);
  src.start(c.currentTime);
}

// Melody notes for BGM (Zelda-inspired)
const BGM_NOTES = [
  // Phrase 1
  { f: 523, d: 0.2 }, { f: 659, d: 0.2 }, { f: 784, d: 0.3 },
  { f: 659, d: 0.15 }, { f: 784, d: 0.2 }, { f: 1047, d: 0.4 },
  // Phrase 2
  { f: 784, d: 0.2 }, { f: 880, d: 0.2 }, { f: 1047, d: 0.3 },
  { f: 880, d: 0.15 }, { f: 784, d: 0.2 }, { f: 659, d: 0.4 },
  // Phrase 3
  { f: 587, d: 0.2 }, { f: 659, d: 0.2 }, { f: 523, d: 0.3 },
  { f: 784, d: 0.2 }, { f: 659, d: 0.2 }, { f: 587, d: 0.3 },
  // Phrase 4 (mysterious)
  { f: 440, d: 0.25 }, { f: 523, d: 0.25 }, { f: 587, d: 0.3 },
  { f: 0, d: 0.1 }, { f: 659, d: 0.4 }, { f: 523, d: 0.4 },
  // Repeat with variation
  { f: 523, d: 0.2 }, { f: 784, d: 0.2 }, { f: 659, d: 0.3 },
  { f: 784, d: 0.15 }, { f: 1047, d: 0.2 }, { f: 1319, d: 0.4 },
  { f: 1047, d: 0.2 }, { f: 880, d: 0.2 }, { f: 1047, d: 0.3 },
  { f: 784, d: 0.15 }, { f: 659, d: 0.2 }, { f: 523, d: 0.4 },
  { f: 659, d: 0.2 }, { f: 523, d: 0.2 }, { f: 440, d: 0.3 },
  { f: 523, d: 0.2 }, { f: 659, d: 0.2 }, { f: 784, d: 0.4 },
];

// Bass line
const BASS_NOTES = [
  { f: 131, d: 0.8 }, { f: 165, d: 0.8 }, { f: 196, d: 0.8 },
  { f: 165, d: 0.4 }, { f: 131, d: 0.4 }, { f: 175, d: 0.8 },
  { f: 165, d: 0.8 }, { f: 131, d: 0.8 }, { f: 196, d: 0.8 },
  { f: 175, d: 0.4 }, { f: 165, d: 0.4 }, { f: 131, d: 1.0 },
];

function playBgmLoop() {
  isPlayingBgm = true;
  let idx = 0;
  let bassIdx = 0;
  let bassTime = 0;

  function step() {
    if (!isPlayingBgm) return;
    const n = BGM_NOTES[idx % BGM_NOTES.length];
    if (n.f > 0) {
      playNote(n.f, n.d * 0.9, 'square', bgmVolume);
      playNote(n.f * 2, n.d * 0.9, 'triangle', bgmVolume * 0.3);
    }
    idx++;

    bassTime += n.d;
    if (bassTime >= BASS_NOTES[bassIdx % BASS_NOTES.length].d || bassIdx === 0) {
      bassTime = 0;
      const bn = BASS_NOTES[bassIdx % BASS_NOTES.length];
      if (bn.f > 0) playNote(bn.f, bn.d * 0.9, 'sawtooth', bgmVolume * 0.5);
      bassIdx++;
    }

    const delay = n.d * 1000;
    bgmInterval = setTimeout(step, delay);
  }
  step();
}

export const Audio = {
  init() { getCtx(); },

  startBGM() {
    if (isPlayingBgm) return;
    playBgmLoop();
  },

  stopBGM() {
    isPlayingBgm = false;
    if (bgmInterval) { clearTimeout(bgmInterval); bgmInterval = null; }
  },

  sfx(sound) {
    const c = getCtx();
    switch (sound) {
      case 'confirm':
        playNote(523, 0.08, 'square', 0.12);
        setTimeout(() => playNote(659, 0.08, 'square', 0.1), 60);
        setTimeout(() => playNote(784, 0.12, 'square', 0.1), 120);
        break;
      case 'refuse':
        playNote(200, 0.1, 'square', 0.1);
        setTimeout(() => playNote(160, 0.15, 'square', 0.08), 100);
        break;
      case 'success':
        playNote(784, 0.08, 'square', 0.12);
        setTimeout(() => playNote(988, 0.08, 'square', 0.1), 80);
        setTimeout(() => playNote(1175, 0.15, 'square', 0.1), 160);
        break;
      case 'bribe':
        playNote(523, 0.05, 'triangle', 0.08);
        setTimeout(() => playNote(659, 0.05, 'triangle', 0.08), 50);
        setTimeout(() => playNote(784, 0.05, 'triangle', 0.08), 100);
        setTimeout(() => playNote(1047, 0.15, 'triangle', 0.1), 150);
        break;
      case 'danger':
        playNote(330, 0.08, 'sawtooth', 0.06);
        setTimeout(() => playNote(262, 0.08, 'sawtooth', 0.06), 100);
        setTimeout(() => playNote(220, 0.1, 'sawtooth', 0.06), 200);
        break;
      case 'move':
        playNote(440, 0.05, 'triangle', 0.06);
        setTimeout(() => playNote(523, 0.05, 'triangle', 0.05), 40);
        break;
      case 'victory':
        [523, 587, 659, 784, 880, 988, 1047, 1319].forEach((f, i) => {
          setTimeout(() => playNote(f, 0.15, 'square', 0.1), i * 80);
        });
        break;
      case 'defeat':
        [400, 350, 300, 250, 200].forEach((f, i) => {
          setTimeout(() => playNote(f, 0.15, 'sawtooth', 0.06), i * 150);
        });
        break;
      case 'secret':
        [784, 988, 1175, 1568, 1568, 1568].forEach((f, i) => {
          setTimeout(() => playNote(f, 0.2, 'triangle', 0.1), i * 120);
        });
        break;
      case 'blip':
        playNote(600 + Math.random() * 400, 0.05, 'square', 0.04);
        break;
      case 'door':
        playNote(200, 0.1, 'sawtooth', 0.05);
        setTimeout(() => playNote(300, 0.1, 'sawtooth', 0.05), 150);
        setTimeout(() => playNote(400, 0.15, 'sawtooth', 0.05), 300);
        break;
      default:
        break;
    }
  },

  getAnalyser() { return analyser; },
};
