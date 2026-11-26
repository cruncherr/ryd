import type { CollectionConfig } from 'payload'

import { activeOrAdmin, isAdmin } from '@/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { FABRIC_FEATURES, FABRIC_TYPES } from '@/lib/constants'

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

/**
 * Próbnik tkanin: jedna biblioteka dla całego sklepu. Produkt wskazuje, które tkaniny można
 * do niego zamówić, a dopłata za tkaninę liczy się sama od ceny wybranego wymiaru.
 */
export const Fabrics: CollectionConfig = {
  slug: 'fabrics',
  labels: { singular: 'Tkanina', plural: 'Tkaniny' },
  admin: {
    useAsTitle: 'name',
    group: 'Sklep',
    defaultColumns: ['name', 'type', 'surchargePercent', 'active', 'sortOrder'],
    description:
      'Tkaniny i kolory do wyboru w konfiguratorze oraz w próbniku. W produkcie (zakładka „Konfiguracja”) zaznaczasz, które tkaniny pasują do danego modelu.',
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
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Nazwa tkaniny',
          required: true,
          admin: { placeholder: 'np. Welur hydrofobowy', width: '45%' },
        },
        {
          name: 'type',
          type: 'select',
          label: 'Rodzaj',
          required: true,
          defaultValue: 'velvet',
          options: FABRIC_TYPES.map(({ value, label }) => ({ value, label })),
          admin: { width: '25%' },
        },
        {
          name: 'surchargePercent',
          type: 'number',
          label: 'Dopłata (% ceny)',
          required: true,
          defaultValue: 0,
          min: 0,
          max: 100,
          admin: {
            width: '30%',
            step: 1,
            description: 'Np. 10 — mebel w tej tkaninie jest o 10% droższy. 0 = w cenie.',
          },
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Opis dla klienta',
      maxLength: 280,
      admin: { description: 'Jedno–dwa zdania: jaka jest w dotyku, do jakiego domu pasuje.' },
    },
    {
      name: 'features',
      type: 'select',
      label: 'Właściwości',
      hasMany: true,
      options: FABRIC_FEATURES.map(({ value, label }) => ({ value, label })),
      admin: { description: 'Zaznacz tylko to, co potwierdza karta techniczna tkaniny.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'composition',
          type: 'text',
          label: 'Skład',
          admin: { placeholder: 'np. 100% poliester', width: '50%' },
        },
        {
          name: 'martindale',
          type: 'number',
          label: 'Odporność na ścieranie (cykle Martindale)',
          min: 0,
          admin: { placeholder: 'np. 100000', width: '50%' },
        },
      ],
    },
    {
      name: 'colors',
      type: 'array',
      label: 'Kolory',
      labels: { singular: 'Kolor', plural: 'Kolory' },
      required: true,
      minRows: 1,
      admin: {
        description:
          'Kolejność jest kolejnością w sklepie. Jeśli masz zdjęcia mebla w danym kolorze, dodaj je w produkcie (Zdjęcia i kolory) pod tą samą nazwą koloru — sklep pokaże je po wyborze koloru.',
        initCollapsed: true,
        components: { RowLabel: '@/components/admin/RowLabels#FabricColorRowLabel' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', label: 'Nazwa koloru', required: true, admin: { placeholder: 'np. Grafit', width: '35%' } },
            { name: 'code', type: 'text', label: 'Numer u dostawcy', admin: { placeholder: 'np. 96', width: '20%' } },
            {
              name: 'swatchColor',
              type: 'text',
              label: 'Kolor próbki',
              required: true,
              defaultValue: '#8A8580',
              admin: { width: '25%', components: { Field: '@/components/admin/ColorField' } },
              validate: (value: unknown) =>
                typeof value === 'string' && HEX_COLOR.test(value) ? true : 'Podaj kolor w zapisie #RRGGBB, np. #4A4D52.',
            },
            {
              name: 'available',
              type: 'checkbox',
              label: 'Dostępny',
              defaultValue: true,
              admin: { width: '20%', style: { alignSelf: 'flex-end' } },
            },
          ],
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Zdjęcie tkaniny (zbliżenie)',
          admin: { description: 'Pole opcjonalne. Bez zdjęcia sklep rysuje próbkę z koloru i rodzaju tkaniny.' },
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Widoczna w sklepie',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Kolejność',
      defaultValue: 10,
      admin: { position: 'sidebar', description: 'Mniejsza liczba = wyżej na liście.' },
    },
    {
      name: 'sampleData',
      type: 'checkbox',
      label: 'Dane przykładowe — do sprawdzenia',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Zaznaczone przy tkaninach przygotowanych automatycznie. Odznacz, gdy wpiszesz prawdziwe nazwy, kolory i dopłaty.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
}
