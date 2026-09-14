import { COLOR, Grid, MONO, Panel, Reveal, Rows, Slide, Stat, ms } from './parts.jsx';

/** Chapter 9. Five phases, each with an entry and an exit condition. */

const PHASES = [
  ['1 bench', 'the parts arrive', 'all six demos pass, and four repository claims are confirmed or corrected against a measurement'],
  ['2 pilot', 'a company, a landlord, counsel, an app a tenant can install', 'thirty days with paying tenants, and five numbers that did not exist before'],
  ['3 gates', 'they start now, alongside everything else', 'spectrum, type approval, mains certification, transit resale, the token legal character'],
  ['4 board', 'the seven proof points a breadboard has to settle', 'one board that passes the same six demos, quotable by a contract manufacturer'],
  ['5 factory', 'a written quotation against the manufacturing brief', 'units landed in Nairobi at a known cost, with the tariff settled rather than assumed'],
];

function Roadmap({ t }) {
  return (
    <Slide
      t={t}
      kicker="roadmap"
      title="A phase starts because the last one finished, not because a date arrived"
      lede="xKoin today is a working protocol with no building attached to it. These five phases close that gap."
      foot={['the dated plan is a plan, and something will go wrong', 'paper 13']}
    >
      <Rows
        t={t}
        at={ms(0.9)}
        gap={330}
        size={16}
        widths={['14%', '33%', '53%']}
        head={['phase', 'entry condition', 'exit condition']}
        rows={PHASES}
      />
      <Grid cols={2} gap={22} style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <Panel t={t} at={ms(3.6)} title="the two dependencies most likely to move it" tone={COLOR.warn}>
          <div style={{ fontSize: 16.5, color: COLOR.muted, lineHeight: 1.4 }}>
            Counsel first written opinion gates three separate rows and is the cheapest item on the roadmap.
            The per-unit price decision gates everything after it, because a price that cannot clear measured
            backhaul cost makes the economics of every later phase wrong rather than merely uncertain.
          </div>
        </Panel>
        <Grid cols={2} gap={14}>
          <Stat t={t} at={ms(4.6)} value="KES 25k to 60k" label="range A, one bench kit that runs all six demos once" />
          <Stat t={t} at={ms(4.9)} value="KES 250k to 900k" label="range B, one building for thirty days. Its top is nearly four times its bottom because three lines are unpriced." tone={COLOR.warn} />
        </Grid>
      </Grid>
      <Reveal
        t={t}
        at={ms(6.0)}
        from="fade"
        style={{ position: 'absolute', right: 0, top: 0, fontFamily: MONO, fontSize: 15, color: COLOR.faint }}
      >
        range C prints no number, because none has been quoted
      </Reveal>
    </Slide>
  );
}

export const SCENES = {
  roadmap: Roadmap,
};
