import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { DEFAULT_PARAMS, createWorld, metrics } from '../engine.js';
import { closeSession, openSession, serve } from '../flows.js';
import { STEPS, WORDS } from '../steps.js';
import Console from './Console.jsx';
import Economics from './Economics.jsx';
import FlowMap, { headline } from './FlowMap.jsx';
import { gasStr, kesSmall } from './format.js';
import Ledger, { Entry } from './Ledger.jsx';
import Money from './Money.jsx';
import Stage from './Stage.jsx';

const PANELS = [
  ['map', 'Map', 'Aerial view of every step'],
  ['money', 'Money', 'Who holds what'],
  ['proof', 'Proof', 'Signatures, gas and events of the last step'],
  ['log', 'Log', 'Every action so far'],
];
const OVERLAYS = [
  ['costs', 'Costs', 'Live cost maths and inputs'],
  ['tools', 'Tools', 'Call any contract function directly'],
  ['help', 'Help', 'Plain words'],
];

function diffMap(before, after) {
  const a = metrics(before);
  const b = metrics(after);
  const out = {};
  for (const k of Object.keys(b)) if (a[k] !== b[k]) out[k] = b[k] - a[k];
  return out;
}

const freshForms = () => Object.fromEntries(STEPS.map((s) => [s.id, { ...s.form }]));

/** Run a step's default action to completion, including an instant browse. */
function runDefault(world, s, form) {
  if (s.live) {
    const o = openSession(world, { client: form.who, targetBytes: Math.round(form.mb * 1e6), offline: form.offline });
    if (!o.ok) return o;
    let w = o.world;
    const entries = [...o.entries];
    while (!w.session.done) {
      const r = serve(w, 1_000_000);
      w = r.world;
      entries.push(...r.entries);
    }
    return { world: closeSession(w), ok: entries.every((e) => e.ok), entries };
  }
  return s.run(world, form);
}

