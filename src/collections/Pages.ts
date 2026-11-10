import type { CollectionConfig } from 'payload'

import { isAdmin, publishedOrAdmin } from '@/access'
import { polishSlugField } from '@/fields/slug'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Strona', plural: 'Strony' },
  admin: {
    useAsTitle: 'title',
    group: 'Treści',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description:
      'Strony informacyjne: O nas, Regulamin, Polityka prywatności, Dostawa i płatności, Zwroty i reklamacje.',
  },
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  versions: {
    drafts: true,
    maxPerDoc: 20,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Tytuł',
      required: true,
    },
    polishSlugField('title'),
    {
      name: 'lead',
      type: 'textarea',
      label: 'Wstęp',
      admin: {
        description: 'Jedno–dwa zdania pod tytułem. Pole opcjonalne.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Treść',
    },
    {
      name: 'showCompanyDetails',
      type: 'checkbox',
      label: 'Pokaż dane sprzedawcy pod treścią',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Dane firmy z Ustawień sklepu (nazwa, adres, NIP, kontakt) wyświetlą się automatycznie. Przydatne w regulaminie i polityce prywatności.',
      },
    },
    {
      name: 'needsReview',
      type: 'checkbox',
      label: 'Treść przykładowa — do sprawdzenia',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Zaznaczone przy szkicach przygotowanych automatycznie. Odznacz po przeczytaniu i dostosowaniu treści do swojej firmy.',
      },
    },
    {
      type: 'collapsible',
      label: 'Wyszukiwarki (SEO)',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          label: 'Tytuł w wynikach wyszukiwania',
          admin: { description: 'Zostaw puste, aby użyć tytułu strony.' },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Opis w wynikach wyszukiwania',
          maxLength: 200,
          admin: { description: 'Najlepiej 120–160 znaków. Zostaw puste, aby użyć wstępu.' },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
}
