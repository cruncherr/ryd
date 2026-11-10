import type { GlobalConfig, PayloadRequest } from 'payload'

import { anyone, isAdmin } from '@/access'
import { amountField } from '@/fields/amount'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'
import { blockingProblems, getLaunchChecklist } from '@/lib/launch'
import type { Setting } from '@/payload-types'

const navFields = [
  {
    type: 'row' as const,
    fields: [
      { name: 'label', type: 'text' as const, label: 'Nazwa w menu', required: true, admin: { width: '40%' } },
      {
        name: 'url',
        type: 'text' as const,
        label: 'Adres',
        required: true,
        admin: { width: '60%', placeholder: 'np. /sklep albo /o-nas' },
      },
    ],
  },
]

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Ustawienia sklepu',
  admin: {
    group: 'Administracja',
    description: 'Nazwa sklepu, dane firmy, płatności i menu. Zmiany widać w sklepie od razu po zapisaniu.',
  },
  access: {
    // Ustawienia nie zawierają sekretów (hasła i klucze są w zmiennych środowiskowych).
    read: anyone,
    update: isAdmin,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Sklep',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'storeName',
                  type: 'text',
                  label: 'Nazwa sklepu',
                  required: true,
                  defaultValue: 'RYD',
                  admin: { width: '40%', description: 'Wyświetlana jako logo w nagłówku i w e-mailach.' },
                },
                {
                  name: 'tagline',
                  type: 'text',
                  label: 'Hasło pod nazwą',
                  defaultValue: 'Meble tapicerowane',
                  admin: { width: '60%' },
                },
              ],
            },
            {
              name: 'storeStatus',
              type: 'select',
              label: 'Stan sklepu',
              required: true,
              defaultValue: 'preparing',
              options: [
                { value: 'preparing', label: 'W przygotowaniu — tryb testowy' },
                { value: 'live', label: 'Uruchomiony — sprzedaż włączona' },
              ],
              admin: {
                description:
                  'W trybie testowym sklep pokazuje pasek z informacją, zamówienia są oznaczane jako testowe, a wyszukiwarki nie indeksują strony. Uruchomienie jest możliwe po uzupełnieniu listy kontrolnej z pulpitu.',
              },
              validate: async (value: unknown, { data, req }: { data: unknown; req: PayloadRequest }) => {
                if (value !== 'live' && value !== 'preparing') return 'Wybierz stan sklepu.'
                if (value !== 'live') return true
                const checklist = await getLaunchChecklist(req.payload, data as Partial<Setting>)
                const problems = blockingProblems(checklist)
                if (problems.length === 0) return true
                return `Sklepu nie można jeszcze uruchomić. Do uzupełnienia: ${problems
                  .map((item) => item.label)
                  .join('; ')}.`
              },
            },
            {
              name: 'announcement',
              type: 'text',
              label: 'Pasek ogłoszeń',
              maxLength: 120,
              admin: {
                description: 'Krótka informacja nad menu, np. „Darmowa dostawa od 3000 zł". Puste = pasek ukryty.',
              },
            },
            {
              name: 'contact',
              type: 'group',
              label: 'Kontakt dla klientów',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'email', type: 'email', label: 'E-mail' },
                    { name: 'phone', type: 'text', label: 'Telefon', admin: { placeholder: 'np. +48 600 000 000' } },
                  ],
                },
                {
                  name: 'hours',
                  type: 'text',
                  label: 'Godziny kontaktu',
                  admin: { placeholder: 'np. pon.–pt. 9:00–17:00' },
                },
              ],
            },
            {
              name: 'social',
              type: 'group',
              label: 'Media społecznościowe',
              admin: { description: 'Pełne adresy profili. Puste pola nie są pokazywane.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'instagram', type: 'text', label: 'Instagram' },
                    { name: 'facebook', type: 'text', label: 'Facebook' },
                    { name: 'pinterest', type: 'text', label: 'Pinterest' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Firma',
          description: 'Dane sprzedawcy wymagane przez prawo. Trafiają do regulaminu, stopki sklepu i e-maili.',
          fields: [
            {
              name: 'company',
              type: 'group',
              label: 'Dane sprzedawcy',
              fields: [
                {
                  name: 'legalName',
                  type: 'text',
                  label: 'Pełna nazwa firmy',
                  admin: { placeholder: 'np. Jan Kowalski Meble albo Meble Sp. z o.o.' },
                },
                { name: 'street', type: 'text', label: 'Ulica i numer' },
                {
                  type: 'row',
                  fields: [
                    { name: 'postalCode', type: 'text', label: 'Kod pocztowy', admin: { width: '30%' } },
                    { name: 'city', type: 'text', label: 'Miejscowość', admin: { width: '70%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'nip', type: 'text', label: 'NIP' },
                    { name: 'regon', type: 'text', label: 'REGON' },
                  ],
                },
                {
                  name: 'registry',
                  type: 'text',
                  label: 'Wpis do rejestru',
                  admin: {
                    placeholder: 'np. CEIDG albo KRS 0000000000, Sąd Rejonowy…',
                    description: 'Dla spółek: numer KRS i sąd rejestrowy. Dla działalności jednoosobowej: CEIDG.',
                  },
                },
              ],
            },
            {
              name: 'manufacturer',
              type: 'group',
              label: 'Producent mebli (GPSR)',
              admin: {
                description:
                  'Przepisy o bezpieczeństwie produktów wymagają podania w ofercie nazwy, adresu i kontaktu elektronicznego producenta.',
              },
              fields: [
                {
                  name: 'sameAsSeller',
                  type: 'checkbox',
                  label: 'Producentem jest sprzedawca (dane firmy powyżej)',
                  defaultValue: false,
                },
                {
                  type: 'row',
                  admin: { condition: (_, siblingData) => !siblingData?.sameAsSeller },
                  fields: [
                    { name: 'name', type: 'text', label: 'Nazwa producenta' },
                    { name: 'email', type: 'email', label: 'E-mail producenta' },
                  ],
                },
                {
                  name: 'address',
                  type: 'text',
                  label: 'Adres producenta',
                  admin: { condition: (_, siblingData) => !siblingData?.sameAsSeller },
                },
              ],
            },
          ],
        },
        {
          label: 'Zamówienia i płatności',
          fields: [
            {
              name: 'orders',
              type: 'group',
              label: 'Zamówienia',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'prefix',
                      type: 'text',
                      label: 'Początek numeru zamówienia',
                      defaultValue: 'RYD',
                      maxLength: 8,
                      admin: { width: '30%', description: 'Np. RYD da numery RYD-1001, RYD-1002…' },
                    },
                    {
                      name: 'notificationEmail',
                      type: 'email',
                      label: 'E-mail do powiadomień o zamówieniach',
                      admin: { width: '70%', description: 'Na ten adres sklep wysyła każde nowe zamówienie.' },
                    },
                  ],
                },
              ],
            },
            {
              name: 'payments',
              type: 'group',
              label: 'Formy płatności',
              fields: [
                {
                  name: 'transferEnabled',
                  type: 'checkbox',
                  label: 'Przelew tradycyjny',
                  defaultValue: true,
                },
                {
                  type: 'row',
                  admin: { condition: (_, siblingData) => Boolean(siblingData?.transferEnabled) },
                  fields: [
                    {
                      name: 'bankAccount',
                      type: 'text',
                      label: 'Numer rachunku bankowego',
                      admin: { width: '60%', placeholder: 'PL00 0000 0000 0000 0000 0000 0000' },
                    },
                    { name: 'bankName', type: 'text', label: 'Nazwa banku', admin: { width: '40%' } },
                  ],
                },
                {
                  name: 'codEnabled',
                  type: 'checkbox',
                  label: 'Płatność przy odbiorze',
                  defaultValue: true,
                },
                {
                  ...amountField({
                    name: 'codFee',
                    label: 'Dopłata za płatność przy odbiorze (zł)',
                    defaultValue: 0,
                    description: 'Wpisz 0, jeśli nie pobierasz dopłaty.',
                  }),
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.codEnabled),
                    description: 'Wpisz 0, jeśli nie pobierasz dopłaty.',
                  },
                },
                {
                  name: 'onlineEnabled',
                  type: 'checkbox',
                  label: 'Płatności online (BLIK, szybki przelew, karta)',
                  defaultValue: false,
                  admin: {
                    description:
                      'Działa po podłączeniu konta Stripe w ustawieniach hostingu (klucze STRIPE_SECRET_KEY i STRIPE_WEBHOOK_SECRET). Bez kluczy ta opcja nie pojawi się w zamówieniu.',
                  },
                },
              ],
            },
            {
              name: 'priceNote',
              type: 'text',
              label: 'Dopisek przy cenie',
              defaultValue: 'Cena zawiera VAT',
              admin: { description: 'Jeśli nie jesteś płatnikiem VAT, zmień np. na „Sprzedawca zwolniony z VAT".' },
            },
          ],
        },
        {
          label: 'Menu i stopka',
          fields: [
            {
              name: 'headerNav',
              type: 'array',
              label: 'Menu główne',
              labels: { singular: 'Pozycja menu', plural: 'Pozycje menu' },
              maxRows: 6,
              admin: {
                components: { RowLabel: '@/components/admin/RowLabels#NavRowLabel' },
              },
              fields: navFields,
            },
            {
              name: 'footerNav',
              type: 'array',
              label: 'Linki w stopce — Informacje',
              labels: { singular: 'Link', plural: 'Linki' },
              maxRows: 10,
              admin: {
                components: { RowLabel: '@/components/admin/RowLabels#NavRowLabel' },
              },
              fields: navFields,
            },
            {
              name: 'footerText',
              type: 'textarea',
              label: 'Krótki tekst w stopce',
              maxLength: 220,
            },
          ],
        },
        {
          label: 'Wyszukiwarki i analityka',
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: 'Wyszukiwarki (SEO)',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  label: 'Tytuł strony głównej',
                  admin: { description: 'Widoczny w zakładce przeglądarki i w Google.' },
                },
                {
                  name: 'description',
                  type: 'textarea',
                  label: 'Opis sklepu',
                  maxLength: 200,
                  admin: { description: 'Najlepiej 120–160 znaków.' },
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Zdjęcie przy udostępnianiu linku',
                },
              ],
            },
            {
              name: 'analytics',
              type: 'group',
              label: 'Analityka',
              admin: {
                description:
                  'Po wpisaniu identyfikatora sklep pokaże klientom baner zgody na pliki cookie i włączy pomiar dopiero po zgodzie.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'ga4Id',
                      type: 'text',
                      label: 'Google Analytics 4',
                      admin: { placeholder: 'G-XXXXXXXXXX' },
                      validate: (value: unknown) =>
                        !value || (typeof value === 'string' && /^G-[A-Z0-9]{6,}$/.test(value))
                          ? true
                          : 'Identyfikator ma postać G-XXXXXXXXXX.',
                    },
                    {
                      name: 'metaPixelId',
                      type: 'text',
                      label: 'Meta Pixel (Facebook, Instagram)',
                      admin: { placeholder: 'np. 123456789012345' },
                      validate: (value: unknown) =>
                        !value || (typeof value === 'string' && /^\d{8,20}$/.test(value))
                          ? true
                          : 'Identyfikator piksela składa się z samych cyfr.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    // Znacznik: dane startowe zostały już wgrane (żeby kolejne wdrożenia ich nie przywracały).
    { name: 'seededAt', type: 'date', admin: { hidden: true } },
  ],
  hooks: {
    afterChange: [revalidateGlobalAfterChange],
  },
}
