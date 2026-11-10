import type { Payload } from 'payload'

import type { Order } from '@/payload-types'

/** Tymczasowa wersja — pełne szablony e-maili powstają razem z procesem zamówienia. */
export async function sendShippedEmail(payload: Payload, order: Order): Promise<void> {
  payload.logger.info(`E-mail o wysyłce zamówienia ${order.orderNumber} (szablon w przygotowaniu)`)
}
