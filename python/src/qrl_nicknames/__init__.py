"""qrl-nicknames: readable, deterministic names for QRL addresses.

Spec v3: https://github.com/12remember/qrl-nicknames/blob/main/SPEC.md

The name is a pure function of the address. No network, no state, no registry:
every implementation of the spec returns the same name for the same address,
forever.

    >>> nickname("Qc0e6dd0e844e0048dcb0bd3fdcc44a970beca38d")
    'Sparkly Kappa tk856'
"""

import hashlib
from typing import NamedTuple

from ._wordlists import ADJECTIVES, CREATURES

__all__ = ["SPEC_VERSION", "NicknameParts", "nickname", "nickname_parts", "nickname_slug"]
__version__ = "3.0.0"

#: The spec version this package implements. Names never change within it.
SPEC_VERSION = 3

# Frozen constants. The "v2" and "|0" keep v3 names compatible with the names
# Quantascan published under spec v2; they are not the spec version.
_PREFIX = "qs-nickname-v2|"
_SUFFIX = "|0"
_HEAD = "abcdefghijkmnpqrstuvwxyz23456789"
_TAIL = "23456789"


class NicknameParts(NamedTuple):
    adjective: str
    creature: str
    tag: str
    words: str
    name: str
    slug: str


def _message(address: str) -> bytes:
    if not isinstance(address, str):
        raise TypeError("qrl-nicknames: address must be a string")
    if not address.isascii():
        raise ValueError("qrl-nicknames: address must be ASCII")
    # str.lower() is only safe because the input is ASCII by now: on non-ASCII
    # text it differs between languages (Python and JavaScript disagree on 'İ').
    return (_PREFIX + address.lower() + _SUFFIX).encode("ascii")


def _render(value: int, alphabet: str, chars: int) -> str:
    out = ""
    for _ in range(chars):
        out += alphabet[value % len(alphabet)]
        value //= len(alphabet)
    return out


def nickname_parts(address: str) -> NicknameParts:
    """Every part of the name for an address.

    ``address`` may be any ASCII string. It is case-insensitive and is NOT
    trimmed. Raises ``TypeError`` for a non-string and ``ValueError`` for
    non-ASCII input.
    """
    n = int.from_bytes(hashlib.sha256(_message(address)).digest()[26:32], "big")
    # Each word index is 10 bits: 9 low bits next to each other, plus one high
    # bit from the top of n. High bit 0 selects the first 512 words, which keeps
    # those names identical to Quantascan's v2 names.
    adjective = ADJECTIVES[((n >> 5) & 0x1FF) | (((n >> 42) & 1) << 9)]
    creature = CREATURES[((n >> 14) & 0x1FF) | (((n >> 43) & 1) << 9)]
    tag = _render((n >> 23) & 0x3FF, _HEAD, 2) + _render((n >> 33) & 0x1FF, _TAIL, 3)
    words = f"{adjective} {creature}"
    return NicknameParts(
        adjective=adjective,
        creature=creature,
        tag=tag,
        words=words,
        name=f"{words} {tag}",
        slug=f"{adjective}-{creature}-{tag}".lower(),
    )


def nickname(address: str) -> str:
    """The name for an address, e.g. ``'Sparkly Kappa tk856'``."""
    return nickname_parts(address).name


def nickname_slug(address: str) -> str:
    """The URL-safe form, e.g. ``'sparkly-kappa-tk856'``.

    Always hyphenated: joining the words without a separator can form
    unintended words across the boundary.
    """
    return nickname_parts(address).slug
