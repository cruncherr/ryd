import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { FunctionViewer } from '@/components/product/FunctionViewer'
import { ProductCard } from '@/components/product/ProductCard'
import { ButtonLink } from '@/components/ui/Button'
import { Emphasis } from '@/components/ui/Emphasis'
import { ProductImage } from '@/components/ui/ProductImage'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { asMedia, functionViews, productPath } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { noOrphans } from '@/lib/typography'
import type { Homepage, Product, Setting } from '@/payload-types'

/** Krótkie obietnice pod pierwszym ekranem. */
export function Usps({ items }: { items: Homepage['usps'] }) {
  if (!items?.length) return null

  return (
    <section aria-label="Dlaczego warto" className="shell">
      <ul className="grid grid-cols-2 gap-x-6 gap-y-8 border-b border-line py-10 md:grid-cols-4 md:gap-x-10 md:py-12">
        {items.map((item) => (
          <li key={item.id ?? item.title}>
            <p className="font-medium">{item.title}</p>
            {item.text && <p className="mt-1 text-sm text-ink-soft">{noOrphans(item.text)}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}

function ArrowLink({ href, children }: { href: string; children: string }) {
  return (
    <Link className="group inline-flex items-center gap-2 font-medium" href={href}>
      <span className="link-line">{children}</span>
      <ArrowRight
        aria-hidden="true"
        className="transition-transform duration-200 ease-out group-hover:translate-x-1"
        size={18}
        strokeWidth={1.5}
      />
    </Link>
  )
}

export function Collection({ content, products }: { content: Homepage['collection']; products: Product[] }) {
  if (products.length === 0) return null

  return (
    <section className="shell section-y">
      <SectionHeading
        action={<ArrowLink href="/sklep">Zobacz wszystkie</ArrowLink>}
        eyebrow={content?.eyebrow}
        text={content?.text}
        title={content?.title || 'Kolekcja'}
      />
      <div
        className={cn(
          'mt-12 grid gap-x-6 gap-y-12 md:mt-16',
          products.length === 1 ? 'md:grid-cols-1' : products.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3',
        )}
      >
        {products.slice(0, 6).map((product, index) => (
          <Reveal index={index % 3} key={product.id}>
            <ProductCard
              product={product}
              sizes={
                products.length === 1
                  ? '(min-width: 1360px) 1250px, 92vw'
                  : '(min-width: 1024px) 31vw, (min-width: 768px) 46vw, 92vw'
              }
            />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Functions({ content }: { content: Homepage['functions'] }) {
  const product = content?.product && typeof content.product === 'object' ? content.product : null
  const views = product ? functionViews(product) : []
  if (!content?.title || !product || views.length < 2) return null

  return (
    <section className="shell">
      <div className="section-y grid gap-10 border-t border-line lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4 lg:pt-4">
          {content.eyebrow && <p className="eyebrow mb-4">{content.eyebrow}</p>}
          <h2 className="display-2">
            <Emphasis text={content.title} />
          </h2>
          {content.text && <p className="lead mt-5 max-w-[40ch]">{noOrphans(content.text)}</p>}
          <div className="mt-8">
            <ArrowLink href={productPath(product)}>{product.title}</ArrowLink>
          </div>
        </div>
        <FunctionViewer className="lg:col-span-8" sizes="(min-width: 1024px) 62vw, 92vw" views={views} />
      </div>
    </section>
  )
}

export function Quality({ content }: { content: Homepage['quality'] }) {
  const items = content?.items ?? []
  if (!content?.title || items.length === 0) return null

  return (
    <section className="shell scroll-mt-16" id="jakosc">
      <div className="section-y border-t border-line">
      <SectionHeading eyebrow={content.eyebrow} text={content.text} title={content.title} />
      <div className="mt-12 grid gap-x-6 gap-y-12 md:mt-16 md:grid-cols-3">
        {items.map((item, index) => {
          const image = asMedia(item.image)
          return (
            <Reveal index={index} key={item.id ?? item.title}>
              <article>
                {image && (
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-panel)] bg-stage">
                    <ProductImage
                      alt={image.alt?.trim() || item.title}
                      fit="cover"
                      media={image}
                      sizes="(min-width: 768px) 31vw, 92vw"
                    />
                  </div>
                )}
                <h3 className="display-3 mt-6">{item.title}</h3>
                {item.text && <p className="mt-3 max-w-[42ch] text-ink-soft">{noOrphans(item.text)}</p>}
              </article>
            </Reveal>
          )
        })}
      </div>
      </div>
    </section>
  )
}

export function Story({ content }: { content: Homepage['story'] }) {
  if (!content?.title) return null

  return (
    <section className="shell">
      <div className="section-y grid gap-8 border-t border-line lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          {content.eyebrow && <p className="eyebrow mb-4">{content.eyebrow}</p>}
          <h2 className="display-2">
            <Emphasis text={content.title} />
          </h2>
        </div>
        <div className="lg:col-span-5 lg:pt-10">
          {content.text && <p className="lead">{noOrphans(content.text)}</p>}
          {content.linkLabel && content.linkUrl && (
            <div className="mt-8">
              <ArrowLink href={content.linkUrl}>{content.linkLabel}</ArrowLink>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function ContactBand({ content, settings }: { content: Homepage['contact']; settings: Setting }) {
  if (!content?.title) return null
  const phone = settings.contact?.phone
  const email = settings.contact?.email

  return (
    <section className="shell pb-20 md:pb-28">
      <div className="grid gap-10 rounded-[22px] bg-ink px-7 py-14 text-paper md:grid-cols-2 md:items-end md:gap-16 md:px-14 md:py-20">
        <div>
          <h2 className="display-2">
            <Emphasis text={content.title} />
          </h2>
          {content.text && <p className="mt-5 max-w-[44ch] text-[1.0625rem] text-paper/70">{noOrphans(content.text)}</p>}
        </div>
        <div className="flex flex-col gap-6 md:items-end">
          {(phone || email) && (
            <div className="grid gap-1 md:text-right">
              {phone && (
                <a className="display-3 link-line w-fit md:ml-auto" href={`tel:${phone.replace(/[^+\d]/g, '')}`}>
                  {phone}
                </a>
              )}
              {email && (
                <a className="link-line w-fit text-[1.0625rem] text-paper/80 md:ml-auto" href={`mailto:${email}`}>
                  {email}
                </a>
              )}
              {settings.contact?.hours && <p className="mt-1 text-sm text-paper/60">{settings.contact.hours}</p>}
            </div>
          )}
          <ButtonLink href="/kontakt" size="lg" variant="light">
            Napisz do nas
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
