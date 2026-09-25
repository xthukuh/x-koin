/*
 * /demo. Point-and-click xKoin: the three contracts ported rule for rule
 * (web/src/demo/engine.js), real keccak256, EIP-712, secp256k1 and Ed25519
 * (web/src/demo/crypto.js), and gas from forge measurements
 * (web/src/demo/gas.js). `npm run verify:demo` replays the anvil chain proof
 * through the engine and checks it lands on the same balances.
 *
 * State is a stack of immutable worlds so every step can be undone.
 */

import { useCallback, useMemo, useState } from 'react';

import { DEFAULT_PARAMS, createWorld, kes, metrics } from '../demo/engine.js';
import { buy, cashOut, closeSession, depositGasless, nodeCashOut, nodeClaim, openSession, relayBatch, serve, setupNetwork, sweepFees } from '../demo/flows.js';
import Board from '../demo/ui/Board.jsx';
import Console from '../demo/ui/Console.jsx';
import Drills from '../demo/ui/Drills.jsx';
import Economics from '../demo/ui/Economics.jsx';
import Kiosk from '../demo/ui/Kiosk.jsx';
import Ledger, { Entry } from '../demo/ui/Ledger.jsx';
import Session from '../demo/ui/Session.jsx';
import '../demo/demo.css';

const okFn = (w, pred) => w.ledger.some((e) => e.ok && pred(e));

function browse12(w) {
  let r = openSession(w, { client: 'amina', targetBytes: 12_000_000 });
  if (!r.ok) return r;
  let x = r.world;
  const entries = [...r.entries];
  while (!x.session.done) {
    const s = serve(x, 1_000_000);
    x = s.world;
    entries.push(...s.entries);
  }
  return { world: closeSession(x), ok: entries.every((e) => e.ok), entries };
}

const STAGES = [
  { id: 'deploy', label: 'Deploy', text: 'Owner deploys token, treasury, escrow and lists the kiosk as a bridge with a daily cap.', done: (w) => w.deployed && w.token.bridges.kiosk?.allowed, run: (w) => setupNetwork(w) },
  { id: 'onramp', label: 'On-ramp', text: 'Amina pays 100 KES by M-Pesa; the kiosk mints 100 XKN to her wallet and signs a voucher.', done: (w) => okFn(w, (e) => e.fn === 'bridgeMint'), run: (w) => buy(w, { client: 'amina', amount: kes(100) }) },
  { id: 'deposit', label: 'Escrow', text: 'She signs a permit; the kiosk relays depositWithPermit. 50 KES becomes session credit, 50 stays portable.', done: (w) => okFn(w, (e) => e.fn === 'depositWithPermit' || e.fn === 'deposit'), run: (w) => depositGasless(w, { client: 'amina', amount: kes(50) }) },
  { id: 'use', label: 'Use 12 MB', text: 'The node serves 12 MB; her wallet signs 12 cumulative tickets, one per MB.', done: (w) => okFn(w, (e) => e.fn === 'signTicket'), run: browse12 },
  { id: 'settle', label: 'Settle', text: 'The relayer submits only the newest ticket: 1,200 units, one transaction.', done: (w) => okFn(w, (e) => e.fn === 'settleTicketBatch'), run: (w) => relayBatch(w) },
  { id: 'claim', label: 'Node claims', text: 'The node admin pulls earnings from escrow into its wallet.', done: (w) => okFn(w, (e) => e.fn === 'claimEarnings'), run: (w) => nodeClaim(w) },
  { id: 'nodeout', label: 'Node cash-out', text: 'Node sends XKN to the bridge, gets M-Pesa, bridge burns.', done: (w) => okFn(w, (e) => e.title === 'Node sends XKN to the bridge'), run: (w) => nodeCashOut(w) },
  { id: 'sweep', label: 'Fee sweep', text: 'Anyone triggers treasury.claim; the fee reaches only the founder.', done: (w) => okFn(w, (e) => e.fn === 'claim'), run: (w) => sweepFees(w) },
  { id: 'offramp', label: 'Off-ramp', text: 'Amina cashes out her wallet balance to M-Pesa. Supply and float fall together.', done: (w) => okFn(w, (e) => e.fn === 'bridgeBurn' && e.flow?.startsWith('Cash out')), run: (w) => cashOut(w, { client: 'amina', amount: w.token.bal.amina }) },
];

