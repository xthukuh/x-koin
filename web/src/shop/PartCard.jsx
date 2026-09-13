import Carousel from './Carousel.jsx';
import { kes } from './data.js';

const VERDICT_CLASS = {
  chosen: 'xk-shop-verdict xk-shop-verdict-chosen',
  'runner-up': 'xk-shop-verdict xk-shop-verdict-runner-up',
  rejected: 'xk-shop-verdict xk-shop-verdict-rejected',
};

function Fact({ label, children }) {
  if (children === null || children === undefined || children === '') {
    return null;
  }
  return (
    <div className="xk-shop-fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Prose({ label, text }) {
  if (!text) {
    return null;
  }
  return (
    <p className="xk-shop-prose">
      <span className="xk-shop-prose-label">{label}</span>
      <br />
      {text}
    </p>
  );
}

/**
 * Every candidate the scout did not take, as a compact table. It scrolls inside
 * its own container so a long listing title cannot widen the page, and it sits
 * behind a details element because the reader wants the chosen row first.
 */
function OtherCandidates({ others }) {
  if (others.length === 0) {
    return null;
  }
  return (
    <details className="xk-shop-others">
      <summary>
        Other candidates ({others.length})
      </summary>
      <div className="xk-shop-scroll">
        <table className="xk-shop-table">
          <thead>
            <tr>
              <th>Listing</th>
              <th>Price</th>
              <th>Sold</th>
              <th>Rating</th>
              <th>Verdict</th>
              <th>Notes</th>
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
                <td className="xk-shop-mono">
                  {candidate.rating
                    ? `${candidate.rating}${candidate.reviews ? ` / ${candidate.reviews}` : ''}`
                    : '-'}
                </td>
                <td className={VERDICT_CLASS[candidate.verdict] ?? 'xk-shop-verdict'}>
                  {candidate.verdict ?? 'unrated'}
                </td>
                <td>{candidate.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/**
 * A line the scout marked for local purchase, or one nobody has priced yet.
 * It carries no gallery and no money, only the reason it is on the list.
 */
function NoteCard({ part }) {
  return (
    <article className="xk-shop-notecard">
      <p className="xk-shop-tag">{part.local ? 'buy locally' : 'not scouted yet'}</p>
      <h3 className="xk-shop-line">{part.line}</h3>
      <p className="xk-shop-role xk-shop-mono">
        {part.roleText} | qty {part.qty}
      </p>
      {part.why ? <p className="xk-shop-why">{part.why}</p> : null}
      {part.spec ? <p className="xk-shop-spec">{part.spec}</p> : null}
      <OtherCandidates others={part.others} />
    </article>
  );
}

export default function PartCard({ part }) {
  const chosen = part.chosen;
  if (!chosen) {
    return <NoteCard part={part} />;
  }

  const title = chosen.title ?? part.line;

  return (
    <article className="xk-shop-card">
      <Carousel alt={title} images={chosen.images} />

      <div className="xk-shop-card-body">
        <h3 className="xk-shop-line">{part.line}</h3>
        <p className="xk-shop-role xk-shop-mono">
          {part.roleText} | qty {part.qty}
        </p>
        {part.why ? <p className="xk-shop-why">{part.why}</p> : null}
        {part.spec ? <p className="xk-shop-spec">{part.spec}</p> : null}

        <p className="xk-shop-chosen">
          <span className="xk-shop-chosen-title">
            {chosen.url ? (
              <a href={chosen.url} rel="noreferrer" target="_blank">
                {title}
              </a>
            ) : (
              title
            )}
          </span>
        </p>

        <p className="xk-shop-price">
          <span>{kes(part.unitKes)}</span>
          <span>x {part.qty}</span>
          <span>=</span>
          <span className="xk-shop-price-total">{kes(part.lineKes)}</span>
        </p>

        <dl className="xk-shop-facts">
          <Fact label="Shipping">{chosen.shipping ?? 'not shown'}</Fact>
          <Fact label="Sold">{chosen.sold ?? 'not shown'}</Fact>
          <Fact label="Rating">
            {chosen.rating
              ? `${chosen.rating}${chosen.reviews ? ` over ${chosen.reviews} reviews` : ''}`
              : 'not shown'}
          </Fact>
          <Fact label="Store">
            {chosen.store_url ? (
              <a href={chosen.store_url} rel="noreferrer" target="_blank">
                {chosen.store ?? 'store page'}
              </a>
            ) : (
              chosen.store ?? 'not shown'
            )}
          </Fact>
        </dl>

        <Prose label="Price note" text={chosen.price_note} />
        <Prose label="Authenticity and why this one" text={chosen.notes} />
      </div>

      <OtherCandidates others={part.others} />
    </article>
  );
}
