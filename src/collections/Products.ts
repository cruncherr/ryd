import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { isAdmin, nobodyField, publishedOrAdmin } from '@/access'
import { amountField } from '@/fields/amount'
import { polishSlugField } from '@/fields/slug'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { AVAILABILITY } from '@/lib/constants'
import { effectivePrice } from '@/lib/money'
import { appendPriceHistory, type PriceHistoryEntry } from '@/lib/priceHistory'

/**
 * Zapisuje historię cen opublikowanego produktu. Dzięki niej sklep sam pokazuje
 * przy obniżce „najniższą cenę z 30 dni przed obniżką".
 */
const recordPriceHistory: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const merged = { ...(originalDoc ?? {}), ...data }
  if (merged._status !== 'published' || typeof merged.price !== 'number') return data

  const history = (originalDoc?.priceHistory ?? []) as PriceHistoryEntry[]
  data.priceHistory = appendPriceHistory(
    history,
    effectivePrice({ price: merged.price, salePrice: merged.salePrice }),
  )
  return data
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Produkt', plural: 'Produkty' },
  admin: {
    useAsTitle: 'title',
    group: 'Sklep',
    defaultColumns: ['title', 'category', 'price', 'salePrice', 'availability', '_status'],
    listSearchableFields: ['title', 'slug'],
    description:
      'Meble w ofercie. Zapisz jako szkic, aby przygotować produkt spokojnie; w sklepie widoczne są tylko produkty opublikowane.',
  },
  defaultSort: 'sortOrder',
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Nazwa produktu',
      required: true,
      admin: { placeholder: 'np. Sofa rozkładana Lund' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Podstawowe',
          fields: [
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              label: 'Kategoria',
              required: true,
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              label: 'Krótki opis',
              maxLength: 240,
              admin: {
                description:
                  'Jedno–dwa zdania pod nazwą produktu. Trafia też do wyników wyszukiwania i udostępnień.',
              },
            },
            {
              type: 'row',
              fields: [
                amountField({
                  name: 'price',
                  label: 'Cena (zł brutto)',
                  required: true,
                  description: 'Cena regularna z VAT.',
                  width: '50%',
                }),
                {
                  ...amountField({
                    name: 'salePrice',
                    label: 'Cena promocyjna (zł brutto)',
                    description:
                      'Zostaw puste, jeśli nie ma promocji. Sklep sam pokaże przekreśloną cenę regularną i najniższą cenę z 30 dni.',
                    width: '50%',
                  }),
                  validate: (value: unknown, { siblingData }: { siblingData: unknown }) => {
                    if (value === null || value === undefined || value === '') return true
                    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
                      return 'Podaj kwotę większą od zera albo zostaw pole puste.'
                    }
                    const price = (siblingData as { price?: unknown })?.price
                    if (typeof price === 'number' && value >= price) {
                      return 'Cena promocyjna musi być niższa od ceny regularnej.'
                    }
                    return true
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'availability',
                  type: 'select',
                  label: 'Dostępność',
                  required: true,
                  defaultValue: 'made_to_order',
                  options: AVAILABILITY.map(({ value, label }) => ({ value, label })),
                  admin: { width: '40%' },
                },
                {
                  name: 'leadTime',
                  type: 'text',
                  label: 'Czas realizacji',
                  admin: {
                    placeholder: 'np. Wysyłka w 3–5 tygodni',
                    description: 'Wyświetlany przy przycisku „Dodaj do koszyka".',
                    width: '60%',
                  },
                },
              ],
            },
            {
              name: 'badge',
              type: 'text',
              label: 'Wyróżnik',
              maxLength: 24,
              admin: {
                placeholder: 'np. Nowość',
                description: 'Krótka etykieta na zdjęciu produktu. Pole opcjonalne.',
              },
            },
          ],
        },
        {
          label: 'Zdjęcia i kolory',
          fields: [
            {
              name: 'variants',
              type: 'array',
              label: 'Kolory / tkaniny',
              labels: { singular: 'Kolor', plural: 'Kolory' },
              required: true,
              minRows: 1,
              admin: {
                description:
                  'Każdy kolor ma własne zdjęcia. Pierwszy kolor i jego pierwsze zdjęcie są pokazywane domyślnie.',
                initCollapsed: false,
                components: {
                  RowLabel: '@/components/admin/RowLabels#VariantRowLabel',
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      label: 'Nazwa koloru',
                      required: true,
                      admin: { placeholder: 'np. Grafitowy', width: '40%' },
                    },
                    {
                      name: 'fabric',
                      type: 'text',
                      label: 'Tkanina',
                      admin: { placeholder: 'np. welur łatwoczyszczący', width: '40%' },
                    },
                    {
                      name: 'swatchColor',
                      type: 'text',
                      label: 'Kolor próbki',
                      required: true,
                      defaultValue: '#4A4D52',
                      admin: {
                        width: '20%',
                        components: {
                          Field: '@/components/admin/ColorField',
                        },
                      },
                      validate: (value: unknown) =>
                        typeof value === 'string' && HEX_COLOR.test(value)
                          ? true
                          : 'Podaj kolor w zapisie #RRGGBB, np. #4A4D52.',
                    },
                  ],
                },
                {
                  name: 'images',
                  type: 'upload',
                  relationTo: 'media',
                  hasMany: true,
                  required: true,
                  minRows: 1,
                  label: 'Zdjęcia w tym kolorze',
                  admin: {
                    description:
                      'Kolejność zdjęć możesz zmieniać, przeciągając je. Pierwsze zdjęcie jest główne, drugie pojawia się po najechaniu na produkt.',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'sku',
                      type: 'text',
                      label: 'Symbol (SKU)',
                      admin: {
                        description: 'Twój wewnętrzny kod produktu. Pole opcjonalne.',
                        width: '50%',
                      },
                    },
                    {
                      name: 'available',
                      type: 'checkbox',
                      label: 'Kolor dostępny w sprzedaży',
                      defaultValue: true,
                      admin: { width: '50%', style: { alignSelf: 'flex-end' } },
                    },
                  ],
                },
              ],
            },
            {
              name: 'functionViews',
              type: 'array',
              label: 'Pokaz funkcji',
              labels: { singular: 'Widok', plural: 'Widoki' },
              maxRows: 6,
              admin: {
                description:
                  'Zdjęcia zrobione z tego samego miejsca, pokazujące mebel w kolejnych ustawieniach (np. sofa, zagłówki w górze, łóżko). W sklepie klient przełącza je jednym kliknięciem. Dodaj co najmniej dwa widoki.',
                initCollapsed: true,
                components: {
                  RowLabel: '@/components/admin/RowLabels#FunctionViewRowLabel',
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      label: 'Nazwa ustawienia',
                      required: true,
                      maxLength: 28,
                      admin: { placeholder: 'np. Łóżko', width: '40%' },
                    },
                    {
                      name: 'caption',
                      type: 'text',
                      label: 'Podpis',
                      maxLength: 120,
                      admin: {
                        placeholder: 'np. Powierzchnia spania dla dwóch osób',
                        width: '60%',
                      },
                    },
                  ],
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                  label: 'Zdjęcie',
                },
              ],
            },
          ],
        },
        {
          label: 'Opis i wymiary',
          fields: [
            {
              name: 'features',
              type: 'array',
              label: 'Najważniejsze cechy',
              labels: { singular: 'Cecha', plural: 'Cechy' },
              maxRows: 6,
              admin: {
                description: 'Trzy–cztery powody, dla których warto wybrać ten mebel.',
                initCollapsed: true,
                components: {
                  RowLabel: '@/components/admin/RowLabels#TitleRowLabel',
                },
              },
              fields: [
                { name: 'title', type: 'text', label: 'Cecha', required: true, maxLength: 60 },
                { name: 'text', type: 'textarea', label: 'Wyjaśnienie', maxLength: 240 },
              ],
            },
            {
              name: 'description',
              type: 'richText',
              label: 'Opis produktu',
            },
            {
              name: 'dimensions',
              type: 'group',
              label: 'Wymiary (cm)',
              admin: {
                description:
                  'Wpisz to, co dotyczy tego mebla; puste pola nie będą pokazywane. Klienci meblowi sprawdzają wymiary przed zakupem — warto podać komplet.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'width', type: 'number', label: 'Szerokość', min: 0, admin: { width: '33%' } },
                    { name: 'depth', type: 'number', label: 'Głębokość', min: 0, admin: { width: '33%' } },
                    { name: 'height', type: 'number', label: 'Wysokość', min: 0, admin: { width: '33%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'seatHeight', type: 'number', label: 'Wysokość siedziska', min: 0, admin: { width: '50%' } },
                    { name: 'seatDepth', type: 'number', label: 'Głębokość siedziska', min: 0, admin: { width: '50%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'sleepWidth', type: 'number', label: 'Powierzchnia spania — szerokość', min: 0, admin: { width: '50%' } },
                    { name: 'sleepLength', type: 'number', label: 'Powierzchnia spania — długość', min: 0, admin: { width: '50%' } },
                  ],
                },
              ],
            },
            {
              name: 'specs',
              type: 'array',
              label: 'Dane techniczne',
              labels: { singular: 'Pozycja', plural: 'Pozycje' },
              admin: {
                description:
                  'Dowolne pary „nazwa — wartość", np. Wypełnienie siedziska — pianka wysokoelastyczna; Stelaż — drewno i płyta; Funkcja spania — tak.',
                initCollapsed: true,
                components: {
                  RowLabel: '@/components/admin/RowLabels#SpecRowLabel',
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', label: 'Nazwa', required: true, admin: { width: '40%' } },
                    { name: 'value', type: 'text', label: 'Wartość', required: true, admin: { width: '60%' } },
                  ],
                },
              ],
            },
            {
              name: 'materials',
              type: 'textarea',
              label: 'Materiały i wypełnienie',
              admin: {
                description: 'Z czego zrobiony jest mebel: stelaż, wypełnienie, tkanina. Każdy akapit w nowej linii.',
              },
            },
            {
              name: 'care',
              type: 'textarea',
              label: 'Pielęgnacja',
              admin: { description: 'Jak dbać o tkaninę i mebel.' },
            },
          ],
        },
        {
          label: 'Producent i bezpieczeństwo',
          description:
            'Przepisy o bezpieczeństwie produktów (GPSR) wymagają podania w ofercie danych producenta. Domyślnie sklep pokazuje dane z Ustawień sklepu.',
          fields: [
            {
              name: 'manufacturer',
              type: 'group',
              label: 'Producent tego produktu',
              admin: {
                description: 'Wypełnij tylko wtedy, gdy ten produkt ma innego producenta niż podany w Ustawieniach sklepu.',
              },
              fields: [
                { name: 'name', type: 'text', label: 'Nazwa producenta' },
                { name: 'address', type: 'text', label: 'Adres producenta' },
                { name: 'email', type: 'email', label: 'E-mail kontaktowy producenta' },
              ],
            },
            {
              name: 'safetyInfo',
              type: 'textarea',
              label: 'Informacje o bezpieczeństwie',
              admin: {
                description: 'Ostrzeżenia i zalecenia dotyczące bezpiecznego użytkowania, jeśli są wymagane.',
              },
            },
          ],
        },
        {
          label: 'Wyszukiwarki (SEO)',
          fields: [
            {
              name: 'metaTitle',
              type: 'text',
              label: 'Tytuł w wynikach wyszukiwania',
              admin: { description: 'Zostaw puste, aby użyć nazwy produktu.' },
            },
            {
              name: 'metaDescription',
              type: 'textarea',
              label: 'Opis w wynikach wyszukiwania',
              maxLength: 200,
              admin: { description: 'Najlepiej 120–160 znaków. Zostaw puste, aby użyć krótkiego opisu.' },
            },
          ],
        },
      ],
    },
    polishSlugField('title'),
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Pokaż na stronie głównej',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Kolejność',
      defaultValue: 10,
      admin: {
        position: 'sidebar',
        description: 'Mniejsza liczba = wyżej na liście.',
      },
    },
    {
      name: 'sampleData',
      type: 'checkbox',
      label: 'Dane przykładowe — do sprawdzenia',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Zaznaczone przy produktach przygotowanych automatycznie ze zdjęć. Odznacz, gdy sprawdzisz nazwę, cenę, wymiary i opis.',
      },
    },
    {
      name: 'priceHistory',
      type: 'array',
      label: 'Historia cen',
      labels: { singular: 'Zmiana ceny', plural: 'Zmiany ceny' },
      access: {
        create: nobodyField,
        update: nobodyField,
      },
      admin: {
        readOnly: true,
        initCollapsed: true,
        position: 'sidebar',
        description:
          'Uzupełnia się sama przy każdej zmianie ceny opublikowanego produktu. Służy do pokazania najniższej ceny z 30 dni przed obniżką.',
      },
      fields: [
        { name: 'date', type: 'date', label: 'Od kiedy', required: true },
        { name: 'price', type: 'number', label: 'Cena (zł)', required: true },
      ],
    },
  ],
  hooks: {
    beforeChange: [recordPriceHistory],
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
}
