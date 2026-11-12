import { describe, expect, it } from 'vitest'

import { parseCartInput } from '@/lib/cart/input'
import { orderTotal, paymentOptions, shippingCostFor } from '@/lib/cart/totals'
import { CART_LIMITS } from '@/lib/constants'
import type { Setting } from '@/payload-types'

describe('koszyk przysłany przez przeglądarkę', () => {
  it('przyjmuje poprawne pozycje', () => {
    expect(parseCartInput([{ productId: 2, variantId: 'abc', quantity: 2 }])).toEqual([{ productId: 2, variantId: 'abc', quantity: 2 }])
  })

  it('łączy powtórzone pozycje i pilnuje limitu sztuk', () => {
    const merged = parseCartInput([
      { productId: 2, variantId: 'abc', quantity: 6 },
      { productId: 2, variantId: 'abc', quantity: 7 },
      { productId: 2, variantId: 'inny', quantity: 1 },
    ])
    expect(merged).toHaveLength(2)
    expect(merged[0]?.quantity).toBe(CART_LIMITS.maxQuantityPerLine)
  })

  it('odrzuca wszystko, co nie wygląda jak koszyk', () => {
    expect(parseCartInput(null)).toEqual([])
    expect(parseCartInput('koszyk')).toEqual([])
    expect(parseCartInput([{ productId: '2', variantId: 'abc', quantity: 1 }])).toEqual([])
    expect(parseCartInput([{ productId: 2, variantId: 'abc', quantity: 0 }])).toEqual([])
    expect(parseCartInput([{ productId: 2, variantId: 'abc', quantity: 1.5 }])).toEqual([])
    expect(parseCartInput([{ productId: -1, variantId: 'abc', quantity: 1 }])).toEqual([])
    // Cena przysłana przez przeglądarkę jest po prostu pomijana — serwer i tak bierze ją z bazy.
    expect(parseCartInput([{ productId: 2, variantId: 'abc', quantity: 1, unitPrice: 1 }])).toEqual([{ productId: 2, variantId: 'abc', quantity: 1 }])
  })

  it('odrzuca koszyk z nadmierną liczbą pozycji', () => {
    const tooMany = Array.from({ length: CART_LIMITS.maxLines + 1 }, (_, index) => ({ productId: index + 1, variantId: 'a', quantity: 1 }))
    expect(parseCartInput(tooMany)).toEqual([])
  })
})

describe('koszt dostawy i suma zamówienia', () => {
  it('uwzględnia próg darmowej dostawy', () => {
    expect(shippingCostFor({ price: 199, freeFrom: 5000 }, 4999.99)).toBe(199)
    expect(shippingCostFor({ price: 199, freeFrom: 5000 }, 5000)).toBe(0)
    expect(shippingCostFor({ price: 199, freeFrom: null }, 99999)).toBe(199)
    expect(shippingCostFor({ price: 199, freeFrom: 0 }, 99999)).toBe(199)
    expect(shippingCostFor({ price: 0 }, 100)).toBe(0)
  })

  it('sumuje produkty, dostawę i dopłatę bez błędów zaokrągleń', () => {
    expect(orderTotal({ subtotal: 3690, shippingCost: 199, paymentFee: 25 })).toBe(3914)
    expect(orderTotal({ subtotal: 0.1, shippingCost: 0.2, paymentFee: 0 })).toBe(0.3)
  })
})

const settings = (payments: Setting['payments']): Setting => ({ id: 1, payments }) as Setting

describe('formy płatności', () => {
  it('pokazuje płatność online tylko wtedy, gdy jest włączona i podłączona', () => {
    const all = settings({ transferEnabled: true, codEnabled: true, codFee: 25, onlineEnabled: true })
    expect(paymentOptions(all, true).map((option) => option.value)).toEqual(['online', 'transfer', 'cod'])
    expect(paymentOptions(all, false).map((option) => option.value)).toEqual(['transfer', 'cod'])
  })

  it('przenosi dopłatę za pobranie z ustawień', () => {
    const options = paymentOptions(settings({ transferEnabled: false, codEnabled: true, codFee: 25, onlineEnabled: false }), false)
    expect(options).toHaveLength(1)
    expect(options[0]).toMatchObject({ value: 'cod', fee: 25 })
  })

  it('zwraca pustą listę, gdy nic nie włączono', () => {
    expect(paymentOptions(settings({ transferEnabled: false, codEnabled: false, onlineEnabled: false }), true)).toEqual([])
    expect(paymentOptions({ id: 1 } as Setting, true)).toEqual([])
  })
})
