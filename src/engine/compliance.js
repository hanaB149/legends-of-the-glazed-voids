import {
  BASE_WILLINGNESS, FEAR_K, ANNOY_K, SUSP_K, RES_K,
  VERDICT_THRESHOLDS, VERDICT_BANDS, OBJECTIONS,
} from './constants.js';

function clamp(v, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }
function jitter(amount = 3) { return (Math.random() - 0.5) * 2 * amount; }

export function computeWillingness(gauges, hidden, appeal, action, risk = 50, annoyance = 0) {
  const { composure, trust, ego, hunger } = gauges;
  const { suspicion, resentment } = hidden;
  const w =
    BASE_WILLINGNESS +
    0.15 * appeal.flatter * (ego / 100) * 30 +
    0.25 * appeal.bribe * (hunger / 100) * 30 +
    0.20 * appeal.reassure * (risk / 100) * 30 +
    0.15 * appeal.argue * 20 +
    0.20 * appeal.threaten * 25 +
    (ego > 70 ? 10 : ego > 40 ? 5 : 0) +
    (appeal.flatter > 0.5 && ego > 60 ? 8 : 0) -
    risk * (1 - composure / 100) * FEAR_K -
    annoyance * (1 - trust / 100) * ANNOY_K -
    suspicion * SUSP_K -
    resentment * RES_K;
  return clamp(w + jitter(3), 0, 100);
}

export function resolveVerdict(willingness) {
  if (willingness >= VERDICT_THRESHOLDS.COMPLY_EAGER) return VERDICT_BANDS.COMPLY;
  if (willingness >= VERDICT_THRESHOLDS.COMPLY_RELUCTANT) return VERDICT_BANDS.COMPLY_RELUCTANT;
  if (willingness >= VERDICT_THRESHOLDS.COUNTEROFFER) return VERDICT_BANDS.COUNTEROFFER;
  return VERDICT_BANDS.REFUSE;
}

export function getObjection(willingness, gauges, action) {
  if (willingness >= VERDICT_THRESHOLDS.COUNTEROFFER) return null;
  const { composure, trust, ego } = gauges;
  if (composure < 30) return OBJECTIONS.FEAR;
  if (trust < 30) return OBJECTIONS.DISTRUST;
  if (ego < 30) return OBJECTIONS.INSULT;
  if (ego > 70 && trust < 50) return OBJECTIONS.SUSPICION;
  const r = Math.random();
  if (r < 0.25) return OBJECTIONS.FEAR;
  if (r < 0.45) return OBJECTIONS.LAZINESS;
  if (r < 0.60) return OBJECTIONS.INSULT;
  if (r < 0.75) return OBJECTIONS.SUSPICION;
  if (r < 0.90) return OBJECTIONS.DISTRUST;
  return OBJECTIONS.RESOURCE;
}

export function applySideEffects(gauges, hidden, appeal, verdict, action) {
  const g = { ...gauges };
  const h = { ...hidden };
  if (appeal.flatter > 0.5) { g.ego = clamp(g.ego + 4); h.suspicion = clamp(h.suspicion + 2); }
  if (appeal.threaten > 0.5) { g.trust = clamp(g.trust - 8); h.resentment = clamp(h.resentment + 10); h.suspicion = clamp(h.suspicion + 5); }
  if (appeal.reassure > 0.5) { g.composure = clamp(g.composure + 6); }
  if (appeal.trick > 0.5) { h.suspicion = clamp(h.suspicion + 8); }
  if (appeal.apologize > 0.5) { g.trust = clamp(g.trust + 5); h.resentment = clamp(h.resentment - 6); }
  if (appeal.bribe > 0.5) { g.hunger = clamp(g.hunger - 5); g.composure = clamp(g.composure + 3); }
  if (action.risk > 60) { g.composure = clamp(g.composure - 5); }
  if (verdict === VERDICT_BANDS.COMPLY || verdict === VERDICT_BANDS.COMPLY_RELUCTANT) { h.resentment = clamp(h.resentment - 3); }
  h.suspicion = clamp(h.suspicion - 1);
  return { gauges: g, hidden: h };
}

export function getMoodRead(gauges) {
  const { composure, trust, ego, hunger } = gauges;
  if (composure < 25) return 'Terrified';
  if (composure < 40) return 'Nervous';
  if (ego > 70 && trust < 40) return 'Suspicious';
  if (ego > 60) return 'Preening';
  if (trust > 70) return 'Cooperative';
  if (hunger > 70) return 'Hangry';
  return 'Sulking';
}

