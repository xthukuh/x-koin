import { useEffect, useRef, useState } from 'react';

import { batchQuote, nameOf, pendingTickets } from '../engine.js';
import { DRILLS, closeSession, ensureReady, openSession, serve, sessionCredit } from '../flows.js';
import { DRILL_WORDS, STEPS, plainError } from '../steps.js';
import { gasByPayer, kesSmall, kesStr, netChanges, plainKey } from './format.js';

function Choice({ label, value, options, onChange }) {
  if (options === 'bool') {
    return (
      <button type="button" className={`pg-toggle${value ? ' is-on' : ''}`} onClick={() => onChange(!value)} aria-pressed={value}>
        {label}
      </button>
    );
  }
  return (
    <div className="pg-choice" role="group" aria-label={label}>
      <span>{label}</span>
      {options.map((o) => (
        <button type="button" key={o} className={value === o ? 'is-on' : ''} onClick={() => onChange(o)}>
          {typeof o === 'string' && o in { amina: 1, baraka: 1, relayer: 1, mallory: 1, founder: 1 } ? nameOf(o).replace(' cold key', '') : o}
        </button>
      ))}
    </div>
  );
}

/** Inputs, the box, outputs. After a run the outputs are the real changes. */
function Box({ s, result }) {
  const changes = result ? netChanges(result.entries).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 6) : null;
  return (
    <div className="pg-box">
      <div className="pg-box__io">
        <span className="pg-box__tag">in</span>
        {s.box.in.map((x) => (
          <span className="pg-chip" key={x}>
            {x}
          </span>
        ))}
      </div>
      <div className="pg-box__arrow" aria-hidden="true" />
      <div className="pg-box__core">
        <b>{s.box.does}</b>
        <span>{s.box.by}</span>
      </div>
      <div className="pg-box__arrow" aria-hidden="true" />
      <div className="pg-box__io">
        <span className="pg-box__tag">out</span>
        {changes && changes.length
          ? changes.map(([k, v]) => (
              <span className={`pg-chip ${v > 0 ? 'pg-chip--up' : 'pg-chip--down'}`} key={k}>
                {plainKey(k)} {kesStr(v, { sign: true })}
              </span>
            ))
          : s.box.out.map((x) => (
              <span className="pg-chip pg-chip--ghost" key={x}>
                {x}
              </span>
            ))}
      </div>
    </div>
  );
}

function Outcome({ result }) {
  if (!result) return null;
  const failed = result.entries.find((e) => !e.ok);
  const gas = gasByPayer(result.entries);
  const payers = Object.entries(gas);
  const chainSteps = result.entries.filter((e) => e.layer === 'chain' && !e.rejected).length;
  const signed = result.entries.filter((e) => e.layer === 'wallet' && e.ok).length;
  return (
    <div className={`pg-outcome ${result.ok ? 'is-ok' : 'is-bad'}`}>
      <p className="pg-outcome__line">
        {result.verdict ? (result.ok ? 'Handled.' : 'Not as expected.') : result.ok ? 'Done.' : `Stopped: ${plainError(failed)}.`}{' '}
        {result.verdict && <span>{result.verdict}</span>}
      </p>
      <p className="pg-outcome__meta">
        {signed > 0 && <span>{signed} signature{signed > 1 ? 's' : ''} on the phone</span>}
        <span>
          {chainSteps} chain action{chainSteps === 1 ? '' : 's'}
        </span>
        {payers.map(([p, v]) => (
          <span key={p}>
            gas {kesSmall(v)} KES paid by {nameOf(p).replace(' (bridge)', '').replace(' admin', '')}
          </span>
        ))}
      </p>
    </div>
  );
}

/** Browse: the live data meter. */
function Browse({ world, form, commit, replace, onFinish }) {
  const w = world;
  const s = w.session;
  const [playing, setPlaying] = useState(false);
  const ref = useRef(w);
  ref.current = w;
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      const cur = ref.current;
      if (!cur.session || cur.session.done) {
        setPlaying(false);
        return;
      }
      replace(serve(cur, 250_000).world);
    }, 80);
    return () => clearInterval(id);
  }, [playing, replace]);
  useEffect(() => {
    if (s?.done) onFinish(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.done]);

  if (!s) {
    const start = () => {
      const r = openSession(w, { client: form.who, targetBytes: Math.round(form.mb * 1e6), offline: form.offline });
      commit(r, 'browse');
      if (r.ok) setPlaying(true);
    };
    return (
      <button type="button" className="pg-run" disabled={!w.deployed} onClick={start}>
        Start browsing {form.mb} MB
      </button>
    );
  }
  const used = s.limit - sessionCredit(w);
  const pct = (a, b) => (b > 0 ? Math.min(100, (a / b) * 100) : 0);
  const owed = Math.ceil(s.bytes / w.params.unitBytes) * w.escrow.pricePerUnit;
  return (
    <div className="pg-browse">
      <div className="pg-bar">
        <span style={{ width: `${pct(s.bytes, s.targetBytes)}%` }} />
        <em>
          {(s.bytes / 1e6).toFixed(1)} / {(s.targetBytes / 1e6).toFixed(0)} MB
        </em>
      </div>
      <div className="pg-bar pg-bar--credit" title={s.limitReason}>
        <span style={{ width: `${pct(used, s.limit)}%` }} />
        <em>
          credit {kesStr(used)} / {kesStr(s.limit)} KES
        </em>
      </div>
      <p className="pg-browse__stats">
        <span>
          <b>{s.receipts}</b> receipts
        </span>
        <span>
          owes <b>{kesStr(owed)}</b> KES
        </span>
        <span>
          <b>0</b> chain actions
        </span>
      </p>
      {s.throttled && <p className="pg-bad pg-small">Node stopped: credit used up.</p>}
      <div className="pg-row">
        {!s.done && (
          <button type="button" className="pg-btn" onClick={() => setPlaying(!playing)}>
            {playing ? 'Pause' : 'Play'}
          </button>
        )}
        {!s.done && (
          <button type="button" className="pg-btn" onClick={() => replace(serve(w, w.params.receiptBytes).world)}>
            +1 MB
          </button>
        )}
        {!s.done && (
          <button
            type="button"
            className="pg-btn"
            onClick={() => {
              setPlaying(false);
              replace(serve(w, s.targetBytes).world);
            }}
          >
            Skip to end
          </button>
        )}
        <button
          type="button"
          className="pg-btn"
          onClick={() => {
            setPlaying(false);
            if (!s.done) onFinish(s);
            replace(closeSession(w));
          }}
        >
          {s.done ? 'Close' : 'Stop'}
        </button>
      </div>
    </div>
  );
}

