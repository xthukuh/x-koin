/*
 * Minimal Solidity ABI encoder: the exact calldata bytes a transaction would
 * carry. Covers what the three xKoin contracts use: address, bool, uintN,
 * bytes32, bytes, T[] and tuples of static types. Checked against
 * `cast calldata` in web/scripts/verify-demo.mjs.
 *
 * Algorithm (ABI spec, head/tail encoding), for porting:
 *   1. selector = first 4 bytes of keccak256("name(type1,type2,...)")
 *   2. each static argument is one or more 32-byte words in the head
 *   3. each dynamic argument puts its byte offset (from the start of the
 *      argument block) in the head and its encoding in the tail
 *   4. bytes: 32-byte length, then data right-padded to a multiple of 32
 *   5. T[]: 32-byte count, then the elements encoded as a block by the same
 *      rules (dynamic elements get offsets relative to that block)
 */

import { addressWord, bytesToHex, concat, hexToBytes, keccakText, uintWord } from './crypto.js';

const isDynamic = (type) => type === 'bytes' || type === 'string' || type.endsWith('[]') || (type.startsWith('(') && splitTuple(type).some(isDynamic));

function splitTuple(type) {
  const inner = type.slice(1, -1);
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of inner) {
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
      continue;
    }
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

function encodeStatic(type, value) {
  if (type === 'address') return addressWord(value);
  if (type === 'bool') return uintWord(value ? 1 : 0);
  if (type.startsWith('uint')) return uintWord(value);
  if (type === 'bytes32') return hexToBytes(value).length === 32 ? hexToBytes(value) : concat(hexToBytes(value), new Uint8Array(32 - hexToBytes(value).length));
  if (type.startsWith('(')) return concat(...splitTuple(type).map((t, i) => encodeStatic(t, value[i])));
  throw new Error(`abi: unsupported static type ${type}`);
}

function encodeDynamic(type, value) {
  if (type === 'bytes') {
    const data = hexToBytes(value);
    const pad = (32 - (data.length % 32)) % 32;
    return concat(uintWord(data.length), data, new Uint8Array(pad));
  }
  if (type.endsWith('[]')) {
    const inner = type.slice(0, -2);
    return concat(uintWord(value.length), encodeArgs(value.map(() => inner), value));
  }
  if (type.startsWith('(')) return encodeArgs(splitTuple(type), value);
  throw new Error(`abi: unsupported dynamic type ${type}`);
}

/** Head/tail encoding of a list of arguments. */
export function encodeArgs(types, values) {
  const heads = [];
  const tails = [];
  let headSize = types.reduce((n, t) => n + (isDynamic(t) ? 32 : encodeStatic(t, zeroOf(t)).length), 0);
  for (let i = 0; i < types.length; i += 1) {
    if (isDynamic(types[i])) {
      heads.push(uintWord(headSize));
      const tail = encodeDynamic(types[i], values[i]);
      tails.push(tail);
      headSize += tail.length;
    } else {
      heads.push(encodeStatic(types[i], values[i]));
    }
  }
  return concat(...heads, ...tails);
}

function zeroOf(type) {
  if (type.startsWith('(')) return splitTuple(type).map(zeroOf);
  return type === 'address' ? '0x0000000000000000000000000000000000000000' : type === 'bytes32' ? '0x' + '00'.repeat(32) : 0;
}

/** Full calldata: selector plus arguments. `signature` like "transfer(address,uint256)". */
export function calldata(signature, values) {
  const types = splitTuple(signature.slice(signature.indexOf('(')));
  const selector = keccakText(signature).slice(0, 4);
  return { selector: bytesToHex(selector), data: bytesToHex(concat(selector, encodeArgs(types, values))) };
}
