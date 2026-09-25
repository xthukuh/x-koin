/*
 * Engine half of verify-demo.mjs. Imported by it; not run on its own.
 */

import { UKES, createWorld, deploy, escrow, invariants, kes, offchain, token, treasury, DEFAULT_PARAMS, pendingTickets } from '../src/demo/engine.js';
import { DRILLS, buy, cashOut, closeSession, depositGasless, ensureReady, openSession, relayBatch, send, serve, setupNetwork, withdraw } from '../src/demo/flows.js';

const errName = (entry) => (entry.error ?? '').split(':')[0];

export async function run(check, chain) {
  // ---- 1. replay the chain proof ------------------------------------------
  let w = deploy(createWorld({ ...DEFAULT_PARAMS, pricePerUnit: chain.params.price_per_unit_ukes, feeBps: chain.params.fee_bps }));
  const step = (r) => {
    w = r.world;
    if (!r.entry.ok) console.log('   step failed:', r.entry.title, r.entry.error);
    return r;
  };
  step(token.setBridge(w, { from: 'owner', bridge: 'kiosk', allowed: true, dailyMintCap: 50_000 * UKES }));
  step(offchain.stkPush(w, { client: 'amina', amount: 100 * UKES }));
  step(token.bridgeMint(w, { from: 'kiosk', to: 'amina', amount: 100 * UKES, fiatRef: 'r1' }));
  // The proof's client has ETH for approve and deposit; ours is funded the same way.
  w.eth.amina = 1_000_000;
  step(token.approve(w, { from: 'amina', spender: 'escrow', amount: 100 * UKES }));
  step(escrow.deposit(w, { from: 'amina', amount: 10 * UKES }));
  const t1 = step(offchain.signTicket(w, { client: 'amina', nodeAdmin: 'node', cumulativeUnits: 2500 })).result;
  const t2 = step(offchain.signTicket(w, { client: 'amina', nodeAdmin: 'baraka', cumulativeUnits: 100 })).result;
  const settle = step(escrow.settleTicketBatch(w, { from: 'relayer', tickets: [t1, t2] }));
  step(treasury.claim(w, { from: 'mallory' }));
  const s = chain.summary;
  check('replay: client deposit left', w.escrow.deposits.amina === s.client_deposit_left_ukes, `${w.escrow.deposits.amina} vs ${s.client_deposit_left_ukes}`);
  check('replay: gateway earnings', w.escrow.earnings.node === s.gateway_earnings_ukes, `${w.escrow.earnings.node}`);
  check('replay: satellite earnings', w.escrow.earnings.baraka === s.satellite_earnings_ukes, `${w.escrow.earnings.baraka}`);
  check('replay: founder received the fee', w.token.bal.founder === s.founder_claimed_ukes, `${w.token.bal.founder}`);
  check('replay: escrow balance', w.token.bal.escrow === chain.balances.at(-1).xkn.escrow, `${w.token.bal.escrow}`);
  const gasErr = Math.abs(settle.entry.gas - s.settle_gas) / s.settle_gas;
  check('replay: settle gas model within 0.5% of anvil', gasErr < 0.005, `${settle.entry.gas} vs ${s.settle_gas} (${(gasErr * 100).toFixed(2)}%)`);
  check('replay: all invariants hold', invariants(w).every((i) => i.ok));

  // ---- 2. every contract revert fires on its trigger ----------------------
  let r = setupNetwork(createWorld());
  w = r.world;
  w = buy(w, { client: 'amina', amount: kes(100) }).world;
  w = depositGasless(w, { client: 'amina', amount: kes(50) }).world;
  w.eth.amina = 1_000_000;
  const expect = (label, result, name) => check(`revert ${name}: ${label}`, !result.entry.ok && errName(result.entry) === name, result.entry.error ?? 'did not revert');
  const tk = offchain.signTicket(w, { client: 'amina', nodeAdmin: 'node', cumulativeUnits: 100 });
  expect('withdraw zero', escrow.withdrawDeposit(w, { from: 'amina', amount: 0 }), 'ZeroAmount');
  expect('withdraw more than deposit', escrow.withdrawDeposit(w, { from: 'amina', amount: kes(51) }), 'InsufficientDeposit');
  expect('claim more than earned', escrow.claimEarnings(w, { from: 'node', to: 'node', amount: 1 }), 'InsufficientEarnings');
  expect('empty batch', escrow.settleTicketBatch(w, { from: 'relayer', tickets: [] }), 'EmptyBatch');
  const late = offchain.warp(tk.world, { seconds: 2 * 86_400 }).world;
  expect('expired ticket', escrow.settleTicketBatch(late, { from: 'relayer', tickets: [tk.result] }), 'ExpiredTicket');
  const settled = escrow.settleTicketBatch(tk.world, { from: 'relayer', tickets: [tk.result] });
  check('settle one fresh ticket commits', settled.entry.ok, settled.entry.error ?? `gas ${settled.entry.gas}`);
  check('settle one fresh ticket gas = probe 131,391', settled.entry.gas === 131_391 || Math.abs(settled.entry.gas - 131_391) < 200, `${settled.entry.gas}`);
  expect('same ticket again', escrow.settleTicketBatch(settled.world, { from: 'relayer', tickets: [tk.result] }), 'StaleSequence');
  const sameUnits = offchain.signTicket(settled.world, { client: 'amina', nodeAdmin: 'node', cumulativeUnits: 100 });
  expect('newer sequence, no new units', escrow.settleTicketBatch(sameUnits.world, { from: 'relayer', tickets: [sameUnits.result] }), 'NoNewUnits');
  const warmT = offchain.signTicket(settled.world, { client: 'amina', nodeAdmin: 'node', cumulativeUnits: 200 });
  const warm = escrow.settleTicketBatch(warmT.world, { from: 'relayer', tickets: [warmT.result] });
  check('warm single-ticket settle gas within 0.1% of probe 80,103', Math.abs(warm.entry.gas - 80_103) / 80_103 < 0.001, `${warm.entry.gas}`);
  const forged = offchain.signTicket(settled.world, { client: 'amina', nodeAdmin: 'node', signer: 'node', cumulativeUnits: 9_999 });
  expect('node-signed ticket', escrow.settleTicketBatch(forged.world, { from: 'relayer', tickets: [forged.result] }), 'BadSignature');
  expect('price above band', escrow.setPricePerUnit(offchain.warp(w, { seconds: 86_400 }).world, { from: 'owner', newPrice: 50_001 }), 'PriceOutOfBand');
  expect('price change inside cooldown', escrow.setPricePerUnit(w, { from: 'owner', newPrice: 600 }), 'PriceCooldownActive');
  expect('non-owner sets price', escrow.setPricePerUnit(w, { from: 'mallory', newPrice: 600 }), 'OwnableUnauthorizedAccount');
  expect('non-bridge mints', token.bridgeMint(w, { from: 'mallory', to: 'mallory', amount: 1, fiatRef: 'x' }), 'NotBridge');
  expect('mint above cap', token.bridgeMint(w, { from: 'kiosk', to: 'mallory', amount: kes(50_000), fiatRef: 'x' }), 'MintCapExceeded');
  expect('fee above 10%', treasury.setFeeBps(w, { from: 'owner', feeBps: 1001 }), 'FeeTooHigh');
  expect('claim empty treasury', treasury.claim(w, { from: 'mallory' }), 'NothingToClaim');
  const queued = treasury.queueBeneficiary(w, { from: 'owner', next: 'mallory' }).world;
  expect('activate inside timelock', treasury.activateBeneficiary(queued, { from: 'mallory' }), 'TimelockActive');
  expect('stranger cancels', treasury.cancelBeneficiaryChange(queued, { from: 'mallory' }), 'NotAuthorized');
  expect('cancel with nothing queued', treasury.cancelBeneficiaryChange(w, { from: 'founder' }), 'NoPendingChange');
  expect('deposit without allowance', escrow.deposit(w, { from: 'amina', amount: kes(1) }), 'ERC20InsufficientAllowance');
  const activated = treasury.activateBeneficiary(offchain.warp(queued, { seconds: 7 * 86_400 }).world, { from: 'mallory' });
  check('beneficiary change activates after 7 days', activated.entry.ok && activated.world.treasury.beneficiary === 'mallory');

  // ---- 3. no-ETH client is rejected before the chain, gasless paths work ---
  const noEth = withdraw(depositGasless(buy(setupNetwork(createWorld()).world, { client: 'baraka', amount: kes(40) }).world, { client: 'baraka', amount: kes(20) }).world, { client: 'baraka', amount: kes(5) });
  check('withdraw with 0 ETH is rejected before the chain', !noEth.ok && noEth.failed.rejected && noEth.failed.gas === 0, noEth.failed?.error);
  const sent = send(w, { from: 'amina', to: 'baraka', amount: kes(10) });
  check('gasless send moves 10 KES and Amina pays no gas', sent.ok && sent.world.token.bal.baraka === kes(10) && !sent.world.gasSpent.amina, sent.failed?.error);
  const out = cashOut(w, { client: 'amina', amount: kes(10) });
  check('cash out: float and supply both drop 10 KES, peg holds', out.ok && out.world.fiat.float === w.fiat.float - kes(10) && out.world.token.supply === w.token.supply - kes(10) && invariants(out.world).every((i) => i.ok), out.failed?.error);

  // ---- 4. the 12 MB session ------------------------------------------------
  let sw = openSession(w, { client: 'amina', targetBytes: 12_000_000 }).world;
  const receipts = [];
  while (!sw.session.done) {
    const step12 = serve(sw, 750_000);
    sw = step12.world;
    receipts.push(...step12.entries);
  }
  check('12 MB session: 12 receipts signed', receipts.length === 12 && receipts.every((e) => e.ok), `${receipts.length}`);
  check('12 MB session: last ticket at 1,200 units', sw.tickets['amina>node'].at(-1).cumulativeUnits === 1_200);
  sw = closeSession(sw);
  const pend = pendingTickets(sw, 'node');
  check('only the latest of 12 tickets is pending', pend.length === 1 && pend[0].heldCount === 12);
  const settled12 = relayBatch(sw);
  const res = settled12.result;
  check('12 MB settles 0.60 KES gross, 0.03 fee, 0.57 net', res && res.gross === 600_000 && res.fee === 30_000 && res.net === 570_000, JSON.stringify(res));
  check('12 MB: invariants hold after settlement', invariants(settled12.world).every((i) => i.ok));

  // ---- 5. every drill, from a ready world ---------------------------------
  const ready = ensureReady(createWorld());
  check('ensureReady reaches a funded escrow', ready.ok && ready.world.escrow.deposits.amina === kes(50));
  for (const d of DRILLS) {
    const rd = d.run(ready.world);
    const inv = invariants(rd.world);
    const pegExempt = d.id === 'rogue-bridge';
    const holds = inv.filter((i) => !(pegExempt && i.id === 'peg')).every((i) => i.ok);
    check(`drill ${d.id}: outcome as claimed, invariants hold`, rd.ok && holds, rd.verdict.slice(0, 90));
    if (pegExempt) {
      const peg = inv.find((i) => i.id === 'peg');
      check('drill rogue-bridge: peg gap equals the minted remainder of the cap', peg.lhs - peg.rhs === kes(50_000) - kes(100), `${(peg.lhs - peg.rhs) / UKES} KES`);
    }
  }

  // ---- 6. randomised run: solvency and conservation never break ----------
  let rw = ready.world;
  rw.eth.amina = 1_000_000;
  rw.eth.baraka = 1_000_000;
  let seed = 42;
  const rand = (n) => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
    return seed % n;
  };
  let broken = null;
  let commits = 0;
  const clients = ['amina', 'baraka'];
  for (let i = 0; i < 300 && !broken; i += 1) {
    const c = clients[rand(2)];
    const amt = kes(1 + rand(30));
    const pick = rand(8);
    let res2;
    if (pick === 0) res2 = buy(rw, { client: c, amount: amt });
    else if (pick === 1) res2 = depositGasless(rw, { client: c, amount: amt });
    else if (pick === 2) res2 = withdraw(rw, { client: c, amount: amt });
    else if (pick === 3) res2 = send(rw, { from: c, to: clients[1 - clients.indexOf(c)], amount: amt });
    else if (pick === 4) res2 = cashOut(rw, { client: c, amount: amt });
    else if (pick === 5) {
      const t = offchain.signTicket(rw, { client: c, nodeAdmin: 'node', cumulativeUnits: (rw.tickets[`${c}>node`]?.at(-1)?.cumulativeUnits ?? 0) + 1 + rand(5_000) });
      res2 = { world: t.world, ok: t.entry.ok };
    } else if (pick === 6 && pendingTickets(rw).length) res2 = relayBatch(rw);
    else res2 = offchain.warp(rw, { seconds: rand(40_000) });
    rw = res2.world;
    if (res2.ok !== false) commits += 1;
    const bad = invariants(rw).find((inv) => !inv.ok);
    if (bad) broken = `${bad.id} after step ${i}`;
  }
  check('300 random actions: every invariant holds after every step', !broken, broken ?? `${commits} committed, ${rw.ledger.length} ledger entries`);
}
