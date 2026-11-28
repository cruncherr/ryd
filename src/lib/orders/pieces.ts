import type { PayloadRequest } from 'payload'

import type { PricedLine } from '@/lib/cart/pricing'
import { takenNumbers } from '@/lib/editionData'
import { assignNumbers, pieceLabel } from '@/lib/editions'

/** Wybrany numer zajęło w międzyczasie inne zamówienie albo w nakładzie zabrakło egzemplarzy. */
export class EditionConflictError extends Error {
  constructor() {
    super('Egzemplarz został w międzyczasie przydzielony innemu klientowi')
    this.name = 'EditionConflictError'
  }
}

/** Czy błąd bazy oznacza naruszenie unikalności (numer w edycji został zajęty równolegle). */
export function isUniqueViolation(error: unknown, depth = 0): boolean {
  if (!error || typeof error !== 'object' || depth > 4) return false
  const record = error as { code?: unknown; cause?: unknown; name?: unknown; data?: unknown }
  if (record.code === '23505') return true
  if (record.name === 'ValidationError') return true
  return isUniqueViolation(record.cause, depth + 1)
}

/**
 * Numery dla pozycji zamówienia, liczone w tej samej transakcji, w której powstaje zamówienie.
 * Jeśli dwóch klientów sięgnie po ten sam numer w tej samej chwili, unikalny indeks w bazie
 * przepuści tylko pierwszego — drugi dostanie prośbę o wybór innego numeru.
 */
export async function planPieces(lines: PricedLine[], req: PayloadRequest): Promise<Map<number, number[]>> {
  const limited = lines.map((line, index) => ({ line, index })).filter(({ line }) => line.editionSize !== null)
  const plan = new Map<number, number[]>()
  if (limited.length === 0) return plan

  const productIds = [...new Set(limited.map(({ line }) => line.productId))]
  const taken = await takenNumbers(productIds, req)

  for (const productId of productIds) {
    const entries = limited.filter(({ line }) => line.productId === productId)
    const size = entries[0]?.line.editionSize
    if (!size) continue
    const assigned = assignNumbers(
      size,
      taken.get(productId) ?? [],
      entries.map(({ line }) => ({ quantity: line.quantity, ...(line.config?.number ? { number: line.config.number } : {}) })),
    )
    if (!assigned) throw new EditionConflictError()
    entries.forEach(({ index }, position) => plan.set(index, assigned[position] ?? []))
  }
  return plan
}

/** „Nº 07 / 50, Nº 08 / 50” — numery pozycji zapisywane w zamówieniu. */
export function piecesText(numbers: number[] | undefined, size: number | null): string | null {
  if (!numbers || numbers.length === 0) return null
  return numbers.map((number) => pieceLabel(number, size)).join(', ')
}
