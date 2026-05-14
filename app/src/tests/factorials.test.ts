import { describe, expect, it } from 'vitest'
import { LEHMER_FACTORIALS } from '../codec/factorials'

function factorial(n: number): bigint {
  if (n <= 1) return 1n
  let p = 1n
  for (let i = 2n; i <= BigInt(n); i++) p *= i
  return p
}

describe('LEHMER_FACTORIALS', () => {
  it('has 16 entries for Lehmer steps 0..15', () => {
    expect(LEHMER_FACTORIALS).toHaveLength(16)
  })

  it('matches (15 - i)! for each index i', () => {
    for (let i = 0; i < 16; i++) {
      expect(LEHMER_FACTORIALS[i]).toBe(factorial(15 - i))
    }
  })

  it('starts at 15! and ends at 0! / 1!', () => {
    expect(LEHMER_FACTORIALS[0]).toBe(factorial(15))
    expect(LEHMER_FACTORIALS[15]).toBe(1n)
  })
})
