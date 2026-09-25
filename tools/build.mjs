#!/usr/bin/env node
/**
 * build.mjs — derive every generated file in this repository from spec/v3/.
 *
 *   node tools/build.mjs          write the generated files
 *   node tools/build.mjs --check  verify they are up to date, write nothing (CI)
 *
 * What it produces:
 *   js/src/wordlists.js                          word lists as an ES module
 *   python/src/qrl_nicknames/_wordlists.py  word lists as a Python module
 *   spec/v3/test-vectors.json                    the conformance suite
 *   spec/v3/SHA256SUMS                           checksums of the spec files
 *
 * The test vectors come from the REFERENCE implementation in this file, which
 * uses Node's built-in SHA-256 and is written independently of the packages in
 * js/ and python/. The packages are then tested against the vectors. No
 * implementation ever grades its own homework.
 *
 * Zero dependencies. Runs on any Node >= 18.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC = join(ROOT, "spec", "v3");
const CHECK = process.argv.includes("--check");

const sha256hex = (s) => createHash("sha256").update(s).digest("hex");
const readText = (p) => readFileSync(p, "utf8");

const wordlistsText = readText(join(SPEC, "wordlists.json"));
const paramsText = readText(join(SPEC, "params.json"));
const words = JSON.parse(wordlistsText);
const params = JSON.parse(paramsText);

// ---------------------------------------------------------------------------
// 1. Validate the spec data. A malformed list must never reach a release.
// ---------------------------------------------------------------------------

const problems = [];
const LISTS = { adjectives: words.adjectives, creatures: words.creatures };

if (words.version !== 3 || params.version !== 3) problems.push("spec files must both declare version 3");
const seen = new Map();
for (const [name, list] of Object.entries(LISTS)) {
  if (!Array.isArray(list)) { problems.push(`${name} missing`); continue; }
  if (list.length !== 1024) problems.push(`${name} has ${list.length} entries, expected 1024`);
  for (const w of list) {
    if (!/^[A-Z][a-z]{2,11}$/.test(w)) problems.push(`${name}: "${w}" is not one capitalised ASCII word of 3-12 letters`);
    const k = w.toLowerCase();
    if (seen.has(k)) problems.push(`"${w}" appears in both ${seen.get(k)} and ${name}`);
    seen.set(k, name);
  }
}

let nextShift = 0;
const listBits = {};
for (const f of params.fields) {
  if (f.shift !== nextShift) problems.push(`field ${f.name} starts at bit ${f.shift}, expected ${nextShift}`);
  nextShift = f.shift + f.bits;
  if (f.list) listBits[f.list] = (listBits[f.list] ?? 0) + f.bits;
  if (f.alphabet) {
    if (new Set(f.alphabet).size !== f.alphabet.length) problems.push(`field ${f.name}: duplicate alphabet characters`);
    if (f.alphabet.length ** f.chars !== 2 ** f.bits) problems.push(`field ${f.name}: alphabet^chars != 2^bits`);
  }
}
for (const [name, bits] of Object.entries(listBits)) {
  if (LISTS[name]?.length !== 2 ** bits) problems.push(`${name}: list size != 2^${bits} (sum of its fields)`);
}
if (nextShift > params.integer.bits) problems.push(`fields use ${nextShift} bits, only ${params.integer.bits} available`);

if (problems.length) {
  console.error("SPEC INVALID:\n  " + problems.join("\n  "));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Reference implementation — deliberately plain, straight from SPEC.md.
// ---------------------------------------------------------------------------

const F = Object.fromEntries(params.fields.map((f) => [f.name, f]));

function field(n, f) {
  return Math.floor(n / 2 ** f.shift) % 2 ** f.bits;
}

function render(value, f) {
  let out = "";
  for (let i = 0; i < f.chars; i++) {
    out += f.alphabet[Math.floor(value / f.alphabet.length ** i) % f.alphabet.length];
  }
  return out;
}

function reference(input) {
  if (!/^[\x00-\x7f]*$/.test(input)) throw new Error("non-ASCII input");
  const normalised = input.replace(/[A-Z]/g, (c) => c.toLowerCase());
  const message = params.hash.message_prefix + normalised + params.hash.message_suffix;
  const digest = createHash("sha256").update(message, "utf8").digest();
  let n = 0;
  for (let i = 26; i < 32; i++) n = n * 256 + digest[i];
  const adjective = LISTS.adjectives[field(n, F.adjective) + 512 * field(n, F.adjective_high)];
  const creature = LISTS.creatures[field(n, F.creature) + 512 * field(n, F.creature_high)];
  const tag = render(field(n, F.tag_head), F.tag_head) + render(field(n, F.tag_tail), F.tag_tail);
  return { message, digest: digest.toString("hex"), n, adjective, creature, tag };
}

// ---------------------------------------------------------------------------
// 3. The conformance vectors.
// ---------------------------------------------------------------------------

const inputs = [];
const note = new Map();
const h = (s) => sha256hex(s);

inputs.push("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d");
note.set(inputs.at(-1), "QRL 2.0 address (the README example)");
inputs.push("QC0E6DD0E844E0048DCB0BD3FDCC44A970BECA38D");
note.set(inputs.at(-1), "Uppercase input: MUST equal the lowercase form");

for (let i = 0; i < 64; i++) inputs.push("Q" + h(`v3-qrl2-${i}`).slice(0, 40));
for (let i = 0; i < 64; i++) { const x = h(`v3-qrl-${i}`); inputs.push("Q" + (x + x).slice(0, 78)); }
for (let i = 0; i < 32; i++) {
  // Mixed case, EIP-55 style: case varies per character, name must not.
  const body = h(`v3-mixed-${i}`).slice(0, 40);
  const bits = h(`v3-mixed-case-${i}`);
  let mixed = "";
  for (let j = 0; j < body.length; j++) mixed += parseInt(bits[j], 16) % 2 ? body[j].toUpperCase() : body[j];
  inputs.push("Q" + mixed);
}
for (const s of ["", "q", "Q", "0x0000000000000000000000000000000000000000", "hello world", " Qabc", "Qabc "]) {
  inputs.push(s);
  note.set(s, s.trim() !== s ? "Whitespace is NOT trimmed: it is part of the input" : "Any ASCII string is valid input");
}
// Inputs whose hash message is 55, 56, 64, 119 and 120 bytes long: the SHA-256
// padding boundaries where hand-written implementations go wrong.
const overhead = params.hash.message_prefix.length + params.hash.message_suffix.length;
for (const len of [55, 56, 64, 119, 120]) {
  const s = "Q" + h(`v3-boundary-${len}`).repeat(2).slice(0, len - overhead - 1);
  inputs.push(s);
  note.set(s, `Hash message is ${len} bytes: a SHA-256 padding boundary`);
}

const vectors = inputs.map((input) => {
  const r = reference(input);
  const v = {
    input,
    name: `${r.adjective} ${r.creature} ${r.tag}`,
    slug: `${r.adjective}-${r.creature}-${r.tag}`.toLowerCase(),
    adjective: r.adjective,
    creature: r.creature,
    tag: r.tag,
    sha256: r.digest,
    n: r.n,
  };
  if (note.has(input)) v.note = note.get(input);
  return v;
});

// Case-insensitivity is part of the contract, so prove it inside the data.
const byLower = new Map();
for (const v of vectors) {
  const k = v.input.toLowerCase();
  if (byLower.has(k) && byLower.get(k) !== v.name) problems.push(`case variants of "${v.input}" disagree`);
  byLower.set(k, v.name);
}

const invalid = [
  { input: "Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38é", reason: "non-ASCII character" },
  { input: "Qİabc", reason: "non-ASCII capital I with dot (lowercases differently per language)" },
  { input: "QKabc", reason: "Kelvin sign (JavaScript toLowerCase maps it to 'k')" },
];
for (const bad of invalid) {
  try { reference(bad.input); problems.push(`reference accepted invalid input ${JSON.stringify(bad.input)}`); } catch {}
}

// ---------------------------------------------------------------------------
// 4. Compatibility with Quantascan spec v2: for addresses whose high bits are
//    both 0 (about a quarter), v3 only appends digits to the v2 name.
// ---------------------------------------------------------------------------

const compat = JSON.parse(readText(join(SPEC, "v2-compat.json"))).vectors;
for (const c of compat) {
  const r = reference(c.address);
  const v3 = `${r.adjective} ${r.creature} ${r.tag}`;
  if (!v3.startsWith(c.v2_name) || v3.length !== c.v2_name.length + 3) {
    problems.push(`v2 compatibility broken for ${c.address}: v2 "${c.v2_name}" vs v3 "${v3}"`);
  }
}

if (problems.length) {
  console.error("REFERENCE CHECK FAILED:\n  " + problems.join("\n  "));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 5. Emit.
// ---------------------------------------------------------------------------

const BANNER = "GENERATED by tools/build.mjs from spec/v3/wordlists.json. Do not edit.";
const wordlistsSha = sha256hex(wordlistsText);

const chunk = (list, per, indent) => {
  const rows = [];
  for (let i = 0; i < list.length; i += per) rows.push(indent + list.slice(i, i + per).map((w) => JSON.stringify(w)).join(", ") + ",");
  return rows.join("\n");
};

const jsWordlists = `// ${BANNER}
// Source SHA-256: ${wordlistsSha}

export const ADJECTIVES = Object.freeze([
${chunk(LISTS.adjectives, 8, "  ")}
]);

export const CREATURES = Object.freeze([
${chunk(LISTS.creatures, 8, "  ")}
]);
`;

const pyWordlists = `# ${BANNER}
# Source SHA-256: ${wordlistsSha}
"""Spec v3 word lists. The index is the mapping: never edit by hand."""

from typing import Tuple

ADJECTIVES: Tuple[str, ...] = (
${chunk(LISTS.adjectives, 8, "    ")}
)

CREATURES: Tuple[str, ...] = (
${chunk(LISTS.creatures, 8, "    ")}
)
`;

const vectorsText = JSON.stringify({
  spec: "qrl-nicknames",
  version: 3,
  note: "Conformance suite. An implementation is correct only if it reproduces every `name` exactly and rejects every `invalid` input. `sha256` and `n` are the intermediate values, included to make a failing port easy to debug.",
  vectors,
  invalid,
}, null, 1) + "\n";

const sums = [
  ["wordlists.json", wordlistsText],
  ["params.json", paramsText],
  ["test-vectors.json", vectorsText],
  ["v2-compat.json", readText(join(SPEC, "v2-compat.json"))],
  ["known-issues.json", readText(join(SPEC, "known-issues.json"))],
].map(([f, body]) => `${sha256hex(body)}  ${f}`).join("\n") + "\n";

const outputs = [
  [join(ROOT, "js", "src", "wordlists.js"), jsWordlists],
  [join(ROOT, "python", "src", "qrl_nicknames", "_wordlists.py"), pyWordlists],
  [join(SPEC, "test-vectors.json"), vectorsText],
  [join(SPEC, "SHA256SUMS"), sums],
];

let drift = false;
for (const [path, body] of outputs) {
  if (existsSync(path) && readText(path) === body) continue;
  drift = true;
  const rel = relative(ROOT, path).replaceAll("\\", "/");
  if (CHECK) console.error(`out of date: ${rel}`);
  else { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, body, "utf8"); console.log(`wrote ${rel}`); }
}

console.log(`${vectors.length} vectors, ${invalid.length} invalid inputs, ${compat.length} v2 names still prefixes`);
if (CHECK) {
  console.log(drift ? "run `node tools/build.mjs` and commit the result" : "generated files are up to date");
  process.exit(drift ? 1 : 0);
}
