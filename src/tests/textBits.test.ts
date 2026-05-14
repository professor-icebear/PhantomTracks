import { describe, expect, it } from 'vitest'
import {
  MAX_UTF8_BYTES,
  bigIntTo44BitString,
  chunkBitsToBigInt,
  mergeChunkBits,
  paddedBitStringToText,
  splitInto44BitChunks,
  textToPaddedBitString,
  utf8ByteLength,
  validateMessage,
} from '../codec/textBits'

describe('validateMessage', () => {
  it('rejects empty / whitespace-only', () => {
    expect(validateMessage('')).toBe('Enter a message to encode.')
    expect(validateMessage('   \t')).toBe('Enter a message to encode.')
  })

  it('accepts non-empty trimmed text within byte limit', () => {
    expect(validateMessage('hello')).toBeNull()
  })

  it('rejects when UTF-8 length exceeds cap', () => {
    const tooLong = 'a'.repeat(MAX_UTF8_BYTES + 1)
    expect(validateMessage(tooLong)).toContain('500')
  })

  it('allows exactly MAX_UTF8_BYTES bytes', () => {
    const s = 'a'.repeat(MAX_UTF8_BYTES)
    expect(utf8ByteLength(s)).toBe(MAX_UTF8_BYTES)
    expect(validateMessage(s)).toBeNull()
  })
})

describe('text ↔ padded bits', () => {
  it('round-trips ASCII', () => {
    for (const text of ['A', 'Hello', 'line1\nline2', 'numbers 123']) {
      const bits = textToPaddedBitString(text)
      expect(bits.length % 44).toBe(0)
      expect(paddedBitStringToText(bits)).toBe(text)
    }
  })

  it('throws when code point count exceeds 16-bit header', () => {
    const huge = 'x'.repeat(0x1_0000)
    expect(() => textToPaddedBitString(huge)).toThrow('16-bit')
  })
})

describe('splitInto44BitChunks / mergeChunkBits / bigint', () => {
  it('splits and merges consistently', () => {
    const bits = textToPaddedBitString('Phantom')
    const chunks = splitInto44BitChunks(bits)
    expect(chunks.length).toBeGreaterThan(0)
    expect(mergeChunkBits(chunks)).toBe(bits)
  })

  it('throws if bit string length is not a multiple of 44', () => {
    expect(() => splitInto44BitChunks('101')).toThrow('multiple of 44')
  })

  it('chunkBitsToBigInt and bigIntTo44BitString round-trip for chunk values', () => {
    const bits = '1' + '0'.repeat(43)
    const v = chunkBitsToBigInt(bits)
    expect(bigIntTo44BitString(v)).toBe(bits)
  })

  it('bigIntTo44BitString pads small values', () => {
    expect(bigIntTo44BitString(3n)).toBe('0'.repeat(42) + '11')
  })

  it('bigIntTo44BitString rejects values needing more than 44 bits', () => {
    expect(() => bigIntTo44BitString(1n << 44n)).toThrow('exceeds 44 bits')
  })
})
