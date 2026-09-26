# Changelog

This file records both spec versions and package releases. See
[VERSIONING.md](VERSIONING.md) for how the two relate.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [3.0.0] — Unreleased

First release as a standalone project. Implements **spec v3**.

### Spec v3

- The name is now a pure function of the address. The v2 collision registry
  and its exception list are gone: no API call is needed to get the exact name.
- The tag grows from two characters to five: the same two characters as v2,
  followed by three digits from `2–9`.
- Both word lists grow from 512 to 1,024 words. The v2 words stay at their
  index; the 512 new words per list are added after them and are selected by
  two previously unused bits (42 and 43). New creatures include more mammals,
  birds, fish and insects, dog and horse breeds, dinosaurs and creatures from
  myth and folklore. The word pairs grow from 262,144 to 1,048,576.
- The namespace grows from 2²⁸ to 2³⁹ (550 billion names). Among a million
  addresses, about 0.9 pairs share a name, down from about 1,860.
- Six v2 words are replaced in place: `Kookaburra` (an adjective) and `Tawny`
  (a creature) swap lists, `Brand` becomes `Retro`, `Coralline` (an alga)
  becomes `Sponge`, and `Shady` and `Rugged` (in crypto: rug-pulled) become
  `Dewy` and `Rocky`, because a wallet name must not read as an accusation.
- When both new bits are 0 (about a quarter of all addresses), the v3 name is
  the v2 name plus three digits, e.g. `Honking Bobcat sm` → `Honking Bobcat sm956`.
  Other addresses keep their tag head and get at least one new word.
- Input rules are explicit: ASCII only (anything else is rejected), `A–Z`
  lowercased, no trimming.
- The canonical input for QRL is documented: `Q` + hex. A QRL 2.0 address shown
  as `0x…` must be converted to `Q…` first.
- A defined slug form: lowercase, hyphen-separated.

### Packages

- JavaScript package `qrl-nicknames` with a synchronous, dependency-free
  SHA-256, for browsers and Node ≥ 18.
- Python package `qrl-nicknames`, standard library only, Python ≥ 3.9.
- Every release is published on GitHub with a ready-made npm tarball and
  Python wheel, so each package installs with one command. A release workflow
  builds them from the tag, installs them in every documented way on the oldest
  and newest supported Node and Python, and only then publishes to npm and PyPI.
- CI builds and installs both packages on every push.
- Conformance suite of 174 vectors, including SHA-256 padding boundaries, plus
  3 inputs that must be rejected.
- Content screen over every word, every one of the 524,288 tags and 300,000
  rendered names. Its finance-risk list now also blocks words such as
  `rugged`, `shady`, `fraud` and `stolen`.

### Fixed

- The synchronous SHA-256 inherited from Quantascan's v2 frontend returned a
  wrong digest when the message length was 55, 119, 183, … bytes (an extra
  padding block). Real QRL addresses never produce those lengths, so no
  published name was affected. The new boundary vectors guard every port
  against the same bug.

## Spec v2 (2026-08, Quantascan)

Two 512-word lists plus a two-character tag, with collisions resolved by
on-chain order through a central registry. Published at
`quantascan.io/nicknames/v2/`. Superseded by v3.

## Spec v1 (2026-07, Quantascan)

Four word lists and eight grammar patterns (`Otter of the Basalt Spire`).
Published at `quantascan.io/nicknames/v1/`. Superseded by v2.
