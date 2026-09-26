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

A spec version counts as published with the first package release that
implements it. Spec v3 is final from release `3.0.0`. Before that release its
word lists were extended from 512 to 1,024 words (see
[CHANGELOG.md](CHANGELOG.md)), so a copy taken from `main` before the release
can give different names.

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
   `python/src/qrl_nicknames/__init__.py` (`__version__`). Update the version
   in the install URLs in `README.md`, `js/README.md` and `python/README.md`.
3. Run `make check`. It must pass.
4. Commit and push, then tag and push the tag:
   `git tag -a v3.0.0 -m "v3.0.0" && git push origin v3.0.0`.

The tag starts [`.github/workflows/release.yml`](.github/workflows/release.yml),
which does the rest:

- checks that the tag matches all three package versions and runs `make check`;
- builds `qrl-nicknames-<version>.tgz` (npm) and the Python wheel and sdist;
- creates the GitHub release with those files attached;
- installs the package from the live release in every way the README documents
  (npm tarball, copied files, jsDelivr, pip wheel, pip from git), on Node 18 and
  24 and on Python 3.9 and 3.13;
- publishes to npm and PyPI, but only after all of that passed and only if
  publishing is switched on (see below).

Tags use the package version (`v3.0.0`), not the spec version.

### Publishing to npm and PyPI (one-time setup)

Until this is set up, a release is published on GitHub only. Both registries
use *trusted publishing*: GitHub proves to the registry which workflow is
publishing, so no password or token is stored anywhere.

**PyPI**

1. Sign in at [pypi.org](https://pypi.org), open *Your projects* → *Publishing*
   and add a *pending publisher*: project `qrl-nicknames`, owner `12remember`,
   repository `qrl-nicknames`, workflow `release.yml`, environment `pypi`.
2. In the GitHub repository, go to *Settings* → *Environments* and create an
   environment named `pypi`.
3. Under *Settings* → *Secrets and variables* → *Actions* → *Variables*, add the
   **repository** variable `PYPI_PUBLISH` = `true`.

**npm** (trusted publishing is configured in the settings of a package that
already exists on npm, so the first version is published by hand):

1. Download `qrl-nicknames-<version>.tgz` from the GitHub release, then run
   `npm login` and `npm publish qrl-nicknames-<version>.tgz --access public`.
2. On [npmjs.com](https://www.npmjs.com/package/qrl-nicknames), open the
   package *Settings* → *Trusted publishing*, choose GitHub Actions and enter
   owner `12remember`, repository `qrl-nicknames`, workflow `release.yml`,
   environment `npm`.
3. Create a GitHub environment named `npm`, and add the **repository** variable
   `NPM_PUBLISH` = `true` (same place as `PYPI_PUBLISH`).

After that, pushing a tag publishes everywhere. Once the packages are on the
registries, replace the release URLs in the README with
`npm install qrl-nicknames` and `pip install qrl-nicknames`.
