import Link from 'next/link'

import { categoryPath } from '@/lib/catalog'
import { paymentSummary } from '@/lib/payments/labels'
import { noOrphans } from '@/lib/typography'
import type { Category, Setting } from '@/payload-types'

import { CookieSettingsButton } from './CookieSettingsButton'

type Props = {
  settings: Setting
  categories: Array<Pick<Category, 'id' | 'title' | 'slug'>>
}

function FooterHeading({ children }: { children: string }) {
  return <h2 className="eyebrow mb-5">{children}</h2>
}

const linkClass = 'link-line text-[0.9375rem]'

export function Footer({ settings, categories }: Props) {
  const storeName = settings.storeName || 'RYD'
  const { contact, social, company } = settings
  const socials = [
    { label: 'Instagram', url: social?.instagram },
    { label: 'Facebook', url: social?.facebook },
    { label: 'Pinterest', url: social?.pinterest },
  ].filter((item): item is { label: string; url: string } => Boolean(item.url))

  const paymentLabels = paymentSummary(settings)

  const hasAnalytics = Boolean(settings.analytics?.ga4Id || settings.analytics?.metaPixelId)
  const legalLine = [company?.legalName, company?.nip ? `NIP ${company.nip}` : null].filter(Boolean).join(' · ')

  return (
    <footer className="border-t border-line">
      <div className="shell grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:gap-10 md:py-20">
        <div className="max-w-sm">
          <p className="text-[1.3125rem] leading-none font-semibold tracking-[0.2em] uppercase">{storeName}</p>
          {settings.footerText && <p className="mt-5 text-[0.9375rem] text-ink-soft">{noOrphans(settings.footerText)}</p>}
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {socials.map((item) => (
                <li key={item.label}>
                  <a className={linkClass} href={item.url} rel="noopener noreferrer" target="_blank">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Sklep">
          <FooterHeading>Sklep</FooterHeading>
          <ul className="grid gap-3">
            <li>
              <Link className={linkClass} href="/sklep">
                Wszystkie produkty
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link className={linkClass} href={categoryPath(category)}>
                  {category.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Informacje">
          <FooterHeading>Informacje</FooterHeading>
          <ul className="grid gap-3">
            {(settings.footerNav ?? []).map((item) => (
              <li key={`${item.label}-${item.url}`}>
                <Link className={linkClass} href={item.url}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link className={linkClass} href="/kontakt">
                Kontakt
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <FooterHeading>Kontakt</FooterHeading>
          <ul className="grid gap-3 text-[0.9375rem]">
            {contact?.phone && (
              <li>
                <a className={linkClass} href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}>
                  {contact.phone}
                </a>
              </li>
            )}
            {contact?.email && (
              <li>
                <a className={linkClass} href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </li>
            )}
            {contact?.hours && <li className="text-ink-soft">{contact.hours}</li>}
            {!contact?.phone && !contact?.email && (
              <li>
                <Link className={linkClass} href="/kontakt">
                  Napisz do nas
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-3 py-6 text-[0.8125rem] text-ink-soft md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {storeName}
            {legalLine ? ` · ${legalLine}` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {paymentLabels.length > 0 && <p>Płatności: {paymentLabels.join(', ')}</p>}
            {hasAnalytics && <CookieSettingsButton />}
          </div>
        </div>
      </div>
    </footer>
  )
}
