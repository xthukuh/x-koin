import { Phone } from '../../companion/index.js';
import { Bar, COLOR, Chip, Grid, H, MONO, MiniStat, Panel, Reveal, Rows, Slide, Stage, Stat, W, ms } from './parts.jsx';

/** Chapter 2. Five device archetypes over four physical mediums. */

const MEDIA = [
  {
    name: 'HomePlug AV',
    sub: 'broadband power line',
    tone: COLOR.plc,
    rate: 10e6,
    goodput: 'about 10 Mbps',
    payload: '1400 B',
    role: 'bulk in-building data',
  },
  {
    name: 'KQ-130F',
    sub: 'narrowband power line',
    tone: COLOR.nbplc,
    rate: 7680,
    goodput: 'about 960 B/s',
    payload: '128 B',
    role: 'telemetry, receipts, control',
  },
  {
    name: 'SX1262',
    sub: 'LoRa, 868.1 MHz, SF7',
    tone: COLOR.lora,
    rate: 5400,
    goodput: 'about 5.4 kbps',
    payload: '226 B',
    role: 'discovery and survival',
  },
  {
    name: 'Wi-Fi 802.11',
    sub: 'client attach only',
    tone: COLOR.faint,
    rate: 0,
    goodput: 'not applicable',
    payload: 'not applicable',
    role: 'attach and captive portal',
  },
];

/** Log fraction between 1 kbps and 10 Mbps, so three decades share one axis. */
function logFraction(rate) {
  if (!rate) {
    return 0;
  }
  return Math.max(0, Math.min(1, (Math.log10(rate) - 3) / 4));
}

function Mediums({ t }) {
  return (
    <Slide
      t={t}
      kicker="devices and mediums"
      title="Three carriers hold the mesh, one attaches the clients"
      lede="The goodput figures are the models the protocol simulation runs against, not field measurements."
      foot={['one 29 byte frame overhead on every medium', 'bar axis is logarithmic']}
    >
      <Stage h={H.both}>
        {MEDIA.map((medium, i) => {
          const y = 14 + i * 78;
          return (
            <g key={medium.name}>
              <Reveal t={t} at={ms(1.0) + i * 260} from="left" as="g">
                <text x="0" y={y + 20} fontFamily={MONO} fontSize="20" fontWeight="600" fill={medium.tone}>
                  {medium.name}
                </text>
                <text x="0" y={y + 42} fontFamily={MONO} fontSize="14" fill={COLOR.muted}>
                  {medium.sub}
                </text>
              </Reveal>
              <Bar
                t={t}
                at={ms(1.3) + i * 260}
                x={250}
                y={y + 4}
                w={330}
                h={24}
                fill={logFraction(medium.rate)}
                tone={medium.tone}
                label={medium.goodput}
              />
              <Reveal t={t} at={ms(1.6) + i * 260} from="fade" as="g">
                <text x={760} y={y + 23} fontFamily={MONO} fontSize="17" fill={COLOR.ink}>
                  {medium.payload}
                </text>
                <text x={760} y={y + 43} fontFamily={MONO} fontSize="14" fill={COLOR.muted}>
                  {medium.role}
                </text>
              </Reveal>
              <line x1="0" y1={y + 62} x2={W} y2={y + 62} stroke={COLOR.soft} strokeWidth="1" />
            </g>
          );
        })}
        <Reveal t={t} at={ms(3.4)} from="up" as="g">
          <text x="0" y={344} fontFamily={MONO} fontSize="17" fill={COLOR.accent}>
            The 128 byte narrowband payload is why a receipt is 108 bytes.
          </text>
          <text x="0" y={368} fontFamily={MONO} fontSize="15" fill={COLOR.muted}>
            The payment plane was sized to survive on the slowest medium in the system.
          </text>
        </Reveal>
      </Stage>
    </Slide>
  );
}

