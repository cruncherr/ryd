import { describe, expect, it } from 'vitest'

import {
  contactMessageEmail,
  orderConfirmationEmail,
  ownerNotificationEmail,
  paymentReceivedEmail,
  safeTrackingUrl,
  shippedEmail,
} from '@/lib/email/templates'

import { makeOrder, settings } from './fixtures'

const context = { settings, siteUrl: 'https://sklep.pl' }
const NBSP = ' '

describe('potwierdzenie zamówienia', () => {
  it('zawiera numer, sumę, dane do przelewu i odnośnik do zamówienia', () => {
    const mail = orderConfirmationEmail(makeOrder(), context)
    expect(mail.subject).toBe('Potwierdzenie zamówienia RYD-1007 — RYD')
    for (const body of [mail.html, mail.text]) {
      expect(body).toContain('RYD-1007')
      expect(body).toContain(`10${NBSP}869${NBSP}zł`)
      expect(body).toContain('PL61 1090 1014 0000 0712 1981 2874')
      expect(body).toContain('Zamówienie RYD-1007')
      expect(body).toContain('https://sklep.pl/zamowienie/potwierdzenie/NSSnTaDZmYAUBXHCMwuHVZYNcMxQzmKD')
      expect(body).toContain('Sofa rozkładana Lund')
      expect(body).toContain('ul. Długa 12/4')
    }
    expect(mail.text).toContain(`2 × 3${NBSP}690${NBSP}zł`)
  })

  it('dopasowuje instrukcję płatności do wybranej formy', () => {
    const cod = orderConfirmationEmail(makeOrder({ paymentMethod: 'cod', paymentStatus: 'on_delivery', paymentFee: 25, total: 10894 }), context)
    expect(cod.text).toContain('PŁATNOŚĆ PRZY ODBIORZE')
    expect(cod.text).toContain(`Płatność przy odbiorze: 25${NBSP}zł`)
    expect(cod.text).not.toContain('PL61 1090')

    const online = orderConfirmationEmail(makeOrder({ paymentMethod: 'online' }), context)
    expect(online.html).toContain('Zapłać online')
    expect(online.text).not.toContain('PL61 1090')

    const paid = orderConfirmationEmail(makeOrder({ paymentMethod: 'online', paymentStatus: 'paid' }), context)
    expect(paid.html).not.toContain('Zapłać online')
  })

  it('nie obiecuje danych do przelewu, których sklep nie podał', () => {
    const mail = orderConfirmationEmail(makeOrder(), { ...context, settings: { ...settings, payments: { transferEnabled: true } } })
    expect(mail.text).toContain('Dane do przelewu prześlemy w osobnej wiadomości.')
  })

  it('oznacza zamówienia testowe', () => {
    const mail = orderConfirmationEmail(makeOrder({ isTest: true }), context)
    expect(mail.subject.startsWith('[TEST] ')).toBe(true)
    expect(mail.html).toContain('To jest zamówienie testowe.')
  })

  it('unieszkodliwia kod wpisany przez klienta w uwagach i danych', () => {
    const mail = orderConfirmationEmail(
      makeOrder({ customerNote: '<script>alert(1)</script>\n<img src=x onerror=alert(2)>', firstName: '<b>Anna</b>', lastName: '"O\'Neil"' }),
      context,
    )
    expect(mail.html).not.toContain('<script>alert(1)</script>')
    expect(mail.html).not.toContain('<img src=x')
    expect(mail.html).not.toContain('<b>Anna</b>')
    expect(mail.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;<br>&lt;img src=x onerror=alert(2)&gt;')
    expect(mail.html).toContain('&lt;b&gt;Anna&lt;/b&gt; &quot;O&#39;Neil&quot;')
  })

  it('wymienia załączone dokumenty', () => {
    const mail = orderConfirmationEmail(makeOrder(), context, [{ title: 'Regulamin sklepu', slug: 'regulamin' }])
    expect(mail.text).toContain('W załączniku znajdziesz: Regulamin sklepu')
  })
})

describe('powiadomienie dla sprzedawcy', () => {
  it('podaje dane klienta i odnośnik do panelu', () => {
    const mail = ownerNotificationEmail(makeOrder({ customerNote: 'Trzecie piętro' }), context)
    expect(mail.subject).toBe(`Nowe zamówienie RYD-1007 — 10${NBSP}869${NBSP}zł`)
    expect(mail.html).toContain('https://sklep.pl/admin/collections/orders/7')
    expect(mail.text).toContain('anna@example.com')
    expect(mail.text).toContain('+48 600 100 200')
    expect(mail.text).toContain('Trzecie piętro')
  })
})

describe('płatność i wysyłka', () => {
  it('potwierdza zaksięgowanie płatności', () => {
    const mail = paymentReceivedEmail(makeOrder({ paymentStatus: 'paid' }), context)
    expect(mail.subject).toBe('Płatność za zamówienie RYD-1007 zaksięgowana')
    expect(mail.text).toContain(`10${NBSP}869${NBSP}zł`)
  })

  it('podaje numer przesyłki i bezpieczny odnośnik do śledzenia', () => {
    const mail = shippedEmail(makeOrder({ status: 'shipped', trackingNumber: ' 000123 ', trackingUrl: 'https://kurier.pl/sledz?nr=000123' }), context)
    expect(mail.subject).toBe('Zamówienie RYD-1007 jest w drodze')
    expect(mail.text).toContain('Numer przesyłki: 000123')
    expect(mail.html).toContain('https://kurier.pl/sledz?nr=000123')
  })

  it('nie wstawia do wiadomości odnośników innych niż adresy stron', () => {
    expect(safeTrackingUrl('javascript:alert(1)')).toBeNull()
    expect(safeTrackingUrl('data:text/html,x')).toBeNull()
    expect(safeTrackingUrl('nie-adres')).toBeNull()
    expect(safeTrackingUrl('')).toBeNull()
    expect(safeTrackingUrl(' https://kurier.pl/x ')).toBe('https://kurier.pl/x')
    const mail = shippedEmail(makeOrder({ status: 'shipped', trackingUrl: 'javascript:alert(1)' }), context)
    expect(mail.html).not.toContain('javascript:')
    expect(mail.html).not.toContain('Śledź przesyłkę')
  })
})

describe('wiadomość z formularza kontaktowego', () => {
  it('przekazuje treść i dane nadawcy, unieszkodliwiając kod', () => {
    const mail = contactMessageEmail(
      { id: 3, name: 'Jan <i>Nowak</i>', email: 'jan@example.com', phone: '+48501502503', message: 'Dzień dobry,\n<script>x</script>', source: 'Pytanie o produkt: Sofa Lund' },
      context,
    )
    expect(mail.subject).toBe('Wiadomość ze sklepu od: Jan <i>Nowak</i>')
    expect(mail.html).toContain('Jan &lt;i&gt;Nowak&lt;/i&gt;')
    expect(mail.html).toContain('Dzień dobry,<br>&lt;script&gt;x&lt;/script&gt;')
    expect(mail.html).toContain('https://sklep.pl/admin/collections/messages/3')
    expect(mail.text).toContain('Dotyczy: Pytanie o produkt: Sofa Lund')
  })
})
