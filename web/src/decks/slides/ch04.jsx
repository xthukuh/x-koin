import { Phone } from '../../companion/index.js';
import { DEPOSIT_LEFT_UKES, GATEWAY_EARNINGS_UKES, PRICE_UKES, kesFromUkes } from './facts.js';
import { Bar, COLOR, Chip, Grid, MONO, Panel, Reveal, Rows, Slide, Stat, Verdict, ease, ms, stage } from './parts.jsx';

/** Chapter 4. Every party, from first install to shillings in hand. */

/** A numbered step list, the spine of every journey scene. */
function Steps({ t, at = ms(1.0), gap = 420, steps, size = 18 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {steps.map((step, i) => (
        <Reveal key={step.text} t={t} at={at + i * gap} from="left" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--xk-ground)',
              background: step.tone ?? COLOR.accent,
              width: 24,
              height: 24,
              lineHeight: '24px',
              textAlign: 'center',
              flex: '0 0 auto',
              marginTop: 2,
            }}
          >
            {i + 1}
          </span>
          <span style={{ fontSize: size, lineHeight: 1.4, color: COLOR.muted }}>
            {step.who ? (
              <span style={{ fontFamily: MONO, fontSize: size - 3, color: step.tone ?? COLOR.accent, marginRight: 8 }}>{step.who}</span>
            ) : null}
            {step.text}
          </span>
        </Reveal>
      ))}
    </div>
  );
}

function OperatorSetup({ t }) {
  return (
    <Slide
      t={t}
      kicker="journey 1 of 8, the node admin"
      title="Mount the box, name one address, keep a little gas"
      lede="The operator is an address, not a device, because a device can be replaced, re-flashed or stolen."
      foot={['journey J7, built', 'the float is gas, never the users money']}
    >
      <Grid cols={2} gap={24}>
        <Steps
          t={t}
          at={ms(1.0)}
          gap={480}
          steps={[
            { who: 'install', text: 'the Node goes beside the meter board and terminates one backhaul link.' },
            { who: 'config', text: 'one operator address is written in. It is the nodeAdmin named in every ticket the node collects.' },
            { who: 'relays', text: 'wall-socket relays go up on the risers, on the same mains segment.' },
            { who: 'float', text: 'a small reserve of gas funds the relayer key, kept separate from the bridge key.' },
            { who: 'earn', text: 'earnings accrue on chain from the first settled batch and can be claimed to any address.' },
          ]}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel t={t} at={ms(3.4)} title="what the operator never holds" tone={COLOR.good}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Verdict t={t} at={ms(3.8)} ok text="no user balance: deposits live in the escrow, per address" size={17} />
              <Verdict t={t} at={ms(4.1)} ok text="no privilege in settlement: signatures and counters gate it" size={17} />
              <Verdict t={t} at={ms(4.4)} ok text="no ability to halt anyone: the deposit is withdrawable at any time" size={17} />
            </div>
          </Panel>
          <Grid cols={2} gap={14}>
            <Stat t={t} at={ms(5.2)} value="95%" label="of every settled byte reaches the operator address" tone={COLOR.money} />
            <Stat t={t} at={ms(5.5)} value="20 / 5 KES" label="recommended session credit limit, online and offline, pending pilot data" tone={COLOR.warn} />
          </Grid>
        </div>
      </Grid>
    </Slide>
  );
}

