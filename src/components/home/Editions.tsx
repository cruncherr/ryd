import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'

import { EditionMeter } from '@/components/edition/EditionMeter'
import { WaitlistForm } from '@/components/edition/WaitlistForm'
import { ButtonLink } from '@/components/ui/Button'
import { Emphasis, plainTitle } from '@/components/ui/Emphasis'
import { ProductImage } from '@/components/ui/ProductImage'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { asMedia, imageAlt, primaryImage } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { editionTitle, type EditionState } from '@/lib/editions'
import { formatPLN } from '@/lib/money'
import { noOrphans } from '@/lib/typography'
import type { Homepage, Product } from '@/payload-types'

const enter = (index: number) => ({ '--enter-index': index }) as CSSProperties

/** Model z ceną „od” i stanem edycji — przygotowany na serwerze. */
export type EditionEntry = {
  product: Product
  href: string
  price: number
  priceFrom: boolean
  edition: EditionState
}

const releaseFormat = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' })

function statusText(edition: EditionState): string {
  if (edition.soldOut) return 'Nakład wyczerpany'
  if (edition.status === 'announced') {
    return edition.releaseDate ? `Zapowiedź · premiera ${releaseFormat.format(new Date(edition.releaseDate))}` : 'Zapowiedź'
  }
  if (edition.status === 'invite') return 'Przedsprzedaż na zaproszenie'
  return 'Sprzedaż otwarta'
}

/**
 * Pierwszy ekran: nagłówek o nakładzie i zdjęcie modelu z „tabliczką” edycji — numer, nazwa
 * i liczba wolnych egzemplarzy. Elementy wchodzą po kolei, zdjęcie osiada — raz, przy wejściu.
 */
