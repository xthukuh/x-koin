export default function FreeLanPaidWan() {
  return (
    <section className="xk-section xk-section--tinted" id="economics">
      <div className="xk-wrap">
        <p className="xk-eyebrow">03 / the economic hook</p>
        <div className="xk-split xk-split--wide-left">
          <div>
            <h2>Free LAN, paid WAN.</h2>
            <p className="xk-lede">
              Traffic that stays inside the building costs nothing. Traffic that leaves for the
              internet is metered, signed for, and settled on chain.
            </p>
            <p>
              A message to the neighbour, a file from the block media store, a soil sensor reporting
              to the Node dashboard, a Meshtastic handset passing through: none of it touches the
              escrow, because none of it consumes backhaul. That is the plane where a community
              network gets useful before anybody has paid a shilling, and it keeps working when the
              WAN link is gone.
            </p>
            <p>
              Only bytes that cross the gateway to the internet are billed, in 10 KB units, against a
              deposit the user has already made. The node is paid strictly for bytes the client has
              signed for. Spam earns nothing. Beacons earn nothing. A Sybil swarm of fake nodes
              announcing themselves earns nothing, because presence is not a billable event: a signed
              cumulative counter is.
            </p>
          </div>
          <div>
            <div className="xk-tablewrap" style={{ marginTop: 0 }}>
              <table>
                <caption className="xk-note" style={{ captionSide: 'bottom', padding: '0.6rem 0.85rem', textAlign: 'left' }}>
                  Source: protocol/spec.md sections 5 and 6.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Traffic</th>
                    <th scope="col">Plane</th>
                    <th scope="col">Costs</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Neighbour to neighbour chat</td>
                    <td>LAN</td>
                    <td className="xk-mono">0</td>
                  </tr>
                  <tr>
                    <td>Files and media held on the Node</td>
                    <td>LAN</td>
                    <td className="xk-mono">0</td>
                  </tr>
                  <tr>
                    <td>Farm and tank sensors</td>
                    <td>LAN over LoRa</td>
                    <td className="xk-mono">0</td>
                  </tr>
                  <tr>
                    <td>Balance, voucher, kiosk operations</td>
                    <td>Class C, native frames</td>
                    <td className="xk-mono">0</td>
                  </tr>
                  <tr>
                    <td>Web, video, anything upstream</td>
                    <td>WAN</td>
                    <td className="xk-mono">per 10 KB unit</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
