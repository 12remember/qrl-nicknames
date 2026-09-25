# qrl-nicknames

Readable names for QRL addresses: the same address gets the same name in every
wallet, explorer and tool that uses them.

```
Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d   →   Cobalt Caddisfly tk856
```

Long addresses are hard to recognise. You can see that `Qc0e6…38d` and
`Qc0e5…38d` differ only by reading carefully. You cannot miss that
*Cobalt Caddisfly* and *Prowling Beluga* differ. This repository is an open,
frozen recipe for naming every QRL and QRL 2.0 address, so that everyone in the
ecosystem shows the same name for the same address. It started at
[Quantascan](https://quantascan.io), which uses it for every address it shows.

- **Deterministic.** The name is a pure function of the address. No API, no
  account, no database, no network.
- **Identical everywhere.** A frozen spec plus a shared set of conformance
  vectors means every implementation, in every language, agrees.
- **Stable forever.** Spec v3 never changes. A future change gets a new
  version, and v3 stays available.
- **Practically unique.** 137 billion possible names. Among a million
  addresses, about 4 pairs share a name ([why that is acceptable](#uniqueness)).
- **Safe to show.** The word lists and every possible tag are screened for
  offensive content.

## Quick start

### JavaScript / TypeScript

Zero dependencies, synchronous, works in browsers and in Node ≥ 18.

```bash
npm install qrl-nicknames
```

```js
import { nickname, nicknameParts, nicknameSlug } from "qrl-nicknames";

nickname("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d");      // "Cobalt Caddisfly tk856"
nicknameSlug("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d");  // "cobalt-caddisfly-tk856"
nicknameParts("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d");
// { adjective: "Cobalt", creature: "Caddisfly", tag: "tk856",
//   words: "Cobalt Caddisfly", name: "Cobalt Caddisfly tk856", slug: "cobalt-caddisfly-tk856" }
```

### Python

Standard library only, Python ≥ 3.9.

```bash
pip install qrl-nicknames
```

```python
from qrl_nicknames import nickname, nickname_parts, nickname_slug

nickname("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d")   # 'Cobalt Caddisfly tk856'
```

### Any other language

The algorithm is about 30 lines: SHA-256, a few integer divisions and two word
lists. Read [SPEC.md](SPEC.md), use [`spec/v3/wordlists.json`](spec/v3/wordlists.json),
and check your port against [`spec/v3/test-vectors.json`](spec/v3/test-vectors.json).
If it reproduces every vector, it produces the same names as everyone else.
See [CONTRIBUTING.md](CONTRIBUTING.md) to add it to this repository.

> Until the packages are on npm and PyPI, copy `js/src/` or
> `python/src/qrl_nicknames/` into your project. Both are self-contained.

## How it works

```
message  = "qs-nickname-v2|" + lowercase(address) + "|0"
n        = last 6 bytes of SHA-256(message), as a 48-bit number
name     = adjectives[9 bits] + " " + creatures[9 bits] + " " + tag[19 bits]
```

The tag is two characters from `abcdefghijkmnpqrstuvwxyz23456789` followed by
three digits from `2–9`. `0`, `1`, `l` and `o` are left out so a name survives
being read aloud. [SPEC.md](SPEC.md) has the exact definition and a worked
example with every intermediate value.

## Displaying names

These rules keep the names useful and safe in your interface:

1. **Pass the address in its canonical form.** For QRL that is `Q` + hex
   (`Q` + 40 for QRL 2.0, `Q` + 78 for QRL). If your tooling shows a QRL 2.0
   address as `0x…`, replace the `0x` with `Q` first: the name is computed
   from the exact text, so `0x…` and `Q…` give different names. Upper or
   lower case does not matter.
2. **Show the address next to the name**, at least in shortened form
   (`Qc0e6…38d`). The name helps people recognise an address; the address is
   what identifies it.
3. **Never drop the tag.** The two words alone have only 262,144 combinations:
   among a million addresses, each pair of words is shared by about four of
   them. With the tag, it is almost always one. You can render the tag smaller
   or muted.
4. **Separate the parts** with spaces, or with hyphens in URLs and IDs
   (`cobalt-caddisfly-tk856`). Never join them without a separator.
5. **Let real names win.** If an address has a known label (an exchange, a
   foundation wallet, a name the user gave it), show that label instead.
6. **Don't treat a name as proof.** Anyone can generate addresses until one
   gets a name that looks like a name you trust. See [SECURITY.md](SECURITY.md).
7. **Leave names out of SEO metadata.** They are a display aid, not content.

Attribution (a link to this repository) is appreciated but not required.

## Uniqueness

Two properties cannot both be guaranteed:

- **identical everywhere**, which needs the name to depend only on the address;
- **never shared**, which needs to know every other address, i.e. a central
  registry.

A 37-bit name cannot encode a 160-bit or larger address, so any stateless scheme
has collisions. This project chooses *identical everywhere*: collisions are
never resolved, because resolving them would make the name depend on which
addresses a project happens to know. Instead, the namespace is made large
enough that collisions are rare:

| Addresses | Expected pairs sharing a name |
|---|---|
| 200,000 | 0.15 |
| 1,000,000 | 3.6 |
| 10,000,000 | 364 |

When a collision happens, both addresses keep their own name, and the address
shown beside it tells them apart. `node tools/stats.mjs` reproduces these
numbers and simulates them.

## Repository layout

```
SPEC.md                 the normative specification
spec/v3/
  wordlists.json        the two frozen word lists (512 + 512)
  params.json           the constants from SPEC.md, machine-readable
  test-vectors.json     conformance suite: 174 inputs + 3 inputs that must be rejected
  v2-compat.json        proof that Quantascan v2 names are prefixes of v3 names
  known-issues.json     accepted content-screening findings (none)
  SHA256SUMS            checksums of the files above
js/                     JavaScript package (npm: qrl-nicknames)
python/                 Python package (PyPI: qrl-nicknames)
tools/
  build.mjs             reference implementation; generates vectors and word-list modules
  screen.mjs            content-safety screen over words, tags and 300,000 names
  stats.mjs             namespace, collision and name-length figures
```

## Development

Requires Node ≥ 18 and Python ≥ 3.9. No dependencies to install.

```bash
make check     # generated files up to date + checksums + both test suites + content screen
make build     # regenerate vectors, word-list modules and SHA256SUMS
```

Without `make`: `node tools/build.mjs --check`, `cd js && npm test`,
`cd python && python -m unittest discover -s tests`, `node tools/screen.mjs`.

## Versioning and licences

The **spec** is versioned by integer (v3) and never changes once published. The
**packages** use semantic versioning with the major version equal to the spec
version, so `3.x.y` always produces v3 names. See [VERSIONING.md](VERSIONING.md).

- Code (`js/`, `python/`, `tools/`): [MIT](LICENSE)
- Specification and data (`SPEC.md`, `spec/`): [CC0 1.0](LICENSE-DATA), public
  domain. Copy the word lists into anything, with or without credit.

## History

These names started at Quantascan in 2026. v1 used longer names built from four
lists. v2 used today's words with a two-character tag and resolved collisions
through a central registry, so other projects needed an API to match it
exactly. v3 removes the registry and extends the tag, so the name depends on the
address alone. For all but the ~0.04% of addresses that v2 had to rename after a
collision, the v2 name is a prefix of the v3 name. See
[CHANGELOG.md](CHANGELOG.md).