function Onboarding({ t }) {
  return (
    <Slide
      t={t}
      kicker="journey 2 of 8, the client"
      title="Twelve words, two keys, and no account anywhere"
      lede="There is no sign-up and no account table. The address is the identity, at the kiosk and on the mesh alike."
      foot={['journey J2, proposed and in MVP scope', 'Kotlin, Android first']}
    >
      <div style={{ display: 'flex', gap: 26, height: '100%' }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <Steps
            t={t}
            at={ms(1.0)}
            gap={460}
            steps={[
              { who: 'install', text: 'create the wallet and write down twelve words. That is the entire onboarding.' },
              { who: 'derive', text: 'one seed in the phone keystore gives the chain key and the edge key.' },
              { who: 'fund', text: 'buy, watch the mint land, then deposit into the escrow with one tap and no gas.' },
              { who: 'attach', text: 'join any xKoin access point. The app presents the voucher and signs receipts in the background.' },
              { who: 'roam', text: 'attach to a second node with the same key and the same deposit. Nothing is re-bought.' },
            ]}
          />
          <Panel t={t} at={ms(3.8)} title="why two key types" tone={COLOR.accent} style={{ marginTop: 16 }}>
            <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
              The chain speaks secp256k1 and nothing else. Ed25519 verifies in under 4.5 ms on the
              microcontroller, which is what a node needs to check thousands of receipts. One algorithm for
              both would either slow the edge or need a scheme the chain cannot verify.
            </div>
          </Panel>
        </div>
        <Reveal t={t} at={ms(1.4)} from="right" style={{ flex: '0 0 auto' }}>
          <Phone screen="onboard" scale={0.4} t={t} label="Companion app, onboarding screen" />
        </Reveal>
      </div>
    </Slide>
  );
}

function Kiosk({ t }) {
  return (
    <Slide
      t={t}
      kicker="journey 3 of 8, the purchase"
      title="Shillings in, a funded meter and a signed voucher out"
      lede="Every step below is recorded in the kiosk proof and readable on the replay page."
      foot={['rails: Daraja STK, Jenga M-Pesa push, Jenga Equitel USSD', 'dry run, HTTP mocked, production code path']}
    >
      <div style={{ display: 'flex', gap: 26, height: '100%' }}>
        <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Steps
            t={t}
            at={ms(1.0)}
            gap={420}
            size={17}
            steps={[
              { who: 'user', text: 'asks the kiosk for gas, naming an amount, a phone number and an address.', tone: COLOR.money },
              { who: 'kiosk', text: 'authenticates on the rail and pushes the prompt to that handset.' },
              { who: 'user', text: 'types the PIN on their own phone. This happens off-system.', tone: COLOR.money },
              { who: 'bank', text: 'posts the result callback confirming the payment.', tone: COLOR.plc },
              { who: 'bridge', text: 'mints the same number of shillings worth of token, one to one, with the bank reference hashed into the event.', tone: COLOR.good },
              { who: 'kiosk', text: 'signs a voucher bound to that address, verifiable by firmware with no backhaul.' },
            ]}
          />
          <Panel t={t} at={ms(4.6)} title="the voucher is not money" tone={COLOR.warn}>
            <div style={{ fontSize: 16.5, color: COLOR.muted, lineHeight: 1.4 }}>
              It proves this address paid recently and expires in 24 hours. The balance lives on chain and the
              node reads it when it can, which is what lets a node with a dead backhaul admit a paying user.
            </div>
          </Panel>
        </div>
        <Reveal t={t} at={ms(1.6)} from="right" style={{ flex: '0 0 auto' }}>
          <Phone screen="buy" scale={0.36} t={t} highlight="buy" label="Companion app, buy screen" />
        </Reveal>
      </div>
    </Slide>
  );
}

const FREE_THINGS = [
  ['local chat', 'messages signed by the same wallet key, so the address is the handle'],
  ['cached material', 'school curriculum and media served from the node, not from the internet'],
  ['a camera down the corridor', 'video that never leaves the building never leaves the free plane'],
  ['sensor telemetry', 'soil, tank level, meter readings, at zero XKN for the life of the deployment'],
];

function FreeLan({ t }) {
  return (
    <Slide
      t={t}
      kicker="journey 4 of 8, the free plane"
      title="Traffic that stays inside the mesh costs nothing, and needs no voucher"
      lede="This is not a discount. It is the absence of a cost: no backhaul byte was bought, so there is nothing to resell."
      foot={['demo D6 asserts the deposit is unchanged to the micro-KES', 'journey J12 sits on top and changes no contract']}
    >
      <Rows
        t={t}
        at={ms(1.0)}
        gap={420}
        widths={['32%', '68%']}
        size={19}
        head={['what runs free', 'why it is free']}
        rows={FREE_THINGS}
      />
      <Reveal
        t={t}
        at={ms(4.2)}
        from="up"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', gap: 10, flexWrap: 'wrap' }}
      >
        <Chip label="no voucher" tone={COLOR.good} />
        <Chip label="no receipt" tone={COLOR.good} />
        <Chip label="no ticket" tone={COLOR.good} />
        <Chip label="no settlement" tone={COLOR.good} />
        <Chip label="metering starts at the boundary, not at the socket" tone={COLOR.faint} />
      </Reveal>
    </Slide>
  );
}

function PaidWan({ t }) {
  const used = stage(t, ms(2.6), ms(3.0), ease.inOutSine);
  return (
    <Slide
      t={t}
      kicker="journey 5 of 8, the paid plane"
      title="A session, a credit limit, and a receipt every interval"
      lede="The node grants a limit, meters what leaves, takes a signature each interval and settles at half the limit."
      foot={['Law 3 bounds the unproven credit at 2x the receipt interval', 'journey J3 and J4']}
    >
      <Grid cols={2} gap={24}>
        <Panel t={t} at={ms(1.0)} title="the session, as the node sees it" tone={COLOR.accent}>
          <svg viewBox="0 0 470 150" width="100%" height="150" aria-hidden="true">
            <Bar t={t} at={ms(2.6)} x={0} y={16} w={440} h={26} fill={used} tone={COLOR.money} />
            <line x1={220} y1={8} x2={220} y2={50} stroke={COLOR.good} strokeWidth="2" strokeDasharray="4 4" />
            <text x={226} y={66} fontFamily={MONO} fontSize="14" fill={COLOR.good}>
              settle here, at half the limit
            </text>
            <text x={440} y={66} textAnchor="end" fontFamily={MONO} fontSize="14" fill={COLOR.warn}>
              the granted limit
            </text>
            <rect x={0} y={96} width={440} height={18} fill="none" stroke={COLOR.soft} />
            <rect x={0} y={96} width={Math.min(440, 440 * used * 1.02)} height={18} fill="var(--xk-accent-soft)" />
            <text x={0} y={134} fontFamily={MONO} fontSize="14" fill={COLOR.muted}>
              bytes proven by signature, never more than two intervals behind
            </text>
          </svg>
        </Panel>
        <Steps
          t={t}
          at={ms(1.2)}
          gap={440}
          size={17}
          steps={[
            { text: 'the node reads the deposit once, then grants the smaller of that and its own per-node cap.' },
            { text: 'every byte that leaves for the wide area is counted; nothing local is.' },
            { text: 'each receipt interval, the client signs the running total and the node replaces what it held.' },
            { text: 'at half the limit the node settles and re-reads the deposit.' },
            { text: 'near zero it throttles, then drops, and the app shows a balance and a buy button.' },
          ]}
        />
      </Grid>
    </Slide>
  );
}

function Earnings({ t }) {
  return (
    <Slide
      t={t}
      kicker="journey 6 of 8, getting paid"
      title="Earnings become shillings, and the token is burned on the way"
      lede="The same bridge runs in reverse, and the burn waits for the bank result so a failed payout never destroys anything."
      foot={['journey J7 and J8, built', 'the payout worker fires only for transfers from the beneficiary']}
    >
      <Grid cols={2} gap={24}>
        <Steps
          t={t}
          at={ms(1.0)}
          gap={460}
          steps={[
            { who: 'settle', text: 'each batch credits earnings to the operator address on chain.' },
            { who: 'claim', text: 'the operator calls claimEarnings to any address they choose.' },
            { who: 'send', text: 'the token goes to the bridge address.' },
            { who: 'payout', text: 'the worker sends the shillings to the mobile number and waits for the bank result.', tone: COLOR.money },
            { who: 'burn', text: 'only on confirmation does the bridge burn exactly the amount it paid out.', tone: COLOR.good },
          ]}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel t={t} at={ms(3.4)} title="from the recorded chain proof" tone={COLOR.money}>
            <Rows
              t={t}
              at={ms(3.8)}
              gap={240}
              size={17}
              widths={['62%', '38%']}
              rows={[
                ['gateway operator earnings', `${kesFromUkes(GATEWAY_EARNINGS_UKES)} KES`],
                ['client deposit remaining', `${kesFromUkes(DEPOSIT_LEFT_UKES)} KES`],
                ['placeholder price per unit', `${PRICE_UKES} uKES`],
              ]}
            />
          </Panel>
          <Panel t={t} at={ms(5.0)} title="what a compromised server can do" tone={COLOR.good}>
            <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
              Delay the payout. Not redirect it. The destination number is signed by the beneficiary key and
              checked against the on-chain beneficiary before the worker will start, and the event fields are
              never consulted for a destination.
            </div>
          </Panel>
        </div>
      </Grid>
    </Slide>
  );
}

function Landlord({ t }) {
  return (
    <Slide
      t={t}
      kicker="journey 7 of 8, the building owner"
      title="The ask is a socket, a wall and a caretaker with a key"
      lede="The landlord becomes the node operator. They are not reselling their own line and are not becoming an internet provider."
      foot={['pilot terms: 30 days, no setup bill, no lock-in, 30 days notice either way', 'potential/02, a 40 unit block in Ruaka']}
    >
      <Grid cols={2} gap={24}>
        <Panel t={t} at={ms(1.0)} title="what the landlord gives" tone={COLOR.accent}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Verdict t={t} at={ms(1.4)} ok text="socket space on the risers for the relays" size={18} />
            <Verdict t={t} at={ms(1.7)} ok text="a place to mount one box near the meter board" size={18} />
            <Verdict t={t} at={ms(2.0)} ok text="permission, in writing" size={18} />
            <Verdict t={t} at={ms(2.3)} ok text="one caretaker who holds a key" size={18} />
          </div>
        </Panel>
        <Panel t={t} at={ms(1.2)} title="what the landlord gets" tone={COLOR.money}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Verdict t={t} at={ms(2.8)} ok text="their address named in every ticket the building collects" size={18} />
            <Verdict t={t} at={ms(3.1)} ok text="ninety-five percent of every settled byte" size={18} />
            <Verdict t={t} at={ms(3.4)} ok text="a free local plane for the tenants, at no cost to anybody" size={18} />
            <Verdict t={t} at={ms(3.7)} ok text="no tariff sheet to publish and no customers to bill" size={18} />
          </div>
        </Panel>
      </Grid>
      <Reveal
        t={t}
        at={ms(4.6)}
        from="up"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          border: `1px solid ${COLOR.warn}`,
          padding: '10px 16px',
          fontSize: 17,
          color: COLOR.muted,
          lineHeight: 1.4,
        }}
      >
        The landlord page carries no shilling figures at all and its charts are marked illustrative, which is
        the right discipline while the per-unit price is undecided. Four things gate a first pilot and none of
        them is engineering: a company, counsel, a device position from the standards bureau, and a signature.
      </Reveal>
    </Slide>
  );
}

