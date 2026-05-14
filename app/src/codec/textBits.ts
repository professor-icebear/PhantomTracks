const MAX_UTF8_BYTES = 500

function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

function codePointCount(text: string): number {
  return [...text].length
}

export function validateMessage(text: string): string | null {
  const t = text.trim()
  if (t.length === 0) return 'Enter a message to encode.'
  if (utf8ByteLength(t) > MAX_UTF8_BYTES) {
    return `Message must be at most ${MAX_UTF8_BYTES} UTF-8 bytes.`
  }
  return null
}

/** Header = 16-bit unsigned code point count, then UTF-8 bytes; pad bitstring to a multiple of 44 bits. */
export function textToPaddedBitString(text: string): string {
  const n = codePointCount(text)
  if (n > 0xffff) throw new Error('Message too long for 16-bit length header.')
  const header = n.toString(2).padStart(16, '0')
  const bytes = new TextEncoder().encode(text)
  let bits = header
  for (const b of bytes) {
    bits += b.toString(2).padStart(8, '0')
  }
  const pad = (44 - (bits.length % 44)) % 44
  bits += '0'.repeat(pad)
  return bits
}

export function splitInto44BitChunks(paddedBits: string): string[] {
  if (paddedBits.length % 44 !== 0) {
    throw new Error('Bit string length must be a multiple of 44.')
  }
  const chunks: string[] = []
  for (let i = 0; i < paddedBits.length; i += 44) {
    chunks.push(paddedBits.slice(i, i + 44))
  }
  return chunks
}

export function mergeChunkBits(chunkBitStrings: string[]): string {
  return chunkBitStrings.join('')
}

export function chunkBitsToBigInt(chunkBits: string): bigint {
  return BigInt(`0b${chunkBits}`)
}

export function bigIntTo44BitString(value: bigint): string {
  const raw = value.toString(2)
  if (raw.length > 44) throw new Error('Chunk value exceeds 44 bits.')
  return raw.padStart(44, '0')
}

/** Recover plaintext from the concatenated 44-bit chunk strings (includes padding). */
export function paddedBitStringToText(fullBits: string): string {
  if (fullBits.length < 16) throw new Error('Bit stream too short.')
  const charCount = parseInt(fullBits.slice(0, 16), 2)
  if (charCount < 0 || charCount > 0xffff) throw new Error('Invalid length header.')

  const payloadBits = fullBits.slice(16)
  const bytes: number[] = []
  for (let i = 0; i + 8 <= payloadBits.length; i += 8) {
    bytes.push(parseInt(payloadBits.slice(i, i + 8), 2))
    const partial = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes))
    if ([...partial].length >= charCount) {
      return [...partial].slice(0, charCount).join('')
    }
  }

  const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes))
  return [...decoded].slice(0, charCount).join('')
}

export { MAX_UTF8_BYTES, utf8ByteLength }
