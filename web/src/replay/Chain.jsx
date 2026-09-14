/*
 * On-chain evidence. Everything here is read straight out of chain.json, the
 * end-to-end run recorded on 2026-09-09 against a local chain: the address
 * book, the value flow, every transaction in block order, the XKN balance
 * after each block, the escrow state, the tickets and the summary figures.
 */

import {
  ACCOUNT_PURPOSE,
  ADDRESS_BOOK,
  BALANCE_ACCOUNTS,
  BATCH_SETTLED,
  CHAIN,
  CLAIM_TX,
  CONTRACT_PURPOSE,
  DEPLOY_GAS,
  DEPOSIT_TX,
  MINT_TX,
  SETTLE_TX,
  SRC,
  kes,
  num,
  roleOf,
  shortHex,
  unixTime,
} from './data.js';
import { JsonBlock } from './Proof.jsx';

function Source({ children }) {
  return (
    <p className="xk-rp-source xk-note">
      <strong className="xk-mono">source</strong> {children}
    </p>
  );
}

function party(value) {
  if (value === 'create') {
    return { label: 'contract creation', address: '' };
  }
  if (value && typeof value === 'object') {
    return { label: value.name, address: value.address };
  }
  return { label: String(value ?? ''), address: '' };
}

/* ------------------------------------------------------- where money went */

