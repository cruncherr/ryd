/**
 * Historia cen potrzebna do informacji wymaganej przy obniżkach (dyrektywa Omnibus):
 * „Najniższa cena z 30 dni przed obniżką”. Zapisujemy każdą zmianę ceny, którą widział
 * klient, i z tej historii wyliczamy najniższą cenę z 30 dni poprzedzających obniżkę.
 */

export type PriceHistoryEntry = {
  /** Data w formacie ISO, od której obowiązuje cena. */
  date: string
  /** Cena, którą w tym okresie płacił klient (zł brutto). */
  price: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_DAYS = 30
const MAX_ENTRIES = 60

function sorted(history: PriceHistoryEntry[]): PriceHistoryEntry[] {
  return [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

/** Dopisuje wpis tylko wtedy, gdy cena faktycznie się zmieniła. */
export function appendPriceHistory(
  history: PriceHistoryEntry[] | null | undefined,
  price: number,
  now: Date = new Date(),
): PriceHistoryEntry[] {
  const entries = sorted(history ?? [])
  const last = entries[entries.length - 1]
  if (last && last.price === price) return entries
  return [...entries, { date: now.toISOString(), price }].slice(-MAX_ENTRIES)
}

/**
 * Najniższa cena z 30 dni przed ostatnią zmianą ceny (czyli przed obecną obniżką).
 * Zwraca null, gdy produkt nie miał wcześniej żadnej ceny (nie ma do czego porównać).
 */
export function lowestPriceBeforeCurrent(
  history: PriceHistoryEntry[] | null | undefined,
): number | null {
  const entries = sorted(history ?? [])
  const current = entries[entries.length - 1]
  if (!current) return null

  const changeAt = new Date(current.date).getTime()
  const windowStart = changeAt - WINDOW_DAYS * DAY_MS
  const earlier = entries.slice(0, -1)
  if (earlier.length === 0) return null

  const candidates: number[] = []

  // Cena obowiązująca w chwili rozpoczęcia 30-dniowego okna.
  const inEffectAtStart = [...earlier]
    .reverse()
    .find((entry) => new Date(entry.date).getTime() <= windowStart)
  if (inEffectAtStart) candidates.push(inEffectAtStart.price)

  // Wszystkie ceny ustawione w trakcie okna.
  for (const entry of earlier) {
    const at = new Date(entry.date).getTime()
    if (at > windowStart && at < changeAt) candidates.push(entry.price)
  }

  // Jednoczesny zapis (ta sama milisekunda) traktujemy jako cenę poprzedzającą.
  if (candidates.length === 0) {
    const previous = earlier[earlier.length - 1]
    if (previous) candidates.push(previous.price)
  }

  return candidates.length > 0 ? Math.min(...candidates) : null
}
