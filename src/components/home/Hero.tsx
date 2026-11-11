import type { CSSProperties } from 'react'

import { ButtonLink } from '@/components/ui/Button'
import { Emphasis, plainTitle } from '@/components/ui/Emphasis'
import { ProductImage } from '@/components/ui/ProductImage'
import { asMedia } from '@/lib/catalog'
import { noOrphans } from '@/lib/typography'
import type { Homepage } from '@/payload-types'

const step = (index: number) => ({ '--enter-index': index }) as CSSProperties

/**
 * Pierwszy ekran. Elementy wchodzą po kolei (co 70 ms), zdjęcie „osiada" — raz, przy wejściu na stronę.
 * To animacje CSS: zaczynają się od razu i pozostają płynne, gdy przeglądarka jeszcze ładuje resztę strony.
 */
export function Hero({ hero }: { hero: Homepage['hero'] }) {
  if (!hero?.title) return null
  const image = asMedia(hero.image)

  return (
    <section className="shell pt-2 md:pt-3">
      <div className="stage grid items-center gap-x-6 gap-y-2 px-6 pt-10 pb-4 md:min-h-[min(44rem,calc(100svh-8.5rem))] md:grid-cols-12 md:px-12 md:py-14 lg:px-16">
        <div className="relative z-10 md:[grid-area:1/1/2/8] lg:[grid-area:1/1/2/7]">
          {hero.eyebrow && (
            <p className="eyebrow enter-rise" style={step(0)}>
              {hero.eyebrow}
            </p>
          )}
          <h1 className="display-1 enter-rise mt-5 max-w-[11em]" style={step(1)}>
            <Emphasis text={hero.title} />
          </h1>
          {hero.text && (
            <p className="lead enter-rise mt-6 max-w-[36ch]" style={step(2)}>
              {noOrphans(hero.text)}
            </p>
          )}
          {(hero.primaryLabel || hero.secondaryLabel) && (
            <div className="enter-rise mt-9 flex flex-wrap gap-3" style={step(3)}>
              {hero.primaryLabel && hero.primaryUrl && (
                <ButtonLink href={hero.primaryUrl} size="lg">
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
          </div>
        )}
      </div>
    </section>
  )
}
