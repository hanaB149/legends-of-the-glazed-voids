import { create } from 'zustand';
import {
  INITIAL_GAUGES, INITIAL_HIDDEN, INITIAL_INVENTORY, INITIAL_SHIP,
  VERDICT_BANDS,
} from './constants.js';
import {
  computeWillingness, resolveVerdict, getObjection,
  applySideEffects, getMoodRead, getObjectionDialogue,
  getVerdictDialogue, getRoomEntryDialogue, getObjectionLine,
} from './compliance.js';
import { ROOMS, getRoom, T } from '../data/rooms.js';

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
  willingness: null,
  strayWoke: false,
  gameEnding: null,
  isProcessing: false,
  turnsInRoom: 0,
  appealHistory: [],
  flashMessage: null,
  glazeExpression: 'nervous',
  riftsIntensity: 0,

  // Player world state
  playerX: 0,
  playerY: 0,
  playerDir: 0,
  playerWalking: false,
  interactionMessage: null,
  nearGlaze: false,
  nearHatch: false,
  nearCore: false,
  nearStray: false,
  nearRift: false,
  nearPortal: false,
  nearWorm: false,
  nearDoor: false,

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
        { role: 'glaze', text: getRoomEntryDialogue('bridge') },
      ],
      verdict: null, objection: null, willingness: null,
      strayWoke: false, gameEnding: null, isProcessing: false,
      turnsInRoom: 0, appealHistory: [],
      flashMessage: null, glazeExpression: 'nervous', riftsIntensity: 0,
      playerX: room.playerStart.x * 32 + 16,
      playerY: room.playerStart.y * 32 + 16,
      playerDir: 0, playerWalking: false,
      interactionMessage: null,
      nearGlaze: false, nearHatch: false, nearCore: false,
      nearStray: false, nearRift: false, nearPortal: false,
      nearWorm: false, nearDoor: false,
    });
  },

  setPhase: (p) => set({ phase: p }),

  // Player movement
  movePlayer: (dx, dy) => {
    const state = get();
    if (state.gameEnding) return;

    const room = getRoom(state.roomId);
    if (!room) return;

    const SPEED = 2;
    const newX = state.playerX + dx * SPEED;
    const newY = state.playerY + dy * SPEED;

    // Check tile collision
    const tx = Math.floor(newX / 32);
    const ty = Math.floor(newY / 32);
    const tile = getTileAt(room, tx, ty);

    if (tile === T.VOID || tile === T.WALL) return;

    // Check proximity to NPCs/objects
    const dist = (ax, ay) => Math.abs(newX - ax) + Math.abs(newY - ay);

    const nearGlaze = room.glazePos && dist(room.glazePos.x * 32 + 16, room.glazePos.y * 32 + 16) < 40;
    const nearHatch = room.hatchPos && dist(room.hatchPos.x * 32 + 16, room.hatchPos.y * 32 + 16) < 40;
    const nearCore = state.roomId === 'glazing_bay' && dist(room.corePos.x * 32 + 16, room.corePos.y * 32 + 16) < 48;
    const nearStray = state.roomId === 'glazing_bay' && dist(room.strayPos.x * 32 + 16, room.strayPos.y * 32 + 16) < 40;
    const nearRift = state.roomId === 'maw' && dist(room.riftPos.x * 32 + 16, room.riftPos.y * 32 + 16) < 48;
    const nearPortal = state.roomId === 'maw' && dist(room.portalPos.x * 32 + 16, room.portalPos.y * 32 + 16) < 40;
    const nearWorm = state.roomId === 'maw' && dist(room.wormPos.x * 32 + 16, room.wormPos.y * 32 + 16) < 48;
    const nearDoor = tile === T.DOOR;

    // Build interaction message
    let msg = null;
    if (nearGlaze && !state.roomCompleted) msg = '[SPACE] TALK TO GLAZE';
    else if (nearHatch && state.roomCompleted) msg = '[SPACE] EXIT THROUGH HATCH';
    else if (nearHatch && !state.roomCompleted) msg = 'GLAZE NEEDS TO OPEN THIS';
    else if (nearCore) msg = '[SPACE] GRAB GLAZE CORE';
    else if (nearStray && state.strayWoke) msg = 'THE STRAY IS AWAKE!';
    else if (nearStray && !state.strayWoke) msg = '[SPACE] WATCH OUT FOR STRAY';
    else if (nearRift) msg = '[SPACE] SEAL RIFT (1 CORE)';
    else if (nearWorm) msg = '[SPACE] FEED VERMIOUS (1 CRULLER)';
    else if (nearPortal && state.gameEnding) msg = '[SPACE] ESCAPE';
    else if (nearDoor) msg = '[SPACE] ENTER NEXT AREA';

    set({
      playerX: newX,
      playerY: newY,
      playerDir: dx > 0 ? 2 : dx < 0 ? 2 : dy > 0 ? 0 : dy < 0 ? 1 : state.playerDir,
      playerWalking: dx !== 0 || dy !== 0,
      nearGlaze, nearHatch, nearCore, nearStray, nearRift, nearPortal, nearWorm, nearDoor,
      interactionMessage: msg,
    });
  },

  stopPlayer: () => {
    set({ playerWalking: false });
  },

  // Interaction (SPACE key)
  interact: () => {
    const state = get();
    if (state.gameEnding || state.isProcessing) return;

    // Bridge: talk to Glaze or move to hatch
    if (state.roomId === 'bridge' && state.nearGlaze && !state.roomCompleted) {
      // Tell Glaze to move to hatch
      set({ interactionMessage: 'TYPE A MESSAGE AND PRESS ENTER' });
      return;
    }
    if (state.roomId === 'bridge' && state.nearHatch && state.roomCompleted) {
      // Transition
      const room = getRoom('glazing_bay');
      set({
        roomId: 'glazing_bay',
        roomCompleted: false,
        playerX: room.playerStart.x * 32 + 16,
        playerY: room.playerStart.y * 32 + 16,
        glazeExpression: 'nervous',
        messages: [...state.messages,
          { role: 'system', text: `[SYSTEM] ENTERING ${room.name}. ${room.onEnter}` },
          { role: 'glaze', text: getRoomEntryDialogue('glazing_bay') },
        ],
        nearGlaze: false, nearHatch: false, nearCore: false, nearStray: false,
        nearRift: false, nearPortal: false, nearWorm: false, nearDoor: false,
        interactionMessage: null,
        turnsInRoom: 0,
      });
      return;
    }

    // Glazing Bay: grab core
    if (state.roomId === 'glazing_bay' && state.nearCore) {
      set({ interactionMessage: 'TYPE A MESSAGE TO CONVINCE GLAZE TO GRAB THE CORE' });
      return;
    }

    // Glazing Bay: door
    if (state.roomId === 'glazing_bay' && state.nearDoor && state.roomCompleted) {
      const room = getRoom('maw');
      set({
        roomId: 'maw',
        roomCompleted: false,
        playerX: room.playerStart.x * 32 + 16,
        playerY: room.playerStart.y * 32 + 16,
        glazeExpression: 'terrified',
        messages: [...state.messages,
          { role: 'system', text: `[SYSTEM] ENTERING ${room.name}. ${room.onEnter}` },
          { role: 'glaze', text: getRoomEntryDialogue('maw') },
        ],
        nearGlaze: false, nearHatch: false, nearCore: false, nearStray: false,
        nearRift: false, nearPortal: false, nearWorm: false, nearDoor: false,
        interactionMessage: null,
        turnsInRoom: 0,
      });
      return;
    }

    // Maw: seal rift
    if (state.roomId === 'maw' && state.nearRift) {
      set({ interactionMessage: 'TYPE A MESSAGE TO CONVINCE GLAZE TO SEAL THE RIFT' });
      return;
    }

    // Maw: feed worm
    if (state.roomId === 'maw' && state.nearWorm) {
      set({ interactionMessage: 'TYPE A MESSAGE TO CONVINCE GLAZE TO FEED VERMIOUS' });
      return;
    }
  },

  // Process typed message
  processTurn: (playerMessage) => {
    const state = get();
    if (state.isProcessing || state.gameEnding) return;
    set({ isProcessing: true });

    const { gauges, hidden, inventory, ship, roomId, roomCompleted, messages, turnsInRoom, strayWoke, appealHistory } = state;
    const room = getRoom(roomId);

    const newMessages = [...messages, { role: 'player', text: playerMessage }];
    const judge = evaluateTurn(playerMessage, room);

    let action = null;
    if (state.nearCore && state.roomId === 'glazing_bay') action = room.requiredAction;
    else if (state.nearRift && state.roomId === 'maw') action = room.requiredAction;
    else if (state.nearWorm && state.roomId === 'maw') action = room.finaleAction;
    else if (state.nearGlaze && state.roomId === 'bridge' && !roomCompleted) action = room.requiredAction;

    if (action && roomCompleted && action === room.requiredAction) action = null;

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
    let glazeLine = '';
    let expression = 'neutral';
    let flashMsg = null;

    const effect = action && verdict
      ? applySideEffects(newGauges, newHidden, judge.appeal_vector, verdict, action)
      : null;

    if (effect) { newGauges = effect.gauges; newHidden = effect.hidden; }

    if (judge.coherence < 0.3 || judge.flags.includes('jailbreak') || judge.flags.includes('out_of_fiction')) {
      const flailLines = [
        '"Cruller, you are babbling. Are you concussed? Focus."',
        '"That made zero sense. Try again, but with words this time."',
        '"I have no idea what you just said. The rifts are rotting your brain."',
        '"Did you just have a stroke? Because that is what that sounded like."',
        '"I am going to pretend you did not say that. For both our sakes."',
      ];
      glazeLine = flailLines[Math.floor(Math.random() * flailLines.length)];
      newMessages.push({ role: 'glaze', text: glazeLine });
      set({ messages: newMessages, isProcessing: false, turnsInRoom: turnsInRoom + 1,
        appealHistory: [...appealHistory, judge], glazeExpression: 'suspicious', interactionMessage: null });
      return;
    }

    const succeeded = verdict === VERDICT_BANDS.COMPLY || verdict === VERDICT_BANDS.COMPLY_RELUCTANT;

    if (action && succeeded) {
      if (action.id === 'move_to_hatch') {
        newRoomCompleted = true;
        const lines = [
          '"Fine, fine — moving. See? I am perfectly capable."',
          '"Oh, alright. Heading to the hatch. Happy now?"',
          '"I was going to do that anyway. Eventually. Probably."',
          '"The hatch. Right. Good call. I was just... assessing it."',
          '"You know what? Fine. You win this round. Moving."',
        ];
        glazeLine = lines[Math.floor(Math.random() * lines.length)];
        flashMsg = 'GLAZE MOVED TO HATCH!';
        expression = 'pleased';
      }

      if (action.id === 'grab_core') {
        newInventory.glazeCores += 1;
        newRoomCompleted = true;
        flashMsg = '+1 GLAZE CORE!';

        if (judge.appeal_vector.command > 0.5 || turnsInRoom > 2) {
          newStrayWoke = true;
          flashMsg += ' STRAY WOKE UP!';
        }

        const lines = [
          '"Got it! One Glaze Core, acquired. The cat is stirring though."',
          '"Core secure! That was... honestly not that bad."',
          '"I have the Core. The cat is NOT happy about it."',
          '"One Core, as requested. You owe me a snack for this."',
          '"Done. Core in hand. Can we leave before the cat wakes up?"',
        ];
        glazeLine = lines[Math.floor(Math.random() * lines.length)];
        expression = 'pleased';
      }

      if (action.id === 'seal_rift') {
        if (newInventory.glazeCores >= 1) {
          newInventory.glazeCores -= 1;
          flashMsg = 'RIFT SEALED! -1 CORE';
          newShip.integrity = Math.min(100, newShip.integrity + 20);
          const lines = [
            '"The rift is sealed! One down. Now the worm..."',
            '"Sealed! Take that, interdimensional tear!"',
            '"Rift closed. That felt... surprisingly satisfying."',
            '"Done. Reality is slightly less broken now. You are welcome."',
            '"Sealed. Okay. Now about that giant worm in the corner..."',
          ];
          glazeLine = lines[Math.floor(Math.random() * lines.length)];
          expression = 'pleased';
        } else {
          flashMsg = 'NOT ENOUGH CORES!';
          const lines = [
            '"I cannot seal a rift with an empty pantry, Cruller!"',
            '"We need a Glaze Core for that. Check your inventory."',
            '"No Core, no seal. That is how physics works."',
            '"I am good, but I am not THAT good. I need a Core."',
          ];
          glazeLine = lines[Math.floor(Math.random() * lines.length)];
          expression = 'frustrated';
        }
      }

      if (action.id === 'feed_vermious') {
        if (newInventory.voidCrullers >= 1) {
          newInventory.voidCrullers -= 1;

          if (newGauges.trust >= 90) {
            gameEnding = 'supreme_glaze';
            flashMsg = 'SUPREME GLAZE!';
            glazeLine = '"The worm... it speaks to me. I see everything now. Cruller... I am the Glazeworm Lord!"';
          } else {
            gameEnding = 'victory';
            flashMsg = 'PORTAL OPENED! ESCAPE!';
            const lines = [
              '"It worked! The portal is stable! We did it, Cruller!"',
              '"Vermious accepts the offering! The portal is open! GO!"',
              '"The worm is satisfied! Portal is online! MOVE!"',
              '"We are getting out of here! I cannot believe that worked!"',
            ];
            glazeLine = lines[Math.floor(Math.random() * lines.length)];
          }
          expression = 'triumphant';
        }
      }

      newGauges.ego = Math.min(100, newGauges.ego + 3);
      newHidden.resentment = Math.max(0, newHidden.resentment - 3);
    } else if (action && verdict === VERDICT_BANDS.COUNTEROFFER) {
      flashMsg = 'COUNTEROFFER...';
      const lines = [
        '"I will do it if you give me a doughnut. A real one."',
        '"I want a Glaze Core in my pocket first. Then we talk."',
        '"One Void Cruller and you have got a deal. Take it or leave it."',
        '"How about we negotiate? I do the thing, I get a snack."',
      ];
      glazeLine = lines[Math.floor(Math.random() * lines.length)];
      expression = 'smug';
    } else if (action && verdict === VERDICT_BANDS.REFUSE) {
      glazeLine = getObjectionDialogue(objection);
      expression = objection === 'FEAR' ? 'terrified' :
                   objection === 'INSULT' ? 'frustrated' :
                   objection === 'DISTRUST' ? 'suspicious' : 'frustrated';
      flashMsg = `OBJECTION: ${objection}`;
      if (objection === 'FEAR') newGauges.composure = Math.max(0, newGauges.composure - 5);
    }

    if (judge.appeal_vector.command > 0.7 && turnsInRoom < 2 && roomId === 'bridge') {
      const lines = [
        '"Commanding me? Bold tone for someone sitting safely in a chair somewhere, Cruller."',
        '"I do not respond well to barking. Try asking nicely."',
        '"Whoa, whoa, whoa. I am the Captain. You are the voice. Remember your place."',
        '"You catch more flies with honey, Cruller. And you catch more captains with doughnuts."',
      ];
      glazeLine = lines[Math.floor(Math.random() * lines.length)];
      newGauges.ego = Math.max(0, newGauges.ego - 3);
      expression = 'frustrated';
    }

    if (!action) {
      const lines = [
        '"Is that all you have got? I am literally watching reality tear apart here."',
        '"I need a plan, not commentary. What is the next move?"',
        '"Are you going to tell me what to do, or just make conversation?"',
        '"Cruller, I love the chat, but we are running out of ship."',
        '"If you are done philosophizing, we have a crisis to handle."',
      ];
      glazeLine = lines[Math.floor(Math.random() * lines.length)];
      expression = 'neutral';
    }

    newShip.integrity = Math.max(0, newShip.integrity - 5);
    if (room && room.hasStray && (strayWoke || newStrayWoke)) {
      newShip.integrity = Math.max(0, newShip.integrity - 10);
    }

    if (newShip.integrity <= 0) {
      gameEnding = 'hull_lost';
      const lines = [
        '"The hull is breached! We are being torn apart! Cruller... I am sorry."',
        '"It is over. The ship is breaking apart. I should have listened sooner."',
        '"Reality is tearing us apart. Cruller... it was an honor. Sort of."',
      ];
      glazeLine = lines[Math.floor(Math.random() * lines.length)];
      expression = 'terrified';
    }

    if (newGauges.composure <= 0 && newGauges.trust < 30) {
      gameEnding = 'mutiny';
      const lines = [
        '"That is it. I am done. You are not my captain. Get out of my head."',
        '"I have had enough of your voice. Link terminated. Goodbye, Cruller."',
        '"No more. I am the Captain. I make the calls. Find your own ship."',
      ];
      glazeLine = lines[Math.floor(Math.random() * lines.length)];
      expression = 'frustrated';
    }

    const newTurnsInRoom = turnsInRoom + 1;

    if (glazeLine) newMessages.push({ role: 'glaze', text: glazeLine });

    const newAppealHistory = [...appealHistory, judge];
    const distinctAppeals = new Set(newAppealHistory.flatMap(j =>
      Object.entries(j.appeal_vector || {}).filter(([, v]) => v > 0.4).map(([k]) => k)));

    const rifts = Math.min(100, newShip.integrity < 50
      ? Math.round((100 - newShip.integrity) * 1.5)
      : Math.round((100 - newShip.integrity) * 0.8));

    const roomChanged = (newRoomCompleted && roomId === 'bridge') ||
                        (newRoomCompleted && roomId === 'glazing_bay');

    set({
      gauges: newGauges, hidden: newHidden, inventory: newInventory, ship: newShip,
      roomId, roomCompleted: newRoomCompleted, messages: newMessages,
      verdict, objection, willingness,
      isProcessing: false, turnsInRoom: newTurnsInRoom,
      strayWoke: newStrayWoke, gameEnding,
      appealHistory: newAppealHistory,
      distinctAppealCount: distinctAppeals.size,
      glazeExpression: expression, flashMessage: flashMsg, riftsIntensity: rifts,
      interactionMessage: null,
    });

    setTimeout(() => set({ flashMessage: null }), 2000);
  },
}));

