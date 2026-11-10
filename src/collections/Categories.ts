import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '@/access'
import { polishSlugField } from '@/fields/slug'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Kategoria', plural: 'Kategorie' },
  admin: {
    useAsTitle: 'title',
    group: 'Sklep',
    defaultColumns: ['title', 'slug', 'sortOrder'],
    description: 'Grupy produktów, np. Sofy, Narożniki, Fotele. Kategoria pojawia się w sklepie, gdy ma choć jeden opublikowany produkt.',
  },
  defaultSort: 'sortOrder',
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Nazwa kategorii',
      required: true,
    },
    polishSlugField('title'),
    {
      name: 'description',
      type: 'textarea',
      label: 'Opis kategorii',
      admin: {
        description: 'Dwa–trzy zdania wyświetlane nad listą produktów.',
      },
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
  ],
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
}
