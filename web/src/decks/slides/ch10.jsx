import { KIT } from './facts.js';
import { COLOR, Grid, Reveal, Slide, Stat, ms } from './parts.jsx';

/** Chapter 10. What stands between here and a running pilot. */

function kes(value) {
  return Number.isFinite(value) ? `KSh ${Math.round(value).toLocaleString('en-US')}` : 'see the parts page';
}

function Closing({ t }) {
  return (
    <div className="xk-scene">
      <Reveal t={t} at={0} from="fade">
        <p className="xk-scene__kicker">closing</p>
      </Reveal>
      <Reveal t={t} at={ms(0.3)} from="up">
        <h2 className="xk-scene__title">Three things stand between the design and a running pilot.</h2>
      </Reveal>
      <div className="xk-scene__body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Grid cols={3} gap={18}>
          <Stat
            t={t}
            at={ms(1.2)}
            value={kes(KIT.total)}
            label="of parts, itemised and priced against verified listings"
            sub={KIT.recorded ? `checkout recorded ${KIT.recorded}` : null}
          />
          <Stat t={t} at={ms(1.6)} value="one building" label="whose owner will put a box beside the meter board and take 95 percent" tone={COLOR.money} />
          <Stat t={t} at={ms(2.0)} value="one measurement" label="of backhaul cost per megabyte, which every economic claim is waiting on" tone={COLOR.warn} />
        </Grid>
        <Reveal t={t} at={ms(3.0)} from="up" style={{ fontSize: 22, lineHeight: 1.45, color: COLOR.muted, maxWidth: 960 }}>
          The contracts, the gateway, the protocol reference and the portable firmware core already exist and
          already pass named tests. What does not exist yet is a frame that has crossed a real mains riser.
        </Reveal>
        <Reveal t={t} at={ms(4.4)} from="up" style={{ fontSize: 26, lineHeight: 1.35, color: COLOR.ink, fontWeight: 600, maxWidth: 1000 }}>
          Free inside the mesh. Paid on the way out. Measured, not asserted.
        </Reveal>
      </div>
      <Reveal t={t} at={ms(5.4)} from="fade">
        <div className="xk-scene__foot">
          <span>xKoin, an invention by Martin Thuku</span>
          <span>every figure in this deck is linked to the paper that carries its condition</span>
        </div>
      </Reveal>
    </div>
  );
}

export const SCENES = {
  closing: Closing,
};
