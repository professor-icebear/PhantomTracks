/** (15-i)! for Lehmer steps i = 0..15 — all BigInt to avoid overflow past 2^53. */
export const LEHMER_FACTORIALS: readonly bigint[] = [
  1307674368000n, // 15!
  87178291200n, // 14!
  6227020800n, // 13!
  479001600n, // 12!
  39916800n, // 11!
  3628800n, // 10!
  362880n, // 9!
  40320n, // 8!
  5040n, // 7!
  720n, // 6!
  120n, // 5!
  24n, // 4!
  6n, // 3!
  2n, // 2!
  1n, // 1!
  1n, // 0!
] as const
