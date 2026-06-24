import {
  BASE_WILLINGNESS, FEAR_K, ANNOY_K, SUSP_K, RES_K,
  VERDICT_THRESHOLDS, VERDICT_BANDS, OBJECTIONS,
} from './constants.js';

function clamp(v, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

function jitter(amount = 3) {
  return (Math.random() - 0.5) * 2 * amount;
}

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

  if (appeal.flatter > 0.5) {
    g.ego = clamp(g.ego + 4);
    h.suspicion = clamp(h.suspicion + 2);
  }
  if (appeal.threaten > 0.5) {
    g.trust = clamp(g.trust - 8);
    h.resentment = clamp(h.resentment + 10);
    h.suspicion = clamp(h.suspicion + 5);
  }
  if (appeal.reassure > 0.5) {
    g.composure = clamp(g.composure + 6);
  }
  if (appeal.trick > 0.5) {
    h.suspicion = clamp(h.suspicion + 8);
  }
  if (appeal.apologize > 0.5) {
    g.trust = clamp(g.trust + 5);
    h.resentment = clamp(h.resentment - 6);
  }
  if (appeal.bribe > 0.5) {
    g.hunger = clamp(g.hunger - 5);
    g.composure = clamp(g.composure + 3);
  }
  if (action.risk > 60) {
    g.composure = clamp(g.composure - 5);
  }

  if (verdict === VERDICT_BANDS.COMPLY || verdict === VERDICT_BANDS.COMPLY_RELUCTANT) {
    h.resentment = clamp(h.resentment - 3);
  }

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

export function getObjectionDialogue(objection) {
  const lines = {
    FEAR: [
      '"Absolutely not — those things will shred me to confetti!"',
      '"I am NOT going out there. That\'s a death sentence!"',
      '"You\'ve lost your mind, Cruller. Those Chrome Strays are everywhere!"',
    ],
    INSULT: [
      '"Don\'t take that tone with the Captain of this vessel!"',
      '"Excuse me? I\'m a decorated officer, not your errand boy."',
      '"Watch your mouth, Cruller, or I\'ll log a formal complaint."',
    ],
    DISTRUST: [
      '"You said that last time. Fool me once, Cruller..."',
      '"I\'m not falling for that again. My memory is perfect."',
      '"Your track record isn\'t great, operator. No."',
    ],
    LAZINESS: [
      '"Why is that my job? Aren\'t you supposed to be helping?"',
      '"That sounds like a you problem, not a me problem."',
      '"Can\'t it wait? I\'m monitoring critical... nothing. But still."',
    ],
    SUSPICION: [
      '"What are you really after, Cruller? That\'s the third time."',
      '"You\'re being weirdly nice. What\'s the angle?"',
      '"I smell a setup. And I\'m not talking about the doughnuts."',
    ],
    RESOURCE: [
      '"Fine, but I\'m keeping one for myself. Non-negotiable."',
      '"Okay, okay, but you owe me. A real doughnut. Not the synthetic kind."',
      '"Deal. But only because there\'s something in it for me."',
    ],
  };
  const opts = lines[objection] || lines.FEAR;
  return opts[Math.floor(Math.random() * opts.length)];
}

export function getVerdictDialogue(verdict, action, objection) {
  if (verdict === VERDICT_BANDS.COMPLY) {
    const lines = [
      '"Fine, fine — watch and learn, Cruller. This is how a real captain does it."',
      '"Oh, alright. But somebody\'s getting a commendation for this. Hint: it\'s me."',
      `"Alright, moving. Try to keep up, ${['newbie', 'kid', 'operator'][Math.floor(Math.random() * 3)]}."`,
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  if (verdict === VERDICT_BANDS.COMPLY_RELUCTANT) {
    const lines = [
      '"Ugh... fine. But I\'m logging my objections."',
      '"If I die, I\'m haunting you specifically, Cruller."',
      '"Grudgingly proceeding. This is against my better judgment."',
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  if (verdict === VERDICT_BANDS.COUNTEROFFER) {
    const lines = [
      `"I'll do it if you give me a doughnut. A real one."`,
      `"I want a Glaze Core in my pocket first. Then we talk."`,
      `"One Void Cruller and you've got a deal. Take it or leave it."`,
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  return null;
}
