const NBSP = ' '

/**
 * Polska zasada składu: jednoliterowe spójniki i przyimki (a, i, o, u, w, z) nie zostają
 * na końcu wiersza. Zamieniamy spację po nich na twardą, więc przechodzą do następnej linii
 * razem ze słowem, którego dotyczą.
 */
export function noOrphans(text: string | null | undefined): string {
  if (!text) return ''
  const pattern = /(^|[\s(„"«])([aiouwzAIOUWZ]) +/g
  // Dwa przebiegi: pierwszy „zjada" spację przed kolejnym jednoliterowym słowem („a w domu").
  return text.replace(pattern, `$1$2${NBSP}`).replace(pattern, `$1$2${NBSP}`)
}

/** Odmiana rzeczownika przy liczebniku: 1 produkt, 2 produkty, 5 produktów. */
export function plural(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one
  const lastDigit = count % 10
  const lastTwo = count % 100
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return few
  return many
}
