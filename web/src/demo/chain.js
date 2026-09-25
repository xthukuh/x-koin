/*
 * Checking the chain by hand, and what tampering does.
 *
 * Each block commits to its transaction and to the block before it:
 *   txHash    = keccak256(from || to || nonce || calldata)
 *   blockHash = keccak256(parentHash || number || timestamp || txHash || stateRoot)
 * Real keccak256; the layout is simplified (Ethereum hashes an RLP-encoded
 * signed transaction and header, and roots state and transactions in tries).
 * The property shown is the same: change one byte anywhere and every hash
 * from that block onwards changes.
 *
 * Algorithm (for porting):
 *   verify(blocks):
 *     1. for each block i, recompute txHash from its transaction fields
 *     2. recompute blockHash from the header fields
 *     3. check parentHash equals block i-1's stored hash (or 32 zero bytes for i = 0)
 *     4. the first block failing any check is where the history was changed
 */

import { bytesToHex, concat, hexToBytes, keccak, uintWord } from './crypto.js';

const ZERO32 = '0x' + '00'.repeat(32);
const ZERO20 = '0x' + '00'.repeat(20);

export function txHashOf(tx) {
  const to = tx.to.startsWith('0x') ? tx.to : ZERO20;
  return bytesToHex(keccak(concat(hexToBytes(tx.from), hexToBytes(to), uintWord(tx.nonce), hexToBytes(tx.input))));
}

export function headerPreimage(b) {
  return concat(hexToBytes(b.parentHash), uintWord(b.number), uintWord(b.timestamp), hexToBytes(b.txHash), hexToBytes(b.stateRoot));
}

export const blockHashOf = (b) => bytesToHex(keccak(headerPreimage(b)));

/** Recompute every hash and link. Returns one row per block. */
export function verify(blocks) {
  return blocks.map((b, i) => {
    const tx = txHashOf(b.tx) === b.txHash;
    const header = blockHashOf(b) === b.hash;
    const link = b.parentHash === (i === 0 ? ZERO32 : blocks[i - 1].hash);
    return { number: b.number, tx, header, link, ok: tx && header && link };
  });
}

/** Change the amount inside block i's calldata. Returns a new array; the original is untouched. */
export function tamper(blocks, i, fromAmount, toAmount) {
  const out = blocks.slice();
  const b = { ...out[i], tx: { ...out[i].tx } };
  const oldWord = bytesToHex(uintWord(fromAmount)).slice(2);
  const newWord = bytesToHex(uintWord(toAmount)).slice(2);
  const body = b.tx.input.slice(10);
  const at = body.indexOf(oldWord);
  if (at >= 0 && at % 64 === 0) {
    b.tx.input = b.tx.input.slice(0, 10) + body.slice(0, at) + newWord + body.slice(at + 64);
  } else {
    // No amount word found: flip the last byte of the calldata.
    const last = parseInt(b.tx.input.slice(-2) || '00', 16) ^ 0xff;
    b.tx.input = b.tx.input.length > 2 ? b.tx.input.slice(0, -2) + last.toString(16).padStart(2, '0') : '0xff';
  }
  out[i] = b;
  return out;
}

/**
 * What a forger does next: recompute hashes from block i. With `onlyThis`,
 * only block i is fixed, which breaks the link from block i+1; without it,
 * every later block is rebuilt so the copy is self-consistent again.
 */
export function rehash(blocks, i, onlyThis = false) {
  const out = blocks.slice();
  const last = onlyThis ? i : out.length - 1;
  for (let k = i; k <= last; k += 1) {
    const b = { ...out[k], tx: { ...out[k].tx } };
    b.txHash = txHashOf(b.tx);
    b.tx.hash = b.txHash;
    if (k > i) b.parentHash = out[k - 1].hash;
    b.hash = blockHashOf(b);
    out[k] = b;
  }
  return out;
}

/** Preimage and a command anyone can run to check one block's hash. */
export function howToCheck(b) {
  const pre = bytesToHex(headerPreimage(b));
  return { preimage: pre, cast: `cast keccak ${pre}`, js: `crypto.keccak(hexToBytes('${pre}'))` };
}
