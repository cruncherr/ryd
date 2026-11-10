import type { Payload } from 'payload'

import { LEGAL_SLUGS } from '@/lib/constants'
import type { Setting } from '@/payload-types'

/**
 * Lista kontrolna przed uruchomieniem sklepu. Ta sama lista:
 *  - jest pokazywana na pulpicie panelu,
 *  - blokuje przełączenie sklepu na „Uruchomiony", dopóki brakuje rzeczy koniecznych.
 * Dzięki temu sklep nie wystartuje z przykładowymi cenami ani bez danych sprzedawcy.
 */
export type ChecklistItem = {
  id: string
  label: string
  hint: string
  done: boolean
  /** Czy brak tej pozycji uniemożliwia uruchomienie sklepu. */
  blocking: boolean
  /** Adres w panelu, pod którym można to uzupełnić. */
  href: string
}

type SettingsLike = Partial<Setting> | null | undefined

const filled = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0

export function isEmailConfigured(): boolean {
  return filled(process.env.SMTP_HOST) && filled(process.env.SMTP_FROM)
}

export function isOnlinePaymentConfigured(): boolean {
  return filled(process.env.STRIPE_SECRET_KEY) && filled(process.env.STRIPE_WEBHOOK_SECRET)
}

export async function getLaunchChecklist(
  payload: Payload,
  settingsOverride?: SettingsLike,
): Promise<ChecklistItem[]> {
  const settings: SettingsLike =
    settingsOverride ?? (await payload.findGlobal({ slug: 'settings', depth: 0 }))

  const company = settings?.company
  const contact = settings?.contact
  const payments = settings?.payments
  const manufacturer = settings?.manufacturer

  const [publishedProducts, sampleProducts, shippingMethods, sampleShipping, pages, homepage] = await Promise.all([
    payload.count({ collection: 'products', where: { _status: { equals: 'published' } } }),
    payload.count({
      collection: 'products',
      where: { and: [{ _status: { equals: 'published' } }, { sampleData: { equals: true } }] },
    }),
    payload.count({ collection: 'shipping-methods', where: { active: { equals: true } } }),
    payload.count({
      collection: 'shipping-methods',
      where: { and: [{ active: { equals: true } }, { sampleData: { equals: true } }] },
    }),
    payload.find({
      collection: 'pages',
      depth: 0,
      limit: 200,
      pagination: false,
      select: { slug: true, title: true, needsReview: true, _status: true },
    }),
    payload.findGlobal({ slug: 'homepage', depth: 0 }),
  ])

  const legalSlugs = [LEGAL_SLUGS.terms, LEGAL_SLUGS.privacy, LEGAL_SLUGS.returns] as string[]
  const missingLegal = legalSlugs.filter(
    (slug) => !pages.docs.some((doc) => doc.slug === slug && doc._status === 'published'),
  )
  const pagesToReview = pages.docs.filter((doc) => doc._status === 'published' && doc.needsReview)
  const pagesReady = missingLegal.length === 0 && pagesToReview.length === 0

  const anyPayment =
    Boolean(payments?.transferEnabled) ||
    Boolean(payments?.codEnabled) ||
    (Boolean(payments?.onlineEnabled) && isOnlinePaymentConfigured())

  const transferReady = !payments?.transferEnabled || filled(payments?.bankAccount)

  const manufacturerReady =
    Boolean(manufacturer?.sameAsSeller) || (filled(manufacturer?.name) && filled(manufacturer?.address))

  return [
    {
      id: 'company',
      label: 'Dane sprzedawcy',
      hint: 'Pełna nazwa firmy, adres i NIP. Pojawiają się w regulaminie, stopce i e-mailach.',
      done:
        filled(company?.legalName) &&
        filled(company?.street) &&
        filled(company?.postalCode) &&
        filled(company?.city) &&
        filled(company?.nip),
      blocking: true,
      href: '/admin/globals/settings',
    },
    {
      id: 'contact',
      label: 'Kontakt dla klientów',
      hint: 'Adres e-mail i telefon widoczne w sklepie.',
      done: filled(contact?.email) && filled(contact?.phone),
      blocking: true,
      href: '/admin/globals/settings',
    },
    {
      id: 'products',
      label: 'Produkty sprawdzone i opublikowane',
      hint:
        sampleProducts.totalDocs > 0
          ? `Produktów z danymi przykładowymi: ${sampleProducts.totalDocs}. Sprawdź nazwę, cenę, wymiary i opis, a potem odznacz „Dane przykładowe".`
          : 'Co najmniej jeden opublikowany produkt z prawdziwą ceną i wymiarami.',
      done: publishedProducts.totalDocs > 0 && sampleProducts.totalDocs === 0,
      blocking: true,
      href: '/admin/collections/products',
    },
    {
      id: 'shipping',
      label: 'Metody dostawy',
      hint:
        sampleShipping.totalDocs > 0
          ? `Metod dostawy z przykładową ceną: ${sampleShipping.totalDocs}. Ustaw prawdziwe ceny i odznacz „Dane przykładowe".`
          : 'Co najmniej jedna aktywna metoda dostawy z prawdziwą ceną.',
      done: shippingMethods.totalDocs > 0 && sampleShipping.totalDocs === 0,
      blocking: true,
      href: '/admin/collections/shipping-methods',
    },
    {
      id: 'payments',
      label: 'Płatności',
      hint: transferReady
        ? 'Włączona co najmniej jedna forma płatności.'
        : 'Przelew tradycyjny jest włączony, ale brakuje numeru rachunku bankowego.',
      done: anyPayment && transferReady,
      blocking: true,
      href: '/admin/globals/settings',
    },
    {
      id: 'legal',
      label: 'Regulamin i strony informacyjne',
      hint:
        missingLegal.length > 0
          ? 'Brakuje opublikowanej strony: regulamin, polityka prywatności lub zwroty i reklamacje.'
          : pagesToReview.length > 0
            ? `Do sprawdzenia: ${pagesToReview
                .map((doc) => doc.title)
                .join(', ')}. Przeczytaj szkice, uzupełnij miejsca oznaczone [UZUPEŁNIJ] (regulamin najlepiej z prawnikiem) i odznacz „Treść przykładowa".`
            : 'Regulamin, polityka prywatności oraz zwroty i reklamacje są opublikowane i sprawdzone.',
      done: pagesReady,
      blocking: true,
      href: '/admin/collections/pages',
    },
    {
      id: 'manufacturer',
      label: 'Dane producenta (GPSR)',
      hint: 'Zaznacz, że producentem jest sprzedawca, albo podaj nazwę i adres producenta.',
      done: manufacturerReady,
      blocking: true,
      href: '/admin/globals/settings',
    },
    {
      id: 'email',
      label: 'Wysyłka e-maili',
      hint: 'Skrzynka pocztowa sklepu podłączona w ustawieniach hostingu (zmienne SMTP). Bez niej klient nie dostanie potwierdzenia zamówienia.',
      done: isEmailConfigured(),
      blocking: true,
      href: '/admin/globals/settings',
    },
    {
      id: 'homepage',
      label: 'Teksty strony głównej',
      hint: 'Przejrzyj hasła i opisy na stronie głównej, dopasuj je do swojej oferty i odznacz „Teksty przykładowe".',
      done: !homepage?.needsReview,
      blocking: false,
      href: '/admin/globals/homepage',
    },
    {
      id: 'orderEmail',
      label: 'Powiadomienia o zamówieniach',
      hint: 'Adres, na który sklep wysyła informację o każdym nowym zamówieniu.',
      done: filled(settings?.orders?.notificationEmail),
      blocking: false,
      href: '/admin/globals/settings',
    },
    {
      id: 'online',
      label: 'Płatności online (opcjonalnie)',
      hint: 'BLIK, szybkie przelewy i karty przez Stripe. Sklep działa też bez nich: z przelewem tradycyjnym i płatnością przy odbiorze.',
      done: Boolean(payments?.onlineEnabled) && isOnlinePaymentConfigured(),
      blocking: false,
      href: '/admin/globals/settings',
    },
  ]
}

export function blockingProblems(checklist: ChecklistItem[]): ChecklistItem[] {
  return checklist.filter((item) => item.blocking && !item.done)
}
