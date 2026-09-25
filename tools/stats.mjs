#!/usr/bin/env node
/**
 * stats.mjs — the numbers behind the README: namespace, expected collisions,
 * name length, and an empirical collision count over simulated addresses.
 *
 *   node tools/stats.mjs [simulated-addresses=200000]
 */

import { createHash } from "node:crypto";
import { nicknameParts } from "../js/src/index.js";

const NAMESPACE = 512 * 512 * 1024 * 512; // adjective x creature x tag head x tag tail
const N = Number(process.argv[2] ?? 200_000);
const fmt = (x) => x.toLocaleString("en-US", { maximumFractionDigits: 2 });

console.log(`namespace: ${fmt(NAMESPACE)} names (2^37)\n`);
console.log("expected pairs of addresses sharing a name (n^2 / 2M):");
for (const n of [100_000, 200_000, 1_000_000, 5_000_000, 10_000_000, 100_000_000]) {
  console.log(`  ${fmt(n).padStart(12)} addresses -> ${fmt((n * (n - 1)) / 2 / NAMESPACE)}`);
}

const seen = new Map();
const lengths = [];
let pairs = 0;
for (let i = 0; i < N; i++) {
  const x = createHash("sha256").update(`stats-${i}`).digest("hex");
  const name = nicknameParts("Q" + (i % 2 ? (x + x).slice(0, 78) : x.slice(0, 40))).name;
  pairs += seen.get(name) ?? 0;
  seen.set(name, (seen.get(name) ?? 0) + 1);
  lengths.push(name.length);
}
lengths.sort((a, b) => a - b);
const pct = (p) => lengths[Math.floor((lengths.length - 1) * p)];
console.log(`\nsimulated ${fmt(N)} addresses: ${pairs} pair(s) share a name (expected ${fmt((N * (N - 1)) / 2 / NAMESPACE)})`);
console.log(`name length: min ${lengths[0]}, median ${pct(0.5)}, p95 ${pct(0.95)}, max ${lengths.at(-1)}`);
