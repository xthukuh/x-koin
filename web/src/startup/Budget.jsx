import { Fn, Tag } from './bits.jsx';
import {
  GROUPS,
  NOTES,
  fmtRange,
  phaseBudget,
  phaseByGroup,
  pricedPhases,
  shortKes,
  wholePathTotal,
} from './data.js';
import { fmtKes, fmtUsd } from '../lib/money.js';

const mid = (low, high) => (low + high) / 2;

/**
 * One phase as two stacked bars on the same 100-wide frame. The wide bar is the
 * phase composition, so a reader can see at a glance that the companion app is
 * mostly one salary and the first run is mostly components. The hairline under
 * it is the same phase against the largest phase, so the composition does not
 * hide the fact that manufacturing is fifty times the bench.
 */
function PhaseBar({ phase, budget, scale }) {
  const groups = phaseByGroup(phase);
  const total = mid(budget.low, budget.high);
  let x = 0;

  return (
    <div className="xk-su-bar-row">
      <div className="xk-su-bar-head">
        <span className="xk-su-bar-name">
          {phase.n}. {phase.short}
        </span>
        <span className="xk-su-bar-value">
          {fmtRange(budget.low, budget.high)} | {Math.round((total / scale) * 100)} percent of the
          largest phase
        </span>
      </div>
      <svg
        className="xk-su-bar"
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 100 14"
        aria-label={`${phase.short}: ${groups
          .map((group) => `${group.label} ${shortKes(mid(group.low, group.high))}`)
          .join(', ')}`}
      >
        <rect x="0" y="0" width="100" height="10" fill="var(--xk-line-soft)" />
        {groups.map((group) => {
          const width = (mid(group.low, group.high) / total) * 100;
          const left = x;
          x += width;
          return (
            <rect
              key={group.key}
              x={left}
              y="0"
              width={Math.max(width, 0)}
              height="10"
              fill={`var(--xk-su-${group.key})`}
            />
          );
        })}
        <rect x="0" y="12" width="100" height="2" fill="var(--xk-line-soft)" />
        <rect
          x="0"
          y="12"
          width={Math.max((total / scale) * 100, 0.4)}
          height="2"
          fill="var(--xk-money)"
        />
      </svg>
    </div>
  );
}

/**
 * The budget, by line, by phase. Nothing in this component is a typed total:
 * every phase total, every group subtotal and the grand total are summed from
 * the line items in data.js, and the contingency line is computed from the
 * lines above it.
 */
export default function Budget() {
  const rows = pricedPhases();
  const whole = wholePathTotal();
  const scale = Math.max(...rows.map(({ budget }) => mid(budget.low, budget.high)));

  return (
    <section className="xk-section xk-section--tinted" id="budget">
      <div className="xk-wrap">
        <p className="xk-eyebrow">Budget</p>
        <h2>Every line, what it is for, and how much weight the number carries</h2>
        <p>
          Shillings throughout. A line that started life in dollars keeps its dollar figure in the
          basis column. Nothing here is a quotation unless it says verified, and {whole.unpricedCount}{' '}
          lines carry no figure at all because the repository would rather print nothing than a
          guess.
        </p>

        <div className="xk-su-bars">
          {rows.map(({ phase, budget }) => (
            <PhaseBar budget={budget} key={phase.key} phase={phase} scale={scale} />
          ))}
          <div className="xk-su-legend">
            {GROUPS.map((group) => (
              <span key={group.key}>
                <i className="xk-su-swatch" style={{ background: `var(--xk-su-${group.key})` }} />
                {group.label}
              </span>
            ))}
          </div>
          <p className="xk-note" style={{ marginTop: '0.8rem' }}>
            The thick bar is what a phase is made of, at the midpoint of each range. The hairline
            under it is the same phase measured against the largest one, so composition and
            magnitude are both on the page. The label beside each bar is the range itself.
          </p>
        </div>

        <div className="xk-tablewrap">
          <table className="xk-table xk-su-table">
            <caption className="xk-sr">Budget by phase and line, in Kenyan shillings</caption>
            <thead>
              <tr>
                <th scope="col">Line</th>
                <th scope="col">Kind</th>
                <th scope="col">Basis</th>
                <th className="xk-su-num" scope="col">Low</th>
                <th className="xk-su-num" scope="col">High</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ phase, budget }) => (
                <FragmentRows budget={budget} key={phase.key} phase={phase} />
              ))}
              <tr className="is-total">
                <td colSpan="3">
                  <strong>All phases, the whole path to a first production run</strong>
                  <br />
                  <span className="xk-note">
                    {whole.unpricedCount} further lines carry no figure and are listed above.
                  </span>
                </td>
                <td className="xk-su-num">{fmtKes(whole.low)}</td>
                <td className="xk-su-num">{fmtKes(whole.high)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ol className="xk-su-notes">
          {NOTES.map((note) => (
            <li id={`su-${note.id}`} key={note.id}>
              <b>[{note.id.replace('n', '')}]</b>
              <span>{note.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** One phase: a banner row, its lines, and a subtotal summed from those lines. */
function FragmentRows({ phase, budget }) {
  const label = (key) => GROUPS.find((group) => group.key === key)?.label ?? key;

  return (
    <>
      <tr className="is-phase">
        <td colSpan="5">
          Phase {phase.n}. {phase.name} | {phase.plan}
        </td>
      </tr>
      {budget.lines.map((line) => (
        <tr key={line.id}>
          <th scope="row" style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, whiteSpace: 'normal' }}>
            {line.label}
            <Fn id={line.note} />
          </th>
          <td>{label(line.group)}</td>
          <td>
            <Tag kind={line.confidence} />
            {line.usd ? (
              <span className="xk-note">
                {' '}
                {line.usd[0] === line.usd[1]
                  ? fmtUsd(line.usd[0], { decimals: 0 })
                  : `${fmtUsd(line.usd[0], { decimals: 0 })} to ${fmtUsd(line.usd[1], { decimals: 0 })}`}
              </span>
            ) : null}
          </td>
          <td className="xk-su-num">{line.priced ? fmtKes(line.low) : 'n/a'}</td>
          <td className="xk-su-num">{line.priced ? fmtKes(line.high) : 'n/a'}</td>
        </tr>
      ))}
      <tr className="is-total">
        <td colSpan="3">
          Phase {phase.n} total
          {budget.unpricedCount > 0
            ? `, with ${budget.unpricedCount} ${budget.unpricedCount === 1 ? 'line' : 'lines'} not priced`
            : ''}
        </td>
        <td className="xk-su-num">{fmtKes(budget.low)}</td>
        <td className="xk-su-num">{fmtKes(budget.high)}</td>
      </tr>
    </>
  );
}
