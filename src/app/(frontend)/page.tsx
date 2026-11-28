import type { Metadata } from 'next'

import { FabricShowcase } from '@/components/home/FabricShowcase'
import { EditionFacts, EditionHero, EditionList, PrivateList, Ritual, type EditionEntry } from '@/components/home/Editions'
import { ContactBand, Quality, Story } from '@/components/home/Sections'
import { JsonLd } from '@/components/seo/JsonLd'
import { priceView, productPath } from '@/lib/catalog'
import { configOptions, fabricOption, lowestConfiguredPrice, priceVaries } from '@/lib/configurator'
import { getEditionStates } from '@/lib/editionData'
import { editionInfo, editionState } from '@/lib/editions'
import { getFabrics, getHomepage, getProducts, getSettings } from '@/lib/queries'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo'
import type { Product } from '@/payload-types'

// Tytuł i opis strony głównej pochodzą z ustawień sklepu (patrz layout); tu dochodzi tylko adres kanoniczny.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

/** Najniższa cena modelu w dowolnej konfiguracji. */
function fromPrice(product: Product): { price: number; priceFrom: boolean } {
  const options = configOptions(product)
  const base = priceView(product).current
  return priceVaries(options) ? { price: lowestConfiguredPrice(base, options), priceFrom: true } : { price: base, priceFrom: false }
}

export default async function HomePage() {
  const [homepage, settings, featured, allProducts, fabricDocs] = await Promise.all([
    getHomepage(),
    getSettings(),
    getProducts({ featuredOnly: true }),
    getProducts(),
    getFabrics(),
  ])
  // Gdy żaden produkt nie jest oznaczony „Pokaż na stronie głównej”, pokazujemy całą ofertę.
  const products = featured.length > 0 ? featured : allProducts
  const editions = await getEditionStates(allProducts)

  const entry = (product: Product): EditionEntry => ({
    product,
    href: productPath(product),
    ...fromPrice(product),
    edition: editions.get(product.id) ?? editionState(editionInfo(product.edition), []),
  })

  const fabrics = fabricDocs.map(fabricOption).filter((fabric) => fabric.colors.some((color) => color.available))

  // „Tabliczka” na zdjęciu w pierwszym ekranie — model, którego zdjęcie tam jest.
  const heroImageId = typeof homepage.hero?.image === 'object' ? homepage.hero?.image?.id : homepage.hero?.image
  const pictured = allProducts.find((product) =>
    (product.variants ?? []).some((variant) =>
      (variant.images ?? []).some((image) => (typeof image === 'object' ? image.id : image) === heroImageId),
    ),
  )

  return (
    <>
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd(settings)]} />
      <EditionHero hero={homepage.hero} spotlight={pictured ? entry(pictured) : null} />
      <EditionFacts items={homepage.usps} />
      <EditionList content={homepage.collection} entries={products.map(entry)} />
      <Ritual content={homepage.steps} />
      {fabrics.length > 0 && (
        <FabricShowcase content={homepage.fabrics} fabrics={fabrics} samplesEnabled={settings.samples?.enabled !== false} />
      )}
      <Quality content={homepage.quality} />
      <Story content={homepage.story} />
      <PrivateList content={homepage.privateList} />
      <ContactBand content={homepage.contact} settings={settings} />
    </>
  )
}