const RULES = [
  ['On-ramp', 'xKoinToken.bridgeMint', 'caller is a listed bridge; minted in the rolling 24 h window + amount <= dailyMintCap; fiatRef hashed into the event', 'NotBridge, MintCapExceeded', 'contracts/src/xKoinToken.sol:66'],
  ['Off-ramp', 'xKoinToken.bridgeBurn', 'burns the caller bridge\'s own balance only; there is no account parameter', 'NotBridge, ERC20InsufficientBalance', 'contracts/src/xKoinToken.sol:81'],
  ['Bridge admin', 'xKoinToken.setBridge', 'owner only; sets allowed and cap, keeps the window', 'OwnableUnauthorizedAccount', 'contracts/src/xKoinToken.sol:57'],
  ['Wallet', 'transfer, approve, permit, transferFrom', 'standard OpenZeppelin ERC-20 with EIP-2612; permit checks deadline and that the digest recovers to owner at the current nonce', 'ERC20Insufficient*, ERC2612ExpiredSignature, ERC2612InvalidSigner', 'contracts/src/xKoinToken.sol:14'],
  ['Deposit', 'xKoinEscrow.deposit / depositWithPermit', 'amount > 0; pulls from the client via allowance; a failing permit is caught so a front-run cannot block the deposit', 'ZeroAmount, ERC20InsufficientAllowance', 'contracts/src/xKoinEscrow.sol:109'],
  ['Exit', 'xKoinEscrow.withdrawDeposit', 'client only, any time, up to the deposit; no relayed form, so the client needs ETH', 'ZeroAmount, InsufficientDeposit', 'contracts/src/xKoinEscrow.sol:140'],
  ['Settle', 'xKoinEscrow.settleTicketBatch', 'per ticket: not expired, sequence > last, units > settled, EIP-712 digest recovers to the client; pays delta x price capped at the deposit; fee = floor(paid x bps / 10,000) per ticket; one bad ticket reverts the batch', 'EmptyBatch, LengthMismatch, ExpiredTicket, StaleSequence, NoNewUnits, BadSignature, ZeroAmount', 'contracts/src/xKoinEscrow.sol:159'],
  ['Payout', 'xKoinEscrow.claimEarnings', 'node admin sends its own earnings to any address', 'ZeroAmount, InsufficientEarnings', 'contracts/src/xKoinEscrow.sol:227'],
  ['Price lever', 'xKoinEscrow.setPricePerUnit', 'owner only; 1 to 50,000 micro-KES per unit; at most once per 24 h', 'PriceOutOfBand, PriceCooldownActive', 'contracts/src/xKoinEscrow.sol:240'],
  ['Fee lever', 'xKoinTreasury.setFeeBps', 'owner only; at most 1,000 bps (10 percent)', 'FeeTooHigh', 'contracts/src/xKoinTreasury.sol:61'],
  ['Founder pay', 'xKoinTreasury.claim', 'anyone may call; sweeps the whole balance to the beneficiary, never elsewhere', 'NothingToClaim', 'contracts/src/xKoinTreasury.sol:69'],
  ['Beneficiary', 'queue / activate / cancel', 'owner queues; anyone activates after 7 days; owner or current beneficiary vetoes', 'TimelockActive, NoPendingChange, NotAuthorized', 'contracts/src/xKoinTreasury.sol:77'],
  ['Ownership', 'Ownable2Step on all three', 'new owner must accept; HANDOVER item 10 requires a Safe before mainnet', 'OwnableUnauthorizedAccount', 'contracts/src/xKoinEscrow.sol:27'],
];

function diffMap(before, after) {
  const a = metrics(before);
  const b = metrics(after);
  const out = {};
  for (const k of Object.keys(b)) if (a[k] !== b[k]) out[k] = b[k] - a[k];
  return out;
}

