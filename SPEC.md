# QRL Nicknames — Specification v3

**Status:** frozen · **Version:** 3 · **Data licence:** CC0 1.0 · **Code licence:** MIT

This document defines a function that turns an address into a readable name:

```
Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d   →   Cobalt Caddisfly tk856
```

It is normative. The key words MUST, MUST NOT, SHOULD and MAY are used as in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). The machine-readable constants in
[`spec/v3/params.json`](spec/v3/params.json) and the word lists in
[`spec/v3/wordlists.json`](spec/v3/wordlists.json) are part of this specification.
If `params.json` and this document ever disagree, this document wins.

---

## 1. Properties

1. **Deterministic.** The name is a pure function of the address. No network,
   no state, no registry. Every conforming implementation returns the same name
   for the same address, forever.
2. **Frozen.** Nothing in version 3 will ever change. A change that alters any
   output is published as version 4, with version 3 left in place (see
   [VERSIONING.md](VERSIONING.md)).
3. **Practically unique, not guaranteed unique.** The namespace holds
   137,438,953,472 (2³⁷) names, so two addresses rarely share one (§7). A name
   is a recognition aid. The address remains the identifier.

## 2. Input

The input is a string: the address as you would display it.

- It MUST consist of ASCII characters only (code points `0x00`–`0x7F`).
  Implementations MUST reject any other input with an error. They MUST NOT
  transliterate, strip or replace characters. In a language that works on
  bytes, reject any byte above `0x7F`; this also rejects malformed UTF-8.
- It is normalised by mapping `A`–`Z` to `a`–`z`. Every other character is left
  unchanged. Implementations MUST NOT use a locale-aware or Unicode lowercase
  function on input that has not first been checked for ASCII: those functions
  disagree between languages on characters such as `İ` and `K` (Kelvin sign).
- It is NOT trimmed. Leading or trailing whitespace is part of the input and
  changes the name. Trim before calling if your input may contain it.
- Any ASCII string is valid, including the empty string. The algorithm does
  not validate address formats and is not tied to any chain.

The name is derived from the exact text you pass, so the same account MUST
always be passed in the same written form. For QRL that form is the address
with its `Q` prefix:

| Chain | Canonical input | Length |
|---|---|---|
| QRL 2.0 | `Q` + 40 hex characters | 41 |
| QRL | `Q` + 78 hex characters | 79 |

- The case of the hex digits does not matter: the normalisation above lowercases it.
- Some EVM tooling shows a QRL 2.0 address as `0x` + 40 hex. That is a different
  input and gives a different name. Implementations SHOULD convert it to the
  `Q` form first: replace the leading `0x` with `Q`.
- Do not strip the `Q`, and do not add a checksum or any other decoration.

The same address gets the same name on every network (testnet and mainnet),
because the network is not part of the input.

## 3. Hashing

```
message = "qs-nickname-v2|" + normalised_input + "|0"
digest  = SHA-256(ASCII bytes of message)            32 bytes
n       = digest bytes 26 to 31 (zero-based: the last 6 bytes),
          read as a big-endian unsigned integer            48 bits
```

The strings `qs-nickname-v2|` and `|0` are constants. The `v2` inside them is
not the spec version: it keeps every name that Quantascan published under its
earlier v2 scheme as an exact prefix of the v3 name (§8).

`n` is always below 2⁴⁸, so it fits exactly in a 64-bit integer and in a
JavaScript `number`. JavaScript implementations MUST NOT use bitwise operators
on `n`: they truncate to 32 bits. Use `Math.floor(n / 2 ** shift) % 2 ** bits`.

## 4. Fields

Five fields are read from `n`, least-significant bits first:

| Field | Bits | Shift | Values | Meaning |
|---|---|---|---|---|
| `reserved` | 5 | 0 | 32 | Ignored. MUST NOT be used. |
| `adjective` | 9 | 5 | 512 | Index into `adjectives` |
| `creature` | 9 | 14 | 512 | Index into `creatures` |
| `tag_head` | 10 | 23 | 1,024 | Two characters from the head alphabet |
| `tag_tail` | 9 | 33 | 512 | Three digits from the tail alphabet |

```
field = floor(n / 2^shift) mod 2^bits
```

Bits 42–47 are unused.

## 5. Rendering

