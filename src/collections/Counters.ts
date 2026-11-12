import type { CollectionConfig } from 'payload'

import { isAdmin, nobody } from '@/access'

/**
 * Liczniki sklepu — obecnie jeden: numer ostatniego zamówienia.
 * Tabela jest ukryta w panelu i zmieniana wyłącznie przez serwer (patrz src/lib/orders/number.ts),
 * dzięki czemu numery zamówień rosną po kolei i nigdy się nie powtarzają,
 * nawet gdy dwóch klientów zamawia w tej samej sekundzie albo któreś zamówienie zostanie usunięte.
 */
export const Counters: CollectionConfig = {
  slug: 'counters',
  admin: { hidden: true },
  access: {
    read: isAdmin,
    create: nobody,
    update: nobody,
    delete: nobody,
  },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'value', type: 'number', required: true, defaultValue: 0 },
  ],
}
