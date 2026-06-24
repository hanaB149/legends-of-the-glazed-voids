export const ROOMS = [
  {
    id: 'bridge',
    name: 'The Bridge',
    description: 'The U.S.V. Old-Fashioned\'s command center. Screens flicker with warning alerts. Through the viewport, swirling purple rifts tear space itself. Captain Glaze stands frozen at the helm, staring at the chaos.',
    objective: 'Get Captain Glaze to unfreeze and move to the hatch.',
    teach: 'Reading mood; command vs flatter vs reassure',
    risk: 20,
    hasStray: false,
    requiredAction: { id: 'move_to_hatch', label: 'Move to the Hatch', risk: 15, prereq: null },
    onEnter: 'The Captain seems frozen. Better figure out what motivates him.',
    nextRoom: 'glazing_bay',
  },
  {
    id: 'glazing_bay',
    name: 'The Glazing Bay',
    description: 'The ship\'s doughnut forge. Glaze Cores float in stasis fields. A Chrome Stray — half-cat, half-machine — sleeps near the only access panel. The floor hums with unstable energy.',
    objective: 'Grab a Glaze Core past the dormant Chrome Stray.',
    teach: 'FEAR objection; reassure under risk; bribe-for-courage; noise wakes the Stray',
    risk: 50,
    hasStray: true,
    strayWoke: false,
    requiredAction: { id: 'grab_core', label: 'Grab the Glaze Core', risk: 40, prereq: null },
    onEnter: 'A Chrome Stray is sleeping nearby. One wrong move and it\'ll wake up.',
    nextRoom: 'maw',
  },
  {
    id: 'maw',
    name: 'The Maw (Engineering)',
    description: 'The lower decks. A massive rift pulses in the center of the room, Zurich nowhere. Vermious the Glazeworm coils around a broken console, watching with ancient, knowing eyes. The escape portal hums behind her.',
    objective: 'Seal the rift (-1 Glaze Core), then feed Vermious (-1 Void Cruller) to escape.',
    teach: 'Resource tradeoff; scare-inaction lever; finale negotiation',
    risk: 70,
    hasStray: false,
    requiredAction: { id: 'seal_rift', label: 'Seal the Rift', risk: 50, prereq: { resource: 'glazeCores', amount: 1 } },
    finaleAction: { id: 'feed_vermious', label: 'Feed Vermious', risk: 30, prereq: { resource: 'voidCrullers', amount: 1 } },
    onEnter: 'This is it. Seal the rift, feed the worm, and get out.',
    nextRoom: null,
  },
];

export function getRoom(id) {
  return ROOMS.find(r => r.id === id);
}
