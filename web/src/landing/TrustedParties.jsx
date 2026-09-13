import { TRUSTED } from './data.js';

export default function TrustedParties() {
  return (
    <section className="xk-section xk-section--tinted" id="trust">
      <div className="xk-wrap">
        <p className="xk-eyebrow">10 / trusted parties, stated plainly</p>
        <h2>Zero-trust is true of the peer layer. It is not yet true of the fiat boundary.</h2>
        <p className="xk-lede">
          Anyone reviewing this project should find that here rather than discover it. Four keys hold
          power today. Each row says what the key can do, what happens if it is stolen, and how it
          stops being trusted.
        </p>

        <div className="xk-tablewrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Key</th>
                <th scope="col">Holder</th>
                <th scope="col">Power</th>
                <th scope="col">Blast radius if compromised</th>
                <th scope="col">Exit path</th>
              </tr>
            </thead>
            <tbody>
              {TRUSTED.map((row) => (
                <tr key={row.key}>
                  <td className="xk-mono">{row.key}</td>
                  <td>{row.holder}</td>
                  <td>{row.power}</td>
                  <td>{row.radius}</td>
                  <td>{row.exit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="xk-callout">
          <b>Regulatory posture, unresolved and named.</b> CAK licensing likely applies to reselling
          internet transit, beyond the short-range radio rules, and a KES-redeemable token sits near
          the CBK definition of e-money. Legal review is on the critical path before mainnet fiat.
          Nothing on this page is an offer of a communications service. Source: protocol/spec.md
          section 8.
        </div>

        <p className="xk-note" style={{ marginTop: '1rem' }}>
          The founder-safety layer is the other half of this: the treasury claim is callable by
          anyone and pays only the beneficiary cold address, beneficiary changes take a 7-day public
          timelock with a founder veto, price is banded with a one-day cooldown, and bridgeBurn is
          self-only, so no key in the system can destroy a user balance. Source: protocol/spec.md
          section 8.1, implemented 2026-09-08.
        </p>
      </div>
    </section>
  );
}
