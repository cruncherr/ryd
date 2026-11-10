import type { CollectionConfig } from 'payload'

import { activeOrAdmin, isAdmin } from '@/access'
import { amountField } from '@/fields/amount'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'

export const ShippingMethods: CollectionConfig = {
  slug: 'shipping-methods',
  labels: { singular: 'Metoda dostawy', plural: 'Metody dostawy' },
  admin: {
    useAsTitle: 'name',
    group: 'Sklep',
    defaultColumns: ['name', 'price', 'freeFrom', 'active', 'sortOrder'],
    description: 'Sposoby dostawy, które klient wybiera przy składaniu zamówienia.',
  },
  defaultSort: 'sortOrder',
  access: {
    read: activeOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nazwa',
      required: true,
      admin: { placeholder: 'np. Dostawa kurierska z wniesieniem' },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Opis dla klienta',
      admin: {
        description: 'Co obejmuje dostawa: wniesienie, montaż, kontakt telefoniczny przed dostawą itp.',
      },
    },
    {
      type: 'row',
      fields: [
        amountField({
          name: 'price',
          label: 'Cena dostawy (zł brutto)',
          required: true,
          description: 'Wpisz 0, jeśli dostawa jest bezpłatna.',
          width: '50%',
        }),
        amountField({
          name: 'freeFrom',
          label: 'Darmowa od wartości koszyka (zł)',
          description: 'Zostaw puste, jeśli nie ma progu darmowej dostawy.',
          width: '50%',
        }),
      ],
    },
    {
      name: 'deliveryTime',
      type: 'text',
      label: 'Czas dostawy',
      admin: { placeholder: 'np. 2–4 dni robocze od wysyłki' },
    },
    {
      name: 'allowCod',
      type: 'checkbox',
      label: 'Możliwa płatność przy odbiorze',
      defaultValue: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Aktywna (widoczna w zamówieniu)',
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
        description: 'Odznacz, gdy ustawisz prawdziwą cenę i opis tej dostawy.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
}
