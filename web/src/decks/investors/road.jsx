import { Reveal, ease, item, ms, stage } from '../../player/index.js';

import { Condition, Foot, Head } from './parts.jsx';

/**
 * Scenes 19 and 20: what the money buys, and where to read the rest.
 *
 * The three funding ranges and their bases are
 * docs/papers/13-roadmap.md section 8. The dated plan is section 9 of the same
 * paper and is a plan, not a commitment. The links at the end match
 * web/src/shell/nav.js.
 */

const RANGES = [
  {
    key: 'bench',
    tag: 'Phase 1',
    name: 'The bench proof',
    money: 'KES 25,000 to 60,000',
    tone: 'var(--xk-good)',
    buys: 'One kit that runs all six demonstrations once. Twelve of about twenty one parts are already priced.',
    unlocks: 'Firmware on real hardware for the first time.',
  },
  {
    key: 'pilot',
    tag: 'Phase 2',
    name: 'One building, thirty days',
    money: 'KES 250,000 to 900,000',
    tone: 'var(--xk-accent)',
    buys: 'Hardware for one block, three months of running cost, the lawyer opinion, the company, and the phone app built rather than sketched.',
    unlocks: 'The cost of backhaul measured, and the price finally decided.',
  },
  {
    key: 'board',
    tag: 'Phase 4',
    name: 'The first board run',
    money: 'no number yet',
    tone: 'var(--xk-faint)',
    buys: 'Nothing is quoted, so this paper prints no figure. The manufacturing brief is the document that turns it into a quotation.',
    unlocks: 'A cheaper box, made rather than assembled.',
  },
];

const PLAN = [
  ['2026 Q4', 'Parts land, firmware runs on hardware, the lawyer is briefed'],
  ['2027 Q1', 'The rest of the demonstrations pass, the company exists'],
  ['2027 Q2', 'One building, thirty days, paying tenants, the price decided'],
  ['2027 Q3', 'The central bank question settled, the board designed'],
  ['2028 Q1', 'First production run ordered'],
];

function TheRoadAhead({ t }) {
  return (
    <div className="xk-scene">
      <Head
        kicker="19 / the road ahead"
        title="What the money buys, phase by phase."
        lede="Ranges, with the basis of each one named. Anything this repository cannot price is listed as unpriced rather than guessed."
      />
      <div className="xk-scene__body" style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {RANGES.map((range, i) => {
            const p = item(t, ms(0.4), i, 480, 520, ease.outCubic);
            return (
              <div
                key={range.key}
                style={{
                  opacity: p,
                  transform: `translateY(${(1 - p) * 18}px)`,
                  border: `1px solid ${range.tone}`,
                  background: 'var(--xk-surface)',
                  padding: '14px 16px 16px',
                  minWidth: 0,
                }}
              >
                <div style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 13, letterSpacing: '0.12em', color: range.tone }}>
                  {range.tag}
                </div>
                <div style={{ fontFamily: 'var(--xk-font-mono)', fontSize: 22, margin: '4px 0 6px' }}>{range.name}</div>
                <div className="xk-mono" style={{ fontSize: 24, color: range.tone, marginBottom: 10 }}>
                  {range.money}
                </div>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.4, color: 'var(--xk-muted)' }}>{range.buys}</p>
                <p style={{ margin: '8px 0 0', fontSize: 16, lineHeight: 1.4 }}>{range.unlocks}</p>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {PLAN.map(([when, what], i) => {
            const p = item(t, ms(2.2), i, 260, 420, ease.outCubic);
            return (
              <div key={when} style={{ opacity: p, borderTop: '2px solid var(--xk-line)', paddingTop: 10 }}>
                <div className="xk-mono" style={{ fontSize: 17, color: 'var(--xk-accent)' }}>
                  {when}
                </div>
                <div style={{ fontSize: 15, color: 'var(--xk-muted)', lineHeight: 1.35, marginTop: 4 }}>{what}</div>
              </div>
            );
          })}
        </div>

        <Condition t={t} at={ms(4.0)}>
          That table is a plan, not a commitment, and no quarter in it has been promised to anyone.
          Three questions sit ahead of any field trial: whether reselling transit needs a licence,
          what the radio rules allow, and whether a shilling redeemable token counts as electronic
          money. The full budget in shillings is on the startup page.
        </Condition>
      </div>
      <Foot source="docs/papers/13-roadmap.md sections 8 and 9" right="ranges, with their basis named" />
    </div>
  );
}

const LINKS = [
  ['/startup', 'The plan and the budget, in shillings, phase by phase'],
  ['/docs', 'Fourteen papers and nine worked use cases, as written'],
  ['/replay', 'Every payload and signature of the proof runs, opened up'],
  ['/shop', 'The parts list, with a scouted listing per line'],
  ['/blueprints', 'Schematics of each device'],
  ['/map', 'Every page on this site'],
];

function WhereToReadMore({ t }) {
  return (
    <div className="xk-scene">
      <Head
        kicker="20 / where to read more"
        title="Nothing here is a projection dressed as a fact."
        lede="Every figure in this deck names the file it came from. Those files are on this site, and the code is public."
      />
      <div className="xk-scene__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, alignContent: 'start' }}>
        {LINKS.map(([path, text], i) => {
          const p = item(t, ms(0.4), i, 300, 460, ease.outCubic);
          return (
            <div
              key={path}
              style={{
                opacity: p,
                transform: `translateX(${(1 - p) * 20}px)`,
                display: 'grid',
                gridTemplateColumns: '170px 1fr',
                gap: 18,
                alignItems: 'baseline',
                borderBottom: '1px solid var(--xk-line)',
                padding: '12px 4px',
              }}
            >
              <span className="xk-mono" style={{ fontSize: 24, color: 'var(--xk-accent)' }}>
                {path}
              </span>
              <span style={{ fontSize: 18, color: 'var(--xk-muted)' }}>{text}</span>
            </div>
          );
        })}
      </div>
      <Reveal
        t={t}
        at={ms(2.8)}
        from="up"
        style={{ borderTop: '1px solid var(--xk-line)', paddingTop: 14, marginTop: 8, fontSize: 21, lineHeight: 1.4 }}
      >
        xKoin is a proof of concept with a test suite, not a service anyone can buy yet. The legal
        questions are open and named, and nothing on this page is an offer.
      </Reveal>
      <Foot
        source="web/src/shell/nav.js; github.com/xthukuh/x-koin"
        right={`${(stage(t, 0, ms(9), ease.linear) * 100).toFixed(0)}%`}
      />
    </div>
  );
}

export const ROAD_SCENES = [
  {
    id: 'the-road-ahead',
    title: 'The road ahead',
    duration: ms(11),
    caption:
      'Twenty five to sixty thousand shillings buys the bench kit. Two hundred and fifty thousand to nine hundred thousand buys one building for thirty days, which is where the price finally gets decided. The board run has no quotation, so it carries no number.',
    Scene: TheRoadAhead,
  },
  {
    id: 'where-to-read-more',
    title: 'Where to read more',
    duration: ms(9),
    caption:
      'Every figure in this deck names the file it came from, and those files are on this site. The plan and the budget are on the startup page, the papers are under docs, and the proof runs can be replayed line by line.',
    Scene: WhereToReadMore,
  },
];
