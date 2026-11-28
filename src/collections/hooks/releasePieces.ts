import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

import type { Order } from '@/payload-types'

/**
 * Anulowane albo usunięte zamówienie oddaje swoje numery egzemplarzy do puli — mogą je wtedy
 * zarezerwować inni klienci. Przywrócenie anulowanego zamówienia nie przydziela numerów ponownie:
 * w razie potrzeby dodaj egzemplarz ręcznie w „Rejestrze egzemplarzy”.
 */
async function release(req: PayloadRequest, orderId: number): Promise<void> {
  await req.payload.delete({
    collection: 'pieces',
    req,
    where: { order: { equals: orderId } },
  })
}

export const releasePiecesOnCancel: CollectionAfterChangeHook<Order> = async ({ doc, previousDoc, operation, req }) => {
  if (operation === 'update' && doc.status === 'cancelled' && previousDoc?.status !== 'cancelled') {
    await release(req, doc.id)
  }
  return doc
}

export const releasePiecesOnDelete: CollectionAfterDeleteHook<Order> = async ({ doc, req }) => {
  await release(req, doc.id)
  return doc
}
