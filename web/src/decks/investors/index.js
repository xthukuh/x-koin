import { ADMIN_SCENES } from './admin.jsx';
import { CLIENT_SCENES } from './client.jsx';
import { CONCEPT_SCENES } from './concept.jsx';
import { ECONOMICS_SCENES } from './economics.jsx';
import { MONEY_SCENES } from './money.jsx';
import { PROBLEM_SCENES } from './problem.jsx';
import { REACH_SCENES } from './reach.jsx';
import { RESILIENCE_SCENES } from './resilience.jsx';
import { ROAD_SCENES } from './road.jsx';
import { SECURITY_SCENES } from './security.jsx';

/**
 * The investor deck, in narrative order.
 *
 * One problem, one sentence of answer, then the rule that makes the answer
 * work, then the money, then the two journeys, then the economics with every
 * condition attached, then reach, then survival, then security, then the road
 * and where to read the rest. Twenty scenes, about three minutes if nobody
 * pauses, and the player holds at the end of each one until the viewer moves.
 *
 * Every scene renders as a pure function of `t`, so pause, replay, scrub and
 * going backwards are all one implementation in the player. No scene holds
 * state of its own.
 */
export const INVESTOR_SCENES = [
  ...PROBLEM_SCENES,
  ...CONCEPT_SCENES,
  ...MONEY_SCENES,
  ...ADMIN_SCENES,
  ...CLIENT_SCENES,
  ...ECONOMICS_SCENES,
  ...REACH_SCENES,
  ...RESILIENCE_SCENES,
  ...SECURITY_SCENES,
  ...ROAD_SCENES,
];

export default INVESTOR_SCENES;
