import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: { singular: 'Wiadomość', plural: 'Wiadomości' },
  admin: {
    useAsTitle: 'name',
    group: 'Sprzedaż',
    defaultColumns: ['name', 'kind', 'email', 'createdAt', 'handled'],
    description: 'Zapytania z formularza kontaktowego, zamówienia bezpłatnych próbek tkanin i zapisy na listę oczekujących.',
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
      name: 'kind',
      type: 'select',
      label: 'Rodzaj',
      required: true,
      defaultValue: 'contact',
      options: [
        { value: 'contact', label: 'Pytanie' },
        { value: 'samples', label: 'Próbki tkanin' },
        { value: 'waitlist', label: 'Lista oczekujących' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      label: 'Dotyczy modelu',
      admin: {
        readOnly: true,
        condition: (data) => data?.kind === 'waitlist',
        description: 'Puste: zapis na listę prywatną — zaproszenia do wszystkich kolejnych edycji.',
      },
    },
    {
      name: 'samples',
      type: 'textarea',
      label: 'Zamówione próbki',
      admin: { readOnly: true, condition: (data) => data?.kind === 'samples' },
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'Adres do wysyłki próbek',
      admin: { readOnly: true, condition: (data) => data?.kind === 'samples' },
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
