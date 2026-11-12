import type { Metadata } from 'next'

import { ProductListing } from '@/components/product/ProductListing'
import { JsonLd } from '@/components/seo/JsonLd'
import { pageMetadata } from '@/lib/metadata'
import { getCategories, getProducts, parseSort } from '@/lib/queries'
import { breadcrumbJsonLd, productListJsonLd } from '@/lib/seo'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Sklep',
    description: 'Sofy z funkcją spania, wykonane starannie i wygodne na co dzień. Zobacz całą ofertę.',
    path: '/sklep',
  })
}

export default async function ShopPage({ searchParams }: PageProps<'/sklep'>) {
  const sort = parseSort((await searchParams).sortuj)
  const [products, categories] = await Promise.all([getProducts({ sort }), getCategories()])

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: 'Sklep', path: '/sklep' }]), productListJsonLd(products, 'Sklep')]} />
      <ProductListing
        categories={categories}
        description="Sofy z funkcją spania, wykonane starannie i wygodne na co dzień."
        products={products}
        sort={sort}
        title="Sklep"
      />
    </>
  )
}
