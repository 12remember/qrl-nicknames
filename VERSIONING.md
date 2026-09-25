# Versioning

Two things are versioned in this repository: the **specification** (what name an
address gets) and the **packages** (code that computes it). They follow
different rules on purpose.

## The specification: integer, frozen

The spec version is a single integer: `3`. Once a version is published, **no
change that alters any output is ever made to it**. That includes:

- adding, removing, reordering or editing a word;
- changing an alphabet, a field width or the field order;
- changing the hash message, the digest bytes used or the input normalisation;
- changing the template or the slug form.

Any such change is a new spec version, published under a new directory
(`spec/v4/`) with its own `SPEC.md` section and vectors. Older versions stay in
the repository and keep working. A project that pinned v3 keeps producing v3
names indefinitely.

Changes that do NOT alter output are allowed within a version and are recorded
in the changelog: clearer wording in `SPEC.md`, extra test vectors, extra notes.
Adding a vector never changes an existing one: `tools/build.mjs --check` fails
if a regenerated vector differs from the committed file.

**How to pin a spec version:** check `SPEC_VERSION` in the package, or verify
`spec/v3/SHA256SUMS` against the files you copied.

## The packages: semantic versioning, major = spec

Package versions are `MAJOR.MINOR.PATCH`, where:

| Part | Changes when | Can names change? |
|---|---|---|
| `MAJOR` | the package implements a new spec version | yes: MAJOR **equals** the spec version |
| `MINOR` | new functions or options, backwards compatible | no |
| `PATCH` | bug fixes, docs, packaging | no* |

\* A patch release may fix an implementation that disagreed with the spec
vectors. The spec is the source of truth; the fixed package then produces the
names the spec always defined.

`qrl-nicknames@3.x.y` always produces spec v3 names. Depend on `^3` (npm)
or `~=3.0` (pip) and you can never receive a release that renames an address.

The JavaScript and Python packages share their version number and are released
together.

## Releasing

1. Update `CHANGELOG.md` under a new version heading.
2. Set the version in `js/package.json`, `python/pyproject.toml` and
   `python/src/qrl_nicknames/__init__.py` (`__version__`).
3. Run `make check`. It must pass.
4. Commit, then tag: `git tag -a v3.0.0 -m "v3.0.0"` and push the tag.
5. Publish: `cd js && npm publish`, then `cd python && python -m build && twine upload dist/*`.

Tags use the package version (`v3.0.0`), not the spec version.
