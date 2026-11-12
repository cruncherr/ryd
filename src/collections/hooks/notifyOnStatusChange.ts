import type { CollectionAfterChangeHook } from 'payload'

import type { Order } from '@/payload-types'

const BEFORE_SHIPPING: Array<Order['status']> = ['new', 'confirmed', 'in_production']

/**
 * Powiadomienia dla klienta przy zmianach w zamówieniu:
 *  - status „Wysłane” → e-mail z numerem przesyłki,
 *  - płatność „Opłacone” (przelew zaksięgowany w panelu albo płatność online) → e-mail z potwierdzeniem wpłaty.
 * Wiadomości wychodzą po zapisaniu zmian, więc kłopot z pocztą nie blokuje pracy w panelu.
 */
export const notifyOnStatusChange: CollectionAfterChangeHook<Order> = async ({
  doc,
  previousDoc,
  operation,
  req,
  context,
}) => {
  if (operation !== 'update' || context?.skipNotify) return doc

  const becameShipped = doc.status === 'shipped' && previousDoc?.status !== 'shipped'
  // Przy płatności za pobraniem pieniądze wpływają dopiero po dostawie — wtedy nie ma o czym zawiadamiać.
  const becamePaid =
    doc.paymentStatus === 'paid' &&
    previousDoc?.paymentStatus !== 'paid' &&
    doc.paymentMethod !== 'cod' &&
    BEFORE_SHIPPING.includes(doc.status)

  if (!becameShipped && !becamePaid) return doc

  const { payload } = req
  const orderId = doc.id
  const { runAfterResponse } = await import('@/lib/afterResponse')

  runAfterResponse(payload, async () => {
    const { sendPaymentReceivedEmail, sendShippedEmail } = await import('@/lib/email/send')
    if (becamePaid) await sendPaymentReceivedEmail(payload, orderId)
    if (becameShipped) await sendShippedEmail(payload, orderId)
  })

  return doc
}
