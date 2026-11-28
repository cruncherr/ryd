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
              label: 'Liczby edycji',
              labels: { singular: 'Liczba', plural: 'Liczby' },
              maxRows: 4,
              admin: {
                description:
                  'Trzy–cztery krótkie fakty na ciemnym pasie pod pierwszym ekranem: duża liczba lub znak (np. „50”) i jedno zdanie wyjaśnienia.',
                components: { RowLabel: '@/components/admin/RowLabels#TitleRowLabel' },
              },
              fields: [
                { name: 'title', type: 'text', label: 'Liczba lub znak', required: true, maxLength: 40 },
                { name: 'text', type: 'text', label: 'Wyjaśnienie', maxLength: 90 },
              ],
            },
          ],
        },
        {
          label: 'Edycje',
          fields: [
            {
              name: 'collection',
              type: 'group',
              label: 'Sekcja z modelami',
              admin: {
                description:
                  'Modele z zaznaczoną opcją „Pokaż na stronie głównej” — każdy z numerem edycji, nakładem i liczbą wolnych egzemplarzy.',
              },
              fields: heading('np. Edycje'),
            },
          ],
        },
        {
          label: 'Przebieg zakupu',
          fields: [
            {
              name: 'steps',
              type: 'group',
              label: 'Od rezerwacji do dostawy',
              fields: [
                ...heading('np. Twoja sofa w trzech krokach'),
                {
                  name: 'items',
                  type: 'array',
                  label: 'Kroki',
                  labels: { singular: 'Krok', plural: 'Kroki' },
                  maxRows: 4,
                  admin: { components: { RowLabel: '@/components/admin/RowLabels#TitleRowLabel' } },
                  fields: [
                    { name: 'title', type: 'text', label: 'Tytuł', required: true, maxLength: 48 },
                    { name: 'text', type: 'textarea', label: 'Opis', maxLength: 220 },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Tkaniny',
          fields: [
            {
              name: 'fabrics',
              type: 'group',
              label: 'Próbnik tkanin na stronie głównej',
              admin: { description: 'Tkaniny i kolory pobierane są z Sklep → Tkaniny.' },
              fields: heading('np. Dotknij, zanim wybierzesz'),
            },
          ],
        },
        {
          label: 'Atelier',
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
          label: 'Lista prywatna',
          fields: [
            {
              name: 'privateList',
              type: 'group',
              label: 'Zapis na listę prywatną',
              admin: {
                description:
                  'Ciemny pas z formularzem: imię i e-mail osób, które chcą dostawać zaproszenia do kolejnych edycji. Zapisy trafiają do „Wiadomości”.',
              },
              fields: [
                ...heading('np. Kolejne edycje najpierw dla listy prywatnej'),
                {
                  name: 'note',
                  type: 'text',
                  label: 'Drobny dopisek pod formularzem',
                  maxLength: 160,
                  admin: { placeholder: 'np. Piszemy tylko wtedy, gdy mamy coś do pokazania.' },
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
