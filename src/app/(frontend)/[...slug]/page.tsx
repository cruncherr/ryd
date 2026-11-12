import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CompanyDetails } from '@/components/content/CompanyDetails'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { RichText } from '@/components/ui/RichText'
import { cn } from '@/lib/cn'
import { formatOrderDate } from '@/lib/orders/view'
import { getPageBySlug, getPublishedPageSlugs, getSettings } from '@/lib/queries'
import { extractHeadings } from '@/lib/richtext/headings'
import { noOrphans } from '@/lib/typography'

/**
 * Strony informacyjne tworzone w panelu (Regulamin, O nas, Dostawa i płatności…).
 * Ta sama trasa obsługuje każdy adres, którego sklep nie zna — wtedy pokazuje stronę „Nie znaleziono".
 */

/** Spis treści pojawia się dopiero przy dłuższych dokumentach. */
const TOC_MIN_HEADINGS = 4

export async function generateStaticParams() {
  const pages = await getPublishedPageSlugs()
  return pages.map((page) => ({ slug: [page.slug] }))
}

async function findPage(segments: string[]) {
  const [slug, ...rest] = segments
  if (!slug || rest.length > 0) return null
  // Adresy z rozszerzeniem (np. zapytania automatów o /wp-login.php) nie są stronami sklepu.
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  return getPageBySlug(slug)
}

export async function generateMetadata({ params }: PageProps<'/[...slug]'>): Promise<Metadata> {
  const { slug } = await params
  const page = await findPage(slug)
  if (!page) return { title: 'Nie znaleziono strony' }

  const description = page.metaDescription || page.lead || undefined
  return {
    title: page.metaTitle || page.title,
    description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: { type: 'article', title: page.metaTitle || page.title, description, url: `/${page.slug}` },
  }
}

export default async function ContentPage({ params }: PageProps<'/[...slug]'>) {
  const { slug } = await params
  const page = await findPage(slug)
  if (!page) notFound()

  const settings = await getSettings()
  const headings = extractHeadings(page.content)
  const withToc = headings.length >= TOC_MIN_HEADINGS
  const showReviewNotice = Boolean(page.needsReview) && settings.storeStatus !== 'live'

  return (
    <article className="shell pt-8 pb-20 md:pt-12 md:pb-28">
      <Breadcrumbs items={[{ label: 'Strona główna', href: '/' }, { label: page.title }]} />

      <header className="mt-8 max-w-3xl md:mt-10">
        <h1 className="display-1 text-[clamp(2.5rem,1.5rem+3.6vw,4.5rem)]">{noOrphans(page.title)}</h1>
        {page.lead && <p className="lead mt-5">{noOrphans(page.lead)}</p>}
      </header>

      {showReviewNotice && (
        <p className="mt-8 max-w-3xl rounded-[var(--radius-field)] bg-notice px-5 py-4 text-[0.9375rem] leading-relaxed">
          <strong className="font-medium">Treść przykładowa.</strong> To szkic do sprawdzenia przed uruchomieniem sklepu — uzupełnij miejsca
          oznaczone na żółto i odznacz w panelu pole „Treść przykładowa".
        </p>
      )}

      <div className="mt-10 grid gap-x-16 gap-y-8 md:mt-14 lg:grid-cols-12">
        {withToc && (
          <nav aria-label="Spis treści" className="lg:col-span-4 xl:col-span-3">
            {/* Na telefonie spis jest zwinięty — nie odsuwa treści w dół. */}
            <details className="group rounded-[var(--radius-field)] border border-line lg:hidden">
              <summary className="flex min-h-12 list-none items-center justify-between gap-4 px-4 font-medium [&::-webkit-details-marker]:hidden">
                Spis treści
                <span aria-hidden="true" className="text-ink-soft transition-transform duration-200 ease-out group-open:rotate-45">
                  +
                </span>
              </summary>
              <ol className="grid gap-1 border-t border-line px-4 py-3 text-[0.9375rem]">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a className="block py-1.5 text-ink-soft" href={`#${heading.id}`}>
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ol>
            </details>

            <div className="hidden lg:sticky lg:top-28 lg:block">
              <p className="eyebrow">Spis treści</p>
              <ol className="mt-4 grid gap-2.5 border-l border-line pl-5 text-[0.9375rem]">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a className="link-line text-ink-soft transition-colors duration-150 hover:text-ink" href={`#${heading.id}`}>
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
        )}

        <div className={cn('min-w-0', withToc ? 'lg:col-span-8 xl:col-span-8 xl:col-start-5' : 'lg:col-span-8')}>
          <RichText data={page.content} />
          {page.showCompanyDetails && <CompanyDetails settings={settings} />}
          <p className="mt-10 text-sm text-ink-soft">Ostatnia aktualizacja: {formatOrderDate(page.updatedAt)}</p>
        </div>
      </div>
    </article>
  )
}
