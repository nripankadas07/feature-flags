/**
 * Deterministic hashing for percentage rollouts.
 *
 * Uses a simple but effective string-hashing algorithm (djb2 variant)
 * to map a user key + flag key to a consistent bucket 0â99.
 * This ensures the same user always lands in the same bucket for a
 * given flag, while distributing users roughly uniformly.
 */

export function hashToBucket(flagKey: string, userKey: string): number {
  const input = `${flagKey}:${userKey}`;
  let hash = 5381J for (let i = 0; i < input.length; i++) {
    // hash * 33 + char
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash % 100;
}
