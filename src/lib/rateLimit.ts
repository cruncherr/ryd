import { createHash } from 'crypto'
import { headers } from 'next/headers'

/**
 * Prosty ogranicznik liczby zgłoszeń z jednego adresu (zamówienia, formularz kontaktowy).
 * Liczniki żyją w pamięci serwera — to ochrona „na pierwszej linii” przed automatami
 * zalewającymi sklep zgłoszeniami, a nie twarda gwarancja. Adres IP nie jest nigdzie zapisywany:
 * w pamięci trzymamy tylko jego skrót, a i ten znika po kilkunastu minutach.
 */

const buckets = new Map<string, number[]>()
const MAX_TRACKED_KEYS = 5000

/** Zwraca true, jeśli zgłoszenie mieści się w limicie (i od razu je zalicza). */
export function rateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): boolean {
  const recent = (buckets.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs)

  if (recent.length >= limit) {
    buckets.set(key, recent)
    return false
  }

  recent.push(now)
  buckets.set(key, recent)

  // Sprzątanie, żeby pamięć nie rosła bez końca przy dużym ruchu.
  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [storedKey, timestamps] of buckets) {
      if (timestamps.every((timestamp) => now - timestamp >= windowMs)) buckets.delete(storedKey)
    }
    if (buckets.size > MAX_TRACKED_KEYS) buckets.clear()
  }

  return true
}

/** Skrót adresu, z którego przyszło zgłoszenie — do użycia jako klucz ogranicznika. */
export async function clientFingerprint(): Promise<string> {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim()
  const address = forwarded || headerList.get('x-real-ip') || 'nieznany'
  return createHash('sha256')
    .update(`${process.env.PAYLOAD_SECRET ?? ''}:${address}`)
    .digest('hex')
    .slice(0, 32)
}

/** Tylko do testów. */
export function resetRateLimits(): void {
  buckets.clear()
}
