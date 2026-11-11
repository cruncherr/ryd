'use server'

import type { CartLine } from './store'

import { parseCartInput, priceCart } from './pricing'

/**
 * Odświeża koszyk klienta aktualnymi danymi z bazy (ceny, nazwy, dostępność).
 * Wywoływane po otwarciu koszyka i na stronie zamówienia.
 */
export async function refreshCart(raw: unknown): Promise<CartLine[]> {
  const priced = await priceCart(parseCartInput(raw))

  return priced.lines.map((line) => ({
    productId: line.productId,
    variantId: line.variantId,
    quantity: line.quantity,
    title: line.title,
    variantName: line.variantName,
    slug: line.slug,
    unitPrice: line.unitPrice,
    imageUrl: line.imageUrl,
    unavailable: line.unavailable || undefined,
  }))
}
