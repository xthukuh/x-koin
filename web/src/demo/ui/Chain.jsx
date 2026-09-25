import { useEffect, useMemo, useState } from 'react';

import { blockHashOf, howToCheck, rehash, tamper, txHashOf, verify } from '../chain.js';
import { kesStr } from './format.js';

const COPIES = ['Node A', 'Node B', 'Node C', 'Node D', 'Node E'];
const FORGER = 2; // Node C holds the copy someone edits
const short = (h) => (h ? `${h.slice(0, 10)}..${h.slice(-6)}` : '');

/** Split calldata into the 4-byte selector and 32-byte words, the way the EVM reads it. */
function words(input) {
  if (!input || input.length <= 10) return { selector: input, words: [] };
  const body = input.slice(10);
  const out = [];
  for (let i = 0; i < body.length; i += 64) out.push(body.slice(i, i + 64));
  return { selector: input.slice(0, 10), words: out };
}

export default function Chain({ world }) {
  const honest = world.blocks;
  const [pick, setPick] = useState(honest.length - 1);
  const [forged, setForged] = useState(null); // Node C's copy, or null when it matches
  const [stageLabel, setStage] = useState('clean');
  const i = Math.min(Math.max(pick, 0), honest.length - 1);
  // A new block on the honest chain makes an old forgery meaningless: start clean.
  useEffect(() => {
    setForged(null);
    setStage('clean');
    setPick(honest.length - 1);
  }, [honest.length]);

  const copy = forged ?? honest;
  const rows = useMemo(() => verify(copy), [copy]);
  if (!honest.length) return <p className="pg-hint">No blocks yet. Run Set up.</p>;

  const b = copy[i];
  const entry = world.ledger.find((e) => e.id === b.entryId);
  const amount = entry?.args?.amount ?? entry?.args?.value ?? null;
  const w = words(b.tx.input);
  const check = howToCheck(b);
  const recomputed = blockHashOf(b);
  const txRe = txHashOf(b.tx);
  const forgedValid = rows.every((r) => r.ok);
  const heads = COPIES.map((_, k) => (k === FORGER ? copy.at(-1).hash : honest.at(-1).hash));
  const good = COPIES.map((_, k) => (k === FORGER ? forgedValid && heads[k] === honest.at(-1).hash : true));
  const agree = good.filter(Boolean).length;

  const doTamper = () => {
    setForged(tamper(honest, i, amount ?? 0, amount ? amount * 1000 : 1));
    setStage('edited');
  };
  const doFixOne = () => {
    setForged(rehash(forged, i, true));
    setStage('fixed-one');
  };
  const doFixAll = () => {
    setForged(rehash(forged, i));
    setStage('fixed-all');
  };

  return (
    <div className="pg-chain">
      <div className="pg-copies" title="Every node keeps its own full copy and compares the latest hash">
        {COPIES.map((c, k) => (
          <span key={c} className={good[k] ? 'is-ok' : 'is-bad'}>
            {c} <code>{k === FORGER && !forgedValid ? 'fails its own check' : short(heads[k])}</code>
          </span>
        ))}
        <b className={agree === COPIES.length ? 'pg-ok' : 'pg-bad'}>
          {agree}/{COPIES.length} valid and agree{agree < COPIES.length ? `: ${COPIES[FORGER]} is rejected` : ''}
        </b>
      </div>

      <ol className="pg-blocks">
        {copy.map((blk, k) => (
          <li key={blk.number}>
            <button type="button" className={`${k === i ? 'is-on' : ''} ${rows[k].ok ? '' : 'is-bad'}`} onClick={() => setPick(k)}>
              <span>#{blk.number}</span>
              <code>{short(blk.hash)}</code>
              <em>{blk.tx.signature?.split('(')[0] ?? (blk.tx.to === 'contract creation' ? 'deploy' : 'ETH send')}</em>
              {!blk.tx.status && <em className="pg-bad">reverted</em>}
              {!rows[k].ok && <em className="pg-bad">{!rows[k].tx ? 'tx changed' : !rows[k].link ? 'link broken' : 'header changed'}</em>}
            </button>
          </li>
        ))}
      </ol>

      <div className="pg-row">
        <button type="button" className="pg-btn" onClick={doTamper} disabled={stageLabel !== 'clean'} title={`Edit block #${b.number} in ${COPIES[FORGER]}'s copy`}>
          Edit block #{b.number} {amount ? `(${kesStr(amount)} to ${kesStr(amount * 1000)})` : ''}
        </button>
        <button type="button" className="pg-btn" onClick={doFixOne} disabled={stageLabel !== 'edited'} title="Recompute only the edited block's hashes">
          Fix its hash
        </button>
        <button type="button" className="pg-btn" onClick={doFixAll} disabled={stageLabel !== 'fixed-one'} title="Recompute every later block too">
          Fix every block after
        </button>
        <button
          type="button"
          className="pg-btn"
          onClick={() => {
            setForged(null);
            setStage('clean');
          }}
          disabled={stageLabel === 'clean'}
        >
          Restore
        </button>
      </div>
      {stageLabel === 'edited' && <p className="pg-hint">One number changed. The block's contents no longer match its stored hash, so anyone who recomputes catches it.</p>}
      {stageLabel === 'fixed-one' && <p className="pg-hint">Its hash now matches, but that hash changed, so the next block points at a hash that no longer exists. The break moves forward.</p>}
      {stageLabel === 'fixed-all' && <p className="pg-hint">Every later block is rebuilt. This copy checks out on its own, but its latest hash differs from the other four copies, so they reject it.</p>}

      <h3 className="pg-h3">Check block #{b.number} yourself</h3>
      <dl className="pg-kv">
        <dt>parent</dt>
        <dd><code>{b.parentHash}</code></dd>
        <dt>number, time</dt>
        <dd><code>{b.number}, {b.timestamp}</code></dd>
        <dt>tx hash</dt>
        <dd>
          <code>{b.txHash}</code> {txRe === b.txHash ? <span className="pg-ok">recomputes</span> : <span className="pg-bad">recomputes to {short(txRe)}</span>}
        </dd>
        <dt>state root</dt>
        <dd><code>{b.stateRoot}</code></dd>
        <dt>block hash</dt>
        <dd>
          <code>{b.hash}</code> {recomputed === b.hash ? <span className="pg-ok">recomputes</span> : <span className="pg-bad">recomputes to {short(recomputed)}</span>}
        </dd>
        <dt>run</dt>
        <dd><code>{check.cast}</code></dd>
      </dl>

      <h3 className="pg-h3">Transaction bytes</h3>
      <dl className="pg-kv">
        <dt>from, to, nonce</dt>
        <dd><code>{b.tx.from} to {b.tx.to}, nonce {b.tx.nonce}</code></dd>
        <dt>function</dt>
        <dd><code>{b.tx.signature ?? 'none'}</code> selector <code>{w.selector}</code></dd>
        <dt>status, gas</dt>
        <dd><code>{b.tx.status ? 'success' : 'reverted'}, {b.tx.gasUsed.toLocaleString('en-KE')}</code></dd>
      </dl>
      {w.words.length > 0 && (
        <ol className="pg-words" start={0}>
          {w.words.map((x, k) => (
            <li key={k}><code>{x}</code></li>
          ))}
        </ol>
      )}
      <p className="pg-hint">
        Hashing is real keccak256. The layout is simplified: Ethereum hashes RLP-encoded transactions and headers and keeps state in a Merkle trie. Tampering behaves the same way.
      </p>
    </div>
  );
}
