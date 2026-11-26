import { asMedia, variantImages } from '@/lib/catalog'
import {
  configLine,
  configOptions,
  configSummary,
  configuredPrice,
  hasConfigurator,
  lineKey,
  matchingVariantIndex,
  resolveConfig,
  toLineConfig,
  type LineConfig,
} from '@/lib/configurator'
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
  /** Wybór klienta uzupełniony o wartości domyślne (pusty, gdy produkt nie ma konfiguratora). */
  config?: LineConfig
  /** Konfiguracja opisana słowami — trafia do zamówienia, e-maili i panelu. */
  configuration: Array<{ label: string; value: string }>
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
    const variants = product?.variants ?? []
    const variant = variants.find((item) => item.id === line.variantId)
    const options = product ? configOptions(product) : null
    const configurable = options ? hasConfigurator(options) : false
    const resolved = options ? resolveConfig(options, line.config) : null

    if (!product || !variant || !options || !resolved) {
      return {
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        config: line.config,
        configuration: [],
        title: product?.title ?? 'Produkt niedostępny',
        variantName: product && variant && !resolved ? 'Ta konfiguracja nie jest już dostępna' : (variant?.name ?? ''),
        sku: null,
        slug: product?.slug ?? '',
        unitPrice: 0,
        lineTotal: 0,
        imageUrl: null,
        imageId: null,
        unavailable: true,
      }
    }

    // Zdjęcie w kolorze wybranym w konfiguratorze, jeśli sprzedawca je dodał; inaczej zdjęcie wariantu.
    const matched = matchingVariantIndex(
      variants.map((item) => ({
        fabricLinkId: typeof item.fabricLink === 'object' ? (item.fabricLink?.id ?? null) : (item.fabricLink ?? null),
        name: item.name,
      })),
      resolved.fabric?.id,
      resolved.color?.name,
    )
    const photoVariant = matched >= 0 ? variants[matched] : variant
    const image = variantImages(photoVariant)[0] ?? variantImages(variant)[0] ?? null

    // Przy tkaninach z próbnika o dostępności decyduje kolor tkaniny, a nie zestaw zdjęć.
    const unavailable =
      product.availability === 'unavailable' || (options.fabrics.length === 0 && variant.available === false)
    const unitPrice = configuredPrice(effectivePrice(product), resolved)
    const config = configurable ? toLineConfig(resolved) : undefined

    return {
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
      config,
      configuration: configSummary(resolved),
      title: product.title,
      variantName: configLine(resolved) || variant.name,
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
    key: lineKey(line.productId, line.variantId, line.config),
    productId: line.productId,
    variantId: line.variantId,
    config: line.config,
    quantity: line.quantity,
    title: line.title,
    variantName: line.variantName,
    slug: line.slug,
    unitPrice: line.unitPrice,
    imageUrl: line.imageUrl,
    unavailable: line.unavailable || undefined,
  }))
}
