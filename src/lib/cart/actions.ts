'use server'

import type { CartLine } from './store'

import { parseCartInput, priceCart, toCartLines } from './pricing'

/**
 * Odświeża koszyk klienta aktualnymi danymi z bazy (ceny, nazwy, dostępność).
 * Wywoływane po otwarciu koszyka i na stronie zamówienia.
 */
export async function refreshCart(raw: unknown): Promise<CartLine[]> {
  return toCartLines(await priceCart(parseCartInput(raw)))
}
