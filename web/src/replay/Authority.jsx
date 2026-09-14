/*
 * Who has authority. The closing argument of the page: the contracts are the
 * arbiter, the human levers are bounded, and each bound has a contract
 * reference next to it.
 */

import { CHAIN, SRC, kes, num } from './data.js';
import { CLAIM_EVIDENCE } from './journeys.js';
import { JsonBlock } from './Proof.jsx';

const CANNOT = [
  {
    title: 'Redirect the fee',
    detail:
      'claim() takes a token and no destination. It sweeps the treasury balance to the beneficiary and there is no withdraw-to-parameter anywhere in the contract. Anyone may call it, which is the point: the founder gets paid even if the founder is unreachable.',
    ref: `${SRC.treasury} claim(IERC20 token); tests test_claim_anyoneCanPayOnlyTheFounder and test_stolenOwnerKeyCannotRedirectFees`,
  },
  {
    title: 'Destroy a user balance',
    detail:
      'bridgeBurn burns from the caller own balance. No key in the system, owner or bridge or founder, can burn XKN belonging to somebody else.',
    ref: `${SRC.token} bridgeBurn, _burn(msg.sender, amount); test test_bridgeMintBurn_selfOnly`,
  },
  {
    title: 'Touch a deposit',
    detail:
      'Deposits move on exactly two paths: a client withdrawing, and a settlement paying a ticket the client signed. The owner has no function that reaches them.',
    ref: `${SRC.escrow} deposits mapping, withdrawDeposit and _settleOne`,
  },
  {
    title: 'Halt settlement',
    detail:
      'There is no pause. Settlement needs no owner involvement at all, so a founder who disappears freezes governance at its last values and stops nothing else.',
    ref: `${SRC.escrow} settleTicketBatch is permissionless; ${SRC.paperSecurity} section 4 point 6`,
  },
  {
    title: 'Move the beneficiary quietly',
    detail:
      'A change is queued publicly and activates after seven days, and the current beneficiary, the founder cold key, can veto it inside the window. Key theft becomes a fire alarm rather than a loss.',
    ref: `${SRC.treasury} queueBeneficiary, activateBeneficiary, cancelBeneficiaryChange; test test_beneficiaryChange_happyPath`,
  },
  {
    title: 'Price the network out of reach',
    detail:
      'The price lever is banded and rate limited: between PRICE_MIN and PRICE_MAX, one change a day. Worst case owner abuse is expensive within the band, once a day, never halted.',
    ref: `${SRC.escrow} PRICE_MIN, PRICE_MAX, PRICE_COOLDOWN; test test_setPricePerUnit_bandAndCooldown`,
  },
  {
    title: 'Raise the fee without limit',
    detail:
      'MAX_FEE_BPS is 1000, a hard ten percent ceiling in the contract. The fee lever can grief margins and can never confiscate or halt settlement.',
    ref: `${SRC.treasury} MAX_FEE_BPS; test test_revert_feeAboveCeiling`,
  },
  {
    title: 'Mint without a ceiling',
    detail: `Each bridge carries a rolling daily mint cap set on chain. In this run it is ${kes(
      CHAIN.txs.find((tx) => tx.fn === 'setBridge').args.dailyMintCap,
    )} a day, and the owner can revoke the bridge entirely in one transaction.`,
    ref: `${SRC.token} BridgeInfo and MintCapExceeded; test test_mintCap_rollingDay`,
  },
];

export default function Authority() {
  return (
    <section className="xk-section" id="authority">
      <div className="xk-wrap">
        <p className="xk-eyebrow">Authority</p>
        <h2>Who decides, and who cannot</h2>
        <p className="xk-lede">
          The contracts are the final arbiter. Everything above them is a bounded lever with a
          number in a source file. The founder-safety layer inverts the usual arrangement: it
          protects the revenue from the founder own keys as much as from anyone else.
        </p>

        <div className="xk-cards xk-rp-authority">
          {CANNOT.map((row) => (
            <div className="xk-card" key={row.title}>
              <h3>{row.title}</h3>
              <p>{row.detail}</p>
              <p className="xk-note xk-mono">{row.ref}</p>
            </div>
          ))}
        </div>

        <h3 className="xk-rp-h3">The one liveness dependency, stated as a gap</h3>
        <p>
          New admissions need the kiosk root key to sign vouchers. Existing sessions and all
          settlement continue without it. Rotation today is a firmware public key change; threshold
          signing across several kiosk keys is the intended path and is not built. Two more gaps are
          named in the same place: pricing is owner-set, and the owner is Ownable2Step rather than a
          multisig, which is a required gate before any mainnet deployment.
        </p>
        <p className="xk-note xk-mono">{SRC.paperSecurity} section 8</p>

        <h3 className="xk-rp-h3">The proof that a stranger can pay the founder</h3>
        <p>
          In the proof run the relayer, an address with no privilege of any kind, called claim on
          the treasury. {kes(CLAIM_EVIDENCE.logs[0].args.value)} left the treasury and arrived at
          the beneficiary, which is the only address it could have reached, for{' '}
          {num(CLAIM_EVIDENCE.gas_used)} gas.
        </p>
        <JsonBlock value={CLAIM_EVIDENCE} label="chain.json txs block 10" />
        <p className="xk-rp-source xk-note">
          <strong className="xk-mono">source</strong> {SRC.chain} txs block 10; {SRC.treasury};{' '}
          {SRC.paperSecurity} section 4
        </p>
      </div>
    </section>
  );
}
