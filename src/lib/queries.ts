import { cache } from 'react'

import { getPayloadClient } from '@/lib/payload'
import type { Category, Homepage, Page, Product, Setting, ShippingMethod } from '@/payload-types'

/**
 * Zapytania sklepu do bazy. Każde korzysta z publicznych uprawnień (overrideAccess: false),
 * więc klient nigdy nie zobaczy szkicu produktu ani wyłączonej metody dostawy.
 * `cache` z Reacta usuwa powtórzenia w obrębie jednego wyświetlenia strony.
 */

export const getSettings = cache(async (): Promise<Setting> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'settings', depth: 1, overrideAccess: false })
})

export const getHomepage = cache(async (): Promise<Homepage> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'homepage', depth: 2, overrideAccess: false })
})

export type ProductSort = 'domyslnie' | 'cena-rosnaco' | 'cena-malejaco' | 'nazwa'

const SORTS: Record<ProductSort, string[]> = {
  domyslnie: ['sortOrder', 'title'],
  'cena-rosnaco': ['price', 'title'],
  'cena-malejaco': ['-price', 'title'],
  nazwa: ['title'],
}

export function parseSort(value: string | string[] | undefined): ProductSort {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate && candidate in SORTS ? (candidate as ProductSort) : 'domyslnie'
}

export const getProducts = cache(
  async (options: { categoryId?: number; sort?: ProductSort; featuredOnly?: boolean } = {}): Promise<Product[]> => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'products',
      depth: 1,
      limit: 200,
      pagination: false,
      overrideAccess: false,
      sort: SORTS[options.sort ?? 'domyslnie'],
      where: {
        and: [
          { _status: { equals: 'published' } },
          ...(options.categoryId ? [{ category: { equals: options.categoryId } }] : []),
          ...(options.featuredOnly ? [{ featured: { equals: true } }] : []),
        ],
      },
    })
    return result.docs
  },
)

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    depth: 2,
    limit: 1,
    pagination: false,
    overrideAccess: false,
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
  })
  return result.docs[0] ?? null
})

export const getProductsByIds = cache(async (ids: number[]): Promise<Product[]> => {
  if (ids.length === 0) return []
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    depth: 1,
    limit: ids.length,
    pagination: false,
    overrideAccess: false,
    where: { and: [{ id: { in: ids } }, { _status: { equals: 'published' } }] },
  })
  return result.docs
})

/** Kategorie, które mają co najmniej jeden opublikowany produkt. */
export const getCategories = cache(async (): Promise<Array<Category & { productCount: number }>> => {
  const payload = await getPayloadClient()
  const [categories, products] = await Promise.all([
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: 100,
      pagination: false,
      overrideAccess: false,
      sort: ['sortOrder', 'title'],
    }),
    payload.find({
      collection: 'products',
      depth: 0,
      limit: 1000,
      pagination: false,
      overrideAccess: false,
      select: { category: true },
      where: { _status: { equals: 'published' } },
    }),
  ])

  const counts = new Map<number, number>()
  for (const product of products.docs) {
    const id = typeof product.category === 'object' ? product.category?.id : product.category
    if (typeof id === 'number') counts.set(id, (counts.get(id) ?? 0) + 1)
  }

  return categories.docs
    .map((category) => ({ ...category, productCount: counts.get(category.id) ?? 0 }))
    .filter((category) => category.productCount > 0)
})

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
})

export const getShippingMethods = cache(async (): Promise<ShippingMethod[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'shipping-methods',
    depth: 0,
    limit: 50,
    pagination: false,
    overrideAccess: false,
    sort: ['sortOrder', 'name'],
    where: { active: { equals: true } },
  })
  return result.docs
})

export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    depth: 1,
    limit: 1,
    pagination: false,
    overrideAccess: false,
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
  })
  return result.docs[0] ?? null
})

export const getPublishedPageSlugs = cache(async (): Promise<Array<{ slug: string; updatedAt: string }>> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 500,
    pagination: false,
    overrideAccess: false,
    select: { slug: true, updatedAt: true },
    where: { _status: { equals: 'published' } },
  })
  return result.docs.map((doc) => ({ slug: doc.slug, updatedAt: doc.updatedAt }))
})