export default function Demo() {
  const [hist, setHist] = useState(() => ({ worlds: [createWorld()], changed: {}, last: [] }));
  const world = hist.worlds.at(-1);
  const [who, setWho] = useState('amina');

  const commit = useCallback((result) => {
    setHist((h) => {
      const prev = h.worlds.at(-1);
      return { worlds: [...h.worlds.slice(-60), result.world], changed: diffMap(prev, result.world), last: result.entries ?? [] };
    });
  }, []);
  const replace = useCallback((next) => {
    setHist((h) => {
      const prev = h.worlds.at(-1);
      const fresh = next.ledger.slice(prev.ledger.length);
      return { worlds: [...h.worlds.slice(0, -1), next], changed: diffMap(prev, next), last: fresh.length ? fresh : h.last };
    });
  }, []);
  const undo = () => setHist((h) => (h.worlds.length > 1 ? { worlds: h.worlds.slice(0, -1), changed: {}, last: [] } : h));
  const resetWith = (over = {}) => setHist({ worlds: [createWorld({ ...DEFAULT_PARAMS, ...over })], changed: {}, last: [] });
  const setParams = (over) => replace({ ...world, params: { ...world.params, ...over } });

  const stages = useMemo(() => STAGES.map((s) => ({ ...s, isDone: Boolean(s.done(world)) })), [world]);
  const next = stages.find((s) => !s.isDone);
  const busy = world.session && !world.session.done;

  return (
    <div className="xk-dm">
      <section className="xk-section xk-section--tight xk-hero-grid">
        <div className="xk-wrap xk-wrap--wide">
          <p className="xk-eyebrow">Demo</p>
          <h1>Run xKoin by hand.</h1>
          <p className="xk-lede">
            The three contracts, ported rule for rule, with real signatures and measured gas. Buy, deposit, browse 12 MB, settle, cash out, then break it on purpose. Every step lands in the ledger with its crypto, its cost in KES and every balance it moved.
          </p>
          <p className="xk-note">
            Local simulation of the anvil deployment in the chain proof (chain 31337). Nothing leaves this page. Keys are derived from public labels: demo only. <code>npm run verify:demo</code> replays that proof through this engine and matches it to the micro-KES.
          </p>

          <ol className="xk-dm-rail">
            {stages.map((s, i) => (
              <li key={s.id} className={s.isDone ? 'is-done' : s === next ? 'is-next' : ''} title={s.text}>
                <span className="xk-dm-rail__n">{s.isDone ? 'ok' : i + 1}</span>
                <span>{s.label}</span>
              </li>
            ))}
          </ol>
          <div className="xk-dm-row">
            {next ? (
              <button type="button" className="xk-btn xk-btn--primary" disabled={busy} onClick={() => commit(next.run(world))}>
                Next: {next.label}
              </button>
            ) : (
              <span className="xk-dm-ok">Lifecycle complete. Try the recovery drills.</span>
            )}
            <button type="button" className="xk-btn" disabled={hist.worlds.length < 2} onClick={undo}>
              Undo
            </button>
            <button type="button" className="xk-btn" onClick={() => resetWith()}>
              Reset
            </button>
          </div>
          {next && <p className="xk-note xk-dm-nexttext">{next.text}</p>}

          {hist.last.length > 0 && (
            <div className="xk-dm-last">
              <h2 className="xk-dm-h4">Last step</h2>
              <ol className="xk-dm-ledger">
                {hist.last.slice(-8).map((e) => (
                  <Entry e={e} key={e.id} />
                ))}
              </ol>
              {hist.last.length > 8 && <p className="xk-note">{hist.last.length - 8} earlier entries of this step are in the ledger.</p>}
            </div>
          )}
        </div>
      </section>

      <div className="xk-wrap xk-wrap--wide xk-dm-grid">
        <Kiosk world={world} commit={commit} onBrowse={(c) => { setWho(c); document.getElementById('session')?.scrollIntoView({ behavior: 'smooth' }); }} />
        <Board world={world} changed={hist.changed} focus={who} />
      </div>
      <div className="xk-wrap xk-wrap--wide">
        <Session world={world} commit={commit} replace={replace} who={who} setWho={setWho} />
        <Ledger ledger={world.ledger} />
        <Console world={world} commit={commit} />
        <Drills world={world} commit={commit} />
        <Economics world={world} setParams={setParams} resetWith={resetWith} />

        <section className="xk-dm-panel" id="rules">
          <header className="xk-dm-panel__head">
            <h2>Contract rules at each gate</h2>
            <p className="xk-note">What each function checks, in the order it checks it, and the error it raises. The engine enforces exactly these.</p>
          </header>
          <div className="xk-tablewrap">
            <table className="xk-table xk-dm-rules">
              <thead>
                <tr>
                  <th>gate</th>
                  <th>function</th>
                  <th>rule</th>
                  <th>reverts with</th>
                  <th>source</th>
                </tr>
              </thead>
              <tbody>
                {RULES.map(([gate, fn, rule, errs, src]) => (
                  <tr key={gate + fn}>
                    <td>{gate}</td>
                    <td className="xk-mono">{fn}</td>
                    <td>{rule}</td>
                    <td className="xk-mono">{errs}</td>
                    <td className="xk-mono">{src}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
