import { describe, expect, it } from 'vitest'

import { discountPercent, effectivePrice, formatPLN, isOnSale, isValidAmount, lineTotal, sum } from '@/lib/money'

describe('formatPLN', () => {
  it('pokazuje pełne złote bez groszy, z twardą spacją między tysiącami', () => {
    expect(formatPLN(3990)).toBe('3 990 zł')
    expect(formatPLN(0)).toBe('0 zł')
    expect(formatPLN(1234567)).toBe('1 234 567 zł')
  })

  it('pokazuje grosze tylko wtedy, gdy są', () => {
    expect(formatPLN(3990.5)).toBe('3 990,50 zł')
    expect(formatPLN(0.05)).toBe('0,05 zł')
  })
})

describe('rachunki na groszach', () => {
  it('nie gubi groszy przy mnożeniu i sumowaniu', () => {
    expect(lineTotal(0.1, 3)).toBe(0.3)
    expect(lineTotal(1299.99, 3)).toBe(3899.97)
    expect(sum([0.1, 0.2])).toBe(0.3)
    expect(sum([3690, 199, 25])).toBe(3914)
  })
})

describe('promocje', () => {
  it('cena promocyjna obowiązuje tylko wtedy, gdy jest niższa od regularnej', () => {
    expect(effectivePrice({ price: 4000, salePrice: 3500 })).toBe(3500)
    expect(effectivePrice({ price: 4000, salePrice: 4500 })).toBe(4000)
    expect(effectivePrice({ price: 4000, salePrice: 0 })).toBe(4000)
    expect(effectivePrice({ price: 4000, salePrice: null })).toBe(4000)
    expect(isOnSale({ price: 4000, salePrice: 3500 })).toBe(true)
    expect(isOnSale({ price: 4000 })).toBe(false)
  })

  it('liczy procent obniżki', () => {
    expect(discountPercent(4000, 3400)).toBe(15)
    expect(discountPercent(4000, 4000)).toBe(0)
    expect(discountPercent(0, 10)).toBe(0)
  })
})

describe('isValidAmount', () => {
  it('przyjmuje kwoty nieujemne z najwyżej dwoma miejscami po przecinku', () => {
    expect(isValidAmount(0)).toBe(true)
    expect(isValidAmount(199.99)).toBe(true)
    expect(isValidAmount(-1)).toBe(false)
    expect(isValidAmount(1.999)).toBe(false)
    expect(isValidAmount(Number.NaN)).toBe(false)
    expect(isValidAmount('100')).toBe(false)
  })
})