export default function Playground() {
  const [hist, setHist] = useState(() => ({ worlds: [createWorld()], changed: {}, last: [] }));
  const [results, setResults] = useState({});
  const [active, setActive] = useState(0);
  const [forms, setForms] = useState(freshForms);
  // On a phone the side panels are drawers over the step, so they start closed.
  const [panels, setPanels] = useState(() => ({ map: true, money: !window.matchMedia('(max-width: 820px)').matches, proof: false, log: false }));
  const [overlay, setOverlay] = useState(null);
  const world = hist.worlds.at(-1);
  const worldRef = useRef(world);
  worldRef.current = world;

  useEffect(() => {
    const prev = document.title;
    document.title = 'Playground | xKoin';
    return () => {
      document.title = prev;
    };
  }, []);

  const formsRef = useRef(forms);
  formsRef.current = forms;
  const commit = useCallback((result, stepId, opts = {}) => {
    const step = STEPS.find((s) => s.id === stepId);
    const key = step?.head?.(formsRef.current[stepId]);
    const record = { ok: result.ok, entries: result.entries ?? [], verdict: result.verdict, headline: headline(result.entries ?? [], result.ok, key) };
    if (opts.label) record.label = `${opts.label}: ${result.ok ? 'handled' : 'see result'}`;
    if (stepId) setResults((r) => ({ ...r, [stepId]: record }));
    if (opts.record || !result.world) return;
    setHist((h) => ({ worlds: [...h.worlds.slice(-80), result.world], changed: diffMap(h.worlds.at(-1), result.world), last: result.entries ?? [] }));
  }, []);

  const replace = useCallback((next) => {
    setHist((h) => {
      const prev = h.worlds.at(-1);
      const fresh = next.ledger.slice(prev.ledger.length);
      return { worlds: [...h.worlds.slice(0, -1), next], changed: diffMap(prev, next), last: fresh.length ? fresh : h.last };
    });
  }, []);

  const undo = () => setHist((h) => (h.worlds.length > 1 ? { worlds: h.worlds.slice(0, -1), changed: {}, last: [] } : h));
  const reset = (over = {}) => {
    setHist({ worlds: [createWorld({ ...DEFAULT_PARAMS, ...over })], changed: {}, last: [] });
    setResults({});
    setActive(0);
    setForms(freshForms());
  };
  const setForm = (id, f) => setForms((all) => ({ ...all, [id]: f }));
  const toggle = (k) => setPanels((p) => ({ ...p, [k]: !p[k] }));

  // Run every remaining step now, in one pass, with no timers. Each step stays one undo.
  const playAll = () => {
    let w = worldRef.current.session ? closeSession(worldRef.current) : worldRef.current;
    let at = active;
    for (let i = active; i < STEPS.length && !STEPS[i].drills; i += 1) {
      const s = STEPS[i];
      if (s.ready?.(w)) continue;
      const r = runDefault(w, s, forms[s.id]);
      commit(r, s.id);
      w = r.world;
      at = i;
      if (!r.ok) break;
    }
    setActive(Math.min(at + 1, STEPS.length - 1));
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, select, textarea')) return;
      if (e.key === 'ArrowRight') setActive((a) => Math.min(STEPS.length - 1, a + 1));
      else if (e.key === 'ArrowLeft') setActive((a) => Math.max(0, a - 1));
      else if (e.key === 'Escape') setOverlay(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const chainTx = world.ledger.filter((e) => e.layer === 'chain' && !e.rejected);
  const gasKes = chainTx.reduce((a, e) => a + e.kes, 0);
  const last = hist.last;

  return (
    <div className={`pg${panels.map ? ' has-map' : ''}${panels.money ? ' has-money' : ''}${panels.proof ? ' has-proof' : ''}${panels.log ? ' has-log' : ''}`}>
      <header className="pg-top">
        <Link to="/" className="pg-brand" title="Back to the site">
          xKoin <span>playground</span>
        </Link>
        <div className="pg-toggles" role="group" aria-label="Panels">
          {PANELS.map(([k, label, hint]) => (
            <button type="button" key={k} className={panels[k] ? 'is-on' : ''} onClick={() => toggle(k)} title={hint} aria-pressed={panels[k]}>
              {label}
            </button>
          ))}
          <span className="pg-sep" />
          {OVERLAYS.map(([k, label, hint]) => (
            <button type="button" key={k} className={overlay === k ? 'is-on' : ''} onClick={() => setOverlay(overlay === k ? null : k)} title={hint}>
              {label}
            </button>
          ))}
        </div>
        <div className="pg-actions">
          <span className="pg-meter" title="All chain actions so far">
            {chainTx.length} tx, {gasStr(chainTx.reduce((a, e) => a + e.gas, 0))} gas, {kesSmall(gasKes)} KES
          </span>
          <button type="button" className="pg-btn" onClick={playAll} title="Run every remaining step, in order, now">
            Play all
          </button>
          <button type="button" className="pg-btn" onClick={undo} disabled={hist.worlds.length < 2}>
            Undo
          </button>
          <button type="button" className="pg-btn" onClick={() => reset()}>
            Reset
          </button>
        </div>
      </header>

      {panels.map && (
        <div className="pg-maprow">
          <FlowMap world={world} active={active} results={results} onPick={setActive} />
        </div>
      )}

      {panels.money && <Money world={world} changed={hist.changed} />}

      <Stage world={world} active={active} setActive={setActive} results={results} forms={forms} setForm={setForm} commit={commit} replace={replace} />

      {panels.proof && (
        <aside className="pg-panel pg-proof" aria-label="Proof">
          <header className="pg-panel__head">
            <h2>Proof</h2>
            <span className="pg-hint">last step, open a row</span>
          </header>
          {last.length === 0 ? (
            <p className="pg-hint">Run a step to see its signatures, gas and events.</p>
          ) : (
            <ol className="xk-dm-ledger">
              {last.slice(-12).map((e) => (
                <Entry e={e} key={e.id} />
              ))}
            </ol>
          )}
        </aside>
      )}

      {panels.log && (
        <section className="pg-log" aria-label="Log">
          <Ledger ledger={world.ledger} />
        </section>
      )}

      {overlay && (
        <div className="pg-overlay" role="dialog" aria-label={overlay}>
          <div className="pg-overlay__card">
            <button type="button" className="pg-close" onClick={() => setOverlay(null)} aria-label="Close">
              Close
            </button>
            {overlay === 'costs' && <Economics world={world} setParams={(over) => replace({ ...world, params: { ...world.params, ...over } })} resetWith={reset} />}
            {overlay === 'tools' && <Console world={world} commit={(r) => commit(r)} />}
            {overlay === 'help' && (
              <section className="pg-help">
                <h2>Plain words</h2>
                <dl>
                  {WORDS.map(([word, tech, text]) => (
                    <div key={word}>
                      <dt>
                        {word} <span>{tech}</span>
                      </dt>
                      <dd>{text}</dd>
                    </div>
                  ))}
                </dl>
                <h2>How to use</h2>
                <ul>
                  <li>Steps run top to bottom, in the order they happen. Pick one on the map or press the arrow keys.</li>
                  <li>Each step is a box: what goes in, what it does, what comes out. Run it to see the real result.</li>
                  <li>Money shows every balance. Changed cells light up.</li>
                  <li>Proof shows the signatures, gas and events behind the last step.</li>
                  <li>Play all runs the whole story. Undo steps back one action.</li>
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
