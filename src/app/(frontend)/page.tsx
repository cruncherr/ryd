import type { Metadata } from 'next'

import { Hero } from '@/components/home/Hero'
import { Collection, ContactBand, Functions, Quality, Story, Usps } from '@/components/home/Sections'
import { JsonLd } from '@/components/seo/JsonLd'
import { getHomepage, getProducts, getSettings } from '@/lib/queries'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo'

// Tytuł i opis strony głównej pochodzą z ustawień sklepu (patrz layout); tu dochodzi tylko adres kanoniczny.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const [homepage, settings, featured] = await Promise.all([
    getHomepage(),
    getSettings(),
    getProducts({ featuredOnly: true }),
  ])
  // Gdy żaden produkt nie jest oznaczony „Pokaż na stronie głównej", pokazujemy całą ofertę.
  const products = featured.length > 0 ? featured : await getProducts()

  return (
    <>
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd(settings)]} />
      <Hero hero={homepage.hero} />
      <Usps items={homepage.usps} />
      <Collection content={homepage.collection} products={products} />
      <Functions content={homepage.functions} />
      <Quality content={homepage.quality} />
      <Story content={homepage.story} />
      <ContactBand content={homepage.contact} settings={settings} />
    </>
  )
}
