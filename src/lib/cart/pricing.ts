import { z } from 'zod'

import { asMedia, variantImages } from '@/lib/catalog'
import { CART_LIMITS, type PaymentMethod } from '@/lib/constants'
import { effectivePrice, lineTotal, sum } from '@/lib/money'
import { getProductsByIds } from '@/lib/queries'
import type { Setting, ShippingMethod } from '@/payload-types'

import type { CartLine } from './store'

/**
 * Jedyne miejsce, w którym powstają kwoty zamówienia. Przeglądarka przysyła wyłącznie
 * identyfikatory i ilości — ceny, nazwy i dostępność zawsze bierzemy z bazy.
 */

const lineSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(CART_LIMITS.maxQuantityPerLine),
})

export const cartInputSchema = z.array(lineSchema).max(CART_LIMITS.maxLines)

export type CartInput = z.infer<typeof cartInputSchema>

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

/** Odczytuje koszyk przysłany przez przeglądarkę; odrzuca wszystko, co nie pasuje do wzorca. */
export function parseCartInput(raw: unknown): CartInput {
  const parsed = cartInputSchema.safeParse(raw)
  if (!parsed.success) return []

  // Łączymy powtórzone pozycje tego samego produktu i koloru.
  const merged = new Map<string, CartInput[number]>()
  for (const line of parsed.data) {
    const key = `${line.productId}:${line.variantId}`
    const existing = merged.get(key)
    merged.set(key, {
      ...line,
      quantity: Math.min(CART_LIMITS.maxQuantityPerLine, (existing?.quantity ?? 0) + line.quantity),
    })
  }
  return [...merged.values()]
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

/** Koszt dostawy z uwzględnieniem progu darmowej dostawy. */
export function shippingCostFor(method: Pick<ShippingMethod, 'price' | 'freeFrom'>, subtotal: number): number {
  if (typeof method.freeFrom === 'number' && method.freeFrom > 0 && subtotal >= method.freeFrom) return 0
  return method.price
}

export type PaymentOption = {
  value: PaymentMethod
  label: string
  description: string
  fee: number
}

/**
 * Formy płatności dostępne w zamówieniu — według ustawień sklepu.
 * Płatność online pojawia się tylko wtedy, gdy podłączono operatora płatności.
 */
export function paymentOptions(settings: Setting, onlineConfigured: boolean): PaymentOption[] {
  const payments = settings.payments
  const options: PaymentOption[] = []

  if (payments?.onlineEnabled && onlineConfigured) {
    options.push({
      value: 'online',
      label: 'Płatność online',
      description: 'BLIK, szybki przelew lub karta. Po złożeniu zamówienia przejdziesz na bezpieczną stronę płatności.',
      fee: 0,
    })
  }
  if (payments?.transferEnabled) {
    options.push({
      value: 'transfer',
      label: 'Przelew tradycyjny',
      description: 'Dane do przelewu otrzymasz na stronie potwierdzenia i w wiadomości e-mail.',
      fee: 0,
    })
  }
  if (payments?.codEnabled) {
    options.push({
      value: 'cod',
      label: 'Płatność przy odbiorze',
      description: 'Płacisz kurierowi przy dostawie.',
      fee: payments.codFee ?? 0,
    })
  }
  return options
}

export function orderTotal(parts: { subtotal: number; shippingCost: number; paymentFee: number }): number {
  return sum([parts.subtotal, parts.shippingCost, parts.paymentFee])
}
