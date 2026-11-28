import type { Payload } from 'payload'

import { editionInfo, editionTitle, padNumber, pieceLabel } from '@/lib/editions'
import type { Order, Piece, Product } from '@/payload-types'

/**
 * Egzemplarze i certyfikaty autentyczności. Certyfikat ma własny, losowy adres — właściciel może go
 * wydrukować albo pokazać przy odsprzedaży; adres nie zdradza danych z zamówienia.
 */

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,64}$/

/** Zamówienie potwierdzone albo opłacone — wtedy egzemplarz ma już wystawiony certyfikat. */
export function certificateIssued(order: Pick<Order, 'status' | 'paymentStatus'> | null): boolean {
  if (!order) return true // egzemplarz sprzedany poza sklepem i wpisany ręcznie przez atelier
  if (order.status === 'cancelled') return false
  return order.paymentStatus === 'paid' || ['confirmed', 'in_production', 'shipped', 'completed'].includes(order.status)
}

export type PieceView = {
  id: number
  token: string | null
  number: number
  label: string
  /** „01-07” — oznaczenie edycji i numer egzemplarza: wpis w rejestrze. */
  registry: string
  owner: string | null
  productTitle: string
  productSlug: string | null
  editionTitle: string
  size: number | null
  createdAt: string
}

function toView(piece: Piece): PieceView | null {
  const product = typeof piece.product === 'object' ? (piece.product as Product) : null
  if (!product) return null
  const info = editionInfo(product.edition)
  return {
    id: piece.id,
    token: piece.token ?? null,
    number: piece.number,
    label: pieceLabel(piece.number, info.size),
    registry: [info.code, padNumber(piece.number, info.size)].filter(Boolean).join('-'),
    owner: piece.owner?.trim() || null,
    productTitle: product.title,
    productSlug: product.slug ?? null,
    editionTitle: editionTitle(info),
    size: info.size,
    createdAt: piece.createdAt,
  }
}

export async function findOrderPieces(payload: Payload, orderId: number): Promise<PieceView[]> {
  const result = await payload.find({
    collection: 'pieces',
    depth: 1,
    limit: 0,
    pagination: false,
    overrideAccess: true,
    sort: 'number',
    where: { order: { equals: orderId } },
  })
  return result.docs.map(toView).filter((piece): piece is PieceView => piece !== null)
}

export async function findPieceByToken(
  payload: Payload,
  token: unknown,
): Promise<{ piece: PieceView; order: Order | null; configuration: Array<{ label: string; value: string }> } | null> {
  if (typeof token !== 'string' || !TOKEN_PATTERN.test(token)) return null
  const result = await payload.find({
    collection: 'pieces',
    depth: 1,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    where: { token: { equals: token } },
  })
  const doc = result.docs[0]
  const piece = doc ? toView(doc) : null
  if (!doc || !piece) return null
  const order = typeof doc.order === 'object' && doc.order ? (doc.order as Order) : null
  const productId = typeof doc.product === 'object' ? doc.product?.id : doc.product
  const item = order?.items.find((entry) => (typeof entry.product === 'object' ? entry.product?.id : entry.product) === productId)
  const configuration = (item?.configuration ?? []).map(({ label, value }) => ({ label, value }))
  return { piece, order, configuration }
}

const dateFormat = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' })
export const formatRegistryDate = (iso: string): string => dateFormat.format(new Date(iso))