function Farmer({ t }) {
  const reading = Math.min(20, Math.floor(stage(t, ms(2.2), ms(4.5), ease.linear) * 20));
  return (
    <Slide
      t={t}
      kicker="journey 8 of 8, the farmer"
      title="A sensor that joins, reports and never pays"
      lede="The acceptance test is arithmetic: the escrow deposit for its address is unchanged to the micro-KES."
      foot={['demo D6, farm IoT on the free plane', 'potential/01, a 400 acre farm in Laikipia']}
    >
      <Grid cols={2} gap={24}>
        <Steps
          t={t}
          at={ms(1.0)}
          gap={440}
          size={17}
          steps={[
            { who: 'wake', text: 'the node wakes every fifteen minutes and lets the probe settle.', tone: COLOR.lora },
            { who: 'send', text: 'one telemetry frame carries soil moisture and temperature. No join, no voucher.', tone: COLOR.lora },
            { who: 'relay', text: 'the nearest Satellite or Node forwards it on the free plane.', tone: COLOR.lora },
            { who: 'sleep', text: 'the whole cycle costs 0.02 mAh, so the daily budget is 2.43 mAh.', tone: COLOR.lora },
          ]}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel t={t} at={ms(2.0)} title="twenty consecutive readings, one a minute" tone={COLOR.lora}>
            <svg viewBox="0 0 470 90" width="100%" height="90" aria-hidden="true">
              {Array.from({ length: 20 }, (_, i) => (
                <rect
                  key={i}
                  x={i * 23}
                  y={20}
                  width={17}
                  height={34}
                  fill={i < reading ? COLOR.lora : 'none'}
                  stroke={i < reading ? COLOR.lora : COLOR.soft}
                  strokeWidth="1.5"
                />
              ))}
              <text x="0" y={78} fontFamily={MONO} fontSize="15" fill={COLOR.muted}>
                {`${reading} of 20 arrived, no gap`}
              </text>
            </svg>
          </Panel>
          <Grid cols={2} gap={14}>
            <Stat t={t} at={ms(6.0)} value="0 XKN" label="spent, before and after, read from the chain" tone={COLOR.good} />
            <Stat t={t} at={ms(6.3)} value="KES 564" label="of scouted parts per farm node, six lines still unpriced" />
          </Grid>
        </div>
      </Grid>
    </Slide>
  );
}

export const SCENES = {
  'journey-operator-setup': OperatorSetup,
  'journey-onboarding': Onboarding,
  'journey-kiosk': Kiosk,
  'journey-free-lan': FreeLan,
  'journey-paid-wan': PaidWan,
  'journey-earnings': Earnings,
  'journey-landlord': Landlord,
  'journey-farmer': Farmer,
};
