import Link from 'next/link'

import { FabricSwatch } from '@/components/fabric/FabricSwatch'
import { ProductCard } from '@/components/product/ProductCard'
import type { FabricType } from '@/lib/constants'
import { categoryPath } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import type { ProductSort } from '@/lib/queries'
import { noOrphans, plural } from '@/lib/typography'
import type { Category, Product } from '@/payload-types'

import { SortSelect } from './SortSelect'

type Props = {
  title: string
  description?: string | null
  products: Product[]
  categories: Array<Pick<Category, 'id' | 'title' | 'slug'>>
  activeCategorySlug?: string
  sort: ProductSort
  /** Próbki kolorów do kafelka zachęcającego do zamówienia próbek (pusty = bez kafelka). */
  swatches?: Array<{ key: string; color: string; type: FabricType }>
}

// Kafelek próbnika domyka ostatni rząd siatki: zajmuje wolne kolumny (pełne nazwy klas — Tailwind ich szuka).
const PROMO_SPAN_MD = ['md:col-span-2', 'md:col-span-1'] as const
const PROMO_SPAN_LG = ['lg:col-span-3', 'lg:col-span-2', 'lg:col-span-1'] as const

function SamplesPromo({ swatches, count }: { swatches: NonNullable<Props['swatches']>; count: number }) {
  return (
    <Link
      className={cn(
        'group relative flex min-h-[18rem] flex-col justify-between gap-8 overflow-hidden rounded-[var(--radius-panel)] bg-brand p-6 text-paper md:p-8',
        PROMO_SPAN_MD[count % 2],
        PROMO_SPAN_LG[count % 3],
      )}
      href="/tkaniny"
    >
      <div className="max-w-[30ch]">
        <p className="eyebrow text-paper/60">Próbnik tkanin</p>
        <p className="display-3 mt-3">Nie wiesz, który kolor wybrać?</p>
        <p className="mt-3 text-paper/70">{noOrphans('Zamów bezpłatne próbki i zobacz tkaninę w swoim wnętrzu, zanim zdecydujesz.')}</p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <span aria-hidden="true" className="flex -space-x-2.5">
          {swatches.slice(0, 6).map((swatch) => (
            <FabricSwatch
              className="size-11 rounded-full ring-[2.5px] ring-brand transition-transform duration-200 ease-out group-hover:-translate-y-1"
              color={swatch.color}
              key={swatch.key}
              type={swatch.type}
            />
          ))}
        </span>
        <span className="btn h-11 bg-paper px-5 text-[0.9375rem] text-ink">Zamów próbki</span>
      </div>
    </Link>
  )
}

/** Lista produktów: wspólna dla całego sklepu i pojedynczej kategorii. */
export function ProductListing({ title, description, products, categories, activeCategorySlug, sort, swatches = [] }: Props) {
  const chip = (active: boolean) =>
    cn(
      'btn h-10 px-4 text-sm',
      active ? 'bg-ink text-paper' : 'border border-line-strong text-ink hover:border-ink',
    )

  return (
    <div className="shell pt-8 pb-20 md:pt-12 md:pb-28">
      <header className="max-w-3xl">
        <h1 className="display-1 text-[clamp(2.75rem,1.6rem+4.2vw,5rem)]">{title}</h1>
        {description && <p className="lead mt-5 max-w-[56ch]">{noOrphans(description)}</p>}
      </header>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-line pb-5 md:mt-14">
        {categories.length > 1 ? (
          <nav aria-label="Kategorie">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link aria-current={!activeCategorySlug ? 'page' : undefined} className={chip(!activeCategorySlug)} href="/sklep">
                  Wszystkie
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    aria-current={category.slug === activeCategorySlug ? 'page' : undefined}
                    className={chip(category.slug === activeCategorySlug)}
                    href={categoryPath(category)}
                  >
                    {category.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <p className="text-sm text-ink-soft">
            {products.length} {plural(products.length, 'produkt', 'produkty', 'produktów')}
          </p>
        )}
        {products.length > 1 && <SortSelect value={sort} />}
      </div>

      {products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="display-3">Jeszcze nic tu nie ma</p>
          <p className="mx-auto mt-3 max-w-[40ch] text-ink-soft">
            {noOrphans('Pracujemy nad ofertą. Zajrzyj wkrótce albo napisz do nas — chętnie odpowiemy na pytania.')}
          </p>
          <Link className="btn mt-8 h-12 bg-ink px-6 text-[0.9375rem] text-paper" href="/kontakt">
            Napisz do nas
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-x-6 gap-y-14 md:mt-12 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <ProductCard
              eager={index < 3}
              headingLevel="h2"
              key={product.id}
              product={product}
              sizes="(min-width: 1024px) 31vw, (min-width: 768px) 46vw, 92vw"
            />
          ))}
          {swatches.length > 0 && <SamplesPromo count={products.length} swatches={swatches} />}
        </div>
      )}
    </div>
  )
}
