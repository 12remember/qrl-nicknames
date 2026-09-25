# Contributing

Thanks for helping. The most useful contributions are **ports to new
languages**, **more test vectors** and **clearer documentation**.

## Ground rule: the spec is frozen

Spec v3 never changes in a way that alters a name (see
[VERSIONING.md](VERSIONING.md)). Pull requests that change a word, an alphabet
or any step of the algorithm cannot be merged into v3, however good the
reason. If you believe v3 has a real problem, open an issue: it may become a
proposal for v4.

## Adding a port to a new language

1. Create a directory named after the language (`go/`, `rust/`, …).
2. Implement [SPEC.md](SPEC.md). Read the word lists from
   `spec/v3/wordlists.json`, or generate a source file from it the way
   `tools/build.mjs` does for JavaScript and Python. Never type them by hand.
3. Add a test that loads `spec/v3/test-vectors.json` and checks:
   - every `vectors[i].name` (and `slug`, if you expose one);
   - every `invalid[i].input` raises an error.
4. Keep it dependency-free where the language allows: a platform SHA-256 is
   fine, a package manager dependency for one hash is not.
5. Add the test command to `Makefile` and `.github/workflows/ci.yml`.
6. Add a short `README.md` in the directory with install and usage.

Common mistakes that the vectors will catch:

- lowercasing with a Unicode-aware function before checking for ASCII;
- trimming whitespace;
- using 32-bit integer operations on the 48-bit value;
- reading the wrong digest bytes (it is bytes 26 to 31, the last six);
- forgetting the high word bits (42 and 43): each word index is
  `low + 512 × high`, and each list has 1,024 entries;
- rendering the tag most-significant character first (it is least-significant
  first);
- SHA-256 padding off by a block at message lengths 55 and 119.

## Changing generated files

`js/src/wordlists.js`, `python/src/qrl_nicknames/_wordlists.py`,
`spec/v3/test-vectors.json` and `spec/v3/SHA256SUMS` are generated. Edit the
source (`spec/v3/*.json` or `tools/build.mjs`), then run `make build`.

## Before you open a pull request

```bash
make check
```

This verifies the generated files, the checksums, both test suites and the
content screen. CI runs the same command.

## Reporting a bad name

If a rendered name reads as offensive, open an issue with the address and the
name. The word lists cannot change within v3, but accepted findings are
recorded in `spec/v3/known-issues.json` and fixed in the next major version.
