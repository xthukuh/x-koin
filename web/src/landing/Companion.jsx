import { Phone } from '../companion/index.js';

/**
 * The wireframes live in web/src/companion/wireframes/*.dc.html at a 390x844
 * design size. Each frame below shows its screen once that screen is ported
 * into React, and its name until then, so this section never claims a screen
 * exists before it does.
 */
const SCREENS = [
  { screen: 'main', caption: 'Main. The wallet meter in KES, the attached node, and the session.' },
  { screen: 'buy', caption: 'Buy. M-Pesa or Equitel in, a voucher and a balance out.' },
  { screen: 'attach', caption: 'Attach. Pick a Node or a Node-Satellite and start a metered session.' },
];

export default function Companion() {
  return (
    <section className="xk-section" id="companion">
      <div className="xk-wrap">
        <p className="xk-eyebrow">15 / the companion app</p>
        <h2>xKoin Companion.</h2>
        <p className="xk-lede">
          The app holds one seed in the Android Keystore and shows a balance in shillings, because a
          tenant should never have to think about a token. It buys credit with M-Pesa or Equitel,
          attaches to a Node or a Node-Satellite, signs the receipts in the background while bytes
          are flowing, sends value to another address, and withdraws back to a phone number. Your
          balance is a number in the escrow contract rather than a file on the handset, so restoring
          the 12-word backup on a new phone restores the same address and the same deposit.
        </p>

        <div className="xk-phones">
          {SCREENS.map((item) => (
            <figure className="xk-phones__item" key={item.screen}>
              <Phone scale={0.42} screen={item.screen} />
              <figcaption>{item.caption}</figcaption>
            </figure>
          ))}
        </div>

        <p className="xk-note" style={{ marginTop: '1rem' }}>
          These frames render the wireframes in web/src/companion/wireframes, drawn at 390 by 844.
          The app build itself is scoped for the next session; nothing here is installable yet, and
          the roadmap above lists it as the largest single item in the MVP.
        </p>
      </div>
    </section>
  );
}
