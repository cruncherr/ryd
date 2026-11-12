import { formatPhone } from '@/lib/validation'
import type { Setting } from '@/payload-types'

/**
 * Ramka „Dane sprzedawcy” pod regulaminem, polityką prywatności i zasadami zwrotów.
 * Dane pochodzą z ustawień sklepu, więc zmiana w panelu od razu trafia do wszystkich dokumentów.
 */
export function CompanyDetails({ settings }: { settings: Setting }) {
  const { company, contact } = settings
  const address = [company?.street, [company?.postalCode, company?.city].filter(Boolean).join(' ')].filter(Boolean)

  const rows: Array<{ label: string; value: string | null; href?: string }> = [
    { label: 'Sprzedawca', value: company?.legalName?.trim() || null },
    { label: 'Adres', value: address.length > 0 ? address.join(', ') : null },
    { label: 'NIP', value: company?.nip?.trim() || null },
    { label: 'REGON', value: company?.regon?.trim() || null },
    { label: 'Rejestr', value: company?.registry?.trim() || null },
    { label: 'E-mail', value: contact?.email || null, href: contact?.email ? `mailto:${contact.email}` : undefined },
    {
      label: 'Telefon',
      value: contact?.phone ? formatPhone(contact.phone) || contact.phone : null,
      href: contact?.phone ? `tel:${contact.phone.replace(/[^+\d]/g, '')}` : undefined,
    },
  ]
  const filled = rows.filter((row) => row.value)
  const complete = Boolean(company?.legalName?.trim() && address.length > 0 && company?.nip?.trim())

  return (
    <section aria-labelledby="dane-sprzedawcy" className="mt-14 rounded-[var(--radius-panel)] bg-stage p-6 md:p-8">
      <h2 className="display-4" id="dane-sprzedawcy">
        Dane sprzedawcy
      </h2>
      {filled.length > 0 && (
        <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {filled.map((row) => (
            <div key={row.label}>
              <dt className="text-[0.8125rem] text-ink-soft">{row.label}</dt>
              <dd className="mt-0.5 font-medium break-words">
                {row.href ? (
                  <a className="link-line" href={row.href}>
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {!complete && (
        <p className="mt-5 text-[0.9375rem]">
          <mark className="todo-mark">[UZUPEŁNIJ: nazwę firmy, adres i NIP w panelu — Ustawienia sklepu → Dane sprzedawcy]</mark>
        </p>
      )}
    </section>
  )
}
