import { effectivePrice, isOnSale } from '@/lib/money'
import { lowestPriceBeforeCurrent } from '@/lib/priceHistory'
import type { Category, Media, Product } from '@/payload-types'

/**
 * Pomocnicze funkcje do pracy z produktem po stronie sklepu: zdjęcia, warianty, ceny.
 * Pola relacji z bazy mogą być samym identyfikatorem albo pełnym obiektem — tu je porządkujemy.
 */

export type Variant = NonNullable<Product['variants']>[number]

export function asMedia(value: number | Media | null | undefined): Media | null {
  return value && typeof value === 'object' ? value : null
}

export function asCategory(value: number | Category | null | undefined): Category | null {
  return value && typeof value === 'object' ? value : null
}

export function variantImages(variant: Variant | undefined): Media[] {
  if (!variant?.images) return []
  return variant.images.map((image) => asMedia(image)).filter((image): image is Media => Boolean(image?.url))
}

export function availableVariants(product: Product): Variant[] {
  const variants = product.variants ?? []
  const available = variants.filter((variant) => variant.available !== false)
  return available.length > 0 ? available : variants
}

export function defaultVariant(product: Product): Variant | undefined {
  return availableVariants(product)[0]
}

export function primaryImage(product: Product): Media | null {
  return variantImages(defaultVariant(product))[0] ?? null
}

export function secondaryImage(product: Product): Media | null {
  return variantImages(defaultVariant(product))[1] ?? null
}

export function imageAlt(media: Media | null, fallback: string): string {
  return media?.alt?.trim() || fallback
}

export type PriceView = {
  /** Cena, którą płaci klient. */
  current: number
  /** Cena regularna (przekreślona), tylko gdy trwa promocja. */
  regular: number | null
  /** Najniższa cena z 30 dni przed obniżką — wymagana przy każdej promocji. */
  lowest30: number | null
}

export function priceView(product: Pick<Product, 'price' | 'salePrice' | 'priceHistory'>): PriceView {
  const current = effectivePrice(product)
  if (!isOnSale(product)) return { current, regular: null, lowest30: null }

  const lowest = lowestPriceBeforeCurrent(product.priceHistory)
  return {
    current,
    regular: product.price,
    // Gdy produkt nie ma wcześniejszej historii, punktem odniesienia jest cena regularna.
    lowest30: lowest ?? product.price,
  }
}

export function isPurchasable(product: Pick<Product, 'availability'>): boolean {
  return product.availability !== 'unavailable'
}

export function productPath(product: Pick<Product, 'slug'>): string {
  return `/produkt/${product.slug}`
}

export function categoryPath(category: Pick<Category, 'slug'>): string {
  return `/sklep/${category.slug}`
}

/** Widoki do pokazu funkcji (zakładka „Zdjęcia i kolory → Pokaz funkcji" w panelu). */
export function functionViews(product: Product): Array<{
  id: string
  label: string
  caption: string | null
  imageUrl: string
  alt: string
}> {
  return (product.functionViews ?? []).flatMap((view, index) => {
    const media = asMedia(view.image)
    if (!media?.url) return []
    return [
      {
        id: view.id ?? String(index),
        label: view.label,
        caption: view.caption ?? null,
        imageUrl: media.url,
        alt: media.alt?.trim() || `${product.title} — ${view.label}`,
      },
    ]
  })
}
