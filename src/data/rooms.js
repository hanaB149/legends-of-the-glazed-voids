export const T = {
  VOID: 0, FLOOR: 1, WALL: 2, CONSOLE: 3, HATCH: 4,
  CORE_POD: 5, RIFT: 6, PORTAL: 7, WORM: 8, STRAY: 9,
  DOOR: 10, PIPE: 11, CRATE: 12, PILLAR: 13, SCREEN: 14,
  PANEL: 15, VENT: 16, CHAIR: 17, TABLE: 18, WIRES: 19,
  GLOW_TILE: 20, CRYSTAL: 21, PEDESTAL: 22, MONITOR: 23,
  CABLE: 24, LIGHT: 25,
};

export const ROOMS = [
  {
    id: 'bridge',
    name: 'THE BRIDGE',
    desc: 'COMMAND CENTER - U.S.V. OLD-FASHIONED',
    objective: 'WALK TO GLAZE (SOUTH), PERSUADE HIM TO ENTER THE HATCH (NORTH)',
    risk: 20,
    hasStray: false,
    requiredAction: { id: 'move_to_hatch', label: 'MOVE TO HATCH', risk: 15 },
    onEnter: 'BRIDGE: RIFT ALARMS BLARING. GLAZE IS FROZEN AT THE HELM.',
    nextRoom: 'glazing_bay',
    playerStart: { x: 14, y: 9 },
    glazePos: { x: 14, y: 5 },
    hatchPos: { x: 26, y: 2 },
    exitPos: { x: 27, y: 3 },
    labels: [
      { x: 14, y: 3, text: 'HATCH', color: '#00C8FF' },
      { x: 14, y: 6, text: 'GLAZE', color: '#44FF88' },
      { x: 6, y: 7, text: 'CONSOLE', color: '#FFAA00' },
      { x: 23, y: 7, text: 'VIEWPORT', color: '#FF00FF' },
    ],
    map: [
      // 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],//0
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,4,2],//1
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,4,4,2],//2
      [2,2,14,14,14,14,14,14,14,14,14,14,14,14,1,1,14,14,14,14,14,14,14,14,14,1,4,4,4,2],//3
      [2,2,15,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,2],//4
      [2,2,15,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],//5
      [2,2,15,1,3,3,3,1,3,3,3,1,1,1,1,1,1,1,3,3,3,1,3,3,3,1,1,1,1,2],//6
      [2,2,15,1,3,1,1,1,1,1,3,1,1,1,1,1,1,1,3,1,1,1,1,1,3,1,1,1,1,2],//7
      [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],//8
      [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],//9
      [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],//10
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],//11
    ],
  },
  {
    id: 'glazing_bay',
    name: 'THE GLAZING BAY',
    desc: 'DOUGHNUT FORGE & CORE STORAGE',
    objective: 'PERSUADE GLAZE TO GRAB A CORE FROM THE PODS (NORTH)',
    risk: 50,
    hasStray: true,
    requiredAction: { id: 'grab_core', label: 'GRAB CORE', risk: 40 },
    onEnter: 'GLAZING BAY: CORES IN STASIS. A CHROME STRAY SLEEPS NEAR THE PIPES.',
    nextRoom: 'maw',
    playerStart: { x: 14, y: 8 },
    glazePos: { x: 14, y: 6 },
    corePos: { x: 6, y: 2 },
    strayPos: { x: 24, y: 4 },
    exitPos: { x: 27, y: 8 },
    labels: [
      { x: 6, y: 1, text: 'CORE PODS', color: '#00C8FF' },
      { x: 14, y: 7, text: 'GLAZE', color: '#44FF88' },
      { x: 24, y: 3, text: 'STRAY', color: '#FF4444' },
      { x: 8, y: 6, text: 'FORGE', color: '#FFAA00' },
    ],
    map: [
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,2,22,22,22,22,22,22,2,5,5,5,5,5,5,5,5,2,22,22,22,22,22,22,2,2,2,2],
      [2,2,2,2,22,1,1,1,1,1,2,5,1,1,1,1,1,1,5,2,1,1,1,1,9,22,2,2,2,2],
      [2,2,2,2,22,1,1,1,1,1,2,5,1,1,1,1,1,1,5,2,1,1,1,9,9,22,2,2,2,2],
      [2,2,2,2,22,1,1,1,1,1,2,5,1,1,1,1,1,1,5,2,1,1,1,1,1,22,2,2,2,2],
      [2,2,2,2,2,2,2,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,2,2,2,2,2,2],
      [2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2],
      [2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2],
      [2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,10,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    ],
  },
  {
    id: 'maw',
    name: 'THE MAW',
    desc: 'ENGINEERING CORE - RIFT ANCHOR',
    objective: 'SEAL THE RIFT (CENTER), THEN FEED VERMIOUS (WEST) TO ESCAPE',
    risk: 70,
    hasStray: false,
    requiredAction: { id: 'seal_rift', label: 'SEAL RIFT', risk: 50, prereq: { resource: 'glazeCores', amount: 1 } },
    finaleAction: { id: 'feed_vermious', label: 'FEED WORM', risk: 30, prereq: { resource: 'voidCrullers', amount: 1 } },
    onEnter: 'THE MAW: RIFT PULSING. VERMIOUS WAITING. PORTAL STANDBY.',
    nextRoom: null,
    playerStart: { x: 18, y: 6 },
    glazePos: { x: 14, y: 5 },
    wormPos: { x: 5, y: 4 },
    riftPos: { x: 14, y: 2 },
    portalPos: { x: 26, y: 3 },
    exitPos: null,
    labels: [
      { x: 14, y: 1, text: 'RIFT', color: '#FF00FF' },
      { x: 5, y: 3, text: 'VERMIOUS', color: '#00FF88' },
      { x: 26, y: 2, text: 'PORTAL', color: '#00C8FF' },
      { x: 14, y: 6, text: 'GLAZE', color: '#44FF88' },
      { x: 18, y: 4, text: 'PILLARS', color: '#FFAA00' },
    ],
    map: [
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,6,6,6,2,2,2,2,2,2,2,2,7,7,7,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,6,1,6,2,2,2,2,2,2,2,2,7,7,7,2,2],
      [2,2,2,2,2,8,8,8,2,2,2,13,1,1,6,6,6,1,1,13,2,2,2,2,2,7,7,7,2,2],
      [2,2,2,2,2,1,1,1,2,2,2,13,1,1,1,1,1,1,1,13,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,1,1,1,1,1,2,2,2,13,1,1,1,1,1,1,1,13,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    ],
  },
];

export function getRoom(id) { return ROOMS.find(r => r.id === id); }

export function isWalkable(tile) {
  return tile !== T.VOID && tile !== T.WALL && tile !== T.PILLAR;
}

export function getTileAt(room, tx, ty) {
  if (ty < 0 || ty >= room.map.length) return T.VOID;
  if (tx < 0 || tx >= room.map[0].length) return T.VOID;
  return room.map[ty][tx];
}
