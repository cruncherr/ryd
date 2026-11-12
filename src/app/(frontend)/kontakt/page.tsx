import type { Metadata } from 'next'
import { Suspense } from 'react'

import { ContactForm } from '@/components/content/ContactForm'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { RichText } from '@/components/ui/RichText'
import { LEGAL_SLUGS } from '@/lib/constants'
import { pageMetadata } from '@/lib/metadata'
import { getPageBySlug, getSettings } from '@/lib/queries'
import { noOrphans } from '@/lib/typography'
import { formatPhone } from '@/lib/validation'

const DEFAULT_TITLE = 'Kontakt'
const DEFAULT_LEAD =
  'Pomożemy dobrać sofę do wnętrza, podamy dokładne wymiary i opowiemy o tkaninach. Napisz albo zadzwoń — chętnie odpowiemy na każde pytanie.'

/**
 * Tytuł, wstęp i dodatkową treść tej strony można zmienić w panelu: wystarczy utworzyć
 * w „Stronach” stronę o końcówce adresu „kontakt”. Bez niej strona ma treść domyślną.
 */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('kontakt')
  return pageMetadata({
    title: page?.metaTitle || page?.title || DEFAULT_TITLE,
    description: page?.metaDescription || page?.lead || DEFAULT_LEAD,
    path: '/kontakt',
  })
}

export default async function ContactPage() {
  const [settings, page, privacyPage] = await Promise.all([
    getSettings(),
    getPageBySlug('kontakt'),
    getPageBySlug(LEGAL_SLUGS.privacy),
  ])
  const { contact, company, social } = settings
  const phone = contact?.phone
  const email = contact?.email
  const address = [company?.street, [company?.postalCode, company?.city].filter(Boolean).join(' ')].filter(Boolean)
  const socials = [
    { label: 'Instagram', url: social?.instagram },
    { label: 'Facebook', url: social?.facebook },
    { label: 'Pinterest', url: social?.pinterest },
  ].filter((item): item is { label: string; url: string } => Boolean(item.url))

  return (
    <div className="shell pt-8 pb-20 md:pt-12 md:pb-28">
      <Breadcrumbs items={[{ label: 'Strona główna', href: '/' }, { label: page?.title || DEFAULT_TITLE }]} />

      <div className="mt-8 grid gap-x-16 gap-y-14 md:mt-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h1 className="display-1 text-[clamp(2.5rem,1.5rem+3.6vw,4.5rem)]">{noOrphans(page?.title || DEFAULT_TITLE)}</h1>
          <p className="lead mt-5">{noOrphans(page?.lead || DEFAULT_LEAD)}</p>

          <dl className="mt-10 grid gap-7 border-t border-line pt-8">
            {phone && (
              <div>
                <dt className="eyebrow">Telefon</dt>
                <dd className="mt-2">
                  <a className="display-3 link-line" href={`tel:${phone.replace(/[^+\d]/g, '')}`}>
                    {formatPhone(phone) || phone}
                  </a>
                  {contact?.hours && <p className="mt-1.5 text-[0.9375rem] text-ink-soft">{contact.hours}</p>}
                </dd>
              </div>
            )}
            {email && (
              <div>
                <dt className="eyebrow">E-mail</dt>
                <dd className="mt-2">
                  <a className="link-line text-[1.1875rem] break-all" href={`mailto:${email}`}>
                    {email}
                  </a>
                </dd>
              </div>
            )}
            {(company?.legalName || address.length > 0) && (
              <div>
                <dt className="eyebrow">Adres</dt>
                <dd className="mt-2 text-[1.0625rem] leading-relaxed">
                  {company?.legalName && <span className="block font-medium">{company.legalName}</span>}
                  {address.map((line) => (
                    <span className="block" key={line}>
                      {line}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {socials.length > 0 && (
              <div>
                <dt className="eyebrow">W sieci</dt>
                <dd className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-[1.0625rem]">
                  {socials.map((item) => (
                    <a className="link-line" href={item.url} key={item.label} rel="noopener noreferrer" target="_blank">
                      {item.label}
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>

          {page?.content && <RichText className="mt-10" data={page.content} />}
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <h2 className="display-3">Napisz do nas</h2>
          <p className="mt-3 mb-8 text-ink-soft">Odpowiadamy na każdą wiadomość.</p>
          {/* Formularz czyta parametr z adresu (pytanie o konkretny produkt), dlatego ładuje się w osobnej granicy. */}
          <Suspense fallback={<div aria-hidden="true" className="h-96 rounded-[var(--radius-panel)] bg-stage/60" />}>
            <ContactForm privacyUrl={privacyPage ? `/${LEGAL_SLUGS.privacy}` : null} sellerName={company?.legalName?.trim() || null} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
