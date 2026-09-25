import { ACTORS, addr, invariants, nameOf } from '../engine.js';
import { ethStr, kesSmall, kesStr } from './format.js';

const PEOPLE = ['amina', 'baraka', 'node', 'kiosk', 'relayer', 'founder', 'owner', 'mallory'];

function Cell({ label, value, k, changed, hint, eth = false, dim = false }) {
  const d = changed[k];
  return (
    <div className={`xk-dm-cell${d ? ' is-changed' : ''}${dim ? ' is-dim' : ''}`} title={hint}>
      <span className="xk-dm-cell__label">{label}</span>
      <span className="xk-dm-cell__value xk-mono">{eth ? ethStr(value) : kesStr(value)}</span>
      {d ? <span className={`xk-dm-cell__delta xk-mono ${d > 0 ? 'xk-dm-up' : 'xk-dm-down'}`}>{eth ? ethStr(d) : kesStr(d, { sign: true })}</span> : null}
    </div>
  );
}

export default function Board({ world, changed, focus }) {
  const w = world;
  const inv = invariants(w);
  const credit = (who) => {
    const s = w.session;
    if (!s || s.client !== who) return null;
    return s;
  };
  return (
    <section className="xk-dm-panel" id="balances">
      <header className="xk-dm-panel__head">
        <h2>Balances</h2>
        <p className="xk-note">
          All amounts in KES (1 XKN = 1 KES, 6 decimals). The wallet is portable and anyone can send to it; the escrow deposit is what nodes serve against, and only the client can take it out. Highlighted cells moved in the last step.
        </p>
      </header>

      <div className="xk-dm-actors">
        {PEOPLE.map((who) => {
          const isClient = who === 'amina' || who === 'baraka';
          const s = credit(who);
          const spent = w.gasSpent[who];
          return (
            <article key={who} className={`xk-dm-actor${focus === who ? ' is-focus' : ''}${!isClient && !['node', 'kiosk'].includes(who) ? ' xk-dm-actor--minor' : ''}`}>
              <header>
                <h3>{nameOf(who)}</h3>
                <span className="xk-mono xk-note" title={addr(who)}>
                  {addr(who).slice(0, 8)}..{addr(who).slice(-4)}
                </span>
                {isClient && w.devices[who] === false && <span className="xk-dm-flag xk-dm-bad">phone lost</span>}
              </header>
              <p className="xk-dm-actor__role">{ACTORS[who].role}</p>
              <div className="xk-dm-cells">
                {(isClient || who === 'node' || who === 'founder') && <Cell label="M-Pesa" value={w.fiat.mpesa[who]} k={`${who}.mpesa`} changed={changed} hint="Mobile money, off chain" />}
                <Cell label="Wallet XKN" value={w.token.bal[who]} k={`${who}.wallet`} changed={changed} hint="token.balanceOf(address): portable, transferable" />
                {isClient && <Cell label="Escrow deposit" value={w.escrow.deposits[who]} k={`${who}.escrow`} changed={changed} hint="escrow.deposits(address): what nodes serve against" />}
                {who === 'node' && <Cell label="Earnings" value={w.escrow.earnings.node} k="node.earnings" changed={changed} hint="escrow.earnings(address): settled, not yet claimed" />}
                {who === 'baraka' && w.escrow.earnings.baraka > 0 && <Cell label="Earnings" value={w.escrow.earnings.baraka} k="baraka.earnings" changed={changed} />}
                <Cell label="ETH" value={w.eth[who]} k={`${who}.eth`} changed={changed} eth hint="Native gas balance" dim={w.eth[who] === 0} />
              </div>
              {s && (
                <p className="xk-dm-actor__session">
                  Session credit: {kesStr(s.limit)} KES, {s.limitReason}
                </p>
              )}
              {spent && (
                <p className="xk-note xk-dm-actor__gas">
                  Paid {spent.txs} tx of gas: {spent.gas.toLocaleString('en-KE')} gas, {kesSmall(spent.kes)} KES
                </p>
              )}
            </article>
          );
        })}
      </div>

      <div className="xk-dm-contracts">
        <Cell label="XKN total supply" value={w.token.supply} k="token.supply" changed={changed} />
        <Cell label="Kiosk M-Pesa float" value={w.fiat.float} k="kiosk.float" changed={changed} hint="Fiat backing held by the kiosk" />
        <Cell label="Escrow contract holds" value={w.token.bal.escrow} k="escrow.balance" changed={changed} />
        <Cell label="Treasury holds" value={w.token.bal.treasury} k="treasury.balance" changed={changed} />
      </div>

      <ul className="xk-dm-invariants">
        {inv.map((i) => (
          <li key={i.id} className={i.ok ? 'xk-dm-ok' : 'xk-dm-bad'}>
            <b>{i.ok ? 'holds' : 'BROKEN'}</b> {i.label}
            <code>{i.rule}</code>
            <span className="xk-mono">
              {kesStr(i.lhs)} {i.ok ? '=' : '!='} {kesStr(i.rhs)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="xk-dm-kv xk-dm-params">
        <dt>price</dt>
        <dd>{w.escrow.pricePerUnit.toLocaleString('en-KE')} micro-KES per {(w.params.unitBytes / 1000).toFixed(0)} KB unit = {((w.escrow.pricePerUnit * 1e6) / w.params.unitBytes / 1e6).toFixed(4)} KES/MB</dd>
        <dt>fee</dt>
        <dd>{(w.treasury.feeBps / 100).toFixed(2)}% to the treasury, beneficiary {nameOf(w.treasury.beneficiary) ?? 'not deployed'}{w.treasury.pending ? `, change to ${nameOf(w.treasury.pending)} queued` : ''}</dd>
        <dt>bridge</dt>
        <dd>
          {w.token.bridges.kiosk
            ? `${w.token.bridges.kiosk.allowed ? 'listed' : 'revoked'}, cap ${kesStr(w.token.bridges.kiosk.cap)} KES per rolling day, ${kesStr(w.token.bridges.kiosk.minted)} minted in the window`
            : 'not listed'}
        </dd>
        <dt>clock</dt>
        <dd className="xk-mono">
          block {w.block}, {new Date(w.t * 1000).toISOString().replace('T', ' ').slice(0, 19)} UTC
        </dd>
      </dl>
    </section>
  );
}
