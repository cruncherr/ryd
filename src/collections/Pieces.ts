import { randomBytes } from 'crypto'

import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { isAdmin } from '@/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { editionInfo, pieceLabel } from '@/lib/editions'

/**
 * Uzupełnia opis egzemplarza („Sofa Bergen · Nº 07 / 50”) i token certyfikatu, a przy wpisie
 * dodanym ręcznie w panelu pilnuje, żeby numer mieścił się w nakładzie modelu.
 */
const prepare: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const productId = data.product ?? originalDoc?.product
  const number = data.number ?? originalDoc?.number
  const id = typeof productId === 'object' && productId !== null ? productId.id : productId

  if (id && typeof number === 'number') {
    const product = await req.payload.findByID({ collection: 'products', id, depth: 0, draft: false, req }).catch(() => null)
    if (!product) throw new Error('Nie znaleziono modelu, do którego należy ten egzemplarz.')
    const { size } = editionInfo(product.edition)
    if (!size) throw new Error(`Model „${product.title}” nie ma ustawionego nakładu — ustaw go w zakładce „Edycja”.`)
    if (!Number.isInteger(number) || number < 1 || number > size) {
      throw new Error(`Numer egzemplarza musi być liczbą od 1 do ${size} (nakład modelu „${product.title}”).`)
    }
    data.label = `${product.title} · ${pieceLabel(number, size)}`
  }

  if (!originalDoc?.token && !data.token) data.token = randomBytes(18).toString('base64url')
  return data
}

export const Pieces: CollectionConfig = {
  slug: 'pieces',
  labels: { singular: 'Egzemplarz', plural: 'Rejestr egzemplarzy' },
  admin: {
    useAsTitle: 'label',
    group: 'Sprzedaż',
    defaultColumns: ['label', 'owner', 'order', 'createdAt'],
    listSearchableFields: ['label', 'owner'],
    description:
      'Każdy sprzedany egzemplarz z numerem i właścicielem. Wpisy z zamówień powstają same; egzemplarz sprzedany poza sklepem (np. w salonie) dodaj ręcznie — jego numer zniknie z puli w sklepie. Anulowanie zamówienia zwalnia jego numery.',
  },
  defaultSort: '-createdAt',
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  // Jeden numer w edycji może mieć tylko jednego właściciela — pilnuje tego sama baza danych.
  indexes: [{ fields: ['product', 'number'], unique: true }],
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          label: 'Model',
          required: true,
          index: true,
          admin: { width: '60%' },
        },
        {
          name: 'number',
          type: 'number',
          label: 'Numer egzemplarza',
          required: true,
          min: 1,
          admin: { width: '40%', step: 1 },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'owner',
          type: 'text',
          label: 'Właściciel',
          admin: { width: '60%', description: 'Imię i nazwisko na certyfikacie.' },
        },
        {
          name: 'order',
          type: 'relationship',
          relationTo: 'orders',
          label: 'Zamówienie',
          index: true,
          admin: { width: '40%', description: 'Puste przy sprzedaży poza sklepem.' },
        },
      ],
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'Notatka wewnętrzna',
      admin: { description: 'Widoczna tylko w panelu.' },
    },
    {
      name: 'isTest',
      type: 'checkbox',
      label: 'Z zamówienia testowego',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Takie numery wracają do puli automatycznie, gdy uruchomisz sprzedaż.',
      },
    },
    {
      name: 'certificate',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '@/components/admin/CertificateLink#CertificateLink' },
      },
    },
    { name: 'label', type: 'text', admin: { hidden: true } },
    { name: 'token', type: 'text', unique: true, index: true, admin: { hidden: true } },
  ],
  hooks: {
    beforeChange: [prepare],
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
}