function Drills({ world, commit }) {
  return (
    <ul className="pg-drills">
      {DRILLS.map((d) => {
        const [ask, answer] = DRILL_WORDS[d.id] ?? [d.title, d.claim];
        return (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => {
                const prep = ensureReady(world);
                if (!prep.ok) return commit(prep, 'whatif');
                const r = d.run(prep.world);
                return commit({ world: r.world, ok: r.ok, entries: [...prep.entries, ...r.entries], verdict: `${ask}: ${answer}` }, 'whatif', { label: ask });
              }}
            >
              <b>{ask}</b>
              <span>{answer}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function RelayAdvice({ world }) {
  const pending = pendingTickets(world);
  if (!pending.length) return null;
  const q = batchQuote(world, pending);
  return (
    <p className={`pg-advice ${q.go ? 'is-ok' : 'is-warn'}`}>
      Fee earned {kesSmall(q.feeKes)} KES vs gas {kesSmall(q.gasKes)} KES. {q.go ? 'Worth sending now.' : 'A real relayer would wait and batch more. Run anyway to see it.'}
    </p>
  );
}

export default function Stage({ world, active, setActive, results, forms, setForm, commit, replace }) {
  const listRef = useRef(null);
  useEffect(() => {
    listRef.current?.querySelector('.pg-step.is-open')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <main className="pg-stage" ref={listRef}>
      {STEPS.map((s, i) => {
        const r = results[s.id];
        const open = i === active;
        const done = s.done(world);
        if (!open) {
          return (
            <button type="button" key={s.id} className={`pg-step pg-step--folded${done ? ' is-done' : ''}${r && !r.ok ? ' is-fail' : ''}`} onClick={() => setActive(i)}>
              <span className="pg-step__n">{done ? '✓' : i + 1}</span>
              <span className="pg-step__t">{s.title}</span>
              <span className="pg-step__r">{r ? (r.ok ? r.label ?? r.headline : `stopped: ${plainError(r.entries.find((e) => !e.ok))}`) : ''}</span>
            </button>
          );
        }
        const f = forms[s.id];
        const reason = s.ready?.(world) ?? (!world.deployed && s.id !== 'setup' ? 'Set up the rules first (step 1).' : null);
        const payoutFailed = s.id === 'cashout' && r && !r.ok && r.entries.some((e) => e.fn === 'M-Pesa B2C payout' && !e.ok);
        return (
          <section key={s.id} className={`pg-step is-open${s.kiosk ? ' pg-step--kiosk' : ''}`} aria-label={s.title}>
            <header className="pg-step__head">
              <span className="pg-step__count">
                {i + 1} / {STEPS.length}
              </span>
              <h2>{s.title}</h2>
              {s.kiosk && <span className="pg-kiosk-tag">at the kiosk</span>}
            </header>
            <p className="pg-step__what">{s.what}</p>
            <Box s={s} result={r} />
            {s.fields.length > 0 && (
              <div className="pg-controls">
                {s.fields.map(([k, label, options]) => (
                  <Choice key={k} label={label} value={f[k]} options={options} onChange={(v) => setForm(s.id, { ...f, [k]: v })} />
                ))}
              </div>
            )}
            {s.id === 'settle' && <RelayAdvice world={world} />}
            {reason && <p className="pg-hint">{reason}</p>}
            {s.live ? (
              <Browse world={world} form={f} commit={commit} replace={replace} onFinish={(sess) => commit({ world: null, ok: true, entries: world.ledger.filter((e) => e.flow === sess.flow) }, 'browse', { record: true })} />
            ) : s.drills ? (
              <Drills world={world} commit={commit} />
            ) : (
              <div className="pg-row">
                <button type="button" className="pg-run" disabled={Boolean(reason)} onClick={() => commit(s.run(world, f), s.id)}>
                  {r ? 'Run again' : 'Run'}
                </button>
                {payoutFailed && (
                  <button type="button" className="pg-btn" onClick={() => commit(s.retry(world, f), s.id)}>
                    Retry payout
                  </button>
                )}
              </div>
            )}
            <Outcome result={r} />
            <footer className="pg-step__nav">
              <button type="button" className="pg-btn" disabled={i === 0} onClick={() => setActive(i - 1)}>
                Back
              </button>
              <button type="button" className="pg-btn pg-btn--next" disabled={i === STEPS.length - 1} onClick={() => setActive(i + 1)}>
                Next: {STEPS[i + 1]?.short ?? ''}
              </button>
            </footer>
          </section>
        );
      })}
    </main>
  );
}
