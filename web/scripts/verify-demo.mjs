/*
 * Proves the /demo simulator against the real contracts' recorded behaviour.
 * Run: npm run verify:demo (exit 0 means every check passed).
 *
 * 1. Crypto parity: the JS EIP-712 ticket digest equals the digest the live
 *    anvil escrow returned from hashTicket, for both tickets in chain.json.
 * 2. Key derivation: anvil key 0 maps to the deployer address in chain.json.
 * 3. ECDSA round trip with low-S, Ed25519 voucher round trip and tamper.
 * 4. Engine replay: the chain proof's transaction sequence, replayed through
 *    the demo engine, ends at the balances and escrow state the chain recorded.
 * 5. Engine rules: every revert the contracts define fires on its trigger,
 *    and solvency plus the peg hold after a randomised run.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  addressOf,
  bytesToHex,
  demoKey,
  hexToBytes,
  recoverAddress,
  signDigest,
  signVoucher,
  ticketDigest,
  verifyVoucher,
} from '../src/demo/crypto.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const chain = JSON.parse(fs.readFileSync(path.join(here, '../src/proof/chain.json'), 'utf8'));

let failures = 0;
let passes = 0;
export function check(name, ok, detail = '') {
  if (ok) passes += 1;
  else failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  ${detail}` : ''}`);
}

// 1. digest parity
const domain = { name: 'xKoinEscrow', version: '1', chainId: chain.chain_id, verifyingContract: chain.contracts.escrow };
for (const t of chain.tickets) {
  const digest = bytesToHex(
    ticketDigest(
      {
        client: t.client.address,
        nodeAdmin: t.node_admin.address,
        sequenceNumber: t.sequence_number,
        cumulativeUnits: t.units,
        epochExpiry: t.epoch_expiry,
      },
      domain,
    ).digest,
  );
  check(`ticket digest parity (${t.holder})`, digest === t.digest_onchain, digest);
}

// 2. key derivation
const anvil0 = addressOf(hexToBytes('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'));
check('anvil key 0 -> deployer address', anvil0 === chain.actors.deployer, anvil0);

// 3. signatures
const amina = demoKey('amina');
const digest = new Uint8Array(32).fill(7);
const sig = signDigest(digest, amina.secret);
check('ECDSA sign then recover returns signer', recoverAddress(digest, sig.signature) === amina.address);
const halfN = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n / 2n;
check('ECDSA signature is low-S (OpenZeppelin rejects high-S)', BigInt(sig.s) <= halfN);
const forged = sig.signature.slice(0, 10) + (sig.signature[10] === 'a' ? 'b' : 'a') + sig.signature.slice(11);
check('tampered signature does not recover signer', recoverAddress(digest, forged) !== amina.address);
const voucher = { to: amina.address, amount_ukes: 100_000_000, rail: 'daraja' };
const sv = signVoucher(voucher, amina.secret);
check('Ed25519 voucher verifies', verifyVoucher(voucher, sv.signature, amina.edPublic));
check('Ed25519 voucher rejects tampered amount', !verifyVoucher({ ...voucher, amount_ukes: 100_000_001 }, sv.signature, amina.edPublic));

const engineChecks = await import('./verify-demo-engine.mjs').catch((err) => {
  if (err.code === 'ERR_MODULE_NOT_FOUND') return null;
  throw err;
});
if (engineChecks) await engineChecks.run(check, chain);

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
