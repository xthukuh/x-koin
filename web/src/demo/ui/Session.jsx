import { useEffect, useRef, useState } from 'react';

import { batchQuote, nameOf, pendingTickets } from '../engine.js';
import { closeSession, openSession, relayBatch, serve, sessionCredit } from '../flows.js';
import { gasStr, intStr, kesSmall, kesStr } from './format.js';

/**
 * The data meter. The node serves bytes against the client's credit; the
 * wallet signs a cumulative EIP-712 ticket at every receipt boundary; the
 * relayer decides when a batch is worth its gas.
 */
export default function Session({ world, commit, replace, who, setWho }) {
  const w = world;
  const s = w.session;
  const [mb, setMb] = useState(12);
  const [offline, setOffline] = useState(false);
  const [playing, setPlaying] = useState(false);
  const worldRef = useRef(w);
  worldRef.current = w;

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      const cur = worldRef.current;
      if (!cur.session || cur.session.done) {
        setPlaying(false);
        return;
      }
      const r = serve(cur, 250_000);
      replace(r.world);
    }, 90);
    return () => clearInterval(id);
  }, [playing, replace]);

  const start = () => {
    const r = openSession(w, { client: who, targetBytes: Math.round(mb * 1e6), offline });
    commit(r);
    if (r.ok) setPlaying(true);
  };

  const pending = pendingTickets(w);
  const quote = batchQuote(w, pending);
  const channelTickets = s ? w.tickets[`${s.client}>${s.nodeAdmin}`] ?? [] : [];
  const sessionTickets = s ? channelTickets.filter((t) => t.at >= s.startedAt) : [];
  const credit = s ? sessionCredit(w) : 0;
  const used = s ? s.limit - credit : 0;
  const pct = (n, d) => (d > 0 ? Math.min(100, (n / d) * 100) : 0);

  return (
    <section className="xk-dm-panel" id="session">
      <header className="xk-dm-panel__head">
        <h2>Data session</h2>
        <p className="xk-note">
          1 unit = {intStr(w.params.unitBytes)} bytes at {w.escrow.pricePerUnit || w.params.pricePerUnit} micro-KES. The wallet signs a ticket every {(w.params.receiptBytes / 1e6).toFixed(2)} MB. Online credit is min(deposit, {w.params.onlineCapKes} KES); offline the node admits on the voucher up to {w.params.offlineCapKes} KES.
        </p>
      </header>

      {!s && (
        <div className="xk-dm-form xk-dm-form--row">
          <div className="xk-dm-seg" role="group" aria-label="Client">
            {['amina', 'baraka'].map((c) => (
              <button type="button" key={c} className={who === c ? 'is-on' : ''} onClick={() => setWho(c)}>
                {nameOf(c)}
              </button>
            ))}
          </div>
          <label>
            Data, MB
            <input type="number" min="0.01" step="1" value={mb} onChange={(e) => setMb(Number(e.target.value))} />
          </label>
          <label className="xk-dm-check">
            <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} />
            backhaul down (voucher only)
          </label>
          <button type="button" className="xk-btn xk-btn--primary" disabled={!w.deployed} onClick={start}>
            Start {mb} MB session
          </button>
        </div>
      )}

      {s && (
        <div className="xk-dm-meter">
          <p>
            <b>{nameOf(s.client)}</b> on {nameOf(s.nodeAdmin)}, {s.offline ? 'offline, voucher credit' : 'online, deposit credit'}.{' '}
            {s.done ? (s.throttled ? <span className="xk-dm-bad">Stopped: {s.throttled}</span> : 'Finished.') : playing ? 'Serving.' : 'Paused.'}
          </p>
          <div className="xk-dm-bar" aria-label="bytes served">
            <span style={{ width: `${pct(s.bytes, s.targetBytes)}%` }} />
            <em>
              {(s.bytes / 1e6).toFixed(2)} of {(s.targetBytes / 1e6).toFixed(2)} MB
            </em>
          </div>
          <div className="xk-dm-bar xk-dm-bar--credit" aria-label="credit used">
            <span style={{ width: `${pct(used, s.limit)}%` }} />
            <i style={{ left: '50%' }} title="settle at half the credit" />
            <em>
              credit used {kesStr(used)} of {kesStr(s.limit)} KES
            </em>
          </div>
          <dl className="xk-dm-kv">
            <dt>units</dt>
            <dd>
              {intStr(Math.ceil(s.bytes / w.params.unitBytes))} this session, cumulative {intStr(s.baseUnits + Math.ceil(s.bytes / w.params.unitBytes))}
            </dd>
            <dt>owed</dt>
            <dd>{kesStr(Math.ceil(s.bytes / w.params.unitBytes) * w.escrow.pricePerUnit)} KES this session</dd>
            <dt>receipts</dt>
            <dd>
              {s.receipts} signed, {intStr(s.receipts * 108)} bytes of receipt frames ({((s.receipts * 108 * 100) / Math.max(1, s.bytes)).toFixed(4)}% overhead)
            </dd>
          </dl>
          <div className="xk-dm-row">
            {!s.done && (
              <button type="button" className="xk-btn" onClick={() => setPlaying(!playing)}>
                {playing ? 'Pause' : 'Play'}
              </button>
            )}
            {!s.done && (
              <button type="button" className="xk-btn" onClick={() => replace(serve(w, w.params.receiptBytes).world)}>
                Step one receipt
              </button>
            )}
            <button
              type="button"
              className="xk-btn"
              onClick={() => {
                setPlaying(false);
                replace(closeSession(w));
              }}
            >
              {s.done ? 'Close session' : 'End early'}
            </button>
          </div>
          {sessionTickets.length > 0 && (
            <div className="xk-tablewrap">
              <table className="xk-table xk-dm-tickets">
                <thead>
                  <tr>
                    <th>seq</th>
                    <th>cumulative units</th>
                    <th>digest</th>
                    <th>signature</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionTickets.slice(-6).map((t) => (
                    <tr key={t.sequenceNumber}>
                      <td className="xk-mono">{t.sequenceNumber}</td>
                      <td className="xk-mono">{intStr(t.cumulativeUnits)}</td>
                      <td className="xk-mono" title={t.digest}>{t.digest.slice(0, 14)}..</td>
                      <td className="xk-mono" title={t.signature}>{t.signature.slice(0, 14)}..</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sessionTickets.length > 6 && <p className="xk-note">{sessionTickets.length - 6} earlier tickets held; only the newest will be submitted.</p>}
            </div>
          )}
        </div>
      )}

      <div className="xk-dm-relay">
        <h3>Relayer</h3>
        {pending.length === 0 ? (
          <p className="xk-note">No unsettled tickets.</p>
        ) : (
          <>
            <p>
              {pending.length} channel(s) with unsettled tickets, {pending.reduce((a, p) => a + p.heldCount, 0)} tickets held, {pending.length} to submit (the latest per channel).
            </p>
            <dl className="xk-dm-kv">
              <dt>would pay</dt>
              <dd>
                {kesStr(quote.gross)} KES gross, {kesStr(quote.fee)} fee, {kesStr(quote.net)} to nodes
              </dd>
              <dt>gas</dt>
              <dd>
                {gasStr(quote.gas)} gas = {kesSmall(quote.gasKes)} KES, paid by the relayer
              </dd>
              <dt>rule</dt>
              <dd className={quote.go ? 'xk-dm-ok' : 'xk-dm-warn'}>
                fee {kesSmall(quote.feeKes)} KES {quote.go ? '>=' : '<'} 2 x gas {kesSmall(2 * quote.gasKes)} KES: {quote.go ? 'settle now' : 'wait and batch more, unless a ticket nears expiry'}
              </dd>
            </dl>
            <button type="button" className="xk-btn xk-btn--primary" disabled={s && !s.done} onClick={() => commit(relayBatch(w))}>
              {quote.go ? 'Settle batch' : 'Settle anyway'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
