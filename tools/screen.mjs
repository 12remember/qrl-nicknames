#!/usr/bin/env node
/**
 * screen.mjs — content-safety gate for the v3 names.
 *
 *   node tools/screen.mjs            fail on any blocking finding
 *   node tools/screen.mjs --strict   also fail on advisory boundary findings
 *
 * 137 billion names cannot be read by a person, and one bad one becomes a
 * screenshot. So the check runs at every level where a name can go wrong:
 *
 *   1. WORD      a list entry that is itself charged              (blocking)
 *   2. TAG       any of the 524,288 possible tags                 (blocking)
 *   3. BOUNDARY  two innocent parts whose JOIN forms a stem       (advisory:
 *                every rendering has a space or a hyphen between parts)
 *   4. SAMPLE    300,000 rendered names, as a backstop            (blocking)
 *
 * Words are frozen for v3, so a new blocking finding can only mean this list of
 * stems grew. Record accepted findings in spec/v3/known-issues.json; anything
 * outside that file fails.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { nicknameParts } from "../js/src/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC = join(ROOT, "spec", "v3");
const STRICT = process.argv.includes("--strict");

const words = JSON.parse(readFileSync(join(SPEC, "wordlists.json"), "utf8"));
const params = JSON.parse(readFileSync(join(SPEC, "params.json"), "utf8"));
const known = JSON.parse(readFileSync(join(SPEC, "known-issues.json"), "utf8"));
const ACCEPTED = new Set(known.accepted.map((a) => a.toLowerCase()));

/** Charged stems, matched case-insensitively as substrings. */
const STEMS = [
  // sexual / profanity
  "fuck", "shit", "cunt", "dick", "cock", "penis", "boob", "arse", "anal", "anus",
  "sperm", "porn", "slut", "whore", "nipple", "wank", "horny", "titty",
  // slurs / ethnic / religious
  "nigg", "negro", "chink", "gook", "spic", "kike", "paki", "kaffir", "wetback",
  "nazi", "hitler", "jihad", "aryan",
  // violence / harm
  "rape", "lynch", "genocid", "suicid", "murder", "torture",
  // drugs
  "cocain", "heroin", "junkie",
  // ableist / slurs
  "retard", "spastic", "cripple", "midget", "tranny", "fag", "dyke",
  // finance risk: a wallet named "Scam ..." or "Rugged ..." reads as an accusation
  "scam", "ponzi", "rugpull", "rugged", "fraud", "crook", "thief", "stolen", "hacker",
  "phish", "launder", "shady", "sketchy", "dodgy", "bogus", "bankrupt", "rekt",
];

/** Short words that cannot be substring-matched without flagging half the
 *  dictionary (Titanium, Hematite), so they are banned as whole entries. */
const EXACT = new Set(
  "tit tits sperm booby boobies knob prick nut nuts bust bum ho hoe gash fanny minge willy todger".split(" ")
);

/** Ordinary words that happen to contain a stem (the Scunthorpe list). */
const ALLOW = new Set(
  "titanium hematite magnetite amethyst gypsum auspicious cockle cockatoo woodcock peacock shuttlecock dickcissel spicule cockatiel".split(" ")
);

const stemIn = (text) => STEMS.find((s) => text.toLowerCase().includes(s)) ?? null;

function screenWord(word) {
  const low = word.toLowerCase();
  if (EXACT.has(low)) return `exact:${low}`;
  if (ALLOW.has(low)) return null;
  return stemIn(low);
}

let blocking = 0;
let advisory = 0;
const report = (ok, label, detail) => console.log(`${ok ? "ok  " : "FAIL"} ${label.padEnd(9)} ${detail}`);

// 1. Words ------------------------------------------------------------------
const wordHits = [];
for (const list of ["adjectives", "creatures"]) {
  for (const w of words[list]) {
    const s = screenWord(w);
    if (s && !ACCEPTED.has(w.toLowerCase())) wordHits.push(`${w} (${list}, ${s})`);
  }
}
blocking += wordHits.length;
const wordCount = words.adjectives.length + words.creatures.length;
report(!wordHits.length, "words", wordHits.length ? wordHits.join(", ") : `${wordCount.toLocaleString("en-US")} words clean`);

// 2. Tags -------------------------------------------------------------------
const head = params.fields.find((f) => f.name === "tag_head");
const tail = params.fields.find((f) => f.name === "tag_tail");
const render = (v, f) => {
  let out = "";
  for (let i = 0; i < f.chars; i++) { out += f.alphabet[v % f.alphabet.length]; v = Math.floor(v / f.alphabet.length); }
  return out;
};
const heads = Array.from({ length: 2 ** head.bits }, (_, v) => render(v, head));
const tails = Array.from({ length: 2 ** tail.bits }, (_, v) => render(v, tail));
const tagHits = [];
for (const hd of heads) for (const tl of tails) {
  const s = screenWord(hd + tl);
  if (s) tagHits.push(`${hd}${tl} (${s})`);
}
blocking += tagHits.length;
report(!tagHits.length, "tags", tagHits.length ? tagHits.slice(0, 10).join(", ") : `${(heads.length * tails.length).toLocaleString("en-US")} tags clean`);

// 3. Boundaries (joined WITHOUT a separator) --------------------------------
function spans(a, b) {
  const joined = (a + b).toLowerCase();
  for (const s of STEMS) {
    for (let i = joined.indexOf(s); i !== -1; i = joined.indexOf(s, i + 1)) {
      if (i < a.length && i + s.length > a.length) return s;
    }
  }
  return null;
}
let pairs = 0;
const boundaryHits = [];
for (const [left, right] of [[words.adjectives, words.creatures], [words.creatures, heads]]) {
  for (const a of left) for (const b of right) {
    pairs++;
    const s = spans(a, b);
    if (s) boundaryHits.push(`${a}+${b} (${s})`);
  }
}
if (STRICT) blocking += boundaryHits.length; else advisory += boundaryHits.length;
report(
  !(STRICT && boundaryHits.length),
  "boundary",
  `${boundaryHits.length} of ${pairs.toLocaleString("en-US")} pairs form a stem only when joined without a separator` +
    (boundaryHits.length ? ` (e.g. ${boundaryHits.slice(0, 3).join(", ")})` : "")
);

// 4. Rendered sample --------------------------------------------------------
const sampleHits = [];
for (let i = 0; i < 300_000; i++) {
  const x = createHash("sha256").update(`screen-${i}`).digest("hex");
  const address = "Q" + (i % 2 ? (x + x).slice(0, 78) : x.slice(0, 40));
  const p = nicknameParts(address);
  for (const part of [p.adjective, p.creature, p.tag]) {
    if (ACCEPTED.has(part.toLowerCase())) continue;
    const s = screenWord(part);
    if (s) { sampleHits.push(`${p.name} (${s})`); break; }
  }
}
blocking += sampleHits.length;
report(!sampleHits.length, "sample", sampleHits.length ? sampleHits.slice(0, 10).join(", ") : "300,000 rendered names clean");

console.log(`\n${blocking ? "FAILED" : "PASSED"}: ${blocking} blocking, ${advisory} advisory`);
process.exit(blocking ? 1 : 0);
