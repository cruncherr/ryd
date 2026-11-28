import type { PayloadRequest } from 'payload'
import { cache } from 'react'

import { editionInfo, editionState, type EditionState } from '@/lib/editions'
import { getPayloadClient } from '@/lib/payload'
import type { Product } from '@/payload-types'

/**
 * Odczyt rejestru egzemplarzy po stronie serwera. Rejestr zawiera dane właścicieli, więc jest
 * dostępny tylko dla panelu — sklep pobiera z niego wyłącznie zajęte numery.
 */

const relationId = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'number') {
    return (value as { id: number }).id
  }
  return null
}

/** Zajęte numery egzemplarzy dla podanych modeli. Z `req` — w obrębie transakcji zamówienia. */
export async function takenNumbers(productIds: number[], req?: PayloadRequest): Promise<Map<number, number[]>> {
  const map = new Map<number, number[]>(productIds.map((id) => [id, []]))
  if (productIds.length === 0) return map
  const payload = req?.payload ?? (await getPayloadClient())
  const result = await payload.find({
    collection: 'pieces',
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
    req,
    select: { product: true, number: true },
    where: { product: { in: productIds } },
  })
  for (const piece of result.docs) {
    const productId = relationId(piece.product)
    if (productId !== null && typeof piece.number === 'number') map.get(productId)?.push(piece.number)
  }
  return map
}

/** Stan edycji (zajęte numery, ile zostało) dla modeli na stronie — jedno zapytanie na wyświetlenie. */
export const getEditionStates = cache(async (products: Product[]): Promise<Map<number, EditionState>> => {
  const limited = products.filter((product) => editionInfo(product.edition).size !== null)
  const taken = await takenNumbers(limited.map((product) => product.id))
  return new Map(products.map((product) => [product.id, editionState(editionInfo(product.edition), taken.get(product.id) ?? [])]))
})

export async function getEditionState(product: Product): Promise<EditionState> {
  const states = await getEditionStates([product])
  return states.get(product.id) ?? editionState(editionInfo(product.edition), [])
}

/** Kody zaproszeń — tylko na serwerze, do sprawdzenia kodu wpisanego przez klienta. */
export async function inviteCodes(productIds: number[], req?: PayloadRequest): Promise<Map<number, string | null>> {
  const map = new Map<number, string | null>()
  if (productIds.length === 0) return map
  const payload = req?.payload ?? (await getPayloadClient())
  const result = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
    req,
    select: { edition: true },
    where: { id: { in: productIds } },
  })
  for (const product of result.docs) map.set(product.id, product.edition?.inviteCode ?? null)
  return map
}