function DeviceNode({ t }) {
  return (
    <Slide
      t={t}
      kicker="device 1 of 5"
      title="xKoin-Node: the gateway at the meter board"
      lede="Backhaul termination, packet classification, offline voucher checks, metering and ticket assembly."
      foot={['status: partial, portable core host-proven, ESP-IDF glue compile-untested', 'paper 05']}
    >
      <Grid cols={2} gap={22}>
        <Panel t={t} at={ms(1.0)} title="what is inside" tone={COLOR.accent}>
          <Rows
            t={t}
            at={ms(1.3)}
            gap={200}
            size={17}
            widths={['42%', '58%']}
            rows={[
              ['ESP32-S3-DevKitC-1', 'the logic, the access point and the portal'],
              ['E22-900M22S', 'SX1262 radio at 868.1 MHz'],
              ['KQ-130F', 'narrowband carrier, 120 to 135 kHz'],
              ['HomePlug AV', 'the bulk plane onto the riser'],
              ['HLK-PM01', '5 V from the mains, 3 W ceiling'],
            ]}
          />
        </Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Grid cols={2} gap={14}>
            <Stat t={t} at={ms(2.4)} value="USD 200" label="of modules per unit at the field kit indicative prices" sub="USD 95 of it is the LTE module" />
            <Stat t={t} at={ms(2.7)} value="3 A" label="minimum supply sizing for the full build" sub="LTE peaks near 2 A" />
          </Grid>
          <Panel t={t} at={ms(3.2)} title="deferred for the proof of concept" tone={COLOR.warn}>
            <div style={{ fontSize: 18, color: COLOR.muted, lineHeight: 1.4 }}>
              The SIM7600E cellular module and the W5500 Ethernet bridge are drawn and not fitted. Backhaul
              comes from an existing router or a phone hotspot, which removes the most expensive part and its
              type-approval question from the first build.
            </div>
          </Panel>
          <Reveal t={t} at={ms(4.2)} from="up" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Chip label="Wi-Fi AP" tone={COLOR.faint} />
            <Chip label="HomePlug AV" tone={COLOR.plc} />
            <Chip label="narrowband PLC" tone={COLOR.nbplc} />
            <Chip label="LoRa" tone={COLOR.lora} />
          </Reveal>
        </div>
      </Grid>
    </Slide>
  );
}

function DeviceNodeSatellite({ t }) {
  return (
    <Slide
      t={t}
      kicker="device 2 of 5"
      title="xKoin-Node-Satellite: the relay in a wall socket"
      lede="Two devices in one socket: the bulk appliance, and the chip that admits clients."
      foot={['status: proposed, designed and specified, no unit built', 'paper 06']}
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <Grid cols={2} gap={22}>
        <Panel t={t} at={ms(1.0)} title="what it does" tone={COLOR.accent}>
          <Rows
            t={t}
            at={ms(1.3)}
            gap={210}
            size={17}
            widths={['38%', '62%']}
            rows={[
              ['pulls', 'the broadband carrier off the building wiring'],
              ['regenerates', 'Wi-Fi for the flats within reach of that socket'],
              ['admits', 'clients against a voucher, with no network access'],
              ['collects', 'its own receipts, under its own operator address'],
            ]}
          />
        </Panel>
        <Panel t={t} at={ms(1.2)} title="why attribution never dilutes" tone={COLOR.money}>
          <div style={{ fontSize: 19, color: COLOR.muted, lineHeight: 1.45 }}>
            The serving device is the one that gets paid, not the device with the backhaul. A relay that
            holds the session names its own address in every ticket and uses the gateway purely as
            transport, so a frame passing through three devices does not split the payment three ways.
          </div>
        </Panel>
      </Grid>
      <Grid cols={3} gap={12}>
        <MiniStat t={t} at={ms(3.0)} value="10 Mbps" label="bulk plane, as modelled" />
        <MiniStat t={t} at={ms(3.25)} value="1400 B" label="frame payload on the broadband carrier" />
        <MiniStat t={t} at={ms(3.5)} value="one segment" label="it must share a mains segment with the Node" tone={COLOR.warn} />
      </Grid>
    </Slide>
  );
}

function DeviceSatellite({ t }) {
  return (
    <Slide
      t={t}
      kicker="device 3 of 5"
      title="xKoin-Satellite: off grid, and it survives because it was never on the grid"
      lede="A Heltec board, one cell and a panel. LoRa alone, and no internet protocol runs on it at all."
      foot={['status: partial, power budget settled, satellite firmware not written', 'paper 07']}
    >
      <Grid cols={4} gap={14}>
        <Stat t={t} at={ms(1.0)} value="under 40 mA" label="average current design ceiling, a requirement rather than a measurement" tone={COLOR.good} />
        <Stat t={t} at={ms(1.25)} value="3,400 mAh" label="one 18650 cell, 12.6 Wh at 3.7 V nominal" />
        <Stat t={t} at={ms(1.5)} value="10 W" label="field panel, delivering about 27.5 Wh a day at the assumed insolation" />
        <Stat t={t} at={ms(1.75)} value="60 dB" label="of deliberate path loss the radio must still work through on the bench" tone={COLOR.lora} />
      </Grid>
      <Grid cols={2} gap={22} style={{ marginTop: 18 }}>
        <Panel t={t} at={ms(2.6)} title="three power states" tone={COLOR.lora}>
          <Rows
            t={t}
            at={ms(2.9)}
            gap={220}
            size={17}
            widths={['52%', '48%']}
            rows={[
              ['deep sleep between windows', 'about 0.21 mA'],
              ['listening at class C', 'about 6.2 mA'],
              ['beacon window, MCU active', 'about 45 mA'],
            ]}
          />
        </Panel>
        <Panel t={t} at={ms(2.8)} title="what that buys" tone={COLOR.accent}>
          <div style={{ fontSize: 18, color: COLOR.muted, lineHeight: 1.45 }}>
            On the serving schedule the budget is 35.3 mAh a day, an average of 1.47 mA. Two overcast days at
            a fifth of clear-sky output still deliver more than the worst case draws. Every current figure
            here is datasheet-derived and carries a verify mark until a unit is soaked on a bench.
          </div>
        </Panel>
      </Grid>
    </Slide>
  );
}

