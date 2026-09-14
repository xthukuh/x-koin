import { Link } from 'react-router-dom';

import Ask from '../startup/Ask.jsx';
import Budget from '../startup/Budget.jsx';
import PhaseTimeline from '../startup/PhaseTimeline.jsx';
import RevenuePath from '../startup/RevenuePath.jsx';
import Risks from '../startup/Risks.jsx';
import TeamAndAsks from '../startup/TeamAndAsks.jsx';
import UseOfFunds from '../startup/UseOfFunds.jsx';
import '../startup/startup.css';

/**
 * /startup. The page an investor is shown when they ask what the money is for.
 *
 * Every figure comes from ../startup/data.js, which is compiled from the papers
 * and the sourcing files rather than typed into the markup, and every total on
 * the page is summed from line items at render time. Sections in order: the ask,
 * the phase roadmap, the budget by line, the path to revenue, the tranches
 * against their milestones, the risks, and the team with the three asks that are
 * not money.
 */
export default function Startup() {
  return (
    <main className="xk-page xk-su">
      <Ask />
      <PhaseTimeline />
      <Budget />
      <RevenuePath />
      <UseOfFunds />
      <Risks />
      <TeamAndAsks />

      <section className="xk-section xk-section--tight">
        <div className="xk-wrap">
          <div className="xk-su-foot">
            <span className="xk-mono">Startup plan, compiled 2026-09-14 from the repository</span>
            <span>
              Sources: <Link to="/docs/papers/13-roadmap">paper 13</Link>,{' '}
              <Link to="/docs/papers/04-settlement-and-economics">paper 04</Link>,{' '}
              <Link to="/docs/papers/01-problem-and-market">paper 01</Link>,{' '}
              <Link to="/docs/papers/11-regulatory-and-safety">paper 11</Link>,{' '}
              <Link to="/docs/papers/12-proof-of-concept-plan">paper 12</Link>,{' '}
              <Link to="/shop">the sourcing files</Link>.
            </span>
          </div>
          <p className="xk-note" style={{ marginTop: '0.9rem' }}>
            This page is a plan, not an offer of securities, and nothing on this site is an offer of
            a connectivity service. No device has transmitted outside a bench and the regulatory
            questions in <Link to="/docs/papers/11-regulatory-and-safety">paper 11</Link> are open.
          </p>
        </div>
      </section>
    </main>
  );
}
