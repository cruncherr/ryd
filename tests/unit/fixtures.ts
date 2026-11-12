import type { Order, Setting } from '@/payload-types'

/** Przykładowe zamówienie i ustawienia sklepu do testów treści e-maili i płatności. */

export const settings = {
  id: 1,
  storeName: 'RYD',
  storeStatus: 'live',
  priceNote: 'Cena zawiera VAT',
  contact: { email: 'kontakt@ryd.test', phone: '+48 22 100 20 30' },
  company: { legalName: 'RYD Meble sp. z o.o.', street: 'ul. Tapicerska 7', postalCode: '62-800', city: 'Kalisz', nip: '5252344078' },
  payments: { transferEnabled: true, bankAccount: 'PL61 1090 1014 0000 0712 1981 2874', bankName: 'Bank Testowy', codEnabled: true, codFee: 25 },
  orders: { prefix: 'RYD', notificationEmail: 'zamowienia@ryd.test' },
} as Setting

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 7,
    orderNumber: 'RYD-1007',
    status: 'new',
    paymentStatus: 'pending',
    items: [
      { id: 'a', title: 'Sofa rozkładana Lund', variantName: 'Granatowy', sku: 'LUND-GR', unitPrice: 3690, quantity: 2, lineTotal: 7380, product: 2, image: null },
      { id: 'b', title: 'Sofa rozkładana Visby', variantName: 'Granatowy', sku: null, unitPrice: 3290, quantity: 1, lineTotal: 3290, product: 3, image: null },
    ],
    subtotal: 10670,
    shippingCost: 199,
    paymentFee: 0,
    total: 10869,
    paymentMethod: 'transfer',
    shippingMethodName: 'Dostawa kurierska',
    customerNote: null,
    firstName: 'Anna',
    lastName: 'Kowalska',
    email: 'anna@example.com',
    phone: '+48600100200',
    shippingAddress: { street: 'ul. Długa 12/4', postalCode: '00-950', city: 'Warszawa' },
    invoice: { wanted: false },
    isTest: false,
    accessToken: 'NSSnTaDZmYAUBXHCMwuHVZYNcMxQzmKD',
    updatedAt: '2026-11-12T07:56:00.000Z',
    createdAt: '2026-11-12T07:56:00.000Z',
    ...overrides,
  } as Order
}
