import type { Field, GlobalConfig } from 'payload'

import { anyone, isAdmin } from '@/access'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'

const heading = (titlePlaceholder: string): Field[] => [
  {
    name: 'eyebrow',
    type: 'text',
    label: 'Nadtytuł',
    maxLength: 40,
    admin: { description: 'Małe słowo nad nagłówkiem. Pole opcjonalne.' },
  },
  {
    name: 'title',
    type: 'text',
    label: 'Nagłówek',
    maxLength: 90,
    admin: {
      placeholder: titlePlaceholder,
      description: 'Słowo wpisane między gwiazdkami, np. *dłużej*, zostanie wyróżnione kursywą.',
    },
  },
  {
    name: 'text',
    type: 'textarea',
    label: 'Tekst',
    maxLength: 420,
  },
]

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Strona główna',
  admin: {
    group: 'Treści',
    description: 'Teksty i zdjęcia na stronie głównej sklepu. Sekcja bez nagłówka nie jest wyświetlana.',
  },
  access: {
    read: anyone,
    update: isAdmin,
  },
  fields: [
    {
      name: 'needsReview',
      type: 'checkbox',
      label: 'Teksty przykładowe — do sprawdzenia',
      defaultValue: false,
      admin: {
        description:
          'Zaznaczone, dopóki strona główna ma teksty przygotowane automatycznie. Odznacz, gdy dopasujesz je do swojej oferty.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Góra strony',
          fields: [
            {
              name: 'hero',
              type: 'group',
              label: 'Pierwszy ekran',
              fields: [
                ...heading('np. Sofa, do której chce się wracać'),
                {
                  type: 'row',
                  fields: [
                    { name: 'primaryLabel', type: 'text', label: 'Główny przycisk — napis', maxLength: 28 },
                    { name: 'primaryUrl', type: 'text', label: 'Główny przycisk — adres', admin: { placeholder: '/sklep' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'secondaryLabel', type: 'text', label: 'Drugi przycisk — napis', maxLength: 28 },
                    { name: 'secondaryUrl', type: 'text', label: 'Drugi przycisk — adres', admin: { placeholder: '/#jakosc' } },
                  ],
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Zdjęcie',
                  admin: { description: 'Najlepiej zdjęcie mebla na białym tle, ujęcie pod kątem.' },
                },
              ],
            },
            {
              name: 'usps',
              type: 'array',
              label: 'Atuty pod pierwszym ekranem',
              labels: { singular: 'Atut', plural: 'Atuty' },
              maxRows: 4,
              admin: {
                description: 'Trzy–cztery krótkie obietnice, które możesz spełnić, np. zwrot, dostawa, gwarancja.',
                components: { RowLabel: '@/components/admin/RowLabels#TitleRowLabel' },
              },
              fields: [
                { name: 'title', type: 'text', label: 'Atut', required: true, maxLength: 40 },
                { name: 'text', type: 'text', label: 'Dopowiedzenie', maxLength: 90 },
              ],
            },
          ],
        },
        {
          label: 'Kolekcja',
          fields: [
            {
              name: 'collection',
              type: 'group',
              label: 'Sekcja z produktami',
              admin: { description: 'Pokazuje produkty z zaznaczoną opcją „Pokaż na stronie głównej”.' },
              fields: heading('np. Kolekcja'),
            },
          ],
        },
        {
          label: 'Pokaz funkcji',
          fields: [
            {
              name: 'functions',
              type: 'group',
              label: 'Mebel w kilku ustawieniach',
              fields: [
                ...heading('np. Jedna sofa, trzy zastosowania'),
                {
                  name: 'product',
                  type: 'relationship',
                  relationTo: 'products',
                  label: 'Produkt z pokazem funkcji',
                  admin: {
                    description: 'Wybierz produkt, który ma uzupełnione widoki w zakładce „Zdjęcia i kolory → Pokaz funkcji”.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Jakość',
          fields: [
            {
              name: 'quality',
              type: 'group',
              label: 'Sekcja o jakości wykonania',
              fields: [
                ...heading('np. Jakość, którą czuć od pierwszego dotyku'),
                {
                  name: 'items',
                  type: 'array',
                  label: 'Elementy',
                  labels: { singular: 'Element', plural: 'Elementy' },
                  maxRows: 3,
                  admin: {
                    components: { RowLabel: '@/components/admin/RowLabels#TitleRowLabel' },
                  },
                  fields: [
                    { name: 'title', type: 'text', label: 'Tytuł', required: true, maxLength: 40 },
                    { name: 'text', type: 'textarea', label: 'Opis', maxLength: 260 },
                    {
                      name: 'image',
                      type: 'upload',
                      relationTo: 'media',
                      label: 'Zdjęcie detalu',
                      admin: { description: 'Zbliżenie tkaniny, szwu lub wypełnienia. Proporcja 4:5 lub kwadrat.' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'O marce',
          fields: [
            {
              name: 'story',
              type: 'group',
              label: 'Krótko o marce',
              fields: [
                ...heading('np. Robimy meble, których sami chcielibyśmy używać'),
                {
                  type: 'row',
                  fields: [
                    { name: 'linkLabel', type: 'text', label: 'Link — napis', maxLength: 28 },
                    { name: 'linkUrl', type: 'text', label: 'Link — adres', admin: { placeholder: '/o-nas' } },
                  ],
                },
              ],
            },
            {
              name: 'contact',
              type: 'group',
              label: 'Zachęta do kontaktu',
              admin: { description: 'Telefon i e-mail są pobierane z Ustawień sklepu.' },
              fields: [
                { name: 'title', type: 'text', label: 'Nagłówek', maxLength: 90 },
                { name: 'text', type: 'textarea', label: 'Tekst', maxLength: 300 },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateGlobalAfterChange],
  },
}
