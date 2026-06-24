export const INITIAL_GAUGES = {
  composure: 40,
  trust: 50,
  ego: 55,
  hunger: 50,
};

export const INITIAL_HIDDEN = {
  suspicion: 10,
  resentment: 0,
};

export const INITIAL_INVENTORY = {
  glazeCores: 2,
  voidCrullers: 1,
};

export const INITIAL_SHIP = {
  integrity: 100,
  location: 'bridge',
};

export const FEAR_K = 0.8;
export const ANNOY_K = 0.6;
export const SUSP_K = 0.5;
export const RES_K = 0.4;
export const BASE_WILLINGNESS = 50;

export const VERDICT_THRESHOLDS = {
  COMPLY_EAGER: 65,
  COMPLY_RELUCTANT: 50,
  COUNTEROFFER: 35,
  REFUSE: 0,
};

export const VERDICT_BANDS = {
  COMPLY: 'COMPLY',
  COMPLY_RELUCTANT: 'COMPLY_RELUCTANT',
  COUNTEROFFER: 'COUNTEROFFER',
  REFUSE: 'REFUSE',
};

export const APPEAL_KEYS = [
  'command', 'flatter', 'bribe', 'reassure',
  'argue', 'threaten', 'trick', 'apologize',
];

export const OBJECTIONS = {
  FEAR: 'FEAR',
  INSULT: 'INSULT',
  DISTRUST: 'DISTRUST',
  LAZINESS: 'LAZINESS',
  SUSPICION: 'SUSPICION',
  RESOURCE: 'RESOURCE',
};
