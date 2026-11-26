import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'

import { FabricSwatch } from '@/components/fabric/FabricSwatch'
import { ButtonLink } from '@/components/ui/Button'
import { Emphasis, plainTitle } from '@/components/ui/Emphasis'
import { ProductImage } from '@/components/ui/ProductImage'
import { asMedia } from '@/lib/catalog'
import type { FabricType } from '@/lib/constants'
import { formatPLN } from '@/lib/money'
import { noOrphans, plural } from '@/lib/typography'
import type { Homepage } from '@/payload-types'

const step = (index: number) => ({ '--enter-index': index }) as CSSProperties

export type HeroSwatch = { key: string; color: string; type: FabricType }

type Props = {
  hero: Homepage['hero']
  /** Kilka próbek z próbnika i liczby do zachęty pod przyciskami. */
  swatches: HeroSwatch[]
  colorCount: number
  fabricCount: number
  /** Model na zdjęciu — mała etykieta z ceną prowadzi prosto do konfiguratora. */
  spotlight: { title: string; href: string; price: number; from: boolean } | null
}

/**
 * Pierwszy ekran. Elementy wchodzą po kolei (co 70 ms), zdjęcie „osiada” — raz, przy wejściu na stronę.
 * To animacje CSS: zaczynają się od razu i pozostają płynne, gdy przeglądarka jeszcze ładuje resztę strony.
 */
export function Hero({ hero, swatches, colorCount, fabricCount, spotlight }: Props) {
  if (!hero?.title) return null
  const image = asMedia(hero.image)

  return (
    <section className="shell pt-2 md:pt-3">
      <div className="stage grid items-center gap-x-6 gap-y-6 px-6 pt-10 pb-6 md:min-h-[min(46rem,calc(100svh-10rem))] md:grid-cols-12 md:px-12 md:py-14 lg:px-16">
        <div className="relative z-10 md:[grid-area:1/1/2/8] lg:[grid-area:1/1/2/7]">
          {hero.eyebrow && (
            <p className="eyebrow enter-rise flex items-center gap-2.5 text-brand" style={step(0)}>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
              {hero.eyebrow}
            </p>
          )}
          <h1 className="display-1 enter-rise mt-5 max-w-[11em]" style={step(1)}>
            <Emphasis text={hero.title} />
          </h1>
          {hero.text && (
            <p className="lead enter-rise mt-6 max-w-[38ch]" style={step(2)}>
              {noOrphans(hero.text)}
            </p>
          )}
          {(hero.primaryLabel || hero.secondaryLabel) && (
            <div className="enter-rise mt-9 flex flex-wrap gap-3" style={step(3)}>
              {hero.primaryLabel && hero.primaryUrl && (
                <ButtonLink href={hero.primaryUrl} size="lg" variant="brand">
                  {hero.primaryLabel}
                </ButtonLink>
              )}
              {hero.secondaryLabel && hero.secondaryUrl && (
                <ButtonLink href={hero.secondaryUrl} size="lg" variant="secondary">
                  {hero.secondaryLabel}
                </ButtonLink>
              )}
            </div>
          )}

          {swatches.length > 0 && (
            <Link className="enter-rise group mt-10 inline-flex items-center gap-4" href="/tkaniny" style={step(4)}>
              <span aria-hidden="true" className="flex -space-x-2.5">
                {swatches.map((swatch) => (
                  <FabricSwatch
                    className="size-9 rounded-full ring-[2.5px] ring-stage transition-transform duration-200 ease-out group-hover:-translate-y-0.5"
                    color={swatch.color}
                    key={swatch.key}
                    type={swatch.type}
                  />
                ))}
              </span>
              <span className="text-sm leading-snug">
                <span className="block font-medium">
                  {colorCount} {plural(colorCount, 'kolor', 'kolory', 'kolorów')} w {fabricCount}{' '}
                  {plural(fabricCount, 'tkaninie', 'tkaninach', 'tkaninach')}
                </span>
                <span className="link-line text-ink-soft">Otwórz próbnik</span>
              </span>
            </Link>
          )}
        </div>

        {image && (
          // Tło sceny także tutaj: animowany element tworzy własną warstwę i bez tła zdjęcie nie miałoby się z czym stopić.
          <div className="enter-settle relative aspect-[4/3] bg-stage md:-mr-14 md:[grid-area:1/5/2/13] lg:-mr-20 lg:[grid-area:1/6/2/13]">
            <ProductImage
              alt={image.alt?.trim() || plainTitle(hero.title)}
              eager
              media={image}
              sizes="(min-width: 1360px) 900px, (min-width: 768px) 66vw, 100vw"
            />
            {spotlight && (
              <Link
                className="group absolute bottom-1 left-0 flex items-center gap-4 rounded-2xl bg-paper/90 py-3 pr-3 pl-4 shadow-[0_10px_30px_-12px_rgb(28_26_24/0.35)] backdrop-blur-md transition-transform duration-200 ease-out active:scale-[0.98] md:bottom-8 md:left-6"
                href={spotlight.href}
              >
                <span className="min-w-0">
                  <span className="block text-xs text-ink-soft">Na zdjęciu</span>
                  <span className="block text-[0.9375rem] font-medium">{spotlight.title}</span>
                  <span className="tabular block text-sm">
                    {spotlight.from && <span className="text-ink-soft">od </span>}
                    {formatPLN(spotlight.price)}
                  </span>
                </span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-paper transition-transform duration-200 ease-out group-hover:translate-x-0.5">
                  <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
                </span>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
