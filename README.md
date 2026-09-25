# qrl-nicknames

Readable names for QRL addresses: the same address gets the same name in every
wallet, explorer and tool that uses them.

```
Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d   →   Sparkly Kappa tk856
```

Long addresses are hard to recognise. You can see that `Qc0e6…38d` and
`Qc0e5…38d` differ only by reading carefully. You cannot miss that
*Sparkly Kappa* and *Galloping Manul* differ. This repository is an open,
frozen recipe for naming every QRL and QRL 2.0 address, so that everyone in the
ecosystem shows the same name for the same address. It started at
[Quantascan](https://quantascan.io), which uses it for every address it shows.

- **Deterministic.** The name is a pure function of the address. No API, no
  account, no database, no network.
- **Identical everywhere.** A frozen spec plus a shared set of conformance
  vectors means every implementation, in every language, agrees.
- **Stable forever.** Spec v3 never changes. A future change gets a new
  version, and v3 stays available.
- **Practically unique.** 550 billion possible names and a million word pairs.
  Among a million addresses, about 1 pair shares a name
  ([why that is acceptable](#uniqueness)).
- **Safe to show.** The word lists and every possible tag are screened for
  offensive content.

## Installation

The packages are **not on npm or PyPI yet**, so `npm install qrl-nicknames` and
`pip install qrl-nicknames` do not work. Use one of the options below. Every
option gives you exactly the same code and names.

Pin a commit hash (or, once it exists, the tag `v3.0.0`) instead of `main`, so
that an update never reaches your project unannounced.

### JavaScript / TypeScript

Zero dependencies, synchronous, works in browsers and in Node ≥ 18. Pick one:

**A. Copy the source into your project (simplest, no install step).** The package
is four self-contained files. Put them in a folder of your own, for example
`src/vendor/qrl-nicknames/`:

```bash
REF=main   # or a commit hash
mkdir -p src/vendor/qrl-nicknames && cd src/vendor/qrl-nicknames
for f in index.js index.d.ts sha256.js wordlists.js; do
  curl -fsSLO "https://raw.githubusercontent.com/12remember/qrl-nicknames/$REF/js/src/$f"
done
```

```js
import { nickname } from "./vendor/qrl-nicknames/index.js";
```

**B. Install from a local clone.** npm records it as a `file:` dependency, so the
clone must also exist wherever you build (CI, Docker):

```bash
git clone https://github.com/12remember/qrl-nicknames.git
npm install ./qrl-nicknames/js
```

**C. Install from a tarball.** Build the package once and keep the `.tgz` in
your project (or host it anywhere):

```bash
git clone https://github.com/12remember/qrl-nicknames.git
cd qrl-nicknames/js && npm pack          # writes qrl-nicknames-3.0.0.tgz
cd /path/to/your-project
npm install /path/to/qrl-nicknames-3.0.0.tgz
```

With B and C you import it as `"qrl-nicknames"`, just as you would from npm.

**D. In a browser, without a build step,** load the module from jsDelivr, which
serves files straight from this repository:

```html
<script type="module">
  import { nickname } from "https://cdn.jsdelivr.net/gh/12remember/qrl-nicknames@main/js/src/index.js";
  console.log(nickname("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d"));
</script>
```

`npm install github:12remember/qrl-nicknames` does **not** work: the package
lives in `js/`, and npm cannot install from a subdirectory of a git repository.

### Python

Standard library only, Python ≥ 3.9. Pick one:

**A. Install from GitHub with pip.** pip can install from a subdirectory:

```bash
pip install "git+https://github.com/12remember/qrl-nicknames.git@main#subdirectory=python"
```

In `requirements.txt`:

```
qrl-nicknames @ git+https://github.com/12remember/qrl-nicknames.git@main#subdirectory=python
```

**B. Install from a local clone:** `pip install ./qrl-nicknames/python`.

**C. Copy the source into your project.** Copy the folder
[`python/src/qrl_nicknames/`](python/src/qrl_nicknames) (`__init__.py`,
`_wordlists.py`, `py.typed`) into your own package and import it from there.

### Any other language

The algorithm is about 30 lines: SHA-256, a few integer divisions and two word
lists. Read [SPEC.md](SPEC.md), use [`spec/v3/wordlists.json`](spec/v3/wordlists.json),
and check your port against [`spec/v3/test-vectors.json`](spec/v3/test-vectors.json).
If it reproduces every vector, it produces the same names as everyone else.
See [CONTRIBUTING.md](CONTRIBUTING.md) to add it to this repository.

### Checking a copied version

If you copy files instead of installing, check them now and then against this
repository. Run the conformance vectors from
[`spec/v3/test-vectors.json`](spec/v3/test-vectors.json) in your own test suite
(see [`js/test/vectors.test.js`](js/test/vectors.test.js) or
[`python/tests/test_vectors.py`](python/tests/test_vectors.py) for a
10-line example). If your copy reproduces every vector, it is correct.

## Usage

### JavaScript / TypeScript

```js
import { nickname, nicknameParts, nicknameSlug } from "qrl-nicknames";

nickname("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d");      // "Sparkly Kappa tk856"
nicknameSlug("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d");  // "sparkly-kappa-tk856"
nicknameParts("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d");
// { adjective: "Sparkly", creature: "Kappa", tag: "tk856",
//   words: "Sparkly Kappa", name: "Sparkly Kappa tk856", slug: "sparkly-kappa-tk856" }
```

TypeScript types are included (`index.d.ts`). Details: [js/README.md](js/README.md).

### Python

```python
from qrl_nicknames import nickname, nickname_parts, nickname_slug

nickname("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d")        # 'Sparkly Kappa tk856'
nickname_slug("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d")   # 'sparkly-kappa-tk856'
nickname_parts("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d").words  # 'Sparkly Kappa'
```

Details: [python/README.md](python/README.md).

## How it works

```
message  = "qs-nickname-v2|" + lowercase(address) + "|0"
n        = last 6 bytes of SHA-256(message), as a 48-bit number
name     = adjectives[10 bits] + " " + creatures[10 bits] + " " + tag[19 bits]
```

Each word list has 1,024 words: adjectives (colours, textures, moods, ways of
moving) and creatures (animals from every corner of the tree of life, plus
dinosaurs and creatures from myth and folklore).

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
3. **Never drop the tag.** The two words alone have only 1,048,576
   combinations: among a million addresses, about 60% share their two words
   with another address. With the tag, a name almost always belongs to one
   address. You can render the tag smaller or muted.
4. **Separate the parts** with spaces, or with hyphens in URLs and IDs
   (`sparkly-kappa-tk856`). Never join them without a separator.
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

A 39-bit name cannot encode a 160-bit or larger address, so any stateless scheme
has collisions. This project chooses *identical everywhere*: collisions are
never resolved, because resolving them would make the name depend on which
addresses a project happens to know. Instead, the namespace is made large
enough that collisions are rare:

| Addresses | Expected pairs sharing a name |
|---|---|
| 200,000 | 0.04 |
| 1,000,000 | 0.9 |
| 10,000,000 | 91 |

When a collision happens, both addresses keep their own name, and the address
shown beside it tells them apart. `node tools/stats.mjs` reproduces these
numbers and simulates them.

## Repository layout

```
SPEC.md                 the normative specification
spec/v3/
  wordlists.json        the two frozen word lists (1,024 + 1,024)
  params.json           the constants from SPEC.md, machine-readable
  test-vectors.json     conformance suite: 174 inputs + 3 inputs that must be rejected
  v2-compat.json        Quantascan v2 names that are still prefixes of their v3 name
  known-issues.json     accepted content-screening findings (none)
  SHA256SUMS            checksums of the files above
js/                     JavaScript package (not yet on npm, see Installation)
python/                 Python package (not yet on PyPI, see Installation)
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
exactly. v3 removes the registry, extends the tag and doubles both word lists
to 1,024 words, so the name depends on the address alone and far fewer
addresses share their words. The v2 words are the first half of each v3 list:
for about a quarter of all addresses the v3 name is still the v2 name plus three
digits. See [CHANGELOG.md](CHANGELOG.md).
