# qrl-nicknames (JavaScript)

Readable, deterministic names for QRL addresses. Same address, same name,
in every project. Implements [spec v3](https://github.com/12remember/qrl-nicknames/blob/main/SPEC.md).

> **Not on npm yet.** `npm install qrl-nicknames` does not work until the
> package is published. Copy `js/src/`, install from a clone
> (`npm install ./qrl-nicknames/js`) or from a tarball made with `npm pack`.
> See [Installation](https://github.com/12remember/qrl-nicknames#installation).

```js
import { nickname } from "qrl-nicknames";

nickname("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d"); // "Sparkly Kappa tk856"
```

- Zero dependencies, ES module, TypeScript types included.
- Synchronous: safe to call while rendering (React, Vue, templates).
- Runs in browsers and in Node ≥ 18.

## API

| Function | Returns |
|---|---|
| `nickname(address)` | `"Sparkly Kappa tk856"` |
| `nicknameSlug(address)` | `"sparkly-kappa-tk856"` |
| `nicknameParts(address)` | `{ adjective, creature, tag, words, name, slug }` |
| `SPEC_VERSION` | `3` |

`address` is any ASCII string. It is case-insensitive and is **not** trimmed.
For QRL, pass the `Q`-prefixed form (`Q` + 40 hex for QRL 2.0); convert a
`0x…` QRL 2.0 address to `Q…` first, or it gets a different name.
Non-ASCII input throws a `RangeError`; a non-string throws a `TypeError`.

Each call hashes the address (about a microsecond). If you render the same
address thousands of times, memoise the result in your own code.

Show the address next to the name, and never drop the tag. See the
[display rules](https://github.com/12remember/qrl-nicknames#displaying-names).

MIT licensed. The word lists are CC0.
