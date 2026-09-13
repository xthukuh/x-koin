export default function Operators() {
  return (
    <section className="xk-section xk-section--tinted" id="operators">
      <div className="xk-wrap">
        <p className="xk-eyebrow">08 / for node operators</p>
        <div className="xk-split xk-split--wide-left">
          <div>
            <h2>What a node earns, and how the money reaches a phone.</h2>
            <p>
              A node is paid for WAN bytes its clients signed for, in 10 KB units, at whatever the
              per-unit price is. The price is not set yet, so the formula below carries the
              placeholder the code uses and the condition the real number has to satisfy. Read it as
              a shape, not as a quote.
            </p>

            <div className="xk-formula">
              <code>
                earnings_per_GB = 1,048,576 / 10 * price_per_unit_KES * 0.95
              </code>
              <code>
                at the 500 uKES placeholder = 104,857.6 * 0.0005 * 0.95 = 49.81 KES per GB carried
              </code>
              <p className="xk-cond">
                Condition on that price: it must clear measured backhaul cost. The floor in
                protocol/spec.md section 8 is (backhaul KES per MB from the bulk bundle) multiplied
                by (10 KB over 1 MB), divided by 0.95 fee retention, adjusted by the measured cache
                hit rate. Until the backhaul measurement exists, no earnings figure from this page
                should be quoted anywhere.
              </p>
            </div>

            <h3 style={{ marginTop: '1.75rem' }}>Cash out</h3>
            <p>
              Earnings accrue to the operator address inside the escrow contract, not to the device.
              The operator calls claimEarnings to any address they control, sends the XKN to the
              bridge, and the payout worker pays out by send-to-mobile before burning exactly what it
              paid. A stolen or re-flashed node carries no money away with it, because the money was
              never in the node.
            </p>

            <h3 style={{ marginTop: '1.5rem' }}>Running cost</h3>
            <p>
              Three lines: the backhaul bundle, the mains draw of the Node and the Node-Satellites,
              and the chain fee. The chain fee is the small one. Settling a 2-ticket batch measured
              191,698 gas on the proof run, which on Base is a fraction of a Kenyan cent, and the
              relayer can be anyone because signatures and monotonic counters gate everything.
            </p>
          </div>

          <div>
            <div className="xk-tablewrap" style={{ marginTop: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Line</th>
                    <th scope="col">Who pays</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Per-unit price</td>
                    <td>Set by the owner, banded 1 to 50,000 uKES, one change a day</td>
                    <td className="xk-mono">deferred</td>
                  </tr>
                  <tr>
                    <td>Operator share</td>
                    <td>95 percent of each settlement</td>
                    <td className="xk-mono">on chain</td>
                  </tr>
                  <tr>
                    <td>Treasury fee</td>
                    <td>5 percent, capped at 10 in the contract</td>
                    <td className="xk-mono">on chain</td>
                  </tr>
                  <tr>
                    <td>Settlement gas</td>
                    <td>Whoever relays the batch</td>
                    <td className="xk-mono">191,698 for 2 tickets</td>
                  </tr>
                  <tr>
                    <td>Backhaul bundle</td>
                    <td>Operator</td>
                    <td className="xk-mono">not measured yet</td>
                  </tr>
                  <tr>
                    <td>Mains draw</td>
                    <td>Operator or landlord</td>
                    <td className="xk-mono">not measured yet</td>
                  </tr>
                  <tr>
                    <td>Cash-out rail</td>
                    <td>M-Pesa send-to-mobile, then a self-only burn</td>
                    <td className="xk-mono">built, dry-run</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="xk-note" style={{ marginTop: '0.75rem' }}>
              Sources: protocol/spec.md section 8, docs/how-it-works.md journeys J7 and J8, and the
              handover gas measurement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
