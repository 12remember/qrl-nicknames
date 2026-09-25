// qrl-nicknames — readable, deterministic names for QRL addresses.
// Spec v3: https://github.com/12remember/qrl-nicknames/blob/main/SPEC.md
//
// The name is a pure function of the address. No network, no state, no
// registry: every implementation of the spec returns the same name for the
// same address, forever.

import { sha256 } from "./sha256.js";
import { ADJECTIVES, CREATURES } from "./wordlists.js";

/** The spec version this package implements. Names never change within it. */
export const SPEC_VERSION = 3;

// Frozen constants. The "v2" and "|0" keep v3 names compatible with the names
// Quantascan published under spec v2; they are not the spec version.
const PREFIX = "qs-nickname-v2|";
const SUFFIX = "|0";
const HEAD = "abcdefghijkmnpqrstuvwxyz23456789";
const TAIL = "23456789";

/** ASCII-encode the hash message, lowercasing A-Z only. Rejects non-ASCII. */
function message(address) {
  if (typeof address !== "string") {
    throw new TypeError("qrl-nicknames: address must be a string");
  }
  const text = PREFIX + address + SUFFIX;
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    let c = text.charCodeAt(i);
    if (c > 0x7f) {
      throw new RangeError("qrl-nicknames: address must be ASCII");
    }
    if (c >= 0x41 && c <= 0x5a) c += 0x20;
    bytes[i] = c;
  }
  return bytes;
}

// n is a 48-bit integer, so plain arithmetic is exact. Bitwise operators are
// not: JavaScript truncates them to 32 bits.
function field(n, shift, bits) {
  return Math.floor(n / 2 ** shift) % 2 ** bits;
}

function render(value, alphabet, chars) {
  let out = "";
  for (let i = 0; i < chars; i++) {
    out += alphabet[value % alphabet.length];
    value = Math.floor(value / alphabet.length);
  }
  return out;
}

/**
 * Every part of the name for an address.
 *
 * @param {string} address any ASCII string; case-insensitive, not trimmed
 * @returns {{adjective: string, creature: string, tag: string, words: string, name: string, slug: string}}
 */
export function nicknameParts(address) {
  const digest = sha256(message(address));
  let n = 0;
  for (let i = 26; i < 32; i++) n = n * 256 + digest[i];

  // Each word index is 10 bits: 9 low bits next to each other, plus one high
  // bit from the top of n. High bit 0 selects the first 512 words, which keeps
  // those names identical to Quantascan's v2 names.
  const adjective = ADJECTIVES[field(n, 5, 9) + 512 * field(n, 42, 1)];
  const creature = CREATURES[field(n, 14, 9) + 512 * field(n, 43, 1)];
  const tag = render(field(n, 23, 10), HEAD, 2) + render(field(n, 33, 9), TAIL, 3);
  const words = `${adjective} ${creature}`;
  return {
    adjective,
    creature,
    tag,
    words,
    name: `${words} ${tag}`,
    slug: `${adjective}-${creature}-${tag}`.toLowerCase(),
  };
}

/**
 * The name for an address, e.g. "Sparkly Kappa tk856".
 *
 * @param {string} address any ASCII string; case-insensitive, not trimmed
 * @returns {string}
 */
export function nickname(address) {
  return nicknameParts(address).name;
}

/**
 * The URL-safe form, e.g. "sparkly-kappa-tk856". Always hyphenated: joining
 * the words without a separator can form unintended words across the boundary.
 *
 * @param {string} address any ASCII string; case-insensitive, not trimmed
 * @returns {string}
 */
export function nicknameSlug(address) {
  return nicknameParts(address).slug;
}
