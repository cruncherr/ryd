import { asCategory, productPath, variantImages } from '@/lib/catalog'
import { shippingCostFor } from '@/lib/cart/totals'
import { effectivePrice } from '@/lib/money'
import { absoluteUrl, getSiteUrl } from '@/lib/site'
import type { Product, Setting, ShippingMethod } from '@/payload-types'

/**
 * Opisy stron w formacie, który rozumieją wyszukiwarki (schema.org). Dzięki nim Google może
 * pokazać przy wyniku cenę, dostępność i zdjęcie produktu. Podajemy wyłącznie to, co jest
 * w bazie — niczego nie zgadujemy.
 */

export type JsonLdData = Record<string, unknown>

const AVAILABILITY_URL: Record<Product['availability'], string> = {
  in_stock: 'https://schema.org/InStock',
  // Mebel robiony na zamówienie: można kupić od razu, wysyłka po czasie realizacji.
  made_to_order: 'https://schema.org/BackOrder',
  unavailable: 'https://schema.org/OutOfStock',
}

const clean = <T extends JsonLdData>(data: T): T =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)),
  ) as T

function sellerReference(settings: Setting): JsonLdData {
  return clean({
    '@type': 'Organization',
    name: settings.company?.legalName?.trim() || settings.storeName || undefined,
    url: getSiteUrl(),
  })
}

export function organizationJsonLd(settings: Setting): JsonLdData {
  const { company, contact, social } = settings
  const hasAddress = Boolean(company?.street && company?.city)

  return clean({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${getSiteUrl()}/#sprzedawca`,
    name: settings.storeName || undefined,
    legalName: company?.legalName?.trim() || undefined,
    url: getSiteUrl(),
    email: contact?.email || undefined,
    telephone: contact?.phone || undefined,
    taxID: company?.nip?.trim() || undefined,
    address: hasAddress
      ? clean({
          '@type': 'PostalAddress',
          streetAddress: company?.street,
          postalCode: company?.postalCode || undefined,
          addressLocality: company?.city,
          addressCountry: 'PL',
        })
      : undefined,
    sameAs: [social?.instagram, social?.facebook, social?.pinterest].filter((url): url is string => Boolean(url)),
  })
}

export function websiteJsonLd(settings: Setting): JsonLdData {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.storeName || undefined,
    description: settings.seo?.description || settings.tagline || undefined,
    url: getSiteUrl(),
    inLanguage: 'pl-PL',
    publisher: { '@id': `${getSiteUrl()}/#sprzedawca` },
  })
}

export type BreadcrumbItem = { name: string; path: string }

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function productJsonLd(product: Product, settings: Setting, shippingMethods: ShippingMethod[]): JsonLdData {
  const variants = product.variants ?? []
  const images = variants.flatMap((variant) => variantImages(variant)).map((image) => (image.url ? absoluteUrl(image.url) : null))
  const uniqueImages = [...new Set(images.filter((url): url is string => Boolean(url)))].slice(0, 8)
  const price = effectivePrice(product)
  const category = asCategory(product.category)
  const colors = variants.filter((variant) => variant.available !== false).map((variant) => variant.name)
  const sku = variants.find((variant) => variant.sku)?.sku

  const cheapestShipping = shippingMethods.reduce<number | null>((lowest, method) => {
    const cost = shippingCostFor(method, price)
    return lowest === null || cost < lowest ? cost : lowest
  }, null)

  const { width, depth, height } = product.dimensions ?? {}
  const dimension = (value: number | null | undefined) =>
    typeof value === 'number' && value > 0 ? { '@type': 'QuantitativeValue', value, unitCode: 'CMT' } : undefined

  return clean({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.metaDescription || product.shortDescription || undefined,
    image: uniqueImages,
    sku: sku || undefined,
    category: category?.title,
    color: colors.length > 0 ? colors.join(', ') : undefined,
    material: product.materials?.trim() || undefined,
    width: dimension(width),
    depth: dimension(depth),
    height: dimension(height),
    brand: settings.storeName ? { '@type': 'Brand', name: settings.storeName } : undefined,
    offers: clean({
      '@type': 'Offer',
      url: absoluteUrl(productPath(product)),
      priceCurrency: 'PLN',
      price: price.toFixed(2),
      availability: AVAILABILITY_URL[product.availability],
      itemCondition: 'https://schema.org/NewCondition',
      seller: sellerReference(settings),
      shippingDetails:
        cheapestShipping !== null
          ? {
              '@type': 'OfferShippingDetails',
              shippingRate: { '@type': 'MonetaryAmount', value: cheapestShipping.toFixed(2), currency: 'PLN' },
              shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'PL' },
            }
          : undefined,
    }),
  })
}

/** Lista produktów na stronie sklepu lub kategorii. */
export function productListJsonLd(products: Product[], name: string): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.title,
      url: absoluteUrl(productPath(product)),
    })),
  }
}
