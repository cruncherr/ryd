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
import { inviteCodes, takenNumbers } from '@/lib/editionData'
import { editionInfo, editionLineText, freeNumbers, inviteMatches, pieceLabel } from '@/lib/editions'
import { effectivePrice, lineTotal, sum } from '@/lib/money'
import { getProductsByIds } from '@/lib/queries'

import type { Product } from '@/payload-types'

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
  /** Nakład edycji (`null`: model nie jest limitowany) — do przydziału numerów przy zamówieniu. */
  editionSize: number | null
  /** Numer egzemplarza albo informacja o przydziale — do koszyka. */
  edition: string | null
  /** Produkt wycofany, niedostępny albo kolor wyłączony ze sprzedaży. */
  unavailable: boolean
}

export type PricedCart = {
  lines: PricedLine[]
  subtotal: number
  itemCount: number
  hasUnavailable: boolean
}

/**
 * Edycje numerowane: sprawdza, czy model jest w sprzedaży (zapowiedź, zaproszenie), czy wybrany numer
 * jest wolny i czy w nakładzie zostało dość egzemplarzy. Ilość pozycji bez wybranego numeru jest
 * w razie potrzeby zmniejszana do liczby wolnych egzemplarzy — klient zobaczy to w podsumowaniu.
 */
function applyEditions(
  lines: PricedLine[],
  input: CartInput,
  products: Map<number, Product>,
  taken: Map<number, number[]>,
  codes: Map<number, string | null>,
): PricedLine[] {
  const reserved = new Map<number, Set<number>>()
  const result = [...lines]
  const unavailable = (line: PricedLine, message: string): PricedLine => ({
    ...line,
    variantName: message,
    edition: null,
    lineTotal: 0,
    unavailable: true,
  })

  // Najpierw pozycje z wybranym numerem, potem przydział kolejnych wolnych.
  const order = result.map((_, index) => index).sort((a, b) => Number(Boolean(input[b]?.config?.number)) - Number(Boolean(input[a]?.config?.number)))
  for (const index of order) {
    const line = result[index]
    if (!line || line.unavailable) continue
    const product = products.get(line.productId)
    if (!product) continue
    const info = editionInfo(product.edition)
    if (!info.size) continue

    if (info.status === 'announced') {
      result[index] = unavailable(line, 'Ten model jest zapowiedzią — sprzedaż jeszcze się nie rozpoczęła')
      continue
    }
    if (info.status === 'invite' && !inviteMatches(codes.get(product.id), input[index]?.config?.invite)) {
      result[index] = unavailable(line, 'Ten model można zarezerwować tylko z zaproszeniem — wpisz kod na stronie modelu')
      continue
    }

    const used = reserved.get(product.id) ?? new Set(taken.get(product.id) ?? [])
    reserved.set(product.id, used)
    const number = input[index]?.config?.number

    if (number !== undefined) {
      if (number > info.size || used.has(number)) {
        result[index] = unavailable(line, `Egzemplarz ${pieceLabel(number, info.size)} ma już właściciela — wybierz inny numer`)
        continue
      }
      used.add(number)
      result[index] = { ...line, quantity: 1, lineTotal: lineTotal(line.unitPrice, 1), editionSize: info.size, edition: editionLineText(info.size, number) }
      continue
    }

    const free = freeNumbers(info.size, used)
    if (free.length === 0) {
      result[index] = unavailable(line, 'Nakład wyczerpany — wszystkie egzemplarze mają już właścicieli')
      continue
    }
    const quantity = Math.min(line.quantity, free.length)
    for (const n of free.slice(0, quantity)) used.add(n)
    result[index] = { ...line, quantity, lineTotal: lineTotal(line.unitPrice, quantity), editionSize: info.size, edition: editionLineText(info.size, undefined) }
  }
  return result
}

export async function priceCart(input: CartInput): Promise<PricedCart> {
  const productIds = [...new Set(input.map((line) => line.productId))]
  const products = await getProductsByIds(productIds)
  const byId = new Map(products.map((product) => [product.id, product]))
  const limitedIds = products.filter((product) => editionInfo(product.edition).size !== null).map((product) => product.id)
  const inviteIds = products.filter((product) => editionInfo(product.edition).status === 'invite').map((product) => product.id)
  const [taken, codes] = await Promise.all([takenNumbers(limitedIds), inviteCodes(inviteIds)])

  const basic: PricedLine[] = input.map((line) => {
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
        editionSize: null,
        edition: null,
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
    // Numer egzemplarza i kod zaproszenia nie wpływają na cenę, ale zostają przy pozycji.
    const chosen: LineConfig = configurable ? toLineConfig(resolved) : {}
    if (line.config?.number) chosen.number = line.config.number
    if (line.config?.invite) chosen.invite = line.config.invite
    const config = Object.keys(chosen).length > 0 ? chosen : undefined

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
      editionSize: null,
      edition: null,
      unavailable,
    }
  })

  const lines = applyEditions(basic, input, byId, taken, codes)

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
    edition: line.edition ?? undefined,
    unavailable: line.unavailable || undefined,
  }))
}
