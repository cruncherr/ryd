import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '@/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Zdjęcie', plural: 'Zdjęcia' },
  admin: {
    group: 'Treści',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    description:
      'Biblioteka zdjęć sklepu. Najlepiej wyglądają zdjęcia produktów na białym tle, w proporcji 4:3, o szerokości co najmniej 2000 px.',
  },
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Opis zdjęcia',
      admin: {
        description:
          'Jedno zdanie o tym, co widać na zdjęciu, np. „Sofa w kolorze grafitowym, widok z przodu". Czytają je wyszukiwarki i czytniki ekranu.',
      },
    },
  ],
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 480,
        withoutEnlargement: true,
      },
    ],
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
}