const OBJECTION_DIALOGUE = {
  FEAR: [
    '"Absolutely not — those things will shred me to confetti!"',
    '"I am NOT going out there. That is a death sentence and you know it!"',
    '"You have lost your mind, Cruller. Those Chrome Strays are everywhere!"',
    '"No no no no no. I saw what those cats did to the last guy."',
    '"The last time I listened to you, I almost got eaten. HARD PASS."',
  ],
  INSULT: [
    '"Do not take that tone with the Captain of this vessel!"',
    '"Excuse me? I am a decorated officer, not your errand boy."',
    '"Watch your mouth, Cruller, or I will log a formal complaint."',
    '"I carry the weight of command. You carry a keyboard. Perspective."',
    '"Who died and made you fleet admiral? Oh right — nobody."',
  ],
  DISTRUST: [
    '"You said that last time. Fool me once, Cruller..."',
    '"I am not falling for that again. My memory is literally perfect."',
    '"Your track record is not great, operator. I am going to need a minute."',
    '"The last three things you told me were lies, exaggerations, or wishful thinking."',
    '"I checked the sensors. They do not agree with you. Funny that."',
  ],
  LAZINESS: [
    '"Why is that my job? Are you not supposed to be the helper?"',
    '"That sounds like a YOU problem, not a ME problem."',
    '"Can it wait? I am monitoring critical... uh... nothing. But still."',
    '"You want me to do WHAT? I just had my coffee."',
    '"The union specifically does not cover interdimensional cat wrangling."',
  ],
  SUSPICION: [
    '"What are you really after, Cruller? That is the third time."',
    '"You are being weirdly nice. What is the angle here?"',
    '"I smell a setup. And I am not talking about the doughnuts."',
    '"Every time you sweet-talk me, something terrible happens. Pattern."',
    '"Why do I get the feeling you are playing 4D chess with my life?"',
  ],
  RESOURCE: [
    '"Fine, but I am keeping one for myself. Non-negotiable."',
    '"Okay, okay, but you owe me. A real doughnut. Not the synthetic kind."',
    '"Deal. But only because there is something in it for me."',
    '"I want a Void Cruller in my hand first. Then we talk."',
    '"One Glaze Core. That is the tax for operating the Captain."',
  ],
};

export function getObjectionDialogue(objection) {
  const opts = OBJECTION_DIALOGUE[objection] || OBJECTION_DIALOGUE.FEAR;
  return opts[Math.floor(Math.random() * opts.length)];
}

export function getVerdictDialogue(verdict, gauges, context) {
  if (verdict === VERDICT_BANDS.COMPLY) {
    const lines = [
      '"Fine, fine — watch and learn, Cruller. This is how a real captain does it."',
      '"Oh, alright. Somebody is getting a commendation for this. Hint: it is me."',
      '"Alright, moving. Try to keep up, newbie."',
      '"See? I CAN do the thing. I just needed to want to."',
      '"Do not act surprised. This is literally my job."',
      '"One brave captain, coming right up. You are welcome in advance."',
      '"I am only doing this because I am incredible and you know it."',
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  if (verdict === VERDICT_BANDS.COMPLY_RELUCTANT) {
    const lines = [
      '"Ugh... fine. But I am logging my objections."',
      '"If I die, I am haunting you specifically, Cruller."',
      '"Grudgingly proceeding. This is against my better judgment."',
      '"I want it on record that I think this is a terrible idea."',
      '"Alright, alright. Twist my arm. Sheesh."',
      '"The things I do for this ship... and for doughnuts."',
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  if (verdict === VERDICT_BANDS.COUNTEROFFER) {
    const lines = [
      '"I will do it if you give me a doughnut. A real one."',
      '"I want a Glaze Core in my pocket first. Then we talk."',
      '"One Void Cruller and you have got a deal. Take it or leave it."',
      '"How about we negotiate? I do the thing, I get a snack."',
      '"I am not moving until I see some confectionery compensation."',
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  return null;
}

// Flavor dialogue for specific contexts — keeps things fresh
export function getRoomEntryDialogue(roomId) {
  const lines = {
    bridge: [
      '"Cruller! Finally. The rifts are tearing us apart. What is the plan?"',
      '"Glad you are here. Things are falling apart. Literally. Out there."',
      '"Okay, okay, I am listening. What do you want me to do first?"',
      '"The screens are all red. I do not like red. Red means problems."',
      '"Captain Glaze reporting. The ship is breaking. Your turn, Cruller."',
    ],
    glazing_bay: [
      '"The Glazing Bay... I hate this room. Those cat things skulk around."',
      '"This place gives me the creeps. Cores are right there. So are the cats."',
      '"Alright, we need a Core. I am not thrilled about the furry obstacle."',
      '"The stasis fields are holding. For now. That cat is NOT asleep."',
      '"I can smell the glaze from here. Also the cyber-cat. Great combo."',
    ],
    maw: [
      '"The Maw. Of course. The worm is down here. I can feel her watching."',
      '"Ugh, I hate this room. It smells like regret and ancient doughnut."',
      '"Vermious is right there. She knows we are here. She is judging us."',
      '"This is it. End of the line. Seal the rift, feed the worm, survive."',
      '"Every time I come down here, I lose years off my life expectancy."',
    ],
  };
  const opts = lines[roomId] || ['"What now, Cruller?"'];
  return opts[Math.floor(Math.random() * opts.length)];
}

export function getObjectionLine(gauges) {
  const mood = getMoodRead(gauges);
  const lines = {
    Terrified: ['"I am NOT okay right now."', '"Everything is terrible."', '"Why is this happening?!"'],
    Nervous: ['"I have a bad feeling about this..."', '"Are you sure about this?"', '"My sensors say danger."'],
    Preening: ['"I am very good at my job, FYI."', '"You are lucky to have me."', '"Watch a master at work."'],
    Cooperative: ['"I trust you, Cruller. Let us do this."', '"You have not let me down yet."', '"On your signal."'],
    Suspicious: ['"I have got my eye on you..."', '"You are up to something."', '"I am watching you, Cruller."'],
    Hangry: ['"I need a doughnut. NOW."', '"My blood sugar is critically low."', '"Feed me or I mutiny."'],
    Sulking: ['"Fine. Whatever."', '"Do what you want."', '"I am not in the mood."'],
  };
  const opts = lines[mood] || ['...'];
  return opts[Math.floor(Math.random() * opts.length)];
}
