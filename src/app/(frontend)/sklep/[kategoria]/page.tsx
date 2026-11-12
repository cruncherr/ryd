import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProductListing } from '@/components/product/ProductListing'
import { JsonLd } from '@/components/seo/JsonLd'
import { categoryPath } from '@/lib/catalog'
import { pageMetadata } from '@/lib/metadata'
import { getCategories, getCategoryBySlug, getProducts, parseSort } from '@/lib/queries'
import { breadcrumbJsonLd, productListJsonLd } from '@/lib/seo'

export async function generateMetadata({ params }: PageProps<'/sklep/[kategoria]'>): Promise<Metadata> {
  const { kategoria } = await params
  const category = await getCategoryBySlug(kategoria)
  if (!category) return { title: 'Nie znaleziono kategorii' }

  return pageMetadata({ title: category.title, description: category.description, path: categoryPath(category) })
}

export default async function CategoryPage({ params, searchParams }: PageProps<'/sklep/[kategoria]'>) {
  const { kategoria } = await params
  const category = await getCategoryBySlug(kategoria)
  if (!category) notFound()

  const sort = parseSort((await searchParams).sortuj)
  const [products, categories] = await Promise.all([getProducts({ categoryId: category.id, sort }), getCategories()])

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Sklep', path: '/sklep' },
            { name: category.title, path: categoryPath(category) },
          ]),
          productListJsonLd(products, category.title),
        ]}
      />
      <ProductListing
        activeCategorySlug={category.slug}
        categories={categories}
        description={category.description}
        products={products}
        sort={sort}
        title={category.title}
      />
    </>
  )
}
