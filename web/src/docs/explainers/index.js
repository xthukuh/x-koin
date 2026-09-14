import Degrade from './Degrade.jsx';
import FrameHop from './FrameHop.jsx';
import FreeLanPaidWan from './FreeLanPaidWan.jsx';
import Settlement from './Settlement.jsx';

import { ms } from '../../player/index.js';

/**
 * The named animations a paper can ask for with a ```xk-anim <name> fence.
 *
 * Each entry is a scene drawn as a pure function of `t`, plus the title,
 * duration and caption the AnimationFrame wraps it in, so a paper names a
 * picture and never a duration. A name the registry does not know leaves the
 * fenced block as it was written, which is what GitHub shows too.
 */
export const EXPLAINERS = {
  'frame-hop': {
    title: 'How a byte travels',
    duration: ms(9),
    caption:
      'The frame hops Client, Satellite, Node, internet. The answer comes back the same way, and the Client signs one receipt to the device that served it. The Node only carried it, so the Satellite is the one that gets paid.',
    Scene: FrameHop,
  },
  settlement: {
    title: 'Twelve receipts, one settlement',
    duration: ms(10),
    caption:
      'Each receipt carries the session total, not the last chunk, so losing eleven of them costs nothing. The twelfth becomes the ticket, and the ticket is all the chain ever sees.',
    Scene: Settlement,
  },
  degrade: {
    title: 'The grid goes down',
    duration: ms(9),
    caption:
      'Both power-line links die with the mains. Each takes three failures, sits out two seconds and scores zero, so the radio wins on arithmetic in about 0.8 seconds. Bulk traffic stops. Control, class C and the receipts do not.',
    Scene: Degrade,
  },
  'free-lan-paid-wan': {
    title: 'Free LAN, paid WAN',
    duration: ms(9),
    caption:
      'Traffic inside the mesh never reaches the meter, because it never uses the backhaul. Only what crosses the gateway is counted, in 10 KB units, against money already deposited.',
    Scene: FreeLanPaidWan,
  },
};

export function findExplainer(name) {
  return EXPLAINERS[name] ?? null;
}

export default EXPLAINERS;
