/**
 * Numer zamówienia widoczny dla klienta, np. „RYD-1001”: początek z ustawień sklepu i kolejna liczba.
 */

/** Pierwsze zamówienie w sklepie dostaje ten numer — czterocyfrowy wygląda poważniej niż „1”. */
export const FIRST_ORDER_SEQUENCE = 1001

const MAX_PREFIX_LENGTH = 8

/** „ryd ”, „R&D” → „RYD”, „RD”. Pusty początek jest dozwolony — wtedy numer to same cyfry. */
export function sanitizeOrderPrefix(prefix: string | null | undefined): string {
  return (prefix ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, MAX_PREFIX_LENGTH)
}

export function formatOrderNumber(prefix: string | null | undefined, sequence: number): string {
  const clean = sanitizeOrderPrefix(prefix)
  return clean ? `${clean}-${sequence}` : String(sequence)
}
