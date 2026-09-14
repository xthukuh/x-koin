/**
 * Numbers the deck is not allowed to invent.
 *
 * Everything here is read from an artifact this repository produced: the
 * recorded chain proof, the recorded kiosk journeys, and the compiled parts
 * list. A scene that shows a figure imports it from this file, so re-running a
 * proof or re-scouting a part moves the slide and no slide can disagree with
 * another one about the same number.
 *
 * Figures that are not in a machine-readable artifact stay written out in the
 * scene with the condition attached in the same sentence, which is the rule the
 * papers follow.
 */
import { mvpSummary } from '../../shop/data.js';
import chain from '../../proof/chain.json';
import kiosk from '../../proof/kiosk.json';

export const CHAIN = chain;
export const KIOSK = kiosk;

/** Contract parameters as they were deployed for the end-to-end chain proof. */
export const PRICE_UKES = chain.params.price_per_unit_ukes;
export const FEE_BPS = chain.params.fee_bps;
export const UNIT_BYTES = chain.params.unit_bytes;
export const DECIMALS = chain.params.decimals;

/** Gas measured in the same run. */
export const SETTLE_GAS = chain.summary.settle_gas;
/** The three deployments plus setBridge, which is how the papers quote it. */
export const DEPLOY_GAS = chain.txs
  .filter((tx) => String(tx.fn).startsWith('create:') || tx.fn === 'setBridge')
  .reduce((sum, tx) => sum + tx.gas_used, 0);
export const GAS_BY_FN = Object.fromEntries(chain.txs.map((tx) => [tx.fn, tx.gas_used]));

/** The two tickets the proof settled, gateway first and satellite second. */
export const TICKETS = chain.tickets;
export const TREASURY_FEE_UKES = chain.summary.treasury_fee_ukes;
export const FOUNDER_CLAIMED_UKES = chain.summary.founder_claimed_ukes;
export const GATEWAY_EARNINGS_UKES = chain.summary.gateway_earnings_ukes;
export const SATELLITE_EARNINGS_UKES = chain.summary.satellite_earnings_ukes;
export const DEPOSIT_LEFT_UKES = chain.summary.client_deposit_left_ukes;

/** The recorded fiat journeys, by id, so a scene can name a real step. */
export const JOURNEYS = Object.fromEntries(kiosk.journeys.map((journey) => [journey.id, journey]));

/** The proof-of-concept kit, priced from the verified checkout lines. */
export const KIT = mvpSummary();

/** Micro-shillings as shillings, for example 1250000 reads as 1.25 KES. */
export function kesFromUkes(ukes, decimals = 2) {
  return (ukes / 1e6).toLocaleString('en-KE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** A gas figure with thousands separators. */
export function gas(value) {
  return Number(value).toLocaleString('en-US');
}
