import { useState, useCallback } from 'react';

// ===== AUDIO =====
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;
function getCtx() {
  if (!actx) actx = new AudioCtx();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function note(freq, dur, type = 'square', vol = 0.08) {
  const c = getCtx(), o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
}
function sfx(name) {
  if (name === 'click') note(800, 0.05, 'square', 0.06);
  else if (name === 'pickup') { note(600, 0.06, 'triangle', 0.07); setTimeout(() => note(900, 0.08, 'triangle', 0.07), 60); }
  else if (name === 'success') { note(523, 0.1, 'square', 0.07); setTimeout(() => note(659, 0.1, 'square', 0.07), 100); setTimeout(() => note(784, 0.15, 'square', 0.07), 200); }
  else if (name === 'error') note(200, 0.15, 'sawtooth', 0.05);
  else if (name === 'door') { note(300, 0.1, 'sawtooth', 0.05); setTimeout(() => note(400, 0.15, 'sawtooth', 0.05), 150); }
  else if (name === 'win') { [523, 659, 784, 880, 1047, 1319].forEach((f,i) => setTimeout(() => note(f,0.15,'square',0.08), i*100)); }
  else if (name === 'lose') { [400,350,300,200].forEach((f,i) => setTimeout(() => note(f,0.15,'sawtooth',0.05), i*150)); }
}

// ===== SHUFFLE =====
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ===== ARENA STORAGE =====
const STORAGE_KEY = 'lotgv_arena';
function loadArena() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { totalWins: 0, round: 1, completedPuzzles: [] };
}
function saveArena(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ===== PUZZLE SETS =====
// Each set defines a unique escape room configuration.
// The ROOM_ORDER within each set is fixed, but which set is used
// for a round is randomly chosen (excluding the last-used set).
const PUZZLE_SETS = [
  {
    name: 'CRYSTAL RESONANCE',
    rooms: {
      cockpit: {
        name: 'COCKPIT',
        bg: 'linear-gradient(180deg, #1a0a3a 0%, #2a1050 40%, #3a1a60 100%)',
        desc: 'THE STARS DRIFT BEYOND THE VIEWPORT. A GLOWING CRYSTAL HUMS IN ITS SOCKET.',
        items: [
          { id: 'crystal', name: 'GLOWING CRYSTAL', x: 55, y: 25, w: 14, h: 14, color: '#44DDFF', glow: '#44DDFF', pickup: true, desc: 'A GLOWING CRYSTAL. IT HUMS WITH ENERGY.' },
          { id: 'note', name: 'NOTE', x: 18, y: 55, w: 16, h: 10, color: '#FFD700', pickup: true, desc: '"FUEL CELLS NEED A POWER CRYSTAL. ACTIVATE THE CONSOLE FIRST. — CHIEF ENG."' },
          { id: 'console', name: 'CONSOLE', x: 38, y: 45, w: 24, h: 16, color: '#6a4a9a', interactive: true, desc: 'A DARK CONSOLE. A CRYSTAL-SHAPED SOCKET IS EMPTY.' },
          { id: 'door', name: 'AIRLOCK', x: 82, y: 30, w: 14, h: 30, color: '#8B6FCF', interactive: true, desc: 'THE AIRLOCK IS SEALED. IT NEEDS POWER TO OPEN.' },
        ],
        useCombine: (state, itemId, targetId) => {
          if (itemId === 'crystal' && targetId === 'console') {
            return { success: true, msg: 'YOU SLOT THE CRYSTAL INTO THE CONSOLE. LIGHTS FLICKER ON!', removeItem: 'crystal', setFlag: 'consolePowered' };
          }
          if (itemId === 'crystal' && targetId === 'door') {
            return { success: false, msg: 'THE DOOR NEEDS POWER, NOT JUST A CRYSTAL. TRY THE CONSOLE.' };
          }
          if (targetId === 'door') {
            return { success: false, msg: 'THE AIRLOCK IS SEALED TIGHT. IT NEEDS POWER.' };
          }
          return null;
        },
        onFlag: (flags) => {
          if (flags.consolePowered) {
            return { desc: 'THE CONSOLE IS LIVE! SYSTEMS ONLINE. THE AIRLOCK CAN NOW OPEN.', changed: 'door' };
          }
          return null;
        },
      },
      corridor: {
        name: 'CORRIDOR',
        bg: 'linear-gradient(180deg, #0a0020 0%, #1a0a3a 50%, #2a1050 100%)',
        desc: 'A NARROW CORRIDOR. WARNING LIGHTS FLICKER. A FUEL CELL STORAGE LOCKER STANDS AJAR.',
        items: [
          { id: 'fuelCell', name: 'FUEL CELL', x: 45, y: 40, w: 12, h: 18, color: '#44FF88', glow: '#44FF88', pickup: true, desc: 'A FUEL CELL. IT SLOTS INTO THE ENGINE.' },
          { id: 'locker', name: 'LOCKER', x: 20, y: 35, w: 18, h: 25, color: '#6a4a9a', interactive: true, desc: 'A STORAGE LOCKER. IT IS MOSTLY EMPTY. THE FUEL CELL WAS INSIDE.' },
          { id: 'poster', name: 'POSTER', x: 70, y: 20, w: 14, h: 18, color: '#FF66FF', interactive: true, desc: 'A FADED POSTER: "SAFETY FIRST. ALIGN CRYSTAL POLARITY BEFORE INSERTION."' },
          { id: 'doorEngine', name: 'ENGINE DOOR', x: 78, y: 40, w: 14, h: 28, color: '#8B6FCF', interactive: true, desc: 'THE ENGINE ROOM DOOR. IT SLIDES OPEN.' },
        ],
        useCombine: () => null,
        onFlag: () => null,
      },
      engine: {
        name: 'ENGINE ROOM',
        bg: 'linear-gradient(180deg, #0a0014 0%, #1a0520 40%, #2a0a30 100%)',
        desc: 'THE ENGINE THROBS WITH DORMANT POWER. A FUEL CELL SLOT GAPES OPEN. ANCIENT RUNES GLOW ON THE WALLS.',
        items: [
          { id: 'slot', name: 'FUEL SLOT', x: 45, y: 35, w: 16, h: 20, color: '#FFAA44', interactive: true, desc: 'A FUEL CELL SLOT. IT WAITS FOR A CELL.' },
          { id: 'runes', name: 'GLOWING RUNES', x: 20, y: 15, w: 22, h: 16, color: '#44FF88', glow: '#44FF88', interactive: true, desc: 'THE RUNES READ: "THE CRYSTAL AWAKENS. THE CELL SUSTAINS. THE VOID OPENS FOR THE WORTHY."' },
          { id: 'escapePod', name: 'ESCAPE POD', x: 72, y: 30, w: 18, h: 32, color: '#44DDFF', interactive: true, desc: 'THE ESCAPE POD NEEDS BOTH A POWERED CRYSTAL AND A FUEL CELL TO LAUNCH.' },
        ],
        useCombine: (state, itemId, targetId) => {
          if (itemId === 'fuelCell' && targetId === 'slot') {
            if (state.flags.consolePowered) {
              return { success: true, msg: 'THE ENGINE ROARS TO LIFE! THE ESCAPE POD IS READY!', removeItem: 'fuelCell', setFlag: 'enginePowered', gameOver: 'win' };
            } else {
              return { success: false, msg: 'THE SLOT CLICKS BUT NOTHING HAPPENS. THE CONSOLE IN THE COCKPIT NEEDS TO BE POWERED FIRST.' };
            }
          }
          if (targetId === 'escapePod') {
            return { success: false, msg: 'THE POD WON\'T LAUNCH. THE SHIP NEEDS A POWERED CRYSTAL AND A FUEL CELL IN THE ENGINE.' };
          }
          return null;
        },
        onFlag: (flags) => {
          if (flags.enginePowered) {
            return { desc: 'THE ENGINE THUNDERS! ALL SYSTEMS GO! THE ESCAPE POD IS READY.', changed: 'escapePod' };
          }
          return null;
        },
      },
    },
    roomOrder: ['cockpit', 'corridor', 'engine'],
  },
  {
    name: 'FREQUENCY SHIFT',
    rooms: {
      cockpit: {
        name: 'OBSERVATORY',
        bg: 'linear-gradient(180deg, #0a1a2a 0%, #0e2a3a 40%, #1a3a4a 100%)',
        desc: 'AN OBSERVATORY DECK. A RESONANCE CRYSTAL PULSATES NEAR THE COMMS CONSOLE.',
        items: [
          { id: 'crystal', name: 'RESONANCE CRYSTAL', x: 60, y: 30, w: 12, h: 12, color: '#FF66FF', glow: '#FF66FF', pickup: true, desc: 'A RESONANCE CRYSTAL. IT VIBRATES AT A SPECIFIC FREQUENCY.' },
          { id: 'note', name: 'DATA PAD', x: 15, y: 50, w: 14, h: 10, color: '#FFD700', pickup: true, desc: '"RESONANCE CRYSTAL > COMMS ARRAY > ENGINE IGNITER — STANDARD SEQUENCE."' },
          { id: 'console', name: 'COMMS ARRAY', x: 35, y: 42, w: 22, h: 18, color: '#4a6a9a', interactive: true, desc: 'A COMMS ARRAY. A CRYSTAL SOCKET GAPES OPEN.' },
          { id: 'door', name: 'BULKHEAD', x: 82, y: 35, w: 14, h: 25, color: '#6F8BCF', interactive: true, desc: 'THE BULKHEAD IS DOGED TIGHT. IT NEEDS POWER TO OPEN.' },
        ],
        useCombine: (state, itemId, targetId) => {
          if (itemId === 'crystal' && targetId === 'console') {
            return { success: true, msg: 'THE CRYSTAL LOCKS INTO THE COMMS ARRAY. FREQUENCIES ALIGN!', removeItem: 'crystal', setFlag: 'consolePowered' };
          }
          if (targetId === 'door') {
            return { success: false, msg: 'THE BULKHEAD WON\'T BUDGE. POWER THE SYSTEMS FIRST.' };
          }
          return null;
        },
        onFlag: (flags) => {
          if (flags.consolePowered) {
            return { desc: 'THE COMMS ARRAY HUMS. FREQUENCY LOCKED. THE BULKHEAD UNSEALS.', changed: 'door' };
          }
          return null;
        },
      },
      corridor: {
        name: 'MAINTAINANCE PASSAGE',
        bg: 'linear-gradient(180deg, #0a1000 0%, #1a1a0a 50%, #2a2010 100%)',
        desc: 'A MAINTENANCE PASSAGE. A FUEL CANISTER IS WEDGED BEHIND A GRATE.',
        items: [
          { id: 'fuelCell', name: 'FUEL CANISTER', x: 48, y: 38, w: 10, h: 16, color: '#FF8844', glow: '#FF8844', pickup: true, desc: 'A FUEL CANISTER. THIS POWERS THE ENGINE IGNITER.' },
          { id: 'locker', name: 'GRATE', x: 22, y: 32, w: 16, h: 22, color: '#6a6a4a', interactive: true, desc: 'THE GRATE IS LOOSE. SOMEONE STASHED A CANISTER BEHIND IT.' },
          { id: 'poster', name: 'SCHEMATIC', x: 68, y: 18, w: 16, h: 16, color: '#66FFCC', interactive: true, desc: 'A SCHEMATIC: RESONANCE CRYSTAL ACTIVATES THE COMMS ARRAY BEFORE THE IGNITER WILL ACCEPT FUEL.' },
          { id: 'doorEngine', name: 'HATCH', x: 78, y: 38, w: 14, h: 28, color: '#6F8BCF', interactive: true, desc: 'THE ENGINE HATCH. IT SLIDES OPEN AT A TOUCH.' },
        ],
        useCombine: () => null,
        onFlag: () => null,
      },
      engine: {
        name: 'IGNITION CHAMBER',
        bg: 'linear-gradient(180deg, #140a00 0%, #201005 40%, #2a1a0a 100%)',
        desc: 'THE IGNITION CHAMBER. THE ENGINE IGNITER AWAITS A FUEL CANISTER.',
        items: [
          { id: 'slot', name: 'ENGINE IGNITER', x: 40, y: 30, w: 18, h: 22, color: '#FFAA44', interactive: true, desc: 'THE IGNITER. A FUEL CANISTER SLOTS IN HERE.' },
          { id: 'runes', name: 'WARNING PLAQUE', x: 18, y: 12, w: 20, h: 14, color: '#FF6666', interactive: true, desc: '"SEQUENCE MATTERS: ACTIVATE ARRAY BEFORE INSERTING FUEL."' },
          { id: 'escapePod', name: 'ESCAPE CAPSULE', x: 72, y: 32, w: 18, h: 30, color: '#FF66FF', interactive: true, desc: 'THE ESCAPE CAPSULE. IT NEEDS THE IGNITION SEQUENCE COMPLETE TO DETACH.' },
        ],
        useCombine: (state, itemId, targetId) => {
          if (itemId === 'fuelCell' && targetId === 'slot') {
            if (state.flags.consolePowered) {
              return { success: true, msg: 'THE CANISTER CLICKS INTO THE IGNITER. FLAMES ROAR! THE CAPSULE IS READY!', removeItem: 'fuelCell', setFlag: 'enginePowered', gameOver: 'win' };
            } else {
              return { success: false, msg: 'THE IGNITER CLICKS BUT NOTHING HAPPENS. THE COMMS ARRAY NEEDS TO BE ACTIVE FIRST.' };
            }
          }
          if (targetId === 'escapePod') {
            return { success: false, msg: 'THE CAPSULE WON\'T RELEASE. COMPLETE THE IGNITION SEQUENCE FIRST.' };
          }
          return null;
        },
        onFlag: (flags) => {
          if (flags.enginePowered) {
            return { desc: 'FLAMES STABILIZE. THE CAPSULE IS GO!', changed: 'escapePod' };
          }
          return null;
        },
      },
    },
    roomOrder: ['cockpit', 'corridor', 'engine'],
  },
  {
    name: 'VOID GATE',
    rooms: {
      cockpit: {
        name: 'BRIDGE',
        bg: 'linear-gradient(180deg, #2a0020 0%, #3a1030 40%, #4a1a40 100%)',
        desc: 'THE BRIDGE. STAR MAPS FLOAT ACROSS SCREENS. A POWER RELAY SITS IN A CONSOLE.',
        items: [
          { id: 'crystal', name: 'POWER RELAY', x: 50, y: 22, w: 14, h: 14, color: '#88FF44', glow: '#88FF44', pickup: true, desc: 'A POWER RELAY. IT THROBS WITH ENERGIZED PLASMA.' },
          { id: 'note', name: 'MANUAL', x: 20, y: 52, w: 14, h: 10, color: '#FFD700', pickup: true, desc: '"INSTALL RELAY > ACTIVATE SUBSYSTEMS > INSERT COMBUSTIBLE. THREE STEPS TO ESCAPE."' },
          { id: 'console', name: 'SUBSYSTEM PANEL', x: 36, y: 40, w: 26, h: 18, color: '#6a3a7a', interactive: true, desc: 'THE SUBSYSTEM PANEL. A RELAY SOCKET FLASHES.' },
          { id: 'door', name: 'AIRLOCK', x: 80, y: 32, w: 16, h: 28, color: '#CF8BCF', interactive: true, desc: 'THE AIRLOCK IS SEALED. SUBSYSTEMS MUST BE ONLINE.' },
        ],
        useCombine: (state, itemId, targetId) => {
          if (itemId === 'crystal' && targetId === 'console') {
            return { success: true, msg: 'THE RELAY SNAPS INTO THE PANEL. SCREAMS LIGHT UP!', removeItem: 'crystal', setFlag: 'consolePowered' };
          }
          if (targetId === 'door') {
            return { success: false, msg: 'THE AIRLOCK STAYS SHUT. POWER THE PANEL FIRST.' };
          }
          return null;
        },
        onFlag: (flags) => {
          if (flags.consolePowered) {
            return { desc: 'ALL SUBSYSTEMS ONLINE. THE AIRLOCK HISSES OPEN.', changed: 'door' };
          }
          return null;
        },
      },
      corridor: {
        name: 'TRANSIT TUBE',
        bg: 'linear-gradient(180deg, #100020 0%, #1a0030 50%, #2a0040 100%)',
        desc: 'A DARK TRANSIT TUBE. A COMBUSTIBLE CANISTER DRIFTS IN ZERO-G.',
        items: [
          { id: 'fuelCell', name: 'COMBUSTIBLE CANISTER', x: 44, y: 30, w: 12, h: 18, color: '#FF4444', glow: '#FF4444', pickup: true, desc: 'A COMBUSTIBLE CANISTER. HIGHLY VOLATILE. HANDLE WITH CARE.' },
          { id: 'locker', name: 'TOOL LOCKER', x: 18, y: 34, w: 20, h: 24, color: '#4a5a6a', interactive: true, desc: 'THE TOOL LOCKER IS EMPTY. THE CANISTER WAS FLOATING FREE.' },
          { id: 'poster', name: 'STAR MAP', x: 70, y: 16, w: 16, h: 18, color: '#44FFFF', interactive: true, desc: 'THE STAR MAP SHOWS THE NEAREST VOID GATE. "REQUIRES FULL POWER AND COMBUSTION."' },
          { id: 'doorEngine', name: 'ENGINE DOOR', x: 80, y: 36, w: 14, h: 30, color: '#CF8BCF', interactive: true, desc: 'THE HEAVY ENGINE DOOR. IT CREAKS OPEN.' },
        ],
        useCombine: () => null,
        onFlag: () => null,
      },
      engine: {
        name: 'COMBUSTION CHAMBER',
        bg: 'linear-gradient(180deg, #200000 0%, #300a00 40%, #3a1000 100%)',
        desc: 'THE COMBUSTION CHAMBER. A RECEPTACLE AWAITS THE CANISTER.',
        items: [
          { id: 'slot', name: 'RECEPTACLE', x: 42, y: 34, w: 16, h: 22, color: '#FF8844', interactive: true, desc: 'A COMBUSTIBLE RECEPTACLE. THE CANISTER SLOTS IN HERE.' },
          { id: 'runes', name: 'ENGRAVED WARNING', x: 16, y: 10, w: 22, h: 16, color: '#FFAA44', interactive: true, desc: '"WARNING: ACTIVATE RELAY BEFORE INTRODUCING COMBUSTIBLE MATERIAL."' },
          { id: 'escapePod', name: 'VOID POD', x: 70, y: 28, w: 20, h: 34, color: '#44FF88', interactive: true, desc: 'THE VOID POD. IT NEEDS THE FULL STARTUP SEQUENCE TO DEPLOY.' },
        ],
        useCombine: (state, itemId, targetId) => {
          if (itemId === 'fuelCell' && targetId === 'slot') {
            if (state.flags.consolePowered) {
              return { success: true, msg: 'THE CANISTER LOCKS INTO THE RECEPTACLE. COMBUSTION ENGAGED! THE POD ACTIVATES!', removeItem: 'fuelCell', setFlag: 'enginePowered', gameOver: 'win' };
            } else {
              return { success: false, msg: 'THE RECEPTACLE CLICKS DEAD. THE SUBSYSTEM PANEL MUST BE ACTIVE FIRST.' };
            }
          }
          if (targetId === 'escapePod') {
            return { success: false, msg: 'THE POD IS DEAD. COMPLETE THE STARTUP SEQUENCE.' };
          }
          return null;
        },
        onFlag: (flags) => {
          if (flags.enginePowered) {
            return { desc: 'COMBUSTION STEADY! THE POD DETACHES!', changed: 'escapePod' };
          }
          return null;
        },
      },
    },
    roomOrder: ['cockpit', 'corridor', 'engine'],
  },
  {
    name: 'DIMENSIONAL RIFT',
    rooms: {
      cockpit: {
        name: 'PORTAL LAB',
        bg: 'linear-gradient(180deg, #00102a 0%, #001a3a 40%, #00204a 100%)',
        desc: 'A LABORATORY. AN ANOMALY CORE FLOATS ABOVE A PEDESTAL.',
        items: [
          { id: 'crystal', name: 'ANOMALY CORE', x: 52, y: 20, w: 16, h: 16, color: '#44FFFF', glow: '#44FFFF', pickup: true, desc: 'AN ANOMALY CORE. REALITY WARPS AROUND IT.' },
          { id: 'note', name: 'RESEARCH LOG', x: 14, y: 54, w: 18, h: 10, color: '#44DDFF', pickup: true, desc: '"CORE STABILIZES THE PORTAL. THEN FEED THE DIMENSIONAL CONDENSER. — DR. VEX"' },
          { id: 'console', name: 'PORTAL STABILIZER', x: 34, y: 44, w: 28, h: 16, color: '#3a5a7a', interactive: true, desc: 'THE PORTAL STABILIZER. A CORE-SHAPED RECESS AWAITS.' },
          { id: 'door', name: 'CONTAINMENT DOOR', x: 82, y: 28, w: 14, h: 30, color: '#6F9FCF', interactive: true, desc: 'THE CONTAINMENT DOOR IS LOCKED. STABILIZE THE PORTAL FIRST.' },
        ],
        useCombine: (state, itemId, targetId) => {
          if (itemId === 'crystal' && targetId === 'console') {
            return { success: true, msg: 'THE CORE LOCKS INTO THE STABILIZER. THE PORTAL HUMMS!', removeItem: 'crystal', setFlag: 'consolePowered' };
          }
          if (targetId === 'door') {
            return { success: false, msg: 'THE DOOR REMAINS SEALED. STABILIZE THE PORTAL.' };
          }
          return null;
        },
        onFlag: (flags) => {
          if (flags.consolePowered) {
            return { desc: 'THE PORTAL RIPPLES. THE CONTAINMENT DOOR UNLOCKS.', changed: 'door' };
          }
          return null;
        },
      },
      corridor: {
        name: 'RIFT CORRIDOR',
        bg: 'linear-gradient(180deg, #0a002a 0%, #10003a 50%, #1a004a 100%)',
        desc: 'A CORRIDOR WARPED BY RIFT ENERGY. A CONDENSER DRIFTS IN AN ANOMALY FIELD.',
        items: [
          { id: 'fuelCell', name: 'DIMENSIONAL CONDENSER', x: 46, y: 36, w: 14, h: 16, color: '#AA44FF', glow: '#AA44FF', pickup: true, desc: 'A DIMENSIONAL CONDENSER. IT CHANNELS RIFT ENERGY.' },
          { id: 'locker', name: 'EQUIPMENT CRATE', x: 24, y: 30, w: 16, h: 24, color: '#5a4a6a', interactive: true, desc: 'A CRATE. BOLTED SHUT. THE CONDENSER WAS NEVER STORED HERE.' },
          { id: 'poster', name: 'EXPERIMENT NOTES', x: 66, y: 16, w: 20, h: 16, color: '#66FFFF', interactive: true, desc: '"STABLE PORTAL FIRST. CONDENSER SECOND. THE RIFT OPENS FOR THE WORTHY."' },
          { id: 'doorEngine', name: 'RIFT GATE', x: 80, y: 34, w: 14, h: 30, color: '#CF8FCF', interactive: true, desc: 'THE RIFT GATE. IT SWIRLS WITH DIMENSIONAL ENERGY.' },
        ],
        useCombine: () => null,
        onFlag: () => null,
      },
      engine: {
        name: 'DIMENSIONAL ENGINE',
        bg: 'linear-gradient(180deg, #0a0020 0%, #1a0030 40%, #2a0040 100%)',
        desc: 'THE DIMENSIONAL ENGINE. THE CONDENSER SLOT PULSES WITH ENERGY.',
        items: [
          { id: 'slot', name: 'CONDENSER SLOT', x: 42, y: 32, w: 18, h: 22, color: '#AA66FF', interactive: true, desc: 'THE CONDENSER SLOT. READY FOR A DIMENSIONAL CONDENSER.' },
          { id: 'runes', name: 'RIFT CALCULATIONS', x: 18, y: 14, w: 22, h: 14, color: '#AAFFFF', interactive: true, desc: '"STABILIZED PORTAL + DIMENSIONAL CONDENSER = CONTROLLED RIFT ESCAPE."' },
          { id: 'escapePod', name: 'RIFT ESCAPE POD', x: 72, y: 30, w: 18, h: 34, color: '#44FFFF', interactive: true, desc: 'THE RIFT ESCAPE POD. IT NEEDS A FULL SEQUENCE TO ACTIVATE.' },
        ],
        useCombine: (state, itemId, targetId) => {
          if (itemId === 'fuelCell' && targetId === 'slot') {
            if (state.flags.consolePowered) {
              return { success: true, msg: 'THE CONDENSER SLOTS IN. THE RIFT OPENS! THE POD LAUNCHES THROUGH DIMENSIONAL SPACE!', removeItem: 'fuelCell', setFlag: 'enginePowered', gameOver: 'win' };
            } else {
              return { success: false, msg: 'NOTHING HAPPENS. THE PORTAL STABILIZER MUST BE ACTIVE FIRST.' };
            }
          }
          if (targetId === 'escapePod') {
            return { success: false, msg: 'THE POD IS INERT. ACTIVATE THE RIFT SEQUENCE.' };
          }
          return null;
        },
        onFlag: (flags) => {
          if (flags.enginePowered) {
            return { desc: 'THE RIFT STABILIZES! YOU CAN ESCAPE!', changed: 'escapePod' };
          }
          return null;
        },
      },
    },
    roomOrder: ['cockpit', 'corridor', 'engine'],
  },
];

// ===== ARENA LOGIC =====
function pickPuzzleSet(arena) {
  const lastId = arena.lastPuzzleIndex;
  const available = PUZZLE_SETS.map((s, i) => i).filter(i => i !== lastId);
  const idx = pickRandom(available);
  return { index: idx, set: PUZZLE_SETS[idx] };
}

function deepCloneItems(items) {
  return items.map(i => ({ ...i }));
}

function buildGameState(phase, puzzleSet) {
  const rooms = puzzleSet.set.rooms;
  const startRoomId = puzzleSet.set.roomOrder[0];
  const startRoom = rooms[startRoomId];
  return {
    phase,
    roomId: startRoomId,
    flags: { consolePowered: false, enginePowered: false },
    inventory: [],
    selectedItem: null,
    roomItems: deepCloneItems(startRoom.items),
    log: [{ text: `ROUND ${phase === 'playing' ? 'START' : ''} — ${puzzleSet.set.name}. FIND THE ESCAPE SEQUENCE.`, type: 'system' }],
    currentDesc: startRoom.desc,
    gameOver: null,
    puzzleIndex: puzzleSet.index,
  };
}

const ITEM_NAMES = {
  crystal: 'GLOWING CRYSTAL', note: 'NOTE', fuelCell: 'FUEL CELL',
  'RESONANCE CRYSTAL': 'RESONANCE CRYSTAL', 'DATA PAD': 'DATA PAD', 'FUEL CANISTER': 'FUEL CANISTER',
  'POWER RELAY': 'POWER RELAY', 'MANUAL': 'MANUAL', 'COMBUSTIBLE CANISTER': 'COMBUSTIBLE CANISTER',
  'ANOMALY CORE': 'ANOMALY CORE', 'RESEARCH LOG': 'RESEARCH LOG', 'DIMENSIONAL CONDENSER': 'DIMENSIONAL CONDENSER',
};

// ===== GAME STATE MACHINE =====
function getRoom(state) {
  const puzzle = PUZZLE_SETS[state.puzzleIndex];
  return puzzle.rooms[state.roomId];
}

function handleItemClick(state, item, setState) {
  if (item.pickup) {
    sfx('pickup');
    setState(s => ({
      ...s,
      inventory: [...s.inventory, item.id],
      roomItems: s.roomItems.filter(i => i.id !== item.id),
      log: [...s.log, { text: `PICKED UP: ${item.name}`, type: 'info' }],
      currentDesc: item.desc,
    }));
    return true;
  }
  if (item.interactive) {
    sfx('click');

    if (state.selectedItem) {
      const room = getRoom(state);
      const result = room.useCombine(state, state.selectedItem, item.id);
      if (result) {
        if (result.success) {
          sfx('success');
          const updates = { log: [...state.log, { text: result.msg, type: 'success' }], currentDesc: result.msg, selectedItem: null };
          if (result.removeItem) {
            updates.inventory = state.inventory.filter(i => i !== result.removeItem);
          }
          if (result.setFlag) {
            updates.flags = { ...state.flags, [result.setFlag]: true };
          }
          if (result.gameOver) {
            updates.gameOver = result.gameOver;
            if (result.gameOver === 'win') sfx('win');
            else sfx('lose');

            const arena = loadArena();
            arena.totalWins++;
            arena.round++;
            arena.lastPuzzleIndex = state.puzzleIndex;
            arena.completedPuzzles = [...(arena.completedPuzzles || []), state.puzzleIndex];
            saveArena(arena);
          }
          setState(s => {
            const newFlags = updates.flags || s.flags;
            const roomAfter = getRoom(s);
            const flagResult = roomAfter.onFlag(newFlags);
            if (flagResult) {
              updates.roomItems = s.roomItems.map(i =>
                i.id === flagResult.changed ? { ...i, desc: flagResult.desc } : i
              );
              updates.currentDesc = flagResult.desc;
            }
            return { ...s, ...updates, flags: newFlags };
          });
        } else {
          sfx('error');
          setState(s => ({ ...s, log: [...s.log, { text: result.msg, type: 'error' }], currentDesc: result.msg, selectedItem: null }));
        }
        return true;
      }

      sfx('error');
      const nameMap = ITEM_NAMES[state.selectedItem] || state.selectedItem;
      setState(s => ({ ...s, log: [...s.log, { text: `CANNOT USE ${nameMap} ON ${item.name}.`, type: 'error' }], selectedItem: null }));
      return true;
    }

    setState(s => ({ ...s, currentDesc: item.desc }));
    return true;
  }
  return false;
}

// ===== SVG ROOM RENDER =====
function RoomScene({ room, flags }) {
  if (!room) return null;
  const items = room.items || [];

  return (
    <svg viewBox="0 0 100 80" className="room-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="rglow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* Background */}
      <rect width="100" height="80" fill="url(#roomBg)" />

      {/* Stars */}
      {Array.from({ length: 25 }).map((_, i) => (
        <circle key={i} cx={Math.random() * 100} cy={Math.random() * 30} r={0.3 + Math.random() * 0.5} fill="white" opacity={0.3 + Math.random() * 0.4} />
      ))}

      {/* Floor */}
      <rect x="0" y="60" width="100" height="20" fill="rgba(26,10,58,0.5)" />

      {/* Room-specific decorations */}
      {room.id === 'cockpit' && (
        <>
          <rect x="5" y="15" width="55" height="35" rx="3" fill="rgba(26,10,58,0.6)" stroke="#6a4a9a" strokeWidth="0.5" />
          <rect x="8" y="18" width="49" height="20" rx="2" fill="#0a0020" stroke="#44DDFF" strokeWidth="0.3" opacity="0.5" />
          {/* Viewport stars */}
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={`vs${i}`} cx={15 + Math.random() * 35} cy={22 + Math.random() * 12} r={0.5} fill="white" opacity={0.5 + Math.random() * 0.3} />
          ))}
        </>
      )}
      {room.id === 'corridor' && (
        <>
          <rect x="5" y="10" width="90" height="50" rx="2" fill="rgba(10,0,32,0.4)" stroke="#6a4a9a" strokeWidth="0.3" />
          <rect x="10" y="12" width="80" height="46" rx="1" fill="rgba(0,0,0,0.2)" />
          {/* Warning lights */}
          {Array.from({ length: 3 }).map((_, i) => (
            <circle key={`wl${i}`} cx={20 + i * 30} cy={8} r="1.5" fill="#FF4466" opacity={0.4 + Math.sin(Date.now() * 0.003 + i) * 0.3} />
          ))}
        </>
      )}
      {room.id === 'engine' && (
        <>
          <rect x="5" y="10" width="90" height="50" rx="2" fill="rgba(10,0,32,0.5)" stroke="#8B6FCF" strokeWidth="0.5" />
          <rect x="8" y="13" width="84" height="44" rx="1" fill="rgba(0,0,0,0.3)" />
          {/* Engine glow */}
          {flags.enginePowered && (
            <rect x="10" y="15" width="80" height="40" fill="#44FF88" opacity="0.06" rx="1">
              <animate attributeName="opacity" values="0.04;0.08;0.04" dur="2s" repeatCount="indefinite" />
            </rect>
          )}
        </>
      )}

      {/* Items */}
      {items.filter(i => flags.consolePowered ? i.id !== 'console' || true : true).map((item) => {
        if (item.id === 'console' && flags.consolePowered) {
          return (
            <g key={item.id}>
              <rect x={item.x} y={item.y} width={item.w} height={item.h} rx="2" fill="#2a1050" stroke="#44DDFF" strokeWidth="0.5" />
              <rect x={item.x + 2} y={item.y + 2} width={item.w - 4} height={item.h - 4} rx="1" fill="#44DDFF" opacity="0.08" />
              <text x={item.x + item.w / 2} y={item.y + item.h / 2 + 1.5} textAnchor="middle" fill="#44DDFF" fontSize="3" fontFamily="monospace">ONLINE</text>
            </g>
          );
        }
        if (item.id === 'door' && flags.consolePowered) {
          return (
            <g key={item.id}>
              <rect x={item.x} y={item.y} width={item.w} height={item.h} rx="1" fill="#1a0a3a" stroke="#44DDFF" strokeWidth="1" opacity="0.6" />
              <text x={item.x + item.w / 2} y={item.y + item.h / 2 + 1.5} textAnchor="middle" fill="#44FF88" fontSize="2.5" fontFamily="monospace">OPEN</text>
            </g>
          );
        }
        if (item.id === 'escapePod' && flags.enginePowered) {
          return (
            <g key={item.id}>
              <rect x={item.x} y={item.y} width={item.w} height={item.h} rx="2" fill="#1a0a3a" stroke="#44FF88" strokeWidth="1" />
              <text x={item.x + item.w / 2} y={item.y + item.h / 2 + 1.5} textAnchor="middle" fill="#44FF88" fontSize="2.5" fontFamily="monospace">READY</text>
            </g>
          );
        }

        if (item.pickup) return (
          <g key={item.id} className="room-item">
            {item.glow && <rect x={item.x - 1} y={item.y - 1} width={item.w + 2} height={item.h + 2} rx="3" fill={item.glow} opacity="0.12" filter="url(#rglow)" />}
            <rect x={item.x} y={item.y} width={item.w} height={item.h} rx="2" fill={item.color} opacity="0.7" stroke="white" strokeWidth="0.3" />
            <text x={item.x + item.w / 2} y={item.y + item.h / 2 + 1.5} textAnchor="middle" fill="white" fontSize="2" fontFamily="monospace">{item.name.slice(0, 10)}</text>
          </g>
        );
        return (
          <g key={item.id} className="room-item">
            <rect x={item.x} y={item.y} width={item.w} height={item.h} rx="2" fill={item.color} opacity="0.4" stroke="#8B6FCF" strokeWidth="0.5" />
            <text x={item.x + item.w / 2} y={item.y + item.h / 2 + 1.5} textAnchor="middle" fill="white" fontSize="2" fontFamily="monospace">{item.name}</text>
          </g>
        );
      })}

      {/* Vignette */}
      <rect width="100" height="80" fill="url(#vignette)" pointerEvents="none" />
      <defs>
        <radialGradient id="vignette" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
        </radialGradient>
        <linearGradient id="roomBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0020" />
          <stop offset="50%" stopColor="#1a0a3a" />
          <stop offset="100%" stopColor="#2a1050" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ===== MAIN APP =====
