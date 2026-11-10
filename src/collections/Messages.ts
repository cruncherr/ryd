import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: { singular: 'Wiadomość', plural: 'Wiadomości' },
  admin: {
    useAsTitle: 'name',
    group: 'Sprzedaż',
    defaultColumns: ['name', 'email', 'createdAt', 'handled'],
    description: 'Zapytania wysłane przez formularz kontaktowy na stronie.',
  },
  defaultSort: '-createdAt',
  // Wiadomości zapisuje wyłącznie serwer sklepu (formularz kontaktowy), nigdy przeglądarka klienta.
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Imię i nazwisko', required: true },
        { name: 'email', type: 'email', label: 'E-mail', required: true },
        { name: 'phone', type: 'text', label: 'Telefon' },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Treść wiadomości',
      required: true,
    },
    {
      name: 'source',
      type: 'text',
      label: 'Wysłano ze strony',
      admin: { readOnly: true },
    },
    {
      name: 'handled',
      type: 'checkbox',
      label: 'Załatwione',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
