# Security

## Names are not an authentication mechanism

A nickname helps a person recognise an address they have seen before. It
proves nothing about who controls that address.

Anyone can generate new addresses cheaply and pick one whose name resembles
the name of an address you trust:

| What the attacker matches | Addresses to try (on average) |
|---|---|
| the two words (`Sparkly Kappa`) | ~1 million |
| the words and the first two tag characters (`Sparkly Kappa tk`) | ~1.1 billion |
| the full name (`Sparkly Kappa tk856`) | ~550 billion |

The first row still takes only seconds on a laptop. This is the same "address
poisoning" risk that affects shortened addresses (`Qc0e6…38d`).

**For anything involving funds, compare the full address, not the name.**
Applications that let users send funds SHOULD show the full address at the
point of confirmation, and SHOULD NOT present a nickname as a verified
identity.

This is why the spec requires the tag to be displayed, and why the README asks
you to show the address next to the name.

## Reporting a vulnerability

If you find an issue in the code of this repository (for example, a package
that can be made to crash or hang on crafted input), please report it
privately through GitHub's **Report a vulnerability** button on the Security
tab, rather than in a public issue. We aim to respond within a week.

The packages have no runtime dependencies, perform no I/O and hold no state,
so their attack surface is the input string only.
