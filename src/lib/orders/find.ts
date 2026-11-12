import type { Payload } from 'payload'

import type { Order } from '@/payload-types'

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{24,64}$/

export function isOrderToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_PATTERN.test(value)
}

/**
 * Zamówienie po tajnym kluczu z adresu strony potwierdzenia. Klucz jest losowy i długi,
 * więc stronę zamówienia otworzy tylko ktoś, kto dostał do niej odnośnik.
 */
export async function findOrderByToken(payload: Payload, token: unknown, depth = 1): Promise<Order | null> {
  if (!isOrderToken(token)) return null
  const result = await payload.find({
    collection: 'orders',
    depth,
    limit: 1,
    pagination: false,
    where: { accessToken: { equals: token } },
  })
  return result.docs[0] ?? null
}
