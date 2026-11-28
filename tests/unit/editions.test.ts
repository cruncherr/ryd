import { describe, expect, it } from 'vitest'

import {
  assignNumbers,
  editionInfo,
  editionLineText,
  editionState,
  freeNumbers,
  inviteMatches,
  padNumber,
  pieceLabel,
} from '@/lib/editions'
import { parseCartInput } from '@/lib/cart/input'
import { configKey } from '@/lib/configurator'

describe('edycje numerowane', () => {
  it('odczytuje dane edycji i odrzuca nieprawidłowy nakład', () => {
    expect(editionInfo({ size: 50, code: ' 01 ', status: 'invite' })).toMatchObject({ size: 50, code: '01', status: 'invite', numberChoice: true })
    expect(editionInfo({ size: 0 }).size).toBeNull()
    expect(editionInfo({ size: 12.5 }).size).toBeNull()
    expect(editionInfo({ size: 5000 }).size).toBeNull()
    expect(editionInfo({ size: 50, status: 'cokolwiek' }).status).toBe('open')
    expect(editionInfo(null)).toMatchObject({ size: null, numberChoice: false })
  })

  it('liczy stan nakładu z zajętych numerów', () => {
    const state = editionState(editionInfo({ size: 5, status: 'open' }), [3, 1, 3, 9])
    expect(state.taken).toEqual([1, 3])
    expect(state.allocated).toBe(2)
    expect(state.remaining).toBe(3)
    expect(state.soldOut).toBe(false)
    expect(state.purchasable).toBe(true)

    const full = editionState(editionInfo({ size: 2 }), [1, 2])
    expect(full.soldOut).toBe(true)
    expect(full.purchasable).toBe(false)

    expect(editionState(editionInfo({ size: 10, status: 'announced' }), []).purchasable).toBe(false)
  })

  it('formatuje numery egzemplarzy', () => {
    expect(padNumber(7, 50)).toBe('07')
    expect(padNumber(7, 120)).toBe('007')
    expect(pieceLabel(7, 50)).toBe('Nº\u00a007 / 50')
    expect(editionLineText(50, 7)).toBe('Egzemplarz Nº\u00a007 / 50')
    expect(editionLineText(null, 7)).toBe('')
  })

  it('przydziela wybrane numery, a resztę od najniższego wolnego', () => {
    expect(freeNumbers(5, [2, 4])).toEqual([1, 3, 5])
    expect(assignNumbers(10, [1, 2], [{ quantity: 2 }, { quantity: 1, number: 3 }])).toEqual([[4, 5], [3]])
    expect(assignNumbers(10, [], [{ quantity: 1, number: 1 }, { quantity: 1 }])).toEqual([[1], [2]])
  })

  it('odmawia przydziału zajętego numeru, numeru spoza nakładu i nadmiaru egzemplarzy', () => {
    expect(assignNumbers(10, [3], [{ quantity: 1, number: 3 }])).toBeNull()
    expect(assignNumbers(10, [], [{ quantity: 1, number: 11 }])).toBeNull()
    expect(assignNumbers(3, [1, 2], [{ quantity: 2 }])).toBeNull()
    expect(assignNumbers(10, [], [{ quantity: 1, number: 4 }, { quantity: 1, number: 4 }])).toBeNull()
    // Wybrany numer to zawsze jeden egzemplarz.
    expect(assignNumbers(10, [], [{ quantity: 2, number: 4 }])).toBeNull()
  })

  it('porównuje kody zaproszeń bez względu na wielkość liter i spacje', () => {
    expect(inviteMatches('VISBY-PRIVE', ' visby-prive ')).toBe(true)
    expect(inviteMatches('VISBY PRIVE', 'visbyprive')).toBe(true)
    expect(inviteMatches('VISBY-PRIVE', 'VISBY')).toBe(false)
    expect(inviteMatches(null, 'VISBY')).toBe(false)
    expect(inviteMatches('VISBY-PRIVE', '')).toBe(false)
  })
})

describe('koszyk z numerem egzemplarza', () => {
  it('rozróżnia pozycje po numerze, ale nie po kodzie zaproszenia', () => {
    expect(configKey({ size: 'a', number: 7 })).toBe('s=a|n=7')
    expect(configKey({ size: 'a', invite: 'KOD' })).toBe('s=a')
  })

  it('pozycja z wybranym numerem ma zawsze ilość 1', () => {
    const cart = parseCartInput([
      { productId: 1, variantId: 'v', quantity: 1, config: { number: 7 } },
      { productId: 1, variantId: 'v', quantity: 3, config: { number: 7 } },
    ])
    expect(cart).toEqual([{ productId: 1, variantId: 'v', quantity: 1, config: { number: 7 } }])
  })

  it('zachowuje kod zaproszenia przy łączeniu pozycji i odrzuca numer spoza zakresu', () => {
    const cart = parseCartInput([
      { productId: 2, variantId: 'v', quantity: 1, config: { invite: 'KOD-1' } },
      { productId: 2, variantId: 'v', quantity: 1, config: {} },
    ])
    expect(cart[0]?.quantity).toBe(2)
    expect(cart[0]?.config?.invite).toBe('KOD-1')
    expect(parseCartInput([{ productId: 2, variantId: 'v', quantity: 1, config: { number: 0 } }])).toEqual([])
  })
})
