import Link from 'next/link'

import { Price } from '@/components/ui/Price'
import { ProductImage } from '@/components/ui/ProductImage'
import {
  availableVariants,
  imageAlt,
  primaryImage,
  priceView,
  productPath,
  secondaryImage,
} from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { discountPercent } from '@/lib/money'
import { noOrphans } from '@/lib/typography'
import type { Product } from '@/payload-types'

type Props = {
  product: Product
  sizes: string
  /** Pierwszy rząd listy ładuje zdjęcia od razu. */
  eager?: boolean
  headingLevel?: 'h2' | 'h3'
  className?: string
}

export function ProductCard({ product, sizes, eager = false, headingLevel: Heading = 'h3', className }: Props) {
  const first = primaryImage(product)
  const second = secondaryImage(product)
  const price = priceView(product)
  const variants = availableVariants(product)
  const unavailable = product.availability === 'unavailable'
  const badge = unavailable
    ? 'Chwilowo niedostępny'
    : price.regular !== null
      ? `−${discountPercent(price.regular, price.current)}%`
      : product.badge

  return (
    <article className={cn('group relative', className)}>
      <div className="stage aspect-[4/3]">
        <ProductImage
          alt={imageAlt(first, product.title)}
          className={cn(
            'transition-opacity duration-[350ms] ease-out',
            second && 'group-hover:opacity-0 group-focus-within:opacity-0',
          )}
          eager={eager}
          media={first}
          sizes={sizes}
        />
        {second && (
          <ProductImage
            alt=""
            className="opacity-0 transition-opacity duration-[350ms] ease-out group-hover:opacity-100 group-focus-within:opacity-100"
            media={second}
            sizes={sizes}
          />
        )}
        {badge && (
          <span
            className={cn(
              'absolute top-4 left-4 rounded-full px-3 py-1.5 text-xs leading-none font-semibold',
              price.regular !== null && !unavailable ? 'bg-accent text-white' : 'bg-paper text-ink',
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Długa nazwa i długa cena nie ściskają się nawzajem: gdy brakuje miejsca, cena przechodzi pod nazwę. */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-x-5 gap-y-2">
        <div className="min-w-0 flex-1 basis-48">
          <Heading className="display-4 line-clamp-3">
            {/* Link rozciągnięty na całą kartę: klikalne jest zdjęcie i opis. */}
            <Link className="outline-none after:absolute after:inset-0 after:rounded-[var(--radius-panel)] focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ink" href={productPath(product)}>
              {noOrphans(product.title)}
            </Link>
          </Heading>
          <div className="mt-2 flex items-center gap-2.5 text-sm text-ink-soft">
            <span aria-hidden="true" className="flex gap-1">
              {variants.slice(0, 5).map((variant) => (
                <span
                  className="size-3.5 rounded-full ring-1 ring-black/10"
                  key={variant.id ?? variant.name}
                  style={{ backgroundColor: variant.swatchColor }}
                />
              ))}
            </span>
            <span className="truncate">
              {variants.length === 1
                ? variants[0]?.name
                : `${variants.length} ${variants.length < 5 ? 'kolory' : 'kolorów'}`}
            </span>
          </div>
        </div>
        <Price className="shrink-0 pt-0.5 text-[1.0625rem]" price={price} />
      </div>
    </article>
  )
}
