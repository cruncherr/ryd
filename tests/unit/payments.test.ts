import { describe, expect, it } from 'vitest'

import { toGrosze } from '@/lib/money'
import { paymentLineItems } from '@/lib/payments/stripe'

import { makeOrder } from './fixtures'

const total = (items: ReturnType<typeof paymentLineItems>) => items.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0)

describe('pozycje na stronie płatności online', () => {
  it('sumują się dokładnie do kwoty zamówienia', () => {
    const order = makeOrder()
    const items = paymentLineItems(order)
    expect(total(items)).toBe(toGrosze(order.total))
    expect(items.map((item) => item.price_data.product_data.name)).toEqual([
      'Sofa rozkładana Lund — Granatowy',
      'Sofa rozkładana Visby — Granatowy',
      'Dostawa kurierska',
    ])
    expect(items.every((item) => item.price_data.currency === 'pln')).toBe(true)
  })

  it('pomijają bezpłatną dostawę', () => {
    const order = makeOrder({ shippingCost: 0, total: 10670 })
    expect(paymentLineItems(order)).toHaveLength(2)
  })

  it('przy niezgodności rozbicia pobierają jedną kwotę łączną — nigdy inną niż w zamówieniu', () => {
    const order = makeOrder({ total: 9999.99 })
    const items = paymentLineItems(order)
    expect(items).toHaveLength(1)
    expect(items[0]?.price_data.product_data.name).toBe('Zamówienie RYD-1007')
    expect(total(items)).toBe(999999)
  })

  it('radzą sobie z groszami', () => {
    const order = makeOrder({
      items: [{ id: 'a', title: 'Poduszka', unitPrice: 19.99, quantity: 3, lineTotal: 59.97 }],
      subtotal: 59.97,
      shippingCost: 14.5,
      total: 74.47,
    })
    expect(total(paymentLineItems(order))).toBe(7447)
  })
})
