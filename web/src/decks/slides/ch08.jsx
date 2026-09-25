import { DEPLOY_GAS, SETTLE_GAS, gas } from './facts.js';
import { COLOR, Grid, MiniStat, Reveal, Rows, Slide, ms } from './parts.jsx';

/** Chapter 8. What is already proven, and by which command. */

const MATRIX = [
  ['contracts', 'cd contracts && forge test', '35 tests, including 256-run solvency fuzzes and a stolen-owner-key drill'],
  ['gateway-api', 'cd gateway-api && pytest', '9 tests over the Daraja, Jenga and voucher paths, HTTP fully mocked'],
  ['protocol units', 'cd protocol && pytest', '11 tests over the codec, the receipts and the admission checks'],
  ['scenarios S1 to S6', 'cd protocol && python3 run_sim.py', 'discrete-event simulation, deterministic per seed, all scenarios passed'],
  ['firmware core', 'cd firmware/.../test/host && make run', '75 host checks, including a Python-signed receipt verified in C'],
  ['the full loop', 'protocol/e2e_chain_proof.sh', 'digest parity, the solvency invariant and the payout property all asserted'],
];

function ProofMatrix({ t }) {
  return (
    <Slide
      t={t}
      kicker="the proof matrix"
      title="Six commands anyone can run"
      lede="No xKoin frame has ever crossed a real mains riser or a real radio path."
      foot={['HANDOVER section 1, re-verified from the handover tarball', 'containerised too: scripts/docker-proofs.sh']}
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <Rows
        t={t}
        at={ms(0.9)}
        gap={300}
        size={16}
        widths={['20%', '32%', '48%']}
        head={['component', 'command', 'result']}
        rows={MATRIX}
      />
      <Grid cols={4} gap={12}>
        <MiniStat t={t} at={ms(3.4)} value={gas(SETTLE_GAS)} label="gas to settle a two-ticket batch, measured" />
        <MiniStat t={t} at={ms(3.65)} value="9.768 Mbps" label="goodput against the 10 Mbps model, 97.7 percent of it. Simulation." tone={COLOR.warn} />
        <MiniStat t={t} at={ms(3.9)} value="about 0.8 s" label="to move traffic to the radio after a grid cut. Simulation." tone={COLOR.warn} />
        <MiniStat t={t} at={ms(4.15)} value="0 / 20,000" label="garbage frames accepted by the codec under fuzz" tone={COLOR.good} />
      </Grid>
      <Reveal t={t} at={ms(5.2)} from="fade" style={{ fontSize: 15.5, color: COLOR.faint, lineHeight: 1.4 }}>
        Two of those four are simulation results and keep that label wherever they appear. All three contracts
        deployed for {gas(DEPLOY_GAS)} gas in the recorded run. With withdrawWithSig and transferDeposit added,
        forge measured 4,518,529 gas on 2026-09-26, about 8.25 KES at the 2026-09-09 rates.
      </Reveal>
    </Slide>
  );
}

export const SCENES = {
  'proof-matrix': ProofMatrix,
};
