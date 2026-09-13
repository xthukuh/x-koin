import { kes } from './data.js';

const VERDICT_CLASS = {
  chosen: 'xk-shop-verdict xk-shop-verdict-chosen',
  'runner-up': 'xk-shop-verdict xk-shop-verdict-runner-up',
  rejected: 'xk-shop-verdict xk-shop-verdict-rejected',
};

/** Every candidate the scout did not take, one compact row each. */
function OtherCandidates({ others }) {
  if (others.length === 0) {
    return null;
  }
  return (
    <div className="xk-shop-scroll">
      <table className="xk-shop-table">
        <thead>
          <tr>
            <th>Other listing</th>
            <th>Price</th>
            <th>Sold</th>
            <th>Verdict</th>
          </tr>
        </thead>
        <tbody>
          {others.map((candidate) => (
            <tr key={candidate.url ?? candidate.title}>
              <td>
                {candidate.url ? (
                  <a href={candidate.url} rel="noreferrer" target="_blank">
                    {candidate.title ?? candidate.url}
                  </a>
                ) : (
                  candidate.title ?? 'untitled'
                )}
              </td>
              <td className="xk-shop-mono">{kes(candidate.price_kes)}</td>
              <td className="xk-shop-mono">{candidate.sold ?? '-'}</td>
              <td className={VERDICT_CLASS[candidate.verdict] ?? 'xk-shop-verdict'}>
                {candidate.verdict ?? 'unrated'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Thumb({ src, alt }) {
  return (
    <div className="xk-shop-thumb">
      {src ? <img alt={alt} loading="lazy" src={src} /> : <span>no photo</span>}
    </div>
  );
}

/**
 * One scouted line as a fixed-shape tile: photo, name, one-line purpose, the
 * money row, the seller facts, and the buy link. Everything longer sits behind
 * "More" so every tile in a grid is the same height.
 */
export default function PartCard({ part }) {
  const chosen = part.chosen;
  const title = chosen?.title ?? part.line;
  const facts = chosen
    ? [chosen.store, chosen.shipping, chosen.sold ? `${chosen.sold} sold` : null, chosen.rating ? `${chosen.rating} rating` : null]
    : [part.local ? 'buy in Nairobi' : 'not scouted yet'];

  return (
    <article className="xk-shop-tile">
      <Thumb alt={title} src={part.image} />
      <div className="xk-shop-tile-body">
        <h3 className="xk-shop-tile-name" title={part.line}>{part.line}</h3>
        <p className="xk-shop-tile-why">{part.why}</p>
        <p className="xk-shop-tile-money xk-shop-mono">
          {chosen ? (
            <>
              <span>{kes(part.unitKes)}</span>
              <span className="xk-shop-dim">x {part.qty}</span>
              <strong>{kes(part.lineKes)}</strong>
            </>
          ) : (
            <span className="xk-shop-dim">qty {part.qty}</span>
          )}
        </p>
        <p className="xk-shop-tile-facts">{facts.filter(Boolean).join(' | ')}</p>
        <div className="xk-shop-tile-actions">
          {chosen?.url ? (
            <a className="xk-shop-buy" href={chosen.url} rel="noreferrer" target="_blank">
              Open listing
            </a>
          ) : null}
          <details className="xk-shop-more">
            <summary>More</summary>
            <div className="xk-shop-more-body">
              {chosen?.title ? <p><span className="xk-shop-dim">Listing:</span> {chosen.title}</p> : null}
              {part.spec ? <p><span className="xk-shop-dim">Spec:</span> {part.spec}</p> : null}
              {chosen?.price_note ? <p><span className="xk-shop-dim">Price:</span> {chosen.price_note}</p> : null}
              {chosen?.notes ? <p><span className="xk-shop-dim">Check:</span> {chosen.notes}</p> : null}
              <p><span className="xk-shop-dim">Role:</span> {part.roleText}</p>
              <OtherCandidates others={part.others} />
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}
