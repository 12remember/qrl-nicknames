# qrl-nicknames (Python)

Readable, deterministic names for QRL addresses. Same address, same name,
in every project. Implements [spec v3](https://github.com/12remember/qrl-nicknames/blob/main/SPEC.md).

> **Not on PyPI yet.** `pip install qrl-nicknames` does not work until the
> package is published. Install it from GitHub instead:
>
> ```bash
> pip install "git+https://github.com/12remember/qrl-nicknames.git@main#subdirectory=python"
> ```
>
> See [Installation](https://github.com/12remember/qrl-nicknames#installation)
> for other options.

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