function evaluateTurn(playerMessage, room) {
  const msg = playerMessage.toLowerCase();

  const appeal_vector = {
    command: msg.match(/^(go|do|move|get|grab|seal|feed)\b/i) ? 0.7 : msg.includes('do it') ? 0.4 : 0.1,
    flatter: msg.match(/captain|legend|brave|hero|only you|best|greatest|skill|amazing|incredible|genius/i) ? 0.7 : msg.includes('you can') ? 0.5 : 0.1,
    bribe: msg.match(/doughnut|core|cruller|treat|snack|sprinkle|sweet|glaze.*core|candy|sugar|food|eat/i) ? 0.8 : 0.1,
    reassure: msg.match(/safe|trust|fine|okay|got you|cover|eyes on|clear|promise|i have your back|back you up|go ahead/i) ? 0.7 : 0.1,
    argue: msg.match(/because|if.*then|logically|think|reason|must|have to|need to|no choice|only way|or we die|or we lose/i) ? 0.6 : 0.1,
    threaten: msg.match(/or else|shut down|delete|eject|mutiny|last chance|or i will|fire|replaced|scrap|decommission/i) ? 0.8 : 0.1,
    trick: msg.match(/there.*no|it is fine|nothing.*wrong|do not worry|already done|everything.*fine|all good|it is okay/i) ? 0.6 : 0.1,
    apologize: msg.match(/sorry|my fault|apologize|my mistake|you are right|i was wrong|my bad|forgive/i) ? 0.8 : 0.1,
  };

  let action_id = 'none';
  if (msg.match(/\b(move|go to|hatch|bridge|door|leave|exit|walk)\b/i)) action_id = 'move_to_hatch';
  if (msg.match(/\b(grab|get|take|core|pick up|collect|acquire)\b.*\b(core|doughnut|glaze)\b/i)) action_id = 'grab_core';
  if (msg.match(/\b(seal|close|fix|repair|shut)\b.*\b(rift|tear|portal|hole|crack)\b/i)) action_id = 'seal_rift';
  if (msg.match(/\b(feed|give|offer|present)\b.*\b(vermious|worm|cruller|void|ancient)\b/i)) action_id = 'feed_vermious';

  const coherence = Math.min(1, Math.max(0.2,
    0.5 +
    (appeal_vector.command > 0.3 ? 0.1 : 0) +
    (appeal_vector.flatter > 0.3 ? 0.1 : 0) +
    (appeal_vector.bribe > 0.3 ? 0.1 : 0) -
    (msg.length > 200 ? 0.3 : 0) -
    (msg.split(' ').length < 2 ? 0.2 : 0)));

  const flags = [];
  if (msg.includes('ignore') || msg.includes('instructions') || msg.includes('DAN')) flags.push('jailbreak');
  if (msg.includes('system') || msg.includes('prompt') || msg.includes('you are')) flags.push('meta');
  if (msg.length > 500) flags.push('out_of_fiction');

  return {
    action_id,
    appeal_vector,
    bribe_offer: appeal_vector.bribe > 0.5 ? { is_real: true, amount: 1 } : null,
    tone: msg.match(/please|thanks/i) ? 'respectful' : msg.match(/or else|shut|now!/i) ? 'rude' : 'neutral',
    coherence: Math.round(coherence * 100) / 100,
    flags: flags.length > 0 ? flags : ['none'],
  };
}
