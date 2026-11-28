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
import { EditionMeter } from '@/components/edition/EditionMeter'
import { FabricSwatch } from '@/components/fabric/FabricSwatch'
import { cn } from '@/lib/cn'
import { configOptions, lowestConfiguredPrice, priceVaries } from '@/lib/configurator'
import { editionTitle, type EditionState } from '@/lib/editions'
import { discountPercent } from '@/lib/money'
import { plural } from '@/lib/typography'
import { noOrphans } from '@/lib/typography'
import type { Product } from '@/payload-types'

type Props = {
  product: Product
  sizes: string
  /** Pierwszy rząd listy ładuje zdjęcia od razu. */
  eager?: boolean
  headingLevel?: 'h2' | 'h3'
  className?: string
  /** Stan edycji numerowanej — numer edycji na zdjęciu i liczba wolnych egzemplarzy pod nazwą. */
  edition?: EditionState
}

export function ProductCard({ product, sizes, eager = false, headingLevel: Heading = 'h3', className, edition }: Props) {
  const first = primaryImage(product)
  const second = secondaryImage(product)
  const basePrice = priceView(product)
  const options = configOptions(product)
  const varies = priceVaries(options)
  // Gdy cena zależy od wymiaru lub tkaniny, karta pokazuje najniższą możliwą — „od … zł”.
  const price = varies
    ? {
        current: lowestConfiguredPrice(basePrice.current, options),
        regular: basePrice.regular !== null ? lowestConfiguredPrice(basePrice.regular, options) : null,
        lowest30: null,
      }
    : basePrice
  const variants = availableVariants(product)
  const fabricColors = options.fabrics.flatMap((fabric) =>
    fabric.colors.filter((color) => color.available).map((color) => ({ ...color, type: fabric.type, key: `${fabric.id}-${color.id}` })),
  )
  const unavailable = product.availability === 'unavailable'
  const limited = edition && edition.size !== null ? edition : null
  const editionBadge = limited
    ? limited.soldOut
      ? 'Nakład wyczerpany'
      : limited.status === 'announced'
        ? 'Zapowiedź'
        : limited.status === 'invite'
          ? 'Na zaproszenie'
          : editionTitle(limited)
    : null
  const badge = unavailable
    ? 'Chwilowo niedostępny'
    : editionBadge
      ? editionBadge
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
              limited && !unavailable
                ? 'tabular bg-paper/90 tracking-[0.08em] text-brass uppercase backdrop-blur-sm'
                : price.regular !== null && !unavailable
                  ? 'bg-accent text-white'
                  : 'bg-paper text-ink',
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
          {fabricColors.length > 0 ? (
            <div className="mt-2 flex items-center gap-2.5 text-sm text-ink-soft">
              <span aria-hidden="true" className="flex -space-x-1">
                {fabricColors.slice(0, 6).map((color) => (
                  <FabricSwatch className="size-4 rounded-full ring-2 ring-paper" color={color.swatchColor} key={color.key} type={color.type} />
                ))}
              </span>
              <span className="truncate">
                {fabricColors.length} {plural(fabricColors.length, 'kolor', 'kolory', 'kolorów')}
                {options.sizes.length > 1 ? ` · ${options.sizes.length} ${plural(options.sizes.length, 'wymiar', 'wymiary', 'wymiarów')}` : ''}
              </span>
            </div>
          ) : (
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
          )}
        </div>
        <Price className="shrink-0 pt-0.5 text-[1.0625rem]" prefix={varies ? 'od' : undefined} price={price} />
      </div>
      {limited && limited.size !== null && <EditionMeter allocated={limited.allocated} className="mt-4" compact size={limited.size} />}
    </article>
  )
}
