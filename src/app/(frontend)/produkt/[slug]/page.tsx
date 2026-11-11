import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { FunctionViewer } from '@/components/product/FunctionViewer'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductDetails } from '@/components/product/ProductDetails'
import { ProductHero, type ProductHeroData } from '@/components/product/ProductHero'
import { PurchaseInfo } from '@/components/product/PurchaseInfo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { SectionHeading } from '@/components/ui/SectionHeading'
import {
  asCategory,
  categoryPath,
  functionViews,
  primaryImage,
  priceView,
  productPath,
  variantImages,
} from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { AVAILABILITY, labelOf } from '@/lib/constants'
import { getProductBySlug, getProducts, getSettings, getShippingMethods } from '@/lib/queries'
import { noOrphans } from '@/lib/typography'

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: PageProps<'/produkt/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Nie znaleziono produktu' }

  const image = primaryImage(product)
  const description = product.metaDescription || product.shortDescription || undefined

  return {
    title: product.metaTitle || product.title,
    description,
    alternates: { canonical: productPath(product) },
    openGraph: {
      type: 'website',
      title: product.metaTitle || product.title,
      description,
      url: productPath(product),
      images: image?.url
        ? [{ url: image.url, width: image.width ?? undefined, height: image.height ?? undefined, alt: image.alt ?? product.title }]
        : undefined,
    },
  }
}

export default async function ProductPage({ params }: PageProps<'/produkt/[slug]'>) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const [settings, shippingMethods, allProducts] = await Promise.all([
    getSettings(),
    getShippingMethods(),
    getProducts(),
  ])

  const category = asCategory(product.category)
  const views = functionViews(product)
  const related = allProducts.filter((item) => item.id !== product.id).slice(0, 3)
  const features = (product.features ?? []).filter((feature) => feature.title)

  const hero: ProductHeroData = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    shortDescription: product.shortDescription ?? null,
    price: priceView(product),
    priceNote: settings.priceNote ?? null,
    availability: product.availability,
    availabilityLabel: labelOf(AVAILABILITY, product.availability),
    leadTime: product.leadTime ?? null,
    variants: (product.variants ?? []).map((variant, index) => {
      const images = variantImages(variant)
      return {
        id: variant.id ?? String(index),
        name: variant.name,
        fabric: variant.fabric ?? null,
        swatchColor: variant.swatchColor,
        available: variant.available !== false,
        images: images.map((image, imageIndex) => ({
          id: image.id,
          url: image.url ?? '',
          alt: image.alt?.trim() || `${product.title} — ${variant.name}, zdjęcie ${imageIndex + 1}`,
        })),
        thumbUrl: images[0]?.sizes?.thumbnail?.url ?? images[0]?.url ?? null,
      }
    }),
  }

  return (
    <>
      <ProductHero
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Sklep', href: '/sklep' },
              ...(category ? [{ label: category.title, href: categoryPath(category) }] : []),
              { label: product.title },
            ]}
          />
        }
        info={<PurchaseInfo settings={settings} shippingMethods={shippingMethods} />}
        product={hero}
      />

      {features.length > 0 && (
        <section aria-label="Najważniejsze cechy" className="shell mt-16 md:mt-24">
          <ul
            className={cn(
              'grid gap-x-10 gap-y-8 border-y border-line py-10 md:grid-cols-2 md:py-12',
              features.length === 3 ? 'lg:grid-cols-3' : features.length >= 4 ? 'lg:grid-cols-4' : '',
            )}
          >
            {features.map((feature, index) => (
              <li key={feature.id ?? feature.title}>
                <p className="tabular text-sm text-ink-faint">{String(index + 1).padStart(2, '0')}</p>
                <h2 className="display-4 mt-2">{feature.title}</h2>
                {feature.text && <p className="mt-2 text-[0.9375rem] text-ink-soft">{noOrphans(feature.text)}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {views.length >= 2 && (
        <section className="shell section-y">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4 lg:pt-4">
              <p className="eyebrow mb-4">Funkcje</p>
              <h2 className="display-2">Zobacz, jak się zmienia</h2>
              <p className="lead mt-5 max-w-[40ch]">
                {noOrphans('Przełączaj ustawienia i sprawdź, jak mebel wygląda w każdym z nich.')}
              </p>
            </div>
            <FunctionViewer className="lg:col-span-8" sizes="(min-width: 1024px) 62vw, 92vw" views={views} />
          </div>
        </section>
      )}

      <section className="shell pb-8">
        <div className="grid gap-10 border-t border-line pt-14 md:pt-20 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <h2 className="display-2">Szczegóły</h2>
          </div>
          <div className="lg:col-span-8">
            <ProductDetails product={product} settings={settings} shippingMethods={shippingMethods} />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="shell section-y">
          <SectionHeading title="Zobacz także" />
          <div className="mt-10 grid gap-x-6 gap-y-12 md:mt-14 md:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} sizes="(min-width: 1024px) 31vw, (min-width: 768px) 46vw, 92vw" />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
