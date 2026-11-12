import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { isAdmin } from '@/access'
import { amountField } from '@/fields/amount'
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from '@/lib/constants'

import { notifyOnStatusChange } from './hooks/notifyOnStatusChange'

/** Pełne imię i nazwisko w jednym polu — do listy zamówień i wyszukiwania. */
const fillCustomerName: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const firstName = data.firstName ?? originalDoc?.firstName ?? ''
  const lastName = data.lastName ?? originalDoc?.lastName ?? ''
  data.customerName = `${firstName} ${lastName}`.trim()
  return data
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Zamówienie', plural: 'Zamówienia' },
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Sprzedaż',
    defaultColumns: ['orderNumber', 'createdAt', 'customerName', 'total', 'status', 'paymentStatus'],
    listSearchableFields: ['orderNumber', 'customerName', 'email', 'phone'],
    description:
      'Zamówienia złożone w sklepie. Zmieniaj status w miarę realizacji — po oznaczeniu „Wysłane" klient dostaje e-mail z informacją o wysyłce.',
  },
  defaultSort: '-createdAt',
  // Zamówienia tworzy wyłącznie serwer sklepu po sprawdzeniu cen i danych.
  // Dane klientów są widoczne tylko dla zalogowanych administratorów.
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
        {
          name: 'orderNumber',
          type: 'text',
          label: 'Numer zamówienia',
          required: true,
          unique: true,
          index: true,
          admin: { readOnly: true, width: '34%' },
        },
        {
          name: 'status',
          type: 'select',
          label: 'Status realizacji',
          required: true,
          defaultValue: 'new',
          options: ORDER_STATUSES.map(({ value, label }) => ({ value, label })),
          admin: { width: '33%' },
        },
        {
          name: 'paymentStatus',
          type: 'select',
          label: 'Płatność',
          required: true,
          defaultValue: 'pending',
          options: PAYMENT_STATUSES.map(({ value, label }) => ({ value, label })),
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Zamówienie',
          fields: [
            {
              name: 'items',
              type: 'array',
              label: 'Zamówione produkty',
              labels: { singular: 'Pozycja', plural: 'Pozycje' },
              required: true,
              minRows: 1,
              admin: {
                readOnly: true,
                initCollapsed: false,
                components: {
                  RowLabel: '@/components/admin/RowLabels#OrderItemRowLabel',
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'title', type: 'text', label: 'Produkt', required: true, admin: { width: '40%' } },
                    { name: 'variantName', type: 'text', label: 'Kolor', admin: { width: '30%' } },
                    { name: 'sku', type: 'text', label: 'Symbol (SKU)', admin: { width: '30%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    amountField({ name: 'unitPrice', label: 'Cena za sztukę (zł)', required: true, width: '34%' }),
                    { name: 'quantity', type: 'number', label: 'Ilość', required: true, min: 1, admin: { width: '33%' } },
                    amountField({ name: 'lineTotal', label: 'Wartość (zł)', required: true, width: '33%' }),
                  ],
                },
                {
                  name: 'product',
                  type: 'relationship',
                  relationTo: 'products',
                  label: 'Karta produktu',
                  admin: { description: 'Powiązanie z produktem w ofercie (może zniknąć, jeśli produkt zostanie usunięty).' },
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Zdjęcie',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                amountField({ name: 'subtotal', label: 'Produkty (zł)', required: true, readOnly: true, width: '25%' }),
                amountField({ name: 'shippingCost', label: 'Dostawa (zł)', required: true, readOnly: true, width: '25%' }),
                amountField({ name: 'paymentFee', label: 'Opłata za pobranie (zł)', readOnly: true, defaultValue: 0, width: '25%' }),
                amountField({ name: 'total', label: 'Razem do zapłaty (zł)', required: true, readOnly: true, width: '25%' }),
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'paymentMethod',
                  type: 'select',
                  label: 'Sposób płatności',
                  required: true,
                  options: PAYMENT_METHODS.map(({ value, label }) => ({ value, label })),
                  admin: { readOnly: true, width: '50%' },
                },
                {
                  name: 'shippingMethodName',
                  type: 'text',
                  label: 'Sposób dostawy',
                  required: true,
                  admin: { readOnly: true, width: '50%' },
                },
              ],
            },
            {
              name: 'customerNote',
              type: 'textarea',
              label: 'Uwagi klienta',
              admin: { readOnly: true },
            },
          ],
        },
        {
          label: 'Klient i adres',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'firstName', type: 'text', label: 'Imię', required: true },
                { name: 'lastName', type: 'text', label: 'Nazwisko', required: true },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'email', type: 'email', label: 'E-mail', required: true },
                { name: 'phone', type: 'text', label: 'Telefon', required: true },
              ],
            },
            {
              name: 'shippingAddress',
              type: 'group',
              label: 'Adres dostawy',
              fields: [
                { name: 'street', type: 'text', label: 'Ulica, numer domu i mieszkania', required: true },
                {
                  type: 'row',
                  fields: [
                    { name: 'postalCode', type: 'text', label: 'Kod pocztowy', required: true, admin: { width: '30%' } },
                    { name: 'city', type: 'text', label: 'Miejscowość', required: true, admin: { width: '70%' } },
                  ],
                },
              ],
            },
            {
              name: 'invoice',
              type: 'group',
              label: 'Faktura',
              fields: [
                { name: 'wanted', type: 'checkbox', label: 'Klient prosi o fakturę na firmę', defaultValue: false },
                {
                  type: 'row',
                  admin: { condition: (_, siblingData) => Boolean(siblingData?.wanted) },
                  fields: [
                    { name: 'companyName', type: 'text', label: 'Nazwa firmy', admin: { width: '60%' } },
                    { name: 'nip', type: 'text', label: 'NIP', admin: { width: '40%' } },
                  ],
                },
                {
                  name: 'address',
                  type: 'text',
                  label: 'Adres firmy',
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.wanted),
                    description: 'Puste = taki sam jak adres dostawy.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Realizacja',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'trackingNumber',
                  type: 'text',
                  label: 'Numer przesyłki',
                  admin: { description: 'Trafi do e-maila o wysyłce.' },
                },
                {
                  name: 'trackingUrl',
                  type: 'text',
                  label: 'Link do śledzenia przesyłki',
                },
              ],
            },
            {
              name: 'internalNote',
              type: 'textarea',
              label: 'Notatka wewnętrzna',
              admin: { description: 'Widoczna tylko w panelu, klient jej nie zobaczy.' },
            },
          ],
        },
      ],
    },
    {
      name: 'isTest',
      type: 'checkbox',
      label: 'Zamówienie testowe',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Złożone, gdy sklep był w trybie przygotowania.',
      },
    },
    {
      name: 'shippingMethod',
      type: 'relationship',
      relationTo: 'shipping-methods',
      label: 'Metoda dostawy (powiązanie)',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'termsAcceptedAt',
      type: 'date',
      label: 'Akceptacja regulaminu',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    { name: 'customerName', type: 'text', label: 'Klient', admin: { hidden: true } },
    { name: 'accessToken', type: 'text', index: true, admin: { hidden: true } },
    { name: 'stripeSessionId', type: 'text', index: true, admin: { hidden: true } },
    // Identyfikator próby złożenia zamówienia — ponowne kliknięcie „Zamawiam" przy słabym łączu nie tworzy duplikatu.
    { name: 'requestId', type: 'text', index: true, admin: { hidden: true } },
    { name: 'emailsSent', type: 'json', admin: { hidden: true } },
  ],
  hooks: {
    beforeChange: [fillCustomerName],
    afterChange: [notifyOnStatusChange],
  },
}
