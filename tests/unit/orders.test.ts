import { describe, expect, it } from 'vitest'

import { formatOrderNumber, sanitizeOrderPrefix } from '@/lib/orders/format'
import { isOrderToken } from '@/lib/orders/find'
import { canPayOnline, formatOrderDateTime, invoiceLines, shippingLabel, transferDetails } from '@/lib/orders/view'
import type { Order, Setting } from '@/payload-types'

describe('numer zamówienia', () => {
  it('łączy początek z ustawień z kolejną liczbą', () => {
    expect(formatOrderNumber('RYD', 1001)).toBe('RYD-1001')
    expect(formatOrderNumber(' ryd ', 1002)).toBe('RYD-1002')
    expect(formatOrderNumber('', 1003)).toBe('1003')
    expect(formatOrderNumber(null, 1004)).toBe('1004')
  })

  it('czyści początek ze znaków, które nie powinny trafić do numeru', () => {
    expect(sanitizeOrderPrefix('R&D / 2026')).toBe('RD2026')
    expect(sanitizeOrderPrefix('bardzo-długi-początek')).toHaveLength(8)
    expect(sanitizeOrderPrefix('<script>')).toBe('SCRIPT')
  })
})

describe('klucz dostępu do strony zamówienia', () => {
  it('przyjmuje tylko długie, losowo wyglądające klucze', () => {
    expect(isOrderToken('NSSnTaDZmYAUBXHCMwuHVZYNcMxQzmKD')).toBe(true)
    expect(isOrderToken('krotki')).toBe(false)
    expect(isOrderToken("x' OR 1=1 --aaaaaaaaaaaaaaaaaaaaaaaa")).toBe(false)
    expect(isOrderToken(undefined)).toBe(false)
    expect(isOrderToken(12345678901234567890)).toBe(false)
  })
})

describe('opis zamówienia', () => {
  it('nie powtarza słowa „Dostawa” w nazwie metody', () => {
    expect(shippingLabel('Dostawa kurierska')).toBe('Dostawa kurierska')
    expect(shippingLabel('Kurier DPD')).toBe('Dostawa: Kurier DPD')
    expect(shippingLabel(null)).toBe('Dostawa')
  })

  it('podaje datę i godzinę w czasie polskim', () => {
    expect(formatOrderDateTime('2026-11-12T07:56:00.000Z')).toBe('12 listopada 2026, 08:56')
    expect(formatOrderDateTime('2026-07-01T22:30:00.000Z')).toBe('2 lipca 2026, 00:30')
  })

  it('pozwala zapłacić online tylko za nieopłacone, nieanulowane zamówienia z tą formą płatności', () => {
    expect(canPayOnline({ paymentMethod: 'online', paymentStatus: 'pending', status: 'new' })).toBe(true)
    expect(canPayOnline({ paymentMethod: 'online', paymentStatus: 'failed', status: 'new' })).toBe(true)
    expect(canPayOnline({ paymentMethod: 'online', paymentStatus: 'paid', status: 'new' })).toBe(false)
    expect(canPayOnline({ paymentMethod: 'online', paymentStatus: 'pending', status: 'cancelled' })).toBe(false)
    expect(canPayOnline({ paymentMethod: 'transfer', paymentStatus: 'pending', status: 'new' })).toBe(false)
  })

  it('buduje dane do przelewu z ustawień sklepu', () => {
    const settings = {
      id: 1,
      storeName: 'RYD',
      company: { legalName: 'RYD Meble sp. z o.o.' },
      payments: { bankAccount: ' PL61 1090 1014 0000 0712 1981 2874 ', bankName: 'Bank' },
    } as Setting
    expect(transferDetails({ orderNumber: 'RYD-1001', total: 3889 }, settings)).toEqual({
      recipient: 'RYD Meble sp. z o.o.',
      account: 'PL61 1090 1014 0000 0712 1981 2874',
      bank: 'Bank',
      title: 'Zamówienie RYD-1001',
      amount: 3889,
    })
    expect(transferDetails({ orderNumber: 'RYD-1001', total: 3889 }, { id: 1 } as Setting)).toBeNull()
  })

  it('pokazuje dane do faktury tylko na życzenie klienta', () => {
    const base = { shippingAddress: { street: 'ul. Długa 12/4', postalCode: '00-950', city: 'Warszawa' } }
    expect(invoiceLines({ ...base, invoice: { wanted: false } } as Order)).toEqual([])
    expect(invoiceLines({ ...base, invoice: { wanted: true, companyName: 'Firma', nip: '5252344078' } } as Order)).toEqual([
      'Firma',
      'NIP 5252344078',
      'ul. Długa 12/4, 00-950 Warszawa',
    ])
  })
})
