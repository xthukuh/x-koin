import { Reveal, ease, item, ms, stage } from '../../player/index.js';

import { Foot, Head } from './parts.jsx';

/**
 * Scenes 17 and 18: security stated as rules a non-engineer can check, and the
 * ceiling written into every key.
 *
 * The eight Laws and their named tests are docs/papers/10-security-and-trust.md
 * section 2 and the LAWS table in web/src/landing/data.js. The key ceilings are
 * section 5 of the same paper and the TRUSTED table beside it.
 */

const LAWS = [
  ['You are your key', 'There are no accounts to hack, because there are no accounts.'],
  ['No pass, no entry', 'Nobody gets on the network without a pass bought with real money.'],
  ['Only signed bytes are owed', 'A node can never claim for bytes you did not sign for.'],
  ['A faked total is a broken signature', 'Changing one digit of the count invalidates the signature over it.'],
  ['Sending the same receipt twice pays nothing', 'The claim is a running total, so a repeat adds zero.'],
  ['Nobody is owed more than they put in', 'Settlement is capped at the money actually deposited.'],
  ['The books cannot go short', 'What is held always equals what is owed plus what is earned.'],
  ['Rubbish dies at the door', 'A corrupted message fails a checksum before anything reads it.'],
];

function TheEightRules({ t }) {
  return (
    <div className="xk-scene">
      <Head
        kicker="17 / security by construction"
        title="Eight rules, and each one has a test that fails if it is broken."
        lede="This is the threat model. It is written as things that must always be true, not as promises."
      />
      <div className="xk-scene__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignContent: 'start' }}>
        {LAWS.map(([law, plain], i) => {
          const p = item(t, ms(0.4), i, 320, 460, ease.outCubic);
          return (
            <div
              key={law}
              style={{
                opacity: p,
                transform: `translateY(${(1 - p) * 16}px)`,
                border: '1px solid var(--xk-line)',
                background: 'var(--xk-surface)',
                padding: '12px 14px 14px',
                minWidth: 0,
              }}
            >
              <div style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 13, letterSpacing: '0.1em', color: 'var(--xk-accent)' }}>
                LAW {i + 1}
              </div>
              <div style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 18, margin: '6px 0 8px', lineHeight: 1.2 }}>{law}</div>
              <div style={{ fontSize: 15, color: 'var(--xk-muted)', lineHeight: 1.4 }}>{plain}</div>
            </div>
          );
        })}
      </div>
      <Reveal
        t={t}
        at={ms(3.4)}
        from="up"
        style={{ display: 'flex', gap: 42, marginTop: 14, alignItems: 'baseline' }}
      >
        <span>
          <b className="xk-mono" style={{ fontSize: 30, color: 'var(--xk-good)' }}>
            0 of 20,000
          </b>
          <span style={{ fontSize: 16, color: 'var(--xk-muted)', marginLeft: 10 }}>
            deliberately corrupted messages were accepted
          </span>
        </span>
        <span>
          <b className="xk-mono" style={{ fontSize: 30 }}>
            28
          </b>
          <span style={{ fontSize: 16, color: 'var(--xk-muted)', marginLeft: 10 }}>
            contract tests passing, including a 256 run solvency check
          </span>
        </span>
      </Reveal>
      <Foot source="docs/papers/10-security-and-trust.md section 2; each Law names its test" right="rules, not promises" />
    </div>
  );
}

const KEYS = [
  {
    who: 'The key that makes tokens',
    can: 'Make at most one day of its cap, then it is switched off',
    cannot: 'Touch the balance of any user. It can only destroy tokens it holds itself.',
    tone: 'var(--xk-money)',
  },
  {
    who: 'The owner key',
    can: 'Move the price inside a fixed band, once a day',
    cannot: 'Stop settlement, take money out of escrow, or redirect the fee.',
    tone: 'var(--xk-accent)',
  },
  {
    who: 'The key that pushes claims to the chain',
    can: 'Nothing. Anyone at all can do this job',
    cannot: 'Change a single figure, because the signatures decide.',
    tone: 'var(--xk-good)',
  },
  {
    who: 'The founder payout',
    can: 'Only ever pay one fixed destination',
    cannot: 'Be redirected without seven public days of notice and the current holder can veto it.',
    tone: 'var(--xk-plc)',
  },
];

function BoundedKeys({ t }) {
  return (
    <div className="xk-scene">
      <Head
        kicker="18 / what any one key can do"
        title="Every key has a ceiling, and the ceiling is in the contract."
        lede="There is no key in this system that can empty it, and that includes the founder's."
      />
      <div className="xk-scene__body" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
        {KEYS.map((entry, i) => {
          const p = item(t, ms(0.4), i, 520, 500, ease.outCubic);
          return (
            <div
              key={entry.who}
              style={{
                opacity: p,
                transform: `translateX(${(1 - p) * 22}px)`,
                display: 'grid',
                gridTemplateColumns: '300px 1fr 1fr',
                gap: 20,
                alignItems: 'center',
                borderLeft: `3px solid ${entry.tone}`,
                background: 'var(--xk-surface)',
                padding: '13px 16px',
              }}
            >
              <span style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 19, color: entry.tone }}>{entry.who}</span>
              <span style={{ fontSize: 18 }}>
                <span style={{ color: 'var(--xk-faint)', fontFamily: 'var(--xk-font-mono)', fontSize: 14, display: 'block' }}>CAN</span>
                {entry.can}
              </span>
              <span style={{ fontSize: 18 }}>
                <span style={{ color: 'var(--xk-faint)', fontFamily: 'var(--xk-font-mono)', fontSize: 14, display: 'block' }}>CANNOT</span>
                {entry.cannot}
              </span>
            </div>
          );
        })}

        <Reveal
          t={t}
          at={ms(3.0)}
          from="up"
          style={{ borderTop: '1px solid var(--xk-line)', paddingTop: 14, marginTop: 4, fontSize: 21, lineHeight: 1.4 }}
        >
          And the record of what was settled cannot be edited or removed by anyone, the founder
          included. The network keeps settling even if the company disappears.
        </Reveal>
      </div>
      <Foot
        source="docs/papers/10-security-and-trust.md sections 4 and 5"
        right={`${(stage(t, 0, ms(10), ease.linear) * 100).toFixed(0)}%`}
      />
    </div>
  );
}

export const SECURITY_SCENES = [
  {
    id: 'the-eight-rules',
    title: 'Eight rules with tests',
    duration: ms(10),
    caption:
      'The threat model is written as eight rules, and each one has a named test that fails if the rule is broken. Twenty thousand deliberately corrupted messages were fed to the protocol and not one was accepted.',
    Scene: TheEightRules,
  },
  {
    id: 'bounded-keys',
    title: 'Every key has a ceiling',
    duration: ms(10),
    caption:
      'No single key can empty the system. A stolen minting key leaks at most one day of its cap. The owner can move the price inside a band once a day and cannot halt settlement or touch the deposits. Nobody can edit the settled record.',
    Scene: BoundedKeys,
  },
];
