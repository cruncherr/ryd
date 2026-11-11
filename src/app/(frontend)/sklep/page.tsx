import type { Metadata } from 'next'

import { ProductListing } from '@/components/product/ProductListing'
import { getCategories, getProducts, parseSort } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Sklep',
  description: 'Wszystkie meble tapicerowane z naszej oferty.',
  alternates: { canonical: '/sklep' },
}

export default async function ShopPage({ searchParams }: PageProps<'/sklep'>) {
  const sort = parseSort((await searchParams).sortuj)
  const [products, categories] = await Promise.all([getProducts({ sort }), getCategories()])

  return (
    <ProductListing
      categories={categories}
      description="Sofy z funkcją spania, wykonane starannie i wygodne na co dzień."
      products={products}
      sort={sort}
      title="Sklep"
    />
  )
}
