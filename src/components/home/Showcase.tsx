import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { FabricSwatch } from '@/components/fabric/FabricSwatch'
import { ButtonLink } from '@/components/ui/Button'
import { Emphasis } from '@/components/ui/Emphasis'
import { ProductImage } from '@/components/ui/ProductImage'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { FabricType } from '@/lib/constants'
import { cn } from '@/lib/cn'
import { formatPLN } from '@/lib/money'
import { noOrphans, plural } from '@/lib/typography'
import type { Homepage, Media } from '@/payload-types'

export type CategoryTile = {
  title: string
  href: string
  count: number
  fromPrice: number | null
  image: Media | null
  imageAlt: string
}

type Props = {
  content: Homepage['categories']
  tiles: CategoryTile[]
  /** Kafelek próbnika — mozaika prawdziwych kolorów z panelu. */
  fabricTile: { swatches: Array<{ key: string; color: string; type: FabricType }>; colorCount: number } | null
}

/** Kafelki kategorii: zdjęcie modelu, liczba modeli i cena „od”; ostatni kafelek prowadzi do próbnika tkanin. */
export function CategoryTiles({ content, tiles, fabricTile }: Props) {
  if (tiles.length === 0) return null
  const count = tiles.length + (fabricTile ? 1 : 0)

  return (
    <section className="shell pt-16 md:pt-24">
      <SectionHeading eyebrow={content?.eyebrow} text={content?.text} title={content?.title || 'Czego szukasz?'} />
      <ul className={cn('mt-10 grid gap-4 md:mt-12', count >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
        {tiles.map((tile, index) => (
          <li key={tile.href}>
            <Reveal index={index}>
              <Link className="group stage flex aspect-[5/4] flex-col justify-between p-5 md:aspect-[4/5] md:p-7" href={tile.href}>
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="display-3">{tile.title}</h3>
                    <p className="tabular mt-1.5 text-sm text-ink-soft">
                      {tile.count} {plural(tile.count, 'model', 'modele', 'modeli')}
                      {tile.fromPrice !== null ? ` · od ${formatPLN(tile.fromPrice)}` : ''}
                    </p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper transition-[transform,background-color] duration-200 ease-out group-hover:bg-ink group-hover:text-paper">
                    <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.5} />
                  </span>
                </div>
                <div className="relative -mx-2 aspect-[4/3] transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.03] md:-mx-4">
                  <ProductImage alt={tile.imageAlt} media={tile.image} sizes="(min-width: 768px) 30vw, 90vw" />
                </div>
              </Link>
            </Reveal>
          </li>
        ))}

        {fabricTile && (
          <li>
            <Reveal index={tiles.length}>
              <Link
                className="group relative flex aspect-[5/4] flex-col justify-between overflow-hidden rounded-[var(--radius-panel)] bg-brand p-5 text-paper md:aspect-[4/5] md:p-7"
                href="/tkaniny"
              >
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="display-3">Próbnik tkanin</h3>
                    <p className="mt-1.5 text-sm text-paper/70">
                      {fabricTile.colorCount} {plural(fabricTile.colorCount, 'kolor', 'kolory', 'kolorów')} · próbki bezpłatnie
                    </p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-ink transition-transform duration-200 ease-out group-hover:rotate-45">
                    <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.5} />
                  </span>
                </div>
                <div aria-hidden="true" className="grid grid-cols-4 gap-2 md:gap-2.5">
                  {fabricTile.swatches.slice(0, 12).map((swatch, index) => (
                    <FabricSwatch
                      className="aspect-square rounded-lg transition-transform duration-300 ease-out group-hover:-translate-y-1"
                      color={swatch.color}
                      key={swatch.key}
                      type={swatch.type}
                      style={{ transitionDelay: `${(index % 4) * 30}ms` }}
                    />
                  ))}
                </div>
              </Link>
            </Reveal>
          </li>
        )}
      </ul>
    </section>
  )
}

/** Mocny akcent strony: pas w kolorze marki z trzema krokami zamówienia. */
export function Steps({ content }: { content: Homepage['steps'] }) {
  const items = content?.items ?? []
  if (!content?.title || items.length === 0) return null

  return (
    <section className="bg-brand text-paper">
      <div className="shell section-y grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          {content.eyebrow && <p className="eyebrow mb-4 text-paper/60">{content.eyebrow}</p>}
          <h2 className="display-2">
            <Emphasis text={content.title} />
          </h2>
          {content.text && <p className="mt-5 max-w-[42ch] text-[1.0625rem] text-paper/70">{noOrphans(content.text)}</p>}
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/sklep" size="lg" variant="light">
              Skonfiguruj sofę
            </ButtonLink>
            <ButtonLink href="/tkaniny" size="lg" variant="outline-light">
              Zamów próbki
            </ButtonLink>
          </div>
        </div>
        <ol className="lg:col-span-7">
          {items.map((item, index) => (
            <li className="grid grid-cols-[3.25rem_1fr] gap-x-5 border-t border-paper/15 py-7 last:pb-0 md:grid-cols-[5rem_1fr] md:py-9" key={item.id ?? item.title}>
              <Reveal index={index}>
                <span className="display-2 block font-[320] text-paper/45 italic">{String(index + 1).padStart(2, '0')}</span>
              </Reveal>
              <Reveal index={index}>
                <h3 className="display-3">{item.title}</h3>
                {item.text && <p className="mt-2.5 max-w-[48ch] text-paper/70">{noOrphans(item.text)}</p>}
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Link ze strzałką — wspólny dla sekcji strony głównej. */
export function MoreLink({ href, children }: { href: string; children: string }) {
  return (
    <Link className="group inline-flex items-center gap-2 font-medium" href={href}>
      <span className="link-line">{children}</span>
      <ArrowRight aria-hidden="true" className="transition-transform duration-200 ease-out group-hover:translate-x-1" size={18} strokeWidth={1.5} />
    </Link>
  )
}