function DeviceClient({ t }) {
  return (
    <Slide
      t={t}
      kicker="device 4 of 5"
      title="xKoin-Client: one seed, two keys, and an optional radio"
      lede="The identity travels in the phone, which is what makes roaming work without an account anywhere."
      foot={['status: proposed on both halves, Kotlin and Android first', 'paper 08']}
    >
      <div style={{ display: 'flex', gap: 26, height: '100%' }}>
        <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <Panel t={t} at={ms(1.0)} title="the phone half" tone={COLOR.accent}>
            <Rows
              t={t}
              at={ms(1.3)}
              gap={190}
              size={17}
              widths={['34%', '66%']}
              rows={[
                ['one seed', 'in the Android Keystore, backed up as twelve words'],
                ['secp256k1', 'the address, the tickets and the transfers'],
                ['Ed25519', 'the receipts, and the node id derived from it'],
                ['auto-sign', 'receipts signed in the background while attached'],
              ]}
            />
          </Panel>
          <Panel t={t} at={ms(2.8)} title="the dongle half" tone={COLOR.lora}>
            <div style={{ fontSize: 18, color: COLOR.muted, lineHeight: 1.45 }}>
              A Heltec board on a USB-C lead, powered entirely from the phone at about 67 mA while listening,
              roughly a fortieth of a phone battery an hour. It holds no key, signs nothing and stores no
              balance: it is reach, not identity.
            </div>
          </Panel>
        </div>
        <Reveal t={t} at={ms(1.6)} from="right" style={{ flex: '0 0 auto' }}>
          <Phone screen="main" scale={0.4} t={t} label="Companion app, balance screen" />
        </Reveal>
      </div>
    </Slide>
  );
}

function DeviceEcosystem({ t }) {
  return (
    <Slide
      t={t}
      kicker="device 5 of 5"
      title="LoRa ecosystem devices pay nothing, by design"
      lede="Third-party nodes on the free LAN plane: no voucher, no receipt, no ticket, no balance to move."
      foot={['status: proposed, the farm node gates demo D6', 'paper 09']}
    >
      <Grid cols={3} gap={18}>
        <Panel t={t} at={ms(1.0)} title="farm sensor node" tone={COLOR.lora}>
          <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
            An ESP32-C3 SuperMini with an Ai-Thinker Ra-01SH radio, a capacitive soil probe and a
            temperature sensor. One telemetry frame every fifteen minutes costs 2.43 mAh a day.
          </div>
        </Panel>
        <Panel t={t} at={ms(1.3)} title="tank level node" tone={COLOR.lora}>
          <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
            The same platform with an ultrasonic head in the tank lid, or a submersible pressure transducer
            at the floor reading head pressure.
          </div>
        </Panel>
        <Panel t={t} at={ms(1.6)} title="Meshtastic handset" tone={COLOR.faint}>
          <div style={{ fontSize: 17, color: COLOR.muted, lineHeight: 1.45 }}>
            A stock board running stock firmware. The beacon framing is compatible so each can find the
            other, and that is the whole claim.
          </div>
        </Panel>
      </Grid>
      <Panel t={t} at={ms(2.8)} title="what is not claimed" tone={COLOR.warn} style={{ marginTop: 20 }}>
        <div style={{ fontSize: 18, color: COLOR.muted, lineHeight: 1.45 }}>
          No message interoperation, no routing between the two meshes, no access to the payment plane, and
          no claim that an xKoin device can join a Meshtastic channel. The discovery claim itself carries a
          verify mark until it is demonstrated on physical hardware.
        </div>
      </Panel>
    </Slide>
  );
}

export const SCENES = {
  mediums: Mediums,
  'device-node': DeviceNode,
  'device-node-satellite': DeviceNodeSatellite,
  'device-satellite': DeviceSatellite,
  'device-client': DeviceClient,
  'device-ecosystem': DeviceEcosystem,
};
