/*
 * The real cryptography behind /demo. Nothing here is mocked: keccak256,
 * EIP-712 hashing, secp256k1 ECDSA and Ed25519 are the audited @noble
 * implementations, and the ticket digest is byte-for-byte the one
 * xKoinEscrow.hashTicket returns. web/scripts/verify-demo.mjs proves that
 * against the two digests the chain proof recorded from a live anvil escrow.
 *
 * Every function returns its intermediate values as well as its result, so
 * the page can show each hashing step rather than a single opaque hex string.
 *
 * The private keys are derived from public labels. They are demo keys and
 * anyone can recompute them; never fund them on a real chain.
 */

import { ed25519 } from '@noble/curves/ed25519.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';

const enc = new TextEncoder();

export const bytesToHex = (bytes) =>
  '0x' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export function hexToBytes(hex) {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

export const keccak = (bytes) => keccak_256(bytes);
export const keccakText = (text) => keccak_256(enc.encode(text));

/** One 32-byte ABI word for an unsigned integer (Number or BigInt). */
export function uintWord(value) {
  let v = BigInt(value);
  const out = new Uint8Array(32);
  for (let i = 31; i >= 0; i -= 1) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

/** One 32-byte ABI word for an address: 12 zero bytes then the 20 bytes. */
export const addressWord = (address) => concat(new Uint8Array(12), hexToBytes(address));

/** EIP-55 mixed-case checksum. */
export function checksum(address) {
  const lower = address.toLowerCase().replace(/^0x/, '');
  const hash = bytesToHex(keccakText(lower)).slice(2);
  let out = '0x';
  for (let i = 0; i < 40; i += 1) {
    out += parseInt(hash[i], 16) >= 8 ? lower[i].toUpperCase() : lower[i];
  }
  return out;
}

/** Ethereum address of a secp256k1 private key: last 20 bytes of keccak(pubkey x||y). */
export function addressOf(privateKey) {
  const pub = secp256k1.getPublicKey(privateKey, false);
  return checksum(bytesToHex(keccak(pub.slice(1)).slice(12)));
}

/** A deterministic demo key: keccak256("xkoin-demo:" + label). Public, never fund it. */
export function demoKey(label) {
  const secret = keccakText(`xkoin-demo:${label}`);
  const ed = ed25519.getPublicKey(secret);
  return {
    label,
    secret,
    address: addressOf(secret),
    edPublic: bytesToHex(ed),
  };
}

// ---------------------------------------------------------------------------
// EIP-712
// ---------------------------------------------------------------------------

export const DOMAIN_TYPE =
  'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';
export const TICKET_TYPE =
  'Ticket(address client,address nodeAdmin,uint64 sequenceNumber,uint128 cumulativeUnits,uint256 epochExpiry)';
export const PERMIT_TYPE =
  'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)';

export function domainSeparator({ name, version, chainId, verifyingContract }) {
  const typeHash = keccakText(DOMAIN_TYPE);
  const nameHash = keccakText(name);
  const versionHash = keccakText(version);
  const encoded = concat(typeHash, nameHash, versionHash, uintWord(chainId), addressWord(verifyingContract));
  return { typeHash, nameHash, versionHash, encoded, separator: keccak(encoded) };
}

function finalDigest(separator, structHash) {
  const preimage = concat(new Uint8Array([0x19, 0x01]), separator, structHash);
  return { preimage, digest: keccak(preimage) };
}

/**
 * The digest xKoinEscrow checks. Steps, in the order the contract does them:
 * typehash, abi.encode of the five fields, structHash, domain separator, then
 * keccak256(0x1901 || separator || structHash).
 */
export function ticketDigest(ticket, domain) {
  const typeHash = keccakText(TICKET_TYPE);
  const encoded = concat(
    typeHash,
    addressWord(ticket.client),
    addressWord(ticket.nodeAdmin),
    uintWord(ticket.sequenceNumber),
    uintWord(ticket.cumulativeUnits),
    uintWord(ticket.epochExpiry),
  );
  const structHash = keccak(encoded);
  const dom = domainSeparator(domain);
  const { preimage, digest } = finalDigest(dom.separator, structHash);
  return { typeHash, encoded, structHash, domain: dom, preimage, digest };
}

/** EIP-2612 permit digest for ERC20Permit("xKoin"), the gasless deposit and send path. */
export function permitDigest(permit, domain) {
  const typeHash = keccakText(PERMIT_TYPE);
  const encoded = concat(
    typeHash,
    addressWord(permit.owner),
    addressWord(permit.spender),
    uintWord(permit.value),
    uintWord(permit.nonce),
    uintWord(permit.deadline),
  );
  const structHash = keccak(encoded);
  const dom = domainSeparator(domain);
  const { preimage, digest } = finalDigest(dom.separator, structHash);
  return { typeHash, encoded, structHash, domain: dom, preimage, digest };
}

export const WITHDRAW_TYPE = 'Withdraw(address client,address to,uint256 amount,uint256 nonce,uint256 deadline)';
export const TRANSFER_TYPE = 'TransferDeposit(address from,address to,uint256 amount,uint256 nonce,uint256 deadline)';

/** xKoinEscrow withdrawWithSig / transferDeposit authorisation digest. `kind` is 'withdraw' or 'transfer'. */
export function authDigest(kind, auth, domain) {
  const typeHash = keccakText(kind === 'withdraw' ? WITHDRAW_TYPE : TRANSFER_TYPE);
  const encoded = concat(
    typeHash,
    addressWord(auth.from),
    addressWord(auth.to),
    uintWord(auth.amount),
    uintWord(auth.nonce),
    uintWord(auth.deadline),
  );
  const structHash = keccak(encoded);
  const dom = domainSeparator(domain);
  const { preimage, digest } = finalDigest(dom.separator, structHash);
  return { typeHash, encoded, structHash, domain: dom, preimage, digest };
}

/** channelId = keccak256(abi.encodePacked(client, nodeAdmin)): 40 packed bytes. */
export const channelId = (client, nodeAdmin) =>
  bytesToHex(keccak(concat(hexToBytes(client), hexToBytes(nodeAdmin))));

// ---------------------------------------------------------------------------
// secp256k1: what the client wallet does for tickets and permits
// ---------------------------------------------------------------------------

/** Sign a 32-byte digest, returning r || s || v with v in {27, 28} as OpenZeppelin ECDSA expects. */
export function signDigest(digest, secret) {
  // noble "recovered" format is recovery byte first, then r, then s.
  const rec = secp256k1.sign(digest, secret, { prehash: false, format: 'recovered' });
  const r = rec.slice(1, 33);
  const s = rec.slice(33, 65);
  const v = 27 + rec[0];
  return { r: bytesToHex(r), s: bytesToHex(s), v, signature: bytesToHex(concat(r, s, new Uint8Array([v]))) };
}

/** ECDSA.recover: the address that signed `digest`, or null if the bytes do not parse. */
export function recoverAddress(digest, signatureHex) {
  try {
    const sig = hexToBytes(signatureHex);
    if (sig.length !== 65) return null;
    const v = sig[64];
    if (v !== 27 && v !== 28) return null;
    const recovered = concat(new Uint8Array([v - 27]), sig.slice(0, 64));
    const pub = secp256k1.recoverPublicKey(recovered, digest, { prehash: false });
    const point = secp256k1.Point.fromBytes(pub).toBytes(false);
    return checksum(bytesToHex(keccak(point.slice(1)).slice(12)));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Ed25519: the kiosk root key and the admission voucher (spec paper 04 s4)
// ---------------------------------------------------------------------------

/** Canonical voucher bytes: keys sorted, no whitespace, so signer and node hash the same thing. */
export function voucherBytes(voucher) {
  const sorted = Object.keys(voucher)
    .sort()
    .reduce((acc, key) => ({ ...acc, [key]: voucher[key] }), {});
  return enc.encode(JSON.stringify(sorted));
}

export function signVoucher(voucher, secret) {
  const message = voucherBytes(voucher);
  return { message, signature: bytesToHex(ed25519.sign(message, secret)) };
}

export function verifyVoucher(voucher, signatureHex, publicHex) {
  try {
    return ed25519.verify(hexToBytes(signatureHex), voucherBytes(voucher), hexToBytes(publicHex));
  } catch {
    return false;
  }
}

/** Short display form: 0x1234..abcd. */
export const short = (hex, head = 6, tail = 4) =>
  typeof hex === 'string' && hex.length > head + tail + 2 ? `${hex.slice(0, head)}..${hex.slice(-tail)}` : hex;
