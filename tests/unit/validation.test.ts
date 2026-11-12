import { describe, expect, it } from 'vitest'

import {
  formatPhone,
  formatPostalCodeInput,
  isValidEmail,
  normalizeNip,
  normalizePhone,
  normalizePostalCode,
  validateCheckout,
  validateContact,
} from '@/lib/validation'

describe('telefon', () => {
  it('sprowadza polskie numery do jednego zapisu', () => {
    for (const input of ['600 100 200', '600-100-200', '+48 600 100 200', '0048600100200', '48600100200', '(600) 100.200']) {
      expect(normalizePhone(input)).toBe('+48600100200')
    }
  })

  it('nie myli numeru zaczynającego się od 48 z numerem kierunkowym', () => {
    expect(normalizePhone('481 234 567')).toBe('+48481234567')
  })

  it('przyjmuje numery zagraniczne i odrzuca błędne', () => {
    expect(normalizePhone('+49 30 1234567')).toBe('+49301234567')
    expect(normalizePhone('00420 777 123 456')).toBe('+420777123456')
    expect(normalizePhone('12345')).toBe('')
    expect(normalizePhone('600 100 20')).toBe('')
    expect(normalizePhone('abc')).toBe('')
    expect(normalizePhone('+48 600 100 2000')).toBe('')
  })

  it('formatuje numer do czytania', () => {
    expect(formatPhone('+48600100200')).toBe('+48 600 100 200')
    expect(formatPhone('+49301234567')).toBe('+49301234567')
    expect(formatPhone(null)).toBe('')
  })
})

describe('kod pocztowy', () => {
  it('normalizuje i sprawdza format', () => {
    expect(normalizePostalCode('00950')).toBe('00-950')
    expect(normalizePostalCode('00 950')).toBe('00-950')
    expect(normalizePostalCode('00-950')).toBe('00-950')
    expect(normalizePostalCode('0095')).toBe('')
    expect(normalizePostalCode('ab-cde')).toBe('')
  })

  it('wstawia myślnik w trakcie pisania', () => {
    expect(formatPostalCodeInput('0')).toBe('0')
    expect(formatPostalCodeInput('00')).toBe('00')
    expect(formatPostalCodeInput('009')).toBe('00-9')
    expect(formatPostalCodeInput('00950123')).toBe('00-950')
    expect(formatPostalCodeInput('00-95')).toBe('00-95')
  })
})

describe('NIP', () => {
  it('przyjmuje numery z poprawną sumą kontrolną w różnych zapisach', () => {
    expect(normalizeNip('525-234-40-78')).toBe('5252344078')
    expect(normalizeNip('PL 5252344078')).toBe('5252344078')
    expect(normalizeNip('525 234 40 78')).toBe('5252344078')
  })

  it('odrzuca numery z błędną sumą kontrolną i niepełne', () => {
    expect(normalizeNip('521-301-28-41')).toBe('')
    expect(normalizeNip('1234567890')).toBe('')
    expect(normalizeNip('0000000000')).toBe('')
    expect(normalizeNip('525234407')).toBe('')
  })
})

describe('e-mail', () => {
  it('rozpoznaje poprawne i błędne adresy', () => {
    expect(isValidEmail('anna.kowalska@example.com')).toBe(true)
    expect(isValidEmail('a+b@poczta.onet.pl')).toBe(true)
    expect(isValidEmail('anna@example')).toBe(false)
    expect(isValidEmail('anna@@example.com')).toBe(false)
    expect(isValidEmail('anna kowalska@example.com')).toBe(false)
    expect(isValidEmail('.anna@example.com')).toBe(false)
    expect(isValidEmail('anna@.example.com')).toBe(false)
  })
})

const validForm = {
  email: ' Anna.Kowalska@Example.com ',
  phone: '600 100 200',
  firstName: 'Anna',
  lastName: 'Kowalska',
  street: 'ul. Długa 12/4',
  postalCode: '00950',
  city: 'Warszawa',
  shippingMethodId: '1',
  paymentMethod: 'transfer',
  wantsInvoice: false,
  companyName: '',
  nip: '',
  invoiceAddress: '',
  note: '',
  acceptTerms: true,
}

describe('formularz zamówienia', () => {
  it('przepuszcza poprawne dane i porządkuje ich zapis', () => {
    const { values, errors } = validateCheckout(validForm)
    expect(errors).toEqual({})
    expect(values.email).toBe('anna.kowalska@example.com')
    expect(values.phone).toBe('+48600100200')
    expect(values.postalCode).toBe('00-950')
    expect(values.shippingMethodId).toBe(1)
    expect(values.paymentMethod).toBe('transfer')
  })

  it('wskazuje każde brakujące pole', () => {
    const { errors } = validateCheckout({})
    expect(Object.keys(errors).sort()).toEqual(
      ['acceptTerms', 'city', 'email', 'firstName', 'lastName', 'paymentMethod', 'phone', 'postalCode', 'shippingMethodId', 'street'].sort(),
    )
  })

  it('wymaga numeru domu w adresie', () => {
    expect(validateCheckout({ ...validForm, street: 'Długa' }).errors.street).toMatch(/numer domu/)
  })

  it('wymaga danych firmy tylko przy fakturze', () => {
    expect(validateCheckout({ ...validForm, wantsInvoice: true }).errors).toMatchObject({
      companyName: expect.any(String),
      nip: expect.any(String),
    })
    const ok = validateCheckout({ ...validForm, wantsInvoice: true, companyName: 'Pracownia sp. z o.o.', nip: '525-234-40-78' })
    expect(ok.errors).toEqual({})
    expect(ok.values.nip).toBe('5252344078')
  })

  it('nie przyjmuje nieznanej formy płatności ani dostawy', () => {
    const { errors } = validateCheckout({ ...validForm, paymentMethod: 'bitcoin', shippingMethodId: 'abc' })
    expect(errors.paymentMethod).toBeDefined()
    expect(errors.shippingMethodId).toBeDefined()
  })

  it('wymaga akceptacji regulaminu', () => {
    expect(validateCheckout({ ...validForm, acceptTerms: false }).errors.acceptTerms).toBeDefined()
  })

  it('nie wywraca się na danych innego typu niż oczekiwany', () => {
    expect(() => validateCheckout(null)).not.toThrow()
    expect(() => validateCheckout('tekst')).not.toThrow()
    expect(() => validateCheckout({ email: 42, phone: {}, note: [] })).not.toThrow()
  })
})

describe('formularz kontaktowy', () => {
  it('wymaga imienia, adresu e-mail i treści; telefon jest dobrowolny', () => {
    expect(Object.keys(validateContact({}).errors).sort()).toEqual(['email', 'message', 'name'])
    const ok = validateContact({ name: 'Jan', email: 'jan@example.com', phone: '', message: 'Proszę o kontakt w sprawie sofy.' })
    expect(ok.errors).toEqual({})
  })

  it('sprawdza telefon tylko wtedy, gdy został podany', () => {
    const { errors } = validateContact({ name: 'Jan', email: 'jan@example.com', phone: '123', message: 'Proszę o kontakt w sprawie sofy.' })
    expect(errors.phone).toBeDefined()
  })
})