export function EditionHero({ hero, spotlight }: { hero: Homepage['hero']; spotlight: EditionEntry | null }) {
  if (!hero?.title) return null
  const image = asMedia(hero.image)
  const limited = spotlight && spotlight.edition.size !== null ? spotlight : null

  return (
    <section className="shell pt-2 md:pt-3">
      <div className="stage grid items-center gap-x-6 gap-y-8 px-6 pt-12 pb-6 md:min-h-[min(48rem,calc(100svh-9rem))] md:grid-cols-12 md:px-12 md:py-16 lg:px-16">
        <div className="relative z-10 md:[grid-area:1/1/2/8] lg:[grid-area:1/1/2/7]">
          {hero.eyebrow && (
            <p className="eyebrow enter-rise flex items-center gap-3 text-brass" style={enter(0)}>
              <span aria-hidden="true" className="h-px w-8 bg-brass" />
              {hero.eyebrow}
            </p>
          )}
          <h1 className="display-1 enter-rise mt-6 max-w-[8em]" style={enter(1)}>
            <Emphasis text={hero.title} />
          </h1>
          {hero.text && (
            <p className="lead enter-rise mt-7 max-w-[40ch]" style={enter(2)}>
              {noOrphans(hero.text)}
            </p>
          )}
          {(hero.primaryLabel || hero.secondaryLabel) && (
            <div className="enter-rise mt-10 flex flex-wrap gap-3" style={enter(3)}>
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

          {/* Model ze zdjęcia: numer edycji, nazwa i to, ile egzemplarzy zostało — prosto z rejestru. */}
          {limited && limited.edition.size !== null && (
            <Link className="enter-rise group mt-12 block max-w-[24rem] border-t border-line-strong pt-5" href={limited.href} style={enter(4)}>
              <span className="flex items-start justify-between gap-4">
                <span className="min-w-0">
                  <span className="eyebrow block text-brass">Na zdjęciu · {editionTitle(limited.edition)}</span>
                  <span className="mt-1.5 block font-medium">{limited.product.title}</span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="mt-1 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1"
                  size={18}
                  strokeWidth={1.5}
                />
              </span>
              <EditionMeter allocated={limited.edition.allocated} className="mt-4" compact size={limited.edition.size} />
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
          </div>
        )}
      </div>
    </section>
  )
}

/** Ciemny pas z kilkoma liczbami, które opisują markę lepiej niż przymiotniki. */
export function EditionFacts({ items }: { items: Homepage['usps'] }) {
  if (!items?.length) return null

  return (
    <section aria-label="Edycje w liczbach" className="shell pt-3">
      <ul
        className={cn(
          'grid gap-px overflow-hidden rounded-[var(--radius-panel)] bg-paper/10 text-paper sm:grid-cols-2',
          items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
        )}
      >
        {items.map((item, index) => (
          <li className="bg-brand px-7 py-9 md:px-9 md:py-11" key={item.id ?? item.title}>
            <Reveal index={index}>
              <p className="font-display tabular text-[clamp(3rem,2.2rem+2.6vw,4.5rem)] leading-none font-[320] tracking-tight text-brass-light">
                {item.title}
              </p>
              {item.text && <p className="mt-4 max-w-[30ch] text-[0.9375rem] text-paper/70">{noOrphans(item.text)}</p>}
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Edycje: każdy model w osobnym, szerokim wierszu — duże zdjęcie, numer edycji, nakład i to,
 * ile egzemplarzy jeszcze zostało. Zdjęcia na przemian po lewej i po prawej.
 */
export function EditionList({ content, entries }: { content: Homepage['collection']; entries: EditionEntry[] }) {
  if (entries.length === 0) return null

  return (
    <section className="shell section-y" id="edycje">
      <SectionHeading eyebrow={content?.eyebrow} text={content?.text} title={content?.title || 'Edycje'} />
      <ol className="mt-14 grid gap-16 md:mt-20 md:gap-24">
        {entries.map((entry, index) => {
          const image = primaryImage(entry.product)
          const reversed = index % 2 === 1
          const { edition } = entry
          return (
            <li className="grid items-center gap-x-12 gap-y-7 md:grid-cols-12" key={entry.product.id}>
              <Reveal className={cn('md:col-span-7', reversed && 'md:order-2 md:col-start-6')}>
                <Link aria-hidden="true" className="group stage block aspect-[4/3]" href={entry.href} tabIndex={-1}>
                  <ProductImage
                    alt={imageAlt(image, entry.product.title)}
                    className="transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.025]"
                    media={image}
                    sizes="(min-width: 1360px) 760px, (min-width: 768px) 56vw, 92vw"
                  />
                  {edition.code && (
                    <span className="font-display tabular absolute top-5 left-6 text-[clamp(2.5rem,2rem+2vw,4rem)] leading-none font-[300] text-ink/15">
                      Nº {edition.code}
                    </span>
                  )}
                </Link>
              </Reveal>
              <Reveal className={cn('md:col-span-5', reversed ? 'md:order-1 md:col-start-1' : 'md:col-start-8')} index={1}>
                <p className="eyebrow text-brass">
                  {editionTitle(edition)}
                  {edition.size !== null ? ` · Nakład ${edition.size} egz.` : ''}
                </p>
                <h3 className="display-2 mt-3">
                  <Link className="transition-opacity duration-200 hover:opacity-75" href={entry.href}>
                    {noOrphans(entry.product.title)}
                  </Link>
                </h3>
                {entry.product.shortDescription && (
                  <p className="mt-4 max-w-[42ch] text-[1.0625rem] text-ink-soft">{noOrphans(entry.product.shortDescription)}</p>
                )}
                {edition.size !== null && <EditionMeter allocated={edition.allocated} className="mt-8 max-w-[26rem]" size={edition.size} />}
                <div className="mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-5 md:max-w-[26rem]">
                  <p className="tabular">
                    <span className="block text-sm text-ink-soft">{statusText(edition)}</span>
                    <span className="mt-1 block text-xl font-medium tracking-tight">
                      {entry.priceFrom && <span className="text-base font-normal text-ink-soft">od </span>}
                      {formatPLN(entry.price)}
                    </span>
                  </p>
                  <ButtonLink href={entry.href} size="md" variant={edition.soldOut ? 'secondary' : 'brand'}>
                    {edition.soldOut ? 'Zobacz model' : edition.status === 'announced' ? 'Zobacz zapowiedź' : 'Zobacz egzemplarz'}
                  </ButtonLink>
                </div>
              </Reveal>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']

/** Przebieg zakupu: od rezerwacji numeru do dostawy — rzymskie liczebniki, cienkie linie, dużo powietrza. */
export function Ritual({ content }: { content: Homepage['steps'] }) {
  const items = content?.items ?? []
  if (!content?.title || items.length === 0) return null

  return (
    <section className="shell">
      <div className="section-y border-t border-line">
        <SectionHeading eyebrow={content.eyebrow} text={content.text} title={content.title} />
        <ol className={cn('mt-14 grid gap-x-8 gap-y-12 md:mt-16 md:grid-cols-2', items.length >= 4 ? 'xl:grid-cols-4' : 'lg:grid-cols-3')}>
          {items.map((item, index) => (
            <li className="border-t border-ink pt-6" key={item.id ?? item.title}>
              <Reveal index={index}>
                <span className="font-display block text-[2rem] leading-none font-[320] text-brass italic">{ROMAN[index] ?? index + 1}</span>
                <h3 className="display-4 mt-6">{item.title}</h3>
                {item.text && <p className="mt-3 max-w-[36ch] text-[0.9375rem] text-ink-soft">{noOrphans(item.text)}</p>}
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Zapis na listę prywatną — ciemny pas pod koniec strony; kotwica #lista-prywatna z pierwszego ekranu. */
export function PrivateList({ content }: { content: Homepage['privateList'] }) {
  if (!content?.title) return null

  return (
    <section className="shell scroll-mt-20 pb-6" id="lista-prywatna">
      <div className="grid gap-12 rounded-[22px] bg-brand px-7 py-14 text-paper md:px-14 md:py-20 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          {content.eyebrow && <p className="eyebrow mb-5 text-brass-light">{content.eyebrow}</p>}
          <h2 className="display-2">
            <Emphasis text={content.title} />
          </h2>
          {content.text && <p className="mt-6 max-w-[42ch] text-[1.0625rem] text-paper/70">{noOrphans(content.text)}</p>}
        </div>
        <div className="lg:col-span-7 lg:pt-2">
          <WaitlistForm
            submitLabel="Dołącz do listy prywatnej"
            successText="Dziękujemy. Jesteś na liście prywatnej — zaproszenie do kolejnej edycji przyjdzie e-mailem."
            tone="dark"
          />
          {content.note && <p className="mt-6 text-[0.8125rem] text-paper/50">{content.note}</p>}
        </div>
      </div>
    </section>
  )
}
