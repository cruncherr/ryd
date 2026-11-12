import { asMedia, variantImages } from '@/lib/catalog'
import { effectivePrice, lineTotal, sum } from '@/lib/money'
import { getProductsByIds } from '@/lib/queries'

import type { CartInput } from './input'
import type { CartLine } from './store'

export { cartInputSchema, parseCartInput, type CartInput } from './input'
export { orderTotal, paymentOptions, shippingCostFor, type PaymentOption } from './totals'

/**
 * Jedyne miejsce, w którym powstają kwoty zamówienia. Przeglądarka przysyła wyłącznie
 * identyfikatory i ilości — ceny, nazwy i dostępność zawsze bierzemy z bazy.
 */

export type PricedLine = {
  productId: number
  variantId: string
  quantity: number
  title: string
  variantName: string
  sku: string | null
  slug: string
  unitPrice: number
  lineTotal: number
  imageUrl: string | null
  imageId: number | null
  /** Produkt wycofany, niedostępny albo kolor wyłączony ze sprzedaży. */
  unavailable: boolean
}

export type PricedCart = {
  lines: PricedLine[]
  subtotal: number
  itemCount: number
  hasUnavailable: boolean
}

export async function priceCart(input: CartInput): Promise<PricedCart> {
  const products = await getProductsByIds([...new Set(input.map((line) => line.productId))])
  const byId = new Map(products.map((product) => [product.id, product]))

  const lines: PricedLine[] = input.map((line) => {
    const product = byId.get(line.productId)
    const variant = product?.variants?.find((item) => item.id === line.variantId)
    const image = variantImages(variant)[0] ?? null

    if (!product || !variant) {
      return {
        ...line,
        title: product?.title ?? 'Produkt niedostępny',
        variantName: variant?.name ?? '',
        sku: null,
        slug: product?.slug ?? '',
        unitPrice: 0,
        lineTotal: 0,
        imageUrl: null,
        imageId: null,
        unavailable: true,
      }
    }

    const unavailable = product.availability === 'unavailable' || variant.available === false
    const unitPrice = effectivePrice(product)

    return {
      ...line,
      title: product.title,
      variantName: variant.name,
      sku: variant.sku ?? null,
      slug: product.slug,
      unitPrice,
      lineTotal: unavailable ? 0 : lineTotal(unitPrice, line.quantity),
      imageUrl: asMedia(image)?.sizes?.thumbnail?.url ?? image?.url ?? null,
      imageId: image?.id ?? null,
      unavailable,
    }
  })

  const available = lines.filter((line) => !line.unavailable)

  return {
    lines,
    subtotal: sum(available.map((line) => line.lineTotal)),
    itemCount: available.reduce((total, line) => total + line.quantity, 0),
    hasUnavailable: lines.some((line) => line.unavailable),
  }
}

/** Koszyk w postaci, którą przechowuje przeglądarka — z aktualnymi cenami i dostępnością. */
export function toCartLines(priced: PricedCart): CartLine[] {
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
