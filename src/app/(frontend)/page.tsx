import { Hero } from '@/components/home/Hero'
import { Collection, ContactBand, Functions, Quality, Story, Usps } from '@/components/home/Sections'
import { getHomepage, getProducts, getSettings } from '@/lib/queries'

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