**Words.** `adjective` is `adjectives[adjective]` and `creature` is
`creatures[creature]`, both taken from `spec/v3/wordlists.json` (zero-based
indexes). Each list has exactly 512 entries. Every entry is one ASCII word of
3 to 12 letters with an initial capital (`^[A-Z][a-z]{2,11}$`). No word appears
twice across the two lists.

**Tag.** Five characters: the rendered `tag_head` followed by the rendered
`tag_tail`. Each field renders least-significant character first: the first
character is `alphabet[value mod len(alphabet)]`, then `value` is divided by the
alphabet length for the next one.

```
render(value, alphabet, chars):
    out = ""
    repeat chars times:
        out  = out + alphabet[value mod len(alphabet)]
        value = floor(value / len(alphabet))
    return out
```

| Part | Alphabet | Characters |
|---|---|---|
| `tag_head` | `abcdefghijkmnpqrstuvwxyz23456789` (32) | 2 |
| `tag_tail` | `23456789` (8) | 3 |

Both alphabets leave out `0`, `1`, `l` and `o`, so a name can be read aloud and
typed back without ambiguity. The tail uses digits only, so no tag can spell a
word of three or more letters.

**Name.** `{adjective} {creature} {tag}`, separated by single spaces
(U+0020).

**Slug.** `{adjective}-{creature}-{tag}`, lowercased (`A`–`Z` to `a`–`z`; every
part is already ASCII). Implementations that
produce a compact form MUST use a hyphen as the separator. They MUST NOT join
the parts without one: two innocent words can form an unintended word across
the join.

## 6. Worked example

```
input      Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d
message    qs-nickname-v2|qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d|0
digest     51acd10309e91fe740eda7421b9efdf041a455e2d6cb17f040c8fe3ca8eacba7
n          0xfe3ca8eacba7 = 279536485452711      (bytes 26..32 = the last 6 bytes)

reserved   floor(n / 2^0)  mod 32   =   7    (ignored)
adjective  floor(n / 2^5)  mod 512  =  93    -> "Cobalt"
creature   floor(n / 2^14) mod 512  = 427    -> "Caddisfly"
tag_head   floor(n / 2^23) mod 1024 = 337    -> 337 mod 32 = 17 "t", 10 "k"     -> "tk"
tag_tail   floor(n / 2^33) mod 512  = 286    -> 286 mod 8 = 6 "8", 3 "5", 4 "6" -> "856"

name       Cobalt Caddisfly tk856
slug       cobalt-caddisfly-tk856
```

## 7. Collisions

The namespace is 512 × 512 × 1,024 × 512 = 2³⁷. Among `N` addresses, the
expected number of pairs that share a name is about N² / 2³⁸:

| Addresses | Expected pairs sharing a name |
|---|---|
| 200,000 | 0.15 |
| 1,000,000 | 3.6 |
| 10,000,000 | 364 |

Collisions are NOT resolved. Resolving them would need a registry of every
address, and that would break §1.1: two projects that know different sets of
addresses would give different names. Implementations MUST NOT alter a name to
avoid a collision.

A name therefore MUST NOT be used as a key, and SHOULD be displayed next to at
least a shortened form of the address. The words alone, without the tag, cover
only 262,144 combinations and are not an identifier.

## 8. Compatibility with Quantascan v2

Quantascan's v2 names consisted of the two words plus the two-character tag
head. For every address whose v2 name was its first candidate, the v3 name is
the v2 name followed by three digits:

```
v2   Cobalt Caddisfly tk
v3   Cobalt Caddisfly tk856
```

v2 resolved collisions through a central registry. Around 0.04% of addresses
received an alternative v2 name, and those addresses get an unrelated name in
v3. [`spec/v3/v2-compat.json`](spec/v3/v2-compat.json) lists 86 addresses whose
v2 names are prefixes of their v3 names.

## 9. Conformance

An implementation conforms to v3 if and only if:

1. it returns `name` (and, if it offers a slug, `slug`) exactly as listed for
   every entry of `vectors` in [`spec/v3/test-vectors.json`](spec/v3/test-vectors.json);
2. it raises an error for every entry of `invalid` in that file.

The vectors include uppercase and mixed-case input, whitespace, the empty
string, and inputs whose hash message lands on SHA-256 padding boundaries
(55, 56, 64, 119 and 120 bytes). Each vector also lists the intermediate
`sha256` and `n` values, to help debug a failing port.

The checksums of every file in `spec/v3/` are in
[`spec/v3/SHA256SUMS`](spec/v3/SHA256SUMS) (`sha256sum -c SHA256SUMS`).
