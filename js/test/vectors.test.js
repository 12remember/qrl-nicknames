// Conformance tests for the JavaScript package. Run: npm test (from js/).

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { SPEC_VERSION, nickname, nicknameParts, nicknameSlug } from "../src/index.js";
import { sha256 } from "../src/sha256.js";

const spec = (f) => JSON.parse(readFileSync(new URL(`../../spec/v3/${f}`, import.meta.url), "utf8"));
const { vectors, invalid } = spec("test-vectors.json");

test("implements spec v3", () => {
  assert.equal(SPEC_VERSION, 3);
});

test("reproduces every conformance vector", () => {
  for (const v of vectors) {
    const p = nicknameParts(v.input);
    assert.equal(p.name, v.name, `name for ${JSON.stringify(v.input)}`);
    assert.equal(p.slug, v.slug, `slug for ${JSON.stringify(v.input)}`);
    assert.equal(p.adjective, v.adjective);
    assert.equal(p.creature, v.creature);
    assert.equal(p.tag, v.tag);
    assert.equal(p.words, `${v.adjective} ${v.creature}`);
    assert.equal(nickname(v.input), v.name);
    assert.equal(nicknameSlug(v.input), v.slug);
  }
});

test("rejects every invalid input", () => {
  for (const bad of invalid) {
    assert.throws(() => nickname(bad.input), RangeError, bad.reason);
  }
  assert.throws(() => nickname(undefined), TypeError);
  assert.throws(() => nickname(42), TypeError);
});

test("bundled SHA-256 matches the platform's SHA-256", () => {
  for (const v of vectors) {
    const msg = "qs-nickname-v2|" + v.input.toLowerCase() + "|0";
    const ours = Buffer.from(sha256(new TextEncoder().encode(msg))).toString("hex");
    assert.equal(ours, createHash("sha256").update(msg).digest("hex"));
    assert.equal(ours, v.sha256);
  }
  // Block-boundary lengths are where padding bugs hide.
  for (let len = 0; len < 200; len++) {
    const msg = "a".repeat(len);
    const ours = Buffer.from(sha256(new TextEncoder().encode(msg))).toString("hex");
    assert.equal(ours, createHash("sha256").update(msg).digest("hex"), `length ${len}`);
  }
});

test("every Quantascan v2 name is a prefix of its v3 name", () => {
  for (const c of spec("v2-compat.json").vectors) {
    const v3 = nickname(c.address);
    assert.ok(v3.startsWith(c.v2_name) && v3.length === c.v2_name.length + 3, `${c.v2_name} -> ${v3}`);
  }
});
