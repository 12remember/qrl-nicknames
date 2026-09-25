/** The spec version this package implements. Names never change within it. */
export declare const SPEC_VERSION: 3;

export interface NicknameParts {
  /** First word, e.g. "Sparkly". */
  adjective: string;
  /** Second word, e.g. "Kappa". */
  creature: string;
  /** Five characters: two from `abcdefghijkmnpqrstuvwxyz23456789`, then three digits from `2-9`. */
  tag: string;
  /** The two words, e.g. "Sparkly Kappa". Not an identifier on its own. */
  words: string;
  /** The full name, e.g. "Sparkly Kappa tk856". */
  name: string;
  /** Lowercase, hyphenated, e.g. "sparkly-kappa-tk856". */
  slug: string;
}

/**
 * Every part of the name for an address.
 * @param address any ASCII string; case-insensitive, not trimmed
 * @throws {TypeError} when `address` is not a string
 * @throws {RangeError} when `address` contains a non-ASCII character
 */
export declare function nicknameParts(address: string): NicknameParts;

/**
 * The name for an address, e.g. "Sparkly Kappa tk856".
 * @param address any ASCII string; case-insensitive, not trimmed
 */
export declare function nickname(address: string): string;

/**
 * The URL-safe form, e.g. "sparkly-kappa-tk856".
 * @param address any ASCII string; case-insensitive, not trimmed
 */
export declare function nicknameSlug(address: string): string;
