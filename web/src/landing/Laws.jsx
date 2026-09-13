import { LAWS } from './data.js';

export default function Laws() {
  return (
    <section className="xk-section" id="laws">
      <div className="xk-wrap">
        <p className="xk-eyebrow">09 / security by construction</p>
        <h2>Eight Laws, each with the test that proves it.</h2>
        <p className="xk-lede">
          The threat model is written as invariants rather than as advice. Breaking any one of them
          has to cost more than honest participation earns, and each one names the artifact that
          holds it down.
        </p>

        <div className="xk-tablewrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Law</th>
                <th scope="col">Mechanism</th>
                <th scope="col">Proof artifact</th>
              </tr>
            </thead>
            <tbody>
              {LAWS.map((law) => (
                <tr key={law.n}>
                  <td>
                    <span className="xk-mono" style={{ color: 'var(--xk-faint)' }}>
                      {law.n}.
                    </span>{' '}
                    {law.law}
                  </td>
                  <td>{law.mechanism}</td>
                  <td className="xk-mono">{law.test}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="xk-note" style={{ marginTop: '1rem' }}>
          An attacker has to break Ed25519 or secp256k1 to mint value. Everything cheaper, which is
          spam, replay, corruption and Sybil beacons, earns exactly zero, because pay is strictly per
          verified signed byte and never for presence. Source: protocol/spec.md section 7.
        </p>
      </div>
    </section>
  );
}
