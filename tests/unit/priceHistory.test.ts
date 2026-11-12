import { describe, expect, it } from 'vitest'

import { appendPriceHistory, lowestPriceBeforeCurrent } from '@/lib/priceHistory'

const day = (n: number) => new Date(Date.UTC(2026, 0, n)).toISOString()

describe('historia cen (najniższa cena z 30 dni przed obniżką)', () => {
  it('nie dopisuje wpisu, gdy cena się nie zmieniła', () => {
    const history = appendPriceHistory([], 4000, new Date(day(1)))
    expect(appendPriceHistory(history, 4000, new Date(day(5)))).toHaveLength(1)
    expect(appendPriceHistory(history, 3500, new Date(day(5)))).toHaveLength(2)
  })

  it('zwraca null dla produktu bez wcześniejszej ceny', () => {
    expect(lowestPriceBeforeCurrent([])).toBeNull()
    expect(lowestPriceBeforeCurrent([{ date: day(1), price: 4000 }])).toBeNull()
  })

  it('bierze najniższą cenę z 30 dni przed ostatnią zmianą', () => {
    const history = [
      { date: day(1), price: 4200 },
      { date: day(10), price: 3900 },
      { date: day(20), price: 4100 },
      { date: day(25), price: 3600 }, // obecna obniżka
    ]
    expect(lowestPriceBeforeCurrent(history)).toBe(3900)
  })

  it('uwzględnia cenę obowiązującą w chwili rozpoczęcia 30-dniowego okna', () => {
    const history = [
      { date: new Date(Date.UTC(2025, 9, 1)).toISOString(), price: 3000 }, // dawno temu, ale wciąż obowiązywała
      { date: day(28), price: 2800 },
    ]
    expect(lowestPriceBeforeCurrent(history)).toBe(3000)
  })

  it('pomija ceny starsze niż 30 dni, które zostały zastąpione przed oknem', () => {
    const history = [
      { date: new Date(Date.UTC(2025, 5, 1)).toISOString(), price: 1000 }, // stara, zastąpiona
      { date: new Date(Date.UTC(2025, 6, 1)).toISOString(), price: 4000 },
      { date: day(28), price: 3500 },
    ]
    expect(lowestPriceBeforeCurrent(history)).toBe(4000)
  })
})
