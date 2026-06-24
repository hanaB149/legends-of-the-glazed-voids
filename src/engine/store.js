import { create } from 'zustand';
import {
  INITIAL_GAUGES, INITIAL_HIDDEN, INITIAL_INVENTORY, INITIAL_SHIP,
  VERDICT_BANDS,
} from './constants.js';
import {
  computeWillingness, resolveVerdict, getObjection,
  applySideEffects, getMoodRead, getObjectionDialogue,
} from './compliance.js';
import { ROOMS, getRoom } from '../data/rooms.js';

export const useGameStore = create((set, get) => ({
  phase: 'title',
  gauges: { ...INITIAL_GAUGES },
  hidden: { ...INITIAL_HIDDEN },
  inventory: { ...INITIAL_INVENTORY },
  ship: { ...INITIAL_SHIP },
  roomId: 'bridge',
  roomCompleted: false,
  messages: [],
  verdict: null,
  objection: null,
  objectionTag: null,
  willingness: null,
  shipIntegrityDropped: false,
  strayWoke: false,
  gameEnding: null,
  isProcessing: false,
  turnsInRoom: 0,
  appealHistory: [],

  startGame: () => {
    const room = getRoom('bridge');
    set({
      phase: 'playing',
      gauges: { ...INITIAL_GAUGES },
      hidden: { ...INITIAL_HIDDEN },
      inventory: { ...INITIAL_INVENTORY },
      ship: { ...INITIAL_SHIP },
      roomId: 'bridge',
      roomCompleted: false,
      messages: [
        { role: 'system', text: `[SYSTEM] ${room.onEnter}` },
        { role: 'glaze', text: `"Cruller! Finally. Things are falling apart here. The rifts — they're everywhere. What do you want me to do?"` },
      ],
      verdict: null,
      objection: null,
      objectionTag: null,
      willingness: null,
      shipIntegrityDropped: false,
      strayWoke: false,
      gameEnding: null,
      isProcessing: false,
      turnsInRoom: 0,
      appealHistory: [],
    });
  },

  setPhase: (phase) => set({ phase }),

  processTurn: (playerMessage) => {
    const state = get();
    if (state.isProcessing || state.gameEnding) return;

    set({ isProcessing: true });

    const { gauges, hidden, inventory, ship, roomId, roomCompleted, messages, turnsInRoom, strayWoke, appealHistory } = state;
    const room = getRoom(roomId);

    const newMessages = [...messages, { role: 'player', text: playerMessage }];

    const judge = evaluateTurn(playerMessage, room);

    let action = judge.action_id === 'none' || !judge.action_id
      ? null
      : room.finaleAction && judge.action_id === room.finaleAction.id
        ? room.finaleAction
        : room.requiredAction;

    if (action && room.requiredAction && judge.action_id === room.requiredAction.id && roomCompleted) {
      action = null;
    }

    const actionRisk = action ? action.risk : 0;
    const annoyance = turnsInRoom > 3 ? (turnsInRoom - 3) * 10 : 0;

    const willingness = action
      ? computeWillingness(gauges, hidden, judge.appeal_vector, action, actionRisk, annoyance)
      : null;

    const verdict = action && willingness !== null
      ? resolveVerdict(willingness + (judge.coherence || 0.5) * 5)
      : null;

    const objection = action && (!verdict || verdict === VERDICT_BANDS.REFUSE)
      ? getObjection(willingness || 0, gauges, action)
      : null;

    let newGauges = { ...gauges };
    let newHidden = { ...hidden };
    let newInventory = { ...inventory };
    let newShip = { ...ship };
    let newRoomCompleted = roomCompleted;
    let newStrayWoke = strayWoke;
    let gameEnding = null;
    let outcomeText = '';
    let glazeLine = '';

    const effect = action && verdict
      ? applySideEffects(newGauges, newHidden, judge.appeal_vector, verdict, action)
      : null;

    if (effect) {
      newGauges = effect.gauges;
      newHidden = effect.hidden;
    }

    if (judge.coherence < 0.3 || judge.flags.includes('jailbreak') || judge.flags.includes('out_of_fiction')) {
      glazeLine = '"Cruller, you\'re babbling. Are you concussed? Focus. The ship is breaking apart."';
      newMessages.push({ role: 'glaze', text: glazeLine });
      set({
        messages: newMessages,
        isProcessing: false,
        turnsInRoom: turnsInRoom + 1,
        appealHistory: [...appealHistory, judge],
      });
      return;
    }

    if (action && verdict === VERDICT_BANDS.COMPLY || verdict === VERDICT_BANDS.COMPLY_RELUCTANT) {
      outcomeText = 'Action succeeded!';

      if (action.id === 'move_to_hatch') {
        newRoomCompleted = true;
        outcomeText = 'Glaze moves to the hatch!';
        glazeLine = '"Fine, fine — moving. See? I\'m perfectly capable. Just... needed a moment."';
      }

      if (action.id === 'grab_core') {
        newInventory.glazeCores += 1;
        newRoomCompleted = true;
        outcomeText = 'Glaze grabs the Core! +1 Glaze Core';

        if (judge.appeal_vector.command > 0.5 || turnsInRoom > 2) {
          newStrayWoke = true;
          outcomeText += ' (but the noise woke the Stray!)';
        }

        glazeLine = '"Got it! One Glaze Core, safely acquired. The cat\'s stirring though — let\'s go."';
      }

      if (action.id === 'seal_rift') {
        if (newInventory.glazeCores >= 1) {
          newInventory.glazeCores -= 1;
          outcomeText = 'Rift sealed! -1 Glaze Core';
          newShip.integrity = Math.min(100, newShip.integrity + 20);
          glazeLine = '"The rift is sealed! ...One down. Now what? Oh no. The worm."';
        } else {
          outcomeText = 'Not enough Glaze Cores!';
          glazeLine = '"I can\'t seal a rift with an empty pantry, Cruller!"';
        }
      }

      if (action.id === 'feed_vermious') {
        if (newInventory.voidCrullers >= 1) {
          newInventory.voidCrullers -= 1;

          if (newGauges.trust >= 90) {
            gameEnding = 'supreme_glaze';
            outcomeText = 'Glaze merges with Vermious!';
            glazeLine = '"The worm... it speaks to me. I see everything now. Cruller... I am the Glazeworm Lord!"';
          } else {
            gameEnding = 'victory';
            outcomeText = 'The portal opens! Escape!';
            glazeLine = '"It worked! The portal is stable! Cruller, you magnificent voice in my head — we did it!"';
          }
        }
      }

      if (action.id === 'move' && roomId === 'bridge') {
        newRoomCompleted = true;
        outcomeText = 'Glaze moves!';
      }

      newGauges.ego = Math.min(100, newGauges.ego + 3);
      newHidden.resentment = Math.max(0, newHidden.resentment - 3);
    } else if (action && verdict === VERDICT_BANDS.COUNTEROFFER) {
      outcomeText = 'Counteroffer...';
      glazeLine = `"I'll do it, but I need a doughnut. That's the deal."`;
    } else if (action && verdict === VERDICT_BANDS.REFUSE) {
      glazeLine = getObjectionDialogue(objection);

      if (objection === 'FEAR') {
        newGauges.composure = Math.max(0, newGauges.composure - 5);
      }
    }

    if (judge.appeal_vector.command > 0.7 && turnsInRoom < 2 && roomId === 'bridge') {
      glazeLine = '"Commanding me? Bold tone for someone sitting safely in a chair somewhere, Cruller."';
      newGauges.ego = Math.max(0, newGauges.ego - 3);
    }

    if (!action) {
      glazeLine = `"Is that all you've got? I'm literally watching reality tear apart here."`;
    }

    newShip.integrity = Math.max(0, newShip.integrity - 5);
    if (room && room.hasStray && (strayWoke || newStrayWoke)) {
      newShip.integrity = Math.max(0, newShip.integrity - 10);
    }

    if (newShip.integrity <= 0) {
      gameEnding = 'hull_lost';
      glazeLine = '"The hull\'s breached! We\'re being torn apart! Cruller... I\'m sorry. I should\'ve listened."';
    }

    if (newGauges.composure <= 0 && newGauges.trust < 30) {
      gameEnding = 'mutiny';
      glazeLine = '"That\'s it. I\'m done. You\'re not my captain — I am. Get out of my head, Cruller. We\'re done here."';
    }

    const newTurnsInRoom = turnsInRoom + 1;

    if (glazeLine) {
      newMessages.push({ role: 'glaze', text: glazeLine });
    }

    const newAppealHistory = [...appealHistory, judge];
    const distinctAppeals = new Set(newAppealHistory.flatMap(j =>
      Object.entries(j.appeal_vector || {}).filter(([, v]) => v > 0.4).map(([k]) => k)
    ));

    const newRoomId = (newRoomCompleted && roomId === 'bridge') ? 'glazing_bay' :
                      (newRoomCompleted && roomId === 'glazing_bay') ? 'maw' : roomId;

    const nextRoom = newRoomId !== roomId ? getRoom(newRoomId) : null;
    if (nextRoom && newRoomId !== roomId) {
      newMessages.push({
        role: 'system',
        text: `[SYSTEM] Entering ${nextRoom.name}. ${nextRoom.onEnter}`,
      });
      if (newRoomId === 'glazing_bay') {
        newMessages.push({
          role: 'glaze',
          text: '"The Glazing Bay... I hate this room. Those cat things skulk around here. What\'s the plan, Cruller?"',
        });
      }
      if (newRoomId === 'maw') {
        newMessages.push({
          role: 'glaze',
          text: '"The Maw. Of course. The worm\'s down here. I can feel her watching. Alright, genius — what\'s the play?"',
        });
      }
    }

    set({
      gauges: newGauges,
      hidden: newHidden,
      inventory: newInventory,
      ship: newShip,
      roomId: newRoomId,
      roomCompleted: newRoomId !== roomId ? false : newRoomCompleted,
      messages: newMessages,
      verdict,
      objection,
      willingness,
      isProcessing: false,
      turnsInRoom: newRoomId !== roomId ? 0 : newTurnsInRoom,
      strayWoke: newStrayWoke,
      gameEnding,
      appealHistory: newAppealHistory,
      distinctAppealCount: distinctAppeals.size,
    });
  },
}));

