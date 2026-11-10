import type { CollectionAfterChangeHook } from 'payload'

import type { Order } from '@/payload-types'

/**
 * Gdy administrator oznaczy zamówienie jako wysłane, klient dostaje e-mail
 * z numerem przesyłki. Błąd wysyłki nie blokuje zapisu statusu.
 */
export const notifyOnStatusChange: CollectionAfterChangeHook<Order> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== 'update') return doc
  if (doc.status !== 'shipped' || previousDoc?.status === 'shipped') return doc

  try {
    const { sendShippedEmail } = await import('@/lib/email/send')
    await sendShippedEmail(req.payload, doc)
  } catch (error) {
    req.payload.logger.error({ err: error }, `Nie udało się wysłać e-maila o wysyłce zamówienia ${doc.orderNumber}`)
  }

  return doc
}
