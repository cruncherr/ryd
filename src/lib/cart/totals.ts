import type { PaymentMethod } from '@/lib/constants'
import { sum } from '@/lib/money'

/**
 * Rachunki wspólne dla przeglądarki i serwera: koszt dostawy i suma zamówienia.
 * Przeglądarka liczy nimi podsumowanie na żywo, serwer — ostateczną kwotę przy zapisie.
 */

/** Koszt dostawy z uwzględnieniem progu darmowej dostawy. */
export function shippingCostFor(method: { price: number; freeFrom?: number | null }, subtotal: number): number {
  if (typeof method.freeFrom === 'number' && method.freeFrom > 0 && subtotal >= method.freeFrom) return 0
  return method.price
}

export type PaymentOption = {
  value: PaymentMethod
  label: string
  description: string
  fee: number
}

export function orderTotal(parts: { subtotal: number; shippingCost: number; paymentFee: number }): number {
  return sum([parts.subtotal, parts.shippingCost, parts.paymentFee])
}
