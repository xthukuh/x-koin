/**
 * The two markers that appear all over this page: the confidence tag on a
 * budget line, and the superscript footnote link that carries its basis.
 */

const TAG_LABEL = {
  verified: 'verified',
  measured: 'measured',
  derived: 'derived',
  estimate: 'estimate',
  unquoted: 'unquoted',
  unpriced: 'not priced',
};

/** How much weight a figure carries, said out loud rather than implied. */
export function Tag({ kind }) {
  return (
    <span className={`xk-su-tag xk-su-tag--${kind}`} title={TAG_TITLE[kind]}>
      {TAG_LABEL[kind] ?? kind}
    </span>
  );
}

const TAG_TITLE = {
  verified: 'Read on a listing or a published price sheet.',
  measured: 'Produced by a run in this repository.',
  derived: 'Arithmetic on a verified or measured figure.',
  estimate: "This page's own number, with its basis in the footnote.",
  unquoted: 'An estimate standing in for a quotation nobody has asked for yet.',
  unpriced: 'The repository deliberately prints no number here.',
};

/** Superscript link down to the footnote that holds the basis. */
export function Fn({ id }) {
  if (!id) {
    return null;
  }
  return (
    <a className="xk-su-fn" href={`#su-${id}`} aria-label={`Footnote ${id.replace('n', '')}`}>
      [{id.replace('n', '')}]
    </a>
  );
}

/** The done, in progress, planned or blocked pill the whole site uses. */
export function Status({ status }) {
  return <span className={`xk-status xk-status--${status}`}>{status === 'progress' ? 'in progress' : status}</span>;
}