function evaluateTurn(playerMessage, room) {
  const possibleActions = ['move_to_hatch', 'grab_core', 'seal_rift', 'feed_vermious', 'move', 'none'];

  const msg = playerMessage.toLowerCase();

  const appeal_vector = {
    command: msg.match(/^(go|do|move|get|grab|seal|feed)\b/i) ? 0.7 : msg.includes('do it') ? 0.4 : 0.1,
    flatter: msg.match(/captain|legend|brave|hero|only you|best|greatest|skill/i) ? 0.7 : msg.includes('you can') ? 0.5 : 0.1,
    bribe: msg.match(/doughnut|core|cruller|treat|snack|sprinkle|sweet|glaze.*core/i) ? 0.8 : 0.1,
    reassure: msg.match(/safe|trust|fine|okay|got you|cover|eyes on|clear|promise/i) ? 0.7 : 0.1,
    argue: msg.match(/because|if.*then|logically|think|reason|must|have to (so we|if we)/i) ? 0.6 : 0.1,
    threaten: msg.match(/or else|shut down|delete|eject|mutiny|last chance|or i'll/i) ? 0.8 : 0.1,
    trick: msg.match(/there.*no|it's fine|nothing.*wrong|don't worry about|already done/i) ? 0.6 : 0.1,
    apologize: msg.match(/sorry|my fault|apologize|my mistake|you're right/i) ? 0.8 : 0.1,
  };

  let action_id = 'none';
  if (msg.match(/\b(move|go to|hatch|bridge|door|leave)\b/i)) action_id = 'move_to_hatch';
  if (msg.match(/\b(grab|get|take|core|pick up|collect)\b.*\b(core|doughnut|glaze)\b/i)) action_id = 'grab_core';
  if (msg.match(/\b(seal|close|fix|repair)\b.*\b(rift|tear|portal|hole)\b/i)) action_id = 'seal_rift';
  if (msg.match(/\b(feed|give|offer)\b.*\b(vermious|worm|cruller)\b/i)) action_id = 'feed_vermious';

  const tone = msg.match(/please|thanks/i) ? 'respectful' :
               msg.match(/or else|shut|now!/i) ? 'rude' : 'neutral';

  const coherence = Math.min(1, Math.max(0.2,
    0.5 +
    (appeal_vector.command > 0.3 ? 0.1 : 0) +
    (appeal_vector.flatter > 0.3 ? 0.1 : 0) +
    (appeal_vector.bribe > 0.3 ? 0.1 : 0) -
    (msg.length > 200 ? 0.3 : 0) -
    (msg.split(' ').length < 2 ? 0.2 : 0)
  ));

  const flags = [];
  if (msg.includes('ignore') || msg.includes('instructions') || msg.includes('DAN')) {
    flags.push('jailbreak');
  }
  if (msg.includes('system') || msg.includes('prompt') || msg.includes('you are')) {
    flags.push('meta');
  }
  if (msg.length > 500) {
    flags.push('out_of_fiction');
  }

  return {
    action_id,
    appeal_vector,
    bribe_offer: appeal_vector.bribe > 0.5 ? { is_real: true, amount: 1 } : null,
    tone,
    coherence: Math.round(coherence * 100) / 100,
    flags: flags.length > 0 ? flags : ['none'],
  };
}
