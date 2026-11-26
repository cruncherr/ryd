import type { Metadata } from 'next'

import { FabricShowcase } from '@/components/home/FabricShowcase'
import { Hero, type HeroSwatch } from '@/components/home/Hero'
import { Collection, ContactBand, Functions, Quality, Story, Usps } from '@/components/home/Sections'
import { CategoryTiles, Steps, type CategoryTile } from '@/components/home/Showcase'
import { JsonLd } from '@/components/seo/JsonLd'
import { asCategory, imageAlt, primaryImage, priceView, productPath } from '@/lib/catalog'
import { configOptions, fabricOption, lowestConfiguredPrice, priceVaries } from '@/lib/configurator'
import { getCategories, getFabrics, getHomepage, getProducts, getSettings } from '@/lib/queries'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo'
import type { Product } from '@/payload-types'

// Tytuł i opis strony głównej pochodzą z ustawień sklepu (patrz layout); tu dochodzi tylko adres kanoniczny.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

/** Najniższa cena modelu w dowolnej konfiguracji — do kafelków i etykiety na zdjęciu. */
function fromPrice(product: Product): { price: number; from: boolean } {
  const options = configOptions(product)
  const base = priceView(product).current
  return priceVaries(options) ? { price: lowestConfiguredPrice(base, options), from: true } : { price: base, from: false }
}

export default async function HomePage() {
  const [homepage, settings, featured, allProducts, categories, fabricDocs] = await Promise.all([
    getHomepage(),
    getSettings(),
    getProducts({ featuredOnly: true }),
    getProducts(),
    getCategories(),
    getFabrics(),
  ])
  // Gdy żaden produkt nie jest oznaczony „Pokaż na stronie głównej”, pokazujemy całą ofertę.
  const products = featured.length > 0 ? featured : allProducts

  const fabrics = fabricDocs.map(fabricOption).filter((fabric) => fabric.colors.some((color) => color.available))
  const swatches: HeroSwatch[] = fabrics.flatMap((fabric) =>
    fabric.colors.filter((color) => color.available).map((color) => ({ key: `${fabric.id}-${color.id}`, color: color.swatchColor, type: fabric.type })),
  )
  // Do zachęty w pierwszym ekranie: po jednym–dwa kolory z każdej tkaniny, żeby było widać różnorodność.
  const heroSwatches = fabrics.flatMap((fabric) =>
    fabric.colors
      .filter((color) => color.available)
      .slice(0, 2)
      .map((color) => ({ key: `${fabric.id}-${color.id}`, color: color.swatchColor, type: fabric.type })),
  )

  const tiles: CategoryTile[] = categories.flatMap((category) => {
    const inCategory = allProducts.filter((product) => asCategory(product.category)?.id === category.id)
    const first = inCategory[0]
    if (!first) return []
    const prices = inCategory.map((product) => fromPrice(product).price)
    const image = primaryImage(first)
    return [
      {
        title: category.title,
        href: `/sklep/${category.slug}`,
        count: inCategory.length,
        fromPrice: prices.length > 0 ? Math.min(...prices) : null,
        image,
        imageAlt: imageAlt(image, category.title),
      },
    ]
  })

  // Etykieta „Na zdjęciu” — produkt, którego zdjęcie jest w pierwszym ekranie.
  const heroImageId = typeof homepage.hero?.image === 'object' ? homepage.hero?.image?.id : homepage.hero?.image
  const pictured = allProducts.find((product) =>
    (product.variants ?? []).some((variant) =>
      (variant.images ?? []).some((image) => (typeof image === 'object' ? image.id : image) === heroImageId),
    ),
  )
  const spotlight = pictured ? { title: pictured.title, href: productPath(pictured), ...fromPrice(pictured) } : null

  const samplesEnabled = settings.samples?.enabled !== false

  return (
    <>
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd(settings)]} />
      <Hero colorCount={swatches.length} fabricCount={fabrics.length} hero={homepage.hero} spotlight={spotlight} swatches={heroSwatches.slice(0, 7)} />
      <Usps items={homepage.usps} />
      <CategoryTiles
        content={homepage.categories}
        fabricTile={fabrics.length > 0 ? { swatches, colorCount: swatches.length } : null}
        tiles={tiles}
      />
      <Collection content={homepage.collection} products={products} />
      <Steps content={homepage.steps} />
      {fabrics.length > 0 && <FabricShowcase content={homepage.fabrics} fabrics={fabrics} samplesEnabled={samplesEnabled} />}
      <Functions content={homepage.functions} />
      <Quality content={homepage.quality} />
      <Story content={homepage.story} />
      <ContactBand content={homepage.contact} settings={settings} />
    </>
  )
}
