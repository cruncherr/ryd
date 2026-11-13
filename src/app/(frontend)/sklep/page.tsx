import type { Metadata } from 'next'

import { ProductListing } from '@/components/product/ProductListing'
import { JsonLd } from '@/components/seo/JsonLd'
import { pageMetadata } from '@/lib/metadata'
import { getCategories, getProducts, getSettings, parseSort } from '@/lib/queries'
import { breadcrumbJsonLd, productListJsonLd } from '@/lib/seo'

/** Wstęp na stronie sklepu: „Opis sklepu” z ustawień (Wyszukiwarki i analityka), a gdy go nie ma — tekst ogólny. */
const DEFAULT_DESCRIPTION = 'Meble tapicerowane wykonane starannie i wygodne na co dzień.'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return pageMetadata({
    title: 'Sklep',
    description: settings.seo?.description || DEFAULT_DESCRIPTION,
    path: '/sklep',
  })
}

export default async function ShopPage({ searchParams }: PageProps<'/sklep'>) {
  const sort = parseSort((await searchParams).sortuj)
  const [products, categories, settings] = await Promise.all([getProducts({ sort }), getCategories(), getSettings()])

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: 'Sklep', path: '/sklep' }]), productListJsonLd(products, 'Sklep')]} />
      <ProductListing
        categories={categories}
        description={settings.seo?.description || DEFAULT_DESCRIPTION}
        products={products}
        sort={sort}
        title="Sklep"
      />
    </>
  )
}
