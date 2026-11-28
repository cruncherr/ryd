import type { Metadata } from 'next'

import { ProductListing } from '@/components/product/ProductListing'
import { JsonLd } from '@/components/seo/JsonLd'
import { getEditionStates } from '@/lib/editionData'
import { pageMetadata } from '@/lib/metadata'
import { getCategories, getProducts, getSettings, getSwatches, parseSort } from '@/lib/queries'
import { breadcrumbJsonLd, productListJsonLd } from '@/lib/seo'

/** Wstęp na stronie sklepu: „Opis sklepu” z ustawień (Wyszukiwarki i analityka), a gdy go nie ma — tekst ogólny. */
const DEFAULT_DESCRIPTION = 'Meble tapicerowane wydawane w numerowanych edycjach. Każdy model powstaje w ograniczonym nakładzie — gdy się wyczerpie, nie wraca.'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return pageMetadata({
    title: 'Kolekcja',
    description: settings.seo?.description || DEFAULT_DESCRIPTION,
    path: '/sklep',
  })
}

export default async function ShopPage({ searchParams }: PageProps<'/sklep'>) {
  const sort = parseSort((await searchParams).sortuj)
  const [products, categories, settings, swatches] = await Promise.all([getProducts({ sort }), getCategories(), getSettings(), getSwatches()])
  const editions = await getEditionStates(products)

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: 'Kolekcja', path: '/sklep' }]), productListJsonLd(products, 'Kolekcja')]} />
      <ProductListing
        categories={categories}
        description={settings.seo?.description || DEFAULT_DESCRIPTION}
        editions={editions}
        products={products}
        sort={sort}
        swatches={swatches}
        title="Kolekcja"
      />
    </>
  )
}
