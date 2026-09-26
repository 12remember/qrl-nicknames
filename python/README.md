# qrl-nicknames (Python)

Readable, deterministic names for QRL addresses. Same address, same name,
in every project. Implements [spec v3](https://github.com/12remember/qrl-nicknames/blob/main/SPEC.md).

## Install

```bash
pip install https://github.com/12remember/qrl-nicknames/releases/download/v3.0.0/qrl_nicknames-3.0.0-py3-none-any.whl
```

The package is not on PyPI yet, so `pip install qrl-nicknames` does not work
yet. For `requirements.txt`, installing from git and copying the files, see
[Installation](https://github.com/12remember/qrl-nicknames#installation).

## Use

```python
from qrl_nicknames import nickname

nickname("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d")  # 'Sparkly Kappa tk856'
```

- Standard library only, Python ≥ 3.9, fully typed.

## API

| Function | Returns |
|---|---|
| `nickname(address)` | `'Sparkly Kappa tk856'` |
| `nickname_slug(address)` | `'sparkly-kappa-tk856'` |
| `nickname_parts(address)` | `NicknameParts(adjective, creature, tag, words, name, slug)` |
| `SPEC_VERSION` | `3` |

`address` is any ASCII string. It is case-insensitive and is **not** stripped.
For QRL, pass the `Q`-prefixed form (`Q` + 40 hex for QRL 2.0); convert a
`0x…` QRL 2.0 address to `Q…` first, or it gets a different name.
Non-ASCII input raises `ValueError`; a non-string raises `TypeError`.

Show the address next to the name, and never drop the tag. See the
[display rules](https://github.com/12remember/qrl-nicknames#displaying-names).

MIT licensed. The word lists are CC0.
