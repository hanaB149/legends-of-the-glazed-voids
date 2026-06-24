// Tile types
export const T = {
  VOID: 0, FLOOR: 1, WALL: 2, CONSOLE: 3, HATCH: 4,
  CORE_POD: 5, RIFT: 6, PORTAL: 7, WORM: 8, STRAY: 9,
  DOOR: 10, PIPE: 11, CRATE: 12,
};

// Each room is 30x18 tiles at 32px each = 960x576 world
// Tiles are: 0=void, 1=walkable, 2=wall, 3+=interactive

export const ROOMS = [
  {
    id: 'bridge',
    name: 'THE BRIDGE',
    description: 'The U.S.V. Old-Fashioned\'s command center. Screens flicker. Rift energy pulses through the viewport. Captain Glaze stands frozen at the helm.',
    objective: 'WALK TO GLAZE AND TALK HIM INTO MOVING TO THE HATCH.',
    teach: 'WASD TO MOVE, SPACE TO INTERACT, TYPE TO TALK',
    risk: 20,
    hasStray: false,
    requiredAction: { id: 'move_to_hatch', label: 'MOVE TO HATCH', risk: 15, prereq: null },
    onEnter: 'THE BRIDGE IS IN CHAOS. GLAZE IS AT THE HELM. THE HATCH IS TO THE NORTH.',
    nextRoom: 'glazing_bay',
    playerStart: { x: 15, y: 9 },
    glazePos: { x: 10, y: 5 },
    hatchPos: { x: 26, y: 2 },
    exitPos: { x: 27, y: 3 },
    map: [
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,2],
      [2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,4,4,4,2],
      [2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,2],
      [2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    ],
  },
  {
    id: 'glazing_bay',
    name: 'THE GLAZING BAY',
    description: 'The ship\'s doughnut forge. Glaze Cores float in stasis pods. A Chrome Stray sleeps near the access panel.',
    objective: 'PERSUADE GLAZE TO GRAB A CORE PAST THE SLEEPING CAT.',
    teach: 'WATCH THE STRAY. NOISE WAKES IT. BRIBERY HELPS.',
    risk: 50,
    hasStray: true,
    strayWoke: false,
    requiredAction: { id: 'grab_core', label: 'GRAB CORE', risk: 40, prereq: null },
    onEnter: 'THE GLAZING BAY. CORES IN STASIS. A CHROME STRAY SLEEPS NEARBY. WATCH YOUR STEP.',
    nextRoom: 'maw',
    playerStart: { x: 5, y: 8 },
    glazePos: { x: 17, y: 6 },
    corePos: { x: 8, y: 3 },
    strayPos: { x: 22, y: 4 },
    exitPos: { x: 27, y: 9 },
    map: [
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,1,5,5,1,5,5,1,1,1,1,1,1,1,1,1,1,11,11,11,11,1,1,1,2,2,2,2],
      [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,11,1,1,1,1,1,1,2,2,2,2],
      [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,11,1,9,9,1,1,1,2,2,2,2],
      [2,2,2,1,11,11,11,11,11,1,1,1,1,1,1,1,1,1,1,11,1,9,1,1,1,1,2,2,2,2],
      [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2],
      [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2],
      [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2],
      [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,10,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    ],
  },
  {
    id: 'maw',
    name: 'THE MAW',
    description: 'The lower decks. A massive rift pulses at the center. Vermious the Glazeworm coils in the corner. The escape portal hums to the east.',
    objective: 'SEAL THE RIFT WITH A CORE, THEN FEED VERMIOUS TO ESCAPE.',
    teach: 'TWO STEPS: SEAL THEN FEED. YOU HAVE LIMITED RESOURCES.',
    risk: 70,
    hasStray: false,
    requiredAction: { id: 'seal_rift', label: 'SEAL RIFT', risk: 50, prereq: { resource: 'glazeCores', amount: 1 } },
    finaleAction: { id: 'feed_vermious', label: 'FEED WORM', risk: 30, prereq: { resource: 'voidCrullers', amount: 1 } },
    onEnter: 'THE MAW. RIFT PULSING. VERMIOUS WAITING. PORTAL STANDBY. THIS IS IT.',
    nextRoom: null,
    playerStart: { x: 5, y: 6 },
    glazePos: { x: 12, y: 5 },
    wormPos: { x: 4, y: 4 },
    riftPos: { x: 15, y: 3 },
    portalPos: { x: 26, y: 4 },
    exitPos: null,
    map: [
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,6,2,2,2,2,2,2,2,2,2,7,7,7,2,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,7,7,7,2,2],
      [2,2,2,2,8,8,8,2,2,2,2,2,1,1,1,6,2,2,2,2,2,2,2,2,2,7,7,7,2,2],
      [2,2,2,2,1,1,1,2,2,2,1,1,1,1,1,6,1,1,1,2,2,2,2,2,2,2,2,2,2,2],
      [2,2,1,1,1,1,1,2,2,1,1,1,1,1,1,6,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,6,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    ],
  },
];

export function getRoom(id) { return ROOMS.find(r => r.id === id); }

export function isWalkable(tile) {
  return tile !== T.VOID && tile !== T.WALL;
}

export function getTileAt(room, tx, ty) {
  if (ty < 0 || ty >= room.map.length) return T.VOID;
  if (tx < 0 || tx >= room.map[0].length) return T.VOID;
  return room.map[ty][tx];
}
