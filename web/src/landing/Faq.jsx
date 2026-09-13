import { FAQ } from './data.js';

export default function Faq() {
  return (
    <section className="xk-section xk-section--tinted" id="faq">
      <div className="xk-wrap xk-wrap--narrow">
        <p className="xk-eyebrow">12 / questions</p>
        <h2>The six questions that get asked first.</h2>
        <div className="xk-faq">
          {FAQ.map((entry) => (
            <div key={entry.q}>
              <h3>{entry.q}</h3>
              <p>{entry.a}</p>
            </div>
          ))}
        </div>
        <div className="xk-callout">
          <b>Counsel caveat.</b> The regulatory answers above are our current understanding of open
          questions, not legal advice and not a settled position. CAK duty-cycle rules for 868 MHz in
          Kenya are unverified, CAK transit-resale licensing and the CBK e-money classification of
          XKN are under review, and each one gets revisited the moment counsel constrains it. Risk
          register: Drive document 06.
        </div>
      </div>
    </section>
  );
}