export default function App() {
  const [arena] = useState(() => loadArena());
  const initialPuzzle = useCallback(() => {
    const picked = pickPuzzleSet(arena);
    return buildGameState('title', picked);
  }, [arena]);

  const [state, setState] = useState(initialPuzzle);

  const room = state.phase === 'playing' ? getRoom(state) : null;
  const puzzleName = PUZZLE_SETS[state.puzzleIndex]?.name;

  const goToRoom = useCallback((id) => {
    const puzzle = PUZZLE_SETS[state.puzzleIndex];
    const nextRoomData = puzzle.rooms[id];
    if (!nextRoomData) return;
    sfx('door');
    setState(s => ({
      ...s,
      roomId: id,
      roomItems: nextRoomData.items.map(i => ({ ...i })),
      log: [...s.log, { text: `ENTERED: ${nextRoomData.name}`, type: 'system' }],
      currentDesc: nextRoomData.desc,
      selectedItem: null,
    }));
  }, [state.puzzleIndex]);

  const startGame = useCallback(() => {
    sfx('click');
    const arenaData = loadArena();
    const picked = pickPuzzleSet(arenaData);
    const gs = buildGameState('playing', picked);
    const startRoom = PUZZLE_SETS[picked.index].rooms[picked.set.roomOrder[0]];
    setState({
      ...gs,
      phase: 'playing',
      log: [{ text: `ARENA ROUND ${arenaData.round} — ${picked.set.name}. FIND THE ESCAPE SEQUENCE.`, type: 'system' }],
      currentDesc: startRoom.desc,
    });
  }, []);

  const handleRoomClick = useCallback((e) => {
    if (state.gameOver) return;
    const currentItems = state.roomItems || [];
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 80;

    for (const item of currentItems) {
      const ix = item.x, iy = item.y, iw = item.w, ih = item.h;
      if (x >= ix && x <= ix + iw && y >= iy && y <= iy + ih) {
        handleItemClick(state, item, setState);
        return;
      }
    }

    const puzzle = PUZZLE_SETS[state.puzzleIndex];
    const order = puzzle.roomOrder;
    const idx = order.indexOf(state.roomId);

    if (x > 85 && idx >= 0 && idx < order.length - 1) {
      const canPass = state.roomId === 'cockpit' ? state.flags.consolePowered : true;
      if (canPass) {
        goToRoom(order[idx + 1]);
        return;
      }
    }
    if (x < 10 && idx > 0) {
      goToRoom(order[idx - 1]);
      return;
    }

    sfx('error');
    setState(s => ({ ...s, currentDesc: 'NOTHING INTERACTIVE THERE.' }));
  }, [state, goToRoom]);

  const handleInvClick = useCallback((itemId) => {
    if (state.gameOver) return;
    if (state.selectedItem === itemId) {
      setState(s => ({ ...s, selectedItem: null }));
      return;
    }
    sfx('click');
    setState(s => ({ ...s, selectedItem: itemId }));
  }, [state.gameOver, state.selectedItem]);

  const handleRestart = useCallback(() => {
    sfx('click');
    setState({ phase: 'title', roomId: 'cockpit', flags: { consolePowered: false, enginePowered: false }, inventory: [], selectedItem: null, roomItems: [], log: [], currentDesc: '', gameOver: null, puzzleIndex: 0 });
  }, []);

  const handleNextRound = useCallback(() => {
    sfx('click');
    const arenaData = loadArena();
    const picked = pickPuzzleSet(arenaData);
    const gs = buildGameState('playing', picked);
    const startRoom = PUZZLE_SETS[picked.index].rooms[picked.set.roomOrder[0]];
    setState({
      ...gs,
      phase: 'playing',
      log: [{ text: `ARENA ROUND ${arenaData.round} — ${picked.set.name}. FIND THE ESCAPE SEQUENCE.`, type: 'system' }],
      currentDesc: startRoom.desc,
    });
  }, []);

  if (state.phase === 'title') {
    const arenaData = loadArena();
    return (
      <div className="app">
        <div className="title-screen">
          <div className="title-box">
            <div className="title-flavor">CAPTAIN GLAZE & THE</div>
            <h1 className="title-main">LEGENDS OF THE<br /><span className="title-accent">GLAZED VOIDS</span></h1>
            <p className="title-sub">ARENA ESCAPE ROOM</p>

            <div className="arena-stats">
              <div className="arena-stat">
                <span className="arena-stat-num">{arenaData.totalWins || 0}</span>
                <span className="arena-stat-label">ESCAPES</span>
              </div>
              <div className="arena-stat">
                <span className="arena-stat-num">{arenaData.round || 1}</span>
                <span className="arena-stat-label">NEXT ROUND</span>
              </div>
              <div className="arena-stat">
                <span className="arena-stat-num">{PUZZLE_SETS.length}</span>
                <span className="arena-stat-label">PUZZLE SETS</span>
              </div>
            </div>

            <p className="title-desc">THE U.S.V. OLD-FASHIONED IS ADRIFT IN INTERDIMENSIONAL SPACE. EACH RANDOMIZED ROUND THROWS YOU INTO A NEW ESCAPE PUZZLE.</p>
            <p className="title-desc"><span className="title-highlight">FIND THE POWER SOURCE. FUEL THE ENGINE. ESCAPE.</span></p>
            <button className="btn-start" onClick={startGame}>ENTER ARENA</button>
            <div className="title-tip">CLICK ON OBJECTS TO INTERACT | CLICK ITEMS IN INVENTORY TO SELECT AND USE</div>
          </div>
        </div>
      </div>
    );
  }

  const currentItems = state.roomItems || room?.items || [];

  return (
    <div className="app">
      {/* HUD */}
      <div className="hud">
        <div className="hud-left">
          <span className="hud-room">{room?.name}</span>
          <span className="hud-tag">{puzzleName}</span>
          {state.flags.consolePowered && <span className="hud-tag">POWER ON</span>}
          {state.flags.enginePowered && <span className="hud-tag win">ESCAPE READY</span>}
        </div>
        <div className="hud-right">
          <button className="hud-btn" onClick={handleRestart}>MENU</button>
        </div>
      </div>

      {/* Main layout */}
      <div className="main-layout">
        {/* Room scene */}
        <div className="scene-area">
          <div className="scene-frame" onClick={handleRoomClick}>
            <RoomScene room={{ ...room, items: currentItems }} flags={state.flags} state={state} />
            <div className="scene-nav-left" onClick={() => {
              const puzzle = PUZZLE_SETS[state.puzzleIndex];
              const order = puzzle.roomOrder;
              const idx = order.indexOf(state.roomId);
              if (idx > 0) goToRoom(order[idx - 1]);
            }}>&#9664; BACK</div>
            <div className="scene-nav-right" onClick={() => {
              const puzzle = PUZZLE_SETS[state.puzzleIndex];
              const order = puzzle.roomOrder;
              const idx = order.indexOf(state.roomId);
              const canPass = state.roomId === 'cockpit' ? state.flags.consolePowered : true;
              if (idx >= 0 && idx < order.length - 1 && canPass) goToRoom(order[idx + 1]);
            }}>NEXT &#9654;</div>
          </div>

          {/* Description */}
          <div className="desc-box">
            {state.currentDesc || room?.desc}
          </div>

          {/* Log */}
          <div className="log-area">
            {state.log.slice(-6).map((entry, i) => (
              <div key={i} className={`log-entry log-${entry.type}`}>{entry.text}</div>
            ))}
          </div>

          {/* Game over overlay */}
          {state.gameOver && (
            <div className="game-over-overlay">
              <div className="game-over-box">
                {state.gameOver === 'win' ? (
                  <>
                    <div className="game-over-icon win-icon">&#9733;</div>
                    <h2 className="game-over-title win-title">ESCAPE SUCCESSFUL</h2>
                    <p className="game-over-desc">THE POD LAUNCHES INTO THE VOID. REALITY WARPS. YOU HAVE ESCAPED THE GLAZED VOIDS.</p>
                    <button className="btn-start" onClick={handleNextRound}>NEXT ROUND</button>
                  </>
                ) : (
                  <>
                    <div className="game-over-icon lose-icon">&#10007;</div>
                    <h2 className="game-over-title lose-title">HULL FAILURE</h2>
                    <p className="game-over-desc">THE VOID CLAIMS YOU. THE BAKERY GOES SILENT.</p>
                    <button className="btn-start" onClick={handleNextRound}>NEXT ROUND</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Inventory sidebar */}
        <div className="inventory-panel">
          <div className="inv-title">INVENTORY</div>
          <div className="inv-items">
            {state.inventory.length === 0 && <div className="inv-empty">EMPTY</div>}
            {state.inventory.map(itemId => (
              <div key={itemId}
                className={`inv-item ${state.selectedItem === itemId ? 'selected' : ''}`}
                onClick={() => handleInvClick(itemId)}>
                <div className="inv-item-name">{ITEM_NAMES[itemId] || itemId}</div>
                <div className="inv-item-hint">{state.selectedItem === itemId ? 'CLICK TO DESELECT' : 'CLICK TO USE'}</div>
              </div>
            ))}
          </div>
          {state.selectedItem && (
            <div className="inv-helper">
              SELECTED: {ITEM_NAMES[state.selectedItem] || state.selectedItem}
              <br />NOW CLICK ON SOMETHING IN THE ROOM
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
