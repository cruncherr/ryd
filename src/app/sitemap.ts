import type { MetadataRoute } from 'next'

import { categoryPath, primaryImage, productPath } from '@/lib/catalog'
import { getCategories, getProducts, getPublishedPageSlugs, getSettings } from '@/lib/queries'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

/** Mapa strony dla wyszukiwarek: strona główna, sklep, kategorie, produkty i strony informacyjne. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings()
  // W trybie przygotowania sklep nie zgłasza się do wyszukiwarek.
  if (settings.storeStatus !== 'live') return []

  const [products, categories, pages] = await Promise.all([getProducts(), getCategories(), getPublishedPageSlugs()])
  const newest = products.reduce<string | undefined>(
    (latest, product) => (!latest || product.updatedAt > latest ? product.updatedAt : latest),
    undefined,
  )

  return [
    { url: absoluteUrl('/'), lastModified: newest, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/sklep'), lastModified: newest, changeFrequency: 'weekly', priority: 0.9 },
    ...categories.map((category) => ({
      url: absoluteUrl(categoryPath(category)),
      lastModified: category.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((product) => {
      const image = primaryImage(product)
      return {
        url: absoluteUrl(productPath(product)),
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        images: image?.url ? [absoluteUrl(image.url)] : undefined,
      }
    }),
    { url: absoluteUrl('/kontakt'), changeFrequency: 'yearly', priority: 0.4 },
    ...pages
      .filter((page) => page.slug !== 'kontakt')
      .map((page) => ({
        url: absoluteUrl(`/${page.slug}`),
        lastModified: page.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.3,
      })),
  ]
}