function MoneyFlow() {
  const columns = [
    { x: 90, title: 'M-Pesa', sub: 'shillings in' },
    { x: 330, title: 'Client', sub: 'XKN balance' },
    { x: 570, title: 'Escrow', sub: 'deposit held' },
    { x: 830, title: 'Earned', sub: 'nodes and fee' },
  ];
  const flows = [
    { from: 0, to: 1, y: 96, label: `bridgeMint ${kes(MINT_TX.args.amount)}`, note: 'block 6, 1 KES to 1 XKN' },
    { from: 1, to: 2, y: 162, label: `deposit ${kes(DEPOSIT_TX.args.amount)}`, note: 'block 8' },
    { from: 2, to: 3, y: 228, label: `settle gross ${kes(BATCH_SETTLED.gross)}`, note: `block 9, ${num(SETTLE_TX.gas_used)} gas` },
  ];
  const earned = [
    `gateway ${kes(CHAIN.escrow_state.earnings.gateway)}`,
    `satellite ${kes(CHAIN.escrow_state.earnings.satellite)}`,
    `treasury fee ${kes(BATCH_SETTLED.fee)}`,
    `claimed to beneficiary ${kes(CHAIN.summary.founder_claimed_ukes)}`,
  ];

  return (
    <div className="xk-rp-figure">
      <svg viewBox="0 0 1000 330" role="img" aria-label="Where the money went in the proof run">
        {columns.map((column) => (
          <g key={column.title}>
            <line x1={column.x} y1="56" x2={column.x} y2="300" stroke="var(--xk-line)" strokeWidth="2" strokeDasharray="4 6" />
            <text x={column.x} y="28" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="18" fill="var(--xk-ink)">
              {column.title}
            </text>
            <text x={column.x} y="46" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="12" fill="var(--xk-faint)">
              {column.sub}
            </text>
          </g>
        ))}
        {flows.map((flow) => (
          <g key={flow.label}>
            <line
              x1={columns[flow.from].x}
              y1={flow.y}
              x2={columns[flow.to].x - 10}
              y2={flow.y}
              stroke="var(--xk-money)"
              strokeWidth="2.5"
            />
            <path d={`M ${columns[flow.to].x - 10} ${flow.y} l -10 -6 v 12 z`} fill="var(--xk-money)" />
            <text
              x={(columns[flow.from].x + columns[flow.to].x) / 2}
              y={flow.y - 12}
              textAnchor="middle"
              fontFamily="var(--xk-font-mono)"
              fontSize="15"
              fill="var(--xk-ink)"
            >
              {flow.label}
            </text>
            <text
              x={(columns[flow.from].x + columns[flow.to].x) / 2}
              y={flow.y + 20}
              textAnchor="middle"
              fontFamily="var(--xk-font-mono)"
              fontSize="12"
              fill="var(--xk-faint)"
            >
              {flow.note}
            </text>
          </g>
        ))}
        {earned.map((line, index) => (
          <text
            key={line}
            x="830"
            y={258 + index * 18}
            textAnchor="middle"
            fontFamily="var(--xk-font-mono)"
            fontSize="12.5"
            fill="var(--xk-good)"
          >
            {line}
          </text>
        ))}
        <text x="570" y="276" textAnchor="middle" fontFamily="var(--xk-font-mono)" fontSize="12.5" fill="var(--xk-muted)">
          {`left on deposit ${kes(CHAIN.escrow_state.deposits.client)}`}
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------- balances */

function BalanceChart() {
  const blocks = CHAIN.balances.map((row) => row.block);
  const width = 640;
  const height = 46;
  const step = width / blocks.length;

  return (
    <div className="xk-rp-balances">
      {BALANCE_ACCOUNTS.map((account) => {
        const series = CHAIN.balances.map((row) => row.xkn[account.name]);
        const peak = Math.max(...series, 1);
        const last = series[series.length - 1];
        return (
          <div className="xk-rp-balrow" key={account.name}>
            <div className="xk-rp-balrow__name">
              <strong className="xk-mono">{account.name}</strong>
              {account.alias.length > 0 ? (
                <span className="xk-note"> = {account.alias.join(' = ')}</span>
              ) : null}
              <span className="xk-note xk-rp-balrow__addr">{shortHex(account.address)}</span>
            </div>
            <div className="xk-rp-balrow__chart">
              <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`XKN held by ${account.name} after each block`}>
                {series.map((value, index) => {
                  const h = (value / peak) * (height - 12);
                  return (
                    <rect
                      key={blocks[index]}
                      x={index * step + 2}
                      y={height - h}
                      width={step - 4}
                      height={Math.max(h, value > 0 ? 2 : 0.8)}
                      fill={value > 0 ? 'var(--xk-accent)' : 'var(--xk-line)'}
                    />
                  );
                })}
              </svg>
              <div
                className="xk-rp-balrow__axis xk-mono"
                style={{ gridTemplateColumns: `repeat(${blocks.length}, 1fr)` }}
              >
                {blocks.map((block) => (
                  <span key={block}>{block}</span>
                ))}
              </div>
            </div>
            <div className="xk-rp-balrow__peak xk-mono">
              <span>{kes(last)}</span>
              <span className="xk-note">peak {kes(peak)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------- page */

export default function Chain() {
  return (
    <>
      <section className="xk-section" id="money">
        <div className="xk-wrap">
          <p className="xk-eyebrow">On-chain evidence</p>
          <h2>Where the money went</h2>
          <p className="xk-lede">
            One run, ten blocks, four movements of value. Shillings become XKN at the bridge, XKN
            becomes a deposit, the deposit pays two node admins and a fee, and the fee reaches the
            beneficiary because nobody can send it anywhere else.
          </p>
          <MoneyFlow />
          <dl className="xk-stats">
            <div className="xk-stat">
              <dt>{num(SETTLE_TX.gas_used)}</dt>
              <dd>gas to settle the batch</dd>
              <dd className="xk-note">chain.json summary.settle_gas</dd>
            </div>
            <div className="xk-stat">
              <dt>{num(DEPLOY_GAS)}</dt>
              <dd>gas to deploy all three contracts plus setBridge</dd>
              <dd className="xk-note">sum of blocks 1 to 3 in chain.json</dd>
            </div>
            <div className="xk-stat">
              <dt>{kes(CHAIN.summary.treasury_fee_ukes)}</dt>
              <dd>protocol fee taken, 5 percent of gross</dd>
              <dd className="xk-note">chain.json summary.treasury_fee_ukes</dd>
            </div>
            <div className="xk-stat">
              <dt>{kes(CHAIN.summary.client_deposit_left_ukes)}</dt>
              <dd>still on deposit and withdrawable</dd>
              <dd className="xk-note">chain.json summary.client_deposit_left_ukes</dd>
            </div>
            <div className="xk-stat">
              <dt>{CHAIN.params.price_per_unit_ukes}</dt>
              <dd>micro-KES per {num(CHAIN.params.unit_bytes)} byte unit</dd>
              <dd className="xk-note">chain.json params, a placeholder price</dd>
            </div>
            <div className="xk-stat">
              <dt>{CHAIN.tickets.every((ticket) => ticket.digest_match) ? 'match' : 'mismatch'}</dt>
              <dd>python EIP-712 digest against the contract hashTicket</dd>
              <dd className="xk-note">chain.json summary.digest_parity</dd>
            </div>
          </dl>
          <Source>
            {SRC.chain}, generated {CHAIN.generated}, chain id {CHAIN.chain_id}. The settlement gas
            figure in {SRC.paperMoney} reads 191,698 for the same operation; this page shows the
            {' '}{num(SETTLE_TX.gas_used)} recorded in the proof file rather than the paper.
          </Source>
        </div>
      </section>

      <section className="xk-section xk-section--tinted" id="addresses">
        <div className="xk-wrap">
          <h2>Contracts and actors</h2>
          <p className="xk-lede">
            One address per role, which is the rule that keeps a blast radius small. In this run the
            deployer, the owner and the beneficiary are the same address; in production they are
            three devices.
          </p>
          <div className="xk-tablewrap">
            <table className="xk-table">
              <thead>
                <tr>
                  <th>Kind</th>
                  <th>Role</th>
                  <th>Address</th>
                  <th>What it may do</th>
                </tr>
              </thead>
              <tbody>
                {ADDRESS_BOOK.map((row) => (
                  <tr key={row.address}>
                    <td className="xk-mono">{row.kind}</td>
                    <td className="xk-mono">{row.roles.join(' = ')}</td>
                    <td className="xk-mono xk-rp-addr">{row.address}</td>
                    <td>{CONTRACT_PURPOSE[row.roles[0]] ?? ACCOUNT_PURPOSE[row.roles[0]] ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Source>{SRC.chain} contracts and actors; roles described in {SRC.paperSecurity} section 5</Source>
        </div>
      </section>

      <section className="xk-section" id="transactions">
        <div className="xk-wrap">
          <h2>Every transaction, in block order</h2>
          <p className="xk-lede">
            Ten blocks from an empty chain to a paid fee. Nothing is elided: this is the whole run.
          </p>
          <div className="xk-tablewrap">
            <table className="xk-table xk-rp-txtable">
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Function</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Value</th>
                  <th>Gas</th>
                  <th>Events</th>
                </tr>
              </thead>
              <tbody>
                {CHAIN.txs.map((tx) => {
                  const to = party(tx.to);
                  const value = Number(tx.value_wei) > 0 ? `${Number(tx.value_wei) / 1e18} ETH` : '0';
                  return (
                    <tr key={tx.hash}>
                      <td className="xk-mono">{tx.block}.{tx.index}</td>
                      <td className="xk-mono">{tx.fn}</td>
                      <td className="xk-mono">{tx.from.name}</td>
                      <td className="xk-mono">{to.label}</td>
                      <td className="xk-mono">{value}</td>
                      <td className="xk-mono">{num(tx.gas_used)}</td>
                      <td className="xk-mono xk-rp-events">
                        {tx.logs.length === 0 ? '-' : tx.logs.map((log) => log.event).join(', ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <details className="xk-rp-proof xk-rp-proof--flat">
            <summary className="xk-rp-proof__summary">
              <span className="xk-mono">every transaction with its arguments and logs</span>
            </summary>
            <div className="xk-rp-proof__body">
              <JsonBlock value={CHAIN.txs} label="chain.json txs" />
            </div>
          </details>
          <Source>{SRC.chain} txs, in block order as recorded</Source>
        </div>
      </section>

      <section className="xk-section xk-section--tinted" id="balances">
        <div className="xk-wrap">
          <h2>XKN balances after each block</h2>
          <p className="xk-lede">
            Ten bars per account, one per block, each row scaled to its own peak so the fee is
            visible next to the mint. Accounts that never held XKN in this run are left out.
          </p>
          <BalanceChart />
          <div className="xk-tablewrap">
            <table className="xk-table">
              <thead>
                <tr>
                  <th>Block</th>
                  {BALANCE_ACCOUNTS.map((account) => (
                    <th key={account.name}>{account.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CHAIN.balances.map((row) => (
                  <tr key={row.block}>
                    <td className="xk-mono">{row.block}</td>
                    {BALANCE_ACCOUNTS.map((account) => (
                      <td className="xk-mono" key={account.name}>
                        {row.xkn[account.name] === 0 ? '-' : kes(row.xkn[account.name])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Source>{SRC.chain} balances, one row per block</Source>
        </div>
      </section>

      <section className="xk-section" id="tickets">
        <div className="xk-wrap">
          <h2>Tickets settled in one batch</h2>
          <p className="xk-lede">
            Two channels closed in one transaction. The digest column is the point: the Python side
            computed the EIP-712 digest and the contract computed it independently, and they agree.
          </p>
          <div className="xk-tablewrap">
            <table className="xk-table">
              <thead>
                <tr>
                  <th>Holder</th>
                  <th>Client</th>
                  <th>Node admin</th>
                  <th>Seq</th>
                  <th>Units</th>
                  <th>Gross</th>
                  <th>Fee</th>
                  <th>Net</th>
                  <th>Digest</th>
                </tr>
              </thead>
              <tbody>
                {CHAIN.tickets.map((ticket) => (
                  <tr key={ticket.holder}>
                    <td className="xk-mono">{ticket.holder}</td>
                    <td className="xk-mono">{shortHex(ticket.client.address)}</td>
                    <td className="xk-mono">{shortHex(ticket.node_admin.address)}</td>
                    <td className="xk-mono">{ticket.sequence_number}</td>
                    <td className="xk-mono">{num(ticket.units)}</td>
                    <td className="xk-mono">{kes(ticket.gross_ukes)}</td>
                    <td className="xk-mono">{kes(ticket.fee_ukes)}</td>
                    <td className="xk-mono">{kes(ticket.net_ukes)}</td>
                    <td className="xk-mono">
                      <span className={ticket.digest_match ? 'xk-status xk-status--done' : 'xk-status xk-status--blocked'}>
                        {ticket.digest_match ? 'parity' : 'mismatch'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="xk-rp-proof xk-rp-proof--flat" open>
            <summary className="xk-rp-proof__summary">
              <span className="xk-mono">ticket fields, digests and escrow state</span>
            </summary>
            <div className="xk-rp-proof__body">
              <JsonBlock value={CHAIN.tickets} label="chain.json tickets" />
              <JsonBlock value={CHAIN.escrow_state} label="chain.json escrow_state" />
              <p className="xk-note">
                epoch_expiry {CHAIN.tickets[0].epoch_expiry} is {unixTime(CHAIN.tickets[0].epoch_expiry)}. A
                ticket past its expiry is refused by the contract rather than paid late.
              </p>
            </div>
          </details>
          <Source>{SRC.chain} tickets and escrow_state; digest parity asserted by the run itself</Source>
        </div>
      </section>

      <section className="xk-section xk-section--tinted" id="summary">
        <div className="xk-wrap">
          <h2>The run summary, as the file states it</h2>
          <p className="xk-lede">
            Printed rather than paraphrased. These are the assertions the end-to-end script made
            before it wrote the file.
          </p>
          <JsonBlock value={CHAIN.summary} label="chain.json summary" />
          <div className="xk-cards">
            <div className="xk-card">
              <h3>Solvency</h3>
              <p>{CHAIN.summary.solvency}</p>
              <p className="xk-note">Covered by test_solvencyInvariant in {SRC.tests}.</p>
            </div>
            <div className="xk-card">
              <h3>Claim property</h3>
              <p>{CHAIN.summary.claim_property}</p>
              <p className="xk-note">
                Block {CLAIM_TX.block}: {CLAIM_TX.from.name} called claim and{' '}
                {kes(CLAIM_TX.logs[0].args.value)} went to {roleOf(CLAIM_TX.logs[0].args.to)}.
              </p>
            </div>
            <div className="xk-card">
              <h3>Digest parity</h3>
              <p>{CHAIN.summary.digest_parity}</p>
              <p className="xk-note">
                The firmware, the backend and the contract have to agree on the bytes or nobody gets
                paid. See {SRC.settle} and hashTicket in {SRC.escrow}.
              </p>
            </div>
          </div>
          <Source>{SRC.chain} summary</Source>
        </div>
      </section>
    </>
  );
}
